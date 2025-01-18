import { analyzePhoto, getDominantEmotion } from './photoAnalysisUtils.js'; 
import { analyzeFaceRealTime } from '../faceAnalysis/realTimeFaceAnalysis.js'; 
import * as faceapi from 'face-api.js'; 
// Function to initialize photo analysis functionality
export function initializePhotoAnalysis() {
    const uploadPhotoInput = document.getElementById('uploadPhoto');
    const photoPreview = document.getElementById('photoPreview'); 
    const analyzePhotoButton = document.getElementById('analyzePhoto');
    const photoAnalysisResults = document.getElementById('photo-analysis-results');

    // Handle photo upload
    uploadPhotoInput.addEventListener('change', (event) => {
        const file = event.target.files[0]; // Get the uploaded file
        if (file) {
            const img = new Image();
            img.src = URL.createObjectURL(file); // Create a URL for the uploaded image
            img.onload = () => {
                photoPreview.src = img.src; // Set the preview image source
                photoPreview.style.display = 'block'; // Display the preview image
                analyzePhotoButton.style.display = 'block'; // Display the analyze button

                // Remove existing Canvas if present
                const existingCanvas = document.querySelector('canvas');
                if (existingCanvas) {
                    existingCanvas.remove();
                }
            };
        }
    });

    // Handle photo analysis
    analyzePhotoButton.addEventListener('click', async () => {
        try {
            // Remove existing Canvas if present
            const existingCanvas = document.querySelector('canvas');
            if (existingCanvas) {
                existingCanvas.remove();
            }

            // Create a new Canvas for face detection
            const canvas = faceapi.createCanvasFromMedia(photoPreview);
            canvas.style.position = 'absolute';
            canvas.style.left = `${photoPreview.offsetLeft}px`;
            canvas.style.top = `${photoPreview.offsetTop}px`;
            canvas.style.width = `${photoPreview.offsetWidth}px`;
            canvas.style.height = `${photoPreview.offsetHeight}px`;
            photoPreview.parentNode.appendChild(canvas);

            const displaySize = { width: photoPreview.width, height: photoPreview.height };
            faceapi.matchDimensions(canvas, displaySize); // Adjust Canvas dimensions to match the image

            const detections = await analyzePhoto(photoPreview); // Analyze the uploaded photo
            const resizedDetections = faceapi.resizeResults(detections, displaySize); // Resize detections to fit Canvas

            // Clear previous analysis results
            photoAnalysisResults.innerHTML = '';

            // Process each detected face
            resizedDetections.forEach((detection, index) => {
                const box = detection.detection.box; // Get the face bounding box
                const color = `hsl(${(index * 60) % 360}, 100%, 50%)`; // Generate a unique color for each face

                // Draw bounding box and label on Canvas
                const drawBox = new faceapi.draw.DrawBox(box, {
                    label: `Person ${index + 1} - Age: ${Math.round(detection.age)}, Gender: ${detection.gender}`,
                    boxColor: color,
                });
                drawBox.draw(canvas);

                // Append analysis results to the list
                photoAnalysisResults.innerHTML += `
                    <li style="color: ${color}">Person ${index + 1}:</li>
                    <li>Age: ${Math.round(detection.age)}</li>
                    <li>Gender: ${detection.gender}</li>
                    <li>Emotion: ${getDominantEmotion(detection.expressions)}</li>
                    <li>Smile Probability: ${(detection.expressions.happy || 0).toFixed(2)}</li>
                `;
            });
        } catch (error) {
            console.error('Error analyzing photo:', error);
            photoAnalysisResults.innerHTML = 'Error analyzing photo.'; // Display error message
        }
    });
}

// Function to initialize real-time face analysis functionality
export function initializeFaceAnalysis() {
    const startAnalysisButton = document.getElementById('startAnalysis'); 
    const confidenceThresholdInput = document.getElementById('confidenceThreshold'); 
    const confidenceValueDisplay = document.getElementById('confidenceValue');
    const faceAnalysisResults = document.getElementById('face-analysis-results');
    const faceComparisonResults = document.getElementById('face-comparison-results');
    const clearResultsButton = document.getElementById('clearResults');

    // Validate required elements
    if (!startAnalysisButton || !confidenceThresholdInput || !confidenceValueDisplay || !faceAnalysisResults) {
        console.error('Missing elements for face analysis functionality');
        return;
    }

    // Update confidence threshold display
    confidenceThresholdInput.addEventListener('input', (e) => {
        confidenceValueDisplay.textContent = e.target.value;
    });

    // Clear analysis results
    clearResultsButton.addEventListener('click', () => {
        faceAnalysisResults.innerHTML = '';
        faceComparisonResults.innerHTML = '';
        console.log('Analysis results cleared');
    });

    // Start real-time face analysis
    startAnalysisButton.addEventListener('click', () => {
        console.log('Start Analysis clicked');
        startAnalysisButton.textContent = 'Analyzing...'; // Update button text
        startAnalysisButton.disabled = true; // Disable button during analysis

        analyzeFaceRealTime().finally(() => {
            startAnalysisButton.textContent = 'Start Analysis'; // Reset button text
            startAnalysisButton.disabled = false; // Enable button
        });
    });
}
