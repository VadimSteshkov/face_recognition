import { analyzePhoto } from '../photoAnalysis/photoAnalysisUtils.js'; 
import * as faceapi from 'face-api.js'; 

// Function to compare a face from a video feed with an uploaded image
export default async function compareFaces(videoElement, uploadedImage, infoListElement) {
  if (!uploadedImage) {
    alert('Please upload an image first!');
    return;
  }

  // Analyze the face in the video feed
  const videoDetections = await faceapi.detectSingleFace(
    videoElement,
    new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
  ).withFaceLandmarks().withFaceDescriptor();

  if (!videoDetections) {
    alert('No face detected in the video feed.');
    return;
  }

  // Analyze faces in the uploaded image
  const uploadedImageDetections = await faceapi.detectAllFaces(
    uploadedImage,
    new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
  ).withFaceLandmarks().withFaceDescriptors();

  if (!uploadedImageDetections.length) {
    alert('No faces detected in the uploaded image.');
    return;
  }

  // Clear previous results from the list
  infoListElement.innerHTML = '';

  // Get the canvas element and the uploaded image preview
  const canvas = document.getElementById('photoCanvas');
  const uploadedPreview = document.getElementById('uploadedPreview');

  // Get the dimensions and position of the uploaded image
  const rect = uploadedPreview.getBoundingClientRect();

  // Set the canvas dimensions to match the uploaded image
  canvas.width = rect.width;
  canvas.height = rect.height;

  // Get the canvas context AFTER setting its dimensions
  const context = canvas.getContext('2d');

  // Clear the canvas before drawing
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Style the canvas to overlay on top of the uploaded image
  canvas.style.position = 'absolute';
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  canvas.style.left = `${uploadedPreview.offsetLeft}px`; // Account for parent offset
  canvas.style.top = `${uploadedPreview.offsetTop}px`; // Account for parent offset
  canvas.style.zIndex = '2';
  canvas.style.pointerEvents = 'none'; // Prevent canvas from blocking interaction
  canvas.style.display = 'block';

  // Resize detections to fit the canvas dimensions
  const displaySize = { width: rect.width, height: rect.height };
  const resizedDetections = faceapi.resizeResults(uploadedImageDetections, displaySize);

  // Draw bounding boxes around all detected faces in the uploaded image
  resizedDetections.forEach((detection, index) => {
    const box = detection.detection.box;
    const color = `hsl(${(index * 60) % 360}, 100%, 50%)`;

    // Draw the bounding box
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.strokeRect(box.x, box.y, box.width, box.height);

    // Add a label for each face
    context.font = '16px Arial';
    context.fillStyle = color;
    context.fillText(`Face ${index + 1}`, box.x, box.y - 5);

    // Compare each face in the uploaded image with the face from the video feed
    const distance = faceapi.euclideanDistance(videoDetections.descriptor, detection.descriptor);
    const isSamePerson = distance < 0.6; // Threshold for similarity

    // Add comparison results to the list
    infoListElement.innerHTML += `
      <li style="color: ${color};">Face ${index + 1}:</li>
      <li>Similarity Score: ${distance.toFixed(2)}</li>
      <li>${isSamePerson ? 'Match Found: Same Person' : 'No Match: Different Person'}</li>
    `;
  });

  console.log('Face comparison complete.');
}




// Function to initialize photo comparison functionality
export function initializePhotoComparison() {
  
const uploadPhoto1 = document.getElementById('uploadPhoto1');
const uploadPhoto2 = document.getElementById('uploadPhoto2'); 
const photoPreview1 = document.getElementById('photoPreview1');
const photoPreview2 = document.getElementById('photoPreview2');
const comparePhotosButton = document.getElementById('comparePhotos');
const comparisonResults = document.getElementById('comparison-results');

// Handle the upload of the first photo
uploadPhoto1.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      photoPreview1.src = img.src;
      photoPreview1.style.display = 'block';
    };
  }
});

// Handle the upload of the second photo
uploadPhoto2.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      photoPreview2.src = img.src;
      photoPreview2.style.display = 'block';
    };
  }
});

// Handle photo comparison when the button is clicked
comparePhotosButton.addEventListener("click", async () => {
    try {
      // Check if both photos are uploaded
      if (!photoPreview1.src || !photoPreview2.src) {
        comparisonResults.innerHTML = "<li>Please upload both photos to compare.</li>";
        return;
      }
  
      // Remove old canvas elements if they exist
      const existingCanvas1 = photoPreview1.parentNode.querySelector("canvas");
      if (existingCanvas1) {
        existingCanvas1.remove();
      }
      const existingCanvas2 = photoPreview2.parentNode.querySelector("canvas");
      if (existingCanvas2) {
        existingCanvas2.remove();
      }
  
      // Analyze both photos to detect faces
      const detections1 = await analyzePhoto(photoPreview1);
      const detections2 = await analyzePhoto(photoPreview2);
  
      // Check if valid face descriptors are detected in both photos
      if (!detections1.length || !detections1[0].descriptor) {
        comparisonResults.innerHTML = "<li>No valid descriptors in Photo 1.</li>";
        return;
      }
      if (!detections2.length || !detections2[0].descriptor) {
        comparisonResults.innerHTML = "<li>No valid descriptors in Photo 2.</li>";
        return;
      }
  
      // Create and display canvas for the first photo
      const canvas1 = faceapi.createCanvasFromMedia(photoPreview1);
      canvas1.style.position = "absolute";
      canvas1.style.left = photoPreview1.offsetLeft + "px";
      canvas1.style.top = photoPreview1.offsetTop + "px";
      canvas1.style.width = photoPreview1.offsetWidth + "px";
      canvas1.style.height = photoPreview1.offsetHeight + "px";
      photoPreview1.parentNode.appendChild(canvas1);
  
      // Create and display canvas for the second photo
      const canvas2 = faceapi.createCanvasFromMedia(photoPreview2);
      canvas2.style.position = "absolute";
      canvas2.style.left = photoPreview2.offsetLeft + "px";
      canvas2.style.top = photoPreview2.offsetTop + "px";
      canvas2.style.width = photoPreview2.offsetWidth + "px";
      canvas2.style.height = photoPreview2.offsetHeight + "px";
      photoPreview2.parentNode.appendChild(canvas2);
  
      // Resize detections to fit the display size
      const displaySize1 = { width: photoPreview1.width, height: photoPreview1.height };
      const displaySize2 = { width: photoPreview2.width, height: photoPreview2.height };
      faceapi.matchDimensions(canvas1, displaySize1);
      faceapi.matchDimensions(canvas2, displaySize2);
  
      const resizedDetections1 = faceapi.resizeResults(detections1, displaySize1);
      const resizedDetections2 = faceapi.resizeResults(detections2, displaySize2);
  
      // Clear previous results
      comparisonResults.innerHTML = "";
  
      // Compare faces and display results
      resizedDetections1.forEach((face1, index1) => {
        const box1 = face1.detection.box;
        const color1 = `hsl(${(index1 * 60) % 360}, 100%, 50%)`;
  
        // Draw bounding box on the first photo
        const drawBox1 = new faceapi.draw.DrawBox(box1, { boxColor: color1, label: `Face ${index1 + 1}` });
        drawBox1.draw(canvas1);
  
        resizedDetections2.forEach((face2, index2) => {
          const box2 = face2.detection.box;
          const color2 = `hsl(${(index2 * 60 + 180) % 360}, 100%, 50%)`;
  
          // Draw bounding box on the second photo
          const drawBox2 = new faceapi.draw.DrawBox(box2, { boxColor: color2, label: `Face ${index2 + 1}` });
          drawBox2.draw(canvas2);
  
          // Calculate similarity between faces
          const distance = faceapi.euclideanDistance(face1.descriptor, face2.descriptor);
          const isSamePerson = distance < 0.6; // Threshold for similarity
  
          // Display comparison results
          comparisonResults.innerHTML += `
            <li style="color: ${color1}">Photo 1 - Face ${index1 + 1}:</li>
            <li style="color: ${color2}">Photo 2 - Face ${index2 + 1}:</li>
            <li>Similarity: ${isSamePerson ? "Same Person" : "Different People"}</li>
            <li>Distance: ${distance.toFixed(4)}</li>
          `;
        });
      });
    } catch (error) {
      // Handle and display errors
      console.error("Error comparing photos:", error);
      comparisonResults.innerHTML = `<li>Error comparing photos: ${error.message}</li>`;
    }
  });
}

// Function to initialize face comparison functionality
export function initializeFaceComparison() {
  const enableComparisonCheckbox = document.getElementById('enableComparison');
  const uploadImageInput = document.getElementById('uploadImage'); 
  const compareFacesButton = document.getElementById('compareFaces');
  const uploadedPreview = document.getElementById('uploadedPreview');
  const videoElement = document.getElementById('video'); 
  const faceComparisonResults = document.getElementById('face-comparison-results');

  let uploadedImage = null; // Variable to store the uploaded image

  // Check for missing elements
  if (!enableComparisonCheckbox || !uploadImageInput || !compareFacesButton || !uploadedPreview || !faceComparisonResults) {
    console.error('Missing elements for face comparison functionality');
    return;
  }

  // Toggle face comparison functionality
  enableComparisonCheckbox.addEventListener('change', (event) => {
    const enableComparison = event.target.checked;
    uploadImageInput.style.display = enableComparison ? 'block' : 'none';
    compareFacesButton.style.display = enableComparison ? 'block' : 'none';
    if (!enableComparison) uploadedPreview.style.display = 'none';
  });

  // Handle image upload for comparison
  uploadImageInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        // Clear the canvas
        const canvas = document.getElementById('photoCanvas');
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        faceComparisonResults.innerHTML = '';
        uploadedImage = img;
        uploadedPreview.src = img.src;
        uploadedPreview.style.display = 'block';
      };
    }
  });

  // Trigger face comparison when the button is clicked
  compareFacesButton.addEventListener('click', () => {
    compareFaces(videoElement, uploadedImage, faceComparisonResults);
    
  });
}
