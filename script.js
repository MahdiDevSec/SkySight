// API Keys
const WEATHER_API_KEY = 'a24d027b76a94dbca7333456250601';

const darkModeToggle = document.getElementById('darkModeToggle');
const icon = darkModeToggle.querySelector('i');
const citySearch = document.getElementById('citySearch');
const suggestionsContainer = document.getElementById('suggestions');

darkModeToggle.addEventListener('click', () => {
    // Toggle dark mode
    document.documentElement.classList.toggle('dark');
    
    // Switch icon between moon and sun
    if (document.documentElement.classList.contains('dark')) {
        icon.classList.replace('fa-moon', 'fa-sun');
    } else {
        icon.classList.replace('fa-sun', 'fa-moon');
    }
});

// Search functionality
citySearch.addEventListener('input', async function() {
    const query = this.value.trim();
    if (query.length >= 2) { // ابدأ البحث عند إدخال حرفين على الأقل
        const suggestions = await getCitySuggestions(query);
        showSuggestions(suggestions);
    } else {
        suggestionsContainer.innerHTML = ''; // إخفاء القائمة إذا كان البحث أقل من حرفين
        suggestionsContainer.classList.add('hidden');
    }
});

citySearch.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const city = this.value.trim();
        if (city) {
            getWeatherData(city)
                .then(data => updateWeatherCard(data));
            suggestionsContainer.classList.add('hidden'); // إخفاء القائمة بعد البحث
        }
    }
});


// Single getWeatherData function with forecast
async function getWeatherData(city) {
    try {
        const response = await fetch(
            `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${city}&days=7`
        );
        return await response.json();
    } catch (error) {
        console.error('Error fetching weather:', error);
        throw error;
    }
}

// Auto-locate functionality
document.getElementById('autoLocate').addEventListener('click', async function() {
    const location = await getUserLocation();
    const weatherData = await getWeatherData(`${location.lat},${location.lon}`);
    updateWeatherCard(weatherData);
});

// Function to fetch city suggestions
async function getCitySuggestions(query) {
    try {
        const response = await fetch(
            `https://api.weatherapi.com/v1/search.json?key=${WEATHER_API_KEY}&q=${query}`
        );
        return await response.json();
    } catch (error) {
        console.error('Error fetching city suggestions:', error);
        return [];
    }
}

// Function to display suggestions
function showSuggestions(suggestions) {
    if (suggestions.length > 0) {
        suggestionsContainer.innerHTML = suggestions.map(city => `
            <div class="suggestion-item p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                ${city.name}, ${city.country}
            </div>
        `).join('');
        suggestionsContainer.classList.remove('hidden');
    } else {
        suggestionsContainer.innerHTML = '';
        suggestionsContainer.classList.add('hidden');
    }
}

// Handle suggestion selection
suggestionsContainer.addEventListener('click', function(e) {
    if (e.target.classList.contains('suggestion-item')) {
        const selectedCity = e.target.textContent.trim();
        citySearch.value = selectedCity; // تعبئة مربع البحث بالمدينة المختارة
        getWeatherData(selectedCity)
            .then(data => updateWeatherCard(data));
        suggestionsContainer.classList.add('hidden'); // إخفاء القائمة بعد الاختيار
    }
});

// Geolocation
function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject('Geolocation is not supported');
        }
        navigator.geolocation.getCurrentPosition(
            position => {
                resolve({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                });
            },
            error => reject(error)
        );
    });
}

// Update UI Functions
function updateWeatherCard(data) {

	// عرض اسم المدينة
    document.getElementById('cityName').textContent = data.location.name;
	

    // Main temperature
    document.querySelector('.temperature-display').textContent = `${Math.round(data.current.temp_c)}°C`;
    document.querySelector('[data-wind]').innerHTML = `<i class="fas fa-wind mr-2"></i>${data.current.wind_kph} km/h`;
    document.querySelector('[data-humidity]').innerHTML = `<i class="fas fa-tint mr-2"></i>${data.current.humidity}%`;

    // Wind and humidity details
    document.querySelector('[data-temp-details]').textContent = `Temperature: ${Math.round(data.current.temp_c)}°C`;
    document.querySelector('[data-humidity-details]').textContent = `Humidity: ${data.current.humidity}%`;
    document.querySelector('[data-wind-details]').textContent = `Wind: ${data.current.wind_kph} km/h`;
    document.querySelector('[data-cloud-details]').textContent = `Clouds: ${data.current.condition.text}`;

    // Time and date
    const date = new Date();
    document.querySelector('.current-time').textContent = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    document.querySelector('.current-date').textContent = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
    });

    // Weekly and hourly forecasts
    if (data.forecast && data.forecast.forecastday) {
        updateWeeklyForecast(data.forecast.forecastday);
        updateHourlyForecast(data.forecast.forecastday[0].hour);
    }
}

function updateWeeklyForecast(forecastData) {
    const weeklyContainer = document.querySelector('.weekly-forecast');
    if (weeklyContainer) {
        weeklyContainer.innerHTML = forecastData.map(day => `
            <div class="forecast-item text-center bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow dark:shadow dark:shadow-gray-400">
                <div class="text-sm">${new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div class="font-bold text-xl">${Math.round(day.day.avgtemp_c)}°C</div>
                <div class="flex justify-center gap-4 mt-2">
                    <div class="text-sm">
                        <i class="fas fa-wind"></i> ${day.day.maxwind_kph} km/h
                    </div>
                    <div class="text-sm">
                        <i class="fas fa-tint"></i> ${day.day.avghumidity}%
                    </div>
                </div>
            </div>
        `).join('');
    }
}

function updateHourlyForecast(hourlyData) {
    const hourlyContainer = document.querySelector('.hourly-forecast');
    if (hourlyContainer) {
        const currentHour = new Date().getHours();
        const nextHours = hourlyData.filter(hour => {
            const hourTime = new Date(hour.time).getHours();
            return hourTime > currentHour;
        }).slice(0, 4);

        hourlyContainer.innerHTML = nextHours.map(hour => `
            <div class="hourly-forecast-item text-center">
                <div class="text-sm">${new Date(hour.time).toLocaleTimeString('en-US', { hour: '2-digit' })}</div>
                <div class="font-bold">${Math.round(hour.temp_c)}°C</div>
            </div>
        `).join('');
    }
}

// Initialize
async function init() {
    try {
        const location = await getUserLocation();
        const weatherData = await getWeatherData(`${location.lat},${location.lon}`);
        
        updateWeatherCard(weatherData);
    } catch (error) {
        console.error('Initialization error:', error);
        const weatherData = await getWeatherData('London');
        updateWeatherCard(weatherData);
    }
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
