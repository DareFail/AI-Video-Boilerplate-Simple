// To display predictions, this app has:
// 1. A video that shows a feed from the user's webcam
// 2. A canvas that appears over the video and shows predictions
// When the page loads, a user is asked to give webcam permission.
// After this happens, the model initializes and starts to make predictions
// On the first prediction, an initialiation step happens in detectFrame()
// to prepare the canvas on which predictions are displayed.

var bounding_box_colors = {};

var user_confidence = 0.6;
var confidence_threshold = 0.5;
var model_name = "gaze";
var model_version = 1;
var video;

var lastX = 0;
var lastY = 0;

var shouldMirrorVideo = true;
var filterStrength = 0.91;
var sensitivity = 25;
var verticalOffset = -1;
var dotSize = 5;

// Update the colors in this list to set the bounding box colors
var color_choices = [
  "#C7FC00",
  "#FF00FF",
  "#8622FF",
  "#FE0056",
  "#00FFCE",
  "#FF8000",
  "#00B7EB",
  "#FFFF00",
  "#0E7AFE",
  "#FFABAB",
  "#0000FF",
  "#CCCCCC",
];

var canvas_painted = false;
var canvas = document.getElementById("video_canvas");
var ctx = canvas.getContext("2d");

const inferEngine = new inferencejs.InferenceEngine();
var modelWorkerId = null;

var videoState = "stopped";


function detectFrame() {
  // On first run, initialize a canvas
  // On all runs, run inference using a video frame
  // For each video frame, draw bounding boxes on the canvas
  if (!modelWorkerId) return requestAnimationFrame(detectFrame);

  inferEngine.infer(modelWorkerId, new inferencejs.CVImage(video)).then(function(predictions) {

    if (!canvas_painted) {
      var video_start = document.getElementById("webcam");

      canvas.top = video_start.top;
      canvas.left = video_start.left;
      canvas.style.top = video_start.top + "px";
      canvas.style.left = video_start.left + "px";
      canvas.style.position = "absolute";
      video_start.style.display = "block";
      canvas.style.display = "absolute";
      canvas_painted = true;

      var loading = document.getElementById("loading");
      loading.style.display = "none";
      document.getElementById("videoSource").style.display = "none";
      document.getElementById("infer-widget").style.display = "block";
    }
    requestAnimationFrame(detectFrame);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (shouldMirrorVideo) {
      ctx.save();  // save the current state
      ctx.scale(-1, 1); // flip x axis
      ctx.translate(-video.videoWidth, 0); // translate the x axis
      ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight); 
      ctx.restore();
    }

    if (video) {

      drawBoundingBoxes(predictions, ctx)
    }
  });
}

function drawBoundingBoxes(predictions, ctx) {
  // For each prediction, choose or assign a bounding box color choice,
  // then apply the requisite scaling so bounding boxes appear exactly
  // around a prediction.

  // If you want to do anything with predictions, start from this function.
  // For example, you could display them on the web page, check off items on a list,
  // or store predictions somewhere.

  for (var i = 0; i < predictions.length; i++) {
    var confidence = predictions[i].confidence;

    //console.log(user_confidence)

    if (confidence < user_confidence) {
      continue
    }

    if (predictions[i].class in bounding_box_colors) {
      ctx.strokeStyle = bounding_box_colors[predictions[i].class];
    } else {
      var color =
        color_choices[Math.floor(Math.random() * color_choices.length)];
      ctx.strokeStyle = color;
      // remove color from choices
      color_choices.splice(color_choices.indexOf(color), 1);

      bounding_box_colors[predictions[i].class] = color;
    }

    var prediction = predictions[i];
    console.log(prediction);

    document.getElementById("pitchValue").innerHTML = Math.tan(prediction.pitch) / Math.PI;
    document.getElementById("yawValue").innerHTML = Math.tan(prediction.yaw) / Math.PI;
    


    var gazeCoords = estimateCanvasCoordinates(prediction.leftEye.x, prediction.leftEye.y, prediction.pitch, prediction.yaw)
    //console.log(gazeCoords)

    if (gazeCoords == "NONE") {
      document.getElementById("looking").innerHTML = "Off Screen";
    }
    else {
      ctx.beginPath();
      ctx.arc(gazeCoords.x, gazeCoords.y, dotSize, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'red';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'red';
      ctx.stroke();

      document.getElementById("looking").innerHTML = "On Screen";
    }

  }
}


function handleFileSelect(evt) {
  var loading = document.getElementById("loading");
  loading.style.display = "block";

  var files = evt.target.files; // FileList object
  var file = files[0]; // Get the first file only

  video = document.createElement("video");
  video.src = URL.createObjectURL(file);

  document.getElementById("mirror").checked = false;
  shouldMirrorVideo = false;

  handleInference(video);

}

function webcamInference() {
  // Ask for webcam permissions, then run main application.
  var loading = document.getElementById("loading");
  loading.style.display = "block";

  navigator.mediaDevices
    .getUserMedia({ 
      video: { facingMode: "user" },
      audio: false
    })
    .then(function(stream) {
      video = document.createElement("video");
      video.srcObject = stream;
      handleInference(video);
    })
    .catch(function(err) {
      console.log(err);
    });
}

function screenInference() {
  // Ask for webcam permissions, then run main application.
  var loading = document.getElementById("loading");
  loading.style.display = "block";

  navigator.mediaDevices
    .getDisplayMedia({ 
      audio: false
    })
    .then(function(stream) {
      video = document.createElement("video");
      video.srcObject = stream;
      
      document.getElementById("mirror").checked = false;
      shouldMirrorVideo = false;

      handleInference(video);
    })
    .catch(function(err) {
      console.log(err);
    });
}

function handleInference(video) {
  video.id = "webcam";

  // hide video until the web stream is ready
  video.style.display = "none";
  video.setAttribute("playsinline", "");

  document.getElementById("video_canvas").after(video);

  video.onloadedmetadata = function() {
    video.play();
  }

  // on full load, set the video height and width
  video.onplay = function() {
    var height = video.videoHeight;
    var width = video.videoWidth;

    // scale down video by 0.75

    video.width = width;
    video.height = height;
    video.style.width = 640 + "px";
    video.style.height = 480 + "px";

    canvas.style.width = 640 + "px";
    canvas.style.height = 480 + "px";
    canvas.width = width;
    canvas.height = height;

    document.getElementById("video_canvas").style.display = "block";
  };

  ctx.scale(1, 1);

  // Load the Roboflow model using the publishable_key set in index.html
  // and the model name and version set at the top of this file
  inferEngine.startWorker(model_name, model_version, publishable_key, [{ scoreThreshold: confidence_threshold }])
    .then((id) => {
      modelWorkerId = id;
      // Start inference
      detectFrame();
    });
}

function changeMirror () {
  shouldMirrorVideo = document.getElementById("mirror").checked;
}

function changeFilterStrength() {
  filterStrength = document.getElementById("filterStrength").value / 100;
  document.getElementById("filterStrengthValue").innerHTML = document.getElementById("filterStrength").value;
}

function changeSensitivity() {
  sensitivity = document.getElementById("sensitivity").value;
  document.getElementById("sensitivityValue").innerHTML = document.getElementById("sensitivity").value;
}

function changeVerticalOffset() {
  verticalOffset = document.getElementById("verticalOffset").value;
  document.getElementById("verticalOffsetValue").innerHTML = document.getElementById("verticalOffset").value;
}

function changeDotSize() {
  dotSize = document.getElementById("dotSize").value;
  document.getElementById("dotSizeValue").innerHTML = document.getElementById("dotSize").value;
}

function estimateCanvasCoordinates(eyeX, eyeY, pitch, yaw) {

  var canvas = document.getElementById("video_canvas");
  var canvasHeight = canvas.offsetHeight;
  var canvasWidth = canvas.offsetWidth;

  if (verticalOffset == -1) {
    verticalOffset = eyeY * canvasHeight;
    document.getElementById("verticalOffset").value = verticalOffset;
  }
  // Adjust pitch and yaw based on sensitivity
  pitch *= sensitivity;
  yaw *= sensitivity;
  
  // Map adjusted pitch and yaw to coordinates
  var canvasX = (yaw / Math.PI / 2 + 0.5) * canvasWidth;
  var canvasY = (-pitch / Math.PI / 2 + 0.5) * canvasHeight - verticalOffset;

  // Apply simple filter to smooth out jitter
  canvasX = lastX * filterStrength + (1 - filterStrength) * canvasX;
  canvasY = lastY * filterStrength + (1 - filterStrength) * canvasY;
  
  // Save the current coordinates for the next frame
  lastX = canvasX;
  lastY = canvasY;
  
  if (canvasX > canvasWidth) {
    lastX = canvasWidth + 10;
    return "NONE";
  }
  else if (canvasX < 0) {
    lastX = -10;
    return "NONE";
  }
  else if (canvasY > canvasHeight) {
    lastY = canvasHeight + 10;
    return "NONE";
  }
  else if (canvasY < 0) {
    lastY = -10;
    return "NONE";
  }

  return {x: canvasX, y: canvasY};
}