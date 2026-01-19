// ========== ИСПРАВЛЕНИЕ: УБИРАЕМ DISPLAY: NONE С НАВИГАЦИИ ==========

// Функция для исправления навигации
function fixNavigationDisplay() {
    const navContent = document.querySelector('.nav-content');
    if (navContent && navContent.style.display === 'none') {
        console.warn('⚠️ Обнаружен display: none на навигации. Исправляем...');
        navContent.style.display = 'flex';
        return true;
    }
    return false;
}

// Запускаем сразу
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        fixNavigationDisplay();
    });
} else {
    fixNavigationDisplay();
}

// Запускаем с задержкой (на случай, если код ставит display: none позже)
setTimeout(fixNavigationDisplay, 100);
setTimeout(fixNavigationDisplay, 300);
setTimeout(fixNavigationDisplay, 500);

// Отслеживаем все изменения DOM
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'style' &&
            mutation.target.classList.contains('nav-content')) {
            fixNavigationDisplay();
        }
    });
});

if (document.querySelector('.nav-content')) {
    observer.observe(document.querySelector('.nav-content'), {
        attributes: true,
        attributeFilter: ['style']
    });
}

// Экспортируем для отладки
window.fixNavigationDisplay = fixNavigationDisplay;// ==================== ОПРЕДЕЛЕНИЕ ВСЕХ ФУНКЦИЙ ПЕРВЫМИ ====================

// Переменные
let stations = [];
let isEditing = false;
let currentEditId = null;

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

function extractCityFromAddress(address) {
    if (!address) return '—';
    const streetPrefixes = ['ул.', 'улица', 'пр.', 'проспект', 'пер.', 'переулок', 'д.', 'дом'];
    const firstWord = address.split(',')[0].toLowerCase().trim();
    if (streetPrefixes.some(prefix => firstWord.includes(prefix))) {
        return '—';
    }
    return address.split(',')[0].trim();
}

function extractStreetFromAddress(address) {
    if (!address) return '—';
    const parts = address.split(',');
    if (parts.length > 1) {
        return parts.slice(1).join(',').trim();
    }
    return address.trim();
}

function formatPhone(phone) {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
        return `+7 (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7, 9)}-${digits.substring(9, 11)}`;
    }
    return phone;
}

// ==================== НАВИГАЦИЯ ====================

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            const pageName = this.getAttribute('data-page');
            showPage(pageName);
        });
    });
}

function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    const targetPage = document.getElementById(`page-${pageName}`);
    if (targetPage) targetPage.classList.add('active');
}

// ==================== РАБОТА С ДАННЫМИ ====================

function loadStations() {
    const tableBody = document.getElementById('stations-table');
    if (!tableBody) {
        console.error('Не найден stations-table');
        return;
    }
    
    tableBody.innerHTML = '';
    
    stations.forEach(station => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${station.id}</td>
            <td><strong>${station.name}</strong></td>
            <td>${station.address}</td>
            <td>${station.phone}</td>
            <td>
                <div class="table-actions">
                    <button class="action-btn edit" onclick="editStation(${station.id})" title="Редактировать">
                        <i class="bi-pencil"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteStation(${station.id})" title="Удалить">
                        <i class="bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    console.log('Таблица АЗС обновлена:', stations.length, 'записей');

}

function updateStationsCount() {
    const countElement = document.getElementById('total-stations');
    if (countElement) {
        countElement.textContent = stations.length;
        console.log('Счетчик обновлен:', stations.length, 'АЗС');
    }
}

// ==================== ЗАГРУЗКА ДАННЫХ ИЗ API ====================

async function loadStationsFromAPI() {
    try {
        if (window.api && window.api.getGasStations) {
            const apiStations = await window.api.getGasStations();
            console.log('Загружено АЗС из API:', apiStations);
            
            stations = apiStations.map(station => ({
                id: station.id,
                name: station.name,
                address: station.address || '—',
                phone: station.contactPhone || formatPhone(station.phone) || '—',
                originalData: station
            }));
            
            console.log('Преобразовано АЗС:', stations.length, 'записей');
            
            loadStations();
            updateStationsCount();
            
            if (stations.length > 0) {
                showMessage('Данные загружены', `Получено ${stations.length} АЗС из базы данных`, 'success');
            }
        } else {
            console.log('API не доступен, используем демо-данные');
            loadDemoStations();
        }
    } catch (error) {
        console.error('Ошибка загрузки АЗС:', error);
        loadDemoStations();
    }
}

function loadDemoStations() {
    stations = [
        { 
            id: 1, 
            name: 'Лукойл', 
            address: 'ул. Ленина, 1', 
            phone: '+7 (916) 123-45-67',
            originalData: {
                name: 'Лукойл',
                address: 'ул. Ленина, 1',
                contactPhone: '79161234567',
                chiefName: 'Иванов И.И.',
                supplier: 'ООО "Лукойл-Снаб"'
            }
        },
        { 
            id: 2, 
            name: 'Газпромнефть', 
            address: 'ул. Советская, 10', 
            phone: '+7 (916) 765-43-21',
            originalData: {
                name: 'Газпромнефть',
                address: 'ул. Советская, 10',
                contactPhone: '79167654321',
                chiefName: 'Петров П.П.',
                supplier: 'ОАО "Газпромнефть"'
            }
        },
        { 
            id: 3, 
            name: 'Роснефть', 
            address: 'пр. Победы, 25', 
            phone: '+7 (916) 999-88-77',
            originalData: {
                name: 'Роснефть',
                address: 'пр. Победы, 25',
                contactPhone: '79169998877',
                chiefName: 'Сидоров С.С.',
                supplier: 'ПАО "Роснефть"'
            }
        }
    ];
    
    loadStations();
    updateStationsCount();
    showMessage('Демо-режим', 'Используются демо-данные (3 АЗС)', 'info');
}

// ==================== ПРОВЕРКА API ====================

async function checkAPI() {
    const statusElement = document.getElementById('api-status');
    const connectionStatus = document.getElementById('connection-status');
    
    if (!window.api) {
        console.log('API не загружен');
        if (statusElement) statusElement.textContent = 'API не найден';
        if (connectionStatus) {
            connectionStatus.innerHTML = '<i class="bi-x-circle"></i> API не подключен';
            connectionStatus.className = 'status-badge status-error';
        }
        return;
    }
    
    try {
        await window.api.getGasStations();
        if (statusElement) {
            statusElement.textContent = 'Подключен';
            statusElement.classList.add('connected');
        }
        if (connectionStatus) {
            connectionStatus.innerHTML = '<i class="bi-check-circle"></i> Бекенд подключен';
            connectionStatus.className = 'status-badge status-success';
        }
    } catch (error) {
        console.log('API недоступен:', error.message);
        if (statusElement) statusElement.textContent = 'Не подключен';
        if (connectionStatus) {
            connectionStatus.innerHTML = '<i class="bi-x-circle"></i> Бекенд не отвечает';
            connectionStatus.className = 'status-badge status-error';
        }
    }
}

// ==================== CRUD ОПЕРАЦИИ ====================

function addStation() {
    isEditing = false;
    currentEditId = null;
    
    const form = document.getElementById('station-form');
    if (form) form.reset();
    
    const idField = document.getElementById('station-id');
    if (idField) idField.value = '';
    
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) modalTitle.innerHTML = '<i class="bi-plus-circle"></i> Добавить АЗС';
    
    const modalSave = document.getElementById('modal-save');
    if (modalSave) modalSave.innerHTML = '<i class="bi-check-circle"></i> Добавить';
    
    const modal = document.getElementById('station-modal');
    if (modal) modal.classList.add('active');
    
    setTimeout(() => {
        const nameField = document.getElementById('station-name');
        if (nameField) nameField.focus();
    }, 100);
}

function editStation(id) {
    const station = stations.find(s => s.id === id);
    if (!station) {
        showMessage('Ошибка', 'АЗС не найдена', 'error');
        return;
    }
    
    isEditing = true;
    currentEditId = id;
    
    const idField = document.getElementById('station-id');
    if (idField) idField.value = station.id;
    
    const nameField = document.getElementById('station-name');
    if (nameField) nameField.value = station.originalData?.name || station.name;
    
    const addressField = document.getElementById('station-address');
    if (addressField) addressField.value = station.originalData?.address || station.address;
    
    const phoneField = document.getElementById('station-phone');
    if (phoneField) phoneField.value = station.originalData?.contactPhone || station.phone;
    
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) modalTitle.innerHTML = '<i class="bi-pencil"></i> Редактировать АЗС';
    
    const modalSave = document.getElementById('modal-save');
    if (modalSave) modalSave.innerHTML = '<i class="bi-check-circle"></i> Сохранить';
    
    const modal = document.getElementById('station-modal');
    if (modal) modal.classList.add('active');
    
    setTimeout(() => {
        if (nameField) nameField.focus();
    }, 100);
}

async function saveStation() {
    const id = document.getElementById('station-id')?.value || '';
    const name = document.getElementById('station-name')?.value.trim() || '';
    const address = document.getElementById('station-address')?.value.trim() || '';
    const phone = document.getElementById('station-phone')?.value.trim() || '';
    
    if (!name || !address) {
        showMessage('Ошибка', 'Заполните название и адрес', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('jwtToken') || localStorage.getItem('authToken');
        
        // Только те поля, которые принимает API (как в тесте)
        const stationData = {
            name: name,
            address: address,
            contactPhone: phone,
            chiefName: "Руководитель АЗС",  // Обязательное поле
            supplier: "Поставщик"           // Обязательное поле
            // НЕ добавляем createdBy, createdAt и т.д. - бекенд сам заполнит
        };
        
        console.log('Отправляемые данные:', stationData);
        
        if (isEditing && currentEditId) {
            // РЕДАКТИРОВАНИЕ: используем подход "удалить + создать новую"
            // 1. Soft Delete старой АЗС
            const deleteResponse = await fetch(`https://localhost:7282/api/GasStations/${currentEditId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (deleteResponse.ok) {
                console.log('Старая АЗС помечена как удаленная');
            }
            
            // 2. Создаем новую АЗС с обновленными данными
            const createResponse = await fetch('https://localhost:7282/api/GasStations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(stationData)
            });
            
            if (createResponse.ok) {
                const newStation = await createResponse.json();
                showMessage('Успех', `АЗС "${name}" обновлена (ID: ${newStation.id})`, 'success');
                await loadStationsFromAPI();
            } else {
                const errorText = await createResponse.text();
                throw new Error('Создание новой: ' + errorText);
            }
            
        } else {
            // ДОБАВЛЕНИЕ новой АЗС
            const response = await fetch('https://localhost:7282/api/GasStations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(stationData)
            });
            
            if (response.ok) {
                const newStation = await response.json();
                showMessage('Успех', `АЗС "${name}" добавлена (ID: ${newStation.id})`, 'success');
                await loadStationsFromAPI();
            } else {
                const errorText = await response.text();
                throw new Error(errorText);
            }
        }
        
    } catch (error) {
        console.error('Ошибка сохранения АЗС:', error);
        showMessage('Ошибка', 'Не удалось сохранить АЗС: ' + error.message, 'error');
    }
    
    closeModal();

}

async function deleteStation(id) {
    const station = stations.find(s => s.id === id);
    if (!station) return;
    
    if (!confirm(`Удалить АЗС "${station.name}"? (Soft Delete)`)) {
        return;
    }
    
    try {
        const token = localStorage.getItem('jwtToken') || localStorage.getItem('authToken');
        
        const response = await fetch(`${window.api?.API_BASE || 'https://localhost:7282/api'}/GasStations/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            showMessage('Удалено', `АЗС "${station.name}" помечена как удаленная (Soft Delete)`, 'info');
            // Перезагружаем данные
            await loadStationsFromAPI();
        } else {
            showMessage('Ошибка', 'Не удалось удалить АЗС', 'error');
        }
        
    } catch (error) {
        console.error('Ошибка удаления АЗС:', error);
        showMessage('Ошибка', 'Не удалось соединиться с сервером', 'error');
    }

}

function closeModal() {
    const modal = document.getElementById('station-modal');
    if (modal) modal.classList.remove('active');
    
    const form = document.getElementById('station-form');
    if (form) form.reset();
}

// ==================== СООБЩЕНИЯ ====================

function showMessage(title, text, type = 'info') {
    console.log(`${type}: ${title} - ${text}`);
    
    const container = document.getElementById('message-container');
    if (!container) return;
    
    const message = document.createElement('div');
    message.className = 'message';
    
    const icon = type === 'success' ? 'bi-check-circle' :
                 type === 'error' ? 'bi-exclamation-circle' :
                 type === 'warning' ? 'bi-exclamation-triangle' : 'bi-info-circle';
    
    message.innerHTML = `
        <i class="bi ${icon}"></i>
        <div class="message-content">
            <div class="message-title">${title}</div>
            <div class="message-text">${text}</div>
        </div>
        <button class="message-close" onclick="this.parentElement.remove()">
            <i class="bi-x"></i>
        </button>
    `;
    
    container.appendChild(message);
    
    setTimeout(() => {
        if (message.parentNode) message.remove();
    }, 5000);
}

// ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================

function setupEventListeners() {
    const addBtn = document.getElementById('btn-add-station');
    if (addBtn) addBtn.addEventListener('click', addStation);
    
    const testBtn = document.getElementById('btn-test-data');
    if (testBtn) testBtn.addEventListener('click', function() {
        console.log('Перезагрузка данных...');
        loadStationsFromAPI();
    });
    
    const closeBtn = document.getElementById('modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    
    const cancelBtn = document.getElementById('modal-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    const saveBtn = document.getElementById('modal-save');
    if (saveBtn) saveBtn.addEventListener('click', saveStation);
    
    const modal = document.getElementById('station-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }
    
    const form = document.getElementById('station-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            saveStation();
        });
    }
}

// ==================== ЗАГРУЗКА СТРАНИЦЫ ====================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Страница загружена');
    
    loadStationsFromAPI();
    setupNavigation();
    setupEventListeners();
    checkAPI();
});

// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================

window.editStation = editStation;
window.deleteStation = deleteStation;
window.addStation = addStation;
window.closeModal = closeModal;