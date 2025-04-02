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
let lessonTitleElement, lessonContentElement, gptOutputElement, newWordsListElement, optionsContainerElement, prevButton, nextButton, progressBarElement, levelDisplayElement, xpDisplayElement, feedbackElement; // Добавили feedbackElement

function getDOMElements() {
	lessonTitleElement = document.getElementById('lesson-title');
	lessonContentElement = document.getElementById('lesson-content');
	gptOutputElement = document.getElementById('gpt-output');
	newWordsListElement = document.getElementById('new-words-list');
	optionsContainerElement = document.getElementById('options-container');
	progressBarElement = document.getElementById('progress');
	levelDisplayElement = document.getElementById('level-display');
	xpDisplayElement = document.getElementById('xp-display');
	feedbackElement = document.getElementById('feedback-message'); // Получаем элемент фидбека
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
	if (currentLessonIndex >= lessons.length) currentLessonIndex = 0;
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

// --- Логика Уроков ---

async function loadLesson(index) {
	if (index < 0 || index >= lessons.length) {
		displayCompletionMessage();
		return;
	}
	const lessonInfo = lessons[index];
	const stepId = `lesson_${lessonInfo.lessonNumber}_step_${lessonInfo.step}`;

	if (!lessonTitleElement || !gptOutputElement || !lessonContentElement || !optionsContainerElement || !newWordsListElement || !feedbackElement) {
		console.error("Не все элементы интерфейса найдены!");
		return;
	}
	const loadingIndicator = document.getElementById('loading-indicator');

	// --- Подготовка UI к загрузке ---
	lessonTitleElement.textContent = `Урок ${lessonInfo.lessonNumber}, Шаг ${lessonInfo.step}: ${lessonInfo.topic}`;
	gptOutputElement.textContent = "Загрузка объяснения от AI...";
	lessonContentElement.innerHTML = "<p>Загрузка задания от AI...</p>";
	newWordsListElement.innerHTML = "<li>Загрузка слов...</li>";
	optionsContainerElement.innerHTML = '';
	optionsContainerElement.style.display = 'none';
	feedbackElement.textContent = ''; // Очистка фидбека
	feedbackElement.className = 'feedback'; // Сброс классов фидбека
	if (loadingIndicator) loadingIndicator.style.display = 'flex';

	// --- ОБНОВЛЕННЫЙ Промпт для AI ---
	const prompt = `Ты AI-ассистент для создания контента веб-приложения "Японский Учитель-Игра", обучающего японскому языку по учебнику "Minna no Nihongo" с нуля до N4.
Текущий урок: ${lessonInfo.lessonNumber}. Тема шага: "${lessonInfo.topic}". Уровень: JLPT N5.

Создай контент для этого шага. Верни ТОЛЬКО валидный JSON объект без каких-либо комментариев, пояснений или Markdown оберток типа \`\`\`json ... \`\`\`.

Структура JSON должна быть следующей:
{
  "explanation": "Краткое и понятное объяснение темы '${lessonInfo.topic}' на русском языке для новичка. Можно включить 1-2 примера.",
  "exercise": {
    // Выбери ОДИН из следующих типов упражнений, наиболее подходящий для темы:
    // Вариант 1: Тест с выбором ответа
    "type": "multipleChoice", // УКАЖИ ЗДЕСЬ ВЫБРАННЫЙ ТИП ('multipleChoice' или 'fillInBlank')
    "question": "Вопрос по теме '${lessonInfo.topic}'",
    "options": [ // Для multipleChoice: 3-4 варианта в виде ОБЪЕКТОВ
      { "text": "Вариант ответа 1 (неверный)", "isCorrect": false },
      { "text": "Вариант ответа 2 (верный)", "isCorrect": true },
      { "text": "Вариант ответа 3 (неверный)", "isCorrect": false }
    ]
    // --- ИЛИ ---
    // Вариант 2: Вставить пропущенное слово/частицу
    // "type": "fillInBlank",
    // "question": "Предложение на японском или русском с пропуском ___ по теме '${lessonInfo.topic}'.", // Пример: "わたし ___ マイク です。"
    // "options": ["вариант1", "вариант2", "правильный", "вариант4"], // Для fillInBlank: 3-4 варианта для вставки (строки)
    // "correctAnswer": "правильный" // Для fillInBlank: Правильное слово/частица для вставки (строка)
  },
  "newWords": [ // 3-5 ключевых новых японских слов/фраз из объяснения или задания
    "слово1 (чтение1) - перевод1",
    "фраза2 (чтение2) - перевод2"
  ],
  "xp": 15 // Количество XP за правильный ответ (например, 10-20)
}

Пожалуйста, сгенерируй контент для темы "${lessonInfo.topic}". Убедись, что тип упражнения ('type') указан и соответствует выбранной структуре ('options', 'correctAnswer' если нужно).
`;

	try {
		const aiResponseText = await callGeminiApi(prompt);
		const cleanedResponseText = aiResponseText.replace(/^```json\s*/, '').replace(/```\s*$/, '');

		try {
			currentLessonData = JSON.parse(cleanedResponseText);
			currentLessonData.stepId = stepId; // Добавляем наш ID

			// --- Обновляем панели ---
			gptOutputElement.textContent = currentLessonData.explanation || "AI не дал объяснение.";
			lessonContentElement.innerHTML = `<p>${currentLessonData.exercise?.question || "AI не дал задание."}</p>`;
			optionsContainerElement.innerHTML = '';
			optionsContainerElement.style.display = 'none'; // Сначала скрываем

			const exercise = currentLessonData.exercise;

			// --- ОБНОВЛЕННАЯ ЛОГИКА РЕНДЕРИНГА УПРАЖНЕНИЙ ---
			if (exercise && exercise.options && exercise.options.length > 0) {
				if (exercise.type === 'multipleChoice') {
					console.log("Рендерим Multiple Choice");
					// Проверка формата options для multipleChoice
					if (typeof exercise.options[0] !== 'object' || exercise.options[0] === null || typeof exercise.options[0].isCorrect === 'undefined') {
						console.error("Неверный формат options для multipleChoice:", exercise.options);
						throw new Error("Неверный формат options для multipleChoice от AI."); // Вызываем ошибку, чтобы показать сообщение пользователю
					}
					exercise.options.forEach(option => {
						const button = document.createElement('button');
						button.textContent = option.text;
						button.classList.add('option-btn');
						button.disabled = false;
						button.dataset.correct = option.isCorrect; // 'true' или 'false'
						button.onclick = () => checkAnswer(null, button); // Передаем null и кнопку
						optionsContainerElement.appendChild(button);
					});
					optionsContainerElement.style.display = 'block';

				} else if (exercise.type === 'fillInBlank') {
					console.log("Рендерим Fill In Blank");
					// Проверка формата options для fillInBlank
					if (typeof exercise.options[0] !== 'string') {
						console.error("Неверный формат options для fillInBlank:", exercise.options);
						throw new Error("Неверный формат options для fillInBlank от AI.");
					}
					if (!exercise.correctAnswer || typeof exercise.correctAnswer !== 'string') {
						console.error("Отсутствует или неверный формат correctAnswer для fillInBlank:", exercise.correctAnswer);
						throw new Error("Отсутствует correctAnswer для fillInBlank от AI.");
					}

					exercise.options.forEach(optionText => {
						const button = document.createElement('button');
						button.textContent = optionText;
						button.classList.add('option-btn');
						button.disabled = false;
						button.onclick = () => checkAnswer(optionText, button); // Передаем текст и кнопку
						optionsContainerElement.appendChild(button);
					});
					optionsContainerElement.style.display = 'block';
				} else {
					console.warn("Неизвестный тип упражнения от AI:", exercise.type);
					// Можно отобразить сообщение об ошибке или пропустить упражнение
					lessonContentElement.innerHTML += "<p>(Неизвестный тип упражнения)</p>";
				}
			} else {
				console.log("Нет опций для отображения или отсутствует блок exercise.");
				// Можно скрыть контейнер опций или показать сообщение
				optionsContainerElement.style.display = 'none';
			}
			// --- КОНЕЦ ЛОГИКИ РЕНДЕРИНГА ---

			// Обновляем новые слова
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
			console.error("Ошибка парсинга JSON или обработки данных:", parseError);
			console.error("Очищенный ответ AI, который не удалось обработать:", cleanedResponseText);
			gptOutputElement.textContent = "Ошибка обработки ответа от AI.";
			lessonContentElement.innerHTML = `<p>Не удалось загрузить задание. Ошибка: ${parseError.message}</p>`;
			newWordsListElement.innerHTML = "<li>Ошибка.</li>";
			optionsContainerElement.style.display = 'none';
			currentLessonData = {};
		}
	} catch (apiError) {
		console.error("Ошибка вызова API:", apiError);
		gptOutputElement.textContent = "Не удалось связаться с AI.";
		lessonContentElement.innerHTML = `<p>Ошибка загрузки: ${apiError.message}</p>`;
		newWordsListElement.innerHTML = "<li>Ошибка.</li>";
		optionsContainerElement.style.display = 'none';
		currentLessonData = {};
	} finally {
		if (loadingIndicator) loadingIndicator.style.display = 'none';
	}

	// Обновление кнопок навигации
	if (prevButton) prevButton.style.visibility = index === 0 ? 'hidden' : 'visible';
	if (nextButton) nextButton.style.visibility = index >= lessons.length - 1 ? 'hidden' : 'visible';
	const buttonGroup = document.querySelector('.button-group');
	if (buttonGroup) buttonGroup.style.display = 'flex';

	updateUI(); // Обновляем XP/уровень в любом случае
}


// --- ОБНОВЛЕННАЯ ФУНКЦИЯ ПРОВЕРКИ ОТВЕТА ---
function checkAnswer(selectedAnswerText, clickedButton) { // selectedAnswerText будет null для multipleChoice
	if (!currentLessonData || !currentLessonData.exercise) return;

	const exercise = currentLessonData.exercise;
	// feedbackElement уже получен в getDOMElements()
	if (!feedbackElement) return; // Доп. проверка
	feedbackElement.textContent = '';
	feedbackElement.className = 'feedback';

	let isCorrect = false;

	// Блокируем все кнопки после ответа
	optionsContainerElement.querySelectorAll('.option-btn').forEach(btn => {
		btn.disabled = true;
	});

	// --- Логика проверки в зависимости от типа ---
	if (exercise.type === 'multipleChoice') {
		if (!clickedButton || typeof clickedButton.dataset.correct === 'undefined') {
			console.error("Ошибка: Неверные данные для проверки multipleChoice.");
			feedbackElement.textContent = "Ошибка проверки ответа.";
			return;
		}
		// Проверяем значение data-атрибута нажатой кнопки
		isCorrect = clickedButton.dataset.correct === 'true';

		if (!isCorrect) {
			// Если неправильно, подсвечиваем кнопку с data-correct="true"
			optionsContainerElement.querySelectorAll('.option-btn').forEach(btn => {
				if (btn.dataset.correct === 'true') {
					btn.classList.add('correct'); // Показываем правильный вариант
				}
			});
		}

	} else if (exercise.type === 'fillInBlank') {
		if (selectedAnswerText === null || typeof selectedAnswerText === 'undefined' || !exercise.correctAnswer) {
			console.error("Ошибка: Неверные данные для проверки fillInBlank.");
			feedbackElement.textContent = "Ошибка проверки ответа.";
			return;
		}
		// Сравниваем текст выбранной опции с правильным ответом из JSON
		isCorrect = (selectedAnswerText === exercise.correctAnswer);

		if (!isCorrect) {
			// Если неправильно, подсвечиваем кнопку с правильным текстом
			optionsContainerElement.querySelectorAll('.option-btn').forEach(btn => {
				if (btn.textContent === exercise.correctAnswer) {
					btn.classList.add('correct'); // Показываем правильный вариант
				}
			});
		}
	} else {
		console.warn("Попытка проверить неизвестный тип упражнения:", exercise.type);
		feedbackElement.textContent = "Неизвестный тип упражнения.";
		return; // Не можем проверить - выходим
	}

	// --- Общая логика для результата ---
	if (isCorrect) {
		console.log("Правильно!");
		if (clickedButton) clickedButton.classList.add('correct'); // Подсвечиваем нажатую кнопку зеленым
		feedbackElement.textContent = "Правильно! 🎉";
		feedbackElement.classList.add('correct');
		addXP(currentLessonData.xp || 10, currentLessonData.stepId); // Начисляем XP

	} else {
		console.log("Неправильно.");
		if (clickedButton) clickedButton.classList.add('incorrect'); // Подсвечиваем нажатую кнопку красным

		// Формируем сообщение об ошибке (текст правильного ответа)
		let correctAnswerText = "Ответ не найден";
		try { // Добавляем try-catch на случай ошибок при поиске текста ответа
			if (exercise.type === 'multipleChoice') {
				const correctButton = optionsContainerElement.querySelector('.option-btn[data-correct="true"]');
				if (correctButton) {
					correctAnswerText = correctButton.textContent;
				}
			} else if (exercise.type === 'fillInBlank') {
				correctAnswerText = exercise.correctAnswer || "Ответ не указан";
			}
		} catch (e) {
			console.error("Ошибка при поиске текста правильного ответа:", e);
		}

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
function addXP(amount, stepId) {
	if (!amount || amount <= 0) return;
	if (!stepId) {
		console.warn("Попытка добавить XP без ID шага.");
		return;
	}

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

	if (completedSteps.includes(stepId)) {
		console.log(`XP за шаг ${stepId} уже был начислен.`);
		return;
	}

	console.log(`Начисляем ${amount} XP за новый шаг ${stepId}.`);
	currentXP += amount;
	completedSteps.push(stepId);
	localStorage.setItem("completedSteps", JSON.stringify(completedSteps));

	while (currentXP >= xpPerLevel) {
		currentXP -= xpPerLevel;
		currentLevel++;
		console.log(`🎉 Новый уровень: ${currentLevel}! 🎉`);
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
	optionsContainerElement.style.display = 'none';
	if (feedbackElement) feedbackElement.textContent = '';
	const buttonGroup = document.querySelector('.button-group');
	if (buttonGroup) buttonGroup.style.display = 'none';
}

// --- Функция для вызова Google Gemini API ---
async function callGeminiApi(promptText) {
	// !!!!! ВСТАВЬ СЮДА СВОЙ API КЛЮЧ И НЕ ПУШИ В GITHUB !!!!!
	const API_KEY = "AIzaSyABFH4DLh2mS15Eq_BbB0xMmT7hG0v780o"; // <--- ЗАМЕНИ ЭТО ЛОКАЛЬНО!!!

	if (API_KEY === "ТВОЙ_НОВЫЙ_СЕКРЕТНЫЙ_GEMINI_API_KEY" || !API_KEY) {
		const errorMsg = "API Ключ не установлен! Добавь его в scripts/app.js";
		console.error(errorMsg);
		// Отобразить ошибку пользователю ПРЯМО ЗДЕСЬ, т.к. loadLesson может не успеть
		if (gptOutputElement) gptOutputElement.textContent = errorMsg;
		if (lessonContentElement) lessonContentElement.innerHTML = `<p>${errorMsg}</p>`;
		throw new Error(errorMsg);
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

	console.log("Отправка запроса к Gemini API...");

	try {
		const response = await fetch(API_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(requestBody)
		});

		if (!response.ok) {
			let errorBody;
			try {
				errorBody = await response.json();
			} catch (e) {
				errorBody = { error: { message: `Статус ${response.status}. Не удалось прочитать тело ошибки.` } };
			}
			console.error(`Ошибка API: ${response.status} ${response.statusText}`, errorBody);
			let errorMessage = `Ошибка API ${response.status}.`;
			if (errorBody.error && errorBody.error.message) {
				errorMessage += ` Сообщение: ${errorBody.error.message}`;
			}
			throw new Error(errorMessage);
		}

		const data = await response.json();
		console.log("Ответ от Gemini API получен:", data);

		if (data.candidates && data.candidates.length > 0 &&
			data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
			const generatedText = data.candidates[0].content.parts[0].text;
			console.log("Сгенерированный текст:", generatedText);
			return generatedText;
		} else if (data.promptFeedback) {
			const blockReason = data.promptFeedback.blockReason || 'Причина не указана';
			console.warn("Запрос был заблокирован настройками безопасности:", data.promptFeedback);
			throw new Error(`Контент заблокирован: ${blockReason}`);
		} else {
			console.warn("Неожиданная структура ответа от AI:", data);
			throw new Error("Не удалось извлечь текст из ответа AI. Структура ответа изменилась?");
		}

	} catch (error) {
		console.error("Критическая ошибка при вызове Gemini API:", error);
		// Перебрасываем ошибку с более понятным сообщением, если это сетевая ошибка
		if (error instanceof TypeError) { // Ошибка сети (fetch не удался)
			throw new Error("Сетевая ошибка при обращении к API. Проверьте подключение к интернету.");
		}
		throw error; // Перебрасываем оригинальную ошибку (например, от API или блокировки)
	}
}

// --- Инициализация ---
document.addEventListener('DOMContentLoaded', () => {
	getDOMElements(); // Получаем элементы один раз

	if (prevButton) prevButton.onclick = prevLesson;
	if (nextButton) nextButton.onclick = nextLesson;

	loadGameState();
	loadLesson(currentLessonIndex);
});