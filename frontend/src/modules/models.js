import { loadModels, startVideo } from '../components/faceAnalysis/realTimeFaceAnalysis.js';
import * as faceapi from 'face-api.js';

// This function loads face detection models and starts the video stream for real-time analysis
export async function loadModelsAndStartVideo() {
  try {
    console.log('Loading models...');
    await loadModels(); // Load the required face detection and analysis models
    console.log('Models loaded! Starting video...');
    startVideo(); // Start the video stream for real-time face analysis
  } catch (error) {
    console.error('Error during model initialization:', error);
  }
}

// This function loads models specifically for photo analysis
export async function loadPhotoModels() {
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/models'); // Load the SSD MobileNet model for face detection
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models'); // Load the model for detecting facial landmarks
    await faceapi.nets.ageGenderNet.loadFromUri('/models'); // Load the model for age and gender estimation
    await faceapi.nets.faceExpressionNet.loadFromUri('/models'); // Load the model for facial expression (emotion) recognition
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models'); // Load the model for face recognition and descriptor generation
}
