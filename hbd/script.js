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
  ],
  photoboxShots: 3,
  photoboxCountdown: 3
};

const PHOTOBOX_STORAGE_KEY = "hbd_photobox_gallery";

/* =========================================================
   STATE
   ========================================================= */
let gameUnlocked = false;
let gameActive = false;
let score = 0;
let timeLeft = CONFIG.gameDurationSeconds;
let timerId = null;
let spawnId = null;

let photoboxStream = null;
let photoboxBusy = false;
let currentTab = "beranda";

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
  setupPhotobox();
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
  if (currentTab === "fotobox" && name !== "fotobox") {
    stopPhotoboxCamera();
  }
  currentTab = name;
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
function getPhotoboxPhotos() {
  try {
    const raw = localStorage.getItem(PHOTOBOX_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Gagal baca foto box dari penyimpanan:", err);
    return [];
  }
}

function savePhotoboxPhotos(list) {
  try {
    localStorage.setItem(PHOTOBOX_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Gagal simpan foto box:", err);
  }
}

function renderGallery() {
  const grid = document.getElementById("gallery-grid");
  grid.innerHTML = "";

  const photoboxPhotos = getPhotoboxPhotos();

  // foto hasil Foto Box ditaruh paling depan biar kelihatan langsung
  photoboxPhotos
    .slice()
    .reverse()
    .forEach((photo) => {
      const frame = document.createElement("div");
      frame.className = "photo-frame is-photobox";

      const img = document.createElement("img");
      img.src = photo.src;
      img.alt = photo.caption;
      img.loading = "lazy";

      const del = document.createElement("button");
      del.className = "photo-delete";
      del.type = "button";
      del.setAttribute("aria-label", "Hapus foto ini");
      del.textContent = "✕";
      del.addEventListener("click", () => {
        const updated = getPhotoboxPhotos().filter((p) => p.id !== photo.id);
        savePhotoboxPhotos(updated);
        renderGallery();
      });

      const caption = document.createElement("div");
      caption.className = "photo-caption";
      caption.textContent = photo.caption;

      frame.appendChild(img);
      frame.appendChild(del);
      frame.appendChild(caption);
      grid.appendChild(frame);
    });

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
   FOTO BOX — kamera real-time, bingkai pink-hitam, ke Galeri
   ========================================================= */
function setupPhotobox() {
  const startBtn = document.getElementById("photobox-start-cam");
  const saveBtn = document.getElementById("photobox-save");
  const retakeBtn = document.getElementById("photobox-retake");

  startBtn.addEventListener("click", async () => {
    if (photoboxStream) {
      beginPhotoboxSession();
      return;
    }
    await startPhotoboxCamera();
  });

  saveBtn.addEventListener("click", savePhotoboxResult);
  retakeBtn.addEventListener("click", resetPhotoboxToLive);
}

async function startPhotoboxCamera() {
  const video = document.getElementById("photobox-video");
  const idleMsg = document.getElementById("photobox-idle-msg");
  const statusEl = document.getElementById("photobox-status");
  const startBtn = document.getElementById("photobox-start-cam");

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    statusEl.textContent = "Yah, browser ini nggak mendukung akses kamera.";
    return;
  }

  try {
    statusEl.textContent = "Minta izin kamera dulu ya…";
    photoboxStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });
    video.srcObject = photoboxStream;
    idleMsg.classList.add("hidden");
    statusEl.textContent = "";
    document.getElementById("photobox-stage").classList.add("is-live");
    beginPhotoboxSession();
  } catch (err) {
    console.error("Gagal akses kamera:", err);
    statusEl.textContent = "Nggak bisa akses kamera. Pastikan izin kamera diaktifkan, ya.";
  }
}

function stopPhotoboxCamera() {
  if (photoboxStream) {
    photoboxStream.getTracks().forEach((track) => track.stop());
    photoboxStream = null;
  }
  photoboxBusy = false;
  const video = document.getElementById("photobox-video");
  if (video) video.srcObject = null;

  const stage = document.getElementById("photobox-stage");
  if (stage) stage.classList.remove("is-live");

  const idleMsg = document.getElementById("photobox-idle-msg");
  if (idleMsg) idleMsg.classList.remove("hidden");

  const startBtn = document.getElementById("photobox-start-cam");
  if (startBtn) {
    startBtn.textContent = "Aktifkan Kamera";
    startBtn.disabled = false;
  }
}

function beginPhotoboxSession() {
  const startBtn = document.getElementById("photobox-start-cam");
  startBtn.textContent = "Ambil Sesi Foto (3x)";

  // ganti node biar listener lama (buka kamera) kebuang, ganti listener baru (ambil foto)
  const freshBtn = startBtn.cloneNode(true);
  startBtn.replaceWith(freshBtn);
  freshBtn.addEventListener("click", startPhotoboxSequence);
}

async function startPhotoboxSequence() {
  if (photoboxBusy || !photoboxStream) return;
  photoboxBusy = true;

  const startBtn = document.getElementById("photobox-start-cam");
  const statusEl = document.getElementById("photobox-status");
  const resultBox = document.getElementById("photobox-result");
  const stage = document.getElementById("photobox-stage");

  resultBox.classList.add("hidden");
  stage.classList.remove("hidden");
  startBtn.disabled = true;

  const shots = [];
  const totalShots = CONFIG.photoboxShots;

  for (let i = 0; i < totalShots; i++) {
    statusEl.textContent = `Foto ke-${i + 1} dari ${totalShots}…`;
    await photoboxCountdownAndCapture(shots);
  }

  statusEl.textContent = "Menyusun bingkai foto…";
  const stripDataUrl = await composePhotoboxStrip(shots);

  const img = document.getElementById("photobox-strip-img");
  img.src = stripDataUrl;
  resultBox.dataset.currentPhoto = stripDataUrl;
  resultBox.classList.remove("hidden");
  stage.classList.add("hidden");

  statusEl.textContent = "Sip! Simpan ke Galeri, atau ulangi kalau kurang pas.";
  startBtn.disabled = false;
  photoboxBusy = false;
}

function photoboxCountdownAndCapture(shots) {
  return new Promise((resolve) => {
    const countdownEl = document.getElementById("photobox-countdown");
    let count = CONFIG.photoboxCountdown;
    countdownEl.classList.remove("hidden");
    countdownEl.textContent = count;

    const tick = setInterval(() => {
      count -= 1;
      if (count > 0) {
        countdownEl.textContent = count;
        countdownEl.style.animation = "none";
        // trigger reflow to restart animation
        void countdownEl.offsetWidth;
        countdownEl.style.animation = "";
      } else {
        clearInterval(tick);
        countdownEl.classList.add("hidden");
        captureFrame(shots);
        resolve();
      }
    }, 1000);
  });
}

function captureFrame(shots) {
  const video = document.getElementById("photobox-video");
  const flash = document.getElementById("photobox-flash");

  const w = 480;
  const h = 360;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  // mirror biar sesuai tampilan live preview (selfie)
  ctx.translate(w, 0);
  ctx.scale(-1, 1);

  const vw = video.videoWidth || w;
  const vh = video.videoHeight || h;
  const srcRatio = vw / vh;
  const destRatio = w / h;
  let sx, sy, sw, sh;

  if (srcRatio > destRatio) {
    sh = vh;
    sw = vh * destRatio;
    sx = (vw - sw) / 2;
    sy = 0;
  } else {
    sw = vw;
    sh = vw / destRatio;
    sx = 0;
    sy = (vh - sh) / 2;
  }

  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
  shots.push(canvas.toDataURL("image/jpeg", 0.92));

  flash.classList.remove("is-flashing");
  void flash.offsetWidth;
  flash.classList.add("is-flashing");
}

function composePhotoboxStrip(shots) {
  const cellW = 400;
  const cellH = 300;
  const pad = 16;
  const gap = 12;
  const headerH = 46;
  const footerH = 56;

  const canvas = document.getElementById("photobox-canvas");
  canvas.width = cellW + pad * 2;
  canvas.height = headerH + shots.length * cellH + (shots.length - 1) * gap + footerH + pad * 2;
  const ctx = canvas.getContext("2d");

  // background hitam ala strip foto box
  ctx.fillStyle = "#0c0a0d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // header
  ctx.fillStyle = "#ff2e7e";
  ctx.font = "bold 22px 'Quicksand', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("♥ FOTO BOX ♥", canvas.width / 2, pad + 30);

  let y = pad + headerH;

  const drawStep = (index) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const x = pad;
        // border pink
        ctx.fillStyle = "#ff2e7e";
        ctx.fillRect(x - 4, y - 4, cellW + 8, cellH + 8);
        ctx.fillStyle = "#0c0a0d";
        ctx.fillRect(x - 2, y - 2, cellW + 4, cellH + 4);
        ctx.drawImage(img, x, y, cellW, cellH);

        // dekorasi hati di sudut tiap foto
        ctx.fillStyle = "#ffb8d9";
        ctx.font = "18px 'Quicksand', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("❤", x + 6, y + 22);
        ctx.textAlign = "right";
        ctx.fillText("❤", x + cellW - 6, y + cellH - 8);

        y += cellH + gap;
        resolve();
      };
      img.src = shots[index];
    });
  };

  return (async () => {
    for (let i = 0; i < shots.length; i++) {
      await drawStep(i);
    }

    // footer tanggal + label
    const dateStr = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    ctx.fillStyle = "#ff2e7e";
    ctx.textAlign = "center";
    ctx.font = "italic 16px 'Fraunces', serif";
    ctx.fillText("untuk. cinta", canvas.width / 2, canvas.height - footerH + 20);
    ctx.fillStyle = "#f5eef2";
    ctx.font = "13px 'Quicksand', sans-serif";
    ctx.fillText(dateStr, canvas.width / 2, canvas.height - footerH + 42);

    return canvas.toDataURL("image/jpeg", 0.95);
  })();
}

function resetPhotoboxToLive() {
  const resultBox = document.getElementById("photobox-result");
  const stage = document.getElementById("photobox-stage");
  const statusEl = document.getElementById("photobox-status");

  resultBox.classList.add("hidden");
  stage.classList.remove("hidden");
  statusEl.textContent = photoboxStream ? "" : "Kamera belum aktif.";
}

function savePhotoboxResult() {
  const resultBox = document.getElementById("photobox-result");
  const dataUrl = resultBox.dataset.currentPhoto;
  if (!dataUrl) return;

  const list = getPhotoboxPhotos();
  const now = new Date();
  list.push({
    id: `photobox-${now.getTime()}`,
    src: dataUrl,
    caption: `Foto Box — ${now.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`
  });
  savePhotoboxPhotos(list);
  renderGallery();

  const statusEl = document.getElementById("photobox-status");
  statusEl.textContent = "Tersimpan ke Galeri! Cek tab Galeri buat lihat hasilnya.";
  resetPhotoboxToLive();
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