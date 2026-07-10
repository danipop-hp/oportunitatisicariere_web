const fs = require('fs');
const path = require('path');

let token = process.env.GITHUB_TOKEN || '';

if (!token) {
  const tryReadEnv = (filename) => {
    const filePath = path.join(__dirname, '..', '..', filename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const match = content.match(/GITHUB_TOKEN\s*=\s*([^\r\n]+)/);
      if (match) return match[1].trim();
    }
    return '';
  };
  token = tryReadEnv('.env.local') || tryReadEnv('.env');
}

if (!token) {
  console.error('Error: GITHUB_TOKEN not found.');
  console.error(
    'Please create a .env.local or .env file in the root containing GITHUB_TOKEN=your_token'
  );
  process.exit(1);
}

const org = 'peviitor-ro';
const jsonPath = path.join(__dirname, '..', 'data', 'volunteers.json');

if (!fs.existsSync(jsonPath)) {
  console.error('Error: volunteers.json not found.');
  process.exit(1);
}

const volunteers = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Delay helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let lastSearchTime = 0;

// Github request with automatic rate limit handling
async function fetchGitHub(url) {
  const isSearch = url.includes('/search/');
  if (isSearch) {
    const now = Date.now();
    const timeSinceLastSearch = now - lastSearchTime;
    const minDelay = 2200; // 2.2 seconds delay to stay under 30 search requests per minute limit
    if (timeSinceLastSearch < minDelay) {
      await sleep(minDelay - timeSinceLastSearch);
    }
    lastSearchTime = Date.now();
  }

  while (true) {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'node-fetch-script',
      },
    });

    if (response.status === 401) {
      throw new Error('Unauthorized: Invalid GitHub token.');
    }

    if (response.status === 403 || response.status === 429) {
      const rateLimitReset = response.headers.get('x-ratelimit-reset');
      const retryAfter = response.headers.get('retry-after');

      let waitMs = 15000;
      if (rateLimitReset) {
        const resetTime = parseInt(rateLimitReset) * 1000;
        waitMs = Math.max(resetTime - Date.now() + 2000, 2000);
      } else if (retryAfter) {
        waitMs = parseInt(retryAfter) * 1000 + 2000;
      }

      console.log(
        `\n[Rate Limit] Hitting API rate limit on ${url}. Waiting for ${Math.round(waitMs / 1000)} seconds to reset...`
      );
      await sleep(waitMs);
      continue;
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    return response.json();
  }
}

// Get join date for a username
async function getJoinDate(username) {
  console.log(`Processing user: ${username}...`);

  // Manual overrides for specific cases (e.g., organization founder)
  const manualOverrides = {
    sebiboga: { date: '2021-08-01', method: 'org-creation-founder' },
  };

  if (manualOverrides[username]) {
    console.log(`  Success (Override): ${username} matches manual override`);
    return manualOverrides[username];
  }

  let earliestDate = null;
  let bestMethod = '';

  const updateEarliest = (dateStr, method) => {
    if (!dateStr) return;
    const date = new Date(dateStr);
    if (!earliestDate || date < earliestDate) {
      earliestDate = date;
      bestMethod = method;
    }
  };

  // 1. Try Audit Log
  try {
    const auditUrl = `https://api.github.com/orgs/${org}/audit-log?phrase=action:org.add_member+user:${username}`;
    const auditLogs = await fetchGitHub(auditUrl);
    if (Array.isArray(auditLogs) && auditLogs.length > 0) {
      const addEvent = auditLogs.find((log) => log.action === 'org.add_member');
      if (addEvent) {
        const timestamp = addEvent['@timestamp'] || addEvent.created_at;
        updateEarliest(timestamp, 'audit-log');
      }
    }
  } catch (error) {}

  // 2. Query Search Issues
  try {
    const url = `https://api.github.com/search/issues?q=org:${org}+author:${username}+is:issue&sort=created&order=asc&per_page=1`;
    const res = await fetchGitHub(url);
    if (res && res.items && res.items.length > 0) {
      updateEarliest(res.items[0].created_at, 'first-issue');
    }
  } catch (error) {
    console.log(`  Issue search failed for ${username}: ${error.message}`);
  }

  // 3. Query Search Pull Requests
  try {
    const url = `https://api.github.com/search/issues?q=org:${org}+author:${username}+is:pull-request&sort=created&order=asc&per_page=1`;
    const res = await fetchGitHub(url);
    if (res && res.items && res.items.length > 0) {
      updateEarliest(res.items[0].created_at, 'first-pull-request');
    }
  } catch (error) {
    console.log(`  PR search failed for ${username}: ${error.message}`);
  }

  // 4. Fallback to Account Creation
  if (!earliestDate) {
    try {
      const userUrl = `https://api.github.com/users/${username}`;
      const userRes = await fetchGitHub(userUrl);
      if (userRes && userRes.created_at) {
        updateEarliest(userRes.created_at, 'account-creation');
      }
    } catch (error) {
      console.log(`  User profile fetch failed for ${username}: ${error.message}`);
    }
  }

  if (earliestDate) {
    return {
      date: earliestDate.toISOString().split('T')[0],
      method: bestMethod,
    };
  }
  return null;
}

async function main() {
  let updatedCount = 0;
  for (let i = 0; i < volunteers.length; i++) {
    const member = volunteers[i];

    // Skip if it exists
    if (member.joinedAt) {
      console.log(`Skipping ${member.name} (already has joinedAt: ${member.joinedAt})`);
      continue;
    }

    const githubUrl = member.socials && member.socials.github;
    if (githubUrl && githubUrl.includes('github.com/')) {
      const parts = githubUrl.split('github.com/');
      if (parts.length > 1) {
        const username = parts[1].split('/')[0].split('?')[0].split('#')[0].trim();
        if (username) {
          try {
            const res = await getJoinDate(username);
            if (res) {
              member.joinedAt = res.date;
              member.joinedAtMethod = res.method;
              console.log(`  Success: ${username} joined at ${res.date} via ${res.method}`);
              updatedCount++;

              // Save incrementally
              fs.writeFileSync(jsonPath, JSON.stringify(volunteers, null, 2), 'utf8');
            } else {
              console.log(`  Could not find any date for ${username}`);
            }
          } catch (e) {
            console.error(`  Error processing ${username}:`, e.message);
          }
        }
      }
    }
  }

  console.log(`\nFinished! Updated ${updatedCount} volunteers in volunteers.json.`);
}

main();
