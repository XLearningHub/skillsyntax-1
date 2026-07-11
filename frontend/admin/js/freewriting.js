/**
 * freewriting.js — SkillSyntax Free Writing Module
 * Handles setup flow, real-time word count, API call, and results rendering.
 */

"use strict";

// ─── STATE ───────────────────────────────────────────────────────────────────
let currentTema  = "";
let currentNivel = "";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const MIN_WORDS = 30;   // Minimum before the submit button activates
const API_URL   = "/api/writing/evaluate";

// ─── WORD COUNT ───────────────────────────────────────────────────────────────
function countWords(text) {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function updateWordCount() {
  const text  = document.getElementById("writing-area").value;
  const count = countWords(text);
  const numEl = document.getElementById("word-num");
  const btnEl = document.getElementById("btn-evaluate");
  const hint  = document.getElementById("wc-hint");

  numEl.textContent = count;

  // Colour coding
  numEl.classList.remove("warn", "ready");
  if (count >= 100) {
    numEl.classList.add("ready");
    hint.textContent = "Great length! Ready to submit.";
    hint.style.color = "var(--success)";
  } else if (count >= MIN_WORDS) {
    numEl.classList.add("warn");
    hint.textContent = `${100 - count} more words recommended.`;
    hint.style.color = "var(--warning)";
  } else {
    hint.textContent = `Aim for at least ${MIN_WORDS} words.`;
    hint.style.color = "var(--text-muted)";
  }

  btnEl.disabled = count < MIN_WORDS;
}

// ─── SETUP FLOW ───────────────────────────────────────────────────────────────
function startExercise() {
  const tema  = document.getElementById("fw-tema").value.trim();
  const nivel = document.getElementById("fw-nivel").value;

  if (!tema) {
    showToast("Please enter a topic.", "error");
    document.getElementById("fw-tema").focus();
    return;
  }
  if (!nivel) {
    showToast("Please select a CEFR level.", "error");
    document.getElementById("fw-nivel").focus();
    return;
  }

  currentTema  = tema;
  currentNivel = nivel;

  // Show topic banner
  document.getElementById("banner-topic-text").textContent = tema;
  document.getElementById("banner-level-badge").textContent = nivel;
  document.getElementById("topic-banner").style.display = "block";

  // Show writing card; hide setup
  document.getElementById("setup-card").style.display   = "none";
  document.getElementById("writing-card").style.display = "block";
  document.getElementById("writing-area").focus();
}

// ─── SUBMIT FOR EVALUATION ────────────────────────────────────────────────────
async function submitForEvaluation() {
  const texto = document.getElementById("writing-area").value.trim();

  if (countWords(texto) < MIN_WORDS) {
    showToast(`Please write at least ${MIN_WORDS} words.`, "error");
    return;
  }

  // Show loading, hide others
  document.getElementById("writing-card").style.display    = "none";
  document.getElementById("topic-banner").style.display    = "none";
  document.getElementById("results-section").style.display = "none";
  document.getElementById("loading-overlay").style.display = "block";

  try {
    const res = await fetch(API_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        texto,
        nivelCEFR: currentNivel,
        tema:      currentTema
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${res.status}`);
    }

    const data = await res.json();
    renderResults(data);

  } catch (error) {
    console.error("Evaluation error:", error);
    showToast("Error evaluating. Please try again.", "error");
    // Restore writing card
    document.getElementById("writing-card").style.display    = "block";
    document.getElementById("topic-banner").style.display    = "block";
  } finally {
    document.getElementById("loading-overlay").style.display = "none";
  }
}

// ─── RENDER RESULTS ───────────────────────────────────────────────────────────
function renderResults({ score, feedback, corrections }) {
  // ── Score ring animation ──
  const ring       = document.getElementById("score-ring-fill");
  const circumference = 314.16; // 2 * π * 50
  const offset     = circumference - (score / 100) * circumference;

  // Colour by score
  let ringColor;
  if (score >= 75)       ringColor = "#10b981"; // green
  else if (score >= 50)  ringColor = "#f59e0b"; // amber
  else                   ringColor = "#ef4444"; // red

  ring.style.stroke             = ringColor;
  ring.style.strokeDashoffset   = offset;

  // Animate counter
  animateCounter("score-number", 0, score, 1200);

  // ── Score title & description ──
  const titles = [
    [90, "Outstanding! 🏆", "Near-native performance for your level."],
    [75, "Strong Result 🎯", "A confident, well-structured piece with minor errors."],
    [60, "Satisfactory ✔️", "Good effort — some areas need improvement."],
    [45, "Needs Work 📝", "Below expected level — focus on the corrections below."],
    [0,  "Keep Practicing 💪", "Fundamental errors found — use the feedback to improve."]
  ];

  const [, title, desc] = titles.find(([min]) => score >= min);
  document.getElementById("score-title").textContent       = title;
  document.getElementById("score-description").textContent = desc;

  // ── Performance chips ──
  const chips    = document.getElementById("perf-chips");
  chips.innerHTML = "";
  const chipData = getChips(score, corrections?.length ?? 0);
  chipData.forEach(({ label, cls }) => {
    const el = document.createElement("span");
    el.className = `chip ${cls}`;
    el.innerHTML = label;
    chips.appendChild(el);
  });

  // ── Feedback ──
  document.getElementById("feedback-text").textContent = feedback || "No feedback provided.";

  // ── Corrections ──
  const countEl = document.getElementById("corrections-count");
  const listEl  = document.getElementById("corrections-list");
  listEl.innerHTML = "";

  if (!corrections || corrections.length === 0) {
    countEl.innerHTML = "Corrections found: <span>0</span>";
    listEl.innerHTML  = `
      <div class="no-corrections">
        <i class="fas fa-check-circle"></i>
        No significant errors found — excellent writing!
      </div>`;
  } else {
    countEl.innerHTML = `Corrections found: <span>${corrections.length}</span>`;
    corrections.forEach((c, i) => {
      const item = document.createElement("div");
      item.className = "correction-item";
      item.style.animationDelay = `${i * 0.05}s`;
      item.innerHTML = `
        <div class="ci-original">
          <div class="ci-row">
            <i class="fas fa-times-circle" style="color:var(--danger)"></i>
            <span>${escapeHtml(c.original)}</span>
          </div>
        </div>
        <div class="ci-correction">
          <div class="ci-row">
            <i class="fas fa-check-circle" style="color:var(--success)"></i>
            <span>${escapeHtml(c.correction)}</span>
          </div>
        </div>
        <div class="ci-reason">
          <i class="fas fa-info-circle"></i>${escapeHtml(c.reason)}
        </div>`;
      listEl.appendChild(item);
    });
  }

  // Show results, scroll to them
  document.getElementById("results-section").style.display = "block";
  document.getElementById("results-section").scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─── HELPER: CHIPS ────────────────────────────────────────────────────────────
function getChips(score, numCorrections) {
  const chips = [];
  if (score >= 75)             chips.push({ label: '<i class="fas fa-check"></i> Passed',        cls: "chip-pass" });
  else if (score >= 45)        chips.push({ label: '<i class="fas fa-minus"></i> Needs Review',  cls: "chip-warn" });
  else                         chips.push({ label: '<i class="fas fa-times"></i> Not Passed',    cls: "chip-fail" });

  if (numCorrections === 0)    chips.push({ label: '<i class="fas fa-star"></i> Error-free',     cls: "chip-pass" });
  else if (numCorrections <= 3) chips.push({ label: `<i class="fas fa-pen"></i> ${numCorrections} Corrections`, cls: "chip-warn" });
  else                          chips.push({ label: `<i class="fas fa-pen"></i> ${numCorrections} Corrections`, cls: "chip-fail" });

  chips.push({ label: `<i class="fas fa-layer-group"></i> ${currentNivel}`, cls: "chip-warn" });
  return chips;
}

// ─── HELPER: ANIMATE COUNTER ──────────────────────────────────────────────────
function animateCounter(id, from, to, duration) {
  const el    = document.getElementById(id);
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(from + (to - from) * easeOut(progress));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

// ─── HELPER: ESCAPE HTML ──────────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function showToast(message, type = "info") {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.className   = type === "error" ? "show error" : "show";
  setTimeout(() => { el.className = type === "error" ? "error" : ""; }, 3200);
}

// ─── RESET ────────────────────────────────────────────────────────────────────
function resetAll() {
  currentTema  = "";
  currentNivel = "";

  document.getElementById("fw-tema").value    = "";
  document.getElementById("fw-nivel").value   = "";
  document.getElementById("writing-area").value = "";

  document.getElementById("word-num").textContent = "0";
  document.getElementById("word-num").className   = "count-num";
  document.getElementById("btn-evaluate").disabled = true;

  document.getElementById("setup-card").style.display    = "block";
  document.getElementById("topic-banner").style.display  = "none";
  document.getElementById("writing-card").style.display  = "none";
  document.getElementById("loading-overlay").style.display = "none";
  document.getElementById("results-section").style.display = "none";

  window.scrollTo({ top: 0, behavior: "smooth" });
}
