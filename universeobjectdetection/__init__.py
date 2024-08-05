from flask import Blueprint
universeobjectdetection = Blueprint('universeobjectdetection', __name__, template_folder='templates', static_folder='static')
from . import views