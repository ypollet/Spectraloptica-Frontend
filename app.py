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
DATA_FOLDER = f"{cwd}/data/A09135"

# instantiate the app
app = Flask(__name__, static_folder="dist/static", template_folder="dist", static_url_path="/static")
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'
app.config.from_object(__name__)

# definitions
SITE = {
        'logo': 'Stackoptica',
        'version': '2.0.0'
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
  return send_from_directory(f"{DATA_FOLDER}/{id}", image_id)

# send StackData
@app.route('/<id>/images')
@cross_origin()
def images(id):
  directory = f"{DATA_FOLDER}/{id}"
  if not os.path.exists(directory):
    abort(404)
  with open(f"{directory}/rotation.json", "r") as f:
    rotation_file = json.load(f)
  to_jsonify = {}
  encoded_images = []
  for image in rotation_file["rotation"]:
    try:
      encoded_images.append({ 
        "name" : image,
        "angle" : round(rotation_file["rotation"][image]["angle"],2)
      })
    except Exception as error:
       print(error)
       continue
  to_jsonify = { "rotationImages" : encoded_images,
                  "size" : {
                    "height" : rotation_file["height"],
                    "width" : rotation_file["width"]
                  },
                  "thumbnails": len(rotation_file["thumbnails"]) != 0
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
  with open(f"{directory}/rotation.json", "r") as f:
    stack_file = json.load(f)
    
  
  position = {
    "x" : x*stack_file["PixelRatio"][0],
    "y" : y*stack_file["PixelRatio"][1],
  }
  
  return jsonify(position)
  

if __name__ == '__main__':
    app.run()
