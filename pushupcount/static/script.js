// To display predictions, this app has:
// 1. A video that shows a feed from the user's webcam
// 2. A canvas that appears over the video and shows predictions
// When the page loads, a user is asked to give webcam permission.
// After this happens, the model initializes and starts to make predictions
// On the first prediction, an initialiation step happens in detectFrame()
// to prepare the canvas on which predictions are displayed.
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils
} from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0"

var bounding_box_colors = {};

var user_confidence = 0.6;
var confidence_threshold = 0.1;
var model_name = "push-up-ditection";
var model_version = 3;
var model_type = "pushups";
var video;
var video_camera;

// Pushups
var countPushup = 0;
var currentStatusPushup = "push-ups"

const verifyTimesPushup = 10;
var currentVerifyPushup = 0;
var newStatusPushup = "push-ups";

// Situps
var countSitup = 0;
var currentStatusSitup = "sit-up"

const verifyTimesSitup = 10;
var currentVerifySitup = 0;
var newStatusSitup = "sit-up";

// Squats
var countSquat = 0;
var currentStatusSquat = "squat-up"

const verifyTimesSquat = 10;
var currentVerifySquat = 0;
var newStatusSquat = "squat-up";



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

let poseLandmarker = undefined
let runningMode = "IMAGE"
const drawingUtils = new DrawingUtils(ctx)
let lastVideoTime = -1

const POSE_CONNECTIONS_NO_FACE = [
  {
      "start": 0,
      "end": 1
  },
  {
      "start": 0,
      "end": 2
  },
  {
      "start": 2,
      "end": 4
  },
  {
      "start": 4,
      "end": 6
  },
  {
      "start": 4,
      "end": 8
  },
  {
      "start": 4,
      "end": 10
  },
  {
      "start": 6,
      "end": 8
  },
  {
      "start": 1,
      "end": 3
  },
  {
      "start": 3,
      "end": 5
  },
  {
      "start": 5,
      "end": 7
  },
  {
      "start": 5,
      "end": 9
  },
  {
      "start": 5,
      "end": 11
  },
  {
      "start": 7,
      "end": 9
  },
  {
      "start": 0,
      "end": 12
  },
  {
      "start": 1,
      "end": 13
  },
  {
      "start": 12,
      "end": 13
  },
  {
      "start": 12,
      "end": 14
  },
  {
      "start": 13,
      "end": 15
  },
  {
      "start": 14,
      "end": 16
  },
  {
      "start": 15,
      "end": 17
  },
  {
      "start": 16,
      "end": 18
  },
  {
      "start": 17,
      "end": 19
  },
  {
      "start": 18,
      "end": 20
  },
  {
      "start": 19,
      "end": 21
  },
  {
      "start": 16,
      "end": 20
  },
  {
      "start": 17,
      "end": 21
  }
]




const POSE_CONNECTIONS_SQUAT = [
  {
      "start": 0,
      "end": 1
  },
  {
      "start": 0,
      "end": 2
  },
  {
      "start": 1,
      "end": 3
  },
  {
      "start": 2,
      "end": 3
  },
  {
      "start": 2,
      "end": 4
  },
  {
      "start": 4,
      "end": 6
  },
  {
      "start": 6,
      "end": 8
  },
  {
      "start": 8,
      "end": 10
  },
  {
      "start": 6,
      "end": 10
  },
  {
      "start": 3,
      "end": 5
  },
  {
      "start": 5,
      "end": 7
  },
  {
      "start": 7,
      "end": 9
  },
  {
      "start": 9,
      "end": 11
  },
  {
      "start": 11,
      "end": 7
  },
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


  if (model_type == "pushups") {


    if (runningMode === "IMAGE") {
      runningMode = "VIDEO"
      poseLandmarker.setOptions({ runningMode: "VIDEO" })
    }
    let startTimeMs = performance.now()
    if (lastVideoTime !== video.currentTime) {
      lastVideoTime = video.currentTime
      poseLandmarker.detectForVideo(video, startTimeMs, result => {
        for (const landmark of result.landmarks) {
          var newLandmark = landmark.slice(11);
          drawingUtils.drawLandmarks(newLandmark, {
            radius: data => DrawingUtils.lerp(data.from.z, -0.15, 0.1, 5, 1)
          })
          
          drawingUtils.drawConnectors(newLandmark, POSE_CONNECTIONS_NO_FACE, { color: "#FFFFFF", lineWidth: 5 })
  
          
          if (1 == 2) {
            if (currentVerifyPushup >= verifyTimesPushup && currentStatusPushup == "push-downs") {
              countPushup = countPushup + 1;
              document.getElementById("pushupCount").innerHTML = countPushup;
              currentStatusPushup = "push-ups";
            } else if(newStatusPushup == "push-ups") {
              currentVerifyPushup = currentVerifyPushup + 1;
            } else {
              currentVerifyPushup = 0;
              newStatusPushup = "push-ups";
            }
          } else if (1 == 2) {
            if (currentVerifyPushup >= verifyTimesPushup && currentStatusPushup == "push-ups") {
              currentStatusPushup = "push-downs";
            } else if(newStatusPushup == "push-downs") {
              currentVerifyPushup = currentVerifyPushup + 1;
            } else {
              currentVerifyPushup = 0;
              newStatusPushup = "push-downs";
            }
          }
        }
      })
    }

    for (var i = 0; i < predictions.length && i < 1; i++) {
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
  } else if (model_type == "situps") {

    if (runningMode === "IMAGE") {
      runningMode = "VIDEO"
      poseLandmarker.setOptions({ runningMode: "VIDEO" })
    }
    let startTimeMs = performance.now()
    if (lastVideoTime !== video.currentTime) {
      lastVideoTime = video.currentTime
      poseLandmarker.detectForVideo(video, startTimeMs, result => {
        for (const landmark of result.landmarks) {
          var newLandmark = landmark.slice(11);
          drawingUtils.drawLandmarks(newLandmark, {
            radius: data => DrawingUtils.lerp(data.from.z, -0.15, 0.1, 5, 1)
          })
          
          drawingUtils.drawConnectors(newLandmark, POSE_CONNECTIONS_NO_FACE, { color: "#FFFFFF", lineWidth: 5 })

          if (1 == 2) {
            if (currentVerifySitup >= verifyTimesSitup && currentStatusSitup == "sit-down") {
              countSitup = countSitup + 1;
              document.getElementById("situpCount").innerHTML = countSitup;
              currentStatusSitup = "sit-up";
            } else if(newStatusSitup == "sit-up") {
              currentVerifySitup = currentVerifySitup + 1;
            } else {
              currentVerifySitup = 0;
              newStatusSitup = "sit-up";
            }
          } else if (1 == 2) {
            if (currentVerifySitup >= verifyTimesSitup && currentStatusSitup == "sit-up") {
              currentStatusSitup = "sit-down";
            } else if(newStatusSitup == "sit-down") {
              currentVerifySitup = currentVerifySitup + 1;
            } else {
              currentVerifySitup = 0;
              newStatusSitup = "sit-down";
            }
          }
        }
      })
    }


    let filteredPredictions = predictions.filter(prediction => prediction.class.toLowerCase().includes("sit"));

    for (var i = 0; i < filteredPredictions.length && i < 1; i++) {

      var confidence = filteredPredictions[i].confidence;
  
      if (confidence < user_confidence) {
        continue;
      }
  
      if (filteredPredictions[i].class in bounding_box_colors) {
        ctx.strokeStyle = bounding_box_colors[filteredPredictions[i].class];
      } else {
        var color =
          color_choices[Math.floor(Math.random() * color_choices.length)];
        ctx.strokeStyle = color;
        // remove color from choices
        color_choices.splice(color_choices.indexOf(color), 1);
        
        bounding_box_colors[filteredPredictions[i].class] = color;
      }
  
      var prediction = filteredPredictions[i];
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

  } else if (model_type == "squats") {
  
      if (runningMode === "IMAGE") {
        runningMode = "VIDEO"
        poseLandmarker.setOptions({ runningMode: "VIDEO" })
      }
      let startTimeMs = performance.now()
      if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime
        poseLandmarker.detectForVideo(video, startTimeMs, result => {
          for (const landmark of result.landmarks) {
            landmark.splice(0, 11)
            landmark.splice(2, 10);
            var newLandmark = landmark;
            drawingUtils.drawLandmarks(newLandmark, {
              radius: data => DrawingUtils.lerp(data.from.z, -0.15, 0.1, 5, 1)
            })


            if (newLandmark[2].y > newLandmark[4].y || newLandmark[2].y > newLandmark[5].y || newLandmark[3].y > newLandmark[4].y || newLandmark[3].y > newLandmark[5].y) {
              drawingUtils.drawConnectors(newLandmark, POSE_CONNECTIONS_SQUAT, { color: "#00FF00", lineWidth: 5 })
              if (currentVerifySquat >= verifyTimesSquat && currentStatusSquat == "squat-down") {
                countSquat = countSquat + 1;
                document.getElementById("squatCount").innerHTML = countSquat;
                currentStatusSquat = "squat-up";
              } else if(newStatusSquat == "squat-up") {
                currentVerifySquat = currentVerifySquat + 1;
              } else {
                currentVerifySquat = 0;
                newStatusSquat = "squat-up";
              }
            } else {
              drawingUtils.drawConnectors(newLandmark, POSE_CONNECTIONS_SQUAT, { color: "#FFFFFF", lineWidth: 5 })
              if (currentVerifySquat >= verifyTimesSquat && currentStatusSquat == "squat-up") {
                currentStatusSquat = "squat-down";
              } else if(newStatusSquat == "squat-down") {
                currentVerifySquat = currentVerifySquat + 1;
              } else {
                currentVerifySquat = 0;
                newStatusSquat = "squat-down";
              }
            }
          }
        })
      }

      let filteredPredictions = predictions.filter(prediction => prediction.class.toLowerCase().includes("squat"));

      for (var i = 0; i < filteredPredictions.length && i < 1; i++) {
        var confidence = filteredPredictions[i].confidence;
    
        if (confidence < user_confidence) {
          continue;
        }
    
        if (filteredPredictions[i].class in bounding_box_colors) {
          ctx.strokeStyle = bounding_box_colors[filteredPredictions[i].class];
        } else {
          var color =
            color_choices[Math.floor(Math.random() * color_choices.length)];
          ctx.strokeStyle = color;
          // remove color from choices
          color_choices.splice(color_choices.indexOf(color), 1);
          
          bounding_box_colors[filteredPredictions[i].class] = color;
        }
    
        var prediction = filteredPredictions[i];
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

function changeModel(modelName) {

  if (modelName == "pushup") {
    model_type = "pushups";
    document.getElementById("pushupCountContainer").style.display = "block";
    document.getElementById("situpCountContainer").style.display = "none";
    document.getElementById("squatCountContainer").style.display = "none";
    model_name = "push-up-ditection";
    model_version = 3;
  } else if (modelName == "situp") {
    model_type = "situps";
    document.getElementById("pushupCountContainer").style.display = "none";
    document.getElementById("situpCountContainer").style.display = "block";
    document.getElementById("squatCountContainer").style.display = "none";
    model_name = "p-s-s";
    model_version = 1;
  } else if (modelName == "squat") {
    model_type = "squats";
    document.getElementById("pushupCountContainer").style.display = "none";
    document.getElementById("situpCountContainer").style.display = "none";
    document.getElementById("squatCountContainer").style.display = "block";
    model_name = "p-s-s";
    model_version = 1;
    
  }

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

// Before we can use PoseLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
const createPoseLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  )
  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
      delegate: "GPU"
    },
    runningMode: runningMode,
    numPoses: 2
  })
}
createPoseLandmarker()


document.getElementById("webcamButton").addEventListener('click', webcamInference);
document.getElementById("mirror").addEventListener('click', changeMirror);
document.getElementById("clearArea").addEventListener('click', clearArea);
document.getElementById('confidence').addEventListener('input', changeConfidence);
document.getElementById("screenButton").addEventListener('click', screenInference);
document.getElementById("drawButton").addEventListener('click', drawInference);
document.getElementById("uploadedFile").addEventListener('change', function(event){
  handleFileSelect(event);
});

var labels = document.querySelectorAll('.switch-toggle.switch-3.switch-candy label');
labels.forEach((label) => {
  label.addEventListener('click', function () {
    var model = this.getAttribute('for');
    changeModel(model);
  });
});