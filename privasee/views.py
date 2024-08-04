from flask import render_template
import os

from . import privasee

@privasee.route('/')
def index():
    return render_template(
        'privasee/index.html', 
        ROBOFLOW_API_KEY=os.environ.get("ROBOFLOW_API_KEY")
    )