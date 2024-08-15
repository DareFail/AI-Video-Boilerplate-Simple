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
var model_name = "push-up-ditection";
var model_version = 3;
var model_type = "pushups";

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

  if (model_type == "pushups") {

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
  
  

      if (predictions[i].class == "push-ups") {
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
      } else if (predictions[i].class == "push-downs") {
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
  } else if (model_type == "situps") {
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
  
  
      if (filteredPredictions[i].class == "sit-up") {
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
      } else if (filteredPredictions[i].class == "sit-down") {
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

  } else if (model_type == "squats") {

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
  
        
      if (filteredPredictions[i].class == "squat-up") {
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
      } else if (filteredPredictions[i].class == "squat-down") {
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