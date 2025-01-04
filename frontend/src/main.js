import { loadModels, startVideo, analyzeFaceRealTime } from './faceDetection.js';

document.addEventListener('DOMContentLoaded', () => {
  const startAnalysisButton = document.getElementById('startAnalysis');
  const confidenceThresholdInput = document.getElementById('confidenceThreshold');
  const confidenceValueDisplay = document.getElementById('confidenceValue');
  const clearResultsButton = document.getElementById('clearResults');
  const infoList = document.getElementById('info-list');
  const detectorOptions = document.getElementsByName('detector');
  const toggleCanvasPosition = document.getElementById('toggleCanvasPosition');
  
  let selectedDetector = 'ssd'; // Default to SSD Mobilenetv1

  // Проверка на наличие элементов DOM
  if (!startAnalysisButton || !confidenceThresholdInput || !confidenceValueDisplay || !infoList) {
    console.error('One or more necessary elements are missing from the DOM');
    return;
  }

  // Обновление значения Confidence Threshold
  confidenceThresholdInput.addEventListener('input', (e) => {
    confidenceValueDisplay.textContent = e.target.value;
  });

  // Обработчик изменения позиции Canvas
  if (toggleCanvasPosition) {
    const canvas = document.getElementById('overlay');
    toggleCanvasPosition.addEventListener('change', (event) => {
      if (event.target.checked) {
        canvas.style.position = '';
      } else {
        canvas.style.position = 'absolute';
      }
    });
  }

  // Обработчик для выбора детектора
  if (detectorOptions) {
    detectorOptions.forEach((option) => {
      option.addEventListener('change', (event) => {
        selectedDetector = event.target.value;
        console.log(`Selected detector: ${selectedDetector}`);
      });
    });
  }

  // Обработчик для кнопки "Clear Results"
  if (clearResultsButton) {
    clearResultsButton.addEventListener('click', () => {
      infoList.innerHTML = ''; // Очистка блока результатов
      console.log('Analysis results cleared');
    });
  }

  // Загрузка моделей, запуск видео и инициализация
  (async () => {
    try {
      console.log('Loading models...');
      await loadModels();
      console.log('Models loaded! Starting video...');
      startVideo();
    } catch (error) {
      console.error('Error during initialization:', error);
      alert('An error occurred while initializing the app. Please try again.');
    }
  })();

  // Обработчик для кнопки "Start Analysis"
  startAnalysisButton.addEventListener('click', () => {
    console.log('Start Analysis clicked');
    startAnalysisButton.textContent = 'Analyzing...';
    startAnalysisButton.disabled = true;

    // Запуск анализа с использованием выбранного детектора
    analyzeFaceRealTime(selectedDetector).finally(() => {
      startAnalysisButton.textContent = 'Start Analysis';
      startAnalysisButton.disabled = false;
    });
  });
});
