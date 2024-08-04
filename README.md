# AI-video-boilerplate

  This is a completely free Live AI Video boilerplate for you to play with.  

Hosted on Replit for a live demo here: [https://replit.com/@DareFail/AI-Video-Boilerplate](https://replit.com/@DareFail/AI-Video-Boilerplate)

  

## Features

-  **Backend**: Simple Flask sever, just serves files.

-  **Live Video**: From your webcam or a local .mp4 or .mov file

-  **AI Vision**: Integrated with Roboflow (sponsored project)

  

## Getting Started

  

This is a template for testing out live video AI experiments. It is best used for projects, research, business ideas, and even homework.



It is an extremely lightweight flask server that can be uploaded to popular cloud platforms like Replit, Vercel, Digital Ocean, or Heroku.

  

### Prerequisites

  

1. Get a free API key from [Roboflow](https://roboflow.com/) to use their vision models.

2. Create a .env file in the main directory

```

ROBOFLOW_API_KEY="YOUR_ROBOFLOW_KEY_HERE"

```

  

### Installation

  

1. Clone the repo

```sh

git clone https://github.com/DareFail/AI-Video-Boilerplate.git

cd AI-Video-Boilerplate

```
3. Install poetry

```sh

# via homebrew (mac)
brew install poetry

# PC
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | Invoke-Expression

```

2. Install dependencies

```sh

poetry shell

```

3. Start the server

```sh

poetry run python main.py

```
Then go to localhost:8000
*You can change the port it runs on in main.py*
  

## Included Templates

  

AI-Video-Boilerplate comes with a growing list of AI templates. They will always be linked on the homepage but you can also view their code in each top folder in the main directory like "Gaze" and "Template." 

*There is a static folder in the main directory but it is only used by the homepage folder. This is due to a quirk in flask.*

To add your own app, the easiest way is to modify one of the existing ones.

If you want to make a brand new one to add to the repo, follow these steps:
*(Replace all {{APP_NAME_HERE}} with your new app name)*

1. Copy the Template folder to the main directory and rename it
2. In main.py, import your new folder name 
``` 
"from  {{APP_NAME_HERE}}  import  {{APP_NAME_HERE}}"

app.register_blueprint({{APP_NAME_HERE}}, url_prefix='/{{UNIQUE_URL_HERE}}')
```
3.  In {{APP_NAME_HERE}}/\_\_init\_\_.py:
```
from flask import Blueprint

{{APP_NAME_HERE}}  = Blueprint('{{APP_NAME_HERE}}', __name__, template_folder='templates', static_folder='static')

from . import  views
```
4. In {{APP_NAME_HERE}}/views.py:
 ```
from flask import render_template
import  os
from . import  {{APP_NAME_HERE}}  

@{{APP_NAME_HERE}}.route('/')

def  index():
return render_template(
'{{APP_NAME_HERE}}/index.html',
ROBOFLOW_API_KEY=os.environ.get("ROBOFLOW_API_KEY")
)
 ```

5. In {{APP_NAME_HERE}}/templates/{{APP_NAME_HERE}}/index.html:
 ```
# Swap out
# <link  rel="stylesheet"  href="{{ url_for('template.static', filename='styles.css') }}"  />
# with:
<link  rel="stylesheet"  href="{{ url_for('{{APP_NAME_HERE}}.static', filename='styles.css') }}"  />

and 
# Swap out 
#<script  src="{{ url_for('template.static', filename='script.js') }}"></script>
# with:
#<script  src="{{ url_for('{{APP_NAME_HERE}}.static', filename='script.js') }}"></script>
 ```


## Easy Deployment

-   Replit: Can be used as is, just keep the .replit file
-  Digital Ocean
-  Vercel
-  Heroku: Can be used as is, just keep the current Procfile
  

## Acknowledgements

  

- Thanks to Roboflow for sponsoring this project. Get your free API key at: [Roboflow](https://roboflow.com/)

  

## License
  

Distributed under the APACHE 2.0 License. See `LICENSE` for more information.

  

## Contact (feel free to ask questions!)

  

Twitter: [@darefailed](https://twitter.com/darefailed)

  

Youtube: [How to Video coming soon](https://www.youtube.com/@darefail)

  

Project Link: [https://github.com/DareFail/AI-Video-Boilerplate](https://github.com/DareFail/AI-Video-Boilerplate)