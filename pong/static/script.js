// To display predictions, this app has:
// 1. A video that shows a feed from the user's webcam
// 2. A canvas that appears over the video and shows predictions
// When the page loads, a user is asked to give webcam permission.
// After this happens, the model initializes and starts to make predictions
// On the first prediction, an initialiation step happens in detectFrame()
// to prepare the canvas on which predictions are displayed.

import {
  HandLandmarker,
  FilesetResolver,
  DrawingUtils
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0"


var bounding_box_colors = {};

var user_confidence = 0.6;
var confidence_threshold = 0.1;
var model_name = "rock-paper-scissors-sxsw";
var model_version = 14;
var video;
var video_camera;
let charlieVideo;

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

const drawingUtils = new DrawingUtils(ctx)

let lastVideoTime = -1
let results = undefined


let handLandmarker = undefined
let runningMode = "IMAGE"
let HAND_CONNECTIONS = [
  {'start': 0, 'end': 1}
]


 

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


  if (runningMode === "IMAGE") {
    runningMode = "VIDEO"
    handLandmarker.setOptions({ runningMode: "VIDEO" })
  }
  let startTimeMs = performance.now()
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime
    results = handLandmarker.detectForVideo(video, startTimeMs)
  }
  if (results.landmarks) {
    for (const landmarks of results.landmarks) {
      landmarks.splice(1, 19);
      var newLandmarks = landmarks;
      if (newLandmarks[0].x > 0.5) {
        // right
        computer.x1 = newLandmarks[0].x * canvas.width;
        computer.y1 = newLandmarks[0].y * canvas.height;
        computer.x2 = newLandmarks[1].x * canvas.width;
        computer.y2 = newLandmarks[1].y * canvas.height;
      } else {
        // left
        player.x1 = newLandmarks[0].x * canvas.width;
        player.y1 = newLandmarks[0].y * canvas.height;
        player.x2 = newLandmarks[1].x * canvas.width;
        player.y2 = newLandmarks[1].y * canvas.height;
      }

      drawingUtils.drawConnectors(newLandmarks, HAND_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 5
      })
      drawingUtils.drawLandmarks(newLandmarks, { color: "#FF0000", lineWidth: 2 })
    }
  }

    ball.update();
    player.update();
    computer.update()
    
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Check if ball hits top or bottom wall
    if(ball.y + ball.height > canvas.height || ball.y < 0) {
        ball.dy *= -1;
    }

    // Player's paddle
    let player_dx = player.x2 - player.x1;
    let player_dy = player.y2 - player.y1;
    let player_len = Math.sqrt(player_dx*player_dx + player_dy*player_dy);
    player_dx /= player_len;
    player_dy /= player_len;

    let proj_len1 = (ball.x - player.x1)*player_dx + (ball.y - player.y1)*player_dy;

    if(proj_len1 > 0 && proj_len1 < player_len && ball.dx < 0 && ball.x < player.x2) {
        ball.dx *= -1;
    }

    // Computer's paddle
    let comp_dx = computer.x2 - computer.x1;
    let comp_dy = computer.y2 - computer.y1;
    let comp_len = Math.sqrt(comp_dx*comp_dx + comp_dy*comp_dy);
    comp_dx /= comp_len;
    comp_dy /= comp_len;

    let proj_len2 = (ball.x - computer.x1)*comp_dx + (ball.y - computer.y1)*comp_dy;

    if(proj_len2 > 0 && proj_len2 < comp_len && ball.dx > 0 && ball.x + ball.width > computer.x1) {
        ball.dx *= -1;
    }

    // Score updates
    if (ball.x < 0){
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        computer.score += 1;
    }

    if (ball.x + ball.width > canvas.width){
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        player.score += 1;
    }

    //printing scores
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000'; // apply black color to strokes
    ctx.lineWidth = 5; // control the outline's thickness
    ctx.font = "30px Arial";
    
    // draw with stroke (outline)
    ctx.strokeText("Left: " + player.score, 130, 50); 
    ctx.strokeText("Right: " + computer.score, canvas.width - 180, 50); 
    
    // draw with fill
    ctx.fillText("Left: " + player.score, 130, 50);
    ctx.fillText("Right: " + computer.score, canvas.width - 180, 50);


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

    if (predictions[i].class == "Paper") {
      if (predictions[i].class in bounding_box_colors) {
        ctx.strokeStyle = bounding_box_colors[predictions[i].class];
      } else {
        var color = color_choices[Math.floor(Math.random() * color_choices.length)];
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
      ctx.fillText("Paddle " + Math.round(confidence * 100) + "%", x, y - 10);

    }

    
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

function webcamInference(facingMode) {
  // Ask for webcam permissions, then run main application.
  var loading = document.getElementById("loading");
  loading.style.display = "block";

  navigator.mediaDevices
    .getUserMedia({ 
      video: { facingMode: facingMode },
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

  charlieVideo = document.createElement('video');
  charlieVideo.src = '/pong/static/charlie.mp4'; 
  charlieVideo.load();
  charlieVideo.play();

  charlieVideo.oncanplaythrough = function() {
    charlieVideo.muted = true;
    charlieVideo.loop = true;
  };

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


// Before we can use HandLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
const createHandLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  )
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      delegate: "GPU"
    },
    runningMode: runningMode,
    numHands: 2
  })
}
createHandLandmarker()



document.getElementById("webcamButton").addEventListener('click', function(event){
  webcamInference("user");
});
document.getElementById("backCamButton").addEventListener('click', function(event){
  shouldMirrorVideo = false;
  document.getElementById("mirror").checked = false;
  webcamInference("environment");
});
document.getElementById("mirror").addEventListener('click', changeMirror);
document.getElementById("clearArea").addEventListener('click', clearArea);
document.getElementById("screenButton").addEventListener('click', screenInference);
document.getElementById("drawButton").addEventListener('click', drawInference);
document.getElementById("uploadedFile").addEventListener('change', function(event){
  handleFileSelect(event);
});


const player = {
  x1: 0,
  y1: canvas.height / 2 - 95,
  x2: 10,
  y2: canvas.height / 2 + 95,
  color: "#FFFFFF",
  score: 0,
  update: function(){
    ctx.beginPath();
    ctx.lineWidth = 10;
    ctx.strokeStyle = this.color;
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.stroke();
  }
};

const computer = {
  x1: canvas.width - 90,
  y1: canvas.height / 2 - 50,
  x2: canvas.width - 10,
  y2: canvas.height / 2 + 50,
  color: "#FFFFFF",
  score: 0,
  update: function(){
    ctx.beginPath();
    ctx.lineWidth = 10;
    ctx.strokeStyle = this.color;
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.stroke();
  }
};


const ball = {
  x: canvas.width/2,
  y: canvas.height/2,
  width: 100,
  height: 100,
  dx:4,
  dy:4,
  color: "#FFFFFF",
  update:function() {
    ctx.drawImage(charlieVideo, this.x, this.y, this.width, this.height);
  },
}

function findCenter(point1, point2) {
  let center = (point1 + point2) / 2;

  return center
}