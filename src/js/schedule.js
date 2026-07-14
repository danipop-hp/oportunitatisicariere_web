document.addEventListener('DOMContentLoaded', () => {
  const scheduleModal = document.getElementById('scheduleModal');
  const openScheduleBtn = document.getElementById('openScheduleBtn');
  const closeScheduleBtn = document.getElementById('closeScheduleModal');
  const calendarWrapper = document.getElementById('calendarActionWrapper');
  const liveMeetingTitle = document.getElementById('liveMeetingTitle');
  const liveMeetingLink = document.getElementById('liveMeetingLink');

  const checkAlertStatus = () => {
    const currentDayIndex = new Date().getDay();
    const isWeekend = currentDayIndex === 0 || currentDayIndex === 6;

    if (calendarWrapper) calendarWrapper.classList.remove('is-live');
    if (openScheduleBtn) openScheduleBtn.classList.remove('is-alerting');

    if (isWeekend || allScheduleData.length === 0) return;

    const todayData = allScheduleData[currentDayIndex - 1];
    if (!todayData || !todayData.meeting) return;

    const activeSchedules = todayData.meeting.filter((m) => m.active);
    const now = getCurrentMinutes();

    let currentMeeting = null;
    let upcomingMeeting = null;

    activeSchedules.forEach((meet) => {
      const start = parseTime(meet.hour);
      const end = start + 30;

      if (now >= start && now < end) {
        currentMeeting = meet;
      } else if (now >= start - 10 && now < start) {
        upcomingMeeting = meet;
      }
    });

    const meetingToDisplay = currentMeeting || upcomingMeeting;

    if (meetingToDisplay) {
      if (openScheduleBtn) openScheduleBtn.classList.add('is-alerting');

      if (calendarWrapper && liveMeetingTitle && liveMeetingLink) {
        const statusText = currentMeeting ? 'În curs:' : 'Începe curând:';
        liveMeetingTitle.textContent = `${statusText} ${meetingToDisplay.team}`;
        liveMeetingLink.href = meetingToDisplay.url;

        calendarWrapper.classList.add('is-live');
      }
    }
  };

  openScheduleBtn?.addEventListener('click', () => {
    scheduleModal.showModal();
    document.body.classList.add('no-scroll');
  });

  const closeModal = () => {
    scheduleModal.close();
    document.body.classList.remove('no-scroll');
  };

  closeScheduleBtn?.addEventListener('click', closeModal);

  scheduleModal?.addEventListener('click', (event) => {
    if (event.target === scheduleModal) {
      closeModal();
    }
  });

  const ELEMENTS = {
    cardsContainer: document.querySelector('.schedule-cards'),
    daysContainer: document.querySelector('.schedule-days'),
  };

  let allScheduleData = [];
  let cardUpdateInterval = null;
  let alertInterval = null;
  const currentDayIndex = new Date().getDay();

  const getCurrentMinutes = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };

  const parseTime = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const getFooterMessage = (dayName) =>
    dayName === 'Vineri' ? 'Ne vedem de Luni!' : 'Ne vedem de mâine!';

  async function initApp() {
    try {
      const response = await fetch('/data/schedule.json');
      allScheduleData = await response.json();

      renderButtons();

      const isWeekend = currentDayIndex === 0 || currentDayIndex === 6;
      if (isWeekend) {
        renderWeekend();
      } else {
        selectDay(currentDayIndex - 1);
      }

      checkAlertStatus();
      alertInterval = setInterval(checkAlertStatus, 1000);
    } catch (error) {
      console.error('Eroare la încărcarea datelor programului:', error);
    }
  }

  function renderButtons() {
    ELEMENTS.daysContainer.innerHTML = '';
    allScheduleData.forEach((dayData, index) => {
      const btn = document.createElement('button');
      btn.className = 'schedule-day shade';
      if (currentDayIndex === index + 1) btn.classList.add('active');

      btn.innerHTML = `
        <span class="day-short">${dayData.day.first}</span>
        <span class="day-long">${dayData.day.full}</span>
      `;

      btn.addEventListener('click', () => {
        document.querySelectorAll('.schedule-day').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        selectDay(index);
      });

      ELEMENTS.daysContainer.appendChild(btn);
    });
  }

  function selectDay(dataIndex) {
    const dayData = allScheduleData[dataIndex];
    const activeSchedules = dayData.meeting.filter((m) => m.active);

    if (cardUpdateInterval) clearInterval(cardUpdateInterval);

    ELEMENTS.cardsContainer.innerHTML = '';

    if (activeSchedules.length === 0) {
      renderNoSchedule(dayData.day.full);
    } else {
      renderCards(activeSchedules, dataIndex);
    }
  }

  function renderWeekend() {
    ELEMENTS.cardsContainer.innerHTML = `
      <div class="weekend-card shade">
        <span class="highlight-text">Este weekend, nu avem ședințe!
        <span class="deep-blue-text">Ne vedem de Luni!</span></span>
      </div>`;
  }

  function renderNoSchedule(dayName) {
    ELEMENTS.cardsContainer.innerHTML = `
      <div class="weekend-card shade">
        <span class="highlight-text">${dayName} nu avem ședințe!
        <span class="deep-blue-text">${getFooterMessage(dayName)}</span></span>
      </div>`;
  }

  function renderCards(schedules, dayIndex) {
    schedules.forEach((meet) => {
      const start = parseTime(meet.hour);
      const end = start + 30;

      const card = document.createElement('a');
      card.className = 'schedule-card shade';
      card.dataset.label = 'PARTICIPĂ';

      card.href = meet.url;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.dataset.start = start;
      card.dataset.end = end;

      card.innerHTML = `
        <div class="schedule-card__top">${meet.for}</div>
        <div class="schedule-card__middle">${meet.team}</div>
        <div class="schedule-card__bottom">${meet.hour}</div>
      `;

      ELEMENTS.cardsContainer.appendChild(card);
    });

    if (currentDayIndex === dayIndex + 1) {
      const updateCardsState = () => {
        const now = getCurrentMinutes();
        const cards = ELEMENTS.cardsContainer.querySelectorAll('.schedule-card');
        cards.forEach((c) => {
          const start = parseInt(c.dataset.start);
          const end = parseInt(c.dataset.end);
          if (now >= start && now <= end) {
            c.classList.add('active');
          } else {
            c.classList.remove('active');
          }
        });
      };

      updateCardsState();
      cardUpdateInterval = setInterval(updateCardsState, 10000);
    }
  }

  initApp();
});
