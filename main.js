class AnalogClock extends HTMLElement {
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
            width: 200px;
            height: 250px; /* Increased height for digital clock */
            margin: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .analog-clock {
            position: relative;
            width: 200px;
            height: 200px;
        }

        .clock-face {
            width: 100%;
            height: 100%;
            border: 6px solid #333;
            background: #fff;
            border-radius: 50%;
            position: relative;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2), 0 0 0 5px #eee;

        }

        .center-dot {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 8px;
            height: 8px;
            background: #333;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            z-index: 10;
        }

        .hand {
            position: absolute;
            width: 50%;
            height: 2px;
            background: #333;
            top: 50%;
            transform-origin: 100%;
            transform: rotate(90deg);
            transition: transform 0.05s cubic-bezier(0.4, 2.3, 0.6, 1);
        }

        .hour-hand {
            height: 5px;
            width: 30%;
            left: 20%;
            border-radius: 2px;
        }

        .minute-hand {
            height: 3px;
            width: 40%;
            left: 10%;
            border-radius: 2px;
        }
        
        .second-hand {
            height: 1px;
            background: red;
            width: 45%;
            left: 5%;
        }

        .city-label {
            text-align: center;
            margin-top: 15px;
            font-size: 1.2em;
            font-weight: bold;
        }
        
        .digital-clock {
            text-align: center;
            font-size: 1.5em;
            margin-top: 10px;
            font-family: 'monospace';
        }
        
        .number {
            position: absolute;
            width: 100%;
            height: 100%;
            text-align: center;
            font-size: 1.4em;
            font-weight: bold;
            padding: 5px;
        }
      </style>
      <div class="clock-container">
          <div class="analog-clock">
            <div class="clock-face">
                <div class="center-dot"></div>
                <div class="hand hour-hand"></div>
                <div class="hand minute-hand"></div>
                <div class="hand second-hand"></div>
            </div>
          </div>
          <div class="digital-clock"></div>
          <div class="city-label">${city}</div>
      </div>
    `;

    this.shadowRoot.appendChild(template.content.cloneNode(true));

    const clockFace = this.shadowRoot.querySelector('.clock-face');
    for (let i = 1; i <= 12; i++) {
        const number = document.createElement('div');
        number.classList.add('number');
        number.style.transform = `rotate(${i * 30}deg)`;
        number.innerHTML = `<span style="display:inline-block; transform: rotate(${-i * 30}deg);">${i}</span>`;
        clockFace.appendChild(number);
    }

    this.hourHand = this.shadowRoot.querySelector('.hour-hand');
    this.minuteHand = this.shadowRoot.querySelector('.minute-hand');
    this.secondHand = this.shadowRoot.querySelector('.second-hand');
    this.digitalClock = this.shadowRoot.querySelector('.digital-clock');

    this.updateClock(timezone);
    this.interval = setInterval(() => this.updateClock(timezone), 1000);
  }

  disconnectedCallback() {
    clearInterval(this.interval);
  }

  updateClock(timezone) {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
    const seconds = now.getSeconds();
    const minutes = now.getMinutes();
    const hours = now.getHours();

    const secondsDegrees = ((seconds / 60) * 360) + 90;
    const minutesDegrees = ((minutes / 60) * 360) + ((seconds/60)*6) + 90;
    const hoursDegrees = ((hours / 12) * 360) + ((minutes/60)*30) + 90;

    this.secondHand.style.transform = `rotate(${secondsDegrees}deg)`;
    this.minuteHand.style.transform = `rotate(${minutesDegrees}deg)`;
    this.hourHand.style.transform = `rotate(${hoursDegrees}deg)`;

    const digitalHours = String(hours).padStart(2, '0');
    const digitalMinutes = String(minutes).padStart(2, '0');
    const digitalSeconds = String(seconds).padStart(2, '0');
    this.digitalClock.textContent = `${digitalHours}:${digitalMinutes}:${digitalSeconds}`;

  }
}

customElements.define('world-clock', AnalogClock);


const clocksContainer = document.getElementById('clocks-container');
const addWorldClockButton = document.getElementById('add-world-clock');
const cityListContainer = document.getElementById('city-list-container');
let timezones = [];

addWorldClockButton.addEventListener('click', async () => {
  if (cityListContainer.style.display === 'none') {
    try {
        if (timezones.length === 0) {
            const response = await fetch('https://worldtimeapi.org/api/timezone');
            timezones = await response.json();
        }
        displayRegions();
        cityListContainer.style.display = 'block';
    } catch (error) {
      console.error('Error fetching timezones:', error);
    }
  } else {
    cityListContainer.style.display = 'none';
  }
});

function displayRegions() {
    const regions = [...new Set(timezones.map(tz => tz.split('/')[0]))];
    cityListContainer.innerHTML = '';
    regions.forEach(region => {
        const button = document.createElement('button');
        button.textContent = region;
        button.addEventListener('click', () => displayCities(region));
        cityListContainer.appendChild(button);
    });
}

function displayCities(region) {
    const cities = timezones.filter(tz => tz.startsWith(region + '/'));
    cityListContainer.innerHTML = '';
    cities.forEach(timezone => {
        const city = timezone.split('/').slice(1).join('/').replace(/_/g, ' ');
        const button = document.createElement('button');
        button.textContent = city;
        button.addEventListener('click', () => {
          createClock(timezone, city);
          cityListContainer.style.display = 'none';
        });
        cityListContainer.appendChild(button);
    });
}

function createClock(timezone, city) {
  const clock = document.createElement('world-clock');
  clock.setAttribute('timezone', timezone);
  clock.setAttribute('city', city);
  clocksContainer.appendChild(clock);
}
