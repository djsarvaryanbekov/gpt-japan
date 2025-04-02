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
    // Список пройденных шагов загружается напрямую в addXP, здесь не нужен
    if (currentLessonIndex >= lessons.length) currentLessonIndex = 0; // Сброс, если вышли за пределы
    updateUI();
}

function saveGameState() {
    localStorage.setItem("currentLessonIndex", currentLessonIndex);
    localStorage.setItem("currentXP", currentXP);
    localStorage.setItem("currentLevel", currentLevel);
    // Список пройденных шагов сохраняется напрямую в addXP
}

// --- Обновление UI ---
function updateUI() {
    if (!progressBarElement || !levelDisplayElement || !xpDisplayElement) return;
    const progressPercentage = xpPerLevel > 0 ? (currentXP / xpPerLevel) * 100 : 0;
    progressBarElement.style.width = Math.min(100, progressPercentage) + "%";
    levelDisplayElement.textContent = `Ур: ${currentLevel}`;
    xpDisplayElement.textContent = `XP: ${currentXP} / ${xpPerLevel}`;
}

// --- Логика Уроков ---

// Функция будет загружать данные от AI и обновлять все панели
async function loadLesson(index) {
    if (index < 0 || index >= lessons.length) {
        displayCompletionMessage();
        return;
    }
    const lessonInfo = lessons[index]; // Берем базовую инфу (тема, номер)

    // !!! ГЕНЕРАЦИЯ УНИКАЛЬНОГО ID ШАГА !!!
    const stepId = `lesson_${lessonInfo.lessonNumber}_step_${lessonInfo.step}`;

    // --- Получаем элементы DOM ---
    if (!lessonTitleElement || !gptOutputElement || !lessonContentElement || !optionsContainerElement || !newWordsListElement) {
        console.error("Не все элементы интерфейса найдены!");
        return;
    }
    const loadingIndicator = document.getElementById('loading-indicator');
    const feedbackElement = document.getElementById('feedback-message');

    // --- Подготовка UI к загрузке ---
    lessonTitleElement.textContent = `Урок ${lessonInfo.lessonNumber}, Шаг ${lessonInfo.step}: ${lessonInfo.topic}`;
    gptOutputElement.textContent = "Загрузка объяснения от AI...";
    lessonContentElement.innerHTML = "<p>Загрузка задания от AI...</p>";
    newWordsListElement.innerHTML = "<li>Загрузка слов...</li>";
    optionsContainerElement.innerHTML = '';
    optionsContainerElement.style.display = 'none';
    // Очистка фидбека и показ индикатора
    if (feedbackElement) feedbackElement.textContent = '';
    if (loadingIndicator) loadingIndicator.style.display = 'flex';

    // --- Формируем промпт для AI ---
    // TODO: Попросить AI генерировать stepId в будущем
    const prompt = `Ты учитель японского языка. Мы проходим Урок ${lessonInfo.lessonNumber}, тема: "${lessonInfo.topic}".
    1. Напиши краткое и понятное объяснение этой темы для новичка (для левой панели).
    2. Придумай одно интерактивное задание по этой теме (тип multipleChoice с 4 вариантами) (для центральной панели). Укажи правильный ответ текстом.
    3. Выдели 3-5 ключевых новых японских слов или фраз из твоего объяснения или задания (с переводом и/или чтением ромадзи) (для правой панели).

    Представь ответ ТОЛЬКО в формате JSON вот так, БЕЗ markdown оберток \`\`\`json ... \`\`\`:
    {
      "explanation": "Текст объяснения...",
      "exercise": {
        "type": "multipleChoice",
        "question": "Текст вопроса или задания...",
        "options": ["Вариант A", "Вариант B", "Вариант C", "Вариант D"],
        "correctAnswer": "Вариант C"
      },
      "newWords": [
        " слово1 (чтение1) - перевод1",
        " фраза2 (чтение2) - перевод2"
      ],
      "xp": 10
    }
    `;

    // --- Основная логика загрузки и обработки ---
    try {
        const aiResponseText = await callGeminiApi(prompt);
        // ОЧИСТКА ОТВЕТА ОТ MARKDOWN БЛОКОВ (на всякий случай, хотя просим не использовать)
        const cleanedResponseText = aiResponseText.replace(/^```json\s*/, '').replace(/```\s*$/, '');

        try {
            currentLessonData = JSON.parse(cleanedResponseText);

            // !!! СОХРАНЯЕМ СГЕНЕРИРОВАННЫЙ stepId В ДАННЫЕ УРОКА !!!
            currentLessonData.stepId = stepId;

            // --- Обновляем панели данными от AI ---
            gptOutputElement.textContent = currentLessonData.explanation || "AI не дал объяснение.";
            lessonContentElement.innerHTML = `<p>${currentLessonData.exercise?.question || "AI не дал задание."}</p>`;
            optionsContainerElement.innerHTML = '';

            if (currentLessonData.exercise?.type === 'multipleChoice' && currentLessonData.exercise.options) {
                currentLessonData.exercise.options.forEach((optionText) => {
                    const button = document.createElement('button');
                    button.textContent = optionText;
                    button.classList.add('option-btn');
                     // Делаем кнопки снова активными при загрузке нового урока
                    button.disabled = false;
                    button.onclick = () => checkAnswer(optionText, button);
                    optionsContainerElement.appendChild(button);
                });
                optionsContainerElement.style.display = 'block';
            } else {
                optionsContainerElement.style.display = 'none';
            }

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
            console.error("Очищенный ответ AI, который не удалось распарсить:", cleanedResponseText);
            gptOutputElement.textContent = "Ошибка обработки ответа от AI (неверный формат JSON).";
            lessonContentElement.innerHTML = "<p>Не удалось загрузить задание.</p>";
            newWordsListElement.innerHTML = "<li>Ошибка.</li>";
            currentLessonData = {}; // Сбрасываем данные урока
        }
    } catch (apiError) {
        console.error("Ошибка вызова API:", apiError);
        gptOutputElement.textContent = "Не удалось связаться с AI. Проверьте консоль (F12).";
        lessonContentElement.innerHTML = "<p>Ошибка загрузки.</p>";
        newWordsListElement.innerHTML = "<li>Ошибка.</li>";
        currentLessonData = {}; // Сбрасываем данные урока
    } finally {
        // Скрываем индикатор загрузки
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }

    // --- Обновление состояния и кнопок навигации ---
    if (prevButton) prevButton.style.visibility = index === 0 ? 'hidden' : 'visible';
    if (nextButton) nextButton.style.visibility = index >= lessons.length - 1 ? 'hidden' : 'visible';

    const buttonGroup = document.querySelector('.button-group');
    if(buttonGroup) buttonGroup.style.display = 'flex';

    // saveGameState здесь не нужен, т.к. он вызывается в addXP или при навигации
    updateUI();
}


// Функция проверки ответа
function checkAnswer(selectedAnswer, clickedButton) {
    if (!currentLessonData || !currentLessonData.exercise) return;

    const exercise = currentLessonData.exercise;
    const feedbackElement = document.getElementById('feedback-message');
    feedbackElement.textContent = '';
    feedbackElement.className = 'feedback';

    let isCorrect = false;

    // Блокируем все кнопки после ответа
    optionsContainerElement.querySelectorAll('.option-btn').forEach(btn => {
        btn.disabled = true;
    });

    if (exercise.type === 'multipleChoice') {
        isCorrect = (selectedAnswer === exercise.correctAnswer);
    }

    if (isCorrect) {
        console.log("Правильно!");
        if (clickedButton) clickedButton.classList.add('correct');
        feedbackElement.textContent = "Правильно! 🎉";
        feedbackElement.classList.add('correct');

        // !!! ИЗМЕНЕНО: Передаем ID шага в addXP !!!
        addXP(currentLessonData.xp || 10, currentLessonData.stepId);

    } else {
        console.log("Неправильно.");
        if (clickedButton) clickedButton.classList.add('incorrect');

        // Подсветить правильный ответ зеленым
        optionsContainerElement.querySelectorAll('.option-btn').forEach(btn => {
            if (btn.textContent === exercise.correctAnswer) {
                btn.classList.add('correct');
            }
        });

        const correctAnswerText = exercise.correctAnswer || "Ответ не указан";
        feedbackElement.textContent = `Неправильно. Правильный ответ: ${correctAnswerText} 🤔`;
        feedbackElement.classList.add('incorrect');
    }
}


function nextLesson() {
    if (currentLessonIndex < lessons.length - 1) {
        currentLessonIndex++;
        saveGameState(); // Сохраняем новый индекс перед загрузкой
        loadLesson(currentLessonIndex);
    } else {
        displayCompletionMessage();
    }
}

function prevLesson() {
    if (currentLessonIndex > 0) {
        currentLessonIndex--;
        saveGameState(); // Сохраняем новый индекс перед загрузкой
        loadLesson(currentLessonIndex);
    }
}


// --- МОДИФИЦИРОВАННАЯ ФУНКЦИЯ addXP ---
function addXP(amount, stepId) { // Добавляем stepId как аргумент
    if (!amount || amount <= 0) return;
    if (!stepId) {
        console.warn("Попытка добавить XP без ID шага.");
        return;
    }

    // Получаем список пройденных шагов из localStorage
    let completedSteps = [];
    const completedStepsJson = localStorage.getItem("completedSteps");
    if (completedStepsJson) {
        try {
            completedSteps = JSON.parse(completedStepsJson);
            if (!Array.isArray(completedSteps)) {
                 console.warn("completedSteps в localStorage - не массив, сбрасываем.");
                 completedSteps = [];
            }
        } catch (e) {
            console.error("Ошибка парсинга completedSteps из localStorage:", e);
            completedSteps = [];
        }
    }

    // Проверяем, был ли этот шаг уже пройден
    if (completedSteps.includes(stepId)) {
        console.log(`XP за шаг ${stepId} уже был начислен.`);
        return; // Выходим, если шаг уже пройден
    }

    // --- Если шаг новый ---
    console.log(`Начисляем ${amount} XP за новый шаг ${stepId}.`);
    currentXP += amount;

    // Добавляем ID шага в список пройденных
    completedSteps.push(stepId);
    localStorage.setItem("completedSteps", JSON.stringify(completedSteps)); // Сохраняем обновленный список

    // Проверка и повышение уровня
    while (currentXP >= xpPerLevel) {
        currentXP -= xpPerLevel;
        currentLevel++;
        console.log(`🎉 Новый уровень: ${currentLevel}! 🎉`);
        // TODO: Уведомление о новом уровне
    }

    // Сохраняем общее состояние игры и обновляем UI
    saveGameState(); // Сохраняем обновленные currentXP и currentLevel
    updateUI();
}


function displayCompletionMessage() {
    lessonTitleElement.textContent = "🎉 Поздравляем! 🎉";
    lessonContentElement.innerHTML = "<p>Все доступные темы пройдены!</p>";
    gptOutputElement.textContent = "Отличная работа!";
    newWordsListElement.innerHTML = "<li>Молодец!</li>";
    optionsContainerElement.innerHTML = '';
    optionsContainerElement.style.display = 'none'; // Скрываем контейнер опций
    if(feedbackElement) feedbackElement.textContent = ''; // Очищаем фидбек
    const buttonGroup = document.querySelector('.button-group');
    if(buttonGroup) buttonGroup.style.display = 'none'; // Скрываем кнопки навигации
    // Кнопки назад/вперед можно и не скрывать через visibility, раз скрыта вся группа
}

// --- Функция для вызова Google Gemini API ---
async function callGeminiApi(promptText) {
    // !!!!! ВСТАВЬ СЮДА СВОЙ САМЫЙ НОВЫЙ СЕКРЕТНЫЙ API КЛЮЧ !!!!!
    // !!!!! И НЕ ЗАГРУЖАЙ ЕГО В GITHUB !!!!!
    const API_KEY = "ТВОЙ_НОВЫЙ_СЕКРЕТНЫЙ_GEMINI_API_KEY"; // <--- ЗАМЕНИ ЭТО ЛОКАЛЬНО!!!

    // Проверка на пустой ключ для безопасности
    if (API_KEY === "ТВОЙ_НОВЫЙ_СЕКРЕТНЫЙ_GEMINI_API_KEY" || !API_KEY) {
        console.error("API Ключ не установлен! Пожалуйста, добавь его в scripts/app.js");
        throw new Error("API ключ не найден.");
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

    const requestBody = {
        contents: [{ parts: [{ text: promptText }] }],
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ]
    };

    console.log("Отправка запроса к Gemini API (v1beta, model gemini-1.5-flash-latest)...");

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
            // ... (Дополнительные сообщения об ошибках) ...
             throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("Ответ от Gemini API получен:", data);

        if (data.candidates && data.candidates.length > 0 &&
            data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0)
        {
            const generatedText = data.candidates[0].content.parts[0].text;
            console.log("Сгенерированный текст:", generatedText);
            return generatedText;
        } else if (data.promptFeedback) {
             console.warn("Запрос был заблокирован настройками безопасности:", data.promptFeedback);
             throw new Error(`Контент заблокирован: ${data.promptFeedback.blockReason || 'Причина не указана'}`);
        } else {
            console.warn("Неожиданная структура ответа от AI:", data);
            // Попытка извлечь текст из альтернативной структуры (если вдруг API изменится)
             if (data.candidates && data.candidates.length > 0 && data.candidates[0].text) {
                 console.log("Сгенерированный текст (альтернативная структура):", data.candidates[0].text);
                 return data.candidates[0].text;
             }
            throw new Error("Не удалось извлечь текст из ответа AI.");
        }

    } catch (error) {
        console.error("Критическая ошибка при вызове Gemini API:", error);
        throw error; // Перебрасываем ошибку, чтобы ее обработал вызывающий код (loadLesson)
    }
}

// --- Инициализация ---
document.addEventListener('DOMContentLoaded', () => {
    getDOMElements();

    if(prevButton) prevButton.onclick = prevLesson;
    if(nextButton) nextButton.onclick = nextLesson;

    loadGameState(); // Загружаем XP, уровень, индекс урока
    loadLesson(currentLessonIndex); // Загружаем данные для текущего урока (вызовет AI)
});