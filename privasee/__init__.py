from flask import Blueprint
privasee = Blueprint('privasee', __name__, template_folder='templates', static_folder='static')
from . import views