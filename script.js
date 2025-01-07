// API Keys
const WEATHER_API_KEY = 'a24d027b76a94dbca7333456250601';

const darkModeToggle = document.getElementById('darkModeToggle');
const icon = darkModeToggle.querySelector('i');

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
document.getElementById('citySearch').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const city = this.value.trim();
        if (city) {
            getWeatherData(city)
                .then(data => updateWeatherCard(data));
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
    // Main temperature
    document.querySelector('.temperature-display').textContent = `${Math.round(data.current.temp_c)}°C`;
    document.querySelector('[data-wind]').innerHTML = `<i class="fas fa-wind mr-2"></i>${data.current.wind_kph} km/h`;
    document.querySelector('[data-humidity]').innerHTML = `<i class="fas fa-tint mr-2"></i>${data.current.humidity}%`;

    
    // Wind and humidity
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
            <div class="forecast-item text-center">
                <div class="text-sm">${new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div class="font-bold">${Math.round(day.day.avgtemp_c)}°C</div>
            </div>
        `).join('');
    }
}

function updateHourlyForecast(hourlyData) {
    const hourlyContainer = document.querySelector('.hourly-forecast');
    if (hourlyContainer) {
        const currentHour = new Date().getHours();
        const currentMinute = new Date().getMinutes();

        // إذا كانت الساعة 23:30، نعرض التنبؤات للأربع ساعات القادمة
        if (currentHour === 23 && currentMinute >= 30) {
            const nextHours = hourlyData.filter(hour => {
                const hourTime = new Date(hour.time).getHours();
                return hourTime > currentHour || (hourTime === 0 && currentHour === 23);
            }).slice(0, 4);

            hourlyContainer.innerHTML = nextHours.map(hour => `
                <div class="hourly-forecast-item text-center">
                    <div class="text-sm">${new Date(hour.time).toLocaleTimeString('en-US', { hour: '2-digit' })}</div>
                    <div class="font-bold">${Math.round(hour.temp_c)}°C</div>
                </div>
            `).join('');
        } else {
            // إذا لم تكن الساعة 23:30، نعرض التنبؤات للأربع ساعات القادمة بشكل طبيعي
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

