export function initializeNavigation() {
  // Button to navigate to the photo analysis page
  const openPhotoAnalysisButton = document.getElementById('openPhotoAnalysis');
  if (openPhotoAnalysisButton) {
      openPhotoAnalysisButton.addEventListener('click', () => {
          window.location.href = './src/pages/face-analysis.html'; // Redirects to the face analysis page
      });
  }

  // Button to return to the main page
  const backToMainButton = document.getElementById('backToMain');
  if (backToMainButton) {
      backToMainButton.addEventListener('click', () => {
          window.location.href = '/index.html'; // Redirects to the main page
      });
  }
}
