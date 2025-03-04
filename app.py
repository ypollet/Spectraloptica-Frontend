from flask import Flask, render_template, jsonify, request, send_from_directory, send_file, abort

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
app = Flask(__name__, static_folder="dist/static", template_folder="dist", static_url_path="/static")
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'
app.config.from_object(__name__)

# definitions
SITE = {
        'logo': 'Sphaeroptica',
        'version': '1.0.0'
}

OWNER = {
        'name': 'Royal Belgian Institute of Natural Sciences',
}

# pass data to the frontend
site_data = {
    'site': SITE,
    'owner': OWNER
}

# landing page
@app.route('/<id>')
def welcome(id):
  print(f"id : {id}")
  return render_template('index.html', **site_data)

# send full image
@app.route('/<id>/<image_id>/full-image')
@cross_origin()
def image(id,image_id):
  return send_from_directory(f"{DATA_FOLDER}/{id}", image_id)

# send thumbnail
@app.route('/<id>/<image_id>/thumbnail')
@cross_origin()
def thumbnail(id,image_id):
  return send_from_directory(f"{DATA_FOLDER}/{id}/thumbnails", image_id)

# send StackData
@app.route('/<id>/images')
@cross_origin()
def images(id):
  directory = f"{DATA_FOLDER}/{id}"
  if not os.path.exists(directory):
    abort(404)
  with open(f"{directory}/spectral.json", "r") as f:
    spectral_file = json.load(f)
  to_jsonify = {}
  encoded_images = []
  individual_images = dict()
  for image in spectral_file["spectral"]:
    try:
      encoded_images.append(image)
    except Exception as error:
       print(error)
       continue
  for image in spectral_file["individualImages"]:
    try:
      # file name of stacked image
      individual_images[image] = spectral_file['individualImages'][image]
    except Exception as error:
       print(error)
       continue
  to_jsonify = { "spectralImages" : encoded_images,
                  "individualImages" : individual_images,
                  "size" : {
                    "height" : spectral_file["height"],
                    "width" : spectral_file["width"]
                  },
                  "thumbnails": len(spectral_file["thumbnails"]) != 0
                }
  return jsonify(to_jsonify)

@app.route('/<id>/position')
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
    "x" : x*stack_file["PixelRatio"][0],
    "y" : y*stack_file["PixelRatio"][1],
  }
  
  return jsonify(position)
  

if __name__ == '__main__':
    app.run()
