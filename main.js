class DigitalClock extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const timezone = this.getAttribute('timezone');
    const city = this.getAttribute('city');

    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        .clock-container {
            position: relative;
            width: 350px;
            height: 200px;
            margin: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            transition: background-color 0.5s, color 0.5s;
        }

        .light-mode {
            background-color: #f0f0f0;
            color: #333;
        }

        .dark-mode {
            background-color: #2c3e50;
            color: #ecf0f1;
        }

        .city-label {
            text-align: center;
            font-size: 1.8em;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .date-display {
            text-align: center;
            font-size: 1.2em;
            margin-bottom: 15px;
        }

        .digital-clock {
            text-align: center;
            font-size: 3em;
            font-family: 'monospace';
        }

        .delete-button {
            position: absolute;
            top: 10px;
            right: 10px;
            background: transparent;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #aaa;
        }

        .delete-button:hover {
            color: #333;
        }
      </style>
      <div class="clock-container">
          <button class="delete-button">&times;</button>
          <div class="city-label">${city}</div>
          <div class="date-display"></div>
          <div class="digital-clock"></div>
      </div>
    `;

    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.digitalClock = this.shadowRoot.querySelector('.digital-clock');
    this.dateDisplay = this.shadowRoot.querySelector('.date-display');
    this.clockContainer = this.shadowRoot.querySelector('.clock-container');

    this.shadowRoot.querySelector('.delete-button').addEventListener('click', () => {
        this.remove();
    });

    this.updateClock(timezone);
    this.interval = setInterval(() => this.updateClock(timezone), 1000);
  }

  disconnectedCallback() {
    clearInterval(this.interval);
  }

  updateClock(timezone) {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const day = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()];

    const digitalHours = String(hours).padStart(2, '0');
    const digitalMinutes = String(minutes).padStart(2, '0');
    const digitalSeconds = String(seconds).padStart(2, '0');
    
    this.digitalClock.textContent = `${digitalHours}:${digitalMinutes}:${digitalSeconds}`;
    this.dateDisplay.textContent = `${year}년 ${month}월 ${date}일 (${day})`;

    if (hours >= 6 && hours < 18) {
        this.clockContainer.classList.remove('dark-mode');
        this.clockContainer.classList.add('light-mode');
    } else {
        this.clockContainer.classList.remove('light-mode');
        this.clockContainer.classList.add('dark-mode');
    }
  }
}

customElements.define('digital-clock', DigitalClock);

const clocksContainer = document.getElementById('clocks-container');
const addWorldClockButton = document.getElementById('add-world-clock');
const cityModal = document.getElementById('city-modal');
const modalCityList = document.getElementById('modal-city-list');
const closeButton = document.querySelector('.close-button');
let timezones = [];

addWorldClockButton.addEventListener('click', async () => {
  if (timezones.length === 0) {
    try {
      const response = await fetch('https://worldtimeapi.org/api/timezone');
      timezones = await response.json();
    } catch (error) {
      console.error('Error fetching timezones:', error);
      return;
    }
  }
  displayRegions();
  cityModal.style.display = 'block';
});

closeButton.addEventListener('click', () => {
  cityModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
  if (event.target == cityModal) {
    cityModal.style.display = 'none';
  }
});

function displayRegions() {
    const regions = [...new Set(timezones.map(tz => tz.split('/')[0]))];
    modalCityList.innerHTML = '';
    regions.forEach(region => {
        const button = document.createElement('button');
        button.textContent = region;
        button.addEventListener('click', () => displayCities(region));
        modalCityList.appendChild(button);
    });
}

function displayCities(region) {
    const cities = timezones.filter(tz => tz.startsWith(region + '/'));
    modalCityList.innerHTML = '';
    cities.forEach(timezone => {
        const city = timezone.split('/').slice(1).join('/').replace(/_/g, ' ');
        const button = document.createElement('button');
        button.textContent = city;
        button.addEventListener('click', () => {
          createClock(timezone, city);
          cityModal.style.display = 'none';
        });
        modalCityList.appendChild(button);
    });
}

function createClock(timezone, city) {
  const clock = document.createElement('digital-clock');
  clock.setAttribute('timezone', timezone);
  clock.setAttribute('city', city);
  clocksContainer.appendChild(clock);
}
