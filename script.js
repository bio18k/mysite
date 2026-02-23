// ===== ПОЛЬЗОВАТЕЛИ И ПАРОЛИ =====
const USERS = {
    'admin': {
        password: 'gym2026',
        name: 'Главный администратор',
        role: 'admin'
    },
    'manager': {
        password: 'manager123',
        name: 'Менеджер',
        role: 'manager'
    }
};

let currentUser = null;

// ===== ДАННЫЕ В ПАМЯТИ =====
let clients = [];
let trainers = [];
let sessions = [];

// Цены на тренировки
const SPORT_PRICES = {
    'boxing': 600000, // 600 тыс сум
    'mma': 500000,     // 500 тыс сум
    'gym': 1200000     // 1 млн 200 тыс сум
};

const SPORT_NAMES = {
    'boxing': 'Бокс',
    'mma': 'ММА',
    'gym': 'Качалка'
};

// ===== ЗАГРУЗКА ИЗ LOCALSTORAGE =====
function loadFromStorage() {
    const savedClients = localStorage.getItem('gym_clients');
    const savedTrainers = localStorage.getItem('gym_trainers');
    const savedSessions = localStorage.getItem('gym_sessions');
    
    if (savedClients) clients = JSON.parse(savedClients);
    if (savedTrainers) trainers = JSON.parse(savedTrainers);
    if (savedSessions) sessions = JSON.parse(savedSessions);
}

// ===== СОХРАНЕНИЕ В LOCALSTORAGE =====
function saveToStorage() {
    localStorage.setItem('gym_clients', JSON.stringify(clients));
    localStorage.setItem('gym_trainers', JSON.stringify(trainers));
    localStorage.setItem('gym_sessions', JSON.stringify(sessions));
}

// ===== ПРОВЕРКА ПАРОЛЯ =====
function checkPassword() {
    const passwordInput = document.getElementById('passwordInput');
    const userSelect = document.getElementById('userSelect');
    const loginError = document.getElementById('loginError');
    
    if (!passwordInput || !userSelect) return;
    
    const username = userSelect.value;
    const password = passwordInput.value;
    
    if (USERS[username] && USERS[username].password === password) {
        currentUser = {
            username: username,
            name: USERS[username].name,
            role: USERS[username].role
        };
        
        sessionStorage.setItem('gym_current_user', JSON.stringify(currentUser));
        
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        document.getElementById('currentUser').textContent = `👤 ${currentUser.name}`;
        
        if (currentUser.role === 'admin') {
            document.getElementById('adminOnlySection').style.display = 'block';
        }
        
        loadFromStorage();
        renderAll();
        updateSelects();
        updateStatistics(); // Новая функция
        
        loginError.textContent = '';
    } else {
        loginError.textContent = '❌ Неверный пароль!';
        passwordInput.value = '';
    }
}

// ===== ПРОВЕРКА СЕССИИ =====
function checkSession() {
    const savedUser = sessionStorage.getItem('gym_current_user');
    
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        document.getElementById('currentUser').textContent = `👤 ${currentUser.name}`;
        
        if (currentUser.role === 'admin') {
            document.getElementById('adminOnlySection').style.display = 'block';
        }
        
        loadFromStorage();
        renderAll();
        updateSelects();
        updateStatistics();
    }
}

// ===== ВЫХОД =====
function logout() {
    sessionStorage.removeItem('gym_current_user');
    currentUser = null;
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminContent').style.display = 'none';
    document.getElementById('passwordInput').value = '';
}

// ===== СТАТИСТИКА =====
function updateStatistics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Тренировки сегодня
    const todaySessions = sessions.filter(s => {
        const sessionDate = new Date(s.time);
        return sessionDate >= today && sessionDate < tomorrow;
    });
    
    // Доход сегодня (только оплаченные)
    const todayIncome = todaySessions
        .filter(s => s.paid)
        .reduce((sum, s) => sum + s.price, 0);
    
    // Доход за неделю
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekSessions = sessions.filter(s => {
        const sessionDate = new Date(s.time);
        return sessionDate >= weekAgo && s.paid;
    });
    
    const weekIncome = weekSessions.reduce((sum, s) => sum + s.price, 0);
    
    // Доход за месяц
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const monthSessions = sessions.filter(s => {
        const sessionDate = new Date(s.time);
        return sessionDate >= monthAgo && s.paid;
    });
    
    const monthIncome = monthSessions.reduce((sum, s) => sum + s.price, 0);
    
    // Должники (неоплаченные тренировки)
    const debtors = sessions.filter(s => !s.paid).length;
    
    // Самый популярный тренер
    const trainerStats = {};
    sessions.forEach(s => {
        trainerStats[s.trainerName] = (trainerStats[s.trainerName] || 0) + 1;
    });
    
    let popularTrainer = '-';
    let maxSessions = 0;
    
    for (const [name, count] of Object.entries(trainerStats)) {
        if (count > maxSessions) {
            maxSessions = count;
            popularTrainer = name;
        }
    }
    
    // Обновляем UI
    document.getElementById('todayIncome').textContent = todayIncome.toLocaleString();
    document.getElementById('todaySessions').textContent = todaySessions.length;
    document.getElementById('weekIncome').textContent = weekIncome.toLocaleString();
    document.getElementById('monthIncome').textContent = monthIncome.toLocaleString();
    document.getElementById('debtorsCount').textContent = debtors;
    document.getElementById('popularTrainer').textContent = popularTrainer;
}

// ===== СЧЕТЧИКИ =====
function updateCounters() {
    const clientCount = document.getElementById('clientCount');
    const trainerCount = document.getElementById('trainerCount');
    const sessionCount = document.getElementById('sessionCount');
    
    if (clientCount) clientCount.textContent = clients.length;
    if (trainerCount) trainerCount.textContent = trainers.length;
    if (sessionCount) sessionCount.textContent = sessions.length;
}

// ===== ФУНКЦИИ АДМИН-ПАНЕЛИ =====
function addClient() {
    const nameInput = document.getElementById('clientName');
    const phoneInput = document.getElementById('clientPhone');
    const goalsInput = document.getElementById('clientGoals');
    
    if (!nameInput || !phoneInput) return;
    
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const goals = goalsInput ? goalsInput.value.trim() : '';
    
    if (!name) return alert("Введите имя клиента!");
    if (!phone) return alert("Введите телефон клиента!");
    
    clients.push({ 
        id: Date.now() + Math.random(),
        name: name,
        phone: phone,
        goals: goals,
        registrationDate: new Date().toISOString(),
        totalSessions: 0,
        totalPaid: 0
    });
    
    nameInput.value = '';
    phoneInput.value = '';
    if (goalsInput) goalsInput.value = '';
    
    saveToStorage();
    renderClients();
    updateSelects();
    updateCounters();
}

function addTrainer() {
    const nameInput = document.getElementById('trainerName');
    const sportSelect = document.getElementById('trainerSport');
    
    if (!nameInput || !sportSelect) return;
    
    const name = nameInput.value.trim();
    const sport = sportSelect.value;
    
    if (!name) return alert("Введите имя тренера!");
    
    trainers.push({ 
        id: Date.now() + Math.random(),
        name: name,
        sport: sport,
        sportName: SPORT_NAMES[sport],
        price: SPORT_PRICES[sport]
    });
    
    nameInput.value = '';
    saveToStorage();
    renderTrainers();
    updateSelects();
    updateCounters();
}

// ===== ФУНКЦИИ УДАЛЕНИЯ =====
function deleteClient(id) {
    const client = clients.find(c => c.id === id);
    if (!client) return;
    
    const hasSessions = sessions.some(s => s.clientId === id);
    if (hasSessions) {
        if (!confirm(`У клиента ${client.name} есть записи на тренировки. Удалить клиента и все его записи?`)) {
            return;
        }
        sessions = sessions.filter(s => s.clientId !== id);
    }
    
    clients = clients.filter(c => c.id !== id);
    saveToStorage();
    renderAll();
    updateSelects();
    updateCounters();
    updateStatistics();
}

function deleteTrainer(id) {
    if (!isAdmin()) {
        alert('⛔ Только администратор может удалять тренеров!');
        return;
    }
    
    const trainer = trainers.find(t => t.id === id);
    if (!trainer) return;
    
    const hasSessions = sessions.some(s => s.trainerId === id);
    if (hasSessions) {
        if (!confirm(`У тренера ${trainer.name} есть запланированные тренировки. Удалить тренера и все его тренировки?`)) {
            return;
        }
        sessions = sessions.filter(s => s.trainerId !== id);
    }
    
    trainers = trainers.filter(t => t.id !== id);
    saveToStorage();
    renderAll();
    updateSelects();
    updateCounters();
    updateStatistics();
}

function deleteSession(id) {
    if (confirm('Отменить тренировку?')) {
        sessions = sessions.filter(s => s.id !== id);
        saveToStorage();
        renderSessions();
        updateCounters();
        updateStatistics();
    }
}

// ===== ПРОФИЛЬ КЛИЕНТА =====
function showClientProfile(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    // Получаем тренировки клиента
    const clientSessions = sessions.filter(s => s.clientId === clientId);
    
    // Сортируем по дате (сначала новые)
    clientSessions.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    // Статистика по клиенту
    const totalSessions = clientSessions.length;
    const paidSessions = clientSessions.filter(s => s.paid).length;
    const unpaidSessions = totalSessions - paidSessions;
    const totalPaid = clientSessions.filter(s => s.paid).reduce((sum, s) => sum + s.price, 0);
    const totalDebt = clientSessions.filter(s => !s.paid).reduce((sum, s) => sum + s.price, 0);
    
    // Любимый тренер
    const trainerStats = {};
    clientSessions.forEach(s => {
        trainerStats[s.trainerName] = (trainerStats[s.trainerName] || 0) + 1;
    });
    
    let favoriteTrainer = 'Нет';
    let maxCount = 0;
    for (const [name, count] of Object.entries(trainerStats)) {
        if (count > maxCount) {
            maxCount = count;
            favoriteTrainer = name;
        }
    }
    
    // Любимый вид спорта
    const sportStats = {};
    clientSessions.forEach(s => {
        sportStats[s.sportName] = (sportStats[s.sportName] || 0) + 1;
    });
    
    let favoriteSport = 'Нет';
    maxCount = 0;
    for (const [sport, count] of Object.entries(sportStats)) {
        if (count > maxCount) {
            maxCount = count;
            favoriteSport = sport;
        }
    }
    
    // Формируем HTML профиля
    const profileHTML = `
        <div class="profile-section">
            <h3>📋 Основная информация</h3>
            <p><strong>Имя:</strong> ${client.name}</p>
            <p><strong>Телефон:</strong> ${client.phone}</p>
            <p><strong>Дата регистрации:</strong> ${new Date(client.registrationDate).toLocaleDateString()}</p>
            <p><strong>Цели и заметки:</strong> ${client.goals || 'Нет'}</p>
        </div>
        
        <div class="profile-section">
            <h3>📊 Статистика</h3>
            <div class="profile-stats">
                <div class="stat-item">
                    <span class="stat-label">Всего тренировок:</span>
                    <span class="stat-value">${totalSessions}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Оплачено:</span>
                    <span class="stat-value paid">${paidSessions}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Долг:</span>
                    <span class="stat-value unpaid">${unpaidSessions}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Всего оплачено:</span>
                    <span class="stat-value">${totalPaid.toLocaleString()} сум</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Текущий долг:</span>
                    <span class="stat-value debt">${totalDebt.toLocaleString()} сум</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Любимый тренер:</span>
                    <span class="stat-value">${favoriteTrainer}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Любимый спорт:</span>
                    <span class="stat-value">${favoriteSport}</span>
                </div>
            </div>
        </div>
        
        <div class="profile-section">
            <h3>📅 История тренировок</h3>
            <div class="sessions-history">
                ${clientSessions.map(s => {
                    const date = new Date(s.time).toLocaleString();
                    const paidStatus = s.paid ? '✅' : '❌';
                    return `
                        <div class="history-item ${s.paid ? 'paid' : 'unpaid'}">
                            <span>${date}</span>
                            <span>${s.sportName} с ${s.trainerName}</span>
                            <span>${s.price.toLocaleString()} сум ${paidStatus}</span>
                        </div>
                    `;
                }).join('')}
                ${clientSessions.length === 0 ? '<p>Нет тренировок</p>' : ''}
            </div>
        </div>
        
        <div class="profile-section">
            <h3>📈 Прогресс</h3>
            <div class="progress-chart">
                <p>Тренировок по месяцам:</p>
                ${generateMonthlyStats(clientSessions)}
            </div>
        </div>
        
        <button onclick="closeClientProfile()" class="close-profile-btn">Закрыть</button>
    `;
    
    document.getElementById('profileClientName').textContent = `Профиль: ${client.name}`;
    document.getElementById('profileContent').innerHTML = profileHTML;
    document.getElementById('clientProfileModal').style.display = 'block';
}

// Вспомогательная функция для статистики по месяцам
function generateMonthlyStats(sessions) {
    const monthlyStats = {};
    
    sessions.forEach(s => {
        const date = new Date(s.time);
        const monthYear = `${date.getMonth() + 1}.${date.getFullYear()}`;
        monthlyStats[monthYear] = (monthlyStats[monthYear] || 0) + 1;
    });
    
    return Object.entries(monthlyStats)
        .map(([month, count]) => `
            <div class="month-stat">
                <span>${month}:</span>
                <span>${count} тренировок</span>
            </div>
        `).join('');
}

function closeClientProfile() {
    document.getElementById('clientProfileModal').style.display = 'none';
}

// ===== ДОБАВЛЕНИЕ ТРЕНИРОВКИ =====
function addSession() {
    const clientSelect = document.getElementById('selectClient');
    const trainerSelect = document.getElementById('selectTrainer');
    const timeInput = document.getElementById('sessionTime');
    const paidCheckbox = document.getElementById('sessionPaid');

    if (!clientSelect || !trainerSelect || !timeInput) return;

    const clientId = clientSelect.value;
    const trainerId = trainerSelect.value;
    const time = timeInput.value;
    const paid = paidCheckbox ? paidCheckbox.checked : false;

    if (!clientId || !trainerId || !time) return alert("Заполните все поля!");

    const client = clients.find(c => c.id == clientId);
    const trainer = trainers.find(t => t.id == trainerId);
    
    if (!client || !trainer) return alert("Ошибка: клиент или тренер не найдены");

    sessions.push({ 
        id: Date.now() + Math.random(),
        clientId: clientId,
        trainerId: trainerId,
        clientName: client.name,
        trainerName: trainer.name,
        sport: trainer.sport,
        sportName: trainer.sportName,
        price: trainer.price,
        time: time,
        paid: paid,
        completed: false
    });
    
    timeInput.value = '';
    if (paidCheckbox) paidCheckbox.checked = false;
    
    saveToStorage();
    renderSessions();
    updateCounters();
    updateStatistics();
}

// ===== РЕНДЕРИНГ =====
function renderClients() {
    const list = document.getElementById('clientList');
    if (!list) return;
    list.innerHTML = '';
    clients.forEach(c => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="client-info" onclick="showClientProfile(${c.id})" style="cursor: pointer;">
                <strong>${c.name}</strong><br>
                <small>📞 ${c.phone}</small>
                ${c.goals ? `<br><small>🎯 ${c.goals.substring(0, 30)}${c.goals.length > 30 ? '...' : ''}</small>` : ''}
            </div>
            <div>
                <button onclick="editClient(${c.id})" style="background-color: #3498db;">✏️</button>
                <button onclick="deleteClient(${c.id})" style="background-color: #e74c3c;">🗑️</button>
            </div>
        `;
        list.appendChild(li);
    });
}

function renderTrainers() {
    const list = document.getElementById('trainerList');
    if (!list) return;
    list.innerHTML = '';
    trainers.forEach(t => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <strong>${t.name}</strong><br>
                <small>${t.sportName} - ${t.price.toLocaleString()} сум</small>
            </div>
            <div>
                <button onclick="editTrainer(${t.id})" style="background-color: #3498db;">✏️</button>
                <button onclick="deleteTrainer(${t.id})" style="background-color: #e74c3c;">🗑️</button>
            </div>
        `;
        list.appendChild(li);
    });
}

function renderSessions() {
    const list = document.getElementById('sessionList');
    if (!list) return;
    
    const filterTrainer = document.getElementById('filterTrainer');
    const filterPaid = document.getElementById('filterPaid');
    
    let filteredSessions = [...sessions];
    
    if (filterTrainer && filterTrainer.value) {
        filteredSessions = filteredSessions.filter(s => s.trainerId == filterTrainer.value);
    }
    
    if (filterPaid && filterPaid.value === 'paid') {
        filteredSessions = filteredSessions.filter(s => s.paid);
    } else if (filterPaid && filterPaid.value === 'unpaid') {
        filteredSessions = filteredSessions.filter(s => !s.paid);
    }
    
    filteredSessions.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    list.innerHTML = '';
    filteredSessions.forEach(s => {
        const li = document.createElement('li');
        const paidStatus = s.paid ? '✅ Оплачено' : '❌ Не оплачено';
        const date = new Date(s.time).toLocaleString('ru-RU');
        
        li.innerHTML = `
            <div>
                <strong>${s.clientName}</strong> с <strong>${s.trainerName}</strong><br>
                <small>${s.sportName} - ${s.price.toLocaleString()} сум</small><br>
                <small>📅 ${date}</small><br>
                <small>${paidStatus}</small>
            </div>
            <div>
                <button onclick="togglePaid(${s.id})" style="background-color: #f39c12;">💰</button>
                <button onclick="deleteSession(${s.id})" style="background-color: #e74c3c;">🗑️</button>
            </div>
        `;
        list.appendChild(li);
    });
}

// ===== ПЕРЕКЛЮЧЕНИЕ СТАТУСА ОПЛАТЫ =====
function togglePaid(sessionId) {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
        session.paid = !session.paid;
        saveToStorage();
        renderSessions();
        updateStatistics();
    }
}

// ===== РЕДАКТИРОВАНИЕ =====
function editClient(id) {
    const client = clients.find(c => c.id === id);
    if (!client) return;
    
    const newName = prompt("Введите новое имя:", client.name);
    const newPhone = prompt("Введите новый телефон:", client.phone);
    const newGoals = prompt("Введите новые цели:", client.goals || '');
    
    if (newName && newName.trim()) client.name = newName.trim();
    if (newPhone && newPhone.trim()) client.phone = newPhone.trim();
    if (newGoals !== null) client.goals = newGoals.trim();
    
    saveToStorage();
    renderClients();
    updateSelects();
}

function editTrainer(id) {
    const trainer = trainers.find(t => t.id === id);
    if (!trainer) return;
    
    const newName = prompt("Введите новое имя:", trainer.name);
    if (newName && newName.trim()) trainer.name = newName.trim();
    
    saveToStorage();
    renderTrainers();
    updateSelects();
}

// ===== ОБНОВЛЕНИЕ SELECT ЭЛЕМЕНТОВ =====
function updateSelects() {
    const clientSelect = document.getElementById('selectClient');
    const trainerSelect = document.getElementById('selectTrainer');
    const filterTrainer = document.getElementById('filterTrainer');

    if (!clientSelect || !trainerSelect) return;

    clientSelect.innerHTML = '<option value="">Выберите клиента</option>';
    trainerSelect.innerHTML = '<option value="">Выберите тренера</option>';
    
    if (filterTrainer) {
        filterTrainer.innerHTML = '<option value="">Все тренеры</option>';
    }

    clients.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = `${c.name} (${c.phone})`;
        clientSelect.appendChild(option);
    });

    trainers.forEach(t => {
        const option = document.createElement('option');
        option.value = t.id;
        option.textContent = `${t.name} - ${t.sportName}`;
        trainerSelect.appendChild(option);
        
        if (filterTrainer) {
            const filterOption = document.createElement('option');
            filterOption.value = t.id;
            filterOption.textContent = t.name;
            filterTrainer.appendChild(filterOption);
        }
    });
}

// ===== ОТОБРАЖЕНИЕ ЦЕНЫ =====
function updatePriceDisplay() {
    const trainerSelect = document.getElementById('selectTrainer');
    const priceDisplay = document.getElementById('priceDisplay');
    
    if (!trainerSelect || !priceDisplay) return;
    
    const trainerId = trainerSelect.value;
    if (trainerId) {
        const trainer = trainers.find(t => t.id == trainerId);
        if (trainer) {
            priceDisplay.innerHTML = `Стоимость: <span style="color: #27ae60; font-weight: bold;">${trainer.price.toLocaleString()} сум</span>`;
        }
    } else {
        priceDisplay.innerHTML = 'Стоимость: <span>0 сум</span>';
    }
}

// ===== ФИЛЬТРЫ =====
function applyFilters() {
    renderSessions();
}

function resetFilters() {
    const filterTrainer = document.getElementById('filterTrainer');
    const filterPaid = document.getElementById('filterPaid');
    
    if (filterTrainer) filterTrainer.value = '';
    if (filterPaid) filterPaid.value = 'all';
    
    renderSessions();
}

// ===== ОБНОВЛЕНИЕ ВСЕГО =====
function renderAll() {
    renderClients();
    renderTrainers();
    renderSessions();
    updateCounters();
    updateStatistics();
    function renderAll() {
    renderClients();
    renderTrainers();
    renderSessions();
    updateCounters();
    updateStatistics();
    renderSalaryHistory(); // НОВОЕ
    renderTrainerFinanceStats(); // НОВОЕ
}
}

// ===== ПРОВЕРКА ПРАВ =====
function isAdmin() {
    return currentUser && currentUser.role === 'admin';
}

// ===== ОЧИСТКА ВСЕХ ДАННЫХ =====
function clearAllData() {
    if (!isAdmin()) {
        alert('⛔ Только администратор может очищать все данные!');
        return;
    }
    
    if (confirm('⚠️ ВНИМАНИЕ! Вы точно хотите удалить ВСЕ данные? Это действие нельзя отменить!')) {
        clients = [];
        trainers = [];
        sessions = [];
        saveToStorage();
        renderAll();
        updateCounters();
        alert('Все данные удалены');
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ =====
document.addEventListener('DOMContentLoaded', function() {
    const trainerSelect = document.getElementById('selectTrainer');
    if (trainerSelect) {
        trainerSelect.addEventListener('change', updatePriceDisplay);
    }
    
    checkSession();
});

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    const modal = document.getElementById('clientProfileModal');
    if (event.target == modal) {
        closeClientProfile();
    }
}
// ===== НОВЫЕ ДАННЫЕ =====
let salaryPayments = []; // История выплат зарплаты

// Загрузка из localStorage
function loadFromStorage() {
    const savedClients = localStorage.getItem('gym_clients');
    const savedTrainers = localStorage.getItem('gym_trainers');
    const savedSessions = localStorage.getItem('gym_sessions');
    const savedSalaryPayments = localStorage.getItem('gym_salary_payments'); // НОВОЕ
    
    if (savedClients) clients = JSON.parse(savedClients);
    if (savedTrainers) trainers = JSON.parse(savedTrainers);
    if (savedSessions) sessions = JSON.parse(savedSessions);
    if (savedSalaryPayments) salaryPayments = JSON.parse(savedSalaryPayments); // НОВОЕ
}

// Сохранение в localStorage
function saveToStorage() {
    localStorage.setItem('gym_clients', JSON.stringify(clients));
    localStorage.setItem('gym_trainers', JSON.stringify(trainers));
    localStorage.setItem('gym_sessions', JSON.stringify(sessions));
    localStorage.setItem('gym_salary_payments', JSON.stringify(salaryPayments)); // НОВОЕ
}
// ===== ФУНКЦИИ ДЛЯ ЗАРПЛАТЫ =====

// Обновление селекта тренеров для зарплаты
function updateSalarySelect() {
    const salarySelect = document.getElementById('salaryTrainerSelect');
    if (!salarySelect) return;
    
    salarySelect.innerHTML = '<option value="">Выберите тренера</option>';
    
    trainers.forEach(t => {
        const option = document.createElement('option');
        option.value = t.id;
        option.textContent = `${t.name} (${t.sportName})`;
        salarySelect.appendChild(option);
    });
}

// Добавление выплаты зарплаты
function addSalaryPayment() {
    const trainerSelect = document.getElementById('salaryTrainerSelect');
    const amountInput = document.getElementById('salaryAmount');
    const dateInput = document.getElementById('salaryDate');
    const commentInput = document.getElementById('salaryComment');
    
    if (!trainerSelect || !amountInput || !dateInput) return;
    
    const trainerId = trainerSelect.value;
    const amount = amountInput.value.trim();
    const date = dateInput.value;
    const comment = commentInput ? commentInput.value.trim() : '';
    
    if (!trainerId) return alert("Выберите тренера!");
    if (!amount || amount <= 0) return alert("Введите сумму!");
    if (!date) return alert("Выберите дату!");
    
    const trainer = trainers.find(t => t.id == trainerId);
    if (!trainer) return alert("Тренер не найден!");
    
    // Создаём запись о выплате
    const payment = {
        id: Date.now() + Math.random(),
        trainerId: trainerId,
        trainerName: trainer.name,
        trainerSport: trainer.sportName,
        amount: Number(amount),
        date: date,
        comment: comment,
        timestamp: new Date().toISOString()
    };
    
    salaryPayments.push(payment);
    
    // Очищаем поля
    amountInput.value = '';
    if (commentInput) commentInput.value = '';
    
    saveToStorage();
    renderSalaryHistory();
    renderTrainerFinanceStats();
    
    alert(`✅ Выплачено ${Number(amount).toLocaleString()} сум тренеру ${trainer.name}`);
}

// Отображение истории выплат
function renderSalaryHistory() {
    const historyList = document.getElementById('salaryHistoryList');
    if (!historyList) return;
    
    // Сортируем по дате (сначала новые)
    const sortedPayments = [...salaryPayments].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    historyList.innerHTML = '';
    
    if (sortedPayments.length === 0) {
        historyList.innerHTML = '<p class="no-data">История выплат пуста</p>';
        return;
    }
    
    sortedPayments.forEach(p => {
        const paymentDate = new Date(p.date).toLocaleDateString('ru-RU');
        const amountFormatted = Number(p.amount).toLocaleString();
        
        const div = document.createElement('div');
        div.className = 'salary-history-item';
        div.innerHTML = `
            <div class="salary-item-header">
                <span class="trainer-name">${p.trainerName}</span>
                <span class="payment-date">${paymentDate}</span>
            </div>
            <div class="salary-item-body">
                <span class="payment-amount">${amountFormatted} сум</span>
                ${p.comment ? `<span class="payment-comment">${p.comment}</span>` : ''}
            </div>
            <div class="salary-item-footer">
                <button onclick="deleteSalaryPayment(${p.id})" class="small-delete-btn">🗑️</button>
            </div>
        `;
        historyList.appendChild(div);
    });
}

// Удаление выплаты
function deleteSalaryPayment(id) {
    if (!isAdmin()) {
        alert('⛔ Только администратор может удалять записи о выплатах!');
        return;
    }
    
    if (confirm('Удалить запись о выплате?')) {
        salaryPayments = salaryPayments.filter(p => p.id !== id);
        saveToStorage();
        renderSalaryHistory();
        renderTrainerFinanceStats();
    }
}

// Статистика по тренерам (финансовая)
function renderTrainerFinanceStats() {
    const statsContainer = document.getElementById('trainerFinanceStats');
    if (!statsContainer) return;
    
    // Собираем статистику по каждому тренеру
    const trainerStats = {};
    
    trainers.forEach(t => {
        trainerStats[t.id] = {
            id: t.id,
            name: t.name,
            sport: t.sportName,
            totalPaid: 0,
            payments: 0,
            lastPayment: null
        };
    });
    
    // Суммируем выплаты
    salaryPayments.forEach(p => {
        if (trainerStats[p.trainerId]) {
            trainerStats[p.trainerId].totalPaid += p.amount;
            trainerStats[p.trainerId].payments += 1;
            
            // Обновляем последнюю выплату
            if (!trainerStats[p.trainerId].lastPayment || new Date(p.date) > new Date(trainerStats[p.trainerId].lastPayment)) {
                trainerStats[p.trainerId].lastPayment = p.date;
            }
        }
    });
    
    // Отображаем статистику
    statsContainer.innerHTML = '';
    
    if (trainers.length === 0) {
        statsContainer.innerHTML = '<p class="no-data">Нет тренеров</p>';
        return;
    }
    
    Object.values(trainerStats).forEach(stat => {
        const lastPaymentDate = stat.lastPayment 
            ? new Date(stat.lastPayment).toLocaleDateString('ru-RU') 
            : 'Нет выплат';
        
        const div = document.createElement('div');
        div.className = 'trainer-stat-card';
        div.innerHTML = `
            <h4>${stat.name}</h4>
            <p class="trainer-sport">${stat.sport}</p>
            <div class="trainer-stat-row">
                <span>Всего выплачено:</span>
                <span class="stat-amount">${stat.totalPaid.toLocaleString()} сум</span>
            </div>
            <div class="trainer-stat-row">
                <span>Количество выплат:</span>
                <span>${stat.payments}</span>
            </div>
            <div class="trainer-stat-row">
                <span>Последняя выплата:</span>
                <span>${lastPaymentDate}</span>
            </div>
        `;
        statsContainer.appendChild(div);
    });
}

// Обновляем функцию updateSelects (добавляем вызов updateSalarySelect)
function updateSelects() {
    const clientSelect = document.getElementById('selectClient');
    const trainerSelect = document.getElementById('selectTrainer');
    const filterTrainer = document.getElementById('filterTrainer');
    const salarySelect = document.getElementById('salaryTrainerSelect'); // НОВОЕ

    if (!clientSelect || !trainerSelect) return;

    clientSelect.innerHTML = '<option value="">Выберите клиента</option>';
    trainerSelect.innerHTML = '<option value="">Выберите тренера</option>';
    
    if (filterTrainer) {
        filterTrainer.innerHTML = '<option value="">Все тренеры</option>';
    }
    
    // Очищаем селект зарплаты
    if (salarySelect) {
        salarySelect.innerHTML = '<option value="">Выберите тренера</option>';
    }

    clients.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = `${c.name} (${c.phone})`;
        clientSelect.appendChild(option);
    });

    trainers.forEach(t => {
        // Для основного селекта
        const option = document.createElement('option');
        option.value = t.id;
        option.textContent = `${t.name} - ${t.sportName}`;
        trainerSelect.appendChild(option);
        
        // Для фильтра
        if (filterTrainer) {
            const filterOption = document.createElement('option');
            filterOption.value = t.id;
            filterOption.textContent = t.name;
            filterTrainer.appendChild(filterOption);
        }
        
        // ДЛЯ ЗАРПЛАТЫ (НОВОЕ)
        if (salarySelect) {
            const salaryOption = document.createElement('option');
            salaryOption.value = t.id;
            salaryOption.textContent = `${t.name} - ${t.sportName}`;
            salarySelect.appendChild(salaryOption);
        }
    });
}

// Устанавливаем сегодняшнюю дату по умолчанию для поля даты
function setDefaultDate() {
    const dateInput = document.getElementById('salaryDate');
    if (dateInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
    }
}

// Добавляем вызов в DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    const trainerSelect = document.getElementById('selectTrainer');
    if (trainerSelect) {
        trainerSelect.addEventListener('change', updatePriceDisplay);
    }
    
    setDefaultDate(); // Устанавливаем сегодняшнюю дату
    checkSession();
    renderSalaryHistory(); // Загружаем историю выплат
    renderTrainerFinanceStats(); // Загружаем статистику
});