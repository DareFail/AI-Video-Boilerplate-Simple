from flask import Blueprint
lightsaber = Blueprint('lightsaber', __name__, template_folder='templates', static_folder='static')
from . import views