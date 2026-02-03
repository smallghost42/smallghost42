#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

// Minimalist color scheme
const colors = {
  bg: '#ffffff',
  text: '#1a1a1a',
  textMuted: '#666666',
  accent: '#0066cc',
};

// Fetch GitHub user data
async function fetchGitHubData(username) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/users/${username}`,
      headers: {
        'User-Agent': 'Node.js',
      },
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Failed to fetch data: ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

// Fetch GitHub repos
async function fetchGitHubRepos(username) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/users/${username}/repos?sort=updated&per_page=100`,
      headers: {
        'User-Agent': 'Node.js',
      },
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Failed to fetch repos: ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

// Create Profile Card SVG
function createProfileCard(userData) {
  const name = userData.name || userData.login;
  const bio = userData.bio || 'Developer';
  const followers = userData.followers || 0;

  const svg = `<svg width="800" height="140" viewBox="0 0 800 140" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        .title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 700; fill: ${colors.text}; }
        .subtitle { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; fill: ${colors.textMuted}; }
        .stat { font-size: 18px; font-weight: 600; fill: ${colors.text}; }
      </style>
    </defs>
    
    <text x="30" y="50" class="title">${name}</text>
    <text x="30" y="75" class="subtitle">${bio}</text>
    
    <line x1="30" y1="95" x2="770" y2="95" stroke="${colors.textMuted}" stroke-width="0.5"/>
    
    <text x="30" y="125" class="stat">${followers}</text>
    <text x="80" y="125" class="subtitle">Followers</text>
  </svg>`;

  return svg;
}

// Create Stats Card SVG
function createStatsCard(userData, repos) {
  const totalStars = repos.reduce((acc, repo) => acc + repo.stargazers_count, 0);
  const publicRepos = userData.public_repos || 0;

  const svg = `<svg width="800" height="120" viewBox="0 0 800 120" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        .title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; fill: ${colors.textMuted}; text-transform: uppercase; }
        .stat-value { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 28px; font-weight: 700; fill: ${colors.text}; }
      </style>
    </defs>
    
    <text x="30" y="30" class="title">Public Repos</text>
    <text x="30" y="70" class="stat-value">${publicRepos}</text>
    
    <text x="280" y="30" class="title">Total Stars</text>
    <text x="280" y="70" class="stat-value">${totalStars}</text>
    
    <text x="530" y="30" class="title">Followers</text>
    <text x="530" y="70" class="stat-value">${userData.followers}</text>
  </svg>`;

  return svg;
}

// Create Skills Card SVG
function createSkillsCard() {
  const skills = ['React', 'TypeScript', 'JavaScript', 'Python', 'Go', 'Node.js', 'PostgreSQL', 'Docker'];
  
  let skillElements = '';
  skills.forEach((skill, index) => {
    const x = 30 + (index % 4) * 190;
    const y = 80 + Math.floor(index / 4) * 50;
    skillElements += `<text x="${x}" y="${y}" style="font-size: 14px; fill: ${colors.text}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">${skill}</text>`;
  });

  const svg = `<svg width="800" height="160" viewBox="0 0 800 160" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        .title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; fill: ${colors.text}; }
      </style>
    </defs>
    
    <text x="30" y="35" class="title">Tech Stack</text>
    <line x1="30" y1="45" x2="770" y2="45" stroke="${colors.textMuted}" stroke-width="0.5"/>
    
    ${skillElements}
  </svg>`;

  return svg;
}

// Create Top Repositories Card
function createTopReposCard(repos) {
  const topRepos = repos
    .filter(repo => !repo.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 5);

  let repoElements = '';
  topRepos.forEach((repo, index) => {
    const y = 70 + (index * 30);
    const stars = repo.stargazers_count;
    
    repoElements += `
    <text x="30" y="${y}" style="font-size: 14px; font-weight: 600; fill: ${colors.accent}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">${repo.name}</text>
    <text x="400" y="${y}" style="font-size: 13px; fill: ${colors.textMuted}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">${stars} stars</text>
    `;
  });

  const svg = `<svg width="800" height="200" viewBox="0 0 800 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        .title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; fill: ${colors.text}; }
      </style>
    </defs>
    
    <text x="30" y="35" class="title">Top Repositories</text>
    <line x1="30" y1="45" x2="770" y2="45" stroke="${colors.textMuted}" stroke-width="0.5"/>
    
    ${repoElements}
  </svg>`;

  return svg;
}

// Create Language Stats Card
function createLanguageCard(repos) {
  const languages = {};
  repos.forEach(repo => {
    if (repo.language) {
      languages[repo.language] = (languages[repo.language] || 0) + 1;
    }
  });

  const sortedLanguages = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const total = sortedLanguages.reduce((sum, [, count]) => sum + count, 0);

  let langElements = '';
  let yOffset = 70;
  sortedLanguages.forEach(([lang, count]) => {
    const percentage = ((count / total) * 100).toFixed(1);
    const barWidth = (percentage / 100) * 500;
    
    langElements += `
    <text x="30" y="${yOffset}" style="font-size: 13px; fill: ${colors.text}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">${lang}</text>
    <rect x="150" y="${yOffset - 10}" width="500" height="8" rx="4" fill="${colors.textMuted}" opacity="0.2"/>
    <rect x="150" y="${yOffset - 10}" width="${barWidth}" height="8" rx="4" fill="${colors.accent}"/>
    <text x="660" y="${yOffset}" style="font-size: 12px; fill: ${colors.textMuted}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">${percentage}%</text>
    `;
    yOffset += 35;
  });

  const svg = `<svg width="800" height="${yOffset + 20}" viewBox="0 0 800 ${yOffset + 20}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        .title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; fill: ${colors.text}; }
      </style>
    </defs>
    
    <text x="30" y="35" class="title">Most Used Languages</text>
    <line x1="30" y1="45" x2="770" y2="45" stroke="${colors.textMuted}" stroke-width="0.5"/>
    
    ${langElements}
  </svg>`;

  return svg;
}

// Generate all SVGs
async function generateSVGs() {
  try {
    const username = 'smallghost42';
    console.log(`Fetching data for ${username}...`);
    
    const userData = await fetchGitHubData(username);
    const repos = await fetchGitHubRepos(username);
    
    console.log(`✓ Fetched data: ${repos.length} repositories`);

    const outputDir = path.join(__dirname, '..', 'assets');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate Profile Card
    const profileCard = createProfileCard(userData);
    fs.writeFileSync(path.join(outputDir, 'profile-card.svg'), profileCard);
    console.log('✓ Generated profile-card.svg');

    // Generate Stats Card
    const statsCard = createStatsCard(userData, repos);
    fs.writeFileSync(path.join(outputDir, 'stats-card.svg'), statsCard);
    console.log('✓ Generated stats-card.svg');

    // Generate Skills Card
    const skillsCard = createSkillsCard();
    fs.writeFileSync(path.join(outputDir, 'skills-card.svg'), skillsCard);
    console.log('✓ Generated skills-card.svg');

    // Generate Top Repos Card
    const topReposCard = createTopReposCard(repos);
    fs.writeFileSync(path.join(outputDir, 'top-repos.svg'), topReposCard);
    console.log('✓ Generated top-repos.svg');

    // Generate Language Stats Card
    const languageCard = createLanguageCard(repos);
    fs.writeFileSync(path.join(outputDir, 'languages.svg'), languageCard);
    console.log('✓ Generated languages.svg');

    console.log('\n✅ All SVG cards generated successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

generateSVGs();
