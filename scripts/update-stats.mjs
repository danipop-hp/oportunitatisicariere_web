// scripts/update-stats.mjs
// Runs in GitHub Actions (with a token), NOT in the browser.
// Uses the GitHub GraphQL API to fetch public repos and their contributors
// in a small number of paginated requests, then saves the result to stats.json.

import { writeFileSync } from 'fs';

const org = 'peviitor-ro';
const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.error('Missing GITHUB_TOKEN environment variable.');
  process.exit(1);
}

const query = `
  query ($org: String!, $reposCursor: String) {
    organization(login: $org) {
      repositories(first: 10, privacy: PUBLIC, after: $reposCursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          name
          defaultBranchRef {
            target {
              ... on Commit {
                history(first: 100) {
                  nodes {
                    author {
                      user {
                        login
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runQuery = async (variables, attempt = 1) => {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    if ((res.status === 502 || res.status === 504) && attempt < 4) {
      const waitMs = attempt * 2000;
      await sleep(waitMs);
      return runQuery(variables, attempt + 1);
    }
    throw new Error(`GraphQL request failed: ${res.status}`);
  }

  const json = await res.json();

  if (json.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
};

async function main() {

  let hasNextPage = true;
  let cursor = null;
  let totalRepos = 0;
  const volunteers = new Set();

  while (hasNextPage) {
    const data = await runQuery({ org, reposCursor: cursor });
    const repos = data.organization.repositories;

    totalRepos += repos.nodes.length;

    for (const repo of repos.nodes) {
      const commits = repo.defaultBranchRef?.target?.history?.nodes ?? [];
      for (const commit of commits) {
        const login = commit.author?.user?.login;
        if (login) volunteers.add(login);
      }
    }

    hasNextPage = repos.pageInfo.hasNextPage;
    cursor = repos.pageInfo.endCursor;
  }

  const stats = {
    projects: totalRepos,
    volunteers: volunteers.size,
    updatedAt: new Date().toISOString(),
  };

  writeFileSync('stats.json', JSON.stringify(stats, null, 2));
  console.log('Saved stats.json:', stats);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
