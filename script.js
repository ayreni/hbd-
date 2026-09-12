/* =========================================================
   KONFIGURASI — edit bagian ini sesuai kebutuhanmu
   ========================================================= */
const CONFIG = {
  nickname: "Sayang",
  daysWiser: 365,
  targetScore: 30,
  gameDurationSeconds: 30,
  surpriseMessage:
    "Selamat, kamu berhasil buka halaman ini!\n\nIni pesan kecil aku: apa pun yang terjadi tahun ini, aku bakal selalu ada di barisan orang yang paling nyemangatin kamu. Makasih udah jadi Sayang aku.\n\nSelamat ulang tahun, lagi. Aku sayang kamu.",
  galleryPhotos: [
    { src: "images/foto1.jpg", caption: "Momen favorit #1" },
    { src: "images/foto2.jpg", caption: "Momen favorit #2" },
    { src: "images/foto3.jpg", caption: "Momen favorit #3" },
    { src: "images/foto4.jpg", caption: "Momen favorit #4" },
    { src: "images/foto5.jpg", caption: "Momen favorit #5" },
    { src: "images/foto6.jpg", caption: "Momen favorit #6" }
  ]
};

/* =========================================================
   STATE
   ========================================================= */
let gameUnlocked = false;
let gameActive = false;
let score = 0;
let timeLeft = CONFIG.gameDurationSeconds;
let timerId = null;
let spawnId = null;

/* =========================================================
   INIT
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("stat-days").textContent = CONFIG.daysWiser;
  document.getElementById("target-label").textContent = CONFIG.targetScore;
  document.getElementById("time-val").textContent = CONFIG.gameDurationSeconds;

  setupTabs();
  renderGallery();
  setupGame();
  startBackgroundParticles();

  document.getElementById("hero-cta").addEventListener("click", () => switchTab("surat"));
  document
    .querySelectorAll("[data-goto]")
    .forEach((btn) => btn.addEventListener("click", () => switchTab(btn.dataset.goto)));
});

/* =========================================================
   TABS
   ========================================================= */
function setupTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
}

function switchTab(name) {
  if (name === "kejutan" && !gameUnlocked) {
    // tetap boleh dilihat, tapi akan menampilkan status terkunci
  }
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.tab === name);
  });
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.toggle("is-active", page.id === `page-${name}`);
  });
}

/* =========================================================
   GALLERY — dengan fallback jika foto belum ada
   ========================================================= */
function renderGallery() {
  const grid = document.getElementById("gallery-grid");
  grid.innerHTML = "";

  CONFIG.galleryPhotos.forEach((photo) => {
    const frame = document.createElement("div");
    frame.className = "photo-frame";

    const img = document.createElement("img");
    img.src = photo.src;
    img.alt = photo.caption;
    img.loading = "lazy";

    const fallback = document.createElement("div");
    fallback.className = "photo-fallback";
    fallback.innerHTML = `<span class="heart-mark">&#9825;</span><span>Taruh foto di sini<br>(${photo.src})</span>`;

    img.addEventListener("error", () => {
      img.remove();
    });

    const caption = document.createElement("div");
    caption.className = "photo-caption";
    caption.textContent = photo.caption;

    frame.appendChild(fallback);
    frame.appendChild(img);
    frame.appendChild(caption);
    grid.appendChild(frame);
  });
}

/* =========================================================
   MINI GAME — klik hati, kumpulin poin
   ========================================================= */
function setupGame() {
  document.getElementById("start-game").addEventListener("click", startGame);
  document.getElementById("replay-game").addEventListener("click", () => {
    switchTab("game");
    resetGame();
  });
}

function startGame() {
  if (gameActive) return;
  resetGame();
  gameActive = true;

  const idleMsg = document.getElementById("game-idle-msg");
  if (idleMsg) idleMsg.remove();

  document.getElementById("start-game").textContent = "Sedang main…";
  document.getElementById("start-game").disabled = true;

  timerId = setInterval(() => {
    timeLeft -= 1;
    document.getElementById("time-val").textContent = timeLeft;
    if (timeLeft <= 0) endGame();
  }, 1000);

  spawnHeart();
  spawnId = setInterval(spawnHeart, 750);
}

function resetGame() {
  clearInterval(timerId);
  clearInterval(spawnId);
  gameActive = false;
  score = 0;
  timeLeft = CONFIG.gameDurationSeconds;
  document.getElementById("score-val").textContent = "0";
  document.getElementById("time-val").textContent = timeLeft;
  document.getElementById("progress-fill").style.width = "0%";
  document.getElementById("game-result").textContent = "";
  document.getElementById("start-game").textContent = "Mulai";
  document.getElementById("start-game").disabled = false;

  const field = document.getElementById("game-field");
  field.innerHTML = '<p class="game-idle-msg" id="game-idle-msg">Tekan "Mulai" untuk main</p>';
}

function spawnHeart() {
  const field = document.getElementById("game-field");
  const rect = field.getBoundingClientRect();
  const heart = document.createElement("button");
  heart.className = "heart-target";
  heart.setAttribute("aria-label", "Klik hati");
  heart.textContent = Math.random() > 0.15 ? "\u2764\uFE0F" : "\u2728";

  const size = 26;
  const maxX = Math.max(rect.width - size - 12, 12);
  const maxY = Math.max(rect.height - size - 12, 12);
  heart.style.left = `${Math.random() * maxX}px`;
  heart.style.top = `${Math.random() * maxY}px`;

  const lifeMs = 1300;
  const removeTimer = setTimeout(() => heart.remove(), lifeMs);

  heart.addEventListener("click", () => {
    if (!gameActive) return;
    clearTimeout(removeTimer);
    score += 1;
    document.getElementById("score-val").textContent = score;
    const pct = Math.min(100, Math.round((score / CONFIG.targetScore) * 100));
    document.getElementById("progress-fill").style.width = `${pct}%`;
    heart.classList.add("is-popped");
    setTimeout(() => heart.remove(), 250);

    if (score >= CONFIG.targetScore) endGame(true);
  });

  field.appendChild(heart);
}

function endGame(reachedTarget) {
  clearInterval(timerId);
  clearInterval(spawnId);
  gameActive = false;
  document.getElementById("start-game").textContent = "Main lagi";
  document.getElementById("start-game").disabled = false;

  const field = document.getElementById("game-field");
  field.querySelectorAll(".heart-target").forEach((h) => h.remove());

  const resultEl = document.getElementById("game-result");
  const success = reachedTarget || score >= CONFIG.targetScore;

  if (success) {
    resultEl.textContent = `Selamat, kamu dapat ${score} poin! Halaman Kejutan sudah terbuka.`;
    unlockSurprise();
  } else {
    resultEl.textContent = `Kamu dapat ${score} poin. Butuh ${CONFIG.targetScore} poin buat buka Kejutan — coba lagi?`;
  }
}

function unlockSurprise() {
  gameUnlocked = true;
  document.getElementById("lock-dot").classList.add("is-hidden");
  document.getElementById("surprise-locked").classList.add("hidden");
  const unlocked = document.getElementById("surprise-unlocked");
  unlocked.classList.remove("hidden");
  document.getElementById("surprise-text").textContent = CONFIG.surpriseMessage;
}

/* =========================================================
   BACKGROUND PARTICLES — hati kecil melayang pelan
   ========================================================= */
function startBackgroundParticles() {
  const canvas = document.getElementById("bg-canvas");
  const ctx = canvas.getContext("2d");
  let width, height, particles;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function makeParticles() {
    const count = Math.round((width * height) / 90000);
    particles = Array.from({ length: Math.max(14, Math.min(count, 40)) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1 + Math.random() * 2.2,
      speed: 0.15 + Math.random() * 0.35,
      drift: (Math.random() - 0.5) * 0.3,
      alpha: 0.15 + Math.random() * 0.35
    }));
  }

  function tick() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p) => {
      p.y -= p.speed;
      p.x += p.drift;
      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 184, 217, ${p.alpha})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(tick);
  }

  resize();
  makeParticles();
  window.addEventListener("resize", () => {
    resize();
    makeParticles();
  });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduceMotion) requestAnimationFrame(tick);
}