// To display predictions, this app has:
// 1. A video that shows a feed from the user's webcam
// 2. A canvas that appears over the video and shows predictions
// When the page loads, a user is asked to give webcam permission.
// After this happens, the model initializes and starts to make predictions
// On the first prediction, an initialiation step happens in detectFrame()
// to prepare the canvas on which predictions are displayed.

var bounding_box_colors = {};

var user_confidence = 0.6;
var confidence_threshold = 0.1;
var model_name = "rock-paper-scissors-sxsw";
var model_version = 11;
var video;
var video_camera;

var shouldMirrorVideo = true;

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
var canvas = document.getElementById("result_canvas");
var ctx = canvas.getContext("2d");

const inferEngine = new inferencejs.InferenceEngine();
var modelWorkerId = null;
var drawingSelected = false;

var isFrame = 1;
var detectedClass_name = [];
var detectedClass_x = [];
var detectedClass_y = [];
var had_detectedClass = [];


function detectFrame() {
  // On first run, initialize a canvas
  // On all runs, run inference using a video frame
  // For each video frame, draw bounding boxes on the canvas
  if (!modelWorkerId) {
    return requestAnimationFrame(detectFrame);
  }

  if (!drawingSelected) {
    if (shouldMirrorVideo) {
      ctx_input.save();
      ctx_input.scale(-1, 1);
      ctx_input.translate(-canvas_input.width, 0);
      ctx_input.drawImage(video_camera, 0, 0, canvas_input.width, canvas_input.height);
      ctx_input.restore();
    } else {
      ctx_input.drawImage(video_camera, 0, 0, canvas_input.width, canvas_input.height);
    }
  }

  inferEngine.infer(modelWorkerId, new inferencejs.CVImage(video)).then(function(predictions) {

    if (!canvas_painted) {
      var video_start = document.getElementById("webcam");

      canvas.top = video_start.top;
      canvas.left = video_start.left;
      canvas.style.top = video_start.top + "px";
      canvas.style.left = video_start.left + "px";
      canvas.style.position = "absolute";
      canvas.style.zIndex = 100;
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

    if (video) {

      var uniquePredictions = predictions.filter((prediction, index, self) =>
        index === self.findIndex((p) => (
          p.class === prediction.class
        ))
      );
      uniquePredictions = uniquePredictions;

      drawBoundingBoxes(uniquePredictions, ctx)
    }
  });
}

function drawBoundingBoxes(predictions, ctx) {
  for (var i = 0; i < predictions.length; i++) {

    if (!detectedClass_name.includes(predictions[i].class)) {
      detectedClass_name.push(predictions[i].class);
      detectedClass_x.push("");
      detectedClass_y.push("");
      had_detectedClass.push(false);
      document.getElementById('speed').innerHTML += '<div class="anotherDiv"><h3><span id="name_' + (detectedClass_name.length - 1) + '"></span>' + predictions[i].class + ' MPH: <span id="speed_' + (detectedClass_name.length - 1) + '">0</span></h3></div>';
    }

    var confidence = predictions[i].confidence;

    if (confidence < user_confidence) {
      continue;
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
    var x = prediction.bbox.x - prediction.bbox.width / 2;
    var y = prediction.bbox.y - prediction.bbox.height / 2;
    var width = prediction.bbox.width;
    var height = prediction.bbox.height;

    ctx.rect(x, y, width, height);
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fill();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = "4";
    
    ctx.strokeRect(x, y, width, height);
    
    // Text stays the same regardless of mirroring
    ctx.font = "25px Arial";
    ctx.fillText(prediction.class + " " + Math.round(confidence * 100) + "%", x, y - 10);
  }

  if (predictions.length > 0 && isFrame == 1) {
    for (var i = 0; i < predictions.length; i++) {
      var x = predictions[i].bbox.x - predictions[i].bbox.width / 2;
      var y = predictions[i].bbox.y - predictions[i].bbox.height / 2;
      var width = predictions[i].bbox.width;
      var height = predictions[i].bbox.height;
      
      const x_value = (x - width / 2);
      const y_value = (y - height / 2);

      var index = detectedClass_name.indexOf(predictions[i].class)
      had_detectedClass[index] = true;

      if (detectedClass_x[index] != "") {
          document.getElementById("speed_" + index).innerHTML = calculateDistance(x_value, y_value, detectedClass_x[index], detectedClass_y[index]).toFixed(2);  
      }
          
      detectedClass_x[index] = x_value;
      detectedClass_y[index] = y_value;

      if (!had_detectedClass[index]) {
          document.getElementById("speed_" + index).innerHTML = "";
      }

      had_detectedClass[index] = false;
    }
  }

  isFrame = isFrame + 1;

  if (isFrame > 12) {
      isFrame = 1; 
  }
}

function handleFileSelect(evt) {
  var loading = document.getElementById("loading");
  loading.style.display = "block";

  var files = evt.target.files; // FileList object
  var file = files[0]; // Get the first file only

  video_camera = document.createElement("video");
  video_camera.src = URL.createObjectURL(file);

  video_camera.onloadedmetadata = function() {
    video_camera.play();
  }

  document.getElementById("mirror").checked = false;
  shouldMirrorVideo = false;



  var stream = canvas_input.captureStream(25);
  video = document.createElement("video");
  video.srcObject = stream;

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
      video_camera = document.createElement("video");
      video_camera.srcObject = stream;

      video_camera.onloadedmetadata = function() {
        video_camera.play();
      }

      var canvasStream = canvas_input.captureStream(25);
      video = document.createElement("video");
      video.srcObject = canvasStream;
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
      video_camera = document.createElement("video");
      video_camera.srcObject = stream;

      video_camera.onloadedmetadata = function() {
        video_camera.play();
      }
      
      document.getElementById("mirror").checked = false;
      shouldMirrorVideo = false;

      var stream = canvas_input.captureStream(25);
      video = document.createElement("video");
      video.srcObject = stream;

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

  document.getElementById("result_canvas").after(video);

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

    document.getElementById("result_canvas").style.display = "block";
  };

  ctx.scale(1, 1);

  clearArea();

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

function changeConfidence() {
  user_confidence = document.getElementById("confidence").value / 100;
  document.getElementById("confidenceValue").innerHTML = document.getElementById("confidence").value;
}

function changeModelName() {
  model_name = document.getElementById("modelName").value;
}

function changeVersionNumber() {
  model_version = parseInt(document.getElementById("versionNumber").value);
}





// Canvas
var canvas_input = document.getElementById("input_canvas");
var ctx_input = canvas_input.getContext("2d");
let isDrawing = false;
let posX = 0;
let posY = 0;
var offsetX;
var offsetY;
const ongoingTouches = [];

function drawInference() {
  var loading = document.getElementById("loading");
  loading.style.display = "block";
  startup();
  drawingSelected = true;
  document.getElementById("drawingTools").style.display = "block";
  document.getElementById("mirror").checked = false;
  document.getElementById("input_canvas").style.zIndex = 200;
  shouldMirrorVideo = false;
  document.getElementById("mirrorContainer").style.display = "none";

  var stream = canvas_input.captureStream(25);
  video = document.createElement("video");
  video.srcObject = stream;

  handleInference(video);  
}

function startup() {
  canvas_input.addEventListener('touchstart', handleStart);
  canvas_input.addEventListener('touchend', handleEnd);
  canvas_input.addEventListener('touchcancel', handleCancel);
  canvas_input.addEventListener('touchmove', handleMove);
  canvas_input.addEventListener('mousedown', (e) => {
    posX = e.offsetX;
    posY = e.offsetY;
    isDrawing = true;
  });

  canvas_input.addEventListener('mousemove', (e) => {
    if (isDrawing) {
      drawLine(ctx_input, posX, posY, e.offsetX, e.offsetY);
      posX = e.offsetX;
      posY = e.offsetY;
    }
  });

  canvas_input.addEventListener('mouseup', (e) => {
    if (isDrawing) {
      drawLine(ctx_input, posX, posY, e.offsetX, e.offsetY);
      posX = 0;
      posY = 0;
      isDrawing = false;
    }
  });
}

function handleStart(evt) {
  evt.preventDefault();
  const touches = evt.changedTouches;
  offsetX = canvas_input.getBoundingClientRect().left;
  offsetY = canvas_input.getBoundingClientRect().top;
  for (let i = 0; i < touches.length; i++) {
    ongoingTouches.push(copyTouch(touches[i]));
  }
}

function handleMove(evt) {
  evt.preventDefault();
  const touches = evt.changedTouches;
  for (let i = 0; i < touches.length; i++) {
    const color = document.getElementById('selColor').value;
    const idx = ongoingTouchIndexById(touches[i].identifier);
    if (idx >= 0) {
      ctx_input.beginPath();
      ctx_input.moveTo(ongoingTouches[idx].clientX - offsetX, ongoingTouches[idx].clientY - offsetY);
      ctx_input.lineTo(touches[i].clientX - offsetX, touches[i].clientY - offsetY);
      ctx_input.lineWidth = document.getElementById('selWidth').value;
      ctx_input.strokeStyle = color;
      ctx_input.lineJoin = "round";
      ctx_input.closePath();
      ctx_input.stroke();
      ongoingTouches.splice(idx, 1, copyTouch(touches[i]));  // swap in the new touch record
    }
  }
}

function handleEnd(evt) {
  evt.preventDefault();
  const touches = evt.changedTouches;
  for (let i = 0; i < touches.length; i++) {
    const color = document.getElementById('selColor').value;
    let idx = ongoingTouchIndexById(touches[i].identifier);
    if (idx >= 0) {
      ctx_input.lineWidth = document.getElementById('selWidth').value;
      ctx_input.fillStyle = color;
      ongoingTouches.splice(idx, 1);  // remove it; we're done
    }
  }
}

function handleCancel(evt) {
  evt.preventDefault();
  const touches = evt.changedTouches;
  for (let i = 0; i < touches.length; i++) {
    let idx = ongoingTouchIndexById(touches[i].identifier);
    ongoingTouches.splice(idx, 1);  // remove it; we're done
  }
}

function copyTouch({ identifier, clientX, clientY }) {
  return { identifier, clientX, clientY };
}

function ongoingTouchIndexById(idToFind) {
  for (let i = 0; i < ongoingTouches.length; i++) {
    const id = ongoingTouches[i].identifier;
    if (id === idToFind) {
      return i;
    }
  }
  return -1;    // not found
}

function drawLine(ctx_input, x1, y1, x2, y2) {
  ctx_input.beginPath();
  ctx_input.strokeStyle = document.getElementById('selColor').value;
  ctx_input.lineWidth = document.getElementById('selWidth').value;
  ctx_input.lineJoin = "round";
  ctx_input.moveTo(x1, y1);
  ctx_input.lineTo(x2, y2);
  ctx_input.closePath();
  ctx_input.stroke();
}

function clearArea() {
  ctx_input.setTransform(1, 0, 0, 1, 0, 0);
  ctx_input.clearRect(0, 0, canvas_input.width, canvas_input.height);
}

function calculateDistance(x1, y1, x2, y2) {
  var xDist = x2 - x1;
  var yDist = y2 - y1;

  const square = Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));

   return square / 100;
}

