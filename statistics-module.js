// statistics-module.js - модуль статистики и графиков

class StatisticsModule {
    constructor() {
        this.charts = {};
        this.init();
    }

    init() {
        // Загружаем статистику при переходе на вкладку настроек
        document.querySelectorAll('[data-page="settings"]').forEach(btn => {
            btn.addEventListener('click', () => {
                setTimeout(() => this.loadStatistics(), 300);
            });
        });
        
        // Проверяем, если уже на вкладке настроек
        if (document.querySelector('#page-settings') && 
            document.querySelector('#page-settings').style.display !== 'none') {
            setTimeout(() => this.loadStatistics(), 500);
        }
    }

    async loadStatistics() {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || user.role !== 'Admin') {
                // Скрываем статистику для не-админов
                document.getElementById('admin-statistics').style.display = 'none';
                return;
            }

            // Показываем статистику для админов
            document.getElementById('admin-statistics').style.display = 'block';
            
            // Загружаем данные
            await this.loadAndRenderCharts();
            
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
        }
    }

    async loadAndRenderCharts() {
        try {
            // 1. Получаем данные
            const gasStations = await window.api.getGasStations();
            const users = await window.api.getUsers();
            const fuelPrices = await window.api.getFuelPrices();
            const fuelTypes = await window.api.getFuelTypes();

            // 2. Строим графики
            this.renderStationsChart(gasStations);
            this.renderUsersChart(users);
            this.renderFuelPricesChart(fuelPrices, fuelTypes);
            
        } catch (error) {
            console.error('Ошибка загрузки данных для графиков:', error);
        }
    }

    renderStationsChart(stations) {
        const ctx = document.getElementById('stationsChart');
        if (!ctx) return;

        // Анализируем АЗС по "поставщикам" или просто считаем
        const suppliers = {};
        stations.forEach(station => {
            const supplier = station.supplier || 'Не указан';
            suppliers[supplier] = (suppliers[supplier] || 0) + 1;
        });

        if (this.charts.stationsChart) {
            this.charts.stationsChart.destroy();
        }

        this.charts.stationsChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(suppliers),
                datasets: [{
                    data: Object.values(suppliers),
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Распределение АЗС по поставщикам'
                    }
                }
            }
        });
    }

    renderUsersChart(users) {
        const ctx = document.getElementById('usersChart');
        if (!ctx) return;

        // Считаем пользователей по ролям
        const roles = { Admin: 0, User: 0 };
        users.forEach(user => {
            if (user.role === 'Admin' || user.role === 'Администратор') {
                roles.Admin++;
            } else {
                roles.User++;
            }
        });

        if (this.charts.usersChart) {
            this.charts.usersChart.destroy();
        }

        this.charts.usersChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Администраторы', 'Пользователи'],
                datasets: [{
                    data: [roles.Admin, roles.User],
                    backgroundColor: ['#FF6384', '#36A2EB']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Распределение пользователей по ролям'
                    }
                }
            }
        });
    }

    renderFuelPricesChart(prices, fuelTypes) {
        const ctx = document.getElementById('fuelPricesChart');
        if (!ctx) return;

        // Группируем цены по типам топлива
        const pricesByType = {};
        prices.forEach(price => {
            const typeId = price.fuelTypeId;
            if (!pricesByType[typeId]) {
                pricesByType[typeId] = [];
            }
            pricesByType[typeId].push(price.price);
        });

        // Находим средние цены
        const labels = [];
        const data = [];
        const colors = [];

        Object.keys(pricesByType).forEach(typeId => {
            const typePrices = pricesByType[typeId];
            const avgPrice = typePrices.reduce((a, b) => a + b, 0) / typePrices.length;
            
            const fuelType = fuelTypes.find(t => t.id == typeId);
            if (fuelType) {
                labels.push(fuelType.name);
                data.push(avgPrice.toFixed(2));
                colors.push(this.getRandomColor());
            }
        });

        if (this.charts.fuelPricesChart) {
            this.charts.fuelPricesChart.destroy();
        }

        this.charts.fuelPricesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Средняя цена (руб.)',
                    data: data,
                    backgroundColor: colors,
                    borderColor: colors.map(c => this.darkenColor(c, 20)),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Средние цены на топливо'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Цена (руб.)'
                        }
                    }
                }
            }
        });
    }

    // Вспомогательные функции
    getRandomColor() {
        return '#' + Math.floor(Math.random()*16777215).toString(16);
    }

    darkenColor(color, percent) {
        let r = parseInt(color.substring(1,3), 16);
        let g = parseInt(color.substring(3,5), 16);
        let b = parseInt(color.substring(5,7), 16);

        r = Math.floor(r * (100 - percent) / 100);
        g = Math.floor(g * (100 - percent) / 100);
        b = Math.floor(b * (100 - percent) / 100);

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
}

// Создаем и экспортируем модуль
window.statisticsModule = new StatisticsModule();