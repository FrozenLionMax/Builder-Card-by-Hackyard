/**
 * =========================================================================
 * BUILDER CARD — CORE APPLICATION JAVASCRIPT
 * =========================================================================
 * Designed to be clean, modular, and easy to explain line-by-line on an interview call.
 * Uses modern ES6+ features: async/await, Promise.all, template literals, and DOM manipulation.
 */

// -------------------------------------------------------------------------
// 1. DOM ELEMENT REFERENCES
// Grab elements once so we can easily update them throughout the script.
// -------------------------------------------------------------------------
const searchForm = document.getElementById("searchForm");
const usernameInput = document.getElementById("usernameInput");
const clearBtn = document.getElementById("clearBtn");
const searchBtn = document.getElementById("searchBtn");
const retryBtn = document.getElementById("retryBtn");

// State views
const idleState = document.getElementById("idleState");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const errorMessage = document.getElementById("errorMessage");
const errorTitle = document.getElementById("errorTitle");
const builderCard = document.getElementById("builderCard");

// Profile elements
const profileAvatar = document.getElementById("profileAvatar");
const profileName = document.getElementById("profileName");
const profileHandle = document.getElementById("profileHandle");
const profileBio = document.getElementById("profileBio");
const githubLink = document.getElementById("githubLink");
const metaLocation = document.getElementById("metaLocation");
const locationText = document.getElementById("locationText");
const metaWebsite = document.getElementById("metaWebsite");
const websiteLink = document.getElementById("websiteLink");
const joinedText = document.getElementById("joinedText");

// Stat metrics
const statRepos = document.getElementById("statRepos");
const statFollowers = document.getElementById("statFollowers");
const statFollowing = document.getElementById("statFollowing");

// Dynamic sections
const languageBar = document.getElementById("languageBar");
const languageList = document.getElementById("languageList");
const reposGrid = document.getElementById("reposGrid");
const activityList = document.getElementById("activityList");

// Action buttons & toast
const copyLinkBtn = document.getElementById("copyLinkBtn");
const printBtn = document.getElementById("printBtn");
const toast = document.getElementById("toast");

// -------------------------------------------------------------------------
// 2. GITHUB LANGUAGE COLOR PALETTE
// Maps common programming languages to their official GitHub color hex codes.
// -------------------------------------------------------------------------
const LANGUAGE_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Vue: "#41b883",
  React: "#61dafb",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  PHP: "#4F5D95",
  Ruby: "#701516",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Shell: "#89e051",
  Svelte: "#ff3e00",
  Elixir: "#6e4a7e",
  Scala: "#c22d40",
  Solidity: "#aa6746",
  Default: "#8b949e"
};

// -------------------------------------------------------------------------
// 3. MAIN CONTROLLER FUNCTION: loadBuilderCard
// Fetches profile, repositories, and activity in parallel using Promise.all.
// -------------------------------------------------------------------------
async function loadBuilderCard(rawUsername) {
  const username = rawUsername.trim();
  if (!username) return;

  // Show loading indicator, hide errors and previous card
  showState("loading");

  try {
    // Parallel fetching for maximum speed and sub-second response
    const [profile, repos, events] = await Promise.all([
      fetchGitHubAPI(`https://api.github.com/users/${username}`),
      fetchGitHubAPI(`https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`),
      fetchGitHubAPI(`https://api.github.com/users/${username}/events/public?per_page=10`)
    ]);

    // Render each section with the received data
    renderProfile(profile);
    renderLanguages(repos);
    renderTopRepos(repos);
    renderActivity(events);

    // Display the populated builder card
    showState("card");

    // Update browser URL query parameter (?user=username) without page reload
    const newUrl = `${window.location.pathname}?user=${encodeURIComponent(username)}`;
    window.history.pushState({ path: newUrl }, "", newUrl);

  } catch (error) {
    console.error("Builder Card Error:", error);
    showError(error.message);
  }
}

// -------------------------------------------------------------------------
// 4. API FETCH HELPER WITH ERROR HANDLING
// Handles HTTP 404 (Not Found), 403 (Rate Limit), and network failures cleanly.
// -------------------------------------------------------------------------
async function fetchGitHubAPI(url) {
  const response = await fetch(url);

  if (response.status === 404) {
    throw new Error("UserNotFound");
  }

  if (response.status === 403) {
    throw new Error("RateLimitExceeded");
  }

  if (!response.ok) {
    throw new Error(`GitHub API returned status ${response.status}`);
  }

  return response.json();
}

// -------------------------------------------------------------------------
// 5. RENDER FUNCTIONS (DOM UPDATES)
// -------------------------------------------------------------------------

/**
 * Renders the top profile details (avatar, name, bio, social meta, stats)
 */
function renderProfile(user) {
  profileAvatar.src = user.avatar_url;
  profileAvatar.alt = `${user.login}'s avatar`;

  profileName.textContent = user.name || user.login;
  profileHandle.textContent = `@${user.login}`;
  profileBio.textContent = user.bio || "No bio provided on GitHub.";
  githubLink.href = user.html_url;

  // Metrics counters (using number formatter like 1.2k)
  statRepos.textContent = formatNumber(user.public_repos);
  statFollowers.textContent = formatNumber(user.followers);
  statFollowing.textContent = formatNumber(user.following);

  // Location
  if (user.location) {
    locationText.textContent = user.location;
    metaLocation.style.display = "inline-flex";
  } else {
    metaLocation.style.display = "none";
  }

  // Website / Blog
  if (user.blog) {
    let cleanUrl = user.blog;
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }
    websiteLink.href = cleanUrl;
    try {
      websiteLink.textContent = new URL(cleanUrl).hostname;
    } catch {
      websiteLink.textContent = "Website";
    }
    metaWebsite.style.display = "inline-flex";
  } else {
    metaWebsite.style.display = "none";
  }

  // Member Since date
  if (user.created_at) {
    const joinDate = new Date(user.created_at);
    const formattedDate = joinDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    joinedText.textContent = `Joined ${formattedDate}`;
  }
}

/**
 * Aggregates and calculates language distribution across repositories.
 * Renders both a GitHub-style horizontal bar and individual percentage badges.
 */
function renderLanguages(repos) {
  languageBar.innerHTML = "";
  languageList.innerHTML = "";

  if (!Array.isArray(repos) || repos.length === 0) {
    languageList.innerHTML = `<span class="empty-activity">No public repositories found.</span>`;
    return;
  }

  // Count occurrences of each language
  const languageCounts = {};
  let totalWithLanguage = 0;

  repos.forEach((repo) => {
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
      totalWithLanguage++;
    }
  });

  if (totalWithLanguage === 0) {
    languageList.innerHTML = `<span class="empty-activity">No language metadata detected.</span>`;
    return;
  }

  // Sort languages by count descending and take the top 5
  const topLanguages = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => {
      const percentage = Math.round((count / totalWithLanguage) * 100);
      const color = LANGUAGE_COLORS[name] || LANGUAGE_COLORS.Default;
      return { name, count, percentage, color };
    });

  // Render horizontal bar segments
  topLanguages.forEach((lang) => {
    const segment = document.createElement("div");
    segment.className = "language-segment";
    segment.style.width = `${lang.percentage}%`;
    segment.style.backgroundColor = lang.color;
    segment.title = `${lang.name}: ${lang.percentage}%`;
    languageBar.appendChild(segment);
  });

  // Render language list pills
  topLanguages.forEach((lang) => {
    const item = document.createElement("div");
    item.className = "language-item";
    item.innerHTML = `
      <span class="lang-dot" style="background-color: ${lang.color}"></span>
      <span class="lang-name">${escapeHTML(lang.name)}</span>
      <span class="lang-percent">${lang.percentage}%</span>
    `;
    languageList.appendChild(item);
  });
}

/**
 * Selects top 4 repositories ranked by community stars.
 * Prioritizes original work over forks.
 */
function renderTopRepos(repos) {
  reposGrid.innerHTML = "";

  if (!Array.isArray(repos) || repos.length === 0) {
    reposGrid.innerHTML = `<p class="empty-activity" style="grid-column: 1 / -1;">No public repositories found.</p>`;
    return;
  }

  // Filter out forks if the user has non-forks, otherwise use all repos
  const nonForks = repos.filter((r) => !r.fork);
  const eligibleRepos = nonForks.length > 0 ? nonForks : repos;

  // Sort descending by stars
  const topRepos = [...eligibleRepos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 4);

  topRepos.forEach((repo) => {
    const langColor = LANGUAGE_COLORS[repo.language] || LANGUAGE_COLORS.Default;
    const repoCard = document.createElement("a");
    repoCard.className = "repo-card";
    repoCard.href = repo.html_url;
    repoCard.target = "_blank";
    repoCard.rel = "noopener noreferrer";

    repoCard.innerHTML = `
      <div class="repo-top">
        <h4 class="repo-title">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          ${escapeHTML(repo.name)}
        </h4>
        <p class="repo-desc">${escapeHTML(repo.description || "No description provided.")}</p>
      </div>
      <div class="repo-bottom">
        <span class="repo-lang">
          <span class="lang-dot" style="background-color: ${langColor};"></span>
          ${escapeHTML(repo.language || "Plain")}
        </span>
        <div class="repo-stats">
          <span class="stat-mini" title="Stars">⭐ ${formatNumber(repo.stargazers_count)}</span>
          <span class="stat-mini" title="Forks">🍴 ${formatNumber(repo.forks_count)}</span>
        </div>
      </div>
    `;

    reposGrid.appendChild(repoCard);
  });
}

/**
 * Formats and renders recent public GitHub events into human-readable actions.
 */
function renderActivity(events) {
  activityList.innerHTML = "";

  if (!Array.isArray(events) || events.length === 0) {
    activityList.innerHTML = `<li class="empty-activity">No recent public activity in the past 90 days.</li>`;
    return;
  }

  // Display top 5 recent events
  const recentEvents = events.slice(0, 5);

  recentEvents.forEach((event) => {
    const formatted = formatEventDescription(event);
    const timeAgo = formatTimeAgo(event.created_at);

    const li = document.createElement("li");
    li.className = "activity-item";
    li.innerHTML = `
      <div class="activity-icon">${formatted.icon}</div>
      <div class="activity-content">
        ${formatted.text}
      </div>
      <span class="activity-time">${timeAgo}</span>
    `;

    activityList.appendChild(li);
  });
}

// -------------------------------------------------------------------------
// 6. EVENT FORMATTING HELPER
// Converts GitHub's raw event types (PushEvent, PullRequestEvent, etc.) into plain text.
// -------------------------------------------------------------------------
function formatEventDescription(event) {
  const repoName = event.repo ? event.repo.name : "repository";
  const repoDisplay = `<strong>${escapeHTML(repoName)}</strong>`;

  switch (event.type) {
    case "PushEvent": {
      const count = event.payload && event.payload.commits ? event.payload.commits.length : 1;
      return {
        icon: "📦",
        text: `Pushed ${count} commit${count > 1 ? "s" : ""} to ${repoDisplay}`
      };
    }
    case "PullRequestEvent": {
      const action = event.payload ? event.payload.action : "updated";
      return {
        icon: "🔀",
        text: `${capitalize(action)} pull request in ${repoDisplay}`
      };
    }
    case "IssuesEvent": {
      const action = event.payload ? event.payload.action : "interacted with";
      return {
        icon: "🎯",
        text: `${capitalize(action)} issue in ${repoDisplay}`
      };
    }
    case "IssueCommentEvent": {
      return {
        icon: "💬",
        text: `Commented on issue in ${repoDisplay}`
      };
    }
    case "WatchEvent": {
      return {
        icon: "⭐",
        text: `Starred ${repoDisplay}`
      };
    }
    case "ForkEvent": {
      return {
        icon: "🍴",
        text: `Forked ${repoDisplay}`
      };
    }
    case "CreateEvent": {
      const refType = event.payload ? event.payload.ref_type : "repository";
      return {
        icon: "✨",
        text: `Created ${refType} in ${repoDisplay}`
      };
    }
    default:
      return {
        icon: "⚡",
        text: `Active on ${repoDisplay}`
      };
  }
}

// -------------------------------------------------------------------------
// 7. UTILITY HELPERS
// -------------------------------------------------------------------------

/**
 * Calculates a human-readable relative time string (e.g. "2h ago", "Yesterday")
 */
function formatTimeAgo(isoDateString) {
  const diffSeconds = Math.floor((Date.now() - new Date(isoDateString).getTime()) / 1000);

  if (diffSeconds < 60) return "just now";
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  if (diffSeconds < 172800) return "yesterday";
  if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 86400)}d ago`;
  if (diffSeconds < 31536000) return `${Math.floor(diffSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffSeconds / 31536000)}y ago`;
}

/**
 * Compacts large numbers into readable units (e.g. 1500 -> 1.5k)
 */
function formatNumber(num) {
  if (typeof num !== "number") return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
}

/**
 * Prevents Cross-Site Scripting (XSS) by escaping HTML characters
 */
function escapeHTML(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Toggles the visibility of State components (idle, loading, error, card)
 */
function showState(state) {
  idleState.style.display = state === "idle" ? "block" : "none";
  loadingState.style.display = state === "loading" ? "block" : "none";
  errorState.style.display = state === "error" ? "block" : "none";
  builderCard.style.display = state === "card" ? "block" : "none";
}

/**
 * Displays user-friendly error messages based on error type
 */
function showError(errorCode) {
  showState("error");

  if (errorCode === "UserNotFound") {
    errorTitle.textContent = "GitHub User Not Found";
    errorMessage.textContent = `We couldn't find a GitHub profile for "${usernameInput.value.trim()}". Please double check the username spelling.`;
  } else if (errorCode === "RateLimitExceeded") {
    errorTitle.textContent = "GitHub Rate Limit Reached";
    errorMessage.textContent = "GitHub permits up to 60 unauthenticated requests per hour. Please wait a few minutes before trying again.";
  } else {
    errorTitle.textContent = "Something went wrong";
    errorMessage.textContent = "Unable to fetch data from GitHub right now. Please check your internet connection and try again.";
  }
}

/**
 * Triggers a toast notification pop-up
 */
function showToast(message) {
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 2500);
}

// -------------------------------------------------------------------------
// 8. EVENT LISTENERS & INITIALIZATION
// -------------------------------------------------------------------------

// Form submission handler
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  loadBuilderCard(usernameInput.value);
});

// Clear input button visibility
usernameInput.addEventListener("input", () => {
  clearBtn.style.display = usernameInput.value ? "block" : "none";
});

clearBtn.addEventListener("click", () => {
  usernameInput.value = "";
  clearBtn.style.display = "none";
  usernameInput.focus();
});

retryBtn.addEventListener("click", () => {
  showState("idle");
  usernameInput.value = "";
  usernameInput.focus();
});

// Quick suggestion chip clicks
document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const handle = chip.dataset.user;
    usernameInput.value = handle;
    clearBtn.style.display = "block";
    loadBuilderCard(handle);
  });
});

// Copy shareable link button
copyLinkBtn.addEventListener("click", () => {
  const currentUrl = window.location.href;
  navigator.clipboard.writeText(currentUrl).then(() => {
    showToast("Shareable link copied to clipboard!");
  }).catch(() => {
    showToast("Failed to copy link.");
  });
});

// Print or Save as PDF button
printBtn.addEventListener("click", () => {
  window.print();
});

// Auto-load if ?user=username is provided in URL query string
window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const userParam = params.get("user");

  if (userParam) {
    usernameInput.value = userParam;
    clearBtn.style.display = "block";
    loadBuilderCard(userParam);
  } else {
    showState("idle");
  }
});
