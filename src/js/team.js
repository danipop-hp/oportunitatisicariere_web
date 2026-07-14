document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements & State
  const teamNavbar = document.querySelector('#teamNavbar');
  const membersWrapper = document.querySelector('#teamWrapper');
  const loadMoreBtn = document.querySelector('#loadMoreBtn');

  const ITEMS_PER_PAGE = 9;

  let teamMembers = [];
  let currentTeamMembers = [];
  let currentPage = 1;
  let currentActiveTeam = '';

  const preferredTeam = sessionStorage.getItem('preferredTeam');

  // Path resolver
  const resolvePath = (targetPath) => {
    const depth = window.location.pathname.includes('/html/') ? '../' : './';
    const cleanPath = targetPath.replace(/^(\.\/|\/)/, '');
    return `${depth}${cleanPath}`;
  };

  // Fetch data
  function loadTeamMembers() {
    fetch(resolvePath('data/volunteers.json'))
      .then((response) => response.json())
      .then((data) => {
        teamMembers = data
          .map((member) => {
            const activeRoles = member.roles.filter((role) => role.status === true);
            if (activeRoles.length === 0) return null;
            return { ...member, roles: activeRoles };
          })
          .filter((member) => member !== null);

        initializeTeams();
      })
      .catch((error) => console.error('Eroare la încărcarea voluntarilor:', error));
  }

  // Initialize teams navigation
  function initializeTeams() {
    const teams = [
      ...new Set(teamMembers.flatMap((member) => member.roles.map((role) => role.team))),
    ];

    let firstButton = null;
    let hasActiveBtn = false;

    for (const team of teams) {
      const li = document.createElement('li');
      const button = document.createElement('button');

      button.type = 'button';
      button.classList.add('team-btn');
      button.textContent = team;

      if (!firstButton) firstButton = button;

      button.addEventListener('click', () => {
        document.querySelectorAll('.team-btn').forEach((btn) => btn.classList.remove('active'));
        button.classList.add('active');

        currentPage = 1;
        currentActiveTeam = team;

        filterAndSortTeam(team);
        membersWrapper.innerHTML = '';
        renderMembersBatch();
      });

      li.appendChild(button);
      teamNavbar.appendChild(li);

      if (preferredTeam === team) {
        button.classList.add('active');
        hasActiveBtn = true;
        currentActiveTeam = team;
      }
    }

    if ((!preferredTeam || !hasActiveBtn) && firstButton) {
      firstButton.classList.add('active');
      currentActiveTeam = firstButton.textContent;
    }

    if (currentActiveTeam) {
      filterAndSortTeam(currentActiveTeam);
      renderMembersBatch();
    }
  }

  // Filter and sort team members
  function filterAndSortTeam(selectedTeam) {
    const filteredMembers = teamMembers.filter((member) =>
      member.roles.some((role) => role.team === selectedTeam)
    );

    currentTeamMembers = filteredMembers.sort((a, b) => {
      const aIsLeader = a.roles.some((role) => role.team === selectedTeam && role.teamLead);
      const bIsLeader = b.roles.some((role) => role.team === selectedTeam && role.teamLead);
      return bIsLeader - aIsLeader;
    });
  }

  // Render members batch
  function renderMembersBatch() {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    const membersToRender = currentTeamMembers.slice(startIndex, endIndex);

    membersToRender.forEach((member) => {
      const role = member.roles.find((r) => r.team === currentActiveTeam);
      if (!role) return;

      const card = document.createElement('article');
      card.classList.add('member-card');

      const isLeader = role.teamLead;
      if (isLeader) {
        card.classList.add('member-card--leader');
      }

      let socialHTML = '';
      if (member.socials.linkedin) {
        socialHTML += `<a href="${member.socials.linkedin}" target="_blank" aria-label="LinkedIn"><i class="ri-linkedin-fill"></i></a>`;
      }
      if (member.socials.github) {
        socialHTML += `<a href="${member.socials.github}" target="_blank" aria-label="GitHub"><i class="ri-github-fill"></i></a>`;
      }
      if (member.socials.discord) {
        socialHTML += `<a href="${member.socials.discord}" target="_blank" aria-label="Discord"><i class="ri-discord-fill"></i></a>`;
      }

      const avatarPath = resolvePath(member.avatar);

      const leaderBadgeHTML = isLeader
        ? `<span class="badge-leader"><i class="ri-vip-crown-fill"></i> Team Lead</span>`
        : '';

      card.innerHTML = `
        <div class="member-card__img-wrapper">
          <img src="${avatarPath}" alt="${member.name}" loading="lazy" />
        </div>
        <div class="member-card__content">
          ${leaderBadgeHTML}
          <div class="member-card__text">
            <h4 class="name">${member.name}</h4>
            <p class="role">${role.position}</p>
            <div class="social-links">
              ${socialHTML}
            </div>
          </div>
        </div>
      `;

      membersWrapper.appendChild(card);
    });

    if (endIndex >= currentTeamMembers.length) {
      loadMoreBtn.style.display = 'none';
    } else {
      loadMoreBtn.style.display = 'block';
    }
  }

  // Event listeners
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      currentPage++;
      renderMembersBatch();
    });
  }

  membersWrapper.addEventListener('click', (event) => {
    const link = event.target.closest('a');

    if (link) {
      const hrefValue = link.getAttribute('href');

      if (hrefValue === '#') {
        event.preventDefault();
      }
    }
  });

  // Initialization
  loadTeamMembers();
});
