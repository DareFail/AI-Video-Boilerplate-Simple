from flask import render_template
import os

from . import surfinterneteyes

@surfinterneteyes.route('/')
def index():
    return render_template(
        'surfinterneteyes/index.html', 
        ROBOFLOW_API_KEY=os.environ.get("ROBOFLOW_API_KEY"),
        ANALYTICS_ID=os.environ.get("ANALYTICS_ID")
    )