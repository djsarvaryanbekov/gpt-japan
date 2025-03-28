// scripts/app.js

// --- Элементы DOM ---
const levelDisplay = document.getElementById('level');
const xpDisplay = document.getElementById('xp');
const xpNextLevelDisplay = document.getElementById('xp-next-level');
const teacherChatContent = document.getElementById('teacher-chat-content');
const lessonTitle = document.getElementById('lesson-title');
const exerciseArea = document.getElementById('exercise-area');
const feedbackArea = document.getElementById('feedback-area');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const checkButton = document.getElementById('check-button');

// --- Загрузка данных при старте ---
function initializeApp() {
    // Пытаемся загрузить данные пользователя из localStorage
    const savedUserData = localStorage.getItem('japaneseLearnerUserData');
    if (savedUserData) {
        userData = JSON.parse(savedUserData);
    } else {
        // Если данных нет, используем начальные и сохраняем их
        localStorage.setItem('japaneseLearnerUserData', JSON.stringify(userData));
    }

    // Отображаем начальные данные пользователя
    updateUserInfoUI();

    // Загружаем текущий урок (пока только его данные)
    loadLesson(userData.currentLessonId);
}

// --- Обновление информации о пользователе в UI ---
function updateUserInfoUI() {
    levelDisplay.textContent = userData.level;
    xpDisplay.textContent = userData.xp;
    xpNextLevelDisplay.textContent = userData.xpToNextLevel;
    // Позже можно добавить обновление прогресс-бара, если он будет
}

// --- Загрузка урока ---
// (Эта функция пока просто находит урок, позже она будет его отображать)
function loadLesson(lessonId) {
    const lesson = lessonsData.find(l => l.id === lessonId);
    if (!lesson) {
        console.error(`Урок с ID ${lessonId} не найден!`);
        // Возможно, загрузить первый урок или показать ошибку
        return;
    }
    console.log("Загружен урок:", lesson.title); // Для отладки

    // --- Здесь будет код для отображения урока в UI ---
    lessonTitle.textContent = lesson.title;
    teacherChatContent.innerHTML = lesson.grammarExplanation; // Используем innerHTML, т.к. там HTML-теги
    // Очищаем область упражнений и фидбека
    exerciseArea.innerHTML = '<p>Упражнения для этого урока появятся здесь.</p>';
    feedbackArea.innerHTML = '<p>Готов к упражнениям?</p>';

    // Обновляем userData и сохраняем
    userData.currentLessonId = lessonId;
    saveUserData();

    // Обновляем состояние кнопок Назад/Далее
    updateNavigationButtons();
}

// --- Сохранение данных пользователя ---
function saveUserData() {
    localStorage.setItem('japaneseLearnerUserData', JSON.stringify(userData));
}

// --- Обновление состояния кнопок Назад/Далее ---
function updateNavigationButtons() {
    prevButton.disabled = userData.currentLessonId <= 1; // Нельзя назад с первого урока
    nextButton.disabled = userData.currentLessonId >= lessonsData.length; // Нельзя вперед с последнего урока
}


// --- Обработчики событий ---
prevButton.addEventListener('click', () => {
    if (userData.currentLessonId > 1) {
        loadLesson(userData.currentLessonId - 1);
    }
});

nextButton.addEventListener('click', () => {
    if (userData.currentLessonId < lessonsData.length) {
        loadLesson(userData.currentLessonId + 1);
    }
});

// TODO: Добавить обработчик для checkButton


// --- Инициализация приложения при загрузке страницы ---
document.addEventListener('DOMContentLoaded', initializeApp);