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
const volumePercentage = document.getElementById("volume-percentage");

const currentTimeEl = document.getElementById("current-time");
const totalTimeEl = document.getElementById("total-time");
const progressBar = document.getElementById("progress-bar");
const progressFill = document.getElementById("progress-fill");
const progressThumb = document.getElementById("progress-thumb");

const loopBtn = document.getElementById("loop-btn");
const backBtn = document.getElementById("back-btn");
const skipBtn = document.getElementById("skip-btn");

// Elementos da barra de pesquisa
const searchContainer = document.getElementById("search-container");
const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");

let ampToggle = true;
let draggingAmp = false;
let draggingProgress = false;
let progressInterval = null;
let volumePercentageTimeout = null;

// Variáveis para controle de atalhos
let shortcutsEnabled = true;
let searchActive = false;

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

// Playlist atualizada com informações completas
const playlist = [
  { 
    name: "Everlong", 
    artist: "Foo Fighters", 
    src: "msc/Everlong - Foo Fighters.mp3",
    image: "img/capa de everlong.jpg"
  },
  { 
    name: "Rooster (2022 Remaster)", 
    artist: "Alice in Chains", 
    src: "msc/Rooster (2022 Remaster) - Alice in Chains.mp3",
    image: "img/capa de rooster.jpeg"
  },
  { 
    name: "Tear Away", 
    artist: "Drowning Pool", 
    src: "msc/Tear Away - Drowning Pool.mp3",
    image: "img/capa de tear away.jpeg"
  },
  { 
    name: "Be Quiet and Drive (Far Away)", 
    artist: "Deftones", 
    src: "msc/Be Quiet and Drive (Far Away) - Deftones.mp3",
    image: "img/capa de be quiet and drive.jpeg"
  },
  { 
    name: "Creep (Acoustic)", 
    artist: "Radiohead", 
    src: "msc/Creep (Acoustic) - Radiohead.mp3",
    image: "img/capa de creep acoustic.jpeg"
  },
  { 
    name: "Given Up", 
    artist: "Linkin Park", 
    src: "msc/Given Up - Linkin Park.mp3",
    image: "img/capa de given up.jpeg"
  },
  { 
    name: "Sweet Child O' Mine", 
    artist: "Guns N' Roses", 
    src: "msc/Sweet Child O' Mine - Guns N' Roses.mp3",
    image: "img/capa de sweet child o mine.jpeg"
  },
  { 
    name: "Highway to Hell", 
    artist: "ACDC", 
    src: "msc/Highway to Hell - ACDC.mp3",
    image: "img/capa de highway to hell.jpeg"
  },
  { 
    name: "Two Faced", 
    artist: "Linkin Park", 
    src: "msc/Two Faced - Linkin Park.mp3",
    image: "img/capa de two faced.jpeg"
  },
  { 
    name: "Ride The Lightning", 
    artist: "Metallica", 
    src: "msc/Ride The Lightning - Metallica.mp3",
    image: "img/capa de ride the lightning.jpg"
  }
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
function updateVolumePercentage() {
  const percentage = Math.round(som.volume * 100);
  volumePercentage.textContent = `${percentage}%`;
  
  // Posicionar o indicador de porcentagem acima do slider
  const sliderRect = ampSlider.getBoundingClientRect();
  const barRect = ampBar.getBoundingClientRect();
  const sliderCenter = sliderRect.left + sliderRect.width / 2;
  const barLeft = barRect.left;
  
  volumePercentage.style.left = `${sliderCenter - barLeft}px`;
}

function showVolumePercentage() {
  volumePercentage.classList.add("show");
  
  // Limpar timeout anterior
  if (volumePercentageTimeout) {
    clearTimeout(volumePercentageTimeout);
  }
  
  // Esconder após 2 segundos
  volumePercentageTimeout = setTimeout(() => {
    if (!draggingAmp) {
      hideVolumePercentage();
    }
  }, 2000);
}

function hideVolumePercentage() {
  volumePercentage.classList.remove("show");
}

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
  
  updateVolumePercentage();
  showVolumePercentage();
}

function increaseVolume() {
  let newVolume = som.volume + 0.05;
  if (newVolume > 1) newVolume = 1;
  som.volume = newVolume;
  
  const barWidth = ampBar.offsetWidth;
  const sliderWidth = ampSlider.offsetWidth;
  ampSlider.style.left = `${som.volume * (barWidth - sliderWidth)}px`;
  
  if (!som.paused) updateFire(som.volume);
  updateVolumePercentage();
  showVolumePercentage();
  
  // Mostrar o controle se estiver escondido
  if (ampToggle && ampControl.style.display === "none") {
    ampControl.style.display = "flex";
  }
}

function decreaseVolume() {
  let newVolume = som.volume - 0.05;
  if (newVolume < 0) newVolume = 0;
  som.volume = newVolume;
  
  const barWidth = ampBar.offsetWidth;
  const sliderWidth = ampSlider.offsetWidth;
  ampSlider.style.left = `${som.volume * (barWidth - sliderWidth)}px`;
  
  if (!som.paused) updateFire(som.volume);
  updateVolumePercentage();
  showVolumePercentage();
  
  // Mostrar o controle se estiver escondido
  if (ampToggle && ampControl.style.display === "none") {
    ampControl.style.display = "flex";
  }
}

if (ampBar) ampBar.addEventListener("click", e => setVolumeByPosition(e.clientX));
if (ampSlider) ampSlider.addEventListener("mousedown", () => {
  draggingAmp = true;
  showVolumePercentage();
});
document.addEventListener("mouseup", () => {
  draggingAmp = false;
  setTimeout(hideVolumePercentage, 2000);
});
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
    updateVolumePercentage();
  } else {
    if (ampOff) ampOff.style.opacity = "1";
    setTimeout(() => { if (ampOff) ampOff.style.opacity = "0"; }, 300);
    if (ampControl) ampControl.style.display = "none";
    hideVolumePercentage();
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

// ---------------- Controle de atalhos ----------------
function toggleShortcuts(enabled) {
  shortcutsEnabled = enabled;
}

// ---------------- Barra de Pesquisa ----------------
let searchTimeout = null;
let selectedSearchIndex = -1;
let currentSearchResults = [];

// Função para pesquisar músicas com prioridade para início do nome
function searchSongs(query) {
  if (!query.trim()) {
    searchResults.innerHTML = '';
    currentSearchResults = [];
    selectedSearchIndex = -1;
    return;
  }

  const lowercaseQuery = query.toLowerCase();
  
  // Primeiro: músicas que começam com a query
  const startsWithMatches = playlist.filter(song => 
    song.name.toLowerCase().startsWith(lowercaseQuery) ||
    song.artist.toLowerCase().startsWith(lowercaseQuery)
  );
  
  // Segundo: músicas que contêm a query
  const containsMatches = playlist.filter(song => 
    (song.name.toLowerCase().includes(lowercaseQuery) ||
     song.artist.toLowerCase().includes(lowercaseQuery)) &&
    !startsWithMatches.includes(song)
  );

  // Combinar resultados (primeiro as que começam, depois as que contêm)
  currentSearchResults = [...startsWithMatches, ...containsMatches];
  selectedSearchIndex = -1;

  displaySearchResults(currentSearchResults);
}

// Função para exibir resultados da pesquisa
function displaySearchResults(results) {
  searchResults.innerHTML = '';

  if (results.length === 0) {
    const noResults = document.createElement('div');
    noResults.className = 'search-result-item';
    noResults.textContent = 'Nenhuma música encontrada';
    searchResults.appendChild(noResults);
    return;
  }

  results.forEach((song, index) => {
    const resultItem = document.createElement('div');
    resultItem.className = 'search-result-item';
    if (index === selectedSearchIndex) {
      resultItem.classList.add('selected');
    }
    
    resultItem.innerHTML = `
      <img src="${song.image}" alt="${song.name}" class="search-result-image" onerror="this.src='img/capa de everlong.jpg'">
      <div class="search-result-info">
        <div class="search-result-title">${song.name}</div>
        <div class="search-result-artist">${song.artist}</div>
      </div>
    `;

    resultItem.addEventListener('click', () => {
      const songIndex = playlist.findIndex(s => s.src === song.src);
      if (songIndex !== -1) {
        changeTrack(songIndex, true);
        searchResults.classList.remove('active');
        searchInput.value = '';
        currentSearchResults = [];
        selectedSearchIndex = -1;
      }
      playAltBlock();
    });

    searchResults.appendChild(resultItem);
  });
}

// Função para selecionar item na pesquisa
function selectSearchItem(index) {
  const items = searchResults.querySelectorAll('.search-result-item');
  items.forEach(item => item.classList.remove('selected'));
  
  if (index >= 0 && index < items.length) {
    items[index].classList.add('selected');
    items[index].scrollIntoView({ block: 'nearest' });
  }
}

// Função para tocar música selecionada na pesquisa
function playSelectedSearchItem() {
  if (selectedSearchIndex >= 0 && selectedSearchIndex < currentSearchResults.length) {
    const song = currentSearchResults[selectedSearchIndex];
    const songIndex = playlist.findIndex(s => s.src === song.src);
    if (songIndex !== -1) {
      changeTrack(songIndex, true);
      searchResults.classList.remove('active');
      searchInput.value = '';
      currentSearchResults = [];
      selectedSearchIndex = -1;
      playAltBlock();
    }
  }
}

// Função para abrir/fechar barra de pesquisa
function toggleSearch() {
  if (searchContainer.style.display === 'none' || searchContainer.style.display === '') {
    searchContainer.style.display = 'block';
    searchInput.focus();
  } else {
    searchContainer.style.display = 'none';
    searchResults.classList.remove('active');
    searchInput.value = '';
    currentSearchResults = [];
    selectedSearchIndex = -1;
  }
}

// Event listeners para a barra de pesquisa
searchInput.addEventListener('focus', () => {
  searchActive = true;
  toggleShortcuts(false);
  searchResults.classList.add('active');
});

searchInput.addEventListener('blur', () => {
  searchActive = false;
  setTimeout(() => {
    if (!searchInput.matches(':focus')) {
      toggleShortcuts(true);
    }
  }, 100);
});

searchInput.addEventListener('input', (e) => {
  const query = e.target.value;
  
  // Limpar timeout anterior
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  // Debounce para evitar muitas pesquisas
  searchTimeout = setTimeout(() => {
    searchSongs(query);
  }, 300);
});

// Event listener para teclas na pesquisa
searchInput.addEventListener('keydown', (e) => {
  if (!searchResults.classList.contains('active')) return;
  
  switch(e.key) {
    case 'ArrowDown':
      e.preventDefault();
      if (currentSearchResults.length > 0) {
        selectedSearchIndex = (selectedSearchIndex + 1) % currentSearchResults.length;
        selectSearchItem(selectedSearchIndex);
      }
      break;
      
    case 'ArrowUp':
      e.preventDefault();
      if (currentSearchResults.length > 0) {
        selectedSearchIndex = selectedSearchIndex <= 0 ? currentSearchResults.length - 1 : selectedSearchIndex - 1;
        selectSearchItem(selectedSearchIndex);
      }
      break;
      
    case 'Enter':
      e.preventDefault();
      if (selectedSearchIndex >= 0) {
        playSelectedSearchItem();
      } else if (currentSearchResults.length > 0) {
        // Se nenhum item está selecionado, toca o primeiro
        selectedSearchIndex = 0;
        playSelectedSearchItem();
      }
      break;
      
    case 'Escape':
      searchResults.classList.remove('active');
      searchInput.value = '';
      currentSearchResults = [];
      selectedSearchIndex = -1;
      break;
  }
});

// Fechar pesquisa ao clicar fora
document.addEventListener('click', (e) => {
  if (!searchContainer.contains(e.target)) {
    searchResults.classList.remove('active');
    currentSearchResults = [];
    selectedSearchIndex = -1;
  }
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
    updateQueueButtonShadow(); // Atualiza a sombra do botão
  }
  // Fecha a pesquisa se estiver aberta
  if (searchResults.classList.contains("active")) {
    searchResults.classList.remove("active");
    searchInput.value = "";
    searchResults.innerHTML = "";
    currentSearchResults = [];
    selectedSearchIndex = -1;
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
    updateQueueButtonShadow(); // Atualiza a sombra ao mudar o tema
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
      updateQueueButtonShadow(); // Atualiza a sombra do botão
      playAltBlock();
    } else if (searchResults.classList.contains("active")) {
      searchResults.classList.remove("active");
      searchInput.value = "";
      searchResults.innerHTML = "";
      currentSearchResults = [];
      selectedSearchIndex = -1;
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
  }

  updateQueuePanelCurrentSong(); // Atualiza a música atual na fila
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

// CORREÇÃO DO BUG: Função para atualizar a sombra do botão da fila
function updateQueueButtonShadow() {
  // A correção agora está no CSS usando seletor de irmão adjacente
  // Esta função apenas garante que o estado seja consistente
  if (queuePanel.classList.contains("active")) {
    queueBtn.classList.add("active");
  } else {
    queueBtn.classList.remove("active");
  }
}

// Função para abrir/fechar painel da fila
function toggleQueuePanel() {
  queuePanel.classList.toggle("active");
  updateQueueButtonShadow();
  if (queuePanel.classList.contains("active")) {
    populateQueuePanel(); // Garante que a lista esteja atualizada
  }
}

// NOVA FUNÇÃO: Popula o painel da fila com o novo layout
function populateQueuePanel() {
  songListEl.innerHTML = ""; // Limpa a lista existente
  playlist.forEach((song, index) => {
    const li = document.createElement("li");
    
    // Cria a estrutura do item da música
    li.innerHTML = `
      <img src="${song.image}" alt="${song.name}" class="song-image" onerror="this.src='img/capa de everlong.jpg'">
      <div class="song-info">
        <div class="song-title">${song.name}</div>
        <div class="song-artist">${song.artist}</div>
      </div>
    `;
    
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
    toggleQueuePanel();
  });
}

// ---------------- Novos atalhos do teclado ----------------
document.addEventListener("keydown", (e) => {
  // Se a pesquisa está ativa, desativa a maioria dos atalhos
  if (searchActive) {
    // Permite apenas Ctrl+K e Escape na pesquisa
    if ((e.ctrlKey && e.key === 'k') || e.key === 'Escape') {
      // Permite que esses atalhos funcionem
    } else {
      // Bloqueia outros atalhos quando a pesquisa está ativa
      return;
    }
  }

  // Se atalhos estão desativados, não executa
  if (!shortcutsEnabled) return;

  // Ctrl + K - Abrir/fechar pesquisa
  if (e.ctrlKey && e.key === 'k') {
    e.preventDefault();
    toggleSearch();
    return;
  }

  // Ctrl + A - Abrir/fechar volume (só funciona se menus estiverem fechados)
  if (e.ctrlKey && e.key === 'a') {
    if (!settingsMenu.classList.contains("active") && !queuePanel.classList.contains("active") && !searchActive) {
      e.preventDefault();
      if (ampToggle) {
        // Fecha a barra de volume
        ampToggle = false;
        if (ampControl) ampControl.style.display = "none";
        hideVolumePercentage();
        if (ampOff) {
          ampOff.style.opacity = "1";
          setTimeout(() => { if (ampOff) ampOff.style.opacity = "0"; }, 300);
        }
      } else {
        // Abre a barra de volume
        ampToggle = true;
        if (ampOn) {
          ampOn.style.opacity = "1";
          setTimeout(() => { if (ampOn) ampOn.style.opacity = "0"; }, 300);
        }
        if (ampControl) ampControl.style.display = "flex";
        const barWidth = ampBar ? ampBar.offsetWidth : 120;
        const sliderWidth = ampSlider ? ampSlider.offsetWidth : 20;
        if (ampSlider) ampSlider.style.left = `${som.volume * (barWidth - sliderWidth)}px`;
        updateVolumePercentage();
        showVolumePercentage();
      }
      playAltBlock();
      return;
    }
  }

  // Ctrl + J - Abrir/fechar fila
  if (e.ctrlKey && e.key === 'j') {
    e.preventDefault();
    toggleQueuePanel();
    playAltBlock();
    return;
  }

  // Ctrl + L - Ativar/desativar loop
  if (e.ctrlKey && e.key === 'l') {
    e.preventDefault();
    isLooping = !isLooping;
    loopBtn.classList.toggle("active");
    playAltBlock();
    return;
  }

  // Ctrl + . - Alternar tema
  if (e.ctrlKey && e.key === '.') {
    e.preventDefault();
    document.body.classList.toggle("light-mode");
    playAltBlock();
    updateQueueButtonShadow();
    return;
  }

  // J - Música anterior
  if (e.key === 'j' && !e.ctrlKey && !e.altKey && !e.metaKey) {
    e.preventDefault();
    playAltBlock();
    changeTrack(currentIndex - 1, true);
    return;
  }

  // L - Próxima música
  if (e.key === 'l' && !e.ctrlKey && !e.altKey && !e.metaKey) {
    e.preventDefault();
    playAltBlock();
    changeTrack(currentIndex + 1, true);
    return;
  }

  // Setas para avançar/retroceder 5 segundos
  if (e.key === 'ArrowLeft' && !e.ctrlKey && !e.altKey && !e.metaKey) {
    e.preventDefault();
    som.currentTime = Math.max(0, som.currentTime - 5);
    updateProgress();
    playAltBlock();
    return;
  }

  if (e.key === 'ArrowRight' && !e.ctrlKey && !e.altKey && !e.metaKey) {
    e.preventDefault();
    som.currentTime = Math.min(som.duration, som.currentTime + 5);
    updateProgress();
    playAltBlock();
    return;
  }

  // Setas para volume - SÓ FUNCIONAM COM AMP LIGADO
  if (e.key === 'ArrowUp' && !e.ctrlKey && !e.altKey && !e.metaKey) {
    e.preventDefault();
    // Só aumenta o volume se o amplificador estiver ligado e a barra de volume estiver visível
    if (ampToggle && ampControl.style.display === "flex") {
      increaseVolume();
    }
    return;
  }

  if (e.key === 'ArrowDown' && !e.ctrlKey && !e.altKey && !e.metaKey) {
    e.preventDefault();
    // Só diminui o volume se o amplificador estiver ligado e a barra de volume estiver visível
    if (ampToggle && ampControl.style.display === "flex") {
      decreaseVolume();
    }
    return;
  }

  // Atalhos originais (apenas se atalhos estiverem habilitados)
  if (shortcutsEnabled) {
    // Barra de espaço - Play/Pause
    if (e.code === "Space") {
      e.preventDefault(); // Previne scroll da página
      togglePlayPause();
    }
    
    // R - Reiniciar música do início
    if (e.code === "KeyR") {
      e.preventDefault();
      som.currentTime = 0;
      updateProgress();
      if (!som.paused) updateFire(som.volume);
      else if (fire) fire.style.opacity = "0";
    }
    
    // Atalhos originais mantidos
    if (e.code === "Digit0" || e.code === "Insert") {
      som.currentTime = 0;
      updateProgress();
      if (!som.paused) updateFire(som.volume);
      else if (fire) fire.style.opacity = "0";
    }
    if (e.code === "KeyK") togglePlayPause();
  }
});

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
  updateQueueButtonShadow(); // Inicializa a sombra do botão
  updateVolumePercentage(); // Inicializa a porcentagem do volume
});
