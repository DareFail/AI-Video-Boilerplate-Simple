from flask import Flask, render_template
from homepage import homepage
from gaze import gaze
from privasee import privasee
from surfinterneteyes import surfinterneteyes
from microsoftobjectdetection import microsoftobjectdetection
from universeobjectdetection import universeobjectdetection
from body import body
from hands import hands
from face import face
from pushupcount import pushupcount
from template import template
from lightsaber import lightsaber
from punchspeed import punchspeed
from puzzle import puzzle

app = Flask(__name__)

app.register_blueprint(homepage, url_prefix='')
app.register_blueprint(microsoftobjectdetection, url_prefix='/microsoftobjectdetection')
app.register_blueprint(universeobjectdetection, url_prefix='/universeobjectdetection')
app.register_blueprint(body, url_prefix='/body')
app.register_blueprint(hands, url_prefix='/hands')
app.register_blueprint(face, url_prefix='/face')
app.register_blueprint(gaze, url_prefix='/gaze')
app.register_blueprint(pushupcount, url_prefix='/pushupcount')
app.register_blueprint(privasee, url_prefix='/privasee')
app.register_blueprint(surfinterneteyes, url_prefix='/surfinterneteyes')
app.register_blueprint(template, url_prefix='/template')
app.register_blueprint(lightsaber, url_prefix='/lightsaber')
app.register_blueprint(punchspeed, url_prefix='/punchspeed')
app.register_blueprint(puzzle, url_prefix='/puzzle')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
