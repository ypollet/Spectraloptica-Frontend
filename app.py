from flask import (
    Flask,
    render_template,
    jsonify,
    request,
    send_from_directory,
    send_file,
    abort,
)

from flask_cors import CORS, cross_origin

from base64 import encodebytes
import glob
import io
import os
from PIL import Image
import json
import numpy as np


cwd = os.getcwd()

# configuration
DEBUG = True
DATA_FOLDER = f"{cwd}/data"

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
            "size": {"height": spectral_data["height"], "width": spectral_data},
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


if __name__ == "__main__":
    app.run()
