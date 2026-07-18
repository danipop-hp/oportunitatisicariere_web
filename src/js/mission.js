const totalJobs = document.querySelector('#total-jobs');
const totalVolunteers = document.querySelector('#total-volunteers');
const totalProjects = document.querySelector('#total-projects');

const jobsUrl = 'https://api.peviitor.ro/v1/total/';
const org = 'peviitor-ro';
const headers = { Accept: 'application/vnd.github+json' };
const CACHE_KEY = 'peviitor_github_stats';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const getCache = () => {
  const raw = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
  return raw && Date.now() - raw.timestamp < CACHE_TTL_MS ? raw : null;
};

const computeGithubStats = async () => {
  const reposRes = await fetch(`https://api.github.com/orgs/${org}/repos?per_page=100&type=public`, { headers });
  const repos = await reposRes.json();

  const volunteers = new Set();
  for (const repo of repos) {
    const res = await fetch(`https://api.github.com/repos/${repo.full_name}/contributors?per_page=100`, { headers });
    if (res.ok) {
      (await res.json()).forEach((c) => c.type !== 'Bot' && volunteers.add(c.login));
    }
  }

  return { projects: repos.length, volunteers: volunteers.size };
};

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch(jobsUrl);
    const data = await res.json();
    totalJobs.textContent = data?.total?.jobs?.toLocaleString('de-DE') ?? '15.000';
  } catch {
    totalJobs.textContent = '15.000';
  }

  const cached = getCache();
  if (cached) {
    totalProjects.textContent = cached.projects.toLocaleString('de-DE');
    totalVolunteers.textContent = cached.volunteers.toLocaleString('de-DE');
    return;
  }

  try {
    const { projects, volunteers } = await computeGithubStats();
    totalProjects.textContent = projects.toLocaleString('de-DE');
    totalVolunteers.textContent = volunteers.toLocaleString('de-DE');
    localStorage.setItem(CACHE_KEY, JSON.stringify({ projects, volunteers, timestamp: Date.now() }));
  } catch (error) {
    console.error('GitHub stats fetch error:', error);
    totalProjects.textContent = '60';
    totalVolunteers.textContent = '300';
  }
}); //test updated