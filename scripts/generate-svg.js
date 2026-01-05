#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

// GitHub-inspired color scheme
const colors = {
  bg: '#0d1117',
  bgSecondary: '#161b22',
  border: '#30363d',
  text: '#c9d1d9',
  textMuted: '#8b949e',
  accent: '#58a6ff',
  green: '#3fb950',
  orange: '#d29922',
  red: '#f85149',
  purple: '#a371f7',
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
  const bio = userData.bio || 'Software Developer • Computer Science';
  const location = userData.location || '';
  const followers = userData.followers || 0;
  const following = userData.following || 0;

  const svg = `<svg width="800" height="200" viewBox="0 0 800 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        .bg { fill: ${colors.bg}; }
        .bg-secondary { fill: ${colors.bgSecondary}; }
        .border { stroke: ${colors.border}; stroke-width: 1; fill: none; }
        .title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 28px; font-weight: 600; fill: ${colors.text}; }
        .subtitle { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; fill: ${colors.textMuted}; }
        .accent-text { fill: ${colors.accent}; font-weight: 600; }
        .stat-value { font-size: 20px; font-weight: 600; fill: ${colors.text}; }
      </style>
    </defs>
    
    <!-- Background with gradient effect -->
    <rect class="bg" width="800" height="200" rx="6"/>
    <rect class="border" x="0.5" y="0.5" width="799" height="199" rx="6"/>
    
    <!-- Avatar placeholder circle -->
    <circle cx="60" cy="100" r="40" fill="${colors.accent}" opacity="0.2"/>
    <circle cx="60" cy="100" r="40" class="border" stroke-width="2"/>
    
    <!-- Profile info -->
    <text x="120" y="75" class="title">${name}</text>
    <text x="120" y="100" class="subtitle">${bio}</text>
    ${location ? `<text x="120" y="125" class="subtitle">📍 ${location}</text>` : ''}
    
    <!-- Stats boxes -->
    <rect x="500" y="40" width="120" height="50" rx="6" class="bg-secondary"/>
    <text x="560" y="62" class="stat-value" text-anchor="middle">${followers}</text>
    <text x="560" y="80" class="subtitle" text-anchor="middle">Followers</text>
    
    <rect x="640" y="40" width="120" height="50" rx="6" class="bg-secondary"/>
    <text x="700" y="62" class="stat-value" text-anchor="middle">${following}</text>
    <text x="700" y="80" class="subtitle" text-anchor="middle">Following</text>
    
    <!-- Bottom info -->
    <text x="120" y="165" class="subtitle">
      <tspan class="accent-text">→</tspan> Passionate about clean code &amp; open source
    </text>
    <text x="120" y="185" class="subtitle" font-size="12">github.com/${userData.login}</text>
  </svg>`;

  return svg;
}

// Create Stats Card SVG
function createStatsCard(userData, repos) {
  const totalStars = repos.reduce((acc, repo) => acc + repo.stargazers_count, 0);
  const totalForks = repos.reduce((acc, repo) => acc + repo.forks_count, 0);
  const publicRepos = userData.public_repos || 0;

  const svg = `<svg width="800" height="180" viewBox="0 0 800 180" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        .bg { fill: ${colors.bg}; }
        .bg-secondary { fill: ${colors.bgSecondary}; }
        .border { stroke: ${colors.border}; stroke-width: 1; fill: none; }
        .title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; fill: ${colors.text}; }
        .stat-label { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 12px; fill: ${colors.textMuted}; }
        .stat-value { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 700; fill: ${colors.accent}; }
        .divider { stroke: ${colors.border}; stroke-width: 1; }
        .icon { fill: ${colors.accent}; }
      </style>
    </defs>
    
    <!-- Background -->
    <rect class="bg" width="800" height="180" rx="6"/>
    <rect class="border" x="0.5" y="0.5" width="799" height="179" rx="6"/>
    
    <!-- Title -->
    <text x="30" y="35" class="title">📊 GitHub Statistics</text>
    <line class="divider" x1="30" y1="45" x2="770" y2="45"/>
    
    <!-- Stats Grid -->
    <!-- Public Repos -->
    <rect x="30" y="65" width="170" height="90" rx="6" class="bg-secondary"/>
    <text x="115" y="110" class="stat-value" text-anchor="middle">${publicRepos}</text>
    <text x="115" y="135" class="stat-label" text-anchor="middle">📦 Public Repos</text>
    
    <!-- Total Stars -->
    <rect x="220" y="65" width="170" height="90" rx="6" class="bg-secondary"/>
    <text x="305" y="110" class="stat-value" text-anchor="middle">${totalStars}</text>
    <text x="305" y="135" class="stat-label" text-anchor="middle">⭐ Total Stars</text>
    
    <!-- Total Forks -->
    <rect x="410" y="65" width="170" height="90" rx="6" class="bg-secondary"/>
    <text x="495" y="110" class="stat-value" text-anchor="middle">${totalForks}</text>
    <text x="495" y="135" class="stat-label" text-anchor="middle">🔱 Total Forks</text>
    
    <!-- Followers -->
    <rect x="600" y="65" width="170" height="90" rx="6" class="bg-secondary"/>
    <text x="685" y="110" class="stat-value" text-anchor="middle">${userData.followers}</text>
    <text x="685" y="135" class="stat-label" text-anchor="middle">👥 Followers</text>
  </svg>`;

  return svg;
}

// Create Skills Card SVG
function createSkillsCard() {
  const svg = `<svg width="800" height="280" viewBox="0 0 800 280" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        .bg { fill: ${colors.bg}; }
        .bg-secondary { fill: ${colors.bgSecondary}; }
        .border { stroke: ${colors.border}; stroke-width: 1; fill: none; }
        .title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; fill: ${colors.text}; }
        .section-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; fill: ${colors.textMuted}; }
        .skill-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 12px; fill: ${colors.text}; }
        .divider { stroke: ${colors.border}; stroke-width: 1; }
      </style>
    </defs>
    
    <!-- Background -->
    <rect class="bg" width="800" height="280" rx="6"/>
    <rect class="border" x="0.5" y="0.5" width="799" height="279" rx="6"/>
    
    <!-- Title -->
    <text x="30" y="35" class="title">💻 Tech Stack</text>
    <line class="divider" x1="30" y1="45" x2="770" y2="45"/>
    
    <!-- Frontend Section -->
    <text x="40" y="75" class="section-title">Frontend</text>
    <rect x="40" y="85" width="100" height="32" rx="6" class="bg-secondary"/>
    <text x="90" y="107" class="skill-text" text-anchor="middle">React</text>
    
    <rect x="150" y="85" width="100" height="32" rx="6" class="bg-secondary"/>
    <text x="200" y="107" class="skill-text" text-anchor="middle">TypeScript</text>
    
    <rect x="260" y="85" width="100" height="32" rx="6" class="bg-secondary"/>
    <text x="310" y="107" class="skill-text" text-anchor="middle">JavaScript</text>
    
    <rect x="370" y="85" width="120" height="32" rx="6" class="bg-secondary"/>
    <text x="430" y="107" class="skill-text" text-anchor="middle">Tailwind CSS</text>
    
    <rect x="500" y="85" width="100" height="32" rx="6" class="bg-secondary"/>
    <text x="550" y="107" class="skill-text" text-anchor="middle">Next.js</text>
    
    <rect x="610" y="85" width="80" height="32" rx="6" class="bg-secondary"/>
    <text x="650" y="107" class="skill-text" text-anchor="middle">HTML5</text>
    
    <rect x="700" y="85" width="70" height="32" rx="6" class="bg-secondary"/>
    <text x="735" y="107" class="skill-text" text-anchor="middle">CSS3</text>
    
    <!-- Backend Section -->
    <text x="40" y="155" class="section-title">Backend</text>
    <rect x="40" y="165" width="70" height="32" rx="6" class="bg-secondary"/>
    <text x="75" y="187" class="skill-text" text-anchor="middle">C</text>
    
    <rect x="120" y="165" width="70" height="32" rx="6" class="bg-secondary"/>
    <text x="155" y="187" class="skill-text" text-anchor="middle">C++</text>
    
    <rect x="200" y="165" width="80" height="32" rx="6" class="bg-secondary"/>
    <text x="240" y="187" class="skill-text" text-anchor="middle">Go</text>
    
    <rect x="290" y="165" width="90" height="32" rx="6" class="bg-secondary"/>
    <text x="335" y="187" class="skill-text" text-anchor="middle">Python</text>
    
    <rect x="390" y="165" width="90" height="32" rx="6" class="bg-secondary"/>
    <text x="435" y="187" class="skill-text" text-anchor="middle">Node.js</text>
    
    <rect x="490" y="165" width="110" height="32" rx="6" class="bg-secondary"/>
    <text x="545" y="187" class="skill-text" text-anchor="middle">PostgreSQL</text>
    
    <rect x="610" y="165" width="100" height="32" rx="6" class="bg-secondary"/>
    <text x="660" y="187" class="skill-text" text-anchor="middle">MongoDB</text>
    
    <!-- DevOps Section -->
    <text x="40" y="235" class="section-title">DevOps &amp; Cloud</text>
    <rect x="40" y="245" width="70" height="32" rx="6" class="bg-secondary"/>
    <text x="75" y="267" class="skill-text" text-anchor="middle">Git</text>
    
    <rect x="120" y="245" width="80" height="32" rx="6" class="bg-secondary"/>
    <text x="160" y="267" class="skill-text" text-anchor="middle">GitHub</text>
    
    <rect x="210" y="245" width="80" height="32" rx="6" class="bg-secondary"/>
    <text x="250" y="267" class="skill-text" text-anchor="middle">Docker</text>
    
    <rect x="300" y="245" width="80" height="32" rx="6" class="bg-secondary"/>
    <text x="340" y="267" class="skill-text" text-anchor="middle">Nginx</text>
    
    <rect x="390" y="245" width="110" height="32" rx="6" class="bg-secondary"/>
    <text x="445" y="267" class="skill-text" text-anchor="middle">Kubernetes</text>
    
    <rect x="510" y="245" width="70" height="32" rx="6" class="bg-secondary"/>
    <text x="545" y="267" class="skill-text" text-anchor="middle">AWS</text>
    
    <rect x="590" y="245" width="80" height="32" rx="6" class="bg-secondary"/>
    <text x="630" y="267" class="skill-text" text-anchor="middle">Linux</text>
  </svg>`;

  return svg;
}

// Create Top Repositories Card
function createTopReposCard(repos) {
  const topRepos = repos
    .filter(repo => !repo.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 6);

  let repoElements = '';
  topRepos.forEach((repo, index) => {
    const y = 70 + (index * 35);
    const language = repo.language || 'Unknown';
    const stars = repo.stargazers_count;
    const forks = repo.forks_count;
    
    repoElements += `
    <rect x="30" y="${y}" width="740" height="30" rx="4" class="bg-secondary"/>
    <text x="40" y="${y + 20}" class="repo-name">${repo.name}</text>
    <text x="400" y="${y + 20}" class="stat-text">⭐ ${stars}</text>
    <text x="480" y="${y + 20}" class="stat-text">🔱 ${forks}</text>
    <text x="560" y="${y + 20}" class="lang-text">${language}</text>
    `;
  });

  const svg = `<svg width="800" height="280" viewBox="0 0 800 280" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        .bg { fill: ${colors.bg}; }
        .bg-secondary { fill: ${colors.bgSecondary}; }
        .border { stroke: ${colors.border}; stroke-width: 1; fill: none; }
        .title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; fill: ${colors.text}; }
        .repo-name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; fill: ${colors.accent}; }
        .stat-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 12px; fill: ${colors.textMuted}; }
        .lang-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 11px; fill: ${colors.green}; }
        .divider { stroke: ${colors.border}; stroke-width: 1; }
      </style>
    </defs>
    
    <!-- Background -->
    <rect class="bg" width="800" height="280" rx="6"/>
    <rect class="border" x="0.5" y="0.5" width="799" height="279" rx="6"/>
    
    <!-- Title -->
    <text x="30" y="35" class="title">🏆 Top Repositories</text>
    <line class="divider" x1="30" y1="45" x2="770" y2="45"/>
    
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
    .slice(0, 8);

  const total = sortedLanguages.reduce((sum, [, count]) => sum + count, 0);

  let langElements = '';
  let yOffset = 70;
  sortedLanguages.forEach(([lang, count]) => {
    const percentage = ((count / total) * 100).toFixed(1);
    const barWidth = (percentage / 100) * 600;
    
    langElements += `
    <text x="40" y="${yOffset}" class="lang-label">${lang}</text>
    <rect x="150" y="${yOffset - 12}" width="600" height="16" rx="8" class="bar-bg"/>
    <rect x="150" y="${yOffset - 12}" width="${barWidth}" height="16" rx="8" class="bar-fill"/>
    <text x="760" y="${yOffset}" class="percentage-text">${percentage}%</text>
    `;
    yOffset += 30;
  });

  const svg = `<svg width="800" height="${yOffset + 20}" viewBox="0 0 800 ${yOffset + 20}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        .bg { fill: ${colors.bg}; }
        .border { stroke: ${colors.border}; stroke-width: 1; fill: none; }
        .title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; fill: ${colors.text}; }
        .lang-label { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 13px; fill: ${colors.text}; }
        .percentage-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 12px; fill: ${colors.textMuted}; font-weight: 600; }
        .bar-bg { fill: ${colors.bgSecondary}; }
        .bar-fill { fill: ${colors.accent}; }
        .divider { stroke: ${colors.border}; stroke-width: 1; }
      </style>
    </defs>
    
    <!-- Background -->
    <rect class="bg" width="800" height="${yOffset + 20}" rx="6"/>
    <rect class="border" x="0.5" y="0.5" width="799" height="${yOffset + 19}" rx="6"/>
    
    <!-- Title -->
    <text x="30" y="35" class="title">📈 Most Used Languages</text>
    <line class="divider" x1="30" y1="45" x2="770" y2="45"/>
    
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
