from flask import Blueprint
glowsword = Blueprint('glowsword', __name__, template_folder='templates', static_folder='static')
from . import views