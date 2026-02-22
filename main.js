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
    const standardTimeCities = [
        { timezone: 'Pacific/Pago_Pago', city: '파고파고', offset: -11 },
        { timezone: 'Pacific/Honolulu', city: '호놀룰루', offset: -10 },
        { timezone: 'America/Anchorage', city: '앵커리지', offset: -9 },
        { timezone: 'America/Los_Angeles', city: '로스앤젤레스', offset: -8 },
        { timezone: 'America/Denver', city: '덴버', offset: -7 },
        { timezone: 'America/Chicago', city: '시카고', offset: -6 },
        { timezone: 'America/New_York', city: '뉴욕', offset: -5 },
        { timezone: 'America/Halifax', city: '핼리팩스', offset: -4 },
        { timezone: 'America/Sao_Paulo', city: '상파울루', offset: -3 },
        { timezone: 'America/Noronha', city: '페르난두데노로냐', offset: -2 },
        { timezone: 'Atlantic/Azores', city: '아조레스', offset: -1 },
        { timezone: 'Europe/London', city: '런던', offset: 0 },
        { timezone: 'Europe/Paris', city: '파리', offset: 1 },
        { timezone: 'Europe/Athens', city: '아테네', offset: 2 },
        { timezone: 'Europe/Moscow', city: '모스크바', offset: 3 },
        { timezone: 'Asia/Dubai', city: '두바이', offset: 4 },
        { timezone: 'Asia/Karachi', city: '카라치', offset: 5 },
        { timezone: 'Asia/Dhaka', city: '다카', offset: 6 },
        { timezone: 'Asia/Bangkok', city: '방콕', offset: 7 },
        { timezone: 'Asia/Shanghai', city: '상하이', offset: 8 },
        { timezone: 'Asia/Seoul', city: '서울', offset: 9 },
        { timezone: 'Australia/Sydney', city: '시드니', offset: 10 },
        { timezone: 'Pacific/Noumea', city: '누메아', offset: 11 },
        { timezone: 'Pacific/Auckland', city: '오클랜드', offset: 12 },
    ];

    function formatOffset(offset) {
        if (offset === 0) return '±0';
        return `${offset > 0 ? '+' : ''}${offset}`;
    }

    function displayCityList() {
        modalCityList.innerHTML = '';
        standardTimeCities.forEach(({ timezone, city, offset }) => {
            const button = document.createElement('button');
            button.textContent = `${city} (${formatOffset(offset)})`;
            button.addEventListener('click', () => {
                createClock(timezone, `${city} (${formatOffset(offset)})`);
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

    addWorldClockButton.addEventListener('click', () => {
        cityModal.style.display = 'block';
        displayCityList();
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
