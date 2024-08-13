from flask import Blueprint
pushupcount = Blueprint('pushupcount', __name__, template_folder='templates', static_folder='static')
from . import views