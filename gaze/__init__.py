from flask import Blueprint
gaze = Blueprint('gaze', __name__, template_folder='templates', static_folder='static')
from . import views