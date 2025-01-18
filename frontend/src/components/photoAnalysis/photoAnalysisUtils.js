import * as faceapi from 'face-api.js';
import { loadPhotoModels } from '../../modules/models.js';

// Analyze a photo to detect faces and extract attributes
export async function analyzePhoto(image) {
  // Ensure that all necessary models are loaded
  await loadPhotoModels();

  // Perform face detection, extract landmarks, age, gender, expressions, and descriptors
  const detections = await faceapi.detectAllFaces(image)
    .withFaceLandmarks() // Detect facial landmarks (e.g., eyes, nose, mouth)
    .withAgeAndGender() // Detect age and gender
    .withFaceExpressions() // Detect facial expressions (e.g., happiness, sadness)
    .withFaceDescriptors(); // Extract face descriptors for comparison

  // Check if any faces were detected
  if (!detections.length) {
    throw new Error('No faces detected.'); // Throw an error if no faces are found
  }

  return detections; // Return the detected faces and their attributes
}

// Determine the dominant emotion from a set of detected expressions
export function getDominantEmotion(expressions) {
  return Object.keys(expressions).reduce((a, b) => (expressions[a] > expressions[b] ? a : b)); // Find the emotion with the highest probability
}
