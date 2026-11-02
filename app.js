const searchForm = document.getElementById("searchForm");
const usernameInput = document.getElementById("username");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const card = document.getElementById("card");

// Listen for form submit
searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  if (!username) return;

  // Show loading indicator
  loading.style.display = "block";
  errorBox.style.display = "none";
  card.style.display = "none";

  try {
    // Fetch profile, repos, and events in parallel
    const [profile, repos, events] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`).then(checkStatus),
      fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`).then(checkStatus),
      fetch(`https://api.github.com/users/${username}/events/public?per_page=5`).then(checkStatus)
    ]);

    renderProfile(profile);
    renderLanguages(repos);
    renderRepos(repos);
    renderActivity(events);

    card.style.display = "block";
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.style.display = "block";
  } finally {
    loading.style.display = "none";
  }
});

// Check HTTP response
async function checkStatus(res) {
  if (res.status === 404) throw new Error("GitHub user not found");
  if (res.status === 403) throw new Error("GitHub rate limit reached. Please wait a few minutes.");
  if (!res.ok) throw new Error("Failed to fetch data from GitHub");
  return res.json();
}

// Render profile header details
function renderProfile(user) {
  document.getElementById("avatar").src = user.avatar_url;
  document.getElementById("name").textContent = user.name || user.login;
  
  const link = document.getElementById("profileLink");
  link.href = user.html_url;
  link.textContent = `@${user.login}`;

  document.getElementById("bio").textContent = user.bio || "No bio available";
  document.getElementById("reposCount").textContent = user.public_repos;
  document.getElementById("followersCount").textContent = user.followers;
  document.getElementById("followingCount").textContent = user.following;
}

// Calculate and render top languages
function renderLanguages(repos) {
  const container = document.getElementById("languages");
  const counts = {};
  let total = 0;

  repos.forEach((r) => {
    if (r.language) {
      counts[r.language] = (counts[r.language] || 0) + 1;
      total++;
    }
  });

  if (total === 0) {
    container.innerHTML = "<span>No language data found</span>";
    return;
  }

  const top = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang, count]) => {
      const pct = Math.round((count / total) * 100);
      return `<span class="lang-badge">${lang} (${pct}%)</span>`;
    });

  container.innerHTML = top.join("");
}

// Render top 4 repositories by stars
function renderRepos(repos) {
  const container = document.getElementById("repos");
  const list = repos
    .filter((r) => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 4);

  if (list.length === 0) {
    container.innerHTML = "<p>No repositories found</p>";
    return;
  }

  container.innerHTML = list.map((r) => `
    <div class="repo-item">
      <div>
        <a href="${r.html_url}" target="_blank" rel="noopener noreferrer">${r.name}</a>
        <p>${r.description || "No description provided"}</p>
      </div>
      <div class="repo-meta">
        <span>${r.language || "Code"}</span>
        <span>⭐ ${r.stargazers_count}</span>
      </div>
    </div>
  `).join("");
}

// Render recent 5 public activities
function renderActivity(events) {
  const container = document.getElementById("activity");
  if (!events || events.length === 0) {
    container.innerHTML = "<li>No recent public activity</li>";
    return;
  }

  container.innerHTML = events.map((e) => {
    const repo = e.repo ? e.repo.name : "repository";
    let text = `Active on ${repo}`;

    if (e.type === "PushEvent") {
      const commits = e.payload && e.payload.commits ? e.payload.commits.length : 1;
      text = `Pushed ${commits} commit(s) to ${repo}`;
    } else if (e.type === "PullRequestEvent") {
      text = `${capitalize(e.payload?.action || "updated")} PR in ${repo}`;
    } else if (e.type === "WatchEvent") {
      text = `Starred ${repo}`;
    } else if (e.type === "IssuesEvent") {
      text = `${capitalize(e.payload?.action || "opened")} issue in ${repo}`;
    }

    const date = new Date(e.created_at).toLocaleDateString();
    return `<li><span>${text}</span><span class="activity-time">${date}</span></li>`;
  }).join("");
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
