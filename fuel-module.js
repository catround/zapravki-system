// fuel-module.js - модуль управления топливом (новая версия)
class FuelModule {
    constructor() {
        this.API_BASE = 'https://localhost:7282/api';
        this.token = localStorage.getItem('jwtToken') || localStorage.getItem('authToken');
        this.currentUser = this.getCurrentUser();
        this.isAdmin = this.currentUser?.role === 'Admin';
        
        console.log('<i class="bi-fuel-pump"></i> FuelModule запущен');
        console.log('Пользователь:', this.currentUser?.username, 'Роль:', this.currentUser?.role);
        
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
        this.checkCurrentTab();
    }
    
    setupTabListeners() {
        const navElements = document.querySelectorAll('.nav-link, [data-page]');
        
        navElements.forEach(element => {
            element.addEventListener('click', () => {
                setTimeout(() => {
                    if (this.isFuelTabElement(element)) {
                        console.log('✅ Перешли на вкладку Топливо');
                        this.loadFuelData();
                    } else {
                        this.removeFuelDashboard();
                    }
                }, 300);
            });
        });
    }
    
    isFuelTabElement(element) {
        const text = element.textContent.toLowerCase();
        return text.includes('топливо') || text.includes('fuel');
    }
    
    checkCurrentTab() {
        const activeTab = document.querySelector('.nav-link.active');
        if (activeTab && this.isFuelTabElement(activeTab)) {
            console.log('✅ Уже на вкладке Топливо');
            setTimeout(() => this.loadFuelData(), 500);
        }
    }
    
    removeFuelDashboard() {
        const container = document.getElementById('fuelDashboard');
        if (container) {
            container.remove();
        }
    }
    
    async loadFuelData() {
        console.log('<i class="bi-arrow-clockwise"></i> Загрузка данных о топливе...');
        
        this.removeFuelDashboard();
        
        const container = this.createContainer();
        if (!container) return;
        
        container.innerHTML = this.getLoadingHTML();
        
        try {
            const [fuelTypes, gasStations, fuelPrices] = await Promise.all([
                this.fetchData('/FuelTypes'),
                this.fetchData('/GasStations'),
                this.fetchData('/FuelPrices')
            ]);
            
            console.log('<i class="bi-graph-up"></i> Данные загружены:', {
                fuelTypes: fuelTypes.length,
                gasStations: gasStations.length,
                fuelPrices: fuelPrices.length
            });
            
            this.renderFuelDashboard(container, fuelTypes, gasStations, fuelPrices);
            
        } catch (error) {
            console.error('❌ Ошибка загрузки:', error);
            this.renderError(container, error.message);
        }
    }
    
    createContainer() {
        const mainContent = document.querySelector('#page-fuel .container') || 
                           document.querySelector('main, .container, .content') || 
                           document.body;
        
        const container = document.createElement('div');
        container.id = 'fuelDashboard';
        container.className = 'fuel-dashboard mt-4';
        container.style.cssText = `
            background: #172F47;
            border-radius: 10px;
            padding: 20px;
            border: 1px solid #274569;
            margin-top: 20px;
        `;
        
        mainContent.appendChild(container);
        return container;
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
                <h4 style="color: #D4B785; margin-top: 20px;">Загрузка данных о топливе...</h4>
                <p style="color: #D4D4D4;">Подключаемся к серверу</p>
            </div>
        `;
    }
    
    renderFuelDashboard(container, fuelTypes, gasStations, fuelPrices) {
        // Группируем цены по типам топлива
        const pricesByType = {};
        fuelPrices.forEach(price => {
            if (!pricesByType[price.fuelTypeId]) {
                pricesByType[price.fuelTypeId] = [];
            }
            pricesByType[price.fuelTypeId].push(price);
        });
        
        // Функция для получения названия АЗС
        const getStationName = (id) => {
            const station = gasStations.find(s => s.id === id);
            return station ? station.name : `АЗС #${id}`;
        };
        
        container.innerHTML = `
            <div>
                <!-- Заголовок -->
                <div style="border-bottom: 2px solid #D4B785; padding-bottom: 15px; margin-bottom: 25px;">
                    <h2 style="color: #D4B785; margin: 0;"><i class="bi-fuel-pump"></i> Управление топливом</h2>
                    <p style="color: #D4D4D4; margin: 5px 0 0 0;">
                        Все типы топлива и цены на автозаправках
                        ${this.isAdmin ? '<span style="background: #274569; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px;">Режим администратора</span>' : ''}
                    </p>
                </div>
                
                <!-- Статистика -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
                    <div style="background: #274569; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #355a82;">
                        <div style="font-size: 24px; color: #D4B785;"><i class="bi-droplet"></i></div>
                        <div style="font-size: 28px; color: #D4B785; font-weight: bold;">${fuelTypes.length}</div>
                        <div style="color: #D4D4D4;">типов топлива</div>
                    </div>
                    <div style="background: #274569; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #355a82;">
                        <div style="font-size: 24px; color: #D4B785;"><i class="bi-fuel-pump"></i></div>
                        <div style="font-size: 28px; color: #D4B785; font-weight: bold;">${gasStations.length}</div>
                        <div style="color: #D4D4D4;">автозаправок</div>
                    </div>
                    <div style="background: #274569; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #355a82;">
                        <div style="font-size: 24px; color: #D4B785;"><i class="bi-currency-exchange"></i></div>
                        <div style="font-size: 28px; color: #D4B785; font-weight: bold;">${fuelPrices.length}</div>
                        <div style="color: #D4D4D4;">записей цен</div>
                    </div>
                </div>
                
                <!-- Таблица -->
                <div style="background: #274569; border-radius: 8px; overflow: hidden; border: 1px solid #355a82;">
                    <div style="background: #1a3650; padding: 15px; border-bottom: 1px solid #355a82; display: flex; justify-content: space-between; align-items: center;">
                        <h4 style="color: #D4B785; margin: 0;"><i class="bi-list-ul"></i> Список типов топлива</h4>
                        ${this.isAdmin ? 
                            `<button onclick="fuelModule.showAddPriceForm()" style="
                                background: #D4B785;
                                color: #172F47;
                                border: none;
                                padding: 8px 16px;
                                border-radius: 4px;
                                font-weight: bold;
                                cursor: pointer;
                                font-size: 14px;
                            "><i class="bi-plus-circle"></i> Добавить цену</button>` 
                            : ''
                        }
                    </div>
                    <div style="padding: 20px;">
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="border-bottom: 2px solid #355a82;">
                                        <th style="padding: 12px; text-align: left; color: #D4B785;">Тип топлива</th>
                                        <th style="padding: 12px; text-align: left; color: #D4B785;">Описание</th>
                                        <th style="padding: 12px; text-align: left; color: #D4B785;">Цены на АЗС</th>
                                        <th style="padding: 12px; text-align: left; color: #D4B785;">Средняя цена</th>
                                        ${this.isAdmin ? '<th style="padding: 12px; text-align: left; color: #D4B785;">Действия</th>' : ''}
                                    </tr>
                                </thead>
                                <tbody>
                                    ${fuelTypes.map(fuel => {
                                        const prices = pricesByType[fuel.id] || [];
                                        const averagePrice = prices.length > 0 
                                            ? (prices.reduce((sum, p) => sum + p.price, 0) / prices.length).toFixed(2)
                                            : '—';
                                        
                                        // Показываем цены для первых 3 АЗС
                                        const stationsList = prices.slice(0, 3).map(p => 
                                            `<div style="margin-bottom: 5px; display: flex; justify-content: space-between;">
                                                <span>${getStationName(p.stationId)}:</span>
                                                <span><strong>${p.price.toFixed(2)} ₽</strong></span>
                                            </div>`
                                        ).join('');
                                        
                                        const moreCount = prices.length > 3 ? `+ еще ${prices.length - 3}` : '';
                                        
                                        return `
                                            <tr style="border-bottom: 1px solid #355a82;">
                                                <td style="padding: 12px; color: white;"><strong>${fuel.name}</strong></td>
                                                <td style="padding: 12px; color: #D4D4D4;">${fuel.description || '—'}</td>
                                                <td style="padding: 12px; color: #D4D4D4;">
                                                    ${stationsList || 'Нет данных'}
                                                    ${moreCount ? `<div style="color: #D4B785; font-size: 12px;">${moreCount}</div>` : ''}
                                                </td>
                                                <td style="padding: 12px;">
                                                    <span style="background: #D4B785; color: #172F47; padding: 5px 10px; border-radius: 4px; font-weight: bold;">
                                                        ${averagePrice} ₽
                                                    </span>
                                                </td>
                                                ${this.isAdmin ? `
                                                    <td style="padding: 12px;">
                                                        <button onclick="fuelModule.editFuelPrice(${fuel.id})" style="
                                                            background: #274569;
                                                            color: #D4B785;
                                                            border: 1px solid #355a82;
                                                            padding: 6px 12px;
                                                            border-radius: 4px;
                                                            cursor: pointer;
                                                            font-size: 13px;
                                                            margin-right: 5px;
                                                        "><i class="bi-pencil"></i> Изменить</button>
                                                        <button onclick="fuelModule.updateFuelPrice(${fuel.id})" style="
                                                            background: #1a3650;
                                                            color: #4CAF50;
                                                            border: 1px solid #4CAF50;
                                                            padding: 6px 12px;
                                                            border-radius: 4px;
                                                            cursor: pointer;
                                                            font-size: 13px;
                                                        ">💰 Обновить</button>
                                                    </td>
                                                ` : ''}
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <!-- Информация -->
                <div style="margin-top: 20px; padding: 15px; background: #1a3650; border-radius: 8px; border-left: 4px solid #D4B785;">
                    <p style="color: #D4D4D4; margin: 0;">
                        Данные загружены из базы данных SQL Server. 
                        Всего ${fuelTypes.length} типов топлива на ${gasStations.length} АЗС.
                        ${this.isAdmin ? 
                            '<br><small style="color: #D4B785;">Вы можете редактировать цены (кнопки выше)</small>' : 
                            '<br><small style="color: #D4D4D4;">Для редактирования цен войдите как администратор</small>'
                        }
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
                <button onclick="fuelModule.loadFuelData()" style="
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
    
    
 // Методы для админа
editFuelPrice(fuelId) {
    alert(`Редактирование цен для топлива ID: ${fuelId}\n(Откроется форма выбора АЗС и ввода новой цены)`);
    // TODO: Реализовать форму редактирования
}

async updateFuelPrice(fuelId) {
    // 1. Запрашиваем новую цену
    const newPrice = prompt(`Введите новую цену для всех АЗС (топливо ID: ${fuelId}):`, "50.00");
    
    if (!newPrice || isNaN(parseFloat(newPrice))) {
        alert('Пожалуйста, введите корректную цену');
        return;
    }
    
    const priceValue = parseFloat(newPrice);
    
    // 2. Подтверждение
    if (!confirm(`Установить цену ${priceValue.toFixed(2)} ₽ для всех АЗС?`)) {
        return;
    }
    
    try {
        // 3. Получаем все записи цен для этого типа топлива
        const fuelPrices = await this.fetchData('/FuelPrices');
        const pricesToUpdate = fuelPrices.filter(p => p.fuelTypeId === fuelId);
        
        if (pricesToUpdate.length === 0) {
            alert('Не найдено цен для обновления');
            return;
        }
        
        // 4. Обновляем каждую запись
        let updatedCount = 0;
        
        for (const price of pricesToUpdate) {
            try {
                const response = await fetch(`${this.API_BASE}/FuelPrices/${price.id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: price.id,
                        stationId: price.stationId,
                        fuelTypeId: price.fuelTypeId,
                        price: priceValue,
                        updateDate: new Date().toISOString()
                    })
                });
                
                if (response.ok) {
                    updatedCount++;
                }
            } catch (error) {
                console.error(`Ошибка обновления цены ${price.id}:`, error);
            }
        }
        
        // 5. Показываем результат
        alert(`✅ Обновлено ${updatedCount} из ${pricesToUpdate.length} записей цен`);
        
        // 6. Перезагружаем данные
        this.loadFuelData();
        
    } catch (error) {
        console.error('Ошибка при обновлении цен:', error);
        alert('❌ Ошибка при обновлении цен: ' + error.message);
    }
}

showAddPriceForm() {
    alert('Добавление новой цены\n(В реальном проекте: форма выбора АЗС, типа топлива и ввода цены)');
    // TODO: Реализовать форму добавления
}
}

// Глобальный экземпляр
window.fuelModule = new FuelModule();

