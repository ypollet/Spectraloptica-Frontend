from flask import (
    Flask,
    render_template,
    jsonify,
    request,
    send_from_directory,
    make_response,
    abort,
)

from flask_cors import CORS, cross_origin

import os
import cv2
import json
import threading
import numpy as np
from collections import OrderedDict


cwd = os.getcwd()

# configuration
DEBUG = True
DATA_FOLDER = f"{cwd}/data"
IMAGE_CACHE_MAX_IMAGES = 6  # decoded source images kept in memory (~100 MB each at full size)
THUMBNAIL_MAX_SIZE = 1500  # longest side of computed thumbnails, like the thumbnails on disk
DENOISE_TARGET_NOISE = 1.0  # source images are blurred down to this noise level (8-bit gray levels), 0 disables
DENOISE_MIN_SIGMA = 0.5  # smaller blurs barely change 8-bit pixels, so they are skipped
GRAYSCALE_TOLERANCE = 2  # color images whose channels differ by at most this (8-bit levels) are treated as gray

# instantiate the app
app = Flask(
    __name__,
    static_folder="dist/static",
    template_folder="dist",
    static_url_path="/static",
)
cors = CORS(app)
app.config["CORS_HEADERS"] = "Content-Type"
app.config.from_object(__name__)
# override any setting from the environment, e.g. FLASK_IMAGE_CACHE_MAX_IMAGES=20
app.config.from_prefixed_env()

# definitions
SITE = {"logo": "Spectraloptica", "version": "1.0.0"}

OWNER = {
    "name": "Royal Belgian Institute of Natural Sciences",
}

# pass data to the frontend
site_data = {"site": SITE, "owner": OWNER}


# landing page
@app.route("/<id>")
def welcome(id):
    print(f"id : {id}")
    return render_template("index.html", **site_data)


# send full image
@app.route("/<id>/<image_id>/full-image")
@cross_origin()
def image(id, image_id):
    return send_from_directory(f"{DATA_FOLDER}/{id}", image_id)


# send thumbnail
@app.route("/<id>/<image_id>/thumbnail")
@cross_origin()
def thumbnail(id, image_id):
    return send_from_directory(f"{DATA_FOLDER}/{id}/thumbnails", image_id)


# send StackData
@app.route("/<id>/images")
@cross_origin()
def images(id):
    directory = f"{DATA_FOLDER}/{id}"
    if not os.path.exists(directory):
        abort(404)
    with open(f"{directory}/spectral.json", "r") as f:
        spectral_file = json.load(f)
    
    to_jsonify = dict()
    for spectral_group in spectral_file["images"]:
        print(spectral_group)
        spectral_data = spectral_file["images"][spectral_group]
        data = {}
        spectral_images = []
        individual_images = dict()
        if "spectral" in spectral_data:
            for image_data in spectral_data["spectral"]:
                try:
                    image_data["label"] = image_data["name"]
                    spectral_images.append(image_data)
                except Exception as error:
                    print(error)
                    continue
        if "individualImages" in spectral_data:
            for individual_image in spectral_data["individualImages"]:
                try:
                    # file name of stacked image
                    image_data = spectral_data["individualImages"][individual_image]
                    image_data["label"] = individual_image
                    individual_images[individual_image] = image_data
                except Exception as error:
                    print(error)
                    continue
        data = {
            "spectralImages": spectral_images,
            "individualImages": individual_images,
            "size": {"height": spectral_data["height"], "width": spectral_data["width"]},
            "thumbnails": len(spectral_file["thumbnails"]) != 0,
        }
        to_jsonify[spectral_group] = data
    
    print(to_jsonify.keys())
    return jsonify(to_jsonify)


@app.route("/<id>/position")
@cross_origin()
def compute_landmark(id):
    x = float(request.args.get("x"))
    y = float(request.args.get("y"))

    directory = f"{DATA_FOLDER}/{id}"
    if not os.path.exists(directory):
        abort(404)
    with open(f"{directory}/spectral.json", "r") as f:
        stack_file = json.load(f)

    position = {
        "x": x * stack_file["PixelRatio"][0],
        "y": y * stack_file["PixelRatio"][1],
    }

    return jsonify(position)

def safe_path(id, name):
    """Resolve an image path inside DATA_FOLDER/<id>, rejecting traversal."""
    data_root = os.path.realpath(DATA_FOLDER)
    base = os.path.realpath(os.path.join(data_root, id))
    if not name or not base.startswith(data_root + os.sep):
        abort(404)
    full = os.path.realpath(os.path.join(base, name))
    if not full.startswith(base + os.sep) or not os.path.isfile(full):
        abort(404)
    return full


class ImageCache:
    """In-memory LRU cache of decoded, noise-reduced source images, shared by the request threads."""

    def __init__(self, max_images):
        self.max_images = max_images
        self.images = OrderedDict()
        self.lock = threading.Lock()

    def get(self, path):
        # the mtime is part of the key so a replaced image on disk is reloaded
        key = (path, os.path.getmtime(path))
        with self.lock:
            if key in self.images:
                self.images.move_to_end(key)
                return self.images[key]
        image = cv2.imread(path, cv2.IMREAD_UNCHANGED)
        if image is None:
            abort(415)
        image = denoise_image(image, float(app.config["DENOISE_TARGET_NOISE"]), os.path.basename(path))
        # cached arrays are shared between requests, so they must never be modified in place
        image.setflags(write=False)
        with self.lock:
            self.images[key] = image
            self.images.move_to_end(key)
            while len(self.images) > self.max_images:
                self.images.popitem(last=False)
        return image


app.extensions["image_cache"] = ImageCache(int(app.config["IMAGE_CACHE_MAX_IMAGES"]))


def load_image(id, name):
    """Source image as stored on disk (unchanged channels and depth), noise-reduced."""
    return app.extensions["image_cache"].get(safe_path(id, name))


def to_gray8(image):
    """8-bit single channel, like cv2.IMREAD_GRAYSCALE would read it."""
    if image.ndim == 3:
        image = cv2.cvtColor(image, cv2.COLOR_BGRA2GRAY if image.shape[2] == 4 else cv2.COLOR_BGR2GRAY)
    if image.dtype == np.uint16:
        image = (image >> 8).astype(np.uint8)
    return image


def estimate_noise(channel):
    """Standard deviation of the noise of a single-channel image (Immerkaer 1996)."""
    # this kernel cancels smooth image content, leaving mostly the pixel-to-pixel noise
    kernel = np.array([[1, -2, 1], [-2, 4, -2], [1, -2, 1]], dtype=np.float32)
    response = cv2.filter2D(channel.astype(np.float32), -1, kernel)[1:-1, 1:-1]
    return float(np.sqrt(np.pi / 2) * np.abs(response).mean() / 6)


def is_grayscale(image):
    """True for single-channel images and for color images whose B, G and R channels are identical,
    up to GRAYSCALE_TOLERANCE (gray images saved as color often differ by 1 level from rounding)."""
    if image.ndim == 2:
        return True
    # tolerance is given in 8-bit levels
    tolerance = float(app.config["GRAYSCALE_TOLERANCE"]) * (257 if image.dtype == np.uint16 else 1)

    def channels_match(img):
        blue, green, red = img[:, :, 0], img[:, :, 1], img[:, :, 2]
        return cv2.absdiff(blue, green).max() <= tolerance and cv2.absdiff(blue, red).max() <= tolerance

    # cheap check on a subsample first, true color images already differ there
    return channels_match(image[::16, ::16]) and channels_match(image)


def blur_sigma(channel, target):
    """Gaussian sigma that brings the estimated noise of `channel` down to `target` (8-bit gray levels)."""
    # measured in 8-bit levels so it matches `target`, whatever the bit depth
    noise = estimate_noise(to_gray8(channel))
    # a 2D Gaussian of width s divides white-noise std by about 2 * sqrt(pi) * s
    sigma = float(noise / (2 * np.sqrt(np.pi) * target))
    return sigma if sigma >= float(app.config["DENOISE_MIN_SIGMA"]) else 0.0


def denoise_image(image, target, label=""):
    """Gaussian-blur an image just enough to bring its estimated noise down to `target`:
    one blur for grayscale images, one blur per channel for true color images."""
    if target <= 0:
        return image

    if is_grayscale(image):
        sigma = blur_sigma(image, target)
        print(f"denoise {label}: grayscale, blur sigma {sigma:.2f}" + (" (skipped)" if not sigma else ""))
        return cv2.GaussianBlur(image, (0, 0), sigma) if sigma else image

    channels = list(cv2.split(image))
    # the alpha channel is left as is, it is dropped before operations anyway
    sigmas = [blur_sigma(channel, target) for channel in channels[:3]]
    print(f"denoise {label}: true color, blur sigma per channel (B, G, R) {[round(s, 2) for s in sigmas]}")
    if not any(sigmas):
        return image
    blurred = [cv2.GaussianBlur(c, (0, 0), s) if s else c for c, s in zip(channels[:3], sigmas)]
    return cv2.merge(blurred + channels[3:])


def png_response(image):
    retval, buffer = cv2.imencode(".png", image)
    if not retval:
        abort(500)
    response = make_response(buffer.tobytes())
    response.headers.set("Content-Type", "image/png")
    return response


def make_thumbnail(image):
    """Downscale so the longest side is THUMBNAIL_MAX_SIZE, keeping the aspect ratio."""
    height, width = image.shape[:2]
    scale = int(app.config["THUMBNAIL_MAX_SIZE"]) / max(height, width)
    if scale >= 1:
        return image
    size = (max(1, round(width * scale)), max(1, round(height * scale)))
    return cv2.resize(image, size, interpolation=cv2.INTER_AREA)


def is_thumb_requested():
    return request.args.get("thumb", default="false").lower() in ("1", "true")


@app.route("/<id>/false_color")
def false_color(id):
    channels = [to_gray8(load_image(id, request.args.get(c))) for c in ("r", "g", "b")]
    if is_thumb_requested():
        # downscale the inputs rather than the result: much faster for a preview
        channels = [make_thumbnail(channel) for channel in channels]
    red, green, blue = channels
    return png_response(cv2.merge((blue, green, red)))


@app.route("/<id>/operation/<operation>")
def operation(id, operation):
    if operation not in OPERATIONS:
        abort(404)
    left = load_image(id, request.args.get("left"))
    right = load_image(id, request.args.get("right"))
    left, right = match_channels(left, right)
    if is_thumb_requested():
        # downscale the inputs rather than the result: much faster for a preview
        left, right = make_thumbnail(left), make_thumbnail(right)

    np_left = np.array(left, dtype=np.uint16)
    np_right = np.array(right, dtype=np.uint16)

    return png_response(OPERATIONS[operation](np_left, np_right))

def drop_alpha(img):
    if img.ndim == 3 and img.shape[2] == 4:
        return cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
    if img.ndim == 3 and img.shape[2] == 1:
        return img[:, :, 0]
    return img

def match_channels(left, right):
    """Make two images channel-compatible: alpha is dropped, and a grayscale
    image is expanded to BGR when the other one is in color."""
    left, right = drop_alpha(left), drop_alpha(right)
    if left.ndim == 2 and right.ndim == 3:
        left = cv2.cvtColor(left, cv2.COLOR_GRAY2BGR)
    elif left.ndim == 3 and right.ndim == 2:
        right = cv2.cvtColor(right, cv2.COLOR_GRAY2BGR)
    return left, right

def add(left, right):
    np_add = left + right
    np_add[np_add > 255] = 255
    return np_add.astype(np.uint8)

def sub(left, right):
    # signed subtraction: unsigned arithmetic would wrap around when right > left
    return np.abs(left.astype(np.int32) - right.astype(np.int32)).astype(np.uint8)

def robust_normalize(img, low=1.0, high=99.0):
    """Stretch the [low, high] percentile range to 0-255, clipping outliers."""
    # percentiles of a subsample: nearly identical values, much faster on full-size images
    lo, hi = np.percentile(img[::4, ::4], (low, high))
    if hi <= lo:  # flat image
        return np.zeros(img.shape, dtype=np.uint8)
    stretched = (img.astype(np.float32) - lo) * (255.0 / (hi - lo))
    return np.clip(stretched, 0, 255).astype(np.uint8)

def div(left, right):
    # avoid division by zero without modifying the caller's array
    np_divide = np.divide(left, np.where(right == 0, 1, right))
    return robust_normalize(np_divide)

def normalize_difference(left, right):
    return robust_normalize(div(sub(left, right), add(left, right)))


OPERATIONS = {"add": add, "sub": sub, "div": div, "nd": normalize_difference}

if __name__ == "__main__":
    app.run()
