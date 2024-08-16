from flask import Blueprint
punchspeed = Blueprint('punchspeed', __name__, template_folder='templates', static_folder='static')
from . import views