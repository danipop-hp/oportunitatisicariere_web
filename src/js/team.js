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

  const months = [
    'Ianuarie',
    'Februarie',
    'Martie',
    'Aprilie',
    'Mai',
    'Iunie',
    'Iulie',
    'August',
    'Septembrie',
    'Octombrie',
    'Noiembrie',
    'Decembrie',
  ];
  const shortMonths = months.map((el) => el.slice(0, 3));

  // Compute full years of experience since a join date
  function calculateYearsOfExp(joinedAt) {
    if (!joinedAt) return null;

    const joinDate = new Date(joinedAt);
    if (Number.isNaN(joinDate.getTime())) return null;

    const todayDate = new Date();
    let yearsOfExp = todayDate.getFullYear() - joinDate.getFullYear();
    const isAnniversaryDay =
      todayDate.getMonth() > joinDate.getMonth() ||
      (todayDate.getMonth() === joinDate.getMonth() && todayDate.getDate() >= joinDate.getDate());

    if (!isAnniversaryDay) yearsOfExp -= 1;

    return Math.max(yearsOfExp, 0);
  }

  function calculateMonthsOfExp(joinedAt) {
    if (!joinedAt) return null;

    const joinDate = new Date(joinedAt);
    if (Number.isNaN(joinDate.getTime())) return null;

    const todayDate = new Date();
    let monthsOfExp =
      (todayDate.getFullYear() - joinDate.getFullYear()) * 12 +
      (todayDate.getMonth() - joinDate.getMonth());

    if (todayDate.getDate() < joinDate.getDate()) monthsOfExp -= 1;

    return Math.max(monthsOfExp, 0);
  }

  function yearsOfExpeLabel(yearsOfExp, monthsOfExp) {
    if (yearsOfExp === null) return '';
    if (yearsOfExp >= 1) {
      return yearsOfExp === 1 ? '1 an' : `${yearsOfExp} ani`;
    }

    if (monthsOfExp === null) return '';
    if (monthsOfExp < 1) return '1 lună';
    return monthsOfExp === 1 ? '1 lună' : `${monthsOfExp} luni`;
  }

  // full date for Tooltip
  function fullJoinDate(joinedAt) {
    if (!joinedAt) return null;

    const joinDate = new Date(joinedAt);
    if (Number.isNaN(joinDate.getTime())) return null;

    const day = joinDate.getDate();
    const month = shortMonths[joinDate.getMonth()];
    const year = joinDate.getFullYear();

    return `${day} • ${month} • ${year}`;
  }

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
        socialHTML += `
          <a href="${member.socials.linkedin}" target="_blank" aria-label="LinkedIn">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M14.7519 10.011V10.6356C15.3556 10.2613 16.0527 10.0431 17.1117 10.0431C20.5587 10.0431 21 12.6146 21 14.8549V20.965L17.0144 21V15.1562C17.0144 14.1752 16.6624 13.989 16.0115 13.989C15.3927 13.989 15.0086 14.1842 15.0086 15.1562V21L10.9709 20.965V10.011L14.7519 10.011ZM9.01163 10.0044V20.9954H5V10.0044L9.01163 10.0044ZM8.00872 11.0054H6.00291V19.9944H8.00872V11.0054ZM13.749 11.012H11.9738V19.973L14.0057 19.991V15.1562C14.0057 13.2693 15.2624 12.988 16.0115 12.988C16.9262 12.988 18.0174 13.3644 18.0174 15.1562V19.991L19.9971 19.973V14.8549C19.9971 12.0771 19.2158 11.044 17.1117 11.044C15.8471 11.044 15.2995 11.4184 14.7629 11.8689L14.6235 11.987H13.749V11.012ZM7.00582 5C8.11203 5 9.01163 5.8979 9.01163 7.002C9.01163 8.10611 8.11203 9.004 7.00582 9.004C5.89961 9.004 5 8.10611 5 7.002C5 5.8979 5.89961 6.001 7.00582 6.001Z" fill="currentColor"/>
            </svg>
          </a>`;
      }
      if (member.socials.github) {
        socialHTML += `
          <a href="${member.socials.github}" target="_blank" aria-label="GitHub">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M10.2918 22V19.4407L10.3255 17.6219C10.366 17.0561 10.5864 16.5228 10.9491 16.11C10.9544 16.1039 10.9597 16.0979 10.9651 16.0919C10.9791 16.0763 10.9699 16.0511 10.9491 16.0485C8.52554 15.746 6.0005 14.7227 6.0005 10.2675C5.9847 9.17021 6.3427 8.10648 7.00437 7.27215C7.02752 7.24297 7.05103 7.21406 7.07492 7.18545C7.10601 7.1482 7.11618 7.09772 7.10194 7.05134C7.10107 7.04853 7.10021 7.04571 7.09935 7.04289C7.0832 6.9899 7.06804 6.93666 7.05388 6.88321C6.81065 5.96474 6.86295 4.98363 7.20527 4.09818C7.20779 4.09164 7.21034 4.08511 7.2129 4.07858C7.22568 4.04599 7.25251 4.02108 7.28698 4.01493C7.50189 3.97661 8.37036 3.92534 10.033 5.07346C10.0847 5.10919 10.1372 5.14609 10.1905 5.18418C10.229 5.21168 10.2779 5.22011 10.3234 5.20716L10.3277 5.20593C10.417 5.18056 10.5065 5.15649 10.5962 5.1337C12.1766 4.73226 13.8234 4.73226 15.4038 5.1337C15.4889 5.1553 15.5737 5.17807 15.6584 5.20199L15.6639 5.20356C15.7174 5.21872 15.7749 5.20882 15.8202 5.17653C15.8698 5.14114 15.9187 5.10679 15.967 5.07346C17.6257 3.92776 18.4894 3.9764 18.7053 4.01469C18.7404 4.02092 18.7678 4.04628 18.781 4.07946C18.7827 4.08373 18.7843 4.08799 18.786 4.09226C19.1341 4.97811 19.1894 5.96214 18.946 6.88321C18.9315 6.93811 18.9159 6.9928 18.8993 7.04723C18.8843 7.09618 18.8951 7.14942 18.9278 7.18875L18.9309 7.19245C18.9528 7.21877 18.9744 7.24534 18.9956 7.27215C19.6573 8.10648 20.0153 9.17021 19.9995 10.2675C19.9995 14.747 17.4565 15.7435 15.0214 16.015C15.0073 16.0165 15.001 16.0334 15.0105 16.0439C15.0141 16.0479 15.0178 16.0519 15.0214 16.0559C15.2671 16.3296 15.4577 16.6544 15.5811 17.0103C15.7101 17.3824 15.7626 17.7797 15.7351 18.1754V22" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M6.94434 19.7529C7.13839 19.7804 7.32367 19.8519 7.48614 19.9619C7.6486 20.0719 7.784 20.2175 7.88206 20.3879C7.96538 20.5395 8.07772 20.6731 8.21263 20.781C8.34754 20.8889 8.50236 20.9691 8.66822 21.0168C8.83407 21.0646 9.00768 21.079 9.1791 21.0593C9.35051 21.0396 9.51636 20.986 9.66711 20.9018" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>
        `;
      }
      if (member.socials.discord) {
        socialHTML += `<a href="${member.socials.discord}" target="_blank" aria-label="Discord"><i class="ri-discord-fill"></i></a>`;
      }

      const avatarPath = resolvePath(member.avatar);

      const leaderBadgeHTML = `
      <span class="badge-leader"${isLeader ? '' : ' aria-hidden="true"'}>
        <i class="ri-vip-crown-fill"></i> Team Lead
      </span>
      `;

      const yearsOfExperience = calculateYearsOfExp(member.joinedAt);
      const monthsOfExperience = calculateMonthsOfExp(member.joinedAt);
      const experienceLabel = yearsOfExpeLabel(yearsOfExperience, monthsOfExperience);
      const join = fullJoinDate(member.joinedAt);

      const experienceBadgeHTML =
        experienceLabel && join
          ? `
            <span class="badge-experience" tabindex="0">
              <i class="ri-calendar-check-line"></i> Experiență: ${experienceLabel}
              <span class="badge-experience__tooltip" role="tooltip">${join}</span>
            </span>
          `
          : '';

      card.innerHTML = `
      <div class="member-card__img-wrapper">
        <img src="${avatarPath}" alt="${member.name}" loading="lazy" />
      </div>
      <div class="member-card__content">
        ${leaderBadgeHTML}
        ${experienceBadgeHTML}
        <div class="member-card__name-position">
          <h4 class="name">${member.name}</h4>
          <p class="role">${role.position}</p>
        </div>
        <div class="social-links">
          ${socialHTML}
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
