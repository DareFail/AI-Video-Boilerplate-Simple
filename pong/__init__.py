from flask import Blueprint
pong = Blueprint('pong', __name__, template_folder='templates', static_folder='static')
from . import views