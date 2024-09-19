from flask import Blueprint
horror = Blueprint('horror', __name__, template_folder='templates', static_folder='static')
from . import views