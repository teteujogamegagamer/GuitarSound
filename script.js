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
  { name: "Everlong - Foo Fighters", src: "msc/Everlong - Foo Fighters.mp3" },
  { name: "Rooster (2022 Remaster) - Alice in Chains", src: "msc/Rooster (2022 Remaster) - Alice in Chains.mp3" },
  { name: "Tear Away - Drowning Pool", src: "msc/Tear Away - Drowning Pool.mp3" },
  { name: "Be Quiet and Drive (Far Away) - Deftones", src: "msc/Be Quiet and Drive (Far Away) - Deftones.mp3" },
  { name: "Creep (Acoustic) - Radiohead", src: "msc/Creep (Acoustic) - Radiohead.mp3" },
];
let currentIndex = 0; // Começa na primeira música da playlist

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
  updateQueuePanelCurrentSong(); // Atualiza o estado da música atual na fila
}

guitarra.addEventListener("click", togglePlayPause);

// ---------------- Quando música termina ----------------
som.addEventListener("ended", () => {
  if (isLooping) {
    som.currentTime = 0;
    som.play().catch(err => console.log("Erro ao dar loop:", err));
    startProgressUpdater();
  } else {
    changeTrack(currentIndex + 1, true); // Toca a próxima música automaticamente
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
const settingsToggle = document.getElementById("settings-toggle");
const settingsMenu = document.getElementById("settings-menu");
const settingsOverlay = document.getElementById("settings-overlay");
const closeMenuBtn = document.getElementById("close-menu");

// Elementos do novo menu
const mainMenu = document.getElementById("main-menu");
const shortcutsBtn = document.getElementById("shortcuts-btn");
const creditsBtn = document.getElementById("credits-btn");
const shortcutsMenu = document.getElementById("shortcuts-menu");
const creditsMenu = document.getElementById("credits-menu");
const backShortcutsBtn = document.getElementById("back-shortcuts");
const backCreditsBtn = document.getElementById("back-credits");

const abrirMenu = document.getElementById("abrirMenu");
const fecharMenu = document.getElementById("fecharMenu");

// Estado do menu
let currentMenu = 'main'; // 'main', 'shortcuts', 'credits'
let menuToggle = true; // Para alternar entre abrir/fechar menu

function playMenuSound() {
  if (menuToggle) {
    if (abrirMenu) { 
      abrirMenu.currentTime = 0; 
      abrirMenu.play().catch(()=>{}); 
    }
  } else {
    if (fecharMenu) { 
      fecharMenu.currentTime = 0; 
      fecharMenu.play().catch(()=>{}); 
    }
  }
  menuToggle = !menuToggle;
}

function abrirMenuSite() {
  settingsMenu.classList.add("active");
  settingsOverlay.classList.add("active");
  showMainMenu();
  playMenuSound();
  // Fecha a fila de músicas se estiver aberta
  if (queuePanel.classList.contains("active")) {
    queuePanel.classList.remove("active");
  }
}

function fecharMenuSite() {
  settingsMenu.classList.remove("active");
  settingsOverlay.classList.remove("active");
  hideAllSubmenus();
  currentMenu = 'main';
  playMenuSound();
}

function showMainMenu() {
  mainMenu.style.display = 'flex';
  shortcutsMenu.classList.remove("active");
  creditsMenu.classList.remove("active");
  currentMenu = 'main';
}

function showShortcutsMenu() {
  mainMenu.style.display = 'none';
  shortcutsMenu.classList.add("active");
  creditsMenu.classList.remove("active");
  currentMenu = 'shortcuts';
}

function showCreditsMenu() {
  mainMenu.style.display = 'none';
  shortcutsMenu.classList.remove("active");
  creditsMenu.classList.add("active");
  currentMenu = 'credits';
}

function hideAllSubmenus() {
  mainMenu.style.display = 'flex';
  shortcutsMenu.classList.remove("active");
  creditsMenu.classList.remove("active");
  currentMenu = 'main';
}

function clickAnimation(el) {
  if (!el) return;
  el.style.transform = "scale(0.9)";
  setTimeout(() => el.style.transform = "scale(1)", 150);
}

if (contrastBtn) {
  contrastBtn.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    clickAnimation(contrastBtn);
    playAltBlock();
  });
}

if (settingsToggle) {
  settingsToggle.addEventListener("click", () => {
    if (settingsMenu.classList.contains("active")) {
      fecharMenuSite();
    } else {
      abrirMenuSite();
    }
    clickAnimation(settingsToggle);
    // Não chama playAltBlock() aqui - apenas o som do menu será tocado
  });
}

if (closeMenuBtn) {
  closeMenuBtn.addEventListener("click", () => {
    clickAnimation(closeMenuBtn);
    fecharMenuSite();
  });
}

if (settingsOverlay) {
  settingsOverlay.addEventListener("click", () => {
    fecharMenuSite();
  });
}

// Event listeners para os botões do menu
if (shortcutsBtn) {
  shortcutsBtn.addEventListener("click", () => {
    clickAnimation(shortcutsBtn);
    playAltBlock();
    showShortcutsMenu();
  });
}

if (creditsBtn) {
  creditsBtn.addEventListener("click", () => {
    clickAnimation(creditsBtn);
    playAltBlock();
    showCreditsMenu();
  });
}

if (backShortcutsBtn) {
  backShortcutsBtn.addEventListener("click", () => {
    clickAnimation(backShortcutsBtn);
    playAltBlock();
    showMainMenu();
  });
}

if (backCreditsBtn) {
  backCreditsBtn.addEventListener("click", () => {
    clickAnimation(backCreditsBtn);
    playAltBlock();
    showMainMenu();
  });
}

// Navegação com ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (settingsMenu.classList.contains("active")) {
      if (currentMenu === 'main') {
        fecharMenuSite();
      } else {
        // Se está em um submenu, volta para o menu principal
        showMainMenu();
        playAltBlock();
      }
    } else if (queuePanel.classList.contains("active")) {
      queuePanel.classList.remove("active");
      playAltBlock();
    } else {
      abrirMenuSite();
    }
  }
});

// Evita arrastar imagens
document.querySelectorAll('img').forEach(img => img.ondragstart = () => false);

// ---------------- Troca de faixa ----------------
function changeTrack(index, autoPlay = true) {
  currentIndex = ((index % playlist.length) + playlist.length) % playlist.length;
  som.src = playlist[currentIndex].src;
  som.load();

  progressFill.style.width = '0%';
  progressThumb.style.left = '0%';
  currentTimeEl.textContent = formatTime(0);
  totalTimeEl.textContent = formatTime(0);

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
  updateQueuePanelCurrentSong(); // Atualiza a classe 'current-song'
}

// ---------------- Botões: loop / back / skip ----------------
loopBtn.addEventListener("click", () => {
  playAltBlock();
  isLooping = !isLooping;
  loopBtn.classList.toggle("active");
});
backBtn.addEventListener("click", () => {
  playAltBlock();
  changeTrack(currentIndex - 1, true);
});
skipBtn.addEventListener("click", () => {
  playAltBlock();
  changeTrack(currentIndex + 1, true);
});

// ---------------- Queue Button e Panel ----------------
const queueBtn = document.getElementById("queue-btn");
const queuePanel = document.getElementById("queue-panel");
const songListEl = document.getElementById("song-list");
const queueScrollbar = document.getElementById("queue-scrollbar");
const queueScrollThumb = document.getElementById("queue-scroll-thumb");

let draggingQueueScroll = false;

function populateQueuePanel() {
  songListEl.innerHTML = ""; // Limpa a lista existente
  playlist.forEach((song, index) => {
    const li = document.createElement("li");
    li.textContent = song.name;
    li.dataset.index = index; // Armazena o índice da música
    li.addEventListener("click", () => {
      if (index !== currentIndex) {
        changeTrack(index, true); // Toca a música clicada
      }
      playAltBlock();
    });
    songListEl.appendChild(li);
  });
  updateQueuePanelCurrentSong(); // Marca a música atual
  updateQueueScrollbar(); // Atualiza a scrollbar ao popular
}

function updateQueuePanelCurrentSong() {
  const listItems = songListEl.querySelectorAll("li");
  listItems.forEach((item, index) => {
    if (index === currentIndex) {
      item.classList.add("current-song");
      // Scroll para a música atual, se necessário
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      item.classList.remove("current-song");
    }
  });
  updateQueueScrollbar(); // Atualiza a scrollbar quando a música muda
}

function updateQueueScrollbar() {
  if (!songListEl || !queueScrollbar || !queueScrollThumb) return;

  const contentHeight = songListEl.scrollHeight;
  const viewportHeight = songListEl.clientHeight;

  if (contentHeight > viewportHeight) {
    queueScrollbar.style.display = 'block'; // Mostra a scrollbar
    const thumbHeight = Math.max(20, (viewportHeight / contentHeight) * viewportHeight);
    queueScrollThumb.style.height = `${thumbHeight}px`;

    const thumbPosition = (songListEl.scrollTop / (contentHeight - viewportHeight)) * (viewportHeight - thumbHeight);
    queueScrollThumb.style.top = `${thumbPosition}px`;
  } else {
    queueScrollbar.style.display = 'none'; // Esconde a scrollbar
  }
}

// Event listeners para a scrollbar personalizada
queueScrollThumb.addEventListener('mousedown', (e) => {
  draggingQueueScroll = true;
  queueScrollThumb.classList.add('active');
  const startY = e.clientY;
  const startTop = queueScrollThumb.offsetTop;
  const contentHeight = songListEl.scrollHeight;
  const viewportHeight = songListEl.clientHeight;
  const scrollbarHeight = queueScrollbar.clientHeight;
  const thumbHeight = queueScrollThumb.offsetHeight;

  const onMouseMove = (moveEvent) => {
    if (!draggingQueueScroll) return;
    const deltaY = moveEvent.clientY - startY;
    let newTop = startTop + deltaY;

    newTop = Math.max(0, Math.min(newTop, scrollbarHeight - thumbHeight));
    queueScrollThumb.style.top = `${newTop}px`;

    const scrollRatio = newTop / (scrollbarHeight - thumbHeight);
    songListEl.scrollTop = scrollRatio * (contentHeight - viewportHeight);
  };

  const onMouseUp = () => {
    draggingQueueScroll = false;
    queueScrollThumb.classList.remove('active');
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
});

// Atualiza o thumb da scrollbar quando a lista é rolada
songListEl.addEventListener('scroll', updateQueueScrollbar);
// Atualiza a scrollbar quando o tamanho da janela muda (para responsividade)
window.addEventListener('resize', updateQueueScrollbar);

if (queueBtn) {
  queueBtn.addEventListener("click", () => {
    clickAnimation(queueBtn);
    playAltBlock();
    queuePanel.classList.toggle("active");
    if (queuePanel.classList.contains("active")) {
      populateQueuePanel(); // Garante que a lista esteja atualizada
    }
  });
}

// ---------------- Inicialização ----------------
window.addEventListener("load", () => {
  if (som) som.volume = 0.5;
  if (ampBar && ampSlider) {
    const barWidth = ampBar.offsetWidth;
    const sliderWidth = ampSlider.offsetWidth;
    ampSlider.style.left = `${som.volume * (barWidth - sliderWidth)}px`;
  }

  // Define a primeira música e carrega metadados
  som.src = playlist[currentIndex].src;
  som.load();

  som.addEventListener("loadedmetadata", () => {
    totalTimeEl.textContent = formatTime(som.duration);
    updateProgress();
  }, { once: true });

  populateQueuePanel(); // Popula o painel da fila na carga inicial
});
