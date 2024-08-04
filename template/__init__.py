from flask import Blueprint
template = Blueprint('template', __name__, template_folder='templates', static_folder='static')
from . import views