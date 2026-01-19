const API_BASE_URL = 'https://localhost:7282/api';

function showNotification(message, type = 'danger') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `alert alert-${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('login.html') || 
        window.location.pathname === '/') {
        initLoginPage();
    } else {
        checkAuthAndRedirect();
    }
});

function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const demoModeBtn = document.getElementById('demoMode');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            const selectedRole = document.getElementById('role').value;
            
            if (!username || !password || !selectedRole) {
                showNotification('Заполните все поля');
                return;
            }
            
            try {
                const response = await fetch(`${API_BASE_URL}/Auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.user.role !== selectedRole) {
                        showNotification(`Неверная роль. Ваша роль в системе: ${data.user.role}`);
                        return;
                    }
                    
                    localStorage.setItem('jwtToken', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    window.location.href = 'index.html';
                    
                } else {
                    if (response.status === 401) {
                        showNotification('Неверное имя пользователя или пароль');
                    } else {
                        showNotification(`Ошибка сервера: ${response.status}`);
                    }
                }
            } catch (error) {
                showNotification('Не удалось подключиться к серверу. Проверьте, запущен ли бекенд.');
            }
        });
    }
    
    if (demoModeBtn) {
        demoModeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const demoRole = prompt('Выберите роль для демо-режима:\n1. User\n2. Admin\n\nВведите 1 или 2:', '1');
            
            if (demoRole === '1') {
                localStorage.setItem('jwtToken', 'demo-token-user');
                localStorage.setItem('user', JSON.stringify({
                    id: 999,
                    username: 'demo_user',
                    role: 'User',
                    firstName: 'Демо',
                    lastName: 'Пользователь',
                    email: 'demo@mail.ru'
                }));
            } else if (demoRole === '2') {
                localStorage.setItem('jwtToken', 'demo-token-admin');
                localStorage.setItem('user', JSON.stringify({
                    id: 1000,
                    username: 'demo_admin',
                    role: 'Admin',
                    firstName: 'Демо',
                    lastName: 'Администратор',
                    email: 'admin@mail.ru'
                }));
            } else {
                return;
            }
            
            window.location.href = 'index.html';
        });
    }
}

function checkAuthAndRedirect() {
    const token = localStorage.getItem('jwtToken');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        window.location.href = 'login.html';
        return false;
    }
    
    try {
        const userData = JSON.parse(user);
        updateUIForRole(userData.role);
        displayUserInfo(userData);
        return true;
    } catch (error) {
        window.location.href = 'login.html';
        return false;
    }
}

function updateUIForRole(role) {
    const adminElements = document.querySelectorAll('.admin-only');
    const isAdmin = role === 'Admin' || role === 'Администратор' || role === 'admin';
    
    adminElements.forEach(el => {
        el.style.display = isAdmin ? 'block' : 'none';
    });
}

function displayUserInfo(userData) {
    const userInfoElements = document.querySelectorAll('.user-info');
    
    userInfoElements.forEach(element => {
        if (element.id === 'userFullName') {
            element.textContent = `${userData.firstName} ${userData.lastName}`;
        } else if (element.id === 'userRole') {
            element.textContent = userData.role === 'Admin' ? 'Администратор' : 'Пользователь';
        } else if (element.id === 'userEmail') {
            element.textContent = userData.email || userData.username;
        }
    });
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти из системы?')) {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

window.auth = {
    checkAuth: checkAuthAndRedirect,
    logout: logout,
    getUser: function() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    getToken: function() {
        return localStorage.getItem('jwtToken');
    }
};