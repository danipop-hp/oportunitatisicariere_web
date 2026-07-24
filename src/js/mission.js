const totalJobs = document.querySelector('#total-jobs');
const totalVolunteers = document.querySelector('#total-volunteers');
const totalProjects = document.querySelector('#total-projects');

const jobsUrl = 'https://api.peviitor.ro/v1/total/';
const statsUrl = 'https://raw.githubusercontent.com/danipop-hp/oportunitatisicariere_web/modificare/stats.json';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch(jobsUrl);
    const data = await res.json();
    totalJobs.textContent = data?.total?.jobs?.toLocaleString('de-DE') ?? '15.000';
  } catch (error) {
    console.error('Jobs fetch error:', error);
    totalJobs.textContent = '15.000';
  }

  try {
    const res = await fetch(statsUrl);
    if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`);
    const stats = await res.json();
    totalProjects.textContent = stats.projects.toLocaleString('de-DE');
    totalVolunteers.textContent = stats.volunteers.toLocaleString('de-DE');
  } catch (error) {
    console.error('Stats fetch error:', error);
    totalProjects.textContent = '60+';
    totalVolunteers.textContent = '300+';
  }
});
