from flask import request, render_template, jsonify
import os
from openai import OpenAI
import openai

from . import whiteboard

@whiteboard.route('/')
def index():
    return render_template(
        'whiteboard/index.html', 
        ROBOFLOW_API_KEY=os.environ.get("ROBOFLOW_API_KEY"),
        ANALYTICS_ID=os.environ.get("ANALYTICS_ID")
    )


@whiteboard.route('solve/', methods=['POST'])
def solve():
    image_data = request.json.get('image', None)
    if image_data is None:
        return jsonify({"error": "No image provided"}), 400

    client = openai.OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Write only the solution"
                    },
                    {
                        "type": "image_url",
                        "image_url": 
                            {
                                "url": image_data
                            }
                    }
                ]
            }
        ],
        max_tokens=50,
    )

    return jsonify({"response": response.choices[0].message.content})