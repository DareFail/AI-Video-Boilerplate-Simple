from flask import Blueprint
puzzle = Blueprint('puzzle', __name__, template_folder='templates', static_folder='static')
from . import views