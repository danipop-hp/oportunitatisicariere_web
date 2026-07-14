const goToTeamBtns = document.querySelectorAll('.go-to-team-btn');
let preferredTeam;

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('id');

  const resolvePath = (targetPath) => {
    const depth = window.location.pathname.includes('/html/') ? '../' : './';
    return `${depth}${targetPath}`;
  };

  fetch(resolvePath('data/positions.json'))
    .then((response) => response.json())
    .then((data) => {
      const job = data.find((job) => job.id === jobId);

      if (!job || job.isHiring === false) {
        window.location.href = '404.html';
        return;
      }

      preferredTeam = job.team;

      document.getElementById('job-title').textContent = job.title;
      document.getElementById('employer-name').textContent += job.employer;
      document.getElementById('department-name').textContent += job.department;

      document.getElementById('job-location').textContent = job.location;
      document.getElementById('job-type').textContent = job.jobType;
      document.getElementById('job-experience').textContent = job.experience;
      document.getElementById('job-salary').textContent = job.salary;

      document.getElementById('job-description').textContent = job.jobDescription;

      const populateList = (elementId, arrayData) => {
        const container = document.getElementById(elementId);
        arrayData.forEach((item) => {
          const li = document.createElement('li');
          li.textContent = item;
          container.appendChild(li);
        });
      };

      populateList('job-responsabilities', job.responsabilities);
      populateList('job-demands', job.demands);
      populateList('job-offerings', job.offerings);
      populateList('job-general-info', job.generalInfo);

      let photoSrc = job.aboutEmployer.photo;
      if (photoSrc.startsWith('./')) {
        photoSrc = photoSrc.replace('./', '/');
      }
      document.getElementById('recruiter-photo').src = photoSrc;

      document.getElementById('recruiter-name').textContent = job.aboutEmployer.name;
      document.getElementById('recruiter-role').textContent = job.aboutEmployer.title;

      document.getElementById('recruiter-country').textContent += job.location;
      document.getElementById('recruiter-address').textContent += job.aboutEmployer.address;

      document.getElementById('recruiter-email').innerHTML += `
        <a href="mailto:${job.aboutEmployer.email}">${job.aboutEmployer.email}</a>
        <i class="ri-file-copy-line copy-icon" id="copy-email" title="Copiază adresa"></i>
      `;

      document
        .getElementById('recruiter-linkedin')
        .setAttribute('href', job.aboutEmployer.linkedin);
      document.getElementById('recruiter-github').setAttribute('href', job.aboutEmployer.github);
      document.getElementById('recruiter-discord').setAttribute('href', job.aboutEmployer.discord);

      const copyEmailBtn = document.getElementById('copy-email');
      if (copyEmailBtn) {
        copyEmailBtn.addEventListener('click', (e) => {
          const copyText = job.aboutEmployer.email;
          navigator.clipboard.writeText(copyText);

          e.target.classList.replace('ri-file-copy-line', 'ri-check-line');
          e.target.style.color = '#10B981';

          setTimeout(() => {
            e.target.classList.replace('ri-check-line', 'ri-file-copy-line');
            e.target.style.color = 'inherit';
          }, 2000);
        });
      }

      checkPath(data);
    })
    .catch((error) => {
      console.error('Error loading data:', error);
      window.location.href = '../404.html';
    });
});

goToTeamBtns.forEach((btn) => {
  btn.addEventListener('click', goToTeam);
});

function checkPath(data, idKey = 'id') {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid data provided');
    }

    const path = new URLSearchParams(window.location.search);
    const pathId = path.get(idKey);

    const matchFound = data.some((job) => job[idKey] === pathId);

    if (!matchFound) {
      window.location.href = '../404.html';
    }
  } catch (error) {
    console.error('Error in checkPath:', error.message);
  }
}

function goToTeam() {
  sessionStorage.setItem('preferredTeam', preferredTeam);
  window.location.href = '/#teamList';
}
