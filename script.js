const ANSWER = "TARANG";
const STORAGE_KEYS = {
  solved: "golden_threads_day1_solved",
  log: "golden_threads_log",
  device: "golden_threads_device_id",
};
const PROGRESS_KEY = "golden_threads_progress";
const API_BASE = window.VALENTINE_API_BASE || "http://localhost:4000";
const CURRENT_DAY = 0;

const normalizeAnswerValue = (value) =>
  value ? value.trim().replace(/\s+/g, "").toUpperCase() : "";
const NORMALIZED_ANSWER = normalizeAnswerValue(ANSWER);

const calendarContextYear = (() => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const finalDropThisYear = new Date(currentYear, 1, 14, 23, 59, 59); // Feb indices are 1
  return now > finalDropThisYear ? currentYear + 1 : currentYear;
})();

const releaseIso = (calendarDay) =>
  `${calendarContextYear}-02-${String(calendarDay).padStart(2, "0")}T00:00:00+05:30`;

const readSolvedDays = () => {
  const stored = localStorage.getItem(PROGRESS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore parse errors
    }
  }
  if (localStorage.getItem(STORAGE_KEYS.solved) === "true") {
    return [0];
  }
  return [];
};

let solvedDaysState = readSolvedDays();
const persistSolvedDays = (days) => {
  const unique = Array.from(new Set(days)).sort((a, b) => a - b);
  solvedDaysState = unique;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(unique));
  localStorage.removeItem(STORAGE_KEYS.solved);
};
const hasSolvedDay = (day) => solvedDaysState.includes(day);
const markDaySolved = (day) => {
  if (!hasSolvedDay(day)) {
    persistSolvedDays([...solvedDaysState, day]);
  }
};

if (!localStorage.getItem(PROGRESS_KEY) && solvedDaysState.length) {
  persistSolvedDays(solvedDaysState);
}

const schedule = [
  { day: 0, label: "Rose Day", date: "Feb 7", teaser: "Cryptic charade to start the hunt", releaseAt: releaseIso(7) },
  { day: 1, label: "Propose Day", date: "Feb 8", teaser: "Letter-perfect confession", releaseAt: releaseIso(8) },
  { day: 2, label: "Chocolate Day", date: "Feb 9", teaser: "Coordinates in cocoa swirls", releaseAt: releaseIso(9) },
  { day: 3, label: "Teddy Day", date: "Feb 10", teaser: "Stitches hide a cozy cipher", releaseAt: releaseIso(10) },
  { day: 4, label: "Promise Day", date: "Feb 11", teaser: "Decode vows etched in constellations", releaseAt: releaseIso(11) },
  { day: 5, label: "Hug Day", date: "Feb 12", teaser: "A logic puzzle full of embrace diagrams", releaseAt: releaseIso(12) },
  { day: 6, label: "Kiss Day", date: "Feb 13", teaser: "Morse sparks hidden in lipstick prints", releaseAt: releaseIso(13) },
  { day: 7, label: "Valentine's Day", date: "Feb 14", teaser: "Finale puzzle weaving every clue", releaseAt: releaseIso(14) },
];

const nextDrop = schedule.find((slot) => slot.day === CURRENT_DAY + 1);
const NEXT_RELEASE = nextDrop ? nextDrop.releaseAt : releaseIso(14);

const getScheduleSlot = (day) => schedule.find((slot) => slot.day === day);
const isDayAvailable = (day, now = new Date()) => {
  const slot = getScheduleSlot(day);
  if (!slot) return false;
  const released = now >= new Date(slot.releaseAt);
  const previousCleared = day === 0 || hasSolvedDay(day - 1);
  return released && previousCleared;
};

const dayOnePuzzle = {
  label: "Day 0 · Rose Day",
  title: "Rose Day Cryptic",
  hero:
    "Your opening clue is a charade. Split the sentence into definition plus wordplay and you'll unlock the word that kicks off Valentine's week.",
  instructions: [
    "In cryptic clues, one half usually defines the answer while the other half explains how to build it.",
    "Look for familiar sounds (like tabla bols) and Rose Day imagery to spot the building blocks you need.",
  ],
  clues: [
    {
      time: "Cryptic clue",
      location: "Length: 6 letters",
      description:
        '“Princess Joy graces the Rose Day soiree when tabla beat picks up red–pink–white tint”',
    },
  ],
  footer: "",
};

const puzzleHero = document.getElementById("puzzle-hero");
const puzzleTitle = document.getElementById("puzzle-title");
const puzzlePill = document.getElementById("puzzle-pill");
const instructionList = document.getElementById("instruction-list");
const clueGrid = document.getElementById("clue-grid");
const puzzleFooter = document.getElementById("puzzle-footer");
const instructionsBlock = document.querySelector(".instructions");
const heroPanel = document.querySelector(".highlight-inner");
const highlightLocked = document.getElementById("highlight-locked");
const highlightLockedMessage = document.getElementById("highlight-locked-message");
const highlightCountdown = document.getElementById("highlight-countdown");
const answerForm = document.getElementById("answer-form");
const answerInput = document.getElementById("answer-input");
const answerFeedback = document.getElementById("answer-feedback");
const solvedPanel = document.getElementById("solved-panel");
const timerText = document.getElementById("timer-text");
const headlineTimer = document.getElementById("headline-timer");
const headlineTimerText = document.getElementById("headline-timer-text");
const scheduleGrid = document.getElementById("schedule-grid");
const modalOverlay = document.getElementById("congrats-modal");
const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");
const modalClose = document.getElementById("modal-close");
const modalConfirm = document.getElementById("modal-confirm");
const prizeForm = document.getElementById("prize-form");
const prizeTimeInput = document.getElementById("prize-time");
const prizeSubmit = document.getElementById("prize-submit");

let countdownInterval = null;
let lockedCountdownInterval = null;

const getDeviceId = () => {
  let deviceId = localStorage.getItem(STORAGE_KEYS.device);
  if (!deviceId) {
    deviceId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `device-${Date.now()}-${Math.random()}`;
    localStorage.setItem(STORAGE_KEYS.device, deviceId);
  }
  return deviceId;
};

const DEVICE_ID = getDeviceId();

const logEvent = (event, payload = {}) => {
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.log) ?? "[]");
  const entry = {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    event,
    payload,
    timestamp: new Date().toISOString(),
    deviceId: DEVICE_ID,
  };
  existing.push(entry);
  localStorage.setItem(STORAGE_KEYS.log, JSON.stringify(existing));
  window.valentineLog = {
    entries: existing,
    dump: () => existing,
    clear: () => {
      localStorage.removeItem(STORAGE_KEYS.log);
      window.valentineLog = undefined;
    },
  };
  sendEventToServer(entry);
};

const sendEventToServer = (entry) => {
  if (!API_BASE) return;
  try {
    fetch(`${API_BASE}/api/puzzle-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    }).catch((error) => {
      console.warn("Unable to send puzzle event", error);
    });
  } catch (error) {
    console.warn("Unable to send puzzle event", error);
  }
};

const puzzleSolved = () => hasSolvedDay(CURRENT_DAY);

const setPuzzleContentVisibility = (visible) => {
  instructionsBlock?.classList.toggle("hidden", !visible);
  clueGrid?.classList.toggle("hidden", !visible);
  answerForm?.classList.toggle("hidden", !visible);
  if (!visible) {
    puzzleFooter?.classList.add("hidden");
  } else if (puzzleFooter) {
    puzzleFooter.classList.remove("hidden");
  }
};

const setHeroVisibility = (visible) => {
  if (!heroPanel || !highlightLocked) return;
  heroPanel.classList.toggle("hidden", !visible);
  highlightLocked.classList.toggle("hidden", visible);
  if (visible) {
    stopLockedCountdown();
  }
};

const stopLockedCountdown = () => {
  if (lockedCountdownInterval) {
    window.clearInterval(lockedCountdownInterval);
    lockedCountdownInterval = null;
  }
  if (highlightCountdown) highlightCountdown.textContent = "";
};

const startLockedCountdown = (releaseDate, releaseText) => {
  if (!releaseDate) {
    highlightCountdown && (highlightCountdown.textContent = "");
    return;
  }
  if (lockedCountdownInterval) window.clearInterval(lockedCountdownInterval);
  const update = () => {
    const diff = releaseDate - Date.now();
    const countdownCopy = describeCountdown(diff);
    puzzleHero.innerHTML = `This puzzle stays sealed until ${releaseText} IST. Check the cadence below to track the drop.<br/><span class="locked-countdown">Opens in ${countdownCopy}</span>`;
    if (highlightCountdown) highlightCountdown.textContent = `Opens in ${countdownCopy}`;
  };
  update();
  lockedCountdownInterval = window.setInterval(update, 1000);
};

const hideModal = () => {
  if (modalOverlay) modalOverlay.classList.add("hidden");
};

const openCongratsModal = () => {
  if (!modalOverlay || !modalTitle || !modalBody) return;
  if (CURRENT_DAY === 0 && prizeForm && modalConfirm) {
    prizeForm.classList.remove("hidden");
    modalConfirm.classList.add("hidden");
    modalTitle.textContent = "You cracked the opening charade!";
    modalBody.textContent = "Tell us when and where to drop off your Rose Day surprise.";
  } else {
    prizeForm?.classList.add("hidden");
    modalConfirm?.classList.remove("hidden");
    modalTitle.textContent = "Beautifully done!";
    modalBody.textContent = "The next envelope will glow at midnight. Sit tight and savor the afterglow.";
  }
  modalOverlay.classList.remove("hidden");
};

modalClose?.addEventListener("click", hideModal);
modalConfirm?.addEventListener("click", hideModal);

prizeForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!prizeTimeInput) return;
  const time = prizeTimeInput.value;
  const location = prizeForm.querySelector('input[name="prize-location"]:checked')?.value;
  logEvent("prize_preferences", { day: CURRENT_DAY, time, location });
  localStorage.setItem("golden_threads_prize_pref_day0", JSON.stringify({ time, location }));
  hideModal();
});

const renderPuzzle = () => {
  const slot = getScheduleSlot(CURRENT_DAY);
  const now = new Date();
  const available = isDayAvailable(CURRENT_DAY, now);
  const releaseDate = slot ? new Date(slot.releaseAt) : null;

  puzzlePill.textContent = slot ? `Day ${slot.day} · ${slot.label}` : dayOnePuzzle.label;

  if (!available) {
    setPuzzleContentVisibility(false);
    setHeroVisibility(false);
    if (highlightLockedMessage) {
      highlightLockedMessage.textContent = "This vignette unlocks with the first clue. Track the countdown below.";
    }
    puzzleTitle.textContent = slot ? `${slot.label} unlocks soon` : "Locked";
    const releaseText = releaseDate
      ? releaseDate.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
      : "the right time";
    startLockedCountdown(releaseDate, releaseText);
    clueGrid.innerHTML = "";
    puzzleFooter.textContent = "";
    answerFeedback.textContent = "";
    return;
  }

  setPuzzleContentVisibility(true);
  setHeroVisibility(true);
  puzzleTitle.textContent = dayOnePuzzle.title;
  puzzleHero.textContent = dayOnePuzzle.hero;

  instructionList.innerHTML = "";
  dayOnePuzzle.instructions.forEach((step) => {
    const li = document.createElement("li");
    li.textContent = step;
    instructionList.appendChild(li);
  });

  clueGrid.innerHTML = "";
  dayOnePuzzle.clues.forEach((clue) => {
    const card = document.createElement("article");
    card.className = "clue-card";
    card.innerHTML = `
      <div class="clue-meta">
        <span>${clue.time}</span>
        <span>${clue.location}</span>
      </div>
      <p>${clue.description}</p>
    `;
    clueGrid.appendChild(card);
  });

  puzzleFooter.textContent = dayOnePuzzle.footer;
};

const renderSchedule = () => {
  scheduleGrid.innerHTML = "";
  const now = new Date();

  schedule.forEach((slot) => {
    const releaseDate = new Date(slot.releaseAt);
    const released = now >= releaseDate;
    const previousCleared = slot.day === 0 || hasSolvedDay(slot.day - 1);
    const available = released && previousCleared;
    const unlocked = hasSolvedDay(slot.day);
    const showContent = available || unlocked;
    const live = available && !unlocked && slot.day === CURRENT_DAY;
    const card = document.createElement("article");
    const cardStateClass = showContent ? (unlocked ? " solved" : " live") : " locked";
    card.className = `schedule-card${cardStateClass}`;

    const countdownLabel = describeCountdown(releaseDate - now);
    let statusText;
    if (!released) {
      statusText = `Drops in ${countdownLabel}`;
    } else if (!previousCleared) {
      statusText = `Solve Day ${slot.day - 1} first`;
    } else if (unlocked) {
      statusText = "Solved";
    } else {
      statusText = "Unlocked";
    }

    const lockBadge = showContent ? "" : '<span class="lock-icon" aria-hidden="true">🔒</span>';
    const lockNote =
      !showContent && slot.day > 0
        ? `<p class="lock-note">Unlocks ${releaseDate.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}</p>`
        : "";

    const pillLabel = `Day ${slot.day} · ${slot.label}`;
    const bodyContent = showContent
      ? `<h4>${slot.teaser}</h4><p>${slot.date}</p>`
      : `<div class="lock-display"><span class="lock-icon" aria-hidden="true">🔒</span><span>Sealed</span></div><p class="locked-date">${slot.date}</p>`;

    card.innerHTML = `
      <p class="pill pill-soft">${lockBadge}${pillLabel}</p>
      ${bodyContent}
      <p class="status ${showContent ? (unlocked ? "solved" : "live") : "locked"}">${statusText}</p>
      ${lockNote}
    `;

    scheduleGrid.appendChild(card);
  });
};

const describeCountdown = (ms) => {
  if (ms <= 0) return "moments";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const checkSolvedState = () => {
  if (puzzleSolved()) {
    answerForm.classList.add("hidden");
    solvedPanel.classList.remove("hidden");
    startCountdown();
  } else {
    answerForm.classList.remove("hidden");
    solvedPanel.classList.add("hidden");
    stopCountdown();
  }
};

const startCountdown = () => {
  if (!timerText || !headlineTimerText) return;
  const releaseDate = new Date(NEXT_RELEASE);
  const updateTimer = () => {
    const diff = releaseDate - Date.now();
    const formatted =
      diff <= 0
        ? "00d 00h 00m 00s"
        : (() => {
            const totalSeconds = Math.floor(diff / 1000);
            const days = Math.floor(totalSeconds / 86400);
            const hours = Math.floor((totalSeconds % 86400) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(
              seconds
            ).padStart(2, "0")}s`;
          })();
    timerText.textContent = formatted;
    headlineTimerText.textContent = formatted;
    headlineTimer.classList.remove("hidden");
  };

  updateTimer();
  if (countdownInterval) window.clearInterval(countdownInterval);
  countdownInterval = window.setInterval(updateTimer, 1000);
};

const stopCountdown = () => {
  if (countdownInterval) {
    window.clearInterval(countdownInterval);
    countdownInterval = null;
  }
  if (timerText) timerText.textContent = "--d --h --m --s";
  if (headlineTimerText) headlineTimerText.textContent = "--d --h --m --s";
  if (headlineTimer) headlineTimer.classList.add("hidden");
};

answerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const rawGuess = answerInput.value || "";
  const guess = normalizeAnswerValue(rawGuess);
  if (!guess) {
    answerFeedback.textContent = "Need at least one letter before we can check.";
    answerFeedback.style.color = "var(--text-muted)";
    logEvent("puzzle_attempt", { result: "empty", day: CURRENT_DAY });
    return;
  }

  if (guess === NORMALIZED_ANSWER) {
    answerFeedback.textContent = "Perfect! Countdown unlocked below.";
    answerFeedback.style.color = "var(--success)";
    markDaySolved(CURRENT_DAY);
    logEvent("puzzle_solved", { day: CURRENT_DAY });
    checkSolvedState();
    renderSchedule();
    openCongratsModal();
  } else {
    answerFeedback.textContent = "Not the word we're chasing. Reorder the letters and retry.";
    answerFeedback.style.color = "var(--danger)";
    logEvent("puzzle_attempt", { result: "incorrect", guess: rawGuess, day: CURRENT_DAY });
  }
});

const syncProgressFromServer = async () => {
  if (!API_BASE) return;
  try {
    const response = await fetch(`${API_BASE}/api/puzzle-progress?deviceId=${DEVICE_ID}`);
    if (!response.ok) return;
    const data = await response.json();
    if (Array.isArray(data.solvedDays)) {
      persistSolvedDays([...solvedDaysState, ...data.solvedDays]);
    }
    renderSchedule();
    checkSolvedState();
  } catch (error) {
    console.warn("Unable to sync puzzle progress", error);
  }
};

const boot = () => {
  logEvent("page_boot");
  renderPuzzle();
  renderSchedule();
  checkSolvedState();
  syncProgressFromServer();
};

boot();
