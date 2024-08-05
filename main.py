from flask import Flask, render_template
from homepage import homepage
from gaze import gaze
from privasee import privasee
from microsoftobjectdetection import microsoftobjectdetection
from universeobjectdetection import universeobjectdetection
from template import template

app = Flask(__name__)

app.register_blueprint(homepage, url_prefix='')
app.register_blueprint(microsoftobjectdetection, url_prefix='/microsoftobjectdetection')
app.register_blueprint(universeobjectdetection, url_prefix='/universeobjectdetection')
app.register_blueprint(gaze, url_prefix='/gaze')
app.register_blueprint(privasee, url_prefix='/privasee')
app.register_blueprint(template, url_prefix='/template')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
