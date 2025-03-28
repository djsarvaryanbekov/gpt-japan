// scripts/data.js

const lessonsData = [
    {
        id: 1,
        title: "Урок 1: Знакомство. Кто вы?",
        grammarExplanation: `
            <p><strong>Основные конструкции урока 1:</strong></p>
            <ul>
                <li>X は Y です (X wa Y desu) - "X есть Y". Используется для представления себя или других. Пример: わたし は マイク です (Watashi wa Maiku desu) - Я Майк.</li>
                <li>か (ka) - Вопросительная частица в конце предложения. Пример: あなた は がくせい です か (Anata wa gakusei desu ka?) - Вы студент?</li>
                <li>も (mo) - "Тоже". Заменяет は (wa), когда подлежащее совпадает с предыдущим предложением. Пример: ミラーさん も かいしゃいん です (Miraa-san mo kaishain desu) - Господин Миллер тоже служащий.</li>
                <li>の (no) - Притяжательная частица или для связи существительных. Пример: IMC の しゃいん (IMC no shain) - Сотрудник компании IMC.</li>
            </ul>
            <p><strong>Слова:</strong> わたし (я), あなた (ты/Вы), がくせい (студент), かいしゃいん (сотрудник фирмы), はい (да), いいえ (нет).</p>
        `,
        exercises: [
            { type: 'multiple_choice', question: 'Как сказать "Я студент"?', options: ['Anata wa gakusei desu', 'Watashi wa gakusei desu', 'Kore wa gakusei desu'], correctAnswer: 'Watashi wa gakusei desu' },
            { type: 'fill_in_blank', question: 'わたし ___ マイク です。', correctAnswer: 'は' },
            { type: 'translate', question: 'Переведите: Вы сотрудник фирмы?', correctAnswer: 'あなた は かいしゃいん です か' } // Позже добавим проверку ромадзи/хираганы
        ]
    },
    {
        id: 2,
        title: "Урок 2: Указательные местоимения",
        grammarExplanation: `
            <p><strong>Основные конструкции урока 2:</strong></p>
            <ul>
                <li>これ・それ・あれ は Y です (Kore/Sore/Are wa Y desu) - "Это/То/Вон то есть Y". Kore - близко к говорящему, Sore - близко к собеседнику, Are - далеко от обоих.</li>
                <li>この・その・あの X は Y です (Kono/Sono/Ano X wa Y desu) - "Этот/Тот/Вон тот X есть Y". Эти местоимения требуют после себя существительное. Пример: この ほん は わたし の です (Kono hon wa watashi no desu) - Эта книга моя.</li>
                <li>そうです (Sou desu) - "Да, это так".</li>
                <li>ちがいます (Chigaimasu) - "Нет, это не так / Это другое".</li>
                <li>なん です か (Nan desu ka?) - "Что это?".</li>
            </ul>
             <p><strong>Слова:</strong> これ (это), それ (то), あれ (вон то), ほん (книга), じしょ (словарь), かばん (сумка), だれ (кто).</p>
       `,
        exercises: [
             { type: 'multiple_choice', question: 'Что из этого ближе к собеседнику?', options: ['これ', 'それ', 'あれ'], correctAnswer: 'それ' },
             { type: 'fill_in_blank', question: '___ ほん は わたし の です。(Эта книга)', correctAnswer: 'この' },
             { type: 'translate', question: 'Переведите: Что это?', correctAnswer: 'これ は なん です か' }
        ]
    }
    // ... Добавить больше уроков позже
];

// Начальные данные пользователя (могут быть загружены из localStorage)
let userData = {
    currentLessonId: 1,
    level: 1,
    xp: 0,
    xpToNextLevel: 100, // XP для достижения следующего уровня
    // Можно добавить массив пройденных упражнений/уроков
    completedExercises: []
};