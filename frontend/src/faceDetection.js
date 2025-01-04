import * as faceapi from 'face-api.js';

export async function loadModels() {
    const MODEL_URL = '/models'; // Проверьте, что путь правильный
    try {
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
            faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        console.log('Все модели успешно загружены!');
    } catch (error) {
        console.error('Ошибка загрузки моделей:', error);
    }
}

let isAnalyzing = false;

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('overlay');
  const toggleCanvasPosition = document.getElementById('toggleCanvasPosition');
  const stopAnalysisButton = document.getElementById('stopAnalysis'); // Кнопка для остановки анализа

  // Обработчик изменения состояния чекбокса
  toggleCanvasPosition.addEventListener('change', (event) => {
    if (event.target.checked) {
      // Убираем `position: absolute`
      canvas.style.position = '';
    } else {
      // Добавляем `position: absolute`
      canvas.style.position = 'absolute';
    }
  });
   // Обработчик для кнопки остановки анализа
   stopAnalysisButton.addEventListener('click', () => {
    isAnalyzing = false; // Останавливаем анализ
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Очищаем canvas
    console.log('Analysis stopped.');
});
});


// Запуск камеры
export function startVideo() {
    const video = document.getElementById('video');
    navigator.mediaDevices
        .getUserMedia({ video: true }) // Убедитесь, что включена камера
        .then((stream) => {
            video.srcObject = stream;
            video.play(); // Убедитесь, что видео воспроизводится
            console.log('Камера запущена');
        })
        .catch((err) => {
            if (err.name === 'NotAllowedError') {
                alert('Доступ к камере был отклонён. Пожалуйста, разрешите использование камеры в настройках браузера.');
            } else if (err.name === 'NotFoundError') {
                alert('Камера не найдена. Проверьте, подключена ли она.');
            } else {
                console.error('Ошибка доступа к камере:', err);
            }
        });
}


export async function analyzeFaceRealTime() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('overlay');
    const ctx = canvas.getContext('2d');
    const infoList = document.getElementById('info-list');

    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    canvas.width = displaySize.width;
    canvas.height = displaySize.height;

    faceapi.matchDimensions(canvas, displaySize);

    async function analyzeFrame() {
        if (!isAnalyzing) return; // Если анализ остановлен, выходим из функции

        try {
            const confidenceThreshold = parseFloat(document.getElementById('confidenceThreshold').value) || 0.5;
            const enableLandmarks = document.getElementById('enableLandmarks').checked;
            const enableAgeGender = document.getElementById('enableAgeGender').checked;
            const enableEmotions = document.getElementById('enableEmotions').checked;
            const validConfidenceThreshold = Math.max(0, Math.min(1, confidenceThreshold));

            const fullAnalysis = !enableLandmarks && !enableAgeGender && !enableEmotions;

            let detections = await faceapi.detectAllFaces(
                video,
                new faceapi.SsdMobilenetv1Options({ minConfidence: validConfidenceThreshold })
            );

            if (fullAnalysis || enableLandmarks || enableAgeGender || enableEmotions) {
                detections = await faceapi
                    .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: validConfidenceThreshold }))
                    .withFaceLandmarks(fullAnalysis || enableLandmarks ? {} : undefined)
                    .withAgeAndGender(fullAnalysis || enableAgeGender ? {} : undefined)
                    .withFaceExpressions(fullAnalysis || enableEmotions ? {} : undefined);
            }

            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);

            if (fullAnalysis || enableLandmarks) {
                faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
            }

            if (resizedDetections.length > 0) {
                const detection = resizedDetections[0]; // Берем только первый объект для простоты
                const { age, gender, expressions } = detection;

                let result = [`Face 1:`];
                if (fullAnalysis || enableAgeGender) {
                    result.push(`Gender: ${gender || 'N/A'}`);
                    result.push(`Age: ${Math.round(age || 0)}`);
                }
                if ((fullAnalysis || enableEmotions) && expressions) {
                    const topExpression = Object.keys(expressions).reduce((a, b) =>
                        expressions[a] > expressions[b] ? a : b
                    );
                    result.push(`Emotion: ${topExpression}`);
                }

                // Добавляем данные в блок результатов
                infoList.innerHTML = ''; // Очищаем блок перед добавлением новых данных
                result.forEach((line) => {
                    const listItem = document.createElement('li');
                    listItem.textContent = line;
                    infoList.appendChild(listItem);
                });

                // Отображаем текст рядом с лицом
                const box = detection.detection.box;
                ctx.font = '14px Arial';
                ctx.fillStyle = 'white';
                result.forEach((line, i) => {
                    ctx.fillText(line, box.x - box.width / 2, box.y + i * 20); // Ближе к рамке
                });
            }
        } catch (error) {
            console.error('Error during face analysis:', error);
        }

        setTimeout(analyzeFrame, 100); // Выполняем анализ каждые 200 мс
    }

    // Устанавливаем флаг и запускаем анализ
    isAnalyzing = true;
    analyzeFrame();
}