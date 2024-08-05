from flask import Blueprint
microsoftobjectdetection = Blueprint('microsoftobjectdetection', __name__, template_folder='templates', static_folder='static')
from . import views