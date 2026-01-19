// users-module.js - полноценный модуль управления пользователями
class UsersModule {
    constructor() {
        this.API_BASE = 'https://localhost:7282/api';
        this.token = localStorage.getItem('jwtToken') || localStorage.getItem('authToken');
        this.currentUser = this.getCurrentUser();
        this.isAdmin = this.currentUser?.role === 'Admin';
        
        console.log('<i class="bi-people"></i> UsersModule запущен');
        console.log('Текущий пользователь:', this.currentUser?.username, 'Роль:', this.currentUser?.role);
        
        if (!this.isAdmin) {
            console.log('❌ Доступ только для администратора');
            this.hideUsersTab();
            return;
        }
        
        this.init();
    }

    getCurrentUser() {
        try {
            const userJson = localStorage.getItem('user');
            return userJson ? JSON.parse(userJson) : null;
        } catch {
            return null;
        }
    }
    
    hideUsersTab() {
        // Скрываем вкладку "Пользователи" для не-админов
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            if (link.textContent.includes('Пользователи') || link.textContent.includes('Users')) {
                link.parentElement.style.display = 'none';
            }
        });
    }
    
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        this.setupTabListeners();
    }
    
    setupTabListeners() {
        const navElements = document.querySelectorAll('.nav-link, [data-page]');
        
        navElements.forEach(element => {
            element.addEventListener('click', () => {
                setTimeout(() => {
                    if (this.isUsersTabElement(element)) {
                        console.log('✅ Перешли на вкладку Пользователи');
                        this.loadUsersData();
                    } else {
                        this.removeUsersDashboard();
                    }
                }, 300);
            });
        });
    }
    
    isUsersTabElement(element) {
        const text = element.textContent.toLowerCase();
        return text.includes('пользователи') || text.includes('users');
    }
    
    async loadUsersData() {
        console.log('<i class="bi-arrow-clockwise"></i> Загрузка пользователей...');
        
        this.removeUsersDashboard();
        
        const container = this.createContainer();
        if (!container) return;
        
        container.innerHTML = this.getLoadingHTML();
        
        try {
            const users = await this.fetchData('/Users');
            console.log('<i class="bi-people"></i> Пользователи загружены:', users.length);
            this.renderUsersDashboard(container, users);
            
        } catch (error) {
            console.error('❌ Ошибка:', error);
            this.renderError(container, error.message);
        }
    }
    
    createContainer() {
        // Ищем правильный контейнер для вкладки
        const mainContent = document.querySelector('#page-users .container') || 
                           document.querySelector('main, .container, .content') || 
                           document.body;
        
        const container = document.createElement('div');
        container.id = 'usersDashboard';
        container.className = 'users-dashboard mt-4';
        container.style.cssText = `
            background: #172F47;
            border-radius: 10px;
            padding: 20px;
            border: 1px solid #274569;
            margin-top: 20px;
            margin-bottom: 50px;
        `;
        
        mainContent.appendChild(container);
        return container;
    }
    
    removeUsersDashboard() {
        const container = document.getElementById('usersDashboard');
        if (container) {
            container.remove();
        }
    }
    
    async fetchData(endpoint) {
        const response = await fetch(`${this.API_BASE}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`${endpoint}: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    }
    
    getLoadingHTML() {
        return `
            <div style="text-align: center; padding: 40px;">
                <div class="spinner-border" style="width: 3rem; height: 3rem; color: #D4B785;" role="status"></div>
                <h4 style="color: #D4B785; margin-top: 20px;">Загрузка пользователей...</h4>
                <p style="color: #D4D4D4;">Подключаемся к серверу</p>
            </div>
        `;
    }
    
    renderUsersDashboard(container, users) {
        const adminsCount = users.filter(u => u.role === 'Admin').length;
        const usersCount = users.filter(u => u.role === 'User').length;
        
        container.innerHTML = `
            <div>
                <!-- Заголовок -->
                <div style="border-bottom: 2px solid #D4B785; padding-bottom: 15px; margin-bottom: 25px;">
                    <h2 style="color: #D4B785; margin: 0;"><i class="bi-people"></i> Управление пользователями</h2>
                    <p style="color: #D4D4D4; margin: 5px 0 0 0;">
                        Все пользователи системы
                        <span style="background: #274569; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px;">Администратор</span>
                    </p>
                </div>
                
                <!-- Статистика -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
                    <div style="background: #274569; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #355a82;">
                        <div style="font-size: 24px; color: #D4B785;"><i class="bi-person"></i></div>
                        <div style="font-size: 28px; color: #D4B785; font-weight: bold;">${users.length}</div>
                        <div style="color: #D4D4D4;">всего пользователей</div>
                    </div>
                    <div style="background: #274569; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #355a82;">
                        <div style="font-size: 24px; color: #D4B785;"><i class="bi-person-badge"></i></div>
                        <div style="font-size: 28px; color: #D4B785; font-weight: bold;">${adminsCount}</div>
                        <div style="color: #D4D4D4;">администраторов</div>
                    </div>
                    <div style="background: #274569; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #355a82;">
                        <div style="font-size: 24px; color: #D4B785;"><i class="bi-person"></i></div>
                        <div style="font-size: 28px; color: #D4B785; font-weight: bold;">${usersCount}</div>
                        <div style="color: #D4D4D4;">обычных пользователей</div>
                    </div>
                </div>
                
                <!-- Кнопки управления -->
                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                    <button onclick="usersModule.addUser()" style="
                        background: #D4B785;
                        color: #172F47;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        font-weight: bold;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    ">
                        <span><i class="bi-plus-circle"></i></span> Добавить пользователя
                    </button>
                    
                    <button onclick="usersModule.refreshUsers()" style="
                        background: #274569;
                        color: #D4B785;
                        border: 1px solid #355a82;
                        padding: 10px 20px;
                        border-radius: 6px;
                        font-weight: bold;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    ">
                        <span><i class="bi-arrow-clockwise"></i></span> Обновить
                    </button>
                </div>
                
                <!-- Таблица -->
                <div style="background: #274569; border-radius: 8px; overflow: hidden; border: 1px solid #355a82;">
                    <div style="background: #1a3650; padding: 15px; border-bottom: 1px solid #355a82;">
                        <h4 style="color: #D4B785; margin: 0;"><i class="bi-list-ul"></i> Список пользователей</h4>
                    </div>
                    <div style="padding: 20px;">
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="border-bottom: 2px solid #355a82;">
                                        <th style="padding: 12px; text-align: left; color: #D4B785;">ID</th>
                                        <th style="padding: 12px; text-align: left; color: #D4B785;">Имя пользователя</th>
                                        <th style="padding: 12px; text-align: left; color: #D4B785;">ФИО</th>
                                        <th style="padding: 12px; text-align: left; color: #D4B785;">Email</th>
                                        <th style="padding: 12px; text-align: left; color: #D4B785;">Роль</th>
                                        <th style="padding: 12px; text-align: left; color: #D4B785;">Дата регистрации</th>
                                        <th style="padding: 12px; text-align: left; color: #D4B785;">Действия</th>
                                    </tr>
                                </thead>
                                                                <tbody>
                                    ${users.map(user => {
    const isCurrentUser = user.username === this.currentUser?.username;
    const isDeleted = user.deletedAt !== null && user.deletedAt !== undefined;
    const roleColor = isDeleted ? '#6c757d' : (user.role === 'Admin' ? '#D4B785' : '#4CAF50');
    const roleBg = isDeleted ? 'rgba(108, 117, 125, 0.1)' : 
                  (user.role === 'Admin' ? 'rgba(212, 183, 133, 0.1)' : 'rgba(76, 175, 80, 0.1)');
    
    return `
        <tr style="border-bottom: 1px solid #355a82; ${isDeleted ? 'opacity: 0.7;' : ''}">
            <td style="padding: 12px; color: ${isDeleted ? '#6c757d' : 'white'};">${user.id}</td>
            <td style="padding: 12px; color: ${isDeleted ? '#6c757d' : 'white'};">
                <strong>${user.username}</strong>
                ${isCurrentUser ? 
                    '<span style="background: #D4B785; color: #172F47; padding: 2px 6px; border-radius: 3px; font-size: 11px; margin-left: 5px;">Вы</span>' 
                    : ''}
                ${isDeleted ? 
                    '<span style="background: #6c757d; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px; margin-left: 5px;">Удален</span>' 
                    : ''}
            </td>
            <td style="padding: 12px; color: ${isDeleted ? '#8a9199' : '#D4D4D4'};">
                ${user.firstName || ''} ${user.lastName || ''}
            </td>
            <td style="padding: 12px; color: ${isDeleted ? '#8a9199' : '#D4D4D4'};">
                ${user.email || '—'}
            </td>
            <td style="padding: 12px; vertical-align: middle;">
                <span style="
                    background: ${roleBg};
                    color: ${roleColor};
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-size: 13px;
                    font-weight: bold;
                    border: 1px solid ${roleColor};
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    line-height: 1;
                    opacity: ${isDeleted ? 0.6 : 1};
                ">
                    <span style="font-size: 14px;">
                        ${isDeleted ? '<i class="bi-person-x"></i>' : (user.role === 'Admin' ? '<i class="bi-person-badge"></i>' : '<i class="bi-person-circle"></i>')}
                    </span>
                    <span>
                        ${isDeleted ? 'Удален' : (user.role === 'Admin' ? 'Админ' : 'Пользователь')}
                    </span>
                </span>
                ${isDeleted ? `
                    <div style="color: #6c757d; font-size: 11px; margin-top: 4px;">
                        Удален: ${new Date(user.deletedAt).toLocaleDateString('ru-RU')}
                    </div>
                ` : ''}
            </td>
            <td style="padding: 12px; color: ${isDeleted ? '#8a9199' : '#D4D4D4'};">
                ${user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : '—'}
            </td>
            <td style="padding: 12px; vertical-align: middle;">
                <div style="display: flex; gap: 5px;">
                    ${!isDeleted ? `
                        <button onclick="usersModule.editUser(${user.id})" style="
                            background: #274569;
                            color: #D4B785;
                            border: 1px solid #355a82;
                            padding: 6px 12px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 13px;
                            display: inline-flex;
                            align-items: center;
                            gap: 5px;
                        ">
                            <span><i class="bi-pencil"></i></span> Изменить
                        </button>
                    ` : `
                        <button onclick="usersModule.restoreUser(${user.id})" style="
                            background: rgba(40, 167, 69, 0.1);
                            color: #28a745;
                            border: 1px solid rgba(40, 167, 69, 0.3);
                            padding: 6px 12px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 13px;
                            display: inline-flex;
                            align-items: center;
                            gap: 5px;
                        ">
                            <span>↩️</span> Восстановить
                        </button>
                    `}
                    
                    ${!isCurrentUser && !isDeleted ? `
                        <button onclick="usersModule.deleteUser(${user.id})" style="
                            background: rgba(220, 53, 69, 0.1);
                            color: #dc3545;
                            border: 1px solid rgba(220, 53, 69, 0.3);
                            padding: 6px 12px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 13px;
                            display: inline-flex;
                            align-items: center;
                            gap: 5px;
                        ">
                            <span><i class="bi-trash"></i></span> удалить
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `;
}).join('')}
                                </tbody>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <!-- Информация -->
                <div style="margin-top: 20px; padding: 15px; background: #1a3650; border-radius: 8px; border-left: 4px solid #D4B785;">
                    <p style="color: #D4D4D4; margin: 0;">
                        <strong>Всего ${users.length} пользователей</strong> в системе.
                        <br>
                        <small style="color: #D4B785;">
                            Текущий пользователь: <strong>${this.currentUser?.username}</strong> (${this.currentUser?.role})
                            • Администраторы могут добавлять, редактировать и удалять пользователей
                        </small>
                    </p>
                </div>
            </div>
        `;
    }
    
    renderError(container, message) {
        container.innerHTML = `
            <div style="background: rgba(220, 53, 69, 0.1); border: 1px solid rgba(220, 53, 69, 0.3); border-radius: 8px; padding: 20px;">
                <h4 style="color: #ff6b6b; margin-top: 0;">❌ Ошибка загрузки</h4>
                <p style="color: #D4D4D4;">${message}</p>
                <button onclick="usersModule.loadUsersData()" style="
                    background: #D4B785;
                    color: #172F47;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    font-weight: bold;
                    cursor: pointer;
                    margin-top: 10px;
                ">Повторить попытку</button>
            </div>
        `;
    }
    
    // ==================== CRUD МЕТОДЫ ====================
    
    addUser() {
        alert('Добавление нового пользователя\n(Форма регистрации будет реализована позже)');
    }
    
    async editUser(userId) {
    try {
        // 1. Получаем данные пользователя
        const users = await this.fetchData('/Users');
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            alert('Пользователь не найден');
            return;
        }
        
        // 2. Запрашиваем новые данные через prompt
        const newFirstName = prompt('Введите новое имя:', user.firstName || '');
        const newLastName = prompt('Введите новую фамилию:', user.lastName || '');
        const newEmail = prompt('Введите новый email:', user.email || '');
        
        // Если пользователь отменил - выходим
        if (newFirstName === null && newLastName === null && newEmail === null) {
            return;
        }
        
        // 3. Подготавливаем данные для отправки
        const updatedUser = {
            id: user.id,
            username: user.username, // Логин не меняем
            email: newEmail || user.email,
            firstName: newFirstName || user.firstName,
            lastName: newLastName || user.lastName,
            role: user.role, // Роль не меняем в этой функции
            // Аудиторские поля
            modifiedAt: new Date().toISOString(),
            modifiedBy: this.currentUser?.username || 'Admin'
        };
        
        // 4. Отправляем PUT запрос на сервер
        const response = await fetch(`${this.API_BASE}/Users/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedUser)
        });
        
        // 5. Проверяем результат
        if (response.ok) {
            alert('✅ Пользователь успешно обновлен!');
            // Перезагружаем список пользователей
            this.loadUsersData();
        } else {
            const errorText = await response.text();
            alert(`❌ Ошибка: ${errorText}`);
        }
        
    } catch (error) {
        console.error('Ошибка редактирования пользователя:', error);
        alert('❌ Ошибка при редактировании: ' + error.message);
    }
}
    
   async deleteUser(userId) {
    try {
        // 1. Получаем данные пользователя
        const users = await this.fetchData('/Users');
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            alert('Пользователь не найден');
            return;
        }
        
        // 2. Проверяем, не пытаемся ли удалить себя
        if (user.username === this.currentUser?.username) {
            alert('❌ Вы не можете удалить самого себя!');
            return;
        }
        
        // 3. Проверяем, не удален ли уже пользователь
        if (user.deletedAt) {
            alert('⚠️ Этот пользователь уже удален');
            return;
        }
        
        // 4. Подтверждение SOFT DELETE (деактивация)
        const confirmMessage = `Вы уверены, что хотите удалить пользователя?\n\n` +
                              `Логин: ${user.username}\n` +
                              `Имя: ${user.firstName || '—'} ${user.lastName || ''}\n` +
                              `Роль: ${user.role}\n\n` +
                              `Пользователь будет помечен как удаленный (Soft Delete).`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // 5. Отправляем DELETE запрос (на бекенде это Soft Delete)
        const response = await fetch(`${this.API_BASE}/Users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        });
        
        // 6. Проверяем результат
        if (response.ok) {
            alert(`✅ Пользователь "${user.username}" удален (Soft Delete)`);
            
            // 7. Перезагружаем список пользователей
            this.loadUsersData();
            
        } else if (response.status === 404) {
            alert('❌ Пользователь не найден');
        } else {
            const errorText = await response.text();
            alert(`❌ Ошибка при деактивации: ${response.status} ${response.statusText}\n${errorText}`);
        }
        
    } catch (error) {
        console.error('Ошибка деактивации пользователя:', error);
        alert('❌ Ошибка при деактивации пользователя: ' + error.message);
    }

}
    
    refreshUsers() {
        console.log('<i class="bi-arrow-clockwise"></i> Обновление списка пользователей...');
        this.loadUsersData();
    }
}

// Глобальный экземпляр
window.usersModule = new UsersModule();