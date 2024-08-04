from flask import Blueprint
homepage = Blueprint('homepage', __name__, template_folder='templates', static_folder='static')
from . import views