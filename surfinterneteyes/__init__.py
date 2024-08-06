from flask import Blueprint
surfinterneteyes = Blueprint('surfinterneteyes', __name__, template_folder='templates', static_folder='static')
from . import views