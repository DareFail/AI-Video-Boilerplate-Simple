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
from XXXXX import XXXXX
from glowsword import glowsword
from punchspeed import punchspeed
from puzzle import puzzle
from speed import speed
from pong import pong
from whiteboard import whiteboard
from movement import movement
from horror import horror

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
app.register_blueprint(XXXXX, url_prefix='/template')
app.register_blueprint(glowsword, url_prefix='/glowsword')
app.register_blueprint(punchspeed, url_prefix='/punchspeed')
app.register_blueprint(puzzle, url_prefix='/puzzle')
app.register_blueprint(speed, url_prefix='/speed')
app.register_blueprint(pong, url_prefix='/pong')
app.register_blueprint(whiteboard, url_prefix='/whiteboard')
app.register_blueprint(movement, url_prefix='/movement')
app.register_blueprint(horror, url_prefix='/horror')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
