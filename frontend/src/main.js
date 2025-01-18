// Import necessary modules and components for initializing application functionality
import { loadModelsAndStartVideo } from './modules/models.js'; 
import { initializeNavigation } from './modules/navigation.js'; 
import { initializePhotoAnalysis, initializeFaceAnalysis } from './components/photoAnalysis/photoAndFaceAnalysis.js'; 
import { initializePhotoComparison, initializeFaceComparison } from './components/photoComparison/compareFaces.js'; 

// Ensures all modules and event listeners are initialized after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  loadModelsAndStartVideo(); // Load models and start video stream for real-time face analysis
  initializeFaceAnalysis(); // Initialize face analysis functionality
  initializeFaceComparison(); // Initialize face comparison functionality
  initializeNavigation(); // Set up navigation buttons and routes
  initializePhotoComparison(); // Initialize photo comparison functionality
  initializePhotoAnalysis(); // Initialize photo analysis functionality
});
