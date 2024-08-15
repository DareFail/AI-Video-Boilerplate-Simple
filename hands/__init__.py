from flask import Blueprint
hands = Blueprint('hands', __name__, template_folder='templates', static_folder='static')
from . import views