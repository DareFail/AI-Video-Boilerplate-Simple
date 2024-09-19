from flask import Blueprint
movement = Blueprint('movement', __name__, template_folder='templates', static_folder='static')
from . import views