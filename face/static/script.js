// To display predictions, this app has:
// 1. A video that shows a feed from the user's webcam
// 2. A canvas that appears over the video and shows predictions
// When the page loads, a user is asked to give webcam permission.
// After this happens, the model initializes and starts to make predictions
// On the first prediction, an initialiation step happens in detectFrame()
// to prepare the canvas on which predictions are displayed.
import {
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils
} from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0"

var bounding_box_colors = {};

var user_confidence = 0.6;
var confidence_threshold = 0.1;
var model_name = "microsoft-coco";
var model_version = 9;
var video;

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

const imageBlendShapes = document.getElementById("image-blend-shapes")
const videoBlendShapes = document.getElementById("video-blend-shapes")
let faceLandmarker
let runningMode = "IMAGE"
let lastVideoTime = -1
let results = undefined
const drawingUtils = new DrawingUtils(ctx)


function detectFrame() {
  // On first run, initialize a canvas
  // On all runs, run inference using a video frame
  // For each video frame, draw bounding boxes on the canvas
  if (!modelWorkerId) return requestAnimationFrame(detectFrame);

  if (runningMode === "IMAGE") {
    runningMode = "VIDEO"
    faceLandmarker.setOptions({ runningMode: runningMode })
  }
  let startTimeMs = performance.now()
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime
    results = faceLandmarker.detectForVideo(video, startTimeMs)
  }
  if (results.faceLandmarks) {
    for (const landmarks of results.faceLandmarks) {
      var newLandmarks = landmarks;
      if (shouldMirrorVideo) {
          newLandmarks = landmarks.map(obj => ({
            ...obj,
            x: 1 - obj.x
          }));
      }
      drawingUtils.drawConnectors(
        newLandmarks,
        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
        { color: "#C0C0C070", lineWidth: 1 }
      )
      drawingUtils.drawConnectors(
        newLandmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
        { color: "#FF3030" }
      )
      drawingUtils.drawConnectors(
        newLandmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
        { color: "#FF3030" }
      )
      drawingUtils.drawConnectors(
        newLandmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
        { color: "#30FF30" }
      )
      drawingUtils.drawConnectors(
        newLandmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
        { color: "#30FF30" }
      )
      drawingUtils.drawConnectors(
        newLandmarks,
        FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
        { color: "#E0E0E0" }
      )
      drawingUtils.drawConnectors(
        newLandmarks,
        FaceLandmarker.FACE_LANDMARKS_LIPS,
        { color: "#E0E0E0" }
      )
      drawingUtils.drawConnectors(
        newLandmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
        { color: "#FF3030" }
      )
      drawingUtils.drawConnectors(
        newLandmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
        { color: "#30FF30" }
      )
    }
  }
  drawBlendShapes(videoBlendShapes, results.faceBlendshapes)

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




// Before we can use HandLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
async function createFaceLandmarker() {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  )
  faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      delegate: "GPU"
    },
    outputFaceBlendshapes: true,
    runningMode,
    numFaces: 1
  })
}
createFaceLandmarker()



function drawBlendShapes(el, blendShapes) {
  if (!blendShapes.length) {
    return
  }

  let htmlMaker = ""
  blendShapes[0].categories.map(shape => {
    htmlMaker += `
      <li class="blend-shapes-item">
        <span class="blend-shapes-label">${shape.displayName ||
          shape.categoryName}</span>
        <span class="blend-shapes-value" style="width: calc(${+shape.score *
          100}% - 120px)">${(+shape.score).toFixed(4)}</span>
      </li>
    `
  })

  el.innerHTML = htmlMaker
}


document.getElementById("webcamButton").addEventListener('click', webcamInference);
document.getElementById("mirror").addEventListener('click', changeMirror);
document.getElementById("screenButton").addEventListener('click', screenInference);
document.getElementById("uploadedFile").addEventListener('change', function(event){
  handleFileSelect(event);
});