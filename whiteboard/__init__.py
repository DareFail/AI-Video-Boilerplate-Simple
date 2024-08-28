from flask import Blueprint
whiteboard = Blueprint('whiteboard', __name__, template_folder='templates', static_folder='static')
from . import views