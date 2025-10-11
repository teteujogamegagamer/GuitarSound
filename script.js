// ---------------- UTILITÁRIOS DE SEGURANÇA ----------------
function safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Elemento não encontrado: ${id}`);
    }
    return element;
}

function safeQuery(selector) {
    try {
        return document.querySelector(selector);
    } catch (error) {
        console.warn('Erro ao buscar elemento:', selector, error);
        return null;
    }
}

function safeAddEventListener(element, event, handler) {
    if (element && typeof handler === 'function') {
        element.addEventListener(event, handler);
    }
}

// ---------------- TRATAMENTO DE ERROS DE ÁUDIO ----------------
class AudioErrorHandler {
    static init(audioElement) {
        if (!audioElement) return;
        
        audioElement.addEventListener('error', (e) => {
            console.error('Erro de áudio:', e);
            this.handleAudioError(audioElement);
        });

        audioElement.addEventListener('loadstart', () => {
            this.showLoadingState();
        });

        audioElement.addEventListener('canplay', () => {
            this.hideLoadingState();
        });

        audioElement.addEventListener('waiting', () => {
            this.showLoadingState();
        });

        audioElement.addEventListener('playing', () => {
            this.hideLoadingState();
        });
    }

    static handleAudioError(audioElement) {
        const error = audioElement.error;
        let message = 'Erro ao carregar áudio';

        if (error) {
            switch (error.code) {
                case error.MEDIA_ERR_ABORTED:
                    message = 'Reprodução cancelada';
                    break;
                case error.MEDIA_ERR_NETWORK:
                    message = 'Erro de rede';
                    break;
                case error.MEDIA_ERR_DECODE:
                    message = 'Formato não suportado';
                    break;
                case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    message = 'Fonte de áudio não suportada';
                    break;
            }
        }

        this.showError(message);
        console.error('Erro de áudio:', message, error);
    }

    static showLoadingState() {
        const loadingEl = safeGetElement('loading-state');
        if (loadingEl) {
            loadingEl.classList.add('show');
        }
    }

    static hideLoadingState() {
        const loadingEl = safeGetElement('loading-state');
        if (loadingEl) {
            loadingEl.classList.remove('show');
        }
    }

    static showError(message) {
        const statusEl = safeGetElement('player-status');
        if (statusEl) {
            statusEl.textContent = message;
        }
        console.error('Erro do player:', message);
    }
}

// ---------------- MANIPULAÇÃO DE IMAGENS COM FALLBACK ----------------
function setupImageErrorHandling() {
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', function() {
            handleImageError(this);
        });
    });
}

function handleImageError(img) {
    console.warn('Erro ao carregar imagem:', img.src);
    
    // Fallback hierárquico
    const fallbacks = [
        'img/capas/capa de everlong.jpg', // Tenta a capa padrão primeiro
        'img/guitar logo.png'             // Fallback final
    ];
    
    let currentFallback = 0;
    const tryNextFallback = () => {
        if (currentFallback < fallbacks.length) {
            img.src = fallbacks[currentFallback++];
        } else {
            // Remove o listener para evitar loop infinito
            img.removeEventListener('error', handleImageError);
        }
    };
    
    img.onerror = tryNextFallback;
    tryNextFallback();
}

// ---------------- SELEÇÃO DE ELEMENTOS COM VALIDAÇÃO ----------------
const guitarra = safeGetElement("guitarra");
const som = safeGetElement("som");
const playIcon = safeGetElement("play-icon");
const pauseIcon = safeGetElement("pause-icon");
const fire = safeGetElement("fire");

const block1 = safeGetElement("block1");
const block2 = safeGetElement("block2");

const amp = safeGetElement("amp");
const ampOn = safeGetElement("amp-on");
const ampOff = safeGetElement("amp-off");
const ampControl = safeQuery(".amp-control");
const ampBar = safeGetElement("amp-bar");
const ampSlider = safeGetElement("amp-slider");
const volumePercentage = safeGetElement("volume-percentage");

const currentTimeEl = safeGetElement("current-time");
const totalTimeEl = safeGetElement("total-time");
const progressBar = safeGetElement("progress-bar");
const progressFill = safeGetElement("progress-fill");
const progressThumb = safeGetElement("progress-thumb");

const loopBtn = safeGetElement("loop-btn");
const backBtn = safeGetElement("back-btn");
const skipBtn = safeGetElement("skip-btn");

// Elementos da barra de pesquisa
const searchContainer = safeGetElement("search-container");
const searchInput = safeGetElement("search-input");
const searchResults = safeGetElement("search-results");

// Elementos do menu de customização de guitarra
const guitarCustomizationOverlay = safeGetElement("guitar-customization-overlay");
const guitarCustomizationMenu = safeGetElement("guitar-customization-menu");
const closeGuitarMenuBtn = safeGetElement("close-guitar-menu");
const guitarGrid = safeGetElement("guitar-grid");
const categoryTabs = document.querySelectorAll(".category-tab");

// Variáveis de estado
let ampToggle = true;
let draggingAmp = false;
let draggingProgress = false;
let progressInterval = null;
let volumePercentageTimeout = null;
let shortcutsEnabled = true;
let searchActive = false;
let guitarMenuOpen = false;

// alternador de bloco de som
let toggleBlock = true;

function playEffect(audioElement) {
    if (!audioElement) return;
    try {
        audioElement.currentTime = 0;
        audioElement.play().catch(err => console.log("Erro efeito:", err));
    } catch (error) {
        console.error("Erro ao reproduzir efeito:", error);
    }
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

// Playlist atualizada com fallback de imagens corrigido
const playlist = [
    { 
        name: "Everlong", 
        artist: "Foo Fighters", 
        src: "msc/Everlong - Foo Fighters.mp3",
        image: "img/capas/capa de everlong.jpg"
    },
    { 
        name: "Rooster (2022 Remaster)", 
        artist: "Alice in Chains", 
        src: "msc/Rooster (2022 Remaster) - Alice in Chains.mp3",
        image: "img/capas/capa de rooster.jpeg"
    },
    { 
        name: "Tear Away", 
        artist: "Drowning Pool", 
        src: "msc/Tear Away - Drowning Pool.mp3",
        image: "img/capas/capa de tear away.jpeg"
    },
    { 
        name: "Be Quiet and Drive (Far Away)", 
        artist: "Deftones", 
        src: "msc/Be Quiet and Drive (Far Away) - Deftones.mp3",
        image: "img/capas/capa de be quiet and drive.jpeg"
    },
    { 
        name: "Creep (Acoustic)", 
        artist: "Radiohead", 
        src: "msc/Creep (Acoustic) - Radiohead.mp3",
        image: "img/capas/capa de creep acoustic.jpeg"
    },
    { 
        name: "Given Up", 
        artist: "Linkin Park", 
        src: "msc/Given Up - Linkin Park.mp3",
        image: "img/capas/capa de given up.jpeg"
    },
    { 
        name: "Sweet Child O' Mine", 
        artist: "Guns N' Roses", 
        src: "msc/Sweet Child O' Mine - Guns N' Roses.mp3",
        image: "img/capas/capa de sweet child o mine.jpeg"
    },
    { 
        name: "Highway to Hell", 
        artist: "ACDC", 
        src: "msc/Highway to Hell - ACDC.mp3",
        image: "img/capas/capa de highway to hell.jpeg"
    },
    { 
        name: "Two Faced", 
        artist: "Linkin Park", 
        src: "msc/Two Faced - Linkin Park.mp3",
        image: "img/capas/capa de two faced.jpeg"
    },
    { 
        name: "Ride The Lightning", 
        artist: "Metallica", 
        src: "msc/Ride The Lightning - Metallica.mp3",
        image: "img/capas/capa de ride the lightning.jpg"
    }
];
let currentIndex = 0;

// ---------------- CATÁLOGO DE GUITARRAS ----------------
const guitarCatalog = {
    stratocasters: [
        { 
            name: "Stratocaster Ciano", 
            src: "guitars/PHX Ciano.png",
            selected: true
        },
        { 
            name: "Stratocaster Vermelha", 
            src: "guitars/Stratocaster-PHX-Vermelho.png"
        },
        { 
            name: "Stratocaster Preta", 
            src: "guitars/Stratocaster/cor preta.png"
        },
        { 
            name: "Stratocaster Branca", 
            src: "guitars/Stratocaster-PHX-Branca.png"
        },
        { 
            name: "Stratocaster Sunburst", 
            src: "guitars/Stratocaster-PHX-Sunburst.png"
        }
    ],
    warlocks: [
        { 
            name: "Warlock Preta", 
            src: "guitars/Warlock-Preta.png"
        },
        { 
            name: "Warlock Vermelha", 
            src: "guitars/Warlock-Vermelha.png"
        },
        { 
            name: "Warlock Azul", 
            src: "guitars/Warlock-Azul.png"
        }
    ],
    acusticos: [
        { 
            name: "Violão Clássico", 
            src: "guitars/acoustic guitar.png"
        },
        { 
            name: "Violão Folk", 
            src: "guitars/Violao-Folk.png"
        },
        { 
            name: "Violão 12 Cordas", 
            src: "guitars/Violao-12-Cordas.png"
        }
    ]
};

// ---------------- FUNÇÕES DO MENU DE CUSTOMIZAÇÃO ----------------
function openGuitarCustomizationMenu() {
    if (!guitarCustomizationMenu || !guitarCustomizationOverlay) return;
    
    guitarCustomizationMenu.classList.add("active");
    guitarCustomizationOverlay.classList.add("active");
    guitarMenuOpen = true;
    
    // Carrega a primeira categoria por padrão
    loadGuitarCategory('stratocasters');
    
    // Fecha outros menus se estiverem abertos
    if (settingsMenu && settingsMenu.classList.contains("active")) {
        settingsMenu.classList.remove("active");
        settingsOverlay.classList.remove("active");
    }
    
    if (queuePanel && queuePanel.classList.contains("active")) {
        queuePanel.classList.remove("active");
        updateQueueButtonShadow();
    }
    
    // Fecha a pesquisa se estiver aberta
    if (searchResults && searchResults.classList.contains("active")) {
        searchResults.classList.remove("active");
        if (searchInput) searchInput.value = "";
        if (searchResults) searchResults.innerHTML = "";
        currentSearchResults = [];
        selectedSearchIndex = -1;
        searchActive = false;
        toggleShortcuts(true);
    }
    
    playAltBlock();
}

function closeGuitarCustomizationMenu() {
    if (!guitarCustomizationMenu || !guitarCustomizationOverlay) return;
    
    guitarCustomizationMenu.classList.remove("active");
    guitarCustomizationOverlay.classList.remove("active");
    guitarMenuOpen = false;
    playAltBlock();
}

function loadGuitarCategory(category) {
    if (!guitarGrid) {
        console.error('Elemento guitar-grid não encontrado!');
        return;
    }
    
    console.log('Carregando categoria:', category);
    
    // Atualiza as abas ativas
    categoryTabs.forEach(tab => {
        if (tab.dataset.category === category) {
            tab.classList.add("active");
        } else {
            tab.classList.remove("active");
        }
    });
    
    // Limpa o grid
    guitarGrid.innerHTML = "";
    
    // Carrega as guitarras da categoria
    const guitars = guitarCatalog[category] || [];
    console.log('Guitarras encontradas:', guitars.length);
    
    if (guitars.length === 0) {
        console.warn('Nenhuma guitarra encontrada na categoria:', category);
        guitarGrid.innerHTML = '<div class="no-guitars">Nenhuma guitarra encontrada</div>';
        return;
    }
    
    guitars.forEach((guitar, index) => {
        const guitarItem = document.createElement("div");
        guitarItem.className = "guitar-item";
        if (guitar.selected) {
            guitarItem.classList.add("selected");
        }
        
        // Adiciona tratamento de erro para cada imagem
        guitarItem.innerHTML = `
            <img src="${guitar.src}" alt="${guitar.name}" class="guitar-image" onerror="this.src='guitars/Stratocaster-PHX-Ciano de teteujoga.png'">
            <div class="guitar-name">${guitar.name}</div>
        `;
        
        guitarItem.addEventListener("click", () => {
            console.log('Clicou na guitarra:', guitar.name);
            selectGuitar(guitar.src, category, index);
        });
        
        guitarGrid.appendChild(guitarItem);
    });
    
    console.log('Categoria carregada com sucesso!');
}

function selectGuitar(guitarSrc, category, index) {
    console.log('Tentando selecionar guitarra:', guitarSrc);
    console.log('Categoria:', category);
    console.log('Índice:', index);
    
    // Verifica se o elemento da guitarra existe
    if (!guitarra) {
        console.error('Elemento da guitarra não encontrado!');
        return;
    }
    
    // Atualiza a imagem da guitarra principal
    console.log('Alterando src da guitarra para:', guitarSrc);
    guitarra.src = guitarSrc;
    
    // Força o recarregamento da imagem
    guitarra.onload = function() {
        console.log('Imagem da guitarra carregada com sucesso!');
    };
    
    guitarra.onerror = function() {
        console.error('Erro ao carregar imagem da guitarra:', guitarSrc);
        // Tenta um fallback
        guitarra.src = 'guitars/Stratocaster-PHX-Ciano de teteujoga.png';
    };
    
    // Atualiza o estado de seleção em todas as categorias
    Object.keys(guitarCatalog).forEach(cat => {
        guitarCatalog[cat].forEach((guitar, i) => {
            guitar.selected = (cat === category && i === index);
        });
    });
    
    // Atualiza a visualização no grid
    const guitarItems = guitarGrid.querySelectorAll(".guitar-item");
    guitarItems.forEach(item => item.classList.remove("selected"));
    
    if (guitarItems[index]) {
        guitarItems[index].classList.add("selected");
    }
    
    console.log('Guitarra selecionada com sucesso!');
    playAltBlock();
}

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

// ---------------- Volume do amplificador COM VALIDAÇÃO ----------------
function updateVolumePercentage() {
    if (!volumePercentage || !ampSlider || !ampBar) return;
    
    try {
        const percentage = Math.round(som.volume * 100);
        volumePercentage.textContent = `${percentage}%`;
        
        const sliderRect = ampSlider.getBoundingClientRect();
        const barRect = ampBar.getBoundingClientRect();
        const sliderCenter = sliderRect.left + sliderRect.width / 2;
        const barLeft = barRect.left;
        
        volumePercentage.style.left = `${sliderCenter - barLeft}px`;
    } catch (error) {
        console.error('Erro ao atualizar porcentagem do volume:', error);
    }
}

function showVolumePercentage() {
    if (!volumePercentage) return;
    
    volumePercentage.classList.add("show");
    
    if (volumePercentageTimeout) {
        clearTimeout(volumePercentageTimeout);
    }
    
    volumePercentageTimeout = setTimeout(() => {
        if (!draggingAmp) {
            hideVolumePercentage();
        }
    }, 2000);
}

function hideVolumePercentage() {
    if (!volumePercentage) return;
    volumePercentage.classList.remove("show");
}

function setVolumeByPosition(clientX) {
    if (!ampBar || !ampSlider) return;
    
    try {
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
    } catch (error) {
        console.error('Erro ao definir volume:', error);
    }
}

function increaseVolume() {
    if (!som || !ampSlider || !ampBar) return;
    
    try {
        let newVolume = som.volume + 0.05;
        if (newVolume > 1) newVolume = 1;
        som.volume = newVolume;
        
        const barWidth = ampBar.offsetWidth;
        const sliderWidth = ampSlider.offsetWidth;
        ampSlider.style.left = `${som.volume * (barWidth - sliderWidth)}px`;
        
        if (!som.paused) updateFire(som.volume);
        updateVolumePercentage();
        showVolumePercentage();
        
        if (ampToggle && ampControl && ampControl.style.display === "none") {
            ampControl.style.display = "flex";
        }
    } catch (error) {
        console.error('Erro ao aumentar volume:', error);
    }
}

function decreaseVolume() {
    if (!som || !ampSlider || !ampBar) return;
    
    try {
        let newVolume = som.volume - 0.05;
        if (newVolume < 0) newVolume = 0;
        som.volume = newVolume;
        
        const barWidth = ampBar.offsetWidth;
        const sliderWidth = ampSlider.offsetWidth;
        ampSlider.style.left = `${som.volume * (barWidth - sliderWidth)}px`;
        
        if (!som.paused) updateFire(som.volume);
        updateVolumePercentage();
        showVolumePercentage();
        
        if (ampToggle && ampControl && ampControl.style.display === "none") {
            ampControl.style.display = "flex";
        }
    } catch (error) {
        console.error('Erro ao diminuir volume:', error);
    }
}

// Event listeners seguros para volume
safeAddEventListener(ampBar, "click", e => setVolumeByPosition(e.clientX));
safeAddEventListener(ampSlider, "mousedown", () => {
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

// ---------------- Amp click COM VALIDAÇÃO ----------------
function toggleAmp() {
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
}

safeAddEventListener(amp, "click", toggleAmp);

// ---------------- Barra de progresso COM VALIDAÇÃO ----------------
function updateProgress() {
    if (!som || !progressFill || !progressThumb || !currentTimeEl) return;
    
    try {
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
    } catch (error) {
        console.error('Erro ao atualizar progresso:', error);
    }
}

function setProgressByPosition(clientX) {
    if (!progressBar || !som) return;
    
    try {
        const rect = progressBar.getBoundingClientRect();
        let x = clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const percent = x / rect.width;
        som.currentTime = percent * som.duration;
        updateProgress();
    } catch (error) {
        console.error('Erro ao definir progresso:', error);
    }
}

safeAddEventListener(progressBar, "click", e => setProgressByPosition(e.clientX));
safeAddEventListener(progressThumb, "mousedown", () => draggingProgress = true);

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

// ---------------- Play / Pause COM VALIDAÇÃO ----------------
function togglePlayPause() {
    if (!som) return;
    
    try {
        if (som.paused) {
            som.play().catch(err => {
                console.log("Erro música:", err);
                AudioErrorHandler.handleAudioError(som);
            });
            showIcon(playIcon);
            playAltBlock();
            updateFire(som.volume);
            startProgressUpdater();
            updatePlayerStatus("Reproduzindo");
        } else {
            som.pause();
            showIcon(pauseIcon);
            playAltBlock();
            if (fire) fire.style.opacity = "0";
            stopProgressUpdater();
            updatePlayerStatus("Pausado");
        }
        updateQueuePanelCurrentSong();
    } catch (error) {
        console.error('Erro ao alternar play/pause:', error);
    }
}

function updatePlayerStatus(status) {
    const statusEl = safeGetElement('player-status');
    const currentSong = playlist[currentIndex];
    if (statusEl && currentSong) {
        statusEl.textContent = `${status}: ${currentSong.name} - ${currentSong.artist}`;
    }
}

safeAddEventListener(guitarra, "click", togglePlayPause);

// ---------------- Quando música termina COM VALIDAÇÃO ----------------
safeAddEventListener(som, "ended", () => {
    try {
        if (isLooping) {
            som.currentTime = 0;
            som.play().catch(err => {
                console.log("Erro ao dar loop:", err);
                AudioErrorHandler.handleAudioError(som);
            });
            startProgressUpdater();
        } else {
            changeTrack(currentIndex + 1, true);
        }
    } catch (error) {
        console.error('Erro ao tratar fim da música:', error);
    }
});

// ---------------- Controle de atalhos ----------------
function toggleShortcuts(enabled) {
    shortcutsEnabled = enabled;
}

// ---------------- Barra de Pesquisa COM DEBOUNCE MELHORADO ----------------
let searchTimeout = null;
let selectedSearchIndex = -1;
let currentSearchResults = [];

// Debounce melhorado
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Função para pesquisar músicas
function searchSongs(query) {
    if (!query.trim()) {
        if (searchResults) searchResults.innerHTML = '';
        currentSearchResults = [];
        selectedSearchIndex = -1;
        return;
    }

    const lowercaseQuery = query.toLowerCase();
    
    const startsWithMatches = playlist.filter(song => 
        song.name.toLowerCase().startsWith(lowercaseQuery) ||
        song.artist.toLowerCase().startsWith(lowercaseQuery)
    );
    
    const containsMatches = playlist.filter(song => 
        (song.name.toLowerCase().includes(lowercaseQuery) ||
         song.artist.toLowerCase().includes(lowercaseQuery)) &&
        !startsWithMatches.includes(song)
    );

    currentSearchResults = [...startsWithMatches, ...containsMatches];
    selectedSearchIndex = -1;

    displaySearchResults(currentSearchResults);
}

// Debounced search function
const debouncedSearch = debounce(searchSongs, 300);

// Função para exibir resultados da pesquisa
function displaySearchResults(results) {
    if (!searchResults) return;
    
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
        
        // Usando template string sem onerror - o fallback é tratado pelo setupImageErrorHandling
        resultItem.innerHTML = `
            <img src="${song.image}" alt="${song.name}" class="search-result-image">
            <div class="search-result-info">
                <div class="search-result-title">${song.name}</div>
                <div class="search-result-artist">${song.artist}</div>
            </div>
        `;

        resultItem.addEventListener('click', () => {
            const songIndex = playlist.findIndex(s => s.src === song.src);
            if (songIndex !== -1) {
                changeTrack(songIndex, true);
                if (searchResults) searchResults.classList.remove('active');
                if (searchInput) searchInput.value = '';
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
    const items = searchResults ? searchResults.querySelectorAll('.search-result-item') : [];
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
            if (searchResults) searchResults.classList.remove('active');
            if (searchInput) searchInput.value = '';
            currentSearchResults = [];
            selectedSearchIndex = -1;
            playAltBlock();
        }
    }
}

// Função para abrir/fechar barra de pesquisa
function toggleSearch() {
    if (!searchContainer) return;
    
    if (searchContainer.style.display === 'none' || searchContainer.style.display === '') {
        searchContainer.style.display = 'block';
        if (searchInput) searchInput.focus();
        if (searchResults) searchResults.classList.add('active');
        searchActive = true;
        toggleShortcuts(false);
    } else {
        searchContainer.style.display = 'none';
        if (searchResults) searchResults.classList.remove('active');
        if (searchInput) searchInput.value = '';
        currentSearchResults = [];
        selectedSearchIndex = -1;
        searchActive = false;
        toggleShortcuts(true);
    }
}

// Event listeners para a barra de pesquisa
safeAddEventListener(searchInput, 'focus', () => {
    searchActive = true;
    toggleShortcuts(false);
    if (searchResults) searchResults.classList.add('active');
});

safeAddEventListener(searchInput, 'blur', () => {
    setTimeout(() => {
        if (searchInput && !searchInput.matches(':focus') && searchResults && !searchResults.matches(':hover')) {
            searchActive = false;
            toggleShortcuts(true);
        }
    }, 100);
});

safeAddEventListener(searchInput, 'input', (e) => {
    const query = e.target.value;
    debouncedSearch(query);
});

// Event listener para teclas na pesquisa
safeAddEventListener(searchInput, 'keydown', (e) => {
    if (!searchResults || !searchResults.classList.contains('active')) return;
    
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
                selectedSearchIndex = 0;
                playSelectedSearchItem();
            }
            break;
            
        case 'Escape':
            e.preventDefault();
            if (searchResults) searchResults.classList.remove('active');
            if (searchInput) searchInput.value = '';
            currentSearchResults = [];
            selectedSearchIndex = -1;
            if (searchInput) searchInput.blur();
            searchActive = false;
            toggleShortcuts(true);
            return;
    }
});

// Fechar pesquisa ao clicar fora
document.addEventListener('click', (e) => {
    if (searchContainer && !searchContainer.contains(e.target) && !e.target.closest('#search-results')) {
        if (searchResults) searchResults.classList.remove('active');
        currentSearchResults = [];
        selectedSearchIndex = -1;
    }
});

// ---------------- Contraste / Menu ----------------
const contrastBtn = safeGetElement("contrast-toggle");
const settingsToggle = safeGetElement("settings-toggle");
const settingsMenu = safeGetElement("settings-menu");
const settingsOverlay = safeGetElement("settings-overlay");
const closeMenuBtn = safeGetElement("close-menu");

// Elementos do novo menu
const mainMenu = safeGetElement("main-menu");
const shortcutsBtn = safeGetElement("shortcuts-btn");
const creditsBtn = safeGetElement("credits-btn");
const shortcutsMenu = safeGetElement("shortcuts-menu");
const creditsMenu = safeGetElement("credits-menu");
const backShortcutsBtn = safeGetElement("back-shortcuts");
const backCreditsBtn = safeGetElement("back-credits");

const abrirMenu = safeGetElement("abrirMenu");
const fecharMenu = safeGetElement("fecharMenu");

// Elemento do pincel
const brushToggle = safeGetElement("brush-toggle");

// Estado do menu
let currentMenu = 'main';
let menuToggle = true;
let selectedMenuIndex = -1;

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
    if (!settingsMenu || !settingsOverlay) return;
    
    settingsMenu.classList.add("active");
    settingsOverlay.classList.add("active");
    showMainMenu();
    playMenuSound();
    
    // Fecha a fila de músicas se estiver aberta
    if (queuePanel && queuePanel.classList.contains("active")) {
        queuePanel.classList.remove("active");
        updateQueueButtonShadow();
    }
    
    // Fecha a pesquisa se estiver aberta
    if (searchResults && searchResults.classList.contains("active")) {
        searchResults.classList.remove("active");
        if (searchInput) searchInput.value = "";
        if (searchResults) searchResults.innerHTML = "";
        currentSearchResults = [];
        selectedSearchIndex = -1;
        searchActive = false;
        toggleShortcuts(true);
    }
    
    // Fecha o menu de customização se estiver aberto
    if (guitarMenuOpen) {
        closeGuitarCustomizationMenu();
    }
    
    selectedMenuIndex = 0;
    updateMenuSelection();
}

function fecharMenuSite() {
    if (!settingsMenu || !settingsOverlay) return;
    
    settingsMenu.classList.remove("active");
    settingsOverlay.classList.remove("active");
    hideAllSubmenus();
    currentMenu = 'main';
    selectedMenuIndex = -1;
    playMenuSound();
}

function showMainMenu() {
    if (!mainMenu || !shortcutsMenu || !creditsMenu) return;
    
    mainMenu.style.display = 'flex';
    shortcutsMenu.classList.remove("active");
    creditsMenu.classList.remove("active");
    currentMenu = 'main';
    selectedMenuIndex = 0;
    updateMenuSelection();
}

function showShortcutsMenu() {
    if (!mainMenu || !shortcutsMenu || !creditsMenu) return;
    
    mainMenu.style.display = 'none';
    shortcutsMenu.classList.add("active");
    creditsMenu.classList.remove("active");
    currentMenu = 'shortcuts';
    selectedMenuIndex = -1;
}

function showCreditsMenu() {
    if (!mainMenu || !shortcutsMenu || !creditsMenu) return;
    
    mainMenu.style.display = 'none';
    shortcutsMenu.classList.remove("active");
    creditsMenu.classList.add("active");
    currentMenu = 'credits';
    selectedMenuIndex = -1;
}

function hideAllSubmenus() {
    if (!mainMenu || !shortcutsMenu || !creditsMenu) return;
    
    mainMenu.style.display = 'flex';
    shortcutsMenu.classList.remove("active");
    creditsMenu.classList.remove("active");
    currentMenu = 'main';
    selectedMenuIndex = 0;
    updateMenuSelection();
}

function clickAnimation(el) {
    if (!el) return;
    el.style.transform = "scale(0.9)";
    setTimeout(() => el.style.transform = "scale(1)", 150);
}

// Função para atualizar seleção no menu
function updateMenuSelection() {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach((item, index) => {
        if (index === selectedMenuIndex) {
            item.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            item.style.borderColor = 'rgba(255, 255, 255, 0.5)';
        } else {
            item.style.backgroundColor = '';
            item.style.borderColor = '';
        }
    });
}

// Navegação no menu com teclado
function handleMenuNavigation(e) {
    if (!settingsMenu || !settingsMenu.classList.contains("active")) return;
    
    const menuItems = document.querySelectorAll('.menu-item');
    if (menuItems.length === 0) return;
    
    e.preventDefault();
    
    if (e.key === 'ArrowDown') {
        selectedMenuIndex = (selectedMenuIndex + 1) % menuItems.length;
        updateMenuSelection();
    } else if (e.key === 'ArrowUp') {
        selectedMenuIndex = (selectedMenuIndex - 1 + menuItems.length) % menuItems.length;
        updateMenuSelection();
    } else if (e.key === 'Enter' && selectedMenuIndex >= 0) {
        if (selectedMenuIndex === 0) {
            clickAnimation(shortcutsBtn);
            playAltBlock();
            showShortcutsMenu();
        } else if (selectedMenuIndex === 1) {
            clickAnimation(creditsBtn);
            playAltBlock();
            showCreditsMenu();
        }
    }
}

// Event listeners seguros para menu
safeAddEventListener(contrastBtn, "click", () => {
    document.body.classList.toggle("light-mode");
    clickAnimation(contrastBtn);
    playAltBlock();
    updateQueueButtonShadow();
});

safeAddEventListener(settingsToggle, "click", () => {
    if (settingsMenu && settingsMenu.classList.contains("active")) {
        fecharMenuSite();
    } else {
        abrirMenuSite();
    }
    clickAnimation(settingsToggle);
});

safeAddEventListener(closeMenuBtn, "click", () => {
    clickAnimation(closeMenuBtn);
    fecharMenuSite();
});

safeAddEventListener(settingsOverlay, "click", () => {
    fecharMenuSite();
});

safeAddEventListener(shortcutsBtn, "click", () => {
    clickAnimation(shortcutsBtn);
    playAltBlock();
    showShortcutsMenu();
});

safeAddEventListener(creditsBtn, "click", () => {
    clickAnimation(creditsBtn);
    playAltBlock();
    showCreditsMenu();
});

safeAddEventListener(backShortcutsBtn, "click", () => {
    clickAnimation(backShortcutsBtn);
    playAltBlock();
    showMainMenu();
});

safeAddEventListener(backCreditsBtn, "click", () => {
    clickAnimation(backCreditsBtn);
    playAltBlock();
    showMainMenu();
});

// NOVO: Event listeners para o menu de customização de guitarra
safeAddEventListener(brushToggle, "click", () => {
    console.log('Botão do pincel clicado');
    if (guitarMenuOpen) {
        closeGuitarCustomizationMenu();
    } else {
        openGuitarCustomizationMenu();
    }
    clickAnimation(brushToggle);
});

safeAddEventListener(closeGuitarMenuBtn, "click", () => {
    clickAnimation(closeGuitarMenuBtn);
    closeGuitarCustomizationMenu();
});

safeAddEventListener(guitarCustomizationOverlay, "click", () => {
    closeGuitarCustomizationMenu();
});

// Event listeners para as abas de categoria
categoryTabs.forEach(tab => {
    safeAddEventListener(tab, "click", () => {
        const category = tab.dataset.category;
        loadGuitarCategory(category);
        playAltBlock();
    });
});

// Navegação com ESC - CORREÇÃO: Não abre menu quando ESC é pressionado na pesquisa
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        // Se a pesquisa está ativa, apenas fecha a pesquisa
        if (searchActive || (searchResults && searchResults.classList.contains("active"))) {
            if (searchResults) searchResults.classList.remove('active');
            if (searchInput) searchInput.value = '';
            currentSearchResults = [];
            selectedSearchIndex = -1;
            if (searchInput) searchInput.blur();
            searchActive = false;
            toggleShortcuts(true);
            e.preventDefault();
            return;
        }
        
        // Se o menu de customização está aberto, fecha ele
        if (guitarMenuOpen) {
            closeGuitarCustomizationMenu();
            e.preventDefault();
            return;
        }
        
        if (settingsMenu && settingsMenu.classList.contains("active")) {
            if (currentMenu === 'main') {
                fecharMenuSite();
            } else {
                showMainMenu();
                playAltBlock();
            }
        } else if (queuePanel && queuePanel.classList.contains("active")) {
            queuePanel.classList.remove("active");
            updateQueueButtonShadow();
            playAltBlock();
        } else {
            abrirMenuSite();
        }
    }
});

// Evita arrastar imagens
document.querySelectorAll('img').forEach(img => {
    img.ondragstart = () => false;
});

// ---------------- Troca de faixa COM VALIDAÇÃO ----------------
function changeTrack(index, autoPlay = true) {
    if (index < 0 || index >= playlist.length) {
        console.error('Índice de música inválido:', index);
        return;
    }
    
    try {
        currentIndex = ((index % playlist.length) + playlist.length) % playlist.length;
        som.src = playlist[currentIndex].src;
        som.load();

        if (progressFill) progressFill.style.width = '0%';
        if (progressThumb) progressThumb.style.left = '0%';
        if (currentTimeEl) currentTimeEl.textContent = formatTime(0);
        if (totalTimeEl) totalTimeEl.textContent = formatTime(0);

        const loadedMetadataHandler = () => {
            if (totalTimeEl) totalTimeEl.textContent = formatTime(som.duration);
            updateProgress();
        };

        som.addEventListener("loadedmetadata", loadedMetadataHandler, { once: true });

        if (autoPlay) {
            som.play().catch(err => {
                console.log("Erro ao tocar nova faixa:", err);
                AudioErrorHandler.handleAudioError(som);
            });
            updateFire(som.volume);
            startProgressUpdater();
        }

        updatePlayerStatus("Carregando");
        updateQueuePanelCurrentSong();
    } catch (error) {
        console.error('Erro ao trocar faixa:', error);
        AudioErrorHandler.handleAudioError(som);
    }
}

// ---------------- Botões: loop / back / skip ----------------
safeAddEventListener(loopBtn, "click", () => {
    playAltBlock();
    isLooping = !isLooping;
    if (loopBtn) loopBtn.classList.toggle("active");
});

safeAddEventListener(backBtn, "click", () => {
    playAltBlock();
    changeTrack(currentIndex - 1, true);
});

safeAddEventListener(skipBtn, "click", () => {
    playAltBlock();
    changeTrack(currentIndex + 1, true);
});

// ---------------- Queue Button e Panel COM VALIDAÇÃO ----------------
const queueBtn = safeGetElement("queue-btn");
const queuePanel = safeGetElement("queue-panel");
const songListEl = safeGetElement("song-list");
const queueScrollbar = safeGetElement("queue-scrollbar");
const queueScrollThumb = safeGetElement("queue-scroll-thumb");

let draggingQueueScroll = false;
let selectedQueueIndex = -1;

// CORREÇÃO DO BUG: Função para atualizar a sombra do botão da fila
function updateQueueButtonShadow() {
    if (!queueBtn || !queuePanel) return;
    
    if (queuePanel.classList.contains("active")) {
        queueBtn.classList.add("active");
    } else {
        queueBtn.classList.remove("active");
    }
}

// Função para abrir/fechar painel da fila
function toggleQueuePanel() {
    if (!queuePanel) return;
    
    queuePanel.classList.toggle("active");
    updateQueueButtonShadow();
    if (queuePanel.classList.contains("active")) {
        populateQueuePanel();
        selectedQueueIndex = currentIndex;
        updateQueueSelection();
    } else {
        selectedQueueIndex = -1;
    }
}

// NOVA FUNÇÃO: Popula o painel da fila com tratamento de erro de imagem
function populateQueuePanel() {
    if (!songListEl) return;
    
    songListEl.innerHTML = "";
    playlist.forEach((song, index) => {
        const li = document.createElement("li");
        
        // Sem onerror - o fallback é tratado pelo setupImageErrorHandling
        li.innerHTML = `
            <img src="${song.image}" alt="${song.name}" class="song-image">
            <div class="song-info">
                <div class="song-title">${song.name}</div>
                <div class="song-artist">${song.artist}</div>
            </div>
        `;
        
        li.dataset.index = index;
        li.addEventListener("click", () => {
            if (index !== currentIndex) {
                changeTrack(index, true);
            }
            playAltBlock();
        });
        songListEl.appendChild(li);
    });
    updateQueuePanelCurrentSong();
    updateQueueScrollbar();
}

function updateQueuePanelCurrentSong() {
    if (!songListEl) return;
    
    const listItems = songListEl.querySelectorAll("li");
    listItems.forEach((item, index) => {
        if (index === currentIndex) {
            item.classList.add("current-song");
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            item.classList.remove("current-song");
        }
    });
    updateQueueScrollbar();
}

function updateQueueScrollbar() {
    if (!songListEl || !queueScrollbar || !queueScrollThumb) return;

    try {
        const contentHeight = songListEl.scrollHeight;
        const viewportHeight = songListEl.clientHeight;

        if (contentHeight > viewportHeight) {
            queueScrollbar.style.display = 'block';
            const thumbHeight = Math.max(20, (viewportHeight / contentHeight) * viewportHeight);
            queueScrollThumb.style.height = `${thumbHeight}px`;

            const thumbPosition = (songListEl.scrollTop / (contentHeight - viewportHeight)) * (viewportHeight - thumbHeight);
            queueScrollThumb.style.top = `${thumbPosition}px`;
        } else {
            queueScrollbar.style.display = 'none';
        }
    } catch (error) {
        console.error('Erro ao atualizar scrollbar:', error);
    }
}

// Event listeners para a scrollbar personalizada
safeAddEventListener(queueScrollThumb, 'mousedown', (e) => {
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
safeAddEventListener(songListEl, 'scroll', updateQueueScrollbar);

// Atualiza a scrollbar quando o tamanho da janela muda
safeAddEventListener(window, 'resize', updateQueueScrollbar);

safeAddEventListener(queueBtn, "click", () => {
    clickAnimation(queueBtn);
    playAltBlock();
    toggleQueuePanel();
});

// NOVA FUNÇÃO: Atualizar seleção na fila
function updateQueueSelection() {
    if (!songListEl) return;
    
    const listItems = songListEl.querySelectorAll("li");
    listItems.forEach((item, index) => {
        item.classList.remove("selected");
        if (index === selectedQueueIndex) {
            item.classList.add("selected");
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
}

// NOVA FUNÇÃO: Navegação na fila com teclado
function handleQueueNavigation(e) {
    if (!queuePanel || !queuePanel.classList.contains("active")) return;
    
    const listItems = songListEl ? songListEl.querySelectorAll("li") : [];
    if (listItems.length === 0) return;
    
    e.preventDefault();
    
    if (e.key === 'ArrowDown') {
        selectedQueueIndex = (selectedQueueIndex + 1) % listItems.length;
    } else if (e.key === 'ArrowUp') {
        selectedQueueIndex = (selectedQueueIndex - 1 + listItems.length) % listItems.length;
    }
    
    updateQueueSelection();
}

// NOVA FUNÇÃO: Tocar música selecionada na fila
function playSelectedQueueItem() {
    if (selectedQueueIndex >= 0 && selectedQueueIndex < playlist.length) {
        changeTrack(selectedQueueIndex, true);
        playAltBlock();
    }
}

// ---------------- Novos atalhos do teclado COM VALIDAÇÃO ----------------
document.addEventListener("keydown", (e) => {
    // Se o menu de customização estiver aberto, permite fechar com ESC
    if (guitarMenuOpen) {
        if (e.key === 'Escape') {
            closeGuitarCustomizationMenu();
            e.preventDefault();
        }
        return;
    }

    // Se o menu estiver aberto, permite navegação com setas
    if (settingsMenu && settingsMenu.classList.contains("active")) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
            handleMenuNavigation(e);
            return;
        }
        
        if ((e.ctrlKey && e.key === '.') || e.key === 'Escape') {
            if (e.ctrlKey && e.key === '.') {
                e.preventDefault();
                document.body.classList.toggle("light-mode");
                updateQueueButtonShadow();
            }
        }
        return;
    }

    // Se a pesquisa está ativa, desativa a maioria dos atalhos
    if (searchActive) {
        if ((e.ctrlKey && e.key === 'k') || e.key === 'Escape') {
            // Permite que esses atalhos funcionem
        } else {
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

    // Ctrl + A - Abrir/fechar volume (AGORA SIMULA UM CLIQUE NO AMP)
    if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        toggleAmp(); // Chama a mesma função do clique
        return;
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
        if (loopBtn) loopBtn.classList.toggle("active");
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
        if (som) {
            som.currentTime = Math.max(0, som.currentTime - 5);
            updateProgress();
            playAltBlock();
        }
        return;
    }

    if (e.key === 'ArrowRight' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        if (som) {
            som.currentTime = Math.min(som.duration, som.currentTime + 5);
            updateProgress();
            playAltBlock();
        }
        return;
    }

    // NOVO COMPORTAMENTO: Setas para volume SÓ funcionam se a barra estiver aberta
    if (e.key === 'ArrowUp' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        // Só aumenta volume se o amp estiver ligado E a barra de volume visível
        if (ampToggle && ampControl && ampControl.style.display === "flex") {
            increaseVolume();
        }
        return;
    }

    if (e.key === 'ArrowDown' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        // Só diminui volume se o amp estiver ligado E a barra de volume visível
        if (ampToggle && ampControl && ampControl.style.display === "flex") {
            decreaseVolume();
        }
        return;
    }

    // Navegação na fila com setas
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && queuePanel && queuePanel.classList.contains("active")) {
        handleQueueNavigation(e);
        return;
    }

    // Enter para tocar música selecionada na fila
    if (e.key === 'Enter' && queuePanel && queuePanel.classList.contains("active") && selectedQueueIndex !== -1) {
        e.preventDefault();
        playSelectedQueueItem();
        return;
    }

    // Atalhos originais
    if (shortcutsEnabled) {
        // Barra de espaço - Play/Pause
        if (e.code === "Space") {
            e.preventDefault();
            togglePlayPause();
        }
        
        // R - Reiniciar música do início
        if (e.code === "KeyR") {
            e.preventDefault();
            if (som) {
                som.currentTime = 0;
                updateProgress();
                if (!som.paused) updateFire(som.volume);
                else if (fire) fire.style.opacity = "0";
            }
        }
        
        // Atalhos originais mantidos
        if (e.code === "Digit0" || e.code === "Insert") {
            if (som) {
                som.currentTime = 0;
                updateProgress();
                if (!som.paused) updateFire(som.volume);
                else if (fire) fire.style.opacity = "0";
            }
        }
        if (e.code === "KeyK") togglePlayPause();
    }
});

// ---------------- Inicialização COM VALIDAÇÃO ----------------
window.addEventListener("load", () => {
    // Inicializa o handler de erros de áudio
    AudioErrorHandler.init(som);
    
    // Configura fallback de imagens
    setupImageErrorHandling();
    
    // Pré-carregamento de imagens para melhor performance
    const imagesToPreload = [
        'img/guitar logo.png',
        'img/contraste.png',
        'img/engrenagem.png',
        'img/pincel.png',
        'img/back.png',
        'img/skip.png',
        'img/loop.png',
        'img/filademusica.png',
        'img/play.png',
        'img/pause.png',
        'img/ligado.png',
        'img/desligado.png',
        'img/chamas.gif',
        'img/x.png'
    ];
    
    // Pré-carregar imagens de guitarras
    Object.values(guitarCatalog).forEach(category => {
        category.forEach(guitar => {
            imagesToPreload.push(guitar.src);
        });
    });
    
    imagesToPreload.forEach(src => {
        const img = new Image();
        img.src = src;
    });
    
    // Pré-carregamento de áudio
    const audioToPreload = [
        'effects/abrirmenu.mp3',
        'effects/fecharmenu.mp3',
        'effects/block 1.mp3',
        'effects/block 2.mp3'
    ];
    
    audioToPreload.forEach(src => {
        const audio = new Audio();
        audio.src = src;
    });
    
    if (som) som.volume = 0.5;
    if (ampBar && ampSlider) {
        const barWidth = ampBar.offsetWidth;
        const sliderWidth = ampSlider.offsetWidth;
        ampSlider.style.left = `${som.volume * (barWidth - sliderWidth)}px`;
    }

    // Define a primeira música e carrega metadados
    if (som && playlist.length > 0) {
        som.src = playlist[currentIndex].src;
        som.load();

        const loadedMetadataHandler = () => {
            if (totalTimeEl) totalTimeEl.textContent = formatTime(som.duration);
            updateProgress();
        };

        som.addEventListener("loadedmetadata", loadedMetadataHandler, { once: true });
    }

    populateQueuePanel();
    updateQueueButtonShadow();
    updateVolumePercentage();
    
    // Atualiza status inicial
    updatePlayerStatus("Pronto");
});

// Cleanup para evitar memory leaks
window.addEventListener('beforeunload', () => {
    stopProgressUpdater();
    if (volumePercentageTimeout) {
        clearTimeout(volumePercentageTimeout);
    }
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
});
