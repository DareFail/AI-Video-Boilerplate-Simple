from flask import Blueprint
face = Blueprint('face', __name__, template_folder='templates', static_folder='static')
from . import views