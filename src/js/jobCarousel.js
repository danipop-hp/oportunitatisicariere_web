document.addEventListener('DOMContentLoaded', () => {
  const rolesContainer = document.getElementById('rolesCarousel');
  const searchInput = document.getElementById('rolesSearch');
  const searchBtn = document.querySelector('.search-icon-btn');

  let allJobs = [];
  let swiperInstance = null;

  function initSwiper(jobsCount) {
    if (swiperInstance) {
      swiperInstance.destroy(true, true);
    }

    const shouldLoop = jobsCount >= 3;

    swiperInstance = new Swiper('.roles-swiper', {
      centeredSlides: true,
      grabCursor: true,
      loop: shouldLoop,

      autoplay: {
        delay: 3500,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },

      breakpoints: {
        0: { slidesPerView: 1.25, spaceBetween: 16 },
        768: { slidesPerView: 2.2, spaceBetween: 24 },
        1024: { slidesPerView: 3, spaceBetween: 40 },
      },
    });
  }

  function renderRoles(roles) {
    if (!rolesContainer) return;
    rolesContainer.innerHTML = '';

    if (roles.length === 0) {
      if (swiperInstance) swiperInstance.destroy(true, true);

      rolesContainer.innerHTML = `
        <div class="empty-state-card shade" style="width: 100%; max-width: 600px; margin: 0 auto; padding: 6rem 2rem; border-radius: 2.4rem; background: #ffffff; text-align: center; border: 1px dashed #00c288;">
          <i class="ri-ghost-line" style="font-size: 5.6rem; color: #00c288; margin-bottom: 1rem; display: inline-block;"></i>
          <h3 style="font-size: 2.4rem; color: #101828; margin-bottom: 1rem;">Hopa! 🕵️‍♂️</h3>
          <p style="font-size: 1.6rem; color: #667085;">Am căutat prin toate birourile, dar se pare că acest rol a luat o pauză lungă de cafea. Încearcă un alt termen!</p>
        </div>
      `;
      return;
    }

    roles.forEach((job) => {
      const slide = document.createElement('div');
      slide.className = 'swiper-slide';

      const imageSrc = job.image ? job.image.replace(/^\.\//, '/') : '/assets/placeholder.jpg';

      slide.innerHTML = `
        <a href="/pozitie.html?id=${job.id}" class="role-card">
          <div class="card-img-wrapper">
            <img src="${imageSrc}" alt="${job.title}">
          </div>
          <div class="card-gradient"></div>
          <div class="card-hover-overlay">
            <div class="apply-btn-mock">
              <span>Aplică</span>
              <i class="ri-arrow-right-up-line"></i>
            </div>
          </div>
          <h3 class="card-title">${job.title}</h3>
        </a>
      `;

      rolesContainer.appendChild(slide);
    });

    initSwiper(roles.length);
  }

  function handleSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    if (searchTerm.length >= 2) {
      const filteredJobs = allJobs.filter((job) => job.title.toLowerCase().includes(searchTerm));
      renderRoles(filteredJobs);
    } else {
      renderRoles(allJobs);
    }
  }

  searchInput?.addEventListener('input', handleSearch);
  searchBtn?.addEventListener('click', handleSearch);

  async function fetchAndRenderRoles() {
    try {
      const response = await fetch('/data/positions.json');
      if (!response.ok) throw new Error(`Eroare HTTP! Status: ${response.status}`);

      allJobs = await response.json();
      renderRoles(allJobs);
    } catch (error) {
      console.error('Eroare:', error);

      if (rolesContainer) {
        if (swiperInstance) swiperInstance.destroy(true, true);

        rolesContainer.innerHTML = `
          <div class="empty-state-card shade" style="width: 100%; max-width: 600px; margin: 0 auto; padding: 6rem 2rem; border-radius: 2.4rem; background: #ffffff; text-align: center; border: 1px dashed #ef4444;">
            <i class="ri-wifi-off-line" style="font-size: 5.6rem; color: #ef4444; margin-bottom: 1rem; display: inline-block;"></i>
            <h3 style="font-size: 2.4rem; color: #101828; margin-bottom: 1rem;">Hopa! 🔌</h3>
            <p style="font-size: 1.6rem; color: #667085;">Se pare că am pierdut conexiunea. Te rugăm să reîncarci pagina sau să revii puțin mai târziu!</p>
          </div>
        `;
      }
    }
  }

  fetchAndRenderRoles();
});
