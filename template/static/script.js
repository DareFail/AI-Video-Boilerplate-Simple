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
var model_name = "microsoft-coco";
var model_version = 9;

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
var canvas = document.getElementById("video_canvas");
var ctx = canvas.getContext("2d");

const inferEngine = new inferencejs.InferenceEngine();
var modelWorkerId = null;


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
    }
    requestAnimationFrame(detectFrame);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (shouldMirrorVideo) {
      ctx.save();  // save the current state
      ctx.scale(-1, 1); // flip x axis
      ctx.translate(-video.width, 0); // translate the x axis
      ctx.drawImage(video, 0, 0); 
      ctx.restore();
    }

    if (video) {

      drawBoundingBoxes(predictions, ctx)
    }
  });
}

function drawBoundingBoxes(predictions, ctx) {
  for (var i = 0; i < predictions.length; i++) {
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

    if (shouldMirrorVideo) {
      x = video.videoWidth - (x + width);
    }

    ctx.rect(x, y, width, height);
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fill();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = "4";
    
    // If video should be mirrored, flip the context only for drawing bbox, leave text
    if (shouldMirrorVideo) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.strokeRect(-x-width, y, width, height);
      ctx.restore();
    } else {
      ctx.strokeRect(x, y, width, height);
    }
    
    // Text stays the same regardless of mirroring
    ctx.font = "25px Arial";
    ctx.fillText(prediction.class + " " + Math.round(confidence * 100) + "%", x, y - 10);
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

function drawInference() {
  var loading = document.getElementById("loading");
  loading.style.display = "block";
  document.getElementById("drawingTools").style.display = "block";

  var drawCanvas = document.createElement('canvas');
  drawCanvas.id = "webcam";
  document.getElementById("video_canvas").after(drawCanvas);

  // scale down video by 0.75
  drawCanvas.style.width = 640 + "px";
  drawCanvas.style.height = 480 + "px";

  canvas.style.width = 640 + "px";
  canvas.style.height = 480 + "px";

  document.getElementById("video_canvas").style.display = "block";

  ctx.scale(1, 1);

  img = new Image();
  img.src = drawCanvas.toDataURL();

  startup();

  inferEngine.startWorker(model_name, model_version, publishable_key, [{ scoreThreshold: confidence_threshold }])
    .then((id) => {
      modelWorkerId = id;
      // Start inference
     detectStillImage();
  });
}

function detectStillImage() {
  // On first run, initialize a canvas
  // On all runs, run inference using an image
  // For each image, draw bounding boxes on the canvas

  if (!modelWorkerId) return requestAnimationFrame(detectStillImage);

  inferEngine.infer(modelWorkerId, new inferencejs.CVImage(img)).then(function(predictions) {

    if (!canvas_painted) {
      var image_start = document.getElementById("webcam");

      canvas.top = image_start.top;
      canvas.left = image_start.left;
      canvas.style.top = image_start.top + "px";
      canvas.style.left = image_start.left + "px";
      canvas.style.position = "absolute";
      image_start.style.display = "block";
      canvas.style.display = "absolute";
      canvas_painted = true;

      var loading = document.getElementById("loading");
      loading.style.display = "none";
      document.getElementById("videoSource").style.display = "none";
    }
    requestAnimationFrame(detectStillImage);

    if (img) {
      drawBoundingBoxes(predictions, ctx)
    }
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
    height = video.videoHeight;
    width = video.videoWidth;

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

function changeConfidence() {
  user_confidence = document.getElementById("confidence").value / 100;
  document.getElementById("confidenceValue").innerHTML = document.getElementById("confidence").value;
}


// Canvas
let isDrawing = false;
let posX = 0;
let posY = 0;
var offsetX;
var offsetY;
const ongoingTouches = [];

function startup() {
  canvas.addEventListener('touchstart', handleStart);
  canvas.addEventListener('touchend', handleEnd);
  canvas.addEventListener('touchcancel', handleCancel);
  canvas.addEventListener('touchmove', handleMove);
  canvas.addEventListener('mousedown', (e) => {
    posX = e.offsetX;
    posY = e.offsetY;
    isDrawing = true;
  });

  canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
      drawLine(ctx, posX, posY, e.offsetX, e.offsetY);
      posX = e.offsetX;
      posY = e.offsetY;
    }
  });

  canvas.addEventListener('mouseup', (e) => {
    if (isDrawing) {
      drawLine(ctx, posX, posY, e.offsetX, e.offsetY);
      posX = 0;
      posY = 0;
      isDrawing = false;
    }
  });
}

function handleStart(evt) {
  evt.preventDefault();
  const touches = evt.changedTouches;
  offsetX = canvas.getBoundingClientRect().left;
  offsetY = canvas.getBoundingClientRect().top;
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
      ctx.beginPath();
      ctx.moveTo(ongoingTouches[idx].clientX - offsetX, ongoingTouches[idx].clientY - offsetY);
      ctx.lineTo(touches[i].clientX - offsetX, touches[i].clientY - offsetY);
      ctx.lineWidth = document.getElementById('selWidth').value;
      ctx.strokeStyle = color;
      ctx.lineJoin = "round";
      ctx.closePath();
      ctx.stroke();
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
      ctx.lineWidth = document.getElementById('selWidth').value;
      ctx.fillStyle = color;
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

function drawLine(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.strokeStyle = document.getElementById('selColor').value;
  ctx.lineWidth = document.getElementById('selWidth').value;
  ctx.lineJoin = "round";
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.closePath();
  ctx.stroke();
}

function clearArea() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}