from flask import Blueprint
speed = Blueprint('speed', __name__, template_folder='templates', static_folder='static')
from . import views