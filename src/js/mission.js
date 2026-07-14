const totalJobs = document.querySelector('#total-jobs');
const url = 'https://api.peviitor.ro/v1/total/';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();

    if (data?.total?.jobs) {
      totalJobs.textContent = data.total.jobs.toLocaleString('de-DE');
    } else {
      totalJobs.textContent = '15.000';
    }
  } catch (error) {
    console.error('Fetch error:', error);
    totalJobs.textContent = '15.000';
  }
});
