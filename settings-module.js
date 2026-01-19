// settings-module.js - модуль настроек системы
class SettingsModule {
    constructor() {
        this.API_BASE = 'https://localhost:7282/api';
    this.token = localStorage.getItem('jwtToken') || localStorage.getItem('authToken');
    this.currentUser = this.getCurrentUser();
    this.isAdmin = this.currentUser?.role === 'Admin';
    
    console.log('<i class="bi-gear"></i> SettingsModule запущен');
    console.log('Пользователь:', this.currentUser?.username);
    
    // ЗАГРУЖАЕМ ТЕМУ ПРИ ЗАПУСКЕ
    setTimeout(() => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        console.log('Загружаю сохранённую тему:', savedTheme);
        this.setTheme(savedTheme);
    }, 100);
    
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
                    if (this.isSettingsTabElement(element)) {
                        console.log('✅ Перешли на вкладку Настройки');
                        this.loadSettingsData();
                    } else {
                        this.removeSettingsDashboard();
                    }
                }, 300);
            });
        });
    }
    
    isSettingsTabElement(element) {
        const text = element.textContent.toLowerCase();
        return text.includes('настройки') || text.includes('settings');
    }
    
    async loadSettingsData() {
        console.log('<i class="bi-arrow-clockwise"></i> Загрузка настроек...');
        
        this.removeSettingsDashboard();
        
        const container = this.createContainer();
        if (!container) return;
        
        container.innerHTML = this.getLoadingHTML();
        
        try {
            // Загружаем статистику системы
            const stats = await this.getSystemStats();
            this.renderSettingsDashboard(container, stats);
            
        } catch (error) {
            console.error('❌ Ошибка:', error);
            this.renderError(container, error.message);
        }
    }
    
    async getSystemStats() {
        // Собираем статистику из разных endpoints
        const stats = {
            user: this.currentUser,
            timestamp: new Date().toLocaleString('ru-RU'),
            isAdmin: this.isAdmin
        };
        
        try {
            // Если админ - получаем полную статистику
            if (this.isAdmin) {
                const [users, stations, fuelTypes, fuelPrices] = await Promise.all([
                    this.fetchData('/Users'),
                    this.fetchData('/GasStations'),
                    this.fetchData('/FuelTypes'),
                    this.fetchData('/FuelPrices')
                ]);
                
                stats.users = users.length;
                stats.stations = stations.length;
                stats.fuelTypes = fuelTypes.length;
                stats.fuelPrices = fuelPrices.length;
                stats.admins = users.filter(u => u.role === 'Admin').length;
                stats.regularUsers = users.filter(u => u.role === 'User').length;
                
            } else {
                // Для обычных пользователей - только публичные данные
                const [stations, fuelTypes] = await Promise.all([
                    this.fetchData('/GasStations'),
                    this.fetchData('/FuelTypes')
                ]);
                
                stats.stations = stations.length;
                stats.fuelTypes = fuelTypes.length;
            }
            
        } catch (error) {
            console.log('Используем базовую статистику:', error.message);
            stats.users = 'Не доступно';
            stats.stations = 'Не доступно';
            stats.fuelTypes = 'Не доступно';
            stats.fuelPrices = 'Не доступно';
        }
        
        return stats;
    }
    
    createContainer() {
        const mainContent = document.querySelector('#page-settings .container') || 
                           document.querySelector('main, .container, .content') || 
                           document.body;
        
        const container = document.createElement('div');
        container.id = 'settingsDashboard';
        container.className = 'settings-dashboard mt-4';
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
    
    removeSettingsDashboard() {
        const container = document.getElementById('settingsDashboard');
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
                <h4 style="color: #D4B785; margin-top: 20px;">Загрузка настроек...</h4>
                <p style="color: #D4D4D4;">Получаем статистику системы</p>
            </div>
        `;
    }
    
    renderSettingsDashboard(container, stats) {
    container.innerHTML = `
        <div>
            <!-- Заголовок -->
            <div style="border-bottom: 2px solid #D4B785; padding-bottom: 15px; margin-bottom: 25px;">
                <h2 style="color: #D4B785; margin: 0;"><i class="bi-gear"></i> Настройки системы</h2>
                <p style="color: #D4D4D4; margin: 5px 0 0 0;">
                    Управление профилем и системная информация
                    ${this.isAdmin ? '<span style="background: #274569; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px;">Полный доступ</span>' : ''}
                </p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <!-- Левый столбец: Профиль пользователя -->
                <div>
                    <div style="background: #274569; border-radius: 8px; padding: 20px; border: 1px solid #355a82;">
                        <h4 style="color: #D4B785; margin-top: 0; margin-bottom: 20px;">
                            <i class="bi-person-circle me-2"></i>Ваш профиль
                        </h4>
                        
                        <div style="margin-bottom: 25px;">
                            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                                <div style="
                                    width: 60px;
                                    height: 60px;
                                    background: #D4B785;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    margin-right: 15px;
                                    color: #172F47;
                                    font-size: 24px;
                                    font-weight: bold;
                                ">
                                    ${stats.user?.firstName?.charAt(0) || stats.user?.username?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <h5 style="color: white; margin: 0;">
                                        ${stats.user?.firstName || 'Имя'} ${stats.user?.lastName || ''}
                                    </h5>
                                    <p style="color: #D4D4D4; margin: 5px 0 0 0;">
                                        @${stats.user?.username || 'пользователь'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div style="background: #1a3650; border-radius: 6px; padding: 15px; margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <span style="color: #D4D4D4;">Роль:</span>
                                <span style="color: #D4B785; font-weight: bold;">
                                    ${stats.user?.role === 'Admin' ? '<i class="bi-person-badge"></i> Администратор' : '<i class="bi-person-circle"></i> Пользователь'}
                                </span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <span style="color: #D4D4D4;">Email:</span>
                                <span style="color: #D4D4D4;">${stats.user?.email || '—'}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #D4D4D4;">Последний вход:</span>
                                <span style="color: #D4D4D4;">${stats.timestamp}</span>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 10px; margin-top: 20px;">
                            <button onclick="settingsModule.editProfile()" style="
                                flex: 1;
                                background: #D4B785;
                                color: #172F47;
                                border: none;
                                padding: 10px;
                                border-radius: 6px;
                                font-weight: bold;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 8px;
                            ">
                                <i class="bi-pencil"></i> Редактировать профиль
                            </button>
                            <button onclick="settingsModule.logout()" style="
                                flex: 1;
                                background: #274569;
                                color: #D4B785;
                                border: 1px solid #355a82;
                                padding: 10px;
                                border-radius: 6px;
                                font-weight: bold;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 8px;
                            ">
                                <i class="bi-box-arrow-right"></i> Выйти
                            </button>
                        </div>
                    </div>
                    
                    <!-- Настройки темы -->
                    <div style="background: #274569; border-radius: 8px; padding: 20px; border: 1px solid #355a82; margin-top: 20px;">
                        <h4 style="color: #D4B785; margin-top: 0; margin-bottom: 15px;">
                            <i class="bi-palette me-2"></i>Тема оформления
                        </h4>
                        
                        <div style="display: flex; gap: 10px;">
                            <button onclick="settingsModule.setTheme('dark')" style="
                                flex: 1;
                                background: #172F47;
                                color: #D4B785;
                                border: 2px solid #D4B785;
                                padding: 12px;
                                border-radius: 6px;
                                font-weight: bold;
                                cursor: pointer;
                            ">
                                🌙 Темная
                            </button>
                            <button onclick="settingsModule.setTheme('light')" style="
                                flex: 1;
                                background: #f8f9fa;
                                color: #172F47;
                                border: 2px solid #dee2e6;
                                padding: 12px;
                                border-radius: 6px;
                                font-weight: bold;
                                cursor: pointer;
                            ">
                                ☀️ Светлая
                            </button>
                        </div>
                        
                        <p style="color: #D4D4D4; font-size: 13px; margin-top: 10px; margin-bottom: 0;">
                            Текущая тема: <strong>Темная</strong> (по умолчанию)
                        </p>
                    </div>
                </div>
                
                <!-- Правый столбец: Статистика системы -->
                <div>
                    <div style="background: #274569; border-radius: 8px; padding: 20px; border: 1px solid #355a82; height: 100%;">
                        <h4 style="color: #D4B785; margin-top: 0; margin-bottom: 20px;">
                            <i class="bi-graph-up me-2"></i>Статистика системы
                        </h4>
                        
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px;">
                            <div style="background: #1a3650; padding: 15px; border-radius: 6px; text-align: center;">
                                <div style="font-size: 24px; color: #D4B785;"><i class="bi-people"></i></div>
                                <div style="font-size: 28px; color: #D4B785; font-weight: bold;">${stats.users || '—'}</div>
                                <div style="color: #D4D4D4; font-size: 13px;">пользователей</div>
                            </div>
                            <div style="background: #1a3650; padding: 15px; border-radius: 6px; text-align: center;">
                                <div style="font-size: 24px; color: #D4B785;"><i class="bi-fuel-pump"></i></div>
                                <div style="font-size: 28px; color: #D4B785; font-weight: bold;">${stats.stations || '—'}</div>
                                <div style="color: #D4D4D4; font-size: 13px;">автозаправок</div>
                            </div>
                            <div style="background: #1a3650; padding: 15px; border-radius: 6px; text-align: center;">
                                <div style="font-size: 24px; color: #D4B785;"><i class="bi-fuel-pump"></i></div>
                                <div style="font-size: 28px; color: #D4B785; font-weight: bold;">${stats.fuelTypes || '—'}</div>
                                <div style="color: #D4D4D4; font-size: 13px;">типов топлива</div>
                            </div>
                            <div style="background: #1a3650; padding: 15px; border-radius: 6px; text-align: center;">
                                <div style="font-size: 24px; color: #D4B785;"><i class="bi-currency-exchange"></i></div>
                                <div style="font-size: 28px; color: #D4B785; font-weight: bold;">${stats.fuelPrices || '—'}</div>
                                <div style="color: #D4D4D4; font-size: 13px;">записей цен</div>
                            </div>
                        </div>
                        
                        ${this.isAdmin ? `
                            <div style="background: #1a3650; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
                                <h5 style="color: #D4B785; margin-top: 0; margin-bottom: 10px;">Распределение ролей</h5>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span style="color: #D4D4D4;">Администраторы:</span>
                                    <span style="color: #D4B785; font-weight: bold;">${stats.admins || '—'}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="color: #D4D4D4;">Пользователи:</span>
                                    <span style="color: #4CAF50; font-weight: bold;">${stats.regularUsers || '—'}</span>
                                </div>
                            </div>
                        ` : ''}
                        
                        <div style="background: rgba(212, 183, 133, 0.1); border-radius: 6px; padding: 15px; border-left: 4px solid #D4B785;">
                            <h5 style="color: #D4B785; margin-top: 0; margin-bottom: 10px;">
                                <i class="bi-info-circle me-2"></i>О системе
                            </h5>
                            <p style="color: #D4D4D4; margin: 0; font-size: 14px;">
                                <strong>Система управления автозаправочными станциями</strong><br>
                                Версия 1.0.0 • ASP.NET Core Web API • SQL Server<br>
                                ${this.isAdmin ? 'Полные права доступа' : 'Ограниченный доступ'}
                            </p>
                            <p style="color: #D4B785; font-size: 13px; margin-top: 10px; margin-bottom: 0;">
                                <i class="bi-clock me-1"></i> Обновлено: ${stats.timestamp}
                            </p>
                        </div>
                        
                        <!-- Кнопки управления системой (только для админа) -->
                        ${this.isAdmin ? `
                            <div style="display: flex; gap: 10px; margin-top: 25px;">
                                <button onclick="settingsModule.systemBackup()" style="
                                    flex: 1;
                                    background: #274569;
                                    color: #D4B785;
                                    border: 1px solid #355a82;
                                    padding: 10px;
                                    border-radius: 6px;
                                    font-weight: bold;
                                    cursor: pointer;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    gap: 8px;
                                    font-size: 14px;
                                ">
                                    <i class="bi-download"></i> Резервная копия
                                </button>
                                <button onclick="settingsModule.clearCache()" style="
                                    flex: 1;
                                    background: #274569;
                                    color: #D4B785;
                                    border: 1px solid #355a82;
                                    padding: 10px;
                                    border-radius: 6px;
                                    font-weight: bold;
                                    cursor: pointer;
                                    display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        gap: 8px;
                                        font-size: 14px;
                                    ">
                                    <i class="bi-trash"></i> Очистить кэш
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <!-- ГРАФИКИ СТАТИСТИКИ (только для админа) -->
            ${this.isAdmin ? `
                <div id="admin-statistics" style="margin-top: 30px;">
                    <h4 style="color: #D4B785; border-bottom: 2px solid #D4B785; padding-bottom: 10px; margin-bottom: 20px;">
                        <i class="bi-bar-chart me-2"></i>Визуализация данных
                    </h4>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                        <div style="background: #1a3650; border-radius: 8px; padding: 20px;">
                            <h5 style="color: #D4B785; margin-top: 0;">АЗС по поставщикам</h5>
                            <div style="height: 250px;">
                                <canvas id="stationsChart"></canvas>
                            </div>
                        </div>
                        
                        <div style="background: #1a3650; border-radius: 8px; padding: 20px;">
                            <h5 style="color: #D4B785; margin-top: 0;">Пользователи по ролям</h5>
                            <div style="height: 250px;">
                                <canvas id="usersChart"></canvas>
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: #1a3650; border-radius: 8px; padding: 20px;">
                        <h5 style="color: #D4B785; margin-top: 0;">Средние цены на топливо</h5>
                        <div style="height: 300px;">
                            <canvas id="fuelPricesChart"></canvas>
                        </div>
                    </div>
                </div>
                
                <script>
                    // Автоматический запуск графиков после загрузки
                    setTimeout(() => {
                        if (window.statisticsModule) {
                            console.log('🚀 Запускаю модуль статистики...');
                            window.statisticsModule.loadStatistics();
                        }
                    }, 800);
                </script>
            ` : ''}
            
            <!-- Футер с информацией -->
            <div style="margin-top: 30px; padding: 15px; background: #1a3650; border-radius: 8px; text-align: center;">
                <p style="color: #D4D4D4; margin: 0; font-size: 14px;">
                    <i class="bi-shield-check me-1"></i> Система защищена • 
                    <i class="bi-database me-1"></i> База данных: SQL Server • 
                    <i class="bi-cpu me-1"></i> API: ASP.NET Core
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
                <button onclick="settingsModule.loadSettingsData()" style="
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
    
    // ==================== МЕТОДЫ ДЛЯ КНОПОК ====================
    
    editProfile() {
        alert('Редактирование профиля\n(Форма будет реализована позже)');
    }
    
    logout() {
        if (confirm('Вы уверены, что хотите выйти из системы?')) {
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        }
    }
    
    setTheme(theme) {
    console.log('🎨 Смена темы на:', theme);
    
    // 1. Меняем класс body
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(theme + '-theme');
    
    // 2. Сохраняем в localStorage
    localStorage.setItem('theme', theme);
    
    // 3. Обновляем активные кнопки
    this.updateActiveThemeButtons(theme);
    
    // 4. Обновляем текст "Текущая тема"
    this.updateCurrentThemeText(theme);
    
    // 5. Обновляем таблицы
    this.updateTablesForCurrentTheme(theme);
    
    console.log('✅ Тема успешно изменена');
}

// Добавляем вспомогательные методы
updateActiveThemeButtons(theme) {
    const allButtons = document.querySelectorAll('button');
    
    allButtons.forEach(btn => {
        const text = btn.textContent.trim();
        if (text.includes('Темная') || text.includes('🌙') || 
            text.includes('Светлая') || text.includes('☀️')) {
            
            // Убираем все стили
            btn.style.backgroundColor = '';
            btn.style.color = '';
            btn.style.borderColor = '';
            btn.style.fontWeight = '';
            
            if ((theme === 'dark' && (text.includes('Темная') || text.includes('🌙'))) ||
                (theme === 'light' && (text.includes('Светлая') || text.includes('☀️')))) {
                
                // Делаем кнопку активной
                btn.style.backgroundColor = '#D4B785';
                btn.style.color = '#172F47';
                btn.style.borderColor = '#D4B785';
                btn.style.fontWeight = 'bold';
            }
        }
    });
}

updateCurrentThemeText(theme) {
    // Ищем элемент с текстом "Текущая тема"
    const allElements = document.querySelectorAll('*');
    
    for (let el of allElements) {
        if (el.textContent && el.textContent.includes('Текущая тема')) {
            const themeName = theme === 'dark' ? 'Темная (по умолчанию)' : 'Светлая';
            el.textContent = 'Текущая тема: ' + themeName;
            break;
        }
    }
}

updateTablesForCurrentTheme(theme) {
    const tables = document.querySelectorAll('.table');
    
    tables.forEach(table => {
        if (theme === 'light') {
            // Светлая тема для таблиц
            table.style.cssText = `
                --bs-table-bg: #ffffff !important;
                --bs-table-color: #333333 !important;
                --bs-table-border-color: #e2e8f0 !important;
                --bs-table-striped-bg: #f8f9fa !important;
                --bs-table-hover-bg: #f1f3f5 !important;
            `;
            
        } else {
            // Тёмная тема для таблиц
            table.style.cssText = `
                --bs-table-bg: #172F47 !important;
                --bs-table-color: #D4D4D4 !important;
                --bs-table-border-color: #355a82 !important;
                --bs-table-striped-bg: #1a3650 !important;
                --bs-table-hover-bg: #1a3650 !important;
            `;
        }
    });
}
    
    systemBackup() {
        alert('Создание резервной копии базы данных\n(Функция будет реализована позже)');
    }
    
    clearCache() {
        if (confirm('Очистить кэш приложения?')) {
            alert('Кэш очищен\n(В реальном проекте очистятся временные данные)');
        }
    }
    
}

// Глобальный экземпляр
window.settingsModule = new SettingsModule();
