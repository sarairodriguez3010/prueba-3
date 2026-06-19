/* ==========================================================================
   DOMINÓ NUMÉRICO INFANTIL - JAVASCRIPT LOGIC
   Lógica del juego por turnos, validaciones, NEM PDA y confeti interactivo
   ========================================================================== */

// ==========================================================================
// 0. SISTEMA DE NARRACIÓN DE VOZ (SpeechSynthesis API)
// Accesibilidad para alumnas/os con baja capacidad visual
// ==========================================================================

let voiceEnabled = true; // La voz está activa por defecto

/**
 * Narra un texto en voz alta usando la API SpeechSynthesis del navegador.
 * @param {string} text - El texto a leer en voz alta.
 */
function speak(text) {
    if (!voiceEnabled) return;
    if (!window.speechSynthesis) return; // Navegador sin soporte
    window.speechSynthesis.cancel(); // Cancela cualquier narración en curso
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-MX';  // Español de México
    utterance.rate = 0.88;     // Velocidad más lenta y clara para niños
    utterance.pitch = 1.15;    // Tono ligeramente más agudo y amigable
    utterance.volume = 1.0;    // Volumen máximo
    window.speechSynthesis.speak(utterance);
}

/**
 * Activa o desactiva la narración de voz y actualiza el botón en el header.
 */
function toggleVoice() {
    voiceEnabled = !voiceEnabled;
    const btn = document.getElementById('btn-toggle-voice');
    if (btn) {
        btn.innerHTML = voiceEnabled
            ? '<i class="fa-solid fa-volume-high"></i> <span>Voz: ON</span>'
            : '<i class="fa-solid fa-volume-xmark"></i> <span>Voz: OFF</span>';
        btn.title = voiceEnabled ? 'Desactivar narración de voz' : 'Activar narración de voz';
        // Cambiar apariencia visual según el estado
        btn.classList.toggle('voice-off', !voiceEnabled);
    }
    if (voiceEnabled) {
        speak('Narración de voz activada.');
    } else {
        window.speechSynthesis.cancel();
    }
}

// --- Estado Global de la Partida ---
const gameState = {
    playerCount: 2,
    players: [],            // Fichas, nombre, avatar, puntuación
    currentPlayerIndex: 0,
    board: [],              // Lista de fichas jugadas: [[A,B], [B,C]...]
    boneyard: [],           // El Pozo: Fichas boca abajo
    selectedTileIndex: null,// Índice de la ficha que el jugador quiere jugar
    pendingMove: null       // Ficha en espera de elección de lado
};

// --- Configuración y Constantes ---
const AVATARS = ['🐰', '🐻', '🦊', '🐼', '🐸', '🦁', '🐱', '🐶'];
const DEFAULT_NAMES = ['Copito', 'Bongo', 'Foxy', 'Pandi', 'René', 'Simba', 'Michi', 'Toby'];

// --- Elementos del DOM ---
const DOM = {
    screenSetup: document.getElementById('screen-setup'),
    screenTransition: document.getElementById('screen-turn-transition'),
    screenGame: document.getElementById('screen-game'),
    screenResults: document.getElementById('screen-results'),
    
    playersConfigList: document.getElementById('players-config-list'),
    btnStartGame: document.getElementById('btn-start-game'),
    btnCountButtons: document.querySelectorAll('.btn-count'),
    
    // Transición de turno
    transitionPlayerAvatar: document.getElementById('transition-player-avatar'),
    transitionPlayerName: document.getElementById('transition-player-name'),
    btnRevealTurn: document.getElementById('btn-reveal-turn'),
    
    // Tablero
    currentAvatar: document.getElementById('current-avatar'),
    currentName: document.getElementById('current-name'),
    boneyardCount: document.getElementById('boneyard-count'),
    gameBoard: document.getElementById('game-board'),
    playerHand: document.getElementById('player-hand'),
    btnDraw: document.getElementById('btn-draw'),
    btnPassTurn: document.getElementById('btn-pass-turn'),
    controlsStatusMsg: document.getElementById('controls-status-msg'),
    
    // Selector de lado
    sidePickerOverlay: document.getElementById('side-picker-overlay'),
    btnPickLeft: document.getElementById('btn-pick-left'),
    btnPickRight: document.getElementById('btn-pick-right'),
    
    // Resultados
    winnerAvatar: document.getElementById('winner-avatar'),
    winnerName: document.getElementById('winner-name'),
    winnerReason: document.getElementById('winner-reason'),
    resultsTableBody: document.getElementById('results-table-body'),
    btnRestart: document.getElementById('btn-restart'),
    
    // Modal Pedagógico
    btnPedagogic: document.getElementById('btn-pedagogic'),
    modalPedagogic: document.getElementById('modal-pedagogic'),
    closePedagogic: document.getElementById('close-pedagogic'),
    btnClosePedagogicFooter: document.getElementById('btn-close-pedagogic-footer')
};

// ==========================================================================
// 1. INICIALIZACIÓN Y CONFIGURACIÓN INICIAL
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initSetupScreen();
    setupEventListeners();
});

// Configura la pantalla de inicio con la cantidad de filas de jugador seleccionada
function initSetupScreen() {
    renderPlayerConfigRows(gameState.playerCount);
    
    // Eventos para los botones de cantidad de jugadores
    DOM.btnCountButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            DOM.btnCountButtons.forEach(b => b.classList.remove('btn-count-active'));
            btn.classList.add('btn-count-active');
            
            const count = parseInt(btn.dataset.count);
            gameState.playerCount = count;
            renderPlayerConfigRows(count);
        });
    });
}

// Renderiza las filas de configuración para ingresar nombre y elegir avatar
function renderPlayerConfigRows(count) {
    DOM.playersConfigList.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
        const row = document.createElement('div');
        row.className = 'player-config-row';
        
        // Asignación de avatar predeterminado sin repetir
        const defaultAvatar = AVATARS[i % AVATARS.length];
        const defaultName = DEFAULT_NAMES[i % DEFAULT_NAMES.length];
        
        row.innerHTML = `
            <span class="player-config-label">Jugador ${i + 1}:</span>
            <input type="text" class="player-config-input" value="${defaultName}" data-index="${i}" placeholder="Nombre">
            <div class="avatar-selector" data-player="${i}">
                ${AVATARS.map(avatar => `
                    <div class="avatar-option ${avatar === defaultAvatar ? 'selected' : ''}" data-avatar="${avatar}">
                        ${avatar}
                    </div>
                `).join('')}
            </div>
        `;
        
        DOM.playersConfigList.appendChild(row);
        
        // Lógica de selección de avatar exclusivo en la fila
        const options = row.querySelectorAll('.avatar-option');
        options.forEach(opt => {
            opt.addEventListener('click', () => {
                row.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            });
        });
    }
}

// Configura todos los manejadores de eventos básicos
function setupEventListeners() {
    // Iniciar juego
    DOM.btnStartGame.addEventListener('click', startGame);
    
    // Revelar turno tras transición
    DOM.btnRevealTurn.addEventListener('click', () => {
        showScreen(DOM.screenGame);
        renderHand(); // La narración de fichas jugables ocurre dentro de renderHand()
    });
    
    // Robar del pozo
    DOM.btnDraw.addEventListener('click', handleDrawCard);
    
    // Pasar turno
    DOM.btnPassTurn.addEventListener('click', handlePassTurn);
    
    // Elección de lado (izquierda / derecha)
    DOM.btnPickLeft.addEventListener('click', () => playTileOnSide('left'));
    DOM.btnPickRight.addEventListener('click', () => playTileOnSide('right'));
    
    // Reiniciar
    DOM.btnRestart.addEventListener('click', restartToSetup);
    
    // Botón de activar/desactivar voz
    const btnVoice = document.getElementById('btn-toggle-voice');
    if (btnVoice) {
        btnVoice.addEventListener('click', toggleVoice);
    }
    
    // Modal Pedagógico
    DOM.btnPedagogic.addEventListener('click', () => DOM.modalPedagogic.classList.add('active'));
    DOM.closePedagogic.addEventListener('click', () => DOM.modalPedagogic.classList.remove('active'));
    DOM.btnClosePedagogicFooter.addEventListener('click', () => DOM.modalPedagogic.classList.remove('active'));
    
    // Cerrar modal al hacer clic fuera del contenido
    window.addEventListener('click', (e) => {
        if (e.target === DOM.modalPedagogic) {
            DOM.modalPedagogic.classList.remove('active');
        }
    });
}

// Cambiar de pantalla de manera fluida
function showScreen(screenToShow) {
    const screens = [DOM.screenSetup, DOM.screenTransition, DOM.screenGame, DOM.screenResults];
    screens.forEach(screen => screen.classList.remove('active'));
    screenToShow.classList.add('active');
}

// ==========================================================================
// 2. LÓGICA CORE DEL DOMINÓ
// ==========================================================================

function startGame() {
    // Recopilar información de jugadores
    gameState.players = [];
    const nameInputs = document.querySelectorAll('.player-config-input');
    
    for (let i = 0; i < gameState.playerCount; i++) {
        const name = nameInputs[i].value.trim() || `Jugador ${i + 1}`;
        const avatarContainer = document.querySelector(`.avatar-selector[data-player="${i}"]`);
        const selectedAvatarOpt = avatarContainer.querySelector('.avatar-option.selected');
        const avatar = selectedAvatarOpt ? selectedAvatarOpt.dataset.avatar : AVATARS[i];
        
        gameState.players.push({
            id: i,
            name: name,
            avatar: avatar,
            hand: [],
            score: 0
        });
    }
    
    // Crear y mezclar el mazo
    const deck = generateDominoDeck();
    shuffle(deck);
    
    // Repartir fichas
    // 2 jugadores -> 7 c/u, 3 jugadores -> 6 c/u, 4 jugadores -> 5 c/u
    let tilesPerPlayer = 7;
    if (gameState.playerCount === 3) tilesPerPlayer = 6;
    if (gameState.playerCount === 4) tilesPerPlayer = 5;
    
    gameState.players.forEach(player => {
        player.hand = deck.splice(0, tilesPerPlayer);
    });
    
    gameState.boneyard = deck; // El resto de fichas va al pozo
    gameState.board = [];
    
    // Determinar quién inicia la partida y la ficha con la que empieza
    determineStartingPlayer();
    
    // Renderizar estado inicial
    updateBoneyardUI();
    renderBoard();
    
    // Ir a la pantalla de transición del primer jugador
    goToPlayerTransition(gameState.currentPlayerIndex);
}

// Genera un mazo estándar de doble 6 (28 fichas)
function generateDominoDeck() {
    const deck = [];
    for (let i = 0; i <= 6; i++) {
        for (let j = i; j <= 6; j++) {
            deck.push([i, j]);
        }
    }
    return deck;
}

// Algoritmo Fisher-Yates para barajar
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Encuentra quién tiene el doble más alto para iniciar
// Si nadie tiene dobles, inicia el que tenga la ficha con mayor puntuación
function determineStartingPlayer() {
    let startingPlayerIndex = 0;
    let highestDouble = -1;
    let highestSum = -1;
    let initialTile = null;
    let tileIndexInHand = -1;
    
    // 1. Buscar dobles (desde 6|6 hasta 0|0)
    for (let d = 6; d >= 0; d--) {
        for (let p = 0; p < gameState.players.length; p++) {
            const index = gameState.players[p].hand.findIndex(tile => tile[0] === d && tile[1] === d);
            if (index !== -1) {
                highestDouble = d;
                startingPlayerIndex = p;
                tileIndexInHand = index;
                initialTile = gameState.players[p].hand[index];
                break;
            }
        }
        if (highestDouble !== -1) break;
    }
    
    // 2. Si no hay dobles, buscar la ficha de mayor puntuación sumada
    if (highestDouble === -1) {
        for (let p = 0; p < gameState.players.length; p++) {
            gameState.players[p].hand.forEach((tile, index) => {
                const sum = tile[0] + tile[1];
                if (sum > highestSum) {
                    highestSum = sum;
                    startingPlayerIndex = p;
                    tileIndexInHand = index;
                    initialTile = tile;
                }
            });
        }
    }
    
    // Colocar la ficha inicial automáticamente en el tablero para comenzar el juego
    gameState.board.push(initialTile);
    // Removerla de la mano del jugador
    gameState.players[startingPlayerIndex].hand.splice(tileIndexInHand, 1);
    
    // Establecer al siguiente jugador como el jugador activo
    gameState.currentPlayerIndex = (startingPlayerIndex + 1) % gameState.players.length;
}

// Prepara la pantalla de transición del turno
function goToPlayerTransition(playerIndex) {
    gameState.currentPlayerIndex = playerIndex;
    const player = gameState.players[playerIndex];
    
    DOM.transitionPlayerAvatar.textContent = player.avatar;
    DOM.transitionPlayerName.textContent = player.name;
    
    // Actualizar indicador del tablero de fondo para cuando se revele
    DOM.currentAvatar.textContent = player.avatar;
    DOM.currentName.textContent = player.name;
    
    // Limpiar estados de selección previos
    gameState.selectedTileIndex = null;
    gameState.pendingMove = null;
    DOM.sidePickerOverlay.classList.add('hidden');
    DOM.btnPassTurn.classList.add('hidden');
    
    // Narrar el cambio de turno
    speak(`¡Es el turno de ${player.name}! Pasa el dispositivo y toca Ver mis fichas.`);
    
    showScreen(DOM.screenTransition);
}

// ==========================================================================
// 3. RENDERIZADO DEL TABLERO Y LAS FICHAS
// ==========================================================================

// Renderiza la cadena de fichas en el tablero
function renderBoard() {
    DOM.gameBoard.innerHTML = '';
    
    if (gameState.board.length === 0) {
        DOM.gameBoard.innerHTML = '<div class="board-placeholder">¡El tablero está vacío! Empieza la partida.</div>';
        return;
    }
    
    // Extremo Izquierdo Abierto (ayuda visual)
    const leftVal = getBoardEndpoint('left');
    const rightVal = getBoardEndpoint('right');
    
    // Crear indicador visual izquierdo (con número narrado en el tooltip)
    const leftIndicator = document.createElement('div');
    leftIndicator.className = 'board-endpoint';
    leftIndicator.title = `Extremo izquierdo: busca un ${leftVal}`;
    DOM.gameBoard.appendChild(leftIndicator);
    
    // Renderizar cada ficha jugada
    gameState.board.forEach((tile, index) => {
        const isDouble = tile[0] === tile[1];
        const tileEl = createDominoTileHTML(tile[0], tile[1], isDouble);
        DOM.gameBoard.appendChild(tileEl);
    });
    
    // Crear indicador visual derecho
    const rightIndicator = document.createElement('div');
    rightIndicator.className = 'board-endpoint';
    rightIndicator.title = `Extremo derecho: busca un ${rightVal}`;
    DOM.gameBoard.appendChild(rightIndicator);
    
    // Narrar los extremos del tablero para la alumna con baja visión
    if (gameState.board.length > 0) {
        speak(`El tren tiene el número ${leftVal} a la izquierda y el número ${rightVal} a la derecha.`);
    }
    
    // Auto-scroll del tablero hacia la derecha para centrar la última ficha jugada
    setTimeout(() => {
        const wrapper = document.querySelector('.board-wrapper');
        if (wrapper) {
            wrapper.scrollLeft = (wrapper.scrollWidth - wrapper.clientWidth) / 2;
        }
    }, 100);
}

// Renderiza la mano de fichas del jugador actual
function renderHand() {
    DOM.playerHand.innerHTML = '';
    const player = gameState.players[gameState.currentPlayerIndex];
    const leftVal = getBoardEndpoint('left');
    const rightVal = getBoardEndpoint('right');
    
    let hasPlayableTiles = false;
    
    player.hand.forEach((tile, index) => {
        // Evaluar si es jugable
        const fitsLeft = tile[0] === leftVal || tile[1] === leftVal;
        const fitsRight = tile[0] === rightVal || tile[1] === rightVal;
        const isPlayable = fitsLeft || fitsRight;
        
        if (isPlayable) hasPlayableTiles = true;
        
        const tileEl = createDominoTileHTML(tile[0], tile[1], false); // en la mano se muestran siempre horizontales
        
        if (isPlayable) {
            tileEl.classList.add('playable');
        }
        
        // Agregar evento de clic a la ficha
        tileEl.addEventListener('click', () => {
            handleSelectTile(index, fitsLeft, fitsRight);
        });
        
        DOM.playerHand.appendChild(tileEl);
    });
    
    // Actualizar mensaje y botón de pasar, y narrar el estado del turno
    if (hasPlayableTiles) {
        DOM.controlsStatusMsg.innerHTML = '✨ ¡Tienes fichas que sirven! Toca una ficha que brille para jugarla.';
        DOM.controlsStatusMsg.style.color = 'var(--color-success)';
        DOM.btnPassTurn.classList.add('hidden');
        
        // Narrar qué fichas son jugables para la alumna con baja visión
        const player = gameState.players[gameState.currentPlayerIndex];
        const leftVal = getBoardEndpoint('left');
        const rightVal = getBoardEndpoint('right');
        const playableTiles = player.hand.filter(tile =>
            tile[0] === leftVal || tile[1] === leftVal ||
            tile[0] === rightVal || tile[1] === rightVal
        );
        const playableDescriptions = playableTiles.map(tile => `ficha ${tile[0]} con ${tile[1]}`).join(', ');
        // La narración del tablero ya ocurrió en renderBoard(); aquí narramos las fichas jugables.
        setTimeout(() => {
            speak(`Puedes jugar: ${playableDescriptions}. Toca la ficha que brilla.`);
        }, 2200); // Esperar a que termine la narración del tablero
    } else {
        if (gameState.boneyard.length > 0) {
            DOM.controlsStatusMsg.innerHTML = '💡 No tienes fichas que sirvan. ¡Toca <strong>El Pozo</strong> para robar!';
            DOM.controlsStatusMsg.style.color = 'var(--color-danger)';
            DOM.btnPassTurn.classList.add('hidden');
            setTimeout(() => speak('No tienes fichas que sirvan. Toca el Pozo para robar una ficha.'), 2200);
        } else {
            DOM.controlsStatusMsg.innerHTML = '🚫 No hay fichas en el pozo y no tienes jugadas. Toca <strong>Pasar Turno</strong>.';
            DOM.controlsStatusMsg.style.color = 'var(--color-warning)';
            DOM.btnPassTurn.classList.remove('hidden');
            setTimeout(() => speak('No hay fichas en el pozo y no tienes jugadas. Toca Pasar Turno.'), 2200);
        }
    }
}

// Crea la estructura HTML para una ficha de dominó
function createDominoTileHTML(val1, val2, isVertical) {
    const tile = document.createElement('div');
    tile.className = `domino-tile ${isVertical ? 'vertical' : ''}`;
    
    tile.innerHTML = `
        <div class="domino-half num-val-${val1}">${val1}</div>
        <div class="domino-divider"></div>
        <div class="domino-half num-val-${val2}">${val2}</div>
    `;
    
    return tile;
}

// Devuelve el valor abierto en un extremo ('left' o 'right')
function getBoardEndpoint(side) {
    if (gameState.board.length === 0) return null;
    
    if (side === 'left') {
        return gameState.board[0][0]; // Primer número de la primera ficha
    } else {
        return gameState.board[gameState.board.length - 1][1]; // Segundo número de la última ficha
    }
}

// Actualiza el indicador del Pozo
function updateBoneyardUI() {
    DOM.boneyardCount.textContent = `${gameState.boneyard.length} ficha${gameState.boneyard.length === 1 ? '' : 's'}`;
    if (gameState.boneyard.length === 0) {
        DOM.btnDraw.style.opacity = '0.4';
        DOM.btnDraw.title = 'El pozo está vacío';
    } else {
        DOM.btnDraw.style.opacity = '1';
        DOM.btnDraw.title = 'Haz clic para robar una ficha';
    }
}

// ==========================================================================
// 4. ACCIONES DEL TURNO DEL JUGADOR
// ==========================================================================

// Maneja la selección de una ficha en la mano del jugador
function handleSelectTile(index, fitsLeft, fitsRight) {
    const player = gameState.players[gameState.currentPlayerIndex];
    const tile = player.hand[index];
    
    if (!fitsLeft && !fitsRight) {
        // Narrar el error: ficha no válida
        speak(`La ficha ${tile[0]} con ${tile[1]} no sirve aquí. Elige una ficha que brille.`);
        // Sacudir la ficha seleccionada como retroalimentación visual de error
        const tileElements = DOM.playerHand.querySelectorAll('.domino-tile');
        tileElements[index].classList.add('shake-animation');
        setTimeout(() => {
            tileElements[index].classList.remove('shake-animation');
        }, 400);
        return;
    }
    
    // Narrar la ficha seleccionada válida
    speak(`Seleccionaste la ficha ${tile[0]} con ${tile[1]}.`);
    
    gameState.selectedTileIndex = index;
    
    // Si cabe en ambos lados del tren, preguntar al jugador
    if (fitsLeft && fitsRight) {
        gameState.pendingMove = { tile, index };
        DOM.sidePickerOverlay.classList.remove('hidden');
    } 
    // Si solo cabe en la izquierda
    else if (fitsLeft) {
        playTileOnSide('left');
    } 
    // Si solo cabe en la derecha
    else if (fitsRight) {
        playTileOnSide('right');
    }
}

// Coloca la ficha en el lado elegido ('left' o 'right')
function playTileOnSide(side) {
    const player = gameState.players[gameState.currentPlayerIndex];
    const tileIndex = gameState.selectedTileIndex;
    let tile = player.hand[tileIndex];
    
    // Ocultar modal si estaba visible
    DOM.sidePickerOverlay.classList.add('hidden');
    
    const leftVal = getBoardEndpoint('left');
    const rightVal = getBoardEndpoint('right');
    
    if (side === 'left') {
        // Alinear ficha para que encaje
        // Si el número de la derecha de la ficha (tile[1]) es igual al abierto en la izquierda, se pone directo
        // Si el número de la izquierda (tile[0]) es el que encaja, debemos voltear la ficha
        if (tile[0] === leftVal) {
            tile = [tile[1], tile[0]]; // voltear
        }
        gameState.board.unshift(tile);
    } else {
        // Alinear ficha para el lado derecho
        // Si el de la izquierda (tile[0]) encaja con el abierto a la derecha, se pone directo
        // Si el de la derecha (tile[1]) encaja, volteamos
        if (tile[1] === rightVal) {
            tile = [tile[1], tile[0]]; // voltear
        }
        gameState.board.push(tile);
    }
    
    // Eliminar la ficha jugada de la mano del jugador
    player.hand.splice(tileIndex, 1);
    
    // Comprobar si ganó
    if (player.hand.length === 0) {
        endGame(player.name + " terminó sus fichas", player);
        return;
    }
    
    // Verificar si el juego se bloqueó
    if (isGameBlocked()) {
        resolveBlockedGame();
        return;
    }
    
    // Siguiente turno
    renderBoard();
    const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    goToPlayerTransition(nextPlayerIndex);
}

// Robar del Pozo
function handleDrawCard() {
    const player = gameState.players[gameState.currentPlayerIndex];
    
    // Validar si el jugador REALMENTE necesita robar
    const leftVal = getBoardEndpoint('left');
    const rightVal = getBoardEndpoint('right');
    const hasPlayable = player.hand.some(tile => 
        tile[0] === leftVal || tile[1] === leftVal || 
        tile[0] === rightVal || tile[1] === rightVal
    );
    
    if (hasPlayable) {
        DOM.controlsStatusMsg.innerHTML = '⚠️ ¡Tienes fichas que sirven! No necesitas robar del pozo.';
        DOM.controlsStatusMsg.style.color = 'var(--color-warning)';
        speak('Todavía tienes fichas que sirven. No necesitas robar del pozo.');
        return;
    }
    
    if (gameState.boneyard.length === 0) {
        DOM.controlsStatusMsg.innerHTML = '🚫 El pozo está vacío. Tienes que pasar tu turno.';
        DOM.controlsStatusMsg.style.color = 'var(--color-danger)';
        DOM.btnPassTurn.classList.remove('hidden');
        speak('El pozo está vacío. Toca Pasar Turno.');
        return;
    }
    
    // Robar una ficha y narrarla
    const newTile = gameState.boneyard.pop();
    player.hand.push(newTile);
    speak(`Robaste una ficha del pozo: ${newTile[0]} con ${newTile[1]}.`);
    
    updateBoneyardUI();
    renderHand();
}

// Pasar Turno
function handlePassTurn() {
    // Verificar si realmente no hay jugadas ni pozo
    const player = gameState.players[gameState.currentPlayerIndex];
    const leftVal = getBoardEndpoint('left');
    const rightVal = getBoardEndpoint('right');
    const hasPlayable = player.hand.some(tile => 
        tile[0] === leftVal || tile[1] === leftVal || 
        tile[0] === rightVal || tile[1] === rightVal
    );
    
    if (!hasPlayable && gameState.boneyard.length === 0) {
        const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
        goToPlayerTransition(nextPlayerIndex);
    } else {
        renderHand();
    }
}

// ==========================================================================
// 5. DETECCIÓN DE BLOQUEO Y FIN DE JUEGO
// ==========================================================================

// Determina si el juego se bloqueó por completo
function isGameBlocked() {
    // Si todavía quedan fichas en el pozo, no está bloqueado
    if (gameState.boneyard.length > 0) return false;
    
    const leftVal = getBoardEndpoint('left');
    const rightVal = getBoardEndpoint('right');
    
    // Verificar si ALGÚN jugador tiene una ficha jugable
    for (let p = 0; p < gameState.players.length; p++) {
        const hasPlayable = gameState.players[p].hand.some(tile => 
            tile[0] === leftVal || tile[1] === leftVal || 
            tile[0] === rightVal || tile[1] === rightVal
        );
        if (hasPlayable) return false; // Al menos un jugador puede jugar
    }
    
    return true; // Nadie puede jugar y no hay pozo -> Bloqueado
}

// Resuelve la partida bloqueada (gana el de menor puntaje acumulado)
function resolveBlockedGame() {
    let winner = gameState.players[0];
    let minScore = calculatePlayerScore(gameState.players[0]);
    let tie = false;
    
    gameState.players.forEach((player, index) => {
        const score = calculatePlayerScore(player);
        player.score = score;
        if (index > 0) {
            if (score < minScore) {
                minScore = score;
                winner = player;
                tie = false;
            } else if (score === minScore) {
                tie = true; // Empate en puntaje mínimo
            }
        }
    });
    
    if (tie) {
        // En caso de empate en puntos, gana el que tenga menos fichas en mano
        let minTilesCount = winner.hand.length;
        gameState.players.forEach(player => {
            if (calculatePlayerScore(player) === minScore) {
                if (player.hand.length < minTilesCount) {
                    minTilesCount = player.hand.length;
                    winner = player;
                }
            }
        });
    }
    
    endGame("El juego se ha cerrado (bloqueado). ¡Gana el jugador con menos puntos en su mano!", winner);
}

// Calcula la suma de los valores en la mano del jugador
function calculatePlayerScore(player) {
    return player.hand.reduce((total, tile) => total + tile[0] + tile[1], 0);
}

// Finaliza el juego y muestra la pantalla de ganadores
function endGame(reason, winner) {
    // Calcular puntajes de todos para la tabla final
    gameState.players.forEach(p => {
        p.score = calculatePlayerScore(p);
    });
    
    // Narrar al ganador
    speak(`¡El juego terminó! El ganador es ${winner.name}. ¡Felicidades!`);
    
    // Actualizar UI
    DOM.winnerAvatar.textContent = winner.avatar;
    DOM.winnerName.textContent = winner.name;
    DOM.winnerReason.textContent = reason;
    
    // Renderizar la tabla de puntuaciones
    DOM.resultsTableBody.innerHTML = '';
    
    // Ordenar jugadores de menor a mayor puntuación
    const sortedPlayers = [...gameState.players].sort((a, b) => a.score - b.score);
    
    sortedPlayers.forEach(p => {
        const tr = document.createElement('tr');
        
        // Renderizar fichas restantes como texto amigable, ej: [3|4] [2|2]
        const tilesStr = p.hand.map(tile => `[${tile[0]}|${tile[1]}]`).join(' ') || '¡Ninguna! 🎉';
        
        tr.innerHTML = `
            <td style="font-weight: 700; text-align: left;">
                <span style="font-size: 1.3rem;">${p.avatar}</span> ${p.name} 
                ${p.id === winner.id ? '⭐' : ''}
            </td>
            <td style="font-size: 0.95rem; color: var(--color-text-muted);">${tilesStr}</td>
            <td style="font-weight: 700; color: ${p.score === 0 ? 'var(--color-success)' : 'var(--color-text)'}">
                ${p.score} pt${p.score === 1 ? '' : 's'}
            </td>
        `;
        DOM.resultsTableBody.appendChild(tr);
    });
    
    showScreen(DOM.screenResults);
    
    // Iniciar animación de confeti
    startConfetti();
}

// Regresa al setup inicial de jugadores
function restartToSetup() {
    stopConfetti();
    initSetupScreen();
    showScreen(DOM.screenSetup);
}

// ==========================================================================
// 6. SISTEMA DE CONFETI EN CANVAS (PREMIUM Y OFFLINE)
// ==========================================================================

let confettiInterval = null;
let confettiCanvas = null;
let confettiCtx = null;
let confettiParticles = [];

function startConfetti() {
    // Crear canvas si no existe
    if (!confettiCanvas) {
        confettiCanvas = document.createElement('canvas');
        confettiCanvas.style.position = 'fixed';
        confettiCanvas.style.top = '0';
        confettiCanvas.style.left = '0';
        confettiCanvas.style.width = '100vw';
        confettiCanvas.style.height = '100vh';
        confettiCanvas.style.pointerEvents = 'none';
        confettiCanvas.style.zIndex = '999';
        document.body.appendChild(confettiCanvas);
    }
    
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    confettiCtx = confettiCanvas.getContext('2d');
    
    confettiParticles = [];
    const colors = ['#f43f5e', '#0ea5e9', '#3b82f6', '#22c55e', '#a855f7', '#f97316', '#eab308'];
    
    // Inicializar partículas
    for (let i = 0; i < 120; i++) {
        confettiParticles.push({
            x: Math.random() * confettiCanvas.width,
            y: Math.random() * confettiCanvas.height - confettiCanvas.height,
            r: Math.random() * 6 + 4,
            d: Math.random() * confettiCanvas.height,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.random() * 10 - 5,
            tiltAngleIncremental: Math.random() * 0.07 + 0.02,
            tiltAngle: 0
        });
    }
    
    // Loop de animación
    function drawConfetti() {
        if (!confettiCanvas) return;
        
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        
        confettiParticles.forEach((p, idx) => {
            p.tiltAngle += p.tiltAngleIncremental;
            p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
            p.x += Math.sin(p.tiltAngle);
            p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;
            
            // Si sale de la pantalla, reiniciar arriba
            if (p.y > confettiCanvas.height) {
                confettiParticles[idx] = {
                    x: Math.random() * confettiCanvas.width,
                    y: -20,
                    r: p.r,
                    d: p.d,
                    color: p.color,
                    tilt: p.tilt,
                    tiltAngleIncremental: p.tiltAngleIncremental,
                    tiltAngle: p.tiltAngle
                };
            }
            
            confettiCtx.beginPath();
            confettiCtx.lineWidth = p.r;
            confettiCtx.strokeStyle = p.color;
            confettiCtx.moveTo(p.x + p.tilt + p.r / 2, p.y);
            confettiCtx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
            confettiCtx.stroke();
        });
        
        confettiInterval = requestAnimationFrame(drawConfetti);
    }
    
    drawConfetti();
    
    // Ajustar con tamaño de ventana
    window.addEventListener('resize', resizeConfettiCanvas);
}

function resizeConfettiCanvas() {
    if (confettiCanvas) {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    }
}

function stopConfetti() {
    if (confettiInterval) {
        cancelAnimationFrame(confettiInterval);
        confettiInterval = null;
    }
    if (confettiCanvas) {
        window.removeEventListener('resize', resizeConfettiCanvas);
        confettiCanvas.remove();
        confettiCanvas = null;
        confettiCtx = null;
    }
}
