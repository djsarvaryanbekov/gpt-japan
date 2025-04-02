// --- Структура данных уроков (пока статичная, будет заменена данными от AI) ---
const lessons = [
    {
        id: 1, lessonNumber: 1, step: 1, topic: "Приветствия (утро)",
        // Поля gptExplanation, exerciseType, content, options, correctAnswer, newWords - будут приходить от AI
    },
    {
        id: 2, lessonNumber: 1, step: 2, topic: "Приветствия (день)",
    },
    {
        id: 3, lessonNumber: 1, step: 3, topic: "Тест на приветствия (утро/день)",
    },
     {
        id: 4, lessonNumber: 1, step: 4, topic: "Приветствия (вечер)",
    },
    {
        id: 5, lessonNumber: 1, step: 5, topic: "Тест на приветствия (вечер)",
    }
    // ... Добавим больше тем позже
];

// --- Переменные состояния игры ---
let currentLessonIndex = 0;
let currentXP = 0;
let currentLevel = 1;
const xpPerLevel = 100;
let currentLessonData = {}; // Здесь будем хранить данные текущего урока, полученные от AI

// --- Элементы DOM ---
let lessonTitleElement, lessonContentElement, gptOutputElement, newWordsListElement, optionsContainerElement, prevButton, nextButton, progressBarElement, levelDisplayElement, xpDisplayElement;

function getDOMElements() {
    lessonTitleElement = document.getElementById('lesson-title');
    lessonContentElement = document.getElementById('lesson-content');
    gptOutputElement = document.getElementById('gpt-output');
    newWordsListElement = document.getElementById('new-words-list'); // Находим список слов
    optionsContainerElement = document.getElementById('options-container');
    progressBarElement = document.getElementById('progress');
    levelDisplayElement = document.getElementById('level-display');
    xpDisplayElement = document.getElementById('xp-display');
    const buttons = document.querySelectorAll('.button-group .btn');
    if (buttons.length === 2) {
        prevButton = buttons[0];
        nextButton = buttons[1];
    } else {
        console.error("Кнопки навигации не найдены!");
    }
}

// --- Сохранение/Загрузка состояния ---
function loadGameState() {
    currentLessonIndex = parseInt(localStorage.getItem("currentLessonIndex")) || 0;
    currentXP = parseInt(localStorage.getItem("currentXP")) || 0;
    currentLevel = parseInt(localStorage.getItem("currentLevel")) || 1;
    if (currentLessonIndex >= lessons.length) currentLessonIndex = 0; // Сброс, если вышли за пределы
    updateUI();
}

function saveGameState() {
    localStorage.setItem("currentLessonIndex", currentLessonIndex);
    localStorage.setItem("currentXP", currentXP);
    localStorage.setItem("currentLevel", currentLevel);
}

// --- Обновление UI ---
function updateUI() {
    if (!progressBarElement || !levelDisplayElement || !xpDisplayElement) return;
    const progressPercentage = xpPerLevel > 0 ? (currentXP / xpPerLevel) * 100 : 0;
    progressBarElement.style.width = Math.min(100, progressPercentage) + "%";
    levelDisplayElement.textContent = `Ур: ${currentLevel}`;
    xpDisplayElement.textContent = `XP: ${currentXP} / ${xpPerLevel}`;
}

// --- Логика Уроков (БУДЕТ СИЛЬНО ИЗМЕНЕНА ПОСЛЕ ИНТЕГРАЦИИ AI) ---

// Функция будет загружать данные от AI и обновлять все панели
async function loadLesson(index) {
    if (index < 0 || index >= lessons.length) {
        displayCompletionMessage();
        return;
    }
    const lessonInfo = lessons[index]; // Берем базовую инфу (тема, номер)

    // Отображаем заглушки, пока грузятся данные от AI
    lessonTitleElement.textContent = `Урок ${lessonInfo.lessonNumber}, Шаг ${lessonInfo.step}: ${lessonInfo.topic}`;
    gptOutputElement.textContent = "Загрузка объяснения от AI...";
    lessonContentElement.innerHTML = "<p>Загрузка задания от AI...</p>";
    newWordsListElement.innerHTML = "<li>Загрузка слов...</li>";
    optionsContainerElement.innerHTML = '';
    optionsContainerElement.style.display = 'none';

    // Формируем промпт для AI
    // TODO: Улучшить этот промпт, чтобы AI возвращал данные в структурированном виде (JSON?)
    const prompt = `Ты учитель японского языка. Мы проходим Урок ${lessonInfo.lessonNumber}, тема: "${lessonInfo.topic}".
    1. Напиши краткое и понятное объяснение этой темы для новичка (для левой панели).
    2. Придумай одно интерактивное задание по этой теме (например, multipleChoice с 4 вариантами или fillInBlank) (для центральной панели). Укажи правильный ответ.
    3. Выдели 3-5 ключевых новых японских слов или фраз из твоего объяснения или задания (с переводом или чтением ромадзи) (для правой панели).

    Представь ответ ТОЛЬКО в формате JSON вот так:
    {
      "explanation": "Текст объяснения...",
      "exercise": {
        "type": "multipleChoice", // или "fillInBlank", "translation" и т.д.
        "question": "Текст вопроса или задания...",
        "options": ["Вариант A", "Вариант B", "Вариант C", "Вариант D"], // Пусто для других типов
        "correctAnswer": "Вариант C" // Или индекс, или правильное слово/фраза
      },
      "newWords": [
        " слово1 (чтение1) - перевод1",
        " фраза2 (чтение2) - перевод2"
      ],
      "xp": 10 // Примерное кол-во XP за этот шаг
    }
    `;

	try {
		const aiResponseText = await callGeminiApi(prompt);

		// ОЧИСТКА ОТВЕТА ОТ MARKDOWN БЛОКОВ
		const cleanedResponseText = aiResponseText
			.replace(/^```json\s*/, '') // Удаляем ```json в начале (с возможным пробелом)
			.replace(/```\s*$/, '');    // Удаляем ``` в конце (с возможным пробелом)

		// Пытаемся распарсить ОЧИЩЕННУЮ строку JSON
		try {
			currentLessonData = JSON.parse(cleanedResponseText); // Используем cleanedResponseText

			// Обновляем панели данными от AI
			gptOutputElement.textContent = currentLessonData.explanation || "AI не дал объяснение.";

			 // Обновляем центральную панель
			lessonContentElement.innerHTML = `<p>${currentLessonData.exercise?.question || "AI не дал задание."}</p>`;
			optionsContainerElement.innerHTML = '';
			if (currentLessonData.exercise?.type === 'multipleChoice' && currentLessonData.exercise.options) {
				 currentLessonData.exercise.options.forEach((option, i) => {
					 const button = document.createElement('button');
					 button.textContent = option;
					 button.classList.add('option-btn');
					 button.onclick = () => checkAnswer(option, button);
					 optionsContainerElement.appendChild(button);
				 });
				 optionsContainerElement.style.display = 'block';
			} else {
				 optionsContainerElement.style.display = 'none';
			}

			// Обновляем правую панель (новые слова)
			newWordsListElement.innerHTML = '';
			if (currentLessonData.newWords && currentLessonData.newWords.length > 0) {
				currentLessonData.newWords.forEach(word => {
					const li = document.createElement('li');
					li.textContent = word;
					newWordsListElement.appendChild(li);
				});
			} else {
				newWordsListElement.innerHTML = "<li>Нет новых слов для этого шага.</li>";
			}

		} catch (parseError) {
			 console.error("Ошибка парсинга JSON ответа от AI:", parseError);
			 // Теперь выводим ОЧИЩЕННЫЙ текст, чтобы лучше видеть проблему
			 console.error("Очищенный ответ AI, который не удалось распарсить:", cleanedResponseText);
			 gptOutputElement.textContent = "Ошибка обработки ответа от AI (неверный формат JSON).";
			 lessonContentElement.innerHTML = "<p>Не удалось загрузить задание.</p>";
			 newWordsListElement.innerHTML = "<li>Ошибка.</li>";
		}

} catch (apiError) {
	// ... (обработка ошибок API остается такой же) ...
	console.error("Ошибка вызова API:", apiError);
	gptOutputElement.textContent = "Не удалось связаться с AI. Проверьте консоль (F12).";
	lessonContentElement.innerHTML = "<p>Ошибка загрузки.</p>";
	newWordsListElement.innerHTML = "<li>Ошибка.</li>";
}
// ... (остальная часть loadLesson) ...
    // Управляем видимостью кнопок навигации
    if(prevButton) prevButton.style.visibility = index === 0 ? 'hidden' : 'visible';
    if(nextButton) nextButton.style.visibility = 'visible'; // Пока всегда видима, кроме конца
    document.querySelector('.button-group').style.display = 'flex';

    saveGameState();
    updateUI();
}


// Функция проверки ответа (упрощенная, нужно будет адаптировать под разные типы заданий)
function checkAnswer(selectedAnswer, clickedButton) {
    if (!currentLessonData || !currentLessonData.exercise) return;

    const exercise = currentLessonData.exercise;
    let isCorrect = false;

     // Убираем классы и блокируем кнопки
     optionsContainerElement.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('correct', 'incorrect');
        btn.disabled = true;
     });

    if (exercise.type === 'multipleChoice') {
        // Сравниваем текст выбранной опции с текстом правильного ответа
        isCorrect = (selectedAnswer === exercise.correctAnswer);
    }
    // TODO: Добавить логику для других типов заданий

    if (isCorrect) {
        // Используем уже существующий элемент для вывода результата временно
        console.log("Правильно!"); // Лог для отладки
        if(clickedButton) clickedButton.classList.add('correct');
        addXP(currentLessonData.xp || 10); // Добавляем XP из ответа AI или по умолчанию
    } else {
        console.log("Неправильно."); // Лог для отладки
        if(clickedButton) clickedButton.classList.add('incorrect');
        // Подсветить правильный ответ
        optionsContainerElement.querySelectorAll('.option-btn').forEach(btn => {
             if (btn.textContent === exercise.correctAnswer) {
                 btn.classList.add('correct');
             }
        });
    }
     // Можно выводить результат в специальное место или правую панель (нужно решить)
     // checkResultElement.textContent = isCorrect ? 'Правильно!' : 'Неправильно';
}


function nextLesson() {
    if (currentLessonIndex < lessons.length - 1) {
        currentLessonIndex++;
        loadLesson(currentLessonIndex); // Загружаем следующий урок (вызовет AI)
    } else {
        displayCompletionMessage();
    }
}

function prevLesson() {
    if (currentLessonIndex > 0) {
        currentLessonIndex--;
        loadLesson(currentLessonIndex); // Загружаем предыдущий (вызовет AI)
    }
}

function addXP(amount) {
    if (!amount || amount <=0) return; // Не добавлять 0 или отрицательное XP
    currentXP += amount;
    console.log(`Добавлено ${amount} XP. Всего: ${currentXP}`);
    while (currentXP >= xpPerLevel) {
        currentXP -= xpPerLevel;
        currentLevel++;
        console.log(`🎉 Новый уровень: ${currentLevel}! 🎉`);
        // TODO: Уведомление о новом уровне
    }
    saveGameState();
    updateUI();
}

function displayCompletionMessage() {
    lessonTitleElement.textContent = "🎉 Поздравляем! 🎉";
    lessonContentElement.innerHTML = "<p>Все доступные темы пройдены!</p>";
    gptOutputElement.textContent = "Отличная работа!";
    newWordsListElement.innerHTML = "<li>Молодец!</li>";
    optionsContainerElement.innerHTML = '';
    if(prevButton) prevButton.style.visibility = 'hidden';
    if(nextButton) nextButton.style.visibility = 'hidden';
}

// --- Функция для вызова Google Gemini API ---
async function callGeminiApi(promptText) {
    // !!!!! ВСТАВЬ СЮДА СВОЙ САМЫЙ НОВЫЙ СЕКРЕТНЫЙ API КЛЮЧ !!!!!
    const API_KEY = "YA ETO UDALIL NAPRASNO CHTOBI V GIT OTPRAVIT"; // <--- ЗАМЕНИ ЭТО!!!

    // Проверка на пустой ключ для безопасности
    if (API_KEY === "ТВОЙ_НОВЫЙ_СЕКРЕТНЫЙ_GEMINI_API_KEY" || !API_KEY) {
        console.error("API Ключ не установлен! Пожалуйста, добавь его в scripts/app.js");
        throw new Error("API ключ не найден.");
    }

    // ИСПОЛЬЗУЕМ v1 API URL С МОДЕЛЬЮ gemini-1.5-flash-latest
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

    const requestBody = {
        contents: [{ parts: [{ text: promptText }] }],
         // Убрали generationConfig, т.к. responseMimeType вызывал ошибку в прошлый раз
         safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
         ]
    };

    console.log("Отправка запроса к Gemini API (v1, model gemini-1.5-flash-latest)..."); // Обновили лог

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ error: { message: "Не удалось прочитать тело ошибки" } }));
            console.error(`Ошибка API: ${response.status} ${response.statusText}`, errorBody);
            let errorMessage = `Ошибка API ${response.status}.`;
            if (errorBody.error && errorBody.error.message) {
                 errorMessage += ` Сообщение: ${errorBody.error.message}`;
            }
            if (response.status === 400) errorMessage += " Возможно, проблема в запросе или ключе.";
            if (response.status === 403) errorMessage += " Доступ запрещен. Проверьте ключ и включен ли API.";
            if (response.status === 429) errorMessage += " Слишком много запросов. Превышен лимит.";
            if (response.status === 404) errorMessage += " Ресурс не найден. Проверьте URL API и имя модели.";
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("Ответ от Gemini API получен:", data);

        if (data.candidates && data.candidates.length > 0 &&
            data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0)
        {
            const generatedText = data.candidates[0].content.parts[0].text;
            console.log("Сгенерированный текст:", generatedText);
            // В будущем здесь будем парсить JSON
            return generatedText;
        } else if (data.promptFeedback) {
             console.warn("Запрос был заблокирован настройками безопасности:", data.promptFeedback);
             throw new Error(`Контент заблокирован: ${data.promptFeedback.blockReason || 'Причина не указана'}`);
        } else {
            console.warn("Неожиданная структура ответа от AI:", data);
             if (data.candidates && data.candidates.length > 0 && data.candidates[0].text) {
                 console.log("Сгенерированный текст (альтернативная структура):", data.candidates[0].text);
                 return data.candidates[0].text;
             }
            throw new Error("Не удалось извлечь текст из ответа AI.");
        }

    } catch (error) {
        console.error("Критическая ошибка при вызове Gemini API:", error);
        throw error;
    }
}

// ... (остальной код в app.js) ...
// ... (остальной код в app.js остается без изменений) ...
// ... (остальной код в app.js остается без изменений) ...
// --- Инициализация ---
document.addEventListener('DOMContentLoaded', () => {
    getDOMElements();

    if(prevButton) prevButton.onclick = prevLesson;
    if(nextButton) nextButton.onclick = nextLesson;

    loadGameState(); // Загружаем XP, уровень, индекс урока
    loadLesson(currentLessonIndex); // Загружаем данные для текущего урока (вызовет AI)

    // Убираем тестовый вызов отсюда, так как loadLesson теперь сам вызывает AI
    // console.log("Запускаем тестовый вызов Gemini API...");
    // callGeminiApi("Привет! Скажи что-нибудь короткое.")
    //     .then(responseText => {
    //         console.log("Тестовый вызов завершен.");
    //     });
});