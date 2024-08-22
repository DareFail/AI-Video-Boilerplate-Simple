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
var model_name = "puzzle-tz6q9";
var model_version = 1;
var video;
var video_camera;

var shouldMirrorVideo = true;

var isFrame = 1;
var arrow = new Image();
arrow.src = arrow_image;
var scale = 1;

var heightOfMask = 0; // Starting point of the mask assuming bottom of img
var speed = 10; // Change the speed to suit your animations

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

      drawBoundingBoxes(predictions, ctx)
    }
  });
}

function drawBoundingBoxes(predictions, ctx) {

  if (predictions.length > 0 && isFrame == 1) {
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

      ctx.rect(x, y, width, height);
      ctx.fillStyle = "rgba(0, 0, 0, 0)";
      ctx.fill();
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = "4";
      
      ctx.strokeRect(x, y, width, height);
      
      var rotate_degrees = 0;

      rotate_degrees = handleSecond(rotate_degrees, prediction.class[1]);
      rotate_degrees = handleFirst(rotate_degrees, prediction.class[0]);
          
      ctx.save(); // Save the current state
      ctx.translate(x / scale + width / (2 * scale), y / scale + height / (2 * scale)); // Move to the center of the image
      ctx.rotate((rotate_degrees * Math.PI) / 180); // Rotate 45 degrees
      ctx.drawImage(
          arrow,
          -width / (2 * scale), // Move the image back by half its width and height
          -height / (2 * scale),
          width / scale,
          height / scale
      );
      ctx.restore(); // Restore to the state before translation and rotation

      if (rotate_degrees == 0) {
          var audio = new Audio(up_sound);
          audio.currentTime = 0;    
          audio.play();
      
      } else if (rotate_degrees == 10) {
          var audio1 = new Audio(upright_sound);
          audio1.currentTime = 0;    
          audio1.play();

      } else if (rotate_degrees == 20) {
          var audio2 = new Audio(upright_sound);
          audio2.currentTime = 0;    
          audio2.play();
          
      } else if (rotate_degrees == 30) {
          var audio3 = new Audio(nono2_sound);
          audio3.currentTime = 0;    
          audio3.play();
          
      } else if (rotate_degrees == 150) {
          var audio4 = new Audio(nono_sound);
          audio4.currentTime = 0;    
          audio4.play();
          
      } else if (rotate_degrees == 160) {
          var audio5 = new Audio(downright_sound);
          audio5.currentTime = 0;    
          audio5.play();
          
      } else if (rotate_degrees == 170) {
          var audio6 = new Audio(downright_sound);
          audio6.currentTime = 0;    
          audio6.play();
      } else if (rotate_degrees == 180) {
          var audio7 = new Audio(down_sound);
          audio7.currentTime = 0;    
          audio7.play();
      }else if (rotate_degrees == 190) {
          var audio8 = new Audio(downleft_sound);
          audio8.currentTime = 0;    
          audio8.play();
      }else if (rotate_degrees == 200) {
          var audio9 = new Audio(downleft_sound);
          audio9.currentTime = 0;    
          audio9.play();
      }else if (rotate_degrees == 210) {
          var audio10 = new Audio(nono_sound);
          audio10.currentTime = 0;    
          audio10.play();
      }else if (rotate_degrees == 330) {
          var audio11 = new Audio(nono2_sound);
          audio11.currentTime = 0;    
          audio11.play();
      }else if (rotate_degrees == 340) {
          var audio12 = new Audio(upleft_sound);
          audio12.currentTime = 0;    
          audio12.play();
      } else if (rotate_degrees == 350) {
          var audio13 = new Audio(upleft_sound);
          audio13.currentTime = 0;    
          audio13.play();
      } else {
          var audio14 = new Audio(nono_sound);
          audio14.currentTime = 0;    
          audio14.play();
      }
    }
  }

  isFrame = isFrame + 1;

  if (isFrame > 16) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

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


function handleFirst(rotate_degrees, letter) {
  if(letter == "A") {
      if (rotate_degrees == 0) {
          return rotate_degrees - 30;
      } else {
          return rotate_degrees + 30;
      }
  }
  if(letter == "B") {
      if (rotate_degrees == 0) {
          return rotate_degrees - 20;
      } else {
          return rotate_degrees + 20;
      }
  }
  if(letter == "C") {
      if (rotate_degrees == 0) {
          return rotate_degrees - 10;
      } else {
          return rotate_degrees + 10;
      }
  }
  if(letter == "D") {
      if (rotate_degrees == 0) {
          return rotate_degrees + 0;
      } else {
          return rotate_degrees + 0;
      }
  }
  if(letter == "E") {
      if (rotate_degrees == 0) {
          return rotate_degrees + 10;
      } else {
          return rotate_degrees - 10;
      }
  }
  if(letter == "F") {
      if (rotate_degrees == 0) {
          return rotate_degrees + 20;
      } else {
          return rotate_degrees - 20;
      }
  }
  if(letter == "G") {
      if (rotate_degrees == 0) {
          return rotate_degrees + 30;
      } else {
          return rotate_degrees - 30;
      }
  }
}

function handleSecond(rotate_degrees, number) {
  if(number == "1") {
      return rotate_degrees + 0;
  }
  if(number == "2") {
      return rotate_degrees + 0;
  }
  if(number == "3") {
      return rotate_degrees + 0;
  }
  if(number == "4") {
      return rotate_degrees + 0;
  }
  if(number == "5") {
      return rotate_degrees + 180;
  }
  if(number == "6") {
      return rotate_degrees + 180;
  }
  if(number == "7") {
      return rotate_degrees + 180;
  }
  if(number == "8") {
      return rotate_degrees + 180;
  }
  if(number == "9") {
      return rotate_degrees + 180;
  }
}

document.getElementById("webcamButton").addEventListener('click', function(event){
  webcamInference("user");
});
document.getElementById("backCamButton").addEventListener('click', function(event){
  webcamInference("environment");
});
document.getElementById("mirror").addEventListener('click', changeMirror);
document.getElementById("clearArea").addEventListener('click', clearArea);
document.getElementById('confidence').addEventListener('input', changeConfidence);
document.getElementById("screenButton").addEventListener('click', screenInference);
document.getElementById("drawButton").addEventListener('click', drawInference);
document.getElementById("uploadedFile").addEventListener('change', function(event){
  handleFileSelect(event);
});