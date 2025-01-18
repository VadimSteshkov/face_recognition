import * as faceapi from 'face-api.js'; 

// Function to load the necessary face detection models
export async function loadModels() {
    const MODEL_URL = '/models';
    try {
        // Load all required models for face detection, landmarks, age, gender, expressions, and recognition
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
            faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        console.log('All models have been successfully loaded!');
    } catch (error) {
        console.error('Error loading models:', error); // Log errors if models fail to load
    }
}

// Flags to control analysis states
let isAnalyzing = false; // Indicates if analysis is currently running
let isResultCaptured = false; // Indicates if results have been captured

// Event listener for DOMContentLoaded to initialize canvas and button functionality
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('overlay'); // Canvas for rendering face analysis
  const toggleCanvasPosition = document.getElementById('toggleCanvasPosition'); // Checkbox to toggle canvas position
  const stopAnalysisButton = document.getElementById('stopAnalysis'); // Button to stop the analysis

  // Event listener to toggle canvas position between absolute and relative
  toggleCanvasPosition.addEventListener('change', (event) => {
    if (event.target.checked) {
      canvas.style.position = ''; // Remove absolute positioning
    } else {
      canvas.style.position = 'absolute'; // Apply absolute positioning
    }
  });

  // Event listener to stop the analysis and clear the canvas
  stopAnalysisButton.addEventListener('click', () => {
    isAnalyzing = false; // Stop analysis
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    console.log('Analysis stopped.');
  });
});

// Function to start the video stream for real-time face analysis
export function startVideo() {
    const video = document.getElementById('video');
    navigator.mediaDevices
        .getUserMedia({ video: true }) // Request access to the user's camera
        .then((stream) => {
            video.srcObject = stream; // Set the video stream as the source
            video.play(); // Start playing the video stream
            console.log('Camera started');
        })
        .catch((err) => {
            // Handle errors based on their type
            if (err.name === 'NotAllowedError') {
                alert('Camera access was denied. Please enable camera permissions in your browser settings.');
            } else if (err.name === 'NotFoundError') {
                alert('No camera found. Please ensure your camera is connected.');
            } else {
                console.error('Error accessing camera:', err);
            }
        });
}

// Function for real-time face analysis using the video feed
export async function analyzeFaceRealTime() {
  const video = document.getElementById('video'); 
  const canvas = document.getElementById('overlay');
  const ctx = canvas.getContext('2d'); 
  const faceAnalysisResults = document.getElementById('face-analysis-results');

  const displaySize = { width: video.videoWidth, height: video.videoHeight }; // Get video dimensions
  canvas.width = displaySize.width;
  canvas.height = displaySize.height;

  faceapi.matchDimensions(canvas, displaySize); // Match canvas dimensions to video dimensions

  let lastFixedResults = null; // Store the most recent analysis results
  let isAnalyzingFrame = false; // Prevent overlapping frame analysis

  // Function to analyze a single frame
  async function analyzeFrame() {
      if (!isAnalyzing || isAnalyzingFrame) return; // Skip if already analyzing
      isAnalyzingFrame = true;

      try {
          // Get user settings for confidence threshold and enabled features
          const confidenceThreshold = parseFloat(document.getElementById('confidenceThreshold').value) || 0.5;
          const enableLandmarks = document.getElementById('enableLandmarks').checked;
          const enableAgeGender = document.getElementById('enableAgeGender').checked;
          const enableEmotions = document.getElementById('enableEmotions').checked;

          const fullAnalysis = enableLandmarks || enableAgeGender || enableEmotions;

          // Perform face detection and optionally include additional analyses
          let detections = await faceapi.detectAllFaces(
              video,
              new faceapi.SsdMobilenetv1Options({ minConfidence: confidenceThreshold })
          );

          if (fullAnalysis) {
              detections = await faceapi
                  .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: confidenceThreshold }))
                  .withFaceLandmarks(enableLandmarks ? {} : undefined)
                  .withAgeAndGender(enableAgeGender ? {} : undefined)
                  .withFaceExpressions(enableEmotions ? {} : undefined);
          }

          // Resize detections to match the display size
          const resizedDetections = faceapi.resizeResults(detections, displaySize);

          // Clear the canvas before rendering new detections
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, resizedDetections); // Draw detection boxes

          // Draw landmarks if enabled
          if (enableLandmarks) {
              faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
          }

          // Analyze and display results for the first detected face
          if (resizedDetections.length > 0) {
              const detection = resizedDetections[0];
              const { age, gender, expressions } = detection || {};

              // Determine the top expression if emotions are enabled
              const topExpression = enableEmotions
                  ? Object.keys(expressions || {}).reduce((a, b) =>
                      expressions[a] > expressions[b] ? a : b
                  )
                  : 'N/A';

              // Create a dynamic result string based on enabled features
              const dynamicResult = [
                  enableAgeGender && gender ? `Gender: ${gender}` : null,
                  enableAgeGender && age ? `Age: ${Math.round(age)}` : null,
                  enableEmotions && topExpression ? `Emotion: ${topExpression}` : null,
              ].filter(Boolean);

              // Draw text with analysis results near the detection box
              resizedDetections.forEach((detection) => {
                if (detection && detection.detection && detection.detection.box) {
                    const box = detection.detection.box;
                    ctx.font = '14px Arial';
                    ctx.fillStyle = 'white';
                    const singleLineText = dynamicResult.join(' | '); 
                    ctx.fillText(singleLineText, box.x, box.y + box.height + 20); 
                }
            });

              // Save the results for fixed display
              lastFixedResults = {
                  gender: gender || 'N/A',
                  age: Math.round(age) || 'N/A',
                  emotion: topExpression || 'N/A',
              };
          }
      } catch (error) {
          console.error('Error during face analysis:', error); // Log errors
      } finally {
          isAnalyzingFrame = false; // Reset the frame analysis flag
          setTimeout(analyzeFrame, 500); // Schedule the next frame analysis
      }
  }

  // Event listener for the "Start Analysis" button to display fixed results
  document.getElementById('startAnalysis').addEventListener('click', () => {
      if (lastFixedResults) {
          faceAnalysisResults.innerHTML = `
              <li>Gender: ${lastFixedResults.gender}</li>
              <li>Age: ${lastFixedResults.age}</li>
              <li>Emotion: ${lastFixedResults.emotion}</li>
          `;
          console.log('Fixed results displayed:', lastFixedResults);
      } else {
          faceAnalysisResults.innerHTML = '<li>No face detected during last analysis.</li>';
          console.log('No results to display.');
      }
  });

  isAnalyzing = true; // Enable the analysis process
  analyzeFrame(); // Start analyzing frames
}
