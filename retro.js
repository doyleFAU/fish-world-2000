const STORAGE = {
  guestbook: "fw2000_guestbook",
  poll: "fw2000_poll",
};

const VISITOR_COUNTER_URL = "https://tally.yuki.sh/hits/fish-world-2000/site.json";

const LIMITS = {
  nameMax: 40,
  emailMax: 80,
  messageMax: 500,
  guestbookMaxEntries: 100,
  guestbookCooldownMs: 30000,
  pollVoteKey: "fw2000_poll_voted",
};

const ALLOWED_POLL_OPTIONS = ["Goldfish", "Shark", "Clownfish", "Blobfish", "Other"];

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
    const visits = Number.isFinite(Number(data.visit)) ? Number(data.visit) : 0;
    const visitors = Number.isFinite(Number(data.visitor)) ? Number(data.visitor) : visits;

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
    if (!Array.isArray(parsed)) {
      return [...DEFAULT_GUESTBOOK];
    }

    return parsed
      .map(sanitizeGuestbookEntry)
      .filter((entry) => entry.name && entry.message)
      .slice(-LIMITS.guestbookMaxEntries);
  } catch {
    return [...DEFAULT_GUESTBOOK];
  }
}

function saveGuestbookEntries(entries) {
  const safeEntries = entries
    .map(sanitizeGuestbookEntry)
    .filter((entry) => entry.name && entry.message)
    .slice(-LIMITS.guestbookMaxEntries);

  localStorage.setItem(STORAGE.guestbook, JSON.stringify(safeEntries));
}

function sanitizeText(value, maxLength) {
  return String(value)
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function sanitizeGuestbookEntry(entry) {
  return {
    name: sanitizeText(entry?.name, LIMITS.nameMax),
    email: sanitizeText(entry?.email, LIMITS.emailMax),
    message: sanitizeText(entry?.message, LIMITS.messageMax),
    date:
      typeof entry?.date === "string" && !Number.isNaN(Date.parse(entry.date))
        ? entry.date
        : new Date().toISOString(),
  };
}

function isValidEmail(value) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function canSubmitGuestbookEntry() {
  const lastSubmit = Number(sessionStorage.getItem("fw2000_guestbook_last_submit") || "0");
  return Date.now() - lastSubmit >= LIMITS.guestbookCooldownMs;
}

function markGuestbookSubmitted() {
  sessionStorage.setItem("fw2000_guestbook_last_submit", String(Date.now()));
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

    if (!canSubmitGuestbookEntry()) {
      showRetroAlert("Slow down!!! Wait 30 seconds between guestbook posts.");
      return;
    }

    const honeypot = sanitizeText(form.querySelector("#website")?.value, 80);
    if (honeypot) {
      showRetroAlert("Thanks!!! Your fish message has been saved to the ocean server.");
      form.reset();
      return;
    }

    const name = sanitizeText(form.querySelector("#name")?.value, LIMITS.nameMax);
    const email = sanitizeText(form.querySelector("#email")?.value, LIMITS.emailMax);
    const message = sanitizeText(form.querySelector("#message")?.value, LIMITS.messageMax);

    if (!name || !message) {
      showRetroAlert("Please enter your name and a fish message!!!");
      return;
    }

    if (!isValidEmail(email)) {
      showRetroAlert("That email address looks fishy. Check it and try again.");
      return;
    }

    const entries = getGuestbookEntries();
    if (entries.length >= LIMITS.guestbookMaxEntries) {
      showRetroAlert("Guestbook is full!!! The ocean server cannot hold more fish.");
      return;
    }

    entries.push({
      name,
      email,
      message,
      date: new Date().toISOString(),
    });
    saveGuestbookEntries(entries);
    markGuestbookSubmitted();
    form.reset();
    renderGuestbook();
    showRetroAlert("Thanks!!! Your fish message has been saved to the ocean server.");
  });
}

function initPoll() {
  const form = document.getElementById("fish-poll");
  const results = document.getElementById("poll-results");
  if (!form || !results) return;

  const options = ALLOWED_POLL_OPTIONS;

  function getVotes() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE.poll) || "{}");
      if (!parsed || typeof parsed !== "object") return {};

      return Object.fromEntries(
        Object.entries(parsed).filter(([key, value]) => {
          return ALLOWED_POLL_OPTIONS.includes(key) && Number.isFinite(Number(value));
        })
      );
    } catch {
      return {};
    }
  }

  function saveVotes(votes) {
    const safeVotes = Object.fromEntries(
      ALLOWED_POLL_OPTIONS.map((option) => [option, Math.max(0, Number(votes[option]) || 0)])
    );
    localStorage.setItem(STORAGE.poll, JSON.stringify(safeVotes));
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

    if (localStorage.getItem(LIMITS.pollVoteKey)) {
      showRetroAlert("You already voted in this poll!!! One vote per browser.");
      return;
    }

    const selected = form.querySelector('input[name="favorite-fish"]:checked');
    if (!selected || !ALLOWED_POLL_OPTIONS.includes(selected.value)) {
      showRetroAlert("Pick a fish first!!!");
      return;
    }

    const votes = getVotes();
    votes[selected.value] = (votes[selected.value] || 0) + 1;
    saveVotes(votes);
    localStorage.setItem(LIMITS.pollVoteKey, "1");
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
    result.textContent = "";
    const scoreBlock = document.createElement("pre");
    scoreBlock.className = "ascii-art small gold";
    scoreBlock.textContent = ` SCORE: ${score} / 5\n ${messages[score]}`;
    const note = document.createElement("p");
    note.innerHTML = '<span class="blink">NEW HIGH SCORE???</span> Tell your friends on AIM!!!';
    result.append(scoreBlock, note);
  });
}

function initExternalLinkSecurity() {
  document.querySelectorAll('a[href^="http://"], a[href^="https://"]').forEach((link) => {
    if (link.hostname === window.location.hostname) return;
    link.setAttribute("rel", "noopener noreferrer");
    link.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
  });
}

function initSecurityMeta() {
  if (document.querySelector('meta[name="referrer"]')) return;

  const meta = document.createElement("meta");
  meta.name = "referrer";
  meta.content = "strict-origin-when-cross-origin";
  document.head.appendChild(meta);
}

function showRetroAlert(message) {
  window.alert(message);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
  initExternalLinkSecurity();
  initSecurityMeta();
}

document.addEventListener("DOMContentLoaded", initSite);
