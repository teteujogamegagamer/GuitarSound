// ---------------- Seleção de elementos ----------------
const guitarra = document.getElementById("guitarra");
const som = document.getElementById("som");
const playIcon = document.getElementById("play-icon");
const pauseIcon = document.getElementById("pause-icon");
const fire = document.getElementById("fire");

const block1 = document.getElementById("block1");
const block2 = document.getElementById("block2");

const amp = document.getElementById("amp");
const ampOn = document.getElementById("amp-on");
const ampOff = document.getElementById("amp-off");
const ampControl = document.querySelector(".amp-control");
const ampBar = document.getElementById("amp-bar");
const ampSlider = document.getElementById("amp-slider");

const currentTimeEl = document.getElementById("current-time");
const totalTimeEl = document.getElementById("total-time");
const progressBar = document.getElementById("progress-bar");
const progressFill = document.getElementById("progress-fill");
const progressThumb = document.getElementById("progress-thumb");

const loopBtn = document.getElementById("loop-btn");
const backBtn = document.getElementById("back-btn");
const skipBtn = document.getElementById("skip-btn");

let ampToggle = true;
let draggingAmp = false;
let draggingProgress = false;
let progressInterval = null;

// alternador de bloco de som
let toggleBlock = true;
function playEffect(audioElement) {
  if (!audioElement) return;
  audioElement.currentTime = 0;
  audioElement.play().catch(err => console.log("Erro efeito:", err));
}
function playAltBlock() {
  if (toggleBlock) {
    playEffect(block1);
  } else {
    playEffect(block2);
  }
  toggleBlock = !toggleBlock;
}

// loop
let isLooping = false;

// Playlist
const playlist = [
  "msc/Everlong - Foo Fighters.mp3",
  "msc/Rooster (2022 Remaster) - Alice in Chains.mp3",
  "msc/Tear Away - Drowning Pool.mp3", 
  "msc/Be Quiet and Drive (Far Away) - Deftones.mp3",
  "msc/Creep (Acoustic) - Radiohead.mp3",
];
let currentIndex = playlist.indexOf(som.getAttribute('src'));
if (currentIndex === -1) currentIndex = 0;

// ---------------- Funções utilitárias ----------------
function showIcon(icon) {
  if (!icon) return;
  icon.style.opacity = "1";
  icon.style.transform = "translate(-50%, -50%) scale(1.06)";
  setTimeout(() => {
    icon.style.opacity = "0";
    icon.style.transform = "translate(-50%, -50%) scale(1)";
  }, 600);
}

function updateFire(volume) {
  if (!fire) return;
  fire.style.opacity = volume;
}

function formatTime(sec) {
  if (!sec || isNaN(sec) || sec === Infinity) return "0:00";
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// ---------------- Volume do amplificador ----------------
function setVolumeByPosition(clientX) {
  if (!ampBar || !ampSlider) return;
  const rect = ampBar.getBoundingClientRect();
  const sliderWidth = ampSlider.offsetWidth || 20;
  
  let leftPos = clientX - rect.left - sliderWidth / 2;
  leftPos = Math.max(0, Math.min(leftPos, rect.width - sliderWidth));
  
  ampSlider.style.left = `${leftPos}px`;
  
  const percent = rect.width - sliderWidth > 0 ? leftPos / (rect.width - sliderWidth) : 0;
  som.volume = percent;
  if (!som.paused) updateFire(som.volume);
}

if (ampBar) ampBar.addEventListener("click", e => setVolumeByPosition(e.clientX));
if (ampSlider) ampSlider.addEventListener("mousedown", () => draggingAmp = true);
document.addEventListener("mouseup", () => draggingAmp = false);
document.addEventListener("mousemove", e => {
  if (draggingAmp) setVolumeByPosition(e.clientX);
});

// ---------------- Amp click ----------------
if (amp) amp.addEventListener("click", () => {
  playAltBlock();
  if (ampToggle) {
    if (ampOn) ampOn.style.opacity = "1";
    setTimeout(() => { if (ampOn) ampOn.style.opacity = "0"; }, 300);
    if (ampControl) ampControl.style.display = "flex";
    const barWidth = ampBar ? ampBar.offsetWidth : 120;
    const sliderWidth = ampSlider ? ampSlider.offsetWidth : 20;
    if (ampSlider) ampSlider.style.left = `${som.volume * (barWidth - sliderWidth)}px`;
  } else {
    if (ampOff) ampOff.style.opacity = "1";
    setTimeout(() => { if (ampOff) ampOff.style.opacity = "0"; }, 300);
    if (ampControl) ampControl.style.display = "none";
  }
  ampToggle = !ampToggle;
});

// ---------------- Barra de progresso ----------------
function updateProgress() {
  if (!som.duration || isNaN(som.duration) || som.duration === 0) {
    progressFill.style.width = `0%`;
    progressThumb.style.left = `0%`;
    currentTimeEl.textContent = formatTime(0);
    return;
  }
  const percent = (som.currentTime / som.duration) * 100;
  progressFill.style.width = `${percent}%`;
  progressThumb.style.left = `${percent}%`;
  currentTimeEl.textContent = formatTime(som.currentTime);
}

function setProgressByPosition(clientX) {
  const rect = progressBar.getBoundingClientRect();
  let x = clientX - rect.left;
  x = Math.max(0, Math.min(x, rect.width));
  const percent = x / rect.width;
  som.currentTime = percent * som.duration;
  updateProgress();
}

progressBar.addEventListener("click", e => setProgressByPosition(e.clientX));
progressThumb.addEventListener("mousedown", () => draggingProgress = true);
document.addEventListener("mouseup", () => draggingProgress = false);
document.addEventListener("mousemove", e => {
  if (draggingProgress) setProgressByPosition(e.clientX);
});

function startProgressUpdater() {
  if (progressInterval) clearInterval(progressInterval);
  progressInterval = setInterval(updateProgress, 100);
}
function stopProgressUpdater() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}

// ---------------- Play / Pause ----------------
function togglePlayPause() {
  if (som.paused) {
    som.play().catch(err => console.log("Erro música:", err));
    showIcon(playIcon);
    playAltBlock();
    updateFire(som.volume);
    startProgressUpdater();
  } else {
    som.pause();
    showIcon(pauseIcon);
    playAltBlock();
    if (fire) fire.style.opacity = "0";
    stopProgressUpdater();
  }
}

guitarra.addEventListener("click", togglePlayPause);

// ---------------- Quando música termina ----------------
som.addEventListener("ended", () => {
  if (isLooping) {
    som.currentTime = 0;
    som.play().catch(err => console.log("Erro ao dar loop:", err));
    startProgressUpdater();
  } else {
    stopProgressUpdater();
    updateProgress();
  }
});

// ---------------- Atalhos teclado ----------------
document.addEventListener("keydown", (e) => {
  if (e.code === "Digit0" || e.code === "Insert") {
    som.currentTime = 0;
    updateProgress();
    if (!som.paused) updateFire(som.volume);
    else if (fire) fire.style.opacity = "0";
  }
  if (e.code === "KeyK") togglePlayPause();
});

// ---------------- Contraste / Menu ----------------
const contrastBtn = document.getElementById("contrast-toggle");
if (contrastBtn) contrastBtn.addEventListener("click", () => document.body.classList.toggle("light-mode"));

const settingsToggle = document.getElementById("settings-toggle");
const settingsMenu = document.getElementById("settings-menu");
const settingsOverlay = document.getElementById("settings-overlay");

if (settingsToggle) settingsToggle.addEventListener("click", () => {
  settingsMenu.classList.toggle("active");
  settingsOverlay.classList.toggle("active");
});
if (settingsOverlay) settingsOverlay.addEventListener("click", () => {
  settingsMenu.classList.remove("active");
  settingsOverlay.classList.remove("active");
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    settingsMenu.classList.remove("active");
    settingsOverlay.classList.remove("active");
  }
});

// Evita arrastar imagens
document.querySelectorAll('img').forEach(img => img.ondragstart = () => false);

// ---------------- Troca de faixa ----------------
function changeTrack(index, autoPlay = true) {
  currentIndex = ((index % playlist.length) + playlist.length) % playlist.length;
  som.src = playlist[currentIndex];
  som.load();

  // Reseta barra e tempos
  progressFill.style.width = '0%';
  progressThumb.style.left = '0%';
  currentTimeEl.textContent = formatTime(0);
  totalTimeEl.textContent = formatTime(0);

  // Atualiza tempo total da nova faixa
  som.addEventListener("loadedmetadata", () => {
    totalTimeEl.textContent = formatTime(som.duration);
    updateProgress();
  }, { once: true });

  if (autoPlay) {
    som.play().catch(err => console.log("Erro ao tocar nova faixa:", err));
    updateFire(som.volume);
    startProgressUpdater();
    playAltBlock();
  }
}

// ---------------- Botões: loop / back / skip ----------------
loopBtn.addEventListener("click", () => {
  playAltBlock();
  isLooping = !isLooping;
  loopBtn.classList.toggle("active");
});
backBtn.addEventListener("click", () => changeTrack(currentIndex - 1, true));
skipBtn.addEventListener("click", () => changeTrack(currentIndex + 1, true));

// ---------------- Inicialização ----------------
window.addEventListener("load", () => {
  if (som) som.volume = 0.5;
  if (ampBar && ampSlider) {
    const barWidth = ampBar.offsetWidth;
    const sliderWidth = ampSlider.offsetWidth;
    ampSlider.style.left = `${som.volume * (barWidth - sliderWidth)}px`;
  }
  if (som.readyState >= 1) {
    totalTimeEl.textContent = formatTime(som.duration);
    updateProgress();
  }
});

