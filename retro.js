const STORAGE = {
  guestbook: "fw2000_guestbook",
  poll: "fw2000_poll",
};

const VISITOR_COUNTER_URL = "https://tally.yuki.sh/hits/fish-world-2000/site.json";

const DEFAULT_GUESTBOOK = [
  {
    name: "CoolFishDude42",
    email: "",
    message: "this site rocks!!! fish are the best animals after dinosaurs",
    date: "2000-06-15T14:22:01",
  },
  {
    name: "AquaGirl",
    email: "",
    message: "i have 3 goldfish named Larry Larry and Other Larry",
    date: "2000-06-18T09:01:44",
  },
  {
    name: "WebMaster Rick",
    email: "",
    message: "nice page. consider joining my webring.",
    date: "2000-06-22T22:09:13",
  },
];

const FISH_OF_THE_DAY = [
  { name: "Neon Tetra", fact: "Glows like a underwater rave light.", rating: "*****" },
  { name: "Hammerhead Shark", fact: "Head shaped like a tool. Very practical fish.", rating: "****o" },
  { name: "Seahorse", fact: "The only fish that looks like a tiny horse.", rating: "*****" },
  { name: "Catfish", fact: "Has whiskers. Probably knows secrets.", rating: "****o" },
  { name: "Swordfish", fact: "Comes with its own weapon. Do not challenge.", rating: "*****" },
  { name: "Pufferfish", fact: "Round when stressed. Same energy as finals week.", rating: "*****" },
  { name: "Koi", fact: "Fancy pond fish. Lives in luxury.", rating: "****o" },
];

const MODEM_MESSAGES = [
  "Modem squeal detected...",
  "Buffering fish.gif...",
  "Downloading more bubbles...",
  "Syncing with ocean server...",
  "Handshaking with ISP...",
  "Loading guestbook.cgi...",
  "Optimizing fish cache...",
];

function updateRetroClock() {
  document.querySelectorAll("[data-retro-clock]").forEach((el) => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    el.textContent = `${hours}:${minutes}:${seconds}`;
  });
}

async function initVisitorCounter() {
  const digitsEls = document.querySelectorAll("[data-visitor-digits]");
  const labelEls = document.querySelectorAll("[data-visitor-label]");
  if (!digitsEls.length && !labelEls.length) return;

  digitsEls.forEach((el) => {
    el.textContent = "LOADING..";
  });
  labelEls.forEach((el) => {
    el.textContent = "Connecting to hit counter server...";
  });

  try {
    const response = await fetch(VISITOR_COUNTER_URL, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Counter request failed");
    }

    const data = await response.json();
    const visits = Number(data.visit) || 0;
    const visitors = Number(data.visitor) || visits;

    digitsEls.forEach((el) => {
      el.textContent = String(visits).padStart(9, "0");
    });

    labelEls.forEach((el) => {
      el.textContent = `Total visits: ${visits.toLocaleString()} · Unique visitors: ${visitors.toLocaleString()}!!!`;
    });
  } catch {
    digitsEls.forEach((el) => {
      el.textContent = "OFFLINE  ";
    });
    labelEls.forEach((el) => {
      el.textContent = "Hit counter offline. Refresh to try again!!!";
    });
  }
}

function getGuestbookEntries() {
  const raw = localStorage.getItem(STORAGE.guestbook);
  if (!raw) {
    localStorage.setItem(STORAGE.guestbook, JSON.stringify(DEFAULT_GUESTBOOK));
    return [...DEFAULT_GUESTBOOK];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...DEFAULT_GUESTBOOK];
  } catch {
    return [...DEFAULT_GUESTBOOK];
  }
}

function saveGuestbookEntries(entries) {
  localStorage.setItem(STORAGE.guestbook, JSON.stringify(entries));
}

function formatGuestDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "06/??/2000";

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return {
    short: `${month}/${day}/${year}`,
    log: `[${year}-${month}-${day} ${hours}:${minutes}:${seconds}]`,
  };
}

function renderGuestbook() {
  const container = document.getElementById("guestbook-entries");
  if (!container) return;

  const entries = getGuestbookEntries().slice().reverse();
  container.innerHTML = entries
    .map((entry) => {
      const formatted = formatGuestDate(entry.date);
      const logLine = typeof formatted === "string" ? formatted : formatted.log;
      const shortDate = typeof formatted === "string" ? formatted : formatted.short;

      return `
        <div class="guest-entry">
          <pre class="ascii-art small guest-log">${logLine} USER=${escapeHtml(entry.name)}</pre>
          <strong>${escapeHtml(entry.name)}</strong> wrote on ${shortDate}:<br>
          ${escapeHtml(entry.message)}
        </div>
      `;
    })
    .join("");

  updateMessageCount();
}

function initGuestbookForm() {
  const form = document.getElementById("guestbook-form");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = form.querySelector("#name")?.value.trim();
    const email = form.querySelector("#email")?.value.trim();
    const message = form.querySelector("#message")?.value.trim();

    if (!name || !message) {
      showRetroAlert("Please enter your name and a fish message!!!");
      return;
    }

    const entries = getGuestbookEntries();
    entries.push({
      name,
      email: email || "",
      message,
      date: new Date().toISOString(),
    });
    saveGuestbookEntries(entries);
    form.reset();
    renderGuestbook();
    showRetroAlert("Thanks!!! Your fish message has been saved to the ocean server.");
  });
}

function initPoll() {
  const form = document.getElementById("fish-poll");
  const results = document.getElementById("poll-results");
  if (!form || !results) return;

  const options = ["Goldfish", "Shark", "Clownfish", "Blobfish", "Other"];

  function getVotes() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE.poll) || "{}");
    } catch {
      return {};
    }
  }

  function saveVotes(votes) {
    localStorage.setItem(STORAGE.poll, JSON.stringify(votes));
  }

  function renderResults() {
    const votes = getVotes();
    const total = options.reduce((sum, option) => sum + (votes[option] || 0), 0);

    results.innerHTML = options
      .map((option) => {
        const count = votes[option] || 0;
        const percent = total ? Math.round((count / total) * 100) : 0;
        const bar = "#".repeat(Math.max(1, Math.round(percent / 5)));

        return `
          <div class="poll-result-row">
            <span class="poll-label">${option}</span>
            <span class="poll-bar">${bar}</span>
            <span class="poll-percent">${percent}% (${count})</span>
          </div>
        `;
      })
      .join("");

    results.hidden = total === 0;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const selected = form.querySelector('input[name="favorite-fish"]:checked');
    if (!selected) {
      showRetroAlert("Pick a fish first!!!");
      return;
    }

    const votes = getVotes();
    votes[selected.value] = (votes[selected.value] || 0) + 1;
    saveVotes(votes);
    renderResults();
    showRetroAlert(`You voted for ${selected.value}!!! Thanks!!!`);
  });

  renderResults();
}

function initFishOfTheDay() {
  const nameEl = document.getElementById("fish-of-day-name");
  const factEl = document.getElementById("fish-of-day-fact");
  const ratingEl = document.getElementById("fish-of-day-rating");
  if (!nameEl || !factEl || !ratingEl) return;

  const dayIndex = Math.floor(Date.now() / 86400000) % FISH_OF_THE_DAY.length;
  const fish = FISH_OF_THE_DAY[dayIndex];
  nameEl.textContent = fish.name;
  factEl.textContent = fish.fact;
  ratingEl.textContent = fish.rating;
}

function initGalleryZoom() {
  document.querySelectorAll("[data-gallery-item]").forEach((item) => {
    item.addEventListener("click", () => {
      item.classList.toggle("zoomed");
    });
  });
}

function initNavHighlight() {
  const page = document.body.dataset.page;
  if (!page) return;

  document.querySelectorAll(`[data-nav="${page}"]`).forEach((link) => {
    link.classList.add("nav-current");
  });
}

function initModemTicker() {
  const el = document.querySelector("[data-modem-status]");
  if (!el) return;

  let index = 0;
  setInterval(() => {
    index = (index + 1) % MODEM_MESSAGES.length;
    el.textContent = MODEM_MESSAGES[index];
  }, 4000);
}

function updateMessageCount() {
  const el = document.querySelector("[data-message-count]");
  if (!el) return;

  const count = getGuestbookEntries().length;
  el.textContent = `Messages: ${count}`;
}

function initQuiz() {
  const form = document.getElementById("fish-quiz");
  const result = document.getElementById("quiz-result");
  if (!form || !result) return;

  const answers = {
    q1: "gills",
    q2: "clownfish",
    q3: "shark",
    q4: "goldfish",
    q5: "blobfish",
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    let score = 0;
    Object.keys(answers).forEach((key) => {
      const selected = form.querySelector(`input[name="${key}"]:checked`);
      if (selected && selected.value === answers[key]) score += 1;
    });

    const messages = [
      "Keep studying the ocean!!!",
      "Not bad for a land creature.",
      "Pretty fish-smart!!!",
      "Almost a marine biologist!!!",
      "FISH MASTER 2000 CERTIFIED!!!",
    ];

    result.hidden = false;
    result.innerHTML = `
      <pre class="ascii-art small gold"> SCORE: ${score} / 5
 ${messages[score]}</pre>
      <p><span class="blink">NEW HIGH SCORE???</span> Tell your friends on AIM!!!</p>
    `;
  });
}

function showRetroAlert(message) {
  window.alert(message);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function initSite() {
  updateRetroClock();
  setInterval(updateRetroClock, 1000);
  initVisitorCounter();
  initGuestbookForm();
  renderGuestbook();
  initPoll();
  initFishOfTheDay();
  initGalleryZoom();
  initNavHighlight();
  initModemTicker();
  initQuiz();
  updateMessageCount();
}

document.addEventListener("DOMContentLoaded", initSite);
