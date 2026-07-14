document.addEventListener('DOMContentLoaded', () => {
  const swiperWrapper = document.getElementById('swiperWrapper');
  const navList = document.getElementById('storiesNavList');

  let stories = [];
  let swiperInstance = null;

  // Path resolver
  const resolvePath = (targetPath) => {
    const depth = window.location.pathname.includes('/html/') ? '../' : './';
    const cleanPath = targetPath.replace(/^(\.\/|\/)/, '');
    return `${depth}${cleanPath}`;
  };

  // Fetch data
  function loadStories() {
    fetch(resolvePath('data/stories.json'))
      .then((response) => response.json())
      .then((data) => {
        stories = data;
        renderStories();
        initSwiper();
      })
      .catch((error) => console.error('Error loading stories:', error));
  }

  // Render slides and navigation
  function renderStories() {
    swiperWrapper.innerHTML = '';
    navList.innerHTML = '';

    stories.forEach((story, index) => {
      const avatarPath = resolvePath(story.avatar);

      // Slide HTML
      const slideHTML = `
        <article class="swiper-slide story-slide">
          <div class="story-slide__card">
            <div class="story-slide__glass">
              <div class="story-slide__img-wrapper">
                <img src="${avatarPath}" alt="${story.name}" loading="lazy" />
              </div>
              <div class="story-slide__content">
                <h2 class="name">${story.name}</h2>
                <p class="role"><i class="${story.icon}"></i> ${story.role}</p>
                <div class="quote">
                  <p>${story.text}</p>
                </div>
              </div>
            </div>
          </div>
        </article>
      `;
      swiperWrapper.insertAdjacentHTML('beforeend', slideHTML);

      // Navigation button HTML
      const isActive = index === 0 ? 'active' : '';
      const navHTML = `
        <li>
          <button type="button" class="story-nav-btn ${isActive}" data-index="${index}">
            <div class="story-nav-btn__avatar">
              <img src="${avatarPath}" alt="${story.name}" loading="lazy" />
            </div>
            <span class="story-nav-btn__name">${story.name}</span>
          </button>
        </li>
      `;
      navList.insertAdjacentHTML('beforeend', navHTML);
    });

    // Navigation click events
    const navButtons = navList.querySelectorAll('.story-nav-btn');
    navButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.getAttribute('data-index'), 10);
        if (swiperInstance) {
          swiperInstance.slideToLoop(index);
        }
      });
    });
  }

  // Initialize Swiper
  function initSwiper() {
    swiperInstance = new Swiper('#storiesSwiper', {
      direction: 'horizontal',
      loop: true,
      grabCursor: true,
      spaceBetween: 30,

      autoHeight: true,

      breakpoints: {
        1024: {
          autoHeight: false,
        },
      },

      autoplay: {
        delay: 30000,
        disableOnInteraction: false,
      },

      on: {
        slideChange: function () {
          updateNavActiveState(this.realIndex);
        },
      },
    });
  }

  // Update active state in navigation
  function updateNavActiveState(activeIndex) {
    const navButtons = navList.querySelectorAll('.story-nav-btn');

    navButtons.forEach((btn, index) => {
      if (index === activeIndex) {
        btn.classList.add('active');
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Start
  loadStories();
});
