from flask import render_template
import os

from . import movement

@movement.route('/')
def index():
    return render_template(
        'movement/index.html', 
        ROBOFLOW_API_KEY=os.environ.get("ROBOFLOW_API_KEY"),
        ANALYTICS_ID=os.environ.get("ANALYTICS_ID")
    )