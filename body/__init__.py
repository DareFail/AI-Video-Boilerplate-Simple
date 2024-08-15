from flask import Blueprint
body = Blueprint('body', __name__, template_folder='templates', static_folder='static')
from . import views