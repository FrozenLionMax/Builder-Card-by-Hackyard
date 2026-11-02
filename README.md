# GitHub Builder Card

A simple, lightweight web app to view a GitHub developer's profile card with top repositories, main languages, and recent activity.

---

## 🚀 Live Demo

- **Website:** https://frozenlionmax.github.io/Builder-Card-by-Hackyard/

---

## 🛠️ Tech Stack

- **HTML5:** Semantic markup
- **CSS3:** Clean dark mode styling, responsive grid
- **JavaScript (ES6):** Fetch API, async/await, Promise.all

---

## 📁 Project Structure

```text
├── index.html    # Simple search form and card layout
├── style.css     # Clean developer dark theme
├── app.js        # Core logic: fetching GitHub data, calculating languages, rendering
└── README.md
```

---

## 💻 How It Works

1. **User input:** Enter any GitHub username (e.g. `FrozenLionMax`, `torvalds`).
2. **Parallel Fetching:** We use `Promise.all` to fetch the user profile, repositories, and public activity simultaneously from the GitHub REST API.
3. **Language Calculation:** Aggregates primary languages across repositories into frequency percentages.
4. **Top Repositories:** Filters out forks and sorts repositories by star count.
5. **Recent Activity:** Formats recent public events (commits, PRs, stars) into human-readable text.

---

## 🎙️ Call Walkthrough Cheat Sheet

- **Why Vanilla JS?** Keep it fast, simple, and zero-dependency without unnecessary framework overhead.
- **Handling API limits:** Languages are calculated directly from repository metadata instead of making multiple API calls per repo.
- **Error Handling:** Explicit status checks for 404 (user not found) and 403 (rate limit).
