const API_BASE_URL = 'https://localhost:7282/api';
let authToken = localStorage.getItem('jwtToken') || '';

function setAuthToken(token) {
    authToken = token;
    localStorage.setItem('jwtToken', token);
}

function getHeaders(includeAuth = true) {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    
    if (includeAuth && authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    return headers;
}

async function handleResponse(response) {
    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
        
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.title || errorMessage;
        } catch {
            if (errorText) errorMessage = errorText;
        }
        
        throw new Error(errorMessage);
    }
    
    return response.json();
}

async function register(userData) {
    const response = await fetch(`${API_BASE_URL}/Auth/register`, {
        method: 'POST',
        headers: getHeaders(false),
        body: JSON.stringify(userData)
    });
    
    return handleResponse(response);
}

async function login(credentials) {
    const response = await fetch(`${API_BASE_URL}/Auth/login`, {
        method: 'POST',
        headers: getHeaders(false),
        body: JSON.stringify(credentials)
    });
    
    const data = await handleResponse(response);
    
    if (data.token) {
        setAuthToken(data.token);
    }
    
    return data;
}

function logout() {
    authToken = '';
    localStorage.removeItem('jwtToken');
    window.location.href = 'index.html';
}

function isAuthenticated() {
    return !!authToken;
}

async function getUsers() {
    const response = await fetch(`${API_BASE_URL}/Users`, {
        headers: getHeaders()
    });
    
    return handleResponse(response);
}

async function getUserById(id) {
    const response = await fetch(`${API_BASE_URL}/Users/${id}`, {
        headers: getHeaders()
    });
    
    return handleResponse(response);
}

async function createUser(userData) {
    const response = await fetch(`${API_BASE_URL}/Users`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(userData)
    });
    
    return handleResponse(response);
}

async function updateUser(id, userData) {
    const response = await fetch(`${API_BASE_URL}/Users/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(userData)
    });
    
    return handleResponse(response);
}

async function deleteUser(id) {
    const response = await fetch(`${API_BASE_URL}/Users/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    
    return handleResponse(response);
}

async function getGasStations() {
    const response = await fetch(`${API_BASE_URL}/GasStations`, {
        headers: getHeaders()
    });
    
    return handleResponse(response);
}

async function getGasStationById(id) {
    const response = await fetch(`${API_BASE_URL}/GasStations/${id}`, {
        headers: getHeaders()
    });
    
    return handleResponse(response);
}

async function createGasStation(gasStationData) {
    const response = await fetch(`${API_BASE_URL}/GasStations`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(gasStationData)
    });
    
    return handleResponse(response);
}

async function updateGasStation(id, gasStationData) {
    const response = await fetch(`${API_BASE_URL}/GasStations/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(gasStationData)
    });
    
    return handleResponse(response);
}

async function deleteGasStation(id) {
    const response = await fetch(`${API_BASE_URL}/GasStations/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    
    return handleResponse(response);
}

async function getFuelTypes() {
    const response = await fetch(`${API_BASE_URL}/FuelTypes`, {
        headers: getHeaders()
    });
    
    return handleResponse(response);
}

async function getFuelPrices() {
    const response = await fetch(`${API_BASE_URL}/FuelPrices`, {
        headers: getHeaders()
    });
    
    return handleResponse(response);
}

async function generateTestData(count = 10) {
    const response = await fetch(`${API_BASE_URL}/TestData/generate?count=${count}`, {
        method: 'POST',
        headers: getHeaders()
    });
    
    return handleResponse(response);
}

async function clearTestData() {
    const response = await fetch(`${API_BASE_URL}/TestData/clear`, {
        method: 'POST',
        headers: getHeaders()
    });
    
    return handleResponse(response);
}

window.api = {
    register,
    login,
    logout,
    isAuthenticated,
    setAuthToken,
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getGasStations,
    getGasStationById,
    createGasStation,
    updateGasStation,
    deleteGasStation,
    getFuelTypes,
    getFuelPrices,
    generateTestData,
    clearTestData,
    API_BASE_URL,
    getHeaders
};