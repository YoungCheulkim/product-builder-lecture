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
        .light-mode { background-color: #f0f0f0; color: #333; }
        .dark-mode { background-color: #2c3e50; color: #ecf0f1; }
        .city-label { font-size: 1.8em; font-weight: bold; margin-bottom: 10px; }
        .date-display { font-size: 1.2em; margin-bottom: 15px; }
        .digital-clock { font-size: 3em; font-family: 'monospace'; }
        .delete-button {
            position: absolute;
            top: 10px;
            right: 10px;
            background: transparent;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #aaa;
            transition: color 0.3s;
        }
        .delete-button:hover { color: #333; }
        .dark-mode .delete-button:hover { color: #fff; }
      </style>
      <div class="clock-container">
          <button class="delete-button">&times;</button>
          <div class="city-label">${city}</div>
          <div class="date-display"></div>
          <div class="digital-clock"></div>
      </div>
    `;

    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.shadowRoot.querySelector('.delete-button').addEventListener('click', (e) => {
        e.stopPropagation();
        this.remove();
    });

    this.updateClock(timezone);
    this.interval = setInterval(() => this.updateClock(timezone), 1000);
  }

  disconnectedCallback() {
    clearInterval(this.interval);
  }

  updateClock(timezone) {
    try {
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
        const hours = now.getHours();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const date = String(now.getDate()).padStart(2, '0');
        const day = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()];

        this.shadowRoot.querySelector('.digital-clock').textContent = now.toTimeString().split(' ')[0];
        this.shadowRoot.querySelector('.date-display').textContent = `${year}년 ${month}월 ${date}일 (${day})`;

        const clockContainer = this.shadowRoot.querySelector('.clock-container');
        if (hours >= 6 && hours < 18) {
            clockContainer.classList.remove('dark-mode');
            clockContainer.classList.add('light-mode');
        } else {
            clockContainer.classList.remove('light-mode');
            clockContainer.classList.add('dark-mode');
        }
    } catch (error) {
        console.error(`Invalid timezone: ${timezone}`, error);
        this.shadowRoot.querySelector('.digital-clock').textContent = 'Invalid Timezone';
        clearInterval(this.interval);
    }
  }
}

customElements.define('digital-clock', DigitalClock);

document.addEventListener('DOMContentLoaded', () => {
    const clocksContainer = document.getElementById('clocks-container');
    const addWorldClockButton = document.getElementById('add-world-clock');
    const cityModal = document.getElementById('city-modal');
    const modalCityList = document.getElementById('modal-city-list');
    const closeButton = document.querySelector('.close-button');
    let timezones = [];

    async function fetchTimezones() {
        if (timezones.length === 0) {
            try {
                const response = await fetch('https://worldtimeapi.org/api/timezone');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                timezones = await response.json();
                return true;
            } catch (error) {
                console.error('Error fetching timezones:', error);
                return false;
            }
        }
        return true;
    }

    function displayRegions() {
        const regions = [...new Set(timezones.map(tz => tz.split('/')[0]))].filter(r => r !== 'Etc');
        modalCityList.innerHTML = '';
        const backButton = document.createElement('button');
        backButton.textContent = '지역 선택';
        backButton.disabled = true;
        modalCityList.appendChild(backButton);

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
        const backButton = document.createElement('button');
        backButton.textContent = '← 뒤로';
        backButton.addEventListener('click', displayRegions);
        modalCityList.appendChild(backButton);

        cities.forEach(timezone => {
            const city = timezone.split('/').slice(-1)[0].replace(/_/g, ' ');
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
        if (document.querySelector(`digital-clock[timezone="${timezone}"]`)) {
            alert('이미 추가된 도시입니다.');
            return;
        }
        const clock = document.createElement('digital-clock');
        clock.setAttribute('timezone', timezone);
        clock.setAttribute('city', city);
        clocksContainer.appendChild(clock);
    }

    addWorldClockButton.addEventListener('click', async () => {
        cityModal.style.display = 'block';
        modalCityList.innerHTML = '시간대 목록을 불러오는 중...';

        const ok = await fetchTimezones();
        if (ok && timezones.length > 0) {
            displayRegions();
            return;
        }

        modalCityList.innerHTML = '';
        const message = document.createElement('div');
        message.textContent = '시간대 목록을 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.';
        const retryButton = document.createElement('button');
        retryButton.textContent = '다시 시도';
        retryButton.addEventListener('click', async () => {
            modalCityList.innerHTML = '시간대 목록을 불러오는 중...';
            const retryOk = await fetchTimezones();
            if (retryOk && timezones.length > 0) {
                displayRegions();
                return;
            }
            modalCityList.innerHTML = '';
            modalCityList.appendChild(message);
            modalCityList.appendChild(retryButton);
        });
        modalCityList.appendChild(message);
        modalCityList.appendChild(retryButton);
    });

    closeButton.addEventListener('click', () => {
        cityModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == cityModal) {
            cityModal.style.display = 'none';
        }
    });
});
