/**
 * Content Script - боковая панель трекера на сайте FACEIT
 */

// ===== ВСТРОЕННЫЙ API КЛЮЧ =====
const API_KEY = '0e9da776-8e8d-40b2-b8d7-959203e3852f';

// ===== ВЕРСИЯ РАСШИРЕНИЯ =====
const VERSION = '1.5.2';

// ===== FIREBASE CONFIG =====
const FIREBASE_DB_URL = 'https://faceitracker-default-rtdb.europe-west1.firebasedatabase.app';

// Получить количество установок
async function getInstallCount() {
  try {
    const response = await fetch(`${FIREBASE_DB_URL}/stats/installs.json`);
    if (response.ok) {
      const count = await response.json();
      return count || 0;
    }
  } catch(e) {}
  return 0;
}

// Зарегистрировать установку (только один раз)
async function registerInstall() {
  try {
    const result = await chrome.storage.local.get('installRegistered');
    if (result.installRegistered) return;
    
    // Увеличиваем счётчик
    const currentCount = await getInstallCount();
    await fetch(`${FIREBASE_DB_URL}/stats/installs.json`, {
      method: 'PUT',
      body: JSON.stringify(currentCount + 1)
    });
    
    await chrome.storage.local.set({ installRegistered: true });
  } catch(e) {}
}

// Проверка что контекст расширения ещё валиден
function isExtensionContextValid() {
  try {
    return chrome.runtime?.id !== undefined;
  } catch(e) {
    return false;
  }
}

const LANG = {
  ru: {
    title: 'FACEIT Tracker',
    home: 'Основное',
    players: 'Игроки',
    donate: 'Донат',
    about: 'О нас',
    language: 'Язык',
    changelog: 'История обновлений',
    trackedPlayers: 'Отслеживаемые игроки',
    enterNickname: 'Введите ник FACEIT',
    add: 'Добавить',
    noPlayers: 'Нет отслеживаемых игроков',
    version: 'Версия',
    developer: 'Разработчик',
    live: 'В матче',
    liveStreamer: 'В матче 🎬',
    offline: 'Не в сети',
    inMatch: 'В матче',
    supportProject: 'Поддержать проект',
    donateDesc: 'Если вам нравится расширение, вы можете поддержать разработку',
    copyAddress: 'Скопировать',
    comingSoon: 'Скоро будет :)'
  },
  en: {
    title: 'FACEIT Tracker',
    home: 'Home',
    players: 'Players',
    donate: 'Donate',
    about: 'About',
    language: 'Language',
    changelog: 'Changelog',
    trackedPlayers: 'Tracked Players',
    enterNickname: 'Enter FACEIT nickname',
    add: 'Add',
    noPlayers: 'No tracked players',
    version: 'Version',
    developer: 'Developer',
    live: 'LIVE',
    liveStreamer: 'LIVE 🎬',
    offline: 'Offline',
    inMatch: 'In Match',
    supportProject: 'Support the project',
    donateDesc: 'If you like the extension, you can support development',
    copyAddress: 'Copy',
    comingSoon: 'Coming soon :)'
  },
  uk: {
    title: 'FACEIT Tracker',
    home: 'Основне',
    players: 'Гравці',
    donate: 'Донат',
    about: 'Про нас',
    language: 'Мова',
    changelog: 'Історія оновлень',
    trackedPlayers: 'Відстежувані гравці',
    enterNickname: 'Введіть нік FACEIT',
    add: 'Додати',
    noPlayers: 'Немає відстежуваних гравців',
    version: 'Версія',
    developer: 'Розробник',
    live: 'У матчі',
    liveStreamer: 'У матчі 🎬',
    offline: 'Не в мережі',
    inMatch: 'У матчі',
    supportProject: 'Підтримати проект',
    donateDesc: 'Якщо вам подобається розширення, ви можете підтримати розробку',
    copyAddress: 'Скопіювати',
    comingSoon: 'Скоро буде :)'
  },
  pl: {
    title: 'FACEIT Tracker',
    home: 'Główne',
    players: 'Gracze',
    donate: 'Dotacja',
    about: 'O nas',
    language: 'Język',
    changelog: 'Historia aktualizacji',
    trackedPlayers: 'Śledzeni gracze',
    enterNickname: 'Wpisz nick FACEIT',
    add: 'Dodaj',
    noPlayers: 'Brak śledzonych graczy',
    version: 'Wersja',
    developer: 'Deweloper',
    live: 'LIVE',
    offline: 'Offline',
    inMatch: 'W meczu',
    supportProject: 'Wesprzyj projekt',
    donateDesc: 'Jeśli podoba ci się rozszerzenie, możesz wesprzeć rozwój',
    copyAddress: 'Kopiuj',
    comingSoon: 'Wkrótce :)'
  },
  de: {
    title: 'FACEIT Tracker',
    home: 'Startseite',
    players: 'Spieler',
    donate: 'Spenden',
    about: 'Über uns',
    language: 'Sprache',
    changelog: 'Änderungsprotokoll',
    trackedPlayers: 'Verfolgte Spieler',
    enterNickname: 'FACEIT-Nickname eingeben',
    add: 'Hinzufügen',
    noPlayers: 'Keine verfolgten Spieler',
    version: 'Version',
    developer: 'Entwickler',
    live: 'LIVE',
    offline: 'Offline',
    inMatch: 'Im Spiel',
    supportProject: 'Projekt unterstützen',
    donateDesc: 'Wenn dir die Erweiterung gefällt, kannst du die Entwicklung unterstützen',
    copyAddress: 'Kopieren',
    comingSoon: 'Kommt bald :)'
  }
};

let currentLang = 'ru';
let currentPage = 'players';
let extensionEnabled = true;
let blacklistHighlightEnabled = true;
let showCoverBackground = true;
let widgetPosition = { right: 13, bottom: 70 };
let panelOpen = false;
let statusCheckInterval = null;
let playerNotes = {}; // Кэш заметок

// ===== ФУНКЦИИ ДЛЯ ЗАМЕТОК =====
async function loadNotes() {
  try {
    const result = await chrome.storage.local.get('playerNotes');
    playerNotes = result.playerNotes || {};
  } catch(e) {
    playerNotes = {};
  }
}

async function saveNote(playerId, text) {
  if (text && text.trim()) {
    playerNotes[playerId] = { text: text.trim(), updatedAt: Date.now() };
  } else {
    delete playerNotes[playerId];
  }
  if (!isExtensionContextValid()) return;
  try {
    await chrome.storage.local.set({ playerNotes });
  } catch(e) {}
}

function getNote(playerId) {
  return playerNotes[playerId] || null;
}

function openNoteModal(playerId, playerName) {
  const existing = document.getElementById('ft-note-modal');
  if (existing) existing.remove();
  
  const note = getNote(playerId);
  const modal = document.createElement('div');
  modal.id = 'ft-note-modal';
  modal.innerHTML = `
    <div class="ft-note-overlay"></div>
    <div class="ft-note-box">
      <div class="ft-note-header">
        <span>📝 ${playerName}</span>
        <button class="ft-note-close">×</button>
      </div>
      <textarea class="ft-note-input" placeholder="${currentLang === 'ru' ? 'Заметка об игроке...' : 'Note about player...'}">${note?.text || ''}</textarea>
      ${note?.updatedAt ? `<div class="ft-note-date">${new Date(note.updatedAt).toLocaleDateString()}</div>` : ''}
      <div class="ft-note-btns">
        <button class="ft-note-cancel">${currentLang === 'ru' ? 'Отмена' : 'Cancel'}</button>
        <button class="ft-note-save">${currentLang === 'ru' ? 'Сохранить' : 'Save'}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  modal.querySelector('.ft-note-input').focus();
  modal.querySelector('.ft-note-overlay').onclick = () => modal.remove();
  modal.querySelector('.ft-note-close').onclick = () => modal.remove();
  modal.querySelector('.ft-note-cancel').onclick = () => modal.remove();
  modal.querySelector('.ft-note-save').onclick = async () => {
    const text = modal.querySelector('.ft-note-input').value;
    await saveNote(playerId, text);
    modal.remove();
    const result = await chrome.storage.local.get('trackedPlayers');
    renderPlayersList(result.trackedPlayers || []);
  };
}

// ===== ЧЁРНЫЙ СПИСОК =====
let blacklist = {}; // { nickname: { note: string, color: 'red'|'yellow', addedAt: timestamp } }

async function loadBlacklist() {
  try {
    const result = await chrome.storage.local.get('blacklist');
    blacklist = result.blacklist || {};
  } catch(e) {
    blacklist = {};
  }
}

async function saveBlacklist() {
  if (!isExtensionContextValid()) return;
  try {
    await chrome.storage.local.set({ blacklist });
  } catch(e) {
    if (!e.message?.includes('Extension context invalidated')) {
      console.error('Save blacklist error:', e);
    }
  }
}

async function addToBlacklist(nickname, note, color) {
  // Проверяем игрока через FACEIT API
  try {
    const response = await fetch(`https://open.faceit.com/data/v4/players?nickname=${encodeURIComponent(nickname)}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    
    if (!response.ok) {
      return { success: false, error: 'not_found' };
    }
    
    const playerData = await response.json();
    // Проверяем CS2 или CSGO данные
    const cs2Data = playerData.games?.cs2 || playerData.games?.csgo || {};
    
    const currentElo = cs2Data.faceit_elo || cs2Data.elo || 0;
    
    blacklist[nickname.toLowerCase()] = { 
      id: playerData.player_id,
      nickname: playerData.nickname,
      avatar: playerData.avatar || playerData.avatar_url || '',
      country: playerData.country || '',
      skillLevel: cs2Data.skill_level || cs2Data.skill_level_label || 1,
      elo: currentElo,
      savedElo: currentElo, // ELO при добавлении
      note: note || '', 
      color: color || 'red', 
      addedAt: Date.now() 
    };
    await saveBlacklist();
    return { success: true };
  } catch(e) {
    console.error('Blacklist API error:', e);
    return { success: false, error: 'api_error' };
  }
}

async function removeFromBlacklist(nickname) {
  delete blacklist[nickname.toLowerCase()];
  await saveBlacklist();
}

// Редактирование записи в чёрном списке
function openBlacklistEditModal(nick, entry, container) {
  const existing = document.getElementById('ft-bl-edit-modal');
  if (existing) existing.remove();
  
  const modal = document.createElement('div');
  modal.id = 'ft-bl-edit-modal';
  modal.className = 'ft-modal-inside';
  modal.innerHTML = `
    <div class="ft-modal-overlay"></div>
    <div class="ft-modal-box">
      <div class="ft-modal-header">
        <span>✏️ ${entry.nickname}</span>
        <button class="ft-modal-close">×</button>
      </div>
      <div class="ft-modal-body">
        <label class="ft-modal-label">${currentLang === 'ru' ? 'Заметка' : 'Note'}</label>
        <textarea class="ft-modal-textarea" id="ft-bl-edit-note" placeholder="${currentLang === 'ru' ? 'Заметка об игроке...' : 'Note about player...'}">${entry.note || ''}</textarea>
        <label class="ft-modal-label">${currentLang === 'ru' ? 'Цвет' : 'Color'}</label>
        <div class="ft-bl-colors" style="justify-content: flex-start;">
          <label class="ft-bl-color-opt">
            <input type="radio" name="ft-bl-edit-color" value="yellow" ${entry.color === 'yellow' ? 'checked' : ''}>
            <span class="ft-bl-color-box yellow"></span>
          </label>
          <label class="ft-bl-color-opt">
            <input type="radio" name="ft-bl-edit-color" value="red" ${entry.color === 'red' ? 'checked' : ''}>
            <span class="ft-bl-color-box red"></span>
          </label>
        </div>
      </div>
      <div class="ft-modal-btns">
        <button class="ft-modal-btn ft-modal-cancel">${currentLang === 'ru' ? 'Отмена' : 'Cancel'}</button>
        <button class="ft-modal-btn ft-modal-save">${currentLang === 'ru' ? 'Сохранить' : 'Save'}</button>
      </div>
    </div>
  `;
  
  // Добавляем в панель расширения, а не в body
  const panel = document.getElementById('ft-panel');
  if (panel) {
    panel.appendChild(modal);
  } else {
    document.body.appendChild(modal);
  }
  
  modal.querySelector('.ft-modal-textarea').focus();
  modal.querySelector('.ft-modal-overlay').onclick = () => modal.remove();
  modal.querySelector('.ft-modal-close').onclick = () => modal.remove();
  modal.querySelector('.ft-modal-cancel').onclick = () => modal.remove();
  modal.querySelector('.ft-modal-save').onclick = async () => {
    const newNote = document.getElementById('ft-bl-edit-note').value.trim();
    const newColor = document.querySelector('input[name="ft-bl-edit-color"]:checked').value;
    
    blacklist[nick].note = newNote;
    blacklist[nick].color = newColor;
    await saveBlacklist();
    modal.remove();
    renderBlacklistPage(container);
  };
}

// Обновить дату последней встречи
async function updateBlacklistLastSeen(nickname) {
  const key = nickname.toLowerCase();
  if (blacklist[key]) {
    blacklist[key].lastSeen = Date.now();
    await saveBlacklist();
  }
}

function getBlacklistEntry(nickname) {
  return blacklist[nickname.toLowerCase()] || null;
}

// Подсветка игроков на странице матча
async function highlightBlacklistedPlayers() {
  if (!window.location.pathname.includes('/room/')) return;
  if (!blacklistHighlightEnabled) {
    // Убираем подсветку если выключено
    document.querySelectorAll('.ft-hl-red, .ft-hl-yellow').forEach(el => {
      el.classList.remove('ft-hl-red', 'ft-hl-yellow');
      el.removeAttribute('data-ft-highlighted');
    });
    document.querySelectorAll('.ft-hl-badge').forEach(el => el.remove());
    return;
  }
  
  // Проверяем, активный ли матч (не завершённый)
  let isActiveMatch = false;
  try {
    // Ищем индикаторы активного матча на странице
    const pageText = document.body.innerText || '';
    const hasFinished = pageText.includes('Завершено') || pageText.includes('Finished') || pageText.includes('FINISHED');
    const hasCancelled = pageText.includes('Отменён') || pageText.includes('Cancelled') || pageText.includes('CANCELLED');
    
    // Если нет индикаторов завершения - матч активный
    isActiveMatch = !hasFinished && !hasCancelled;
  } catch(e) {
    isActiveMatch = false;
  }
  
  // Добавляем стили для анимации если ещё нет
  if (!document.getElementById('ft-blacklist-styles')) {
    const style = document.createElement('style');
    style.id = 'ft-blacklist-styles';
    style.textContent = `
      @keyframes ftPulseRed {
        0%, 100% { 
          box-shadow: 0 0 10px rgba(239,68,68,0.5), 0 0 20px rgba(239,68,68,0.3), 0 0 30px rgba(239,68,68,0.1);
          border-color: #ef4444;
        }
        50% { 
          box-shadow: 0 0 15px rgba(239,68,68,0.7), 0 0 30px rgba(239,68,68,0.4), 0 0 45px rgba(239,68,68,0.2);
          border-color: #f87171;
        }
      }
      @keyframes ftPulseYellow {
        0%, 100% { 
          box-shadow: 0 0 10px rgba(245,158,11,0.5), 0 0 20px rgba(245,158,11,0.3), 0 0 30px rgba(245,158,11,0.1);
          border-color: #f59e0b;
        }
        50% { 
          box-shadow: 0 0 15px rgba(245,158,11,0.7), 0 0 30px rgba(245,158,11,0.4), 0 0 45px rgba(245,158,11,0.2);
          border-color: #fbbf24;
        }
      }
      .ft-hl-red {
        border: 3px solid #ef4444 !important;
        border-radius: 14px !important;
        animation: ftPulseRed 2s ease-in-out infinite !important;
        position: relative !important;
        background: linear-gradient(135deg, rgba(239,68,68,0.08) 0%, transparent 50%) !important;
      }
      .ft-hl-yellow {
        border: 3px solid #f59e0b !important;
        border-radius: 14px !important;
        animation: ftPulseYellow 2s ease-in-out infinite !important;
        position: relative !important;
        background: linear-gradient(135deg, rgba(245,158,11,0.08) 0%, transparent 50%) !important;
      }
      .ft-hl-badge {
        position: absolute !important;
        top: -10px !important;
        right: 12px !important;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
        color: #fff !important;
        font-size: 11px !important;
        font-weight: 700 !important;
        padding: 4px 10px !important;
        border-radius: 8px !important;
        z-index: 1000 !important;
        box-shadow: 0 4px 12px rgba(239,68,68,0.5), 0 2px 4px rgba(0,0,0,0.3) !important;
        font-family: 'Segoe UI', sans-serif !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
        border: 2px solid rgba(255,255,255,0.2) !important;
      }
      .ft-hl-badge.yellow {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
        box-shadow: 0 4px 12px rgba(245,158,11,0.5), 0 2px 4px rgba(0,0,0,0.3) !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Ищем все ники игроков на странице
  const nicknameSelectors = [
    'a[href*="/players/"]',
    '[class*="nickname"]',
    '[class*="Nickname"]'
  ];
  
  nicknameSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      if (el.closest('#ft-widget')) return;
      
      let nickname = '';
      const href = el.getAttribute('href');
      if (href && href.includes('/players/')) {
        const match = href.match(/\/players\/([^\/\?#]+)/);
        if (match) nickname = match[1];
      }
      if (!nickname) nickname = el.textContent?.trim();
      if (!nickname) return;
      
      const entry = getBlacklistEntry(nickname);
      if (!entry) return;
      
      // Находим карточку игрока
      let card = el;
      for (let i = 0; i < 10; i++) {
        card = card.parentElement;
        if (!card) break;
        
        const style = window.getComputedStyle(card);
        const width = parseInt(style.width);
        const height = parseInt(style.height);
        
        if (width > 150 && height > 80) {
          if (!card.dataset.ftHighlighted) {
            card.dataset.ftHighlighted = 'true';
            card.classList.add(entry.color === 'yellow' ? 'ft-hl-yellow' : 'ft-hl-red');
            
            // Обновляем дату последней встречи только если матч активный
            if (isActiveMatch) {
              updateBlacklistLastSeen(nickname);
            }
            
            if (entry.note) {
              const badge = document.createElement('div');
              badge.className = `ft-hl-badge ${entry.color === 'yellow' ? 'yellow' : ''}`;
              badge.textContent = '⚠ ' + entry.note;
              badge.title = entry.note;
              card.appendChild(badge);
            }
          }
          break;
        }
      }
    });
  });
}

// Запускаем проверку при загрузке и при изменениях DOM
function startBlacklistChecker() {
  highlightBlacklistedPlayers();
  
  // Наблюдаем за изменениями DOM (для SPA)
  const observer = new MutationObserver(() => {
    highlightBlacklistedPlayers();
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Также проверяем периодически
  setInterval(highlightBlacklistedPlayers, 3000);
}

// Обновляем текущий ELO игроков в чёрном списке (с кэшированием)
let lastBlacklistUpdate = 0;
const BLACKLIST_UPDATE_INTERVAL = 60000; // Обновлять не чаще раза в минуту

async function updateBlacklistElo(force = false) {
  const now = Date.now();
  // Пропускаем если обновляли недавно (кроме принудительного обновления)
  if (!force && now - lastBlacklistUpdate < BLACKLIST_UPDATE_INTERVAL) {
    return;
  }
  lastBlacklistUpdate = now;
  
  const keys = Object.keys(blacklist);
  if (keys.length === 0) return;
  
  let updated = false;
  
  // Обновляем параллельно для скорости (максимум 5 одновременно)
  const batchSize = 5;
  for (let i = 0; i < keys.length; i += batchSize) {
    const batch = keys.slice(i, i + batchSize);
    const promises = batch.map(async (key) => {
      const entry = blacklist[key];
      if (!entry.id) return;
      
      try {
        const response = await fetch(`https://open.faceit.com/data/v4/players/${entry.id}`, {
          headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        if (response.ok) {
          const data = await response.json();
          const cs2Data = data.games?.cs2 || data.games?.csgo || {};
          const newElo = cs2Data.faceit_elo || cs2Data.elo || 0;
          const newLevel = cs2Data.skill_level || 1;
          
          if (entry.elo !== newElo || entry.skillLevel !== newLevel) {
            entry.elo = newElo;
            entry.skillLevel = newLevel;
            entry.avatar = data.avatar || entry.avatar;
            updated = true;
          }
        }
      } catch(e) {}
    });
    await Promise.all(promises);
  }
  
  if (updated) {
    await saveBlacklist();
  }
}

async function renderBlacklistPage(container) {
  const entries = Object.values(blacklist);
  
  const titleText = currentLang === 'ru' ? 'Чёрный список' : 'Blacklist';
  const placeholderText = currentLang === 'ru' ? 'Введите ник FACEIT' : 'Enter FACEIT nickname';
  const noteText = currentLang === 'ru' ? 'Заметка' : 'Note';
  const addText = currentLang === 'ru' ? 'Добавить' : 'Add';
  const emptyText = currentLang === 'ru' ? 'Список пуст' : 'List is empty';
  
  container.innerHTML = `
    <div class="ft-page ft-blacklist-page">
      <div class="ft-search-section">
        <div class="ft-search-box">
          <svg class="ft-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
          </svg>
          <input type="text" id="ft-bl-nickname" class="ft-search-input" placeholder="${placeholderText}">
          <div class="ft-bl-colors">
            <label class="ft-bl-color-opt" title="${currentLang === 'ru' ? 'Осторожно' : 'Warning'}">
              <input type="radio" name="ft-bl-color" value="yellow">
              <span class="ft-bl-color-box yellow"></span>
            </label>
            <label class="ft-bl-color-opt" title="${currentLang === 'ru' ? 'Избегать' : 'Avoid'}">
              <input type="radio" name="ft-bl-color" value="red" checked>
              <span class="ft-bl-color-box red"></span>
            </label>
          </div>
          <button class="ft-btn ft-btn-add" id="ft-bl-add">${addText}</button>
        </div>
        <input type="text" id="ft-bl-note" class="ft-bl-note-input" placeholder="${noteText} (${currentLang === 'ru' ? 'опционально' : 'optional'})">
        <div class="ft-error-msg" id="ft-bl-error"></div>
      </div>
      <div class="ft-section-header">
        <span>${titleText}</span>
        <span class="ft-count">${entries.length}</span>
      </div>
      <div class="ft-card" style="padding: 8px; flex: 1; min-height: 0;">
        <div class="ft-bl-list" id="ft-bl-list">
          ${entries.length === 0 ? `<div class="ft-empty">${emptyText}</div>` : entries.map(e => {
            const avatar = e.avatar || chrome.runtime.getURL('icons/default-avatar.svg');
            const currentElo = e.elo !== undefined && e.elo !== null ? e.elo : 0;
            const savedElo = e.savedElo !== undefined && e.savedElo !== null ? e.savedElo : currentElo;
            const eloDiff = currentElo - savedElo;
            const eloDiffText = eloDiff > 0 ? `+${eloDiff}` : eloDiff < 0 ? `${eloDiff}` : '';
            const eloDiffClass = eloDiff > 0 ? 'up' : eloDiff < 0 ? 'down' : '';
            const addedDate = e.addedAt ? new Date(e.addedAt).toLocaleDateString() : '';
            const lastSeenDate = e.lastSeen ? new Date(e.lastSeen).toLocaleDateString() : '';
            return `
            <div class="ft-bl-card ${e.color}" data-nick="${e.nickname.toLowerCase()}" data-id="${e.id}">
              <div class="ft-bl-avatar-wrap">
                <img src="${avatar}" class="ft-bl-avatar" onerror="this.src='${chrome.runtime.getURL('icons/default-avatar.svg')}'">
                <img src="${chrome.runtime.getURL(`static/skill_level_${e.skillLevel || 1}_lg.png`)}" class="ft-bl-level">
              </div>
              <div class="ft-bl-info">
                <div class="ft-bl-nick">${e.nickname}</div>
                <div class="ft-bl-stats">
                  <span class="ft-bl-elo">${currentElo} ELO</span>
                  ${eloDiffText ? `<span class="ft-bl-elo-diff ${eloDiffClass}">${eloDiffText}</span>` : ''}
                </div>
                ${e.note ? `<div class="ft-bl-note-text"><svg class="ft-note-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> ${e.note}</div>` : ''}
                <div class="ft-bl-dates">
                  ${addedDate ? `<span class="ft-bl-date">${currentLang === 'ru' ? 'Добавлен' : 'Added'}: ${addedDate}</span>` : ''}
                  ${lastSeenDate ? `<span class="ft-bl-date ft-bl-lastseen">${currentLang === 'ru' ? 'Встречен' : 'Seen'}: ${lastSeenDate}</span>` : ''}
                </div>
              </div>
              <div class="ft-bl-actions">
                <button class="ft-action-btn ft-btn-edit" data-nick="${e.nickname.toLowerCase()}" title="${currentLang === 'ru' ? 'Редактировать' : 'Edit'}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button class="ft-action-btn ft-btn-remove" data-nick="${e.nickname.toLowerCase()}" title="${currentLang === 'ru' ? 'Удалить' : 'Remove'}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          `}).join('')}
        </div>
      </div>
    </div>
  `;
  
  const addBtn = document.getElementById('ft-bl-add');
  const errorEl = document.getElementById('ft-bl-error');
  
  addBtn.addEventListener('click', async () => {
    const nickname = document.getElementById('ft-bl-nickname').value.trim();
    const note = document.getElementById('ft-bl-note').value.trim();
    const color = document.querySelector('input[name="ft-bl-color"]:checked').value;
    
    if (!nickname || nickname.length < 2) {
      errorEl.textContent = currentLang === 'ru' ? 'Введите ник (минимум 2 символа)' : 'Enter nickname (min 2 chars)';
      errorEl.style.display = 'block';
      return;
    }
    
    // Проверяем не добавлен ли уже
    if (blacklist[nickname.toLowerCase()]) {
      errorEl.textContent = currentLang === 'ru' ? 'Игрок уже в списке' : 'Player already in list';
      errorEl.style.display = 'block';
      return;
    }
    
    addBtn.disabled = true;
    addBtn.textContent = '...';
    errorEl.style.display = 'none';
    
    const result = await addToBlacklist(nickname, note, color);
    
    if (result.success) {
      document.getElementById('ft-bl-nickname').value = '';
      document.getElementById('ft-bl-note').value = '';
      renderBlacklistPage(container);
    } else {
      errorEl.textContent = currentLang === 'ru' ? `Игрок "${nickname}" не найден` : `Player "${nickname}" not found`;
      errorEl.style.display = 'block';
      addBtn.disabled = false;
      addBtn.textContent = addText;
    }
  });
  
  document.getElementById('ft-bl-nickname').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addBtn.click();
  });
  
  document.querySelectorAll('.ft-bl-card .ft-btn-remove').forEach(btn => {
    btn.addEventListener('click', async () => {
      await removeFromBlacklist(btn.dataset.nick);
      renderBlacklistPage(container);
    });
  });
  
  // Редактирование заметки
  document.querySelectorAll('.ft-bl-card .ft-btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const nick = btn.dataset.nick;
      const entry = blacklist[nick];
      if (!entry) return;
      openBlacklistEditModal(nick, entry, container);
    });
  });
  
  // Отложенное обновление ELO (после рендера, не блокирует UI)
  setTimeout(async () => {
    await updateBlacklistElo();
    // Перерисовываем только если всё ещё на странице blacklist
    if (currentPage === 'blacklist') {
      const listEl = document.getElementById('ft-bl-list');
      if (listEl) {
        const updatedEntries = Object.values(blacklist);
        // Обновляем только ELO без полного перерендера
        updatedEntries.forEach(e => {
          const card = document.querySelector(`.ft-bl-card[data-id="${e.id}"]`);
          if (card) {
            const eloEl = card.querySelector('.ft-bl-elo');
            const savedElo = e.savedElo || e.elo;
            const diff = e.elo - savedElo;
            if (eloEl) eloEl.textContent = `${e.elo} ELO`;
            
            // Обновляем diff badge
            let diffEl = card.querySelector('.ft-bl-elo-diff');
            if (diff !== 0) {
              const diffText = diff > 0 ? `+${diff}` : `${diff}`;
              const diffClass = diff > 0 ? 'up' : 'down';
              if (diffEl) {
                diffEl.textContent = diffText;
                diffEl.className = `ft-bl-elo-diff ${diffClass}`;
              }
            }
          }
        });
      }
    }
  }, 100);
}

const CHANGELOG = [
  {
    version: '1.5.2',
    title: 'Settings & UI',
    changes: [
      'Новая функция в разделе настройки',
      'Счётчик установок',
      'Улучшенная подсветка чёрного списка',
      'Мелкие изменения в интерфейсе'
    ]
  },
  {
    version: '1.5.1',
    title: 'Minor Fixes',
    changes: [
      'Мелкие исправления'
    ]
  },
  {
    version: '1.5.0',
    title: 'QR Codes & Donate',
    changes: [
      'QR коды для TON и USDT',
      'Улучшенная страница доната',
      'Мелкие исправления'
    ]
  },
  {
    version: '1.4.0',
    title: 'ELO Tracking & Optimization',
    changes: [
      'Отслеживание изменения ELO в чёрном списке',
      'Новый логотип расширения',
      'Оптимизация производительности',
      'Улучшенная валидация импорта',
      'Исправлены ошибки'
    ]
  },
  {
    version: '1.3.0',
    title: 'Blacklist & Backup',
    changes: [
      'Чёрный список игроков с подсветкой',
      'Экспорт/импорт данных',
      'Обновлённый интерфейс',
      'Компактная боковая панель'
    ]
  },
  {
    version: '1.2.0',
    title: 'UI Improvements',
    changes: [
      'Обновлённая страница "О нас"',
      'Время последнего матча для offline игроков',
      'Улучшенный счётчик игроков в матче',
      'Исправлены ошибки'
    ]
  },
  {
    version: '1.1.0',
    title: 'Real-time Status',
    changes: [
      'Статус игрока в реальном времени',
      'LIVE когда игрок в матче',
      'Автоматическое обновление статуса',
      'Улучшенный интерфейс'
    ]
  }
];

function t(key) {
  return LANG[currentLang]?.[key] || LANG.en[key] || key;
}

if (window.location.hostname.includes('faceit.com')) {
  initWidget();
}

async function initWidget() {
  await waitForElement('body');
  try {
    const result = await chrome.storage.local.get(['language', 'extensionEnabled', 'blacklistHighlightEnabled', 'showCoverBackground', 'widgetPosition']);
    currentLang = result.language || 'ru';
    extensionEnabled = result.extensionEnabled !== false;
    blacklistHighlightEnabled = result.blacklistHighlightEnabled !== false;
    showCoverBackground = result.showCoverBackground !== false;
    widgetPosition = result.widgetPosition || { right: 13, bottom: 70 };
  } catch(e) {}
  await loadNotes();
  await loadBlacklist();
  createWidget();
  loadTrackedPlayers();
  startStatusChecker();
  startBlacklistChecker();
  registerInstall(); // Регистрируем установку в Firebase
}

function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) return resolve(document.querySelector(selector));
    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) { observer.disconnect(); resolve(document.querySelector(selector)); }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => { observer.disconnect(); resolve(null); }, timeout);
  });
}

// Проверка статуса игроков каждые 5 секунд
function startStatusChecker() {
  checkAllPlayersStatus();
  statusCheckInterval = setInterval(checkAllPlayersStatus, 5000);
}

async function checkAllPlayersStatus() {
  // Проверяем что расширение ещё активно
  if (!isExtensionContextValid()) {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
      statusCheckInterval = null;
    }
    return;
  }
  
  try {
    const result = await chrome.storage.local.get('trackedPlayers');
    const players = result.trackedPlayers || [];
    if (players.length === 0) return;
    
    let updated = false;
    for (const player of players) {
      // Проверяем контекст перед каждым запросом
      if (!isExtensionContextValid()) return;
      
      const statusData = await checkPlayerInMatch(player.id);
      if (player.status !== statusData.status || player.streamerMode !== statusData.streamerMode) {
        player.status = statusData.status;
        player.streamerMode = statusData.streamerMode;
        player.isLive = statusData.status === 'live';
        updated = true;
      }
      
      // Обновляем время последнего матча и результаты
      if (!isExtensionContextValid()) return;
      try {
        const matchesRes = await fetch(`https://open.faceit.com/data/v4/players/${player.id}/history?game=cs2&limit=3`, {
          headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        if (matchesRes.ok) {
          const matchesData = await matchesRes.json();
          if (matchesData.items?.length > 0) {
            const newLastMatchTime = matchesData.items[0].finished_at;
            if (newLastMatchTime !== player.lastMatchTime) {
              player.lastMatchTime = newLastMatchTime;
              player.lastMatches = matchesData.items.map(match => {
                const playerTeam = match.teams?.faction1?.players?.some(p => p.player_id === player.id) ? 'faction1' : 'faction2';
                return playerTeam === match.results?.winner ? 'win' : 'loss';
              });
              updated = true;
            }
          }
        }
      } catch(e) {}
      
      // Обновляем рейтинг топ-1000 и ELO
      if (!isExtensionContextValid()) return;
      try {
        const playerRes = await fetch(`https://open.faceit.com/data/v4/players/${player.id}`, {
          headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        if (playerRes.ok) {
          const playerData = await playerRes.json();
          const cs2Data = playerData.games?.cs2 || {};
          const newElo = cs2Data.faceit_elo || player.elo;
          const newLevel = cs2Data.skill_level || player.skillLevel;
          
          if (newElo !== player.elo || newLevel !== player.skillLevel) {
            player.elo = newElo;
            player.skillLevel = newLevel;
            updated = true;
          }
        }
        
        // Проверяем рейтинг топ-1000
        const rankRes = await fetch(`https://open.faceit.com/data/v4/rankings/games/cs2/regions/EU/players/${player.id}?limit=1`, {
          headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        if (rankRes.ok) {
          const rankData = await rankRes.json();
          const newRank = (rankData.position && rankData.position <= 1000) ? rankData.position : null;
          if (newRank !== player.rankingPosition) {
            player.rankingPosition = newRank;
            updated = true;
          }
        }
      } catch(e) {}
    }
    
    if (updated && isExtensionContextValid()) {
      await chrome.storage.local.set({ trackedPlayers: players });
      if (currentPage === 'players') {
        renderPlayersList(players);
      }
    }
  } catch(e) {
    // Игнорируем ошибки контекста расширения
    if (e.message?.includes('Extension context invalidated')) {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        statusCheckInterval = null;
      }
      return;
    }
    console.error('Status check error:', e);
  }
}

async function checkPlayerInMatch(playerId) {
  try {
    // Метод 1: Проверяем через groupByState API (основной метод для матчей)
    const response = await fetch(`https://api.faceit.com/match/v1/matches/groupByState?userId=${playerId}`);
    
    if (response.ok) {
      const data = await response.json();
      // Проверяем есть ли ONGOING матчи
      if (data.payload?.ONGOING && data.payload.ONGOING.length > 0) {
        return { status: 'live', streamerMode: false };
      }
      // Проверяем CHECK_IN, VOTING, CONFIGURING - это тоже активный матч
      if (data.payload?.READY?.length > 0 || data.payload?.VOTING?.length > 0 || 
          data.payload?.CONFIGURING?.length > 0 || data.payload?.CHECK_IN?.length > 0) {
        return { status: 'live', streamerMode: false };
      }
    }
    
    // Метод 2: Проверяем через lobby state API (для стример мода)
    try {
      const stateResponse = await fetch(`https://api.faceit.com/lobby/v1/lobby/user/${playerId}/state`);
      if (stateResponse.ok) {
        const stateData = await stateResponse.json();
        const state = stateData.payload?.state;
        if (state === 'MATCH' || state === 'LOBBY') {
          return { status: 'live', streamerMode: true };
        }
      }
    } catch(e) {}
    
    // Метод 3: Проверяем через историю матчей (последний матч)
    try {
      const historyResponse = await fetch(`https://open.faceit.com/data/v4/players/${playerId}/history?game=cs2&limit=1`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        if (historyData.items?.length > 0) {
          const lastMatch = historyData.items[0];
          const matchId = lastMatch.match_id;
          
          // Проверяем статус последнего матча
          const matchResponse = await fetch(`https://api.faceit.com/match/v2/match/${matchId}`);
          if (matchResponse.ok) {
            const matchData = await matchResponse.json();
            const status = matchData.payload?.status;
            
            // Если матч активен
            if (['ONGOING', 'READY', 'VOTING', 'CONFIGURING', 'CAPTAIN_PICK', 'LIVE', 'CHECK_IN'].includes(status)) {
              return { status: 'live', streamerMode: true };
            }
          }
        }
      }
    } catch(e) {}
    
    return { status: 'offline', streamerMode: false };
  } catch(e) {
    console.error('Check match error:', e);
    return { status: 'offline', streamerMode: false };
  }
}

function createWidget() {
  if (document.getElementById('ft-widget')) return;
  const widget = document.createElement('div');
  widget.id = 'ft-widget';
  widget.style.cssText = `position: fixed; right: ${widgetPosition.right}px; bottom: ${widgetPosition.bottom}px; z-index: 999999; font-family: 'Segoe UI', -apple-system, sans-serif;`;
  widget.innerHTML = `
    <div class="ft-toggle" id="ft-toggle">
      <img src="${chrome.runtime.getURL('icons/Faceitlogo128.png')}" class="ft-toggle-logo" alt="FT">
      <span class="ft-badge" id="ft-badge">0</span>
    </div>
    <div class="ft-panel" id="ft-panel">
      <div class="ft-sidebar" id="ft-sidebar"></div>
      <div class="ft-main" id="ft-main"></div>
    </div>
  `;
  document.body.appendChild(widget);
  
  // Принудительно применяем стили после добавления в DOM
  const panel = document.getElementById('ft-panel');
  panel.style.cssText = 'position: fixed !important; right: 60px !important; bottom: 20px !important; width: 560px !important; height: 480px !important; max-height: 480px !important; overflow: hidden !important; background: #0a0a0a !important; border-radius: 16px !important; border: 1px solid #333 !important; display: none; box-shadow: 0 20px 60px rgba(0,0,0,0.8) !important;';
  
  const main = document.getElementById('ft-main');
  main.style.cssText = 'flex: 1 !important; display: flex !important; flex-direction: column !important; overflow: hidden !important; padding: 16px !important; min-height: 0 !important;';
  
  addStyles();
  renderSidebar();
  renderPage('players');
  document.getElementById('ft-toggle').addEventListener('click', togglePanel);
  document.addEventListener('click', (e) => {
    const panel = document.getElementById('ft-panel');
    const toggle = document.getElementById('ft-toggle');
    if (panelOpen && !panel.contains(e.target) && !toggle.contains(e.target)) togglePanel();
  });
}

function renderSidebar() {
  const sidebar = document.getElementById('ft-sidebar');
  sidebar.innerHTML = `
    <div class="ft-logo">
      <div class="ft-logo-icon">
        <img src="${chrome.runtime.getURL('icons/Faceitlogo128.png')}" width="32" height="32" style="object-fit: contain;" alt="FACEIT">
      </div>
    </div>
    <nav class="ft-nav">
      <button class="ft-nav-btn ${currentPage === 'players' ? 'active' : ''}" data-page="players" title="${t('players')}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      </button>
      <button class="ft-nav-btn ${currentPage === 'blacklist' ? 'active' : ''}" data-page="blacklist" title="${currentLang === 'ru' ? 'Чёрный список' : 'Blacklist'}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
        </svg>
      </button>
      <button class="ft-nav-btn ${currentPage === 'home' ? 'active' : ''}" data-page="home" title="${t('home')}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L3 9v11a2 2 0 0 0 2 2h4v-7h6v7h4a2 2 0 0 0 2-2V9l-9-7z"></path>
        </svg>
      </button>
      <button class="ft-nav-btn ${currentPage === 'donate' ? 'active' : ''}" data-page="donate" title="${t('donate')}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>
      <button class="ft-nav-btn ${currentPage === 'about' ? 'active' : ''}" data-page="about" title="${t('about')}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      </button>
    </nav>
  `;
  sidebar.querySelectorAll('.ft-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => renderPage(btn.dataset.page));
  });
}

function renderPage(page) {
  currentPage = page;
  const main = document.getElementById('ft-main');
  document.querySelectorAll('.ft-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });
  switch(page) {
    case 'home': renderHomePage(main); break;
    case 'players': renderPlayersPage(main); break;
    case 'blacklist': renderBlacklistPage(main); break;
    case 'donate': renderDonatePage(main); break;
    case 'about': renderAboutPage(main); break;
  }
}

function getLastMatchesHTML(matches) {
  if (!matches || matches.length === 0) {
    return '<div class="ft-matches"><span class="ft-match-empty">—</span></div>';
  }
  return `<div class="ft-matches">${matches.slice(0, 3).map(m => 
    `<span class="ft-match-dot ${m === 'win' ? 'win' : 'loss'}">${m === 'win' ? 'W' : 'L'}</span>`
  ).join('')}</div>`;
}

function formatLastMatchTime(timestamp) {
  if (!timestamp) return '';
  
  const now = Date.now();
  const matchTime = new Date(timestamp * 1000).getTime();
  const diff = now - matchTime;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (currentLang === 'ru') {
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    if (days === 1) return 'Вчера';
    if (days < 7) return `${days} дн назад`;
    return `${Math.floor(days / 7)} нед назад`;
  } else {
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  }
}

async function renderPlayersPage(container) {
  const result = await chrome.storage.local.get('trackedPlayers');
  const players = result.trackedPlayers || [];
  
  container.innerHTML = `
    <div class="ft-page" style="display: flex; flex-direction: column; height: 100%; min-height: 0;">
      <div class="ft-search-section">
        <div class="ft-search-box">
          <svg class="ft-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
          </svg>
          <input type="text" id="ft-nickname-input" class="ft-search-input" placeholder="${t('enterNickname')}">
          <button class="ft-btn ft-btn-add" id="ft-add-btn">${t('add')}</button>
        </div>
        <div class="ft-error-msg" id="ft-error-msg"></div>
      </div>
      <div class="ft-section-header">
        <span>${t('trackedPlayers')}</span>
        <span class="ft-count" id="ft-players-count">${players.length}</span>
      </div>
      <div class="ft-card" style="padding: 8px;">
        <div class="ft-players-list" id="ft-players-list" style="max-height: 330px; overflow-y: auto; overflow-x: hidden;"></div>
      </div>
    </div>
  `;
  
  renderPlayersList(players);
  
  document.getElementById('ft-add-btn').addEventListener('click', addPlayer);
  document.getElementById('ft-nickname-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addPlayer();
  });
}

function renderPlayersList(players) {
  const list = document.getElementById('ft-players-list');
  if (!list) return;
  
  // Обновляем счётчик игроков
  const countEl = document.getElementById('ft-players-count');
  if (countEl) {
    countEl.textContent = players.length;
  }
  
  if (players.length === 0) {
    list.innerHTML = `<div class="ft-empty">${t('noPlayers')}</div>`;
    return;
  }
  
  list.innerHTML = players.map(player => {
    // Безопасный URL аватара
    let avatar = player.avatar || '';
    if (!avatar || avatar === 'null' || avatar === 'undefined') {
      avatar = chrome.runtime.getURL('icons/default-avatar.svg');
    }
    
    const playerStatus = player.status || (player.isLive ? 'live' : 'offline');
    const streamerMode = player.streamerMode || false;
    const lastMatches = player.lastMatches || (player.lastMatchResult ? [player.lastMatchResult] : []);
    const lastMatchTime = player.lastMatchTime;
    const coverImage = player.cover && player.cover.startsWith('http') ? player.cover : '';
    const rankingPosition = player.rankingPosition;
    
    // Определяем статус и стиль
    let statusClass = 'offline';
    let statusText = t('offline');
    let statusIcon = '';
    let lastPlayedText = '';
    
    if (playerStatus === 'live') {
      if (streamerMode) {
        statusClass = 'live streamer';
        statusText = t('liveStreamer') || t('live') + ' 🎬';
        statusIcon = '<span class="ft-live-dot"></span>';
      } else {
        statusClass = 'live';
        statusText = t('live');
        statusIcon = '<span class="ft-live-dot"></span>';
      }
    } else {
      // Показываем время последнего матча
      lastPlayedText = formatLastMatchTime(lastMatchTime);
    }
    
    // Определяем бейдж уровня - если топ 1000, показываем ранг
    let levelBadgeHTML;
    if (rankingPosition && rankingPosition <= 1000) {
      // Цвета для топ 3
      let badgeColor = '#ef4444'; // красный по умолчанию
      let iconBg = '#1a1a1a';
      let textColor = '#1a1a1a';
      
      if (rankingPosition === 1) {
        badgeColor = '#fbbf24'; // золото
        iconBg = '#1a1a1a';
      } else if (rankingPosition === 2) {
        badgeColor = '#e2e8f0'; // серебро
        iconBg = '#1a1a1a';
      } else if (rankingPosition === 3) {
        badgeColor = '#fb923c'; // бронза
        iconBg = '#1a1a1a';
      }
      
      levelBadgeHTML = `
        <div class="ft-rank-badge-wrap" style="background: ${badgeColor};">
          <span class="ft-rank-number">#${rankingPosition}</span>
          <div class="ft-rank-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="11" fill="${iconBg}"/>
              <!-- Листочки венка слева -->
              <ellipse cx="5" cy="8" rx="1.5" ry="2.5" fill="${badgeColor}" transform="rotate(-30 5 8)"/>
              <ellipse cx="4" cy="11" rx="1.5" ry="2.5" fill="${badgeColor}" transform="rotate(-15 4 11)"/>
              <ellipse cx="4.5" cy="14" rx="1.5" ry="2.5" fill="${badgeColor}" transform="rotate(10 4.5 14)"/>
              <ellipse cx="6" cy="16.5" rx="1.5" ry="2.5" fill="${badgeColor}" transform="rotate(35 6 16.5)"/>
              <!-- Листочки венка справа -->
              <ellipse cx="19" cy="8" rx="1.5" ry="2.5" fill="${badgeColor}" transform="rotate(30 19 8)"/>
              <ellipse cx="20" cy="11" rx="1.5" ry="2.5" fill="${badgeColor}" transform="rotate(15 20 11)"/>
              <ellipse cx="19.5" cy="14" rx="1.5" ry="2.5" fill="${badgeColor}" transform="rotate(-10 19.5 14)"/>
              <ellipse cx="18" cy="16.5" rx="1.5" ry="2.5" fill="${badgeColor}" transform="rotate(-35 18 16.5)"/>
              <!-- Ленточки снизу -->
              <path d="M8 19 L7 22" stroke="${badgeColor}" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M16 19 L17 22" stroke="${badgeColor}" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M9 20 L10 19 M15 20 L14 19" stroke="${badgeColor}" stroke-width="1" stroke-linecap="round"/>
              <!-- Логотип FACEIT -->
              <polygon points="12,5 16,14 12,11 8,14" fill="${badgeColor}"/>
            </svg>
          </div>
        </div>`;
    } else {
      levelBadgeHTML = `<img src="${chrome.runtime.getURL(`static/skill_level_${player.skillLevel || 1}_lg.png`)}" class="ft-level-badge" alt="Level">`;
    }
    
    return `
      <div class="ft-player-card" data-id="${player.id}">
        ${coverImage && showCoverBackground ? `<div class="ft-player-bg" style="background-image: url('${coverImage}')"></div>` : ''}
        <div class="ft-player-left">
          <div class="ft-avatar-wrap">
            <img src="${avatar}" class="ft-player-avatar" onerror="this.src='${chrome.runtime.getURL('icons/default-avatar.svg')}'">
            ${levelBadgeHTML}
          </div>
          <div class="ft-player-info">
            <div class="ft-player-name">${player.nickname}</div>
            <div class="ft-player-stats">
              <span class="ft-elo">${player.elo || '—'} ELO</span>
              ${getLastMatchesHTML(lastMatches)}
            </div>
          </div>
        </div>
        <div class="ft-player-right">
          <div class="ft-status-wrap">
            <div class="ft-status-badge ${statusClass}">${statusIcon}${statusText}</div>
            ${playerStatus === 'offline' && lastPlayedText ? `<div class="ft-last-played">${lastPlayedText}</div>` : ''}
          </div>
          <div class="ft-player-actions">
            <button class="ft-action-btn ft-btn-profile" data-url="${player.profileUrl}" title="Profile">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </button>
            <button class="ft-action-btn ft-btn-remove" data-id="${player.id}" title="Remove">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  list.querySelectorAll('.ft-btn-profile').forEach(btn => {
    btn.addEventListener('click', () => window.open(btn.dataset.url, '_blank'));
  });
  
  list.querySelectorAll('.ft-btn-remove').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const result = await chrome.storage.local.get('trackedPlayers');
      const players = (result.trackedPlayers || []).filter(p => p.id !== id);
      await chrome.storage.local.set({ trackedPlayers: players });
      renderPlayersList(players);
      updateBadge(players);
    });
  });
}

async function addPlayer() {
  const input = document.getElementById('ft-nickname-input');
  const errorMsg = document.getElementById('ft-error-msg');
  const nickname = input.value.trim();
  
  // Скрываем предыдущую ошибку
  if (errorMsg) errorMsg.style.display = 'none';
  
  if (!nickname || nickname.length < 2) {
    showError(currentLang === 'ru' ? 'Введите ник (минимум 2 символа)' : 'Enter nickname (min 2 characters)');
    return;
  }
  
  const btn = document.getElementById('ft-add-btn');
  btn.disabled = true;
  btn.textContent = '...';
  
  try {
    const response = await fetch(`https://open.faceit.com/data/v4/players?nickname=${encodeURIComponent(nickname)}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    
    if (!response.ok) {
      showError(currentLang === 'ru' ? `Игрок "${nickname}" не найден` : `Player "${nickname}" not found`);
      return;
    }
    const playerData = await response.json();
    const cs2Data = playerData.games?.cs2 || {};
    
    // Get last 3 matches and last match time
    let lastMatches = [];
    let lastMatchTime = null;
    try {
      const matchesRes = await fetch(`https://open.faceit.com/data/v4/players/${playerData.player_id}/history?game=cs2&limit=3`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      const matchesData = await matchesRes.json();
      if (matchesData.items?.length > 0) {
        // Сохраняем время последнего матча
        lastMatchTime = matchesData.items[0].finished_at;
        lastMatches = matchesData.items.map(match => {
          const playerTeam = match.teams?.faction1?.players?.some(p => p.player_id === playerData.player_id) ? 'faction1' : 'faction2';
          return playerTeam === match.results?.winner ? 'win' : 'loss';
        });
      }
    } catch(e) {}
    
    // Get ranking position for top 1000 players
    let rankingPosition = null;
    try {
      const rankRes = await fetch(`https://open.faceit.com/data/v4/rankings/games/cs2/regions/EU/players/${playerData.player_id}?limit=1`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      if (rankRes.ok) {
        const rankData = await rankRes.json();
        if (rankData.position && rankData.position <= 1000) {
          rankingPosition = rankData.position;
        }
      }
    } catch(e) {}
    
    // Check if in match
    const statusData = await checkPlayerInMatch(playerData.player_id);
    
    const player = {
      id: playerData.player_id,
      nickname: playerData.nickname,
      avatar: playerData.avatar,
      cover: playerData.cover_image || '',
      country: playerData.country,
      skillLevel: cs2Data.skill_level || 1,
      elo: cs2Data.faceit_elo || 0,
      rankingPosition,
      lastMatches,
      lastMatchTime,
      status: statusData.status,
      isLive: statusData.status === 'live',
      streamerMode: statusData.streamerMode,
      profileUrl: `https://www.faceit.com/en/players/${playerData.nickname}`,
      addedAt: Date.now()
    };
    
    const result = await chrome.storage.local.get('trackedPlayers');
    const players = result.trackedPlayers || [];
    if (players.some(p => p.id === player.id)) {
      showError(currentLang === 'ru' ? 'Игрок уже добавлен' : 'Player already tracked');
      return;
    }
    players.push(player);
    await chrome.storage.local.set({ trackedPlayers: players });
    
    input.value = '';
    renderPlayersList(players);
    updateBadge(players);
    
  } catch(e) {
    showError(currentLang === 'ru' ? 'Ошибка: ' + e.message : 'Error: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = t('add');
  }
}

function showError(message) {
  const errorMsg = document.getElementById('ft-error-msg');
  if (errorMsg) {
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';
    setTimeout(() => {
      errorMsg.style.display = 'none';
    }, 4000);
  }
}

// Toast уведомление внутри плагина
function showToast(message, type = 'success') {
  // Удаляем старый toast если есть
  const old = document.getElementById('ft-toast');
  if (old) old.remove();
  
  const toast = document.createElement('div');
  toast.id = 'ft-toast';
  toast.className = `ft-toast ft-toast-${type}`;
  toast.innerHTML = `
    <div class="ft-toast-icon">
      ${type === 'success' ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>` : 
        `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`}
    </div>
    <span class="ft-toast-text">${message}</span>
  `;
  
  const panel = document.getElementById('ft-panel');
  if (panel) {
    panel.appendChild(toast);
    
    // Анимация появления
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Автоматическое скрытие
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Модальное окно подтверждения
function showConfirmModal(message) {
  return new Promise((resolve) => {
    const existing = document.getElementById('ft-confirm-modal');
    if (existing) existing.remove();
    
    const modal = document.createElement('div');
    modal.id = 'ft-confirm-modal';
    modal.className = 'ft-modal-inside';
    modal.innerHTML = `
      <div class="ft-modal-overlay"></div>
      <div class="ft-modal-box" style="width: 260px;">
        <div class="ft-modal-body" style="text-align: center; padding: 20px;">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" style="margin-bottom: 12px;">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div style="color: #fff; font-size: 14px; margin-bottom: 16px;">${message}</div>
        </div>
        <div class="ft-modal-btns">
          <button class="ft-modal-btn ft-modal-cancel">${currentLang === 'ru' ? 'Отмена' : 'Cancel'}</button>
          <button class="ft-modal-btn ft-modal-confirm" style="background: #ef4444;">${currentLang === 'ru' ? 'Да' : 'Yes'}</button>
        </div>
      </div>
    `;
    
    const panel = document.getElementById('ft-panel');
    if (panel) panel.appendChild(modal);
    
    modal.querySelector('.ft-modal-overlay').onclick = () => { modal.remove(); resolve(false); };
    modal.querySelector('.ft-modal-cancel').onclick = () => { modal.remove(); resolve(false); };
    modal.querySelector('.ft-modal-confirm').onclick = () => { modal.remove(); resolve(true); };
  });
}

async function renderHomePage(container) {
  // Получаем статистику и настройки
  const result = await chrome.storage.local.get(['trackedPlayers', 'notificationsEnabled', 'blacklist', 'blacklistHighlightEnabled', 'showCoverBackground', 'widgetPosition']);
  blacklistHighlightEnabled = result.blacklistHighlightEnabled !== false;
  showCoverBackground = result.showCoverBackground !== false;
  const players = result.trackedPlayers || [];
  const notificationsEnabled = result.notificationsEnabled !== false;
  const blacklistCount = Object.keys(result.blacklist || {}).length;
  
  const livePlayers = players.filter(p => p.status === 'live' || p.isLive).length;
  const totalMatches = players.reduce((sum, p) => sum + (p.lastMatches?.length || 0), 0);
  
  const statsLabel = currentLang === 'ru' ? 'Статистика' : currentLang === 'uk' ? 'Статистика' : 'Statistics';
  const playersLabel = currentLang === 'ru' ? 'Игроков' : currentLang === 'uk' ? 'Гравців' : 'Players';
  const liveLabel = currentLang === 'ru' ? 'В игре' : currentLang === 'uk' ? 'В грі' : 'Live';
  const blacklistLabel = currentLang === 'ru' ? 'Чёрный список' : currentLang === 'uk' ? 'Чорний список' : 'Blacklist';
  const settingsLabel = currentLang === 'ru' ? 'Настройки' : currentLang === 'uk' ? 'Налаштування' : 'Settings';
  const dataLabel = currentLang === 'ru' ? 'Данные' : currentLang === 'uk' ? 'Дані' : 'Data';
  const exportLabel = currentLang === 'ru' ? 'Экспорт' : currentLang === 'uk' ? 'Експорт' : 'Export';
  const importLabel = currentLang === 'ru' ? 'Импорт' : currentLang === 'uk' ? 'Імпорт' : 'Import';
  
  container.innerHTML = `
    <div class="ft-page ft-home-page" style="overflow-y: auto;">
      <div class="ft-stats-grid">
        <div class="ft-stat-card">
          <div class="ft-stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div class="ft-stat-value">${players.length}</div>
          <div class="ft-stat-label">${playersLabel}</div>
        </div>
        <div class="ft-stat-card ${livePlayers > 0 ? 'ft-stat-live' : ''}">
          <div class="ft-stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${livePlayers > 0 ? '#ef4444' : '#888'}" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="10 8 16 12 10 16 10 8" fill="${livePlayers > 0 ? '#ef4444' : '#888'}"></polygon>
            </svg>
          </div>
          <div class="ft-stat-value" style="${livePlayers > 0 ? 'color: #ef4444;' : ''}">${livePlayers}</div>
          <div class="ft-stat-label">${liveLabel}</div>
        </div>
        <div class="ft-stat-card">
          <div class="ft-stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
            </svg>
          </div>
          <div class="ft-stat-value">${blacklistCount}</div>
          <div class="ft-stat-label">${blacklistLabel}</div>
        </div>
      </div>
      
      <div class="ft-card">
        <div class="ft-card-header">
          <span>${settingsLabel}</span>
          <button class="ft-reset-btn" id="ft-reset-settings" title="${currentLang === 'ru' ? 'Сбросить настройки' : 'Reset settings'}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
          </button>
        </div>
        <div class="ft-card-row">
          <span class="ft-card-label">${t('language')}</span>
          <select id="ft-lang-select" class="ft-select">
            <option value="en" ${currentLang === 'en' ? 'selected' : ''}>English</option>
            <option value="ru" ${currentLang === 'ru' ? 'selected' : ''}>Русский</option>
            <option value="uk" ${currentLang === 'uk' ? 'selected' : ''}>Українська</option>
            <option value="pl" ${currentLang === 'pl' ? 'selected' : ''}>Polski</option>
            <option value="de" ${currentLang === 'de' ? 'selected' : ''}>Deutsch</option>
          </select>
        </div>
        <div class="ft-card-row">
          <span class="ft-card-label">${currentLang === 'ru' ? 'Подсветка чёрного списка' : 'Blacklist highlight'}</span>
          <label class="ft-switch">
            <input type="checkbox" id="ft-highlight-toggle" ${blacklistHighlightEnabled ? 'checked' : ''}>
            <span class="ft-switch-slider"></span>
          </label>
        </div>
        <div class="ft-card-row">
          <span class="ft-card-label">${currentLang === 'ru' ? 'Фон карточек игроков' : 'Player card background'}</span>
          <label class="ft-switch">
            <input type="checkbox" id="ft-cover-toggle" ${showCoverBackground ? 'checked' : ''}>
            <span class="ft-switch-slider"></span>
          </label>
        </div>
      </div>
      
      <div class="ft-card">
        <div class="ft-card-header">${dataLabel}</div>
        <div class="ft-card-row" style="flex-direction: column; align-items: stretch; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="ft-card-label">${currentLang === 'ru' ? 'Бэкап данных' : 'Backup data'}</span>
            <div class="ft-data-btns">
              <button class="ft-data-btn" id="ft-export-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                ${exportLabel}
              </button>
              <button class="ft-data-btn" id="ft-import-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                ${importLabel}
              </button>
              <input type="file" id="ft-import-file" accept=".json" style="display:none">
            </div>
          </div>
          <div class="ft-backup-hint">${currentLang === 'ru' 
            ? 'Сохраните перед: очисткой кэша, переустановкой браузера, удалением расширения, сменой ПК' 
            : 'Save before: clearing cache, reinstalling browser, removing extension, changing PC'}</div>
        </div>
        <div class="ft-card-row" style="margin-top: 8px;">
          <span class="ft-card-label">${currentLang === 'ru' ? 'Очистить данные' : 'Clear data'}</span>
          <div class="ft-data-btns">
            <button class="ft-data-btn ft-btn-danger" id="ft-clear-players">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              ${currentLang === 'ru' ? 'Игроки' : 'Players'}
            </button>
            <button class="ft-data-btn ft-btn-danger" id="ft-clear-blacklist">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              ${currentLang === 'ru' ? 'Чёрный список' : 'Blacklist'}
            </button>
          </div>
        </div>
      </div>
      
      <div class="ft-card">
        <div class="ft-card-header">${t('changelog')}<span class="ft-version-badge">v${VERSION}</span></div>
        <div class="ft-changelog">${CHANGELOG.map(item => `
          <div class="ft-changelog-item">
            <div class="ft-changelog-header">
              <span class="ft-changelog-version">${item.version}</span>
              <span class="ft-changelog-title">${item.title}</span>
              <span class="ft-changelog-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
            </div>
            <ul class="ft-changelog-list">${item.changes.map(c => `<li>${c}</li>`).join('')}</ul>
          </div>
        `).join('')}</div>
      </div>
    </div>
  `;
  
  document.getElementById('ft-lang-select').addEventListener('change', async (e) => {
    currentLang = e.target.value;
    await chrome.storage.local.set({ language: currentLang });
    renderSidebar();
    renderPage('home');
  });
  
  // Переключатель подсветки чёрного списка
  document.getElementById('ft-highlight-toggle').addEventListener('change', async (e) => {
    blacklistHighlightEnabled = e.target.checked;
    await chrome.storage.local.set({ blacklistHighlightEnabled });
    highlightBlacklistedPlayers();
  });
  
  // Переключатель фона карточек
  document.getElementById('ft-cover-toggle').addEventListener('change', async (e) => {
    showCoverBackground = e.target.checked;
    await chrome.storage.local.set({ showCoverBackground });
    // Перерисовываем список игроков если нужно
    const result = await chrome.storage.local.get('trackedPlayers');
    renderPlayersList(result.trackedPlayers || []);
  });
  
  // Очистить игроков
  document.getElementById('ft-clear-players').addEventListener('click', async () => {
    if (await showConfirmModal(currentLang === 'ru' ? 'Удалить всех игроков?' : 'Delete all players?')) {
      await chrome.storage.local.set({ trackedPlayers: [] });
      showToast(currentLang === 'ru' ? 'Игроки удалены' : 'Players deleted', 'success');
      renderPage('home');
    }
  });
  
  // Очистить чёрный список
  document.getElementById('ft-clear-blacklist').addEventListener('click', async () => {
    if (await showConfirmModal(currentLang === 'ru' ? 'Очистить чёрный список?' : 'Clear blacklist?')) {
      blacklist = {};
      await chrome.storage.local.set({ blacklist: {} });
      showToast(currentLang === 'ru' ? 'Чёрный список очищен' : 'Blacklist cleared', 'success');
      renderPage('home');
    }
  });
  
  // Сбросить настройки
  document.getElementById('ft-reset-settings').addEventListener('click', async () => {
    if (await showConfirmModal(currentLang === 'ru' ? 'Сбросить все настройки?' : 'Reset all settings?')) {
      currentLang = 'ru';
      blacklistHighlightEnabled = true;
      showCoverBackground = true;
      widgetPosition = { right: 13, bottom: 70 };
      await chrome.storage.local.set({ 
        language: 'ru', 
        blacklistHighlightEnabled: true, 
        showCoverBackground: true,
        widgetPosition: { right: 13, bottom: 70 }
      });
      // Обновляем позицию виджета
      const widget = document.getElementById('ft-widget');
      if (widget) {
        widget.style.right = '13px';
        widget.style.bottom = '70px';
      }
      showToast(currentLang === 'ru' ? 'Настройки сброшены' : 'Settings reset', 'success');
      renderSidebar();
      renderPage('home');
    }
  });
  
  // Экспорт данных
  document.getElementById('ft-export-btn').addEventListener('click', async () => {
    const data = await chrome.storage.local.get(['trackedPlayers', 'blacklist', 'playerNotes', 'language', 'blacklistHighlightEnabled', 'showCoverBackground', 'widgetPosition']);
    const exportData = {
      version: VERSION,
      exportedAt: new Date().toISOString(),
      trackedPlayers: data.trackedPlayers || [],
      blacklist: data.blacklist || {},
      playerNotes: data.playerNotes || {},
      settings: {
        language: data.language || 'ru',
        blacklistHighlightEnabled: data.blacklistHighlightEnabled !== false,
        showCoverBackground: data.showCoverBackground !== false,
        widgetPosition: data.widgetPosition || { right: 13, bottom: 70 }
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `faceitracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
  
  // Импорт данных
  document.getElementById('ft-import-btn').addEventListener('click', () => {
    document.getElementById('ft-import-file').click();
  });
  
  document.getElementById('ft-import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      // Проверяем расширение файла
      if (!file.name.endsWith('.json')) {
        showToast(currentLang === 'ru' ? 'Неверный формат файла. Нужен .json' : 'Invalid file format. Need .json', 'error');
        e.target.value = '';
        return;
      }
      
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Валидация структуры файла - проверяем что это наш файл экспорта FACEITracker
      // Файл должен содержать exportedAt (наш маркер) или специфичную структуру данных
      const hasOurMarker = data.exportedAt || (data.version && /^\d+\.\d+\.\d+$/.test(data.version));
      const hasValidPlayers = data.trackedPlayers && Array.isArray(data.trackedPlayers) && 
        (data.trackedPlayers.length === 0 || (data.trackedPlayers[0].id && data.trackedPlayers[0].nickname && data.trackedPlayers[0].profileUrl));
      const hasValidBlacklist = data.blacklist && typeof data.blacklist === 'object' &&
        (Object.keys(data.blacklist).length === 0 || Object.values(data.blacklist).some(v => v.nickname && (v.color === 'red' || v.color === 'yellow')));
      
      const isValidExport = data && typeof data === 'object' && (
        hasOurMarker || hasValidPlayers || hasValidBlacklist
      );
      
      if (!isValidExport) {
        showToast(currentLang === 'ru' ? 'Это не файл FACEITracker' : 'This is not a FACEITracker file', 'error');
        e.target.value = '';
        return;
      }
      
      // Проверяем что есть хоть какие-то данные для импорта
      const hasData = data.trackedPlayers?.length > 0 || 
                      Object.keys(data.blacklist || {}).length > 0 || 
                      Object.keys(data.playerNotes || {}).length > 0 ||
                      data.settings;
      
      if (!hasData) {
        showToast(currentLang === 'ru' ? 'Файл пустой или повреждён' : 'File is empty or corrupted', 'error');
        e.target.value = '';
        return;
      }
      
      // Импортируем данные
      if (data.trackedPlayers) await chrome.storage.local.set({ trackedPlayers: data.trackedPlayers });
      if (data.blacklist) {
        await chrome.storage.local.set({ blacklist: data.blacklist });
        blacklist = data.blacklist;
      }
      if (data.playerNotes) {
        await chrome.storage.local.set({ playerNotes: data.playerNotes });
        playerNotes = data.playerNotes;
      }
      if (data.settings) {
        if (data.settings.language) {
          currentLang = data.settings.language;
          await chrome.storage.local.set({ language: currentLang });
        }
        if (data.settings.blacklistHighlightEnabled !== undefined) {
          blacklistHighlightEnabled = data.settings.blacklistHighlightEnabled;
          await chrome.storage.local.set({ blacklistHighlightEnabled });
        }
        if (data.settings.showCoverBackground !== undefined) {
          showCoverBackground = data.settings.showCoverBackground;
          await chrome.storage.local.set({ showCoverBackground });
        }
        if (data.settings.widgetPosition) {
          widgetPosition = data.settings.widgetPosition;
          await chrome.storage.local.set({ widgetPosition });
          const widget = document.getElementById('ft-widget');
          if (widget) {
            widget.style.right = widgetPosition.right + 'px';
            widget.style.bottom = widgetPosition.bottom + 'px';
          }
        }
      }
      
      showToast(currentLang === 'ru' ? 'Данные успешно импортированы!' : 'Data imported successfully!', 'success');
      renderSidebar();
      renderPage('home');
    } catch(err) {
      showToast(currentLang === 'ru' ? 'Ошибка чтения файла' : 'Error reading file', 'error');
    }
    
    e.target.value = '';
  });
}

function renderDonatePage(container) {
  container.innerHTML = `
    <div class="ft-page" style="overflow-y: auto;">
      <div class="ft-donate-header">
        <div class="ft-donate-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </div>
        <h2>${t('supportProject')}</h2>
        <p class="ft-donate-desc">${t('donateDesc')}</p>
      </div>
      
      <div class="ft-card">
        <div class="ft-donate-method">
          <div class="ft-donate-method-icon">💎</div>
          <div class="ft-donate-method-info">
            <div class="ft-donate-method-name">TON</div>
            <div class="ft-donate-address">
              <code id="ton-address">UQB9hVIr_GEg_zTrMrBeBzQvRNDaapsjC8NFvzAHNABfHsdH</code>
              <button class="ft-copy-btn" id="copy-ton">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
          </div>
          <div class="ft-qr-wrap" id="ft-ton-qr-toggle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
            </svg>
          </div>
        </div>
        <div class="ft-qr-container" id="ft-ton-qr-container" style="display: none;">
          <img src="${chrome.runtime.getURL('static/ton_qr.png')}" class="ft-qr-code" alt="TON QR">
          <div class="ft-qr-hint">${currentLang === 'ru' ? 'Сканируйте для оплаты' : 'Scan to pay'}</div>
        </div>
      </div>
      
      <div class="ft-card">
        <div class="ft-donate-method">
          <div class="ft-donate-method-icon">🪙</div>
          <div class="ft-donate-method-info">
            <div class="ft-donate-method-name">USDT (TRC20)</div>
            <div class="ft-donate-address">
              <code id="usdt-address">TRpPCX8Pap25zNVRRq1ExLnZg95v4pedYQ</code>
              <button class="ft-copy-btn" id="copy-usdt">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
          </div>
          <div class="ft-qr-wrap" id="ft-qr-toggle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
            </svg>
          </div>
        </div>
        <div class="ft-qr-container" id="ft-qr-container" style="display: none;">
          <img src="${chrome.runtime.getURL('static/usdt_qr.png')}" class="ft-qr-code" alt="USDT QR">
          <div class="ft-qr-hint">${currentLang === 'ru' ? 'Сканируйте для оплаты' : 'Scan to pay'}</div>
        </div>
      </div>
    </div>
  `;
  
  // QR toggle
  document.getElementById('ft-qr-toggle').addEventListener('click', function() {
    const container = document.getElementById('ft-qr-container');
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
  });
  
  document.getElementById('ft-ton-qr-toggle').addEventListener('click', function() {
    const container = document.getElementById('ft-ton-qr-container');
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
  });
  
  document.getElementById('copy-ton').addEventListener('click', function() {
    navigator.clipboard.writeText('UQB9hVIr_GEg_zTrMrBeBzQvRNDaapsjC8NFvzAHNABfHsdH');
    const btn = this;
    btn.innerHTML = '✓';
    btn.style.color = '#4ade80';
    setTimeout(() => {
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
      btn.style.color = '';
    }, 1500);
  });
  
  document.getElementById('copy-usdt').addEventListener('click', function() {
    navigator.clipboard.writeText('TRpPCX8Pap25zNVRRq1ExLnZg95v4pedYQ');
    const btn = this;
    btn.innerHTML = '✓';
    btn.style.color = '#4ade80';
    setTimeout(() => {
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
      btn.style.color = '';
    }, 1500);
  });
}

async function renderAboutPage(container) {
  const installCount = await getInstallCount();
  
  container.innerHTML = `
    <div class="ft-page">
      <div class="ft-about-grid">
        <div class="ft-about-card">
          <span class="ft-about-card-label">${currentLang === 'ru' ? 'ВЕРСИЯ' : 'VERSION'}</span>
          <span class="ft-about-card-value">${VERSION}</span>
        </div>
        <div class="ft-about-card">
          <span class="ft-about-card-label">${currentLang === 'ru' ? 'АВТОР' : 'AUTHOR'}</span>
          <span class="ft-about-card-value">BambooFury</span>
        </div>
        <div class="ft-about-card">
          <span class="ft-about-card-label">${currentLang === 'ru' ? 'УСТАНОВОК' : 'INSTALLS'}</span>
          <span class="ft-about-card-value ft-installs-count">${installCount}</span>
        </div>
      </div>
      <div class="ft-about-grid ft-about-grid-2">
        <a href="https://mail.google.com/mail/?view=cm&to=hohondima3@gmail.com&su=FACEITracker%20Feedback" target="_blank" class="ft-about-card ft-about-card-link">
          <span class="ft-about-card-label">EMAIL</span>
          <div class="ft-about-card-icon">
            <svg height="32" viewBox="0 0 48 48" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z" fill="#4caf50"></path><path d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z" fill="#1e88e5"></path><polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"></polygon><path d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z" fill="#c62828"></path><path d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0 C43.076,8,45,9.924,45,12.298z" fill="#fbc02d"></path></svg>
          </div>
        </a>
        <a href="https://github.com/BambooFury" target="_blank" class="ft-about-card ft-about-card-link">
          <span class="ft-about-card-label">GITHUB</span>
          <div class="ft-about-card-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#fff">
              <path d="M12 2A10 10 0 002 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"/>
            </svg>
          </div>
        </a>
      </div>
      <div class="ft-about-footer">
        <p>FACEIT Tracker - ${currentLang === 'ru' ? 'отслеживайте любимых игроков CS2' : 'track your favorite CS2 players'}</p>
      </div>
    </div>
  `;
}

function togglePanel() {
  const panel = document.getElementById('ft-panel');
  panelOpen = !panelOpen;
  if (panelOpen) {
    panel.style.display = 'flex';
  } else {
    panel.style.display = 'none';
  }
  panel.classList.toggle('open', panelOpen);
}

async function loadTrackedPlayers() {
  try {
    const result = await chrome.storage.local.get('trackedPlayers');
    const players = result.trackedPlayers || [];
    updateBadge(players);
  } catch(e) {}
}

function updateBadge(players) {
  const badge = document.getElementById('ft-badge');
  if (badge) {
    // Считаем игроков в матче или в поиске
    const playersArray = Array.isArray(players) ? players : [];
    const liveCount = playersArray.filter(p => p.status === 'live' || p.isLive).length;
    const queueCount = playersArray.filter(p => p.status === 'queue').length;
    const totalActive = liveCount + queueCount;
    
    badge.textContent = totalActive;
    badge.style.display = totalActive > 0 ? 'flex' : 'none';
    
    // Красный если в матче, оранжевый если только в поиске
    if (liveCount > 0) {
      badge.style.background = '#ef4444';
    } else if (queueCount > 0) {
      badge.style.background = '#f59e0b';
    }
  }
}

chrome.storage.onChanged.addListener((changes) => {
  if (changes.trackedPlayers) {
    const players = changes.trackedPlayers.newValue || [];
    updateBadge(players);
    if (currentPage === 'players') renderPlayersList(players);
  }
});

function addStyles() {
  if (document.getElementById('ft-styles')) return;
  const styles = document.createElement('style');
  styles.id = 'ft-styles';
  styles.textContent = `
    #ft-widget { position: fixed; right: 13px; bottom: 70px; z-index: 999999; font-family: 'Segoe UI', -apple-system, sans-serif; }
    .ft-toggle { width: 40px; height: 40px; background: #1a1a1a; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; position: relative; border: 1px solid #333; }
    .ft-toggle:hover { background: #222; border-color: #555; }
    .ft-toggle-logo { width: 32px; height: 32px; object-fit: contain; opacity: 0.7; transition: opacity 0.2s; margin-left: 1px; }
    .ft-toggle:hover .ft-toggle-logo { opacity: 1; }
    .ft-badge { position: absolute; top: -4px; right: -4px; background: #ef4444; color: white; font-size: 9px; font-weight: bold; min-width: 14px; height: 14px; border-radius: 7px; display: none; align-items: center; justify-content: center; animation: ftPulse 1.5s infinite; }
    .ft-panel { position: fixed; right: 60px; bottom: 20px; width: 560px; height: 480px; background: #0a0a0a; border-radius: 16px; border: 1px solid #333; display: none; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.8); }
    .ft-panel.open { display: flex; animation: ftSlideIn 0.25s ease; }
    @keyframes ftSlideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
    .ft-sidebar { width: 52px; background: #0a0a0a; border-right: 1px solid #1a1a1a; display: flex; flex-direction: column; align-items: center; padding: 12px 0; }
    .ft-logo { margin-bottom: 16px; }
    .ft-logo-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; }
    .ft-nav { display: flex; flex-direction: column; gap: 4px; width: 100%; padding: 0 8px; }
    .ft-nav-btn { width: 36px; height: 36px; background: transparent; border: none; border-radius: 8px; color: #555; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
    .ft-nav-btn:hover { background: rgba(255,255,255,0.06); color: #aaa; }
    .ft-nav-btn.active { background: rgba(255,255,255,0.08); color: #fff; }
    .ft-main { flex: 1; overflow: hidden; padding: 16px; display: flex; flex-direction: column; }
    .ft-page { display: flex; flex-direction: column; gap: 12px; flex: 1; min-height: 0; overflow: hidden; }
  `;
  document.head.appendChild(styles);
  addStyles2();
}

function addStyles2() {
  const s = document.createElement('style');
  s.textContent = `
    .ft-search-section { margin-bottom: 8px; }
    .ft-search-box { display: flex; align-items: center; gap: 8px; background: #111; border: 1px solid #222; border-radius: 10px; padding: 4px 4px 4px 12px; }
    .ft-error-msg { display: none; color: #ef4444; font-size: 12px; padding: 8px 0 0 0; }
    .ft-search-icon { color: #555; flex-shrink: 0; }
    .ft-search-input { flex: 1; background: transparent; border: none; color: #fff; font-size: 13px; padding: 8px 0; outline: none; }
    .ft-search-input::placeholder { color: #444; }
    .ft-search-input:-webkit-autofill,
    .ft-search-input:-webkit-autofill:hover,
    .ft-search-input:-webkit-autofill:focus,
    .ft-search-input:-webkit-autofill:active { -webkit-box-shadow: 0 0 0 30px #111 inset !important; -webkit-text-fill-color: #fff !important; caret-color: #fff; }
    .ft-btn-add { background: #333; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .ft-btn-add:hover { background: #444; }
    .ft-btn-add:disabled { opacity: 0.5; }
    .ft-section-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; color: #888; font-size: 13px; font-weight: 500; }
    .ft-count { background: #333; color: #fff; font-size: 11px; padding: 2px 8px; border-radius: 10px; }
    .ft-players-list { display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; overflow-x: hidden; padding-right: 8px; }
    .ft-players-card { padding: 8px !important; max-height: 360px; overflow: hidden; }
    .ft-players-list::-webkit-scrollbar { width: 6px; }
    .ft-players-list::-webkit-scrollbar-track { background: #1a1a1a; border-radius: 3px; }
    .ft-players-list::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #444 0%, #333 100%); border-radius: 3px; }
    .ft-players-list::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #555 0%, #444 100%); }
    .ft-player-card { display: flex; align-items: center; justify-content: space-between; padding: 14px; background: #141414; border: 1px solid #222; border-radius: 12px; transition: all 0.2s; position: relative; overflow: hidden; min-height: 50px; }
    .ft-player-card:hover { border-color: #333; }
    .ft-player-bg { position: absolute; top: -10px; left: -10px; right: -10px; bottom: -10px; background-size: cover; background-position: center top; opacity: 0.15; z-index: 0; pointer-events: none; filter: blur(1px); }
    .ft-player-bg::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.6) 100%); }
    .ft-player-left, .ft-player-right { position: relative; z-index: 1; }
    .ft-player-left { display: flex; align-items: center; gap: 12px; }
    .ft-avatar-wrap { position: relative; flex-shrink: 0; }
    .ft-player-avatar { width: 44px; height: 44px; border-radius: 50%; background: #222; object-fit: cover; }
    .ft-level-badge { position: absolute; bottom: -2px; right: -2px; width: 20px; height: 20px; object-fit: contain; }
    .ft-rank-badge-wrap { position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; background: #ef4444; border-radius: 8px; padding: 0px 1px 0px 4px; gap: 1px; border: 2px solid #0a0a0a; }
    .ft-rank-number { color: #1a1a1a; font-size: 8px; font-weight: 800; font-style: italic; }
    .ft-rank-icon { width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; }
    .ft-player-info { display: flex; flex-direction: column; gap: 4px; }
    .ft-player-name { font-size: 14px; font-weight: 600; color: #fff; }
    .ft-player-stats { display: flex; align-items: center; gap: 10px; }
    .ft-elo { color: #888; font-size: 12px; font-weight: 600; }
    .ft-matches { display: flex; gap: 4px; }
    .ft-match-dot { width: 20px; height: 20px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }
    .ft-match-dot.win { background: rgba(74,222,128,0.2); color: #4ade80; }
    .ft-match-dot.loss { background: rgba(248,113,113,0.2); color: #f87171; }
    .ft-match-empty { color: #333; font-size: 12px; }
    .ft-player-right { display: flex; align-items: center; gap: 10px; }
    .ft-status-wrap { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 85px; }
    .ft-last-played { font-size: 9px; color: #555; }
    .ft-status-badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 4px; min-width: 75px; }
    .ft-status-badge.live { background: #1a1a1a; color: #ef4444; border: 1px solid #ef4444; animation: ftPulse 1.5s infinite; }
    .ft-status-badge.live.streamer { background: #1a1a1a; color: #a855f7; border: 1px solid #a855f7; }
    .ft-status-badge.queue { background: #1a1a1a; color: #f59e0b; border: 1px solid #f59e0b; animation: ftPulse 2s infinite; }
    .ft-status-badge.offline { background: #1a1a1a; color: #666; border: 1px solid #333; }
    .ft-live-dot { width: 6px; height: 6px; background: #ef4444; border-radius: 50%; }
    .ft-status-badge.streamer .ft-live-dot { background: #a855f7; }
    @keyframes ftPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
    .ft-player-actions { display: flex; gap: 6px; }
    .ft-action-btn { width: 32px; height: 32px; background: #1a1a1a; border: 1px solid #333; border-radius: 6px; color: #666; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .ft-action-btn:hover { background: #222; color: #fff; border-color: #444; }
    .ft-btn-note.has-note { color: #f59e0b; border-color: rgba(245,158,11,0.4); }
    .ft-btn-note:hover { color: #f59e0b; border-color: #f59e0b; }
    .ft-btn-remove:hover { background: #ef4444; border-color: #ef4444; color: #fff; }
    .ft-empty { text-align: center; color: #444; padding: 40px; font-size: 13px; }
    #ft-note-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 99999999; display: flex; align-items: center; justify-content: center; }
    .ft-note-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); }
    .ft-note-box { position: relative; background: #111; border: 1px solid #333; border-radius: 12px; width: 320px; }
    .ft-note-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #222; }
    .ft-note-header span { color: #fff; font-size: 14px; font-weight: 600; }
    .ft-note-close { background: none; border: none; color: #666; font-size: 20px; cursor: pointer; }
    .ft-note-close:hover { color: #fff; }
    .ft-note-input { width: 100%; height: 100px; background: #0a0a0a; border: none; color: #fff; padding: 12px 16px; font-size: 13px; resize: none; outline: none; font-family: inherit; box-sizing: border-box; }
    .ft-note-input::placeholder { color: #444; }
    .ft-note-date { padding: 8px 16px; font-size: 11px; color: #555; border-top: 1px solid #222; }
    .ft-note-btns { display: flex; gap: 8px; padding: 12px 16px; justify-content: flex-end; border-top: 1px solid #222; }
    .ft-note-cancel, .ft-note-save { padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; }
    .ft-note-cancel { background: #222; color: #888; }
    .ft-note-cancel:hover { background: #333; color: #fff; }
    .ft-note-save { background: #f59e0b; color: #000; }
    .ft-note-save:hover { background: #fbbf24; }
    /* Blacklist styles */
    .ft-blacklist-page { display: flex; flex-direction: column; height: 100%; }
    .ft-blacklist-form { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; align-items: center; }
    .ft-bl-input { flex: 1; min-width: 120px; background: #111; border: 1px solid #222; border-radius: 8px; color: #fff; padding: 10px 12px; font-size: 13px; outline: none; }
    .ft-bl-input:focus { border-color: #444; }
    .ft-bl-input.ft-bl-note { flex: 2; }
    .ft-bl-colors { display: flex; gap: 8px; }
    .ft-bl-color-opt { cursor: pointer; }
    .ft-bl-color-opt input { display: none; }
    .ft-bl-color-box { width: 32px; height: 32px; border-radius: 8px; display: block; border: 2px solid #333; transition: all 0.2s; position: relative; }
    .ft-bl-color-box.red { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
    .ft-bl-color-box.yellow { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
    .ft-bl-color-opt input:checked + .ft-bl-color-box { border-color: #fff; transform: scale(1.05); box-shadow: 0 0 12px rgba(255,255,255,0.3); }
    .ft-bl-color-opt input:checked + .ft-bl-color-box.red { box-shadow: 0 0 15px rgba(239,68,68,0.5); }
    .ft-bl-color-opt input:checked + .ft-bl-color-box.yellow { box-shadow: 0 0 15px rgba(245,158,11,0.5); }
    .ft-bl-color-opt:hover .ft-bl-color-box { border-color: #555; }
    .ft-bl-list { display: flex; flex-direction: column; gap: 6px; max-height: 280px; overflow-y: auto; padding-right: 6px; }
    .ft-bl-list::-webkit-scrollbar { width: 6px; }
    .ft-bl-list::-webkit-scrollbar-track { background: #1a1a1a; border-radius: 3px; }
    .ft-bl-list::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
    .ft-bl-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #141414; border: 1px solid #222; border-radius: 8px; }
    .ft-bl-item:hover { border-color: #333; }
    .ft-bl-color-indicator { width: 4px; height: 32px; border-radius: 2px; flex-shrink: 0; }
    .ft-bl-color-indicator.red { background: #ef4444; }
    .ft-bl-color-indicator.yellow { background: #f59e0b; }
    .ft-bl-info { flex: 1; min-width: 0; }
    .ft-bl-nick { color: #fff; font-size: 14px; font-weight: 600; }
    .ft-bl-note-text { color: #666; font-size: 11px; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    /* New blacklist card styles */
    .ft-bl-card { display: flex; align-items: center; gap: 12px; padding: 12px; background: #141414; border: 1px solid #222; border-radius: 10px; transition: all 0.2s; position: relative; }
    .ft-bl-card:hover { border-color: #333; background: #1a1a1a; }
    .ft-bl-card.red { border-left: 3px solid #ef4444; }
    .ft-bl-card.yellow { border-left: 3px solid #f59e0b; }
    .ft-bl-avatar-wrap { position: relative; flex-shrink: 0; }
    .ft-bl-avatar { width: 40px; height: 40px; border-radius: 50%; background: #222; object-fit: cover; }
    .ft-bl-level { position: absolute; bottom: -2px; right: -2px; width: 18px; height: 18px; object-fit: contain; }
    .ft-bl-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .ft-bl-nick { color: #fff; font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ft-bl-stats { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .ft-bl-elo { color: #888; font-size: 11px; font-weight: 600; }
    .ft-bl-note-badge { background: rgba(255,255,255,0.08); color: #888; font-size: 10px; padding: 2px 6px; border-radius: 4px; max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ft-bl-card.red .ft-bl-note-badge { background: rgba(239,68,68,0.15); color: #f87171; }
    .ft-bl-card.yellow .ft-bl-note-badge { background: rgba(245,158,11,0.15); color: #fbbf24; }
    .ft-bl-note-input { width: 100%; background: #0a0a0a; border: 1px solid #222; border-radius: 8px; color: #fff; padding: 10px 12px; font-size: 12px; outline: none; margin-top: 8px; }
    .ft-bl-note-input:focus { border-color: #444; }
    .ft-bl-note-input::placeholder { color: #444; }
    .ft-bl-elo-diff { font-size: 10px; font-weight: 600; padding: 2px 5px; border-radius: 4px; }
    .ft-bl-elo-diff.up { color: #4ade80; background: rgba(74,222,128,0.15); }
    .ft-bl-elo-diff.down { color: #f87171; background: rgba(248,113,113,0.15); }
    .ft-bl-note-text { font-size: 11px; color: #888; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; display: flex; align-items: center; gap: 4px; }
    .ft-note-icon { color: #f59e0b; flex-shrink: 0; }
    .ft-bl-dates { display: flex; gap: 8px; margin-top: 4px; flex-wrap: wrap; }
    .ft-bl-date { font-size: 10px; color: #555; }
    .ft-bl-lastseen { color: #f59e0b; }
    .ft-bl-actions { display: flex; flex-direction: column; gap: 4px; }
    .ft-btn-edit:hover { color: #f59e0b; border-color: #f59e0b; }
    /* Modal inside panel */
    .ft-modal-inside { position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 100; display: flex; align-items: center; justify-content: center; }
    .ft-modal-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); }
    .ft-modal-box { position: relative; background: #111; border: 1px solid #333; border-radius: 12px; width: 280px; max-width: 90%; }
    .ft-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #222; color: #fff; font-size: 14px; font-weight: 600; }
    .ft-modal-close { background: none; border: none; color: #666; font-size: 20px; cursor: pointer; padding: 0; line-height: 1; }
    .ft-modal-close:hover { color: #fff; }
    .ft-modal-body { padding: 16px; }
    .ft-modal-label { color: #888; font-size: 11px; display: block; margin-bottom: 6px; }
    .ft-modal-textarea { width: 100%; height: 60px; background: #0a0a0a; border: 1px solid #222; border-radius: 8px; color: #fff; padding: 10px; font-size: 13px; resize: none; outline: none; font-family: inherit; margin-bottom: 12px; }
    .ft-modal-textarea:focus { border-color: #444; }
    .ft-modal-btns { display: flex; gap: 8px; padding: 12px 16px; justify-content: flex-end; border-top: 1px solid #222; }
    .ft-modal-btn { padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; }
    .ft-modal-cancel { background: #222; color: #888; }
    .ft-modal-cancel:hover { background: #333; color: #fff; }
    .ft-modal-save { background: #ff5500; color: #fff; }
    .ft-modal-save:hover { background: #ff6a1a; }
    .ft-modal-confirm { background: #ef4444; color: #fff; }
    .ft-modal-confirm:hover { background: #dc2626; }
    /* Danger button */
    .ft-btn-danger { background: #1a1a1a !important; border-color: #ef4444 !important; color: #ef4444 !important; }
    .ft-btn-danger:hover { background: #ef4444 !important; color: #fff !important; }
  `;
  document.head.appendChild(s);
  addStyles3();
}

function addStyles3() {
  const s = document.createElement('style');
  s.textContent = `
    .ft-card { background: #111; border-radius: 12px; padding: 14px; border: 1px solid #222; }
    .ft-card-header { font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
    .ft-card-header span { flex-shrink: 0; }
    .ft-reset-btn { margin-left: auto; background: transparent; border: 1px solid #333; border-radius: 6px; color: #666; cursor: pointer; padding: 4px 8px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .ft-reset-btn:hover { background: #ef4444; border-color: #ef4444; color: #fff; }
    .ft-card-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1a1a1a; }
    .ft-card-row:last-child { border-bottom: none; }
    .ft-card-label { color: #666; font-size: 13px; }
    .ft-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 12px; }
    .ft-stat-card { background: #111; border: 1px solid #222; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; align-items: center; gap: 6px; transition: all 0.2s; }
    .ft-stat-card:hover { border-color: #333; }
    .ft-stat-card.ft-stat-live { border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.05); }
    .ft-stat-icon { opacity: 0.8; }
    .ft-stat-value { font-size: 24px; font-weight: 700; color: #fff; }
    .ft-stat-label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .ft-home-page { overflow-y: auto; }
    .ft-home-page::-webkit-scrollbar { width: 6px; }
    .ft-home-page::-webkit-scrollbar-track { background: #1a1a1a; border-radius: 3px; }
    .ft-home-page::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #444 0%, #333 100%); border-radius: 3px; }
    .ft-data-btns { display: flex; gap: 8px; }
    .ft-data-btn { display: flex; align-items: center; gap: 6px; background: #1a1a1a; border: 1px solid #333; border-radius: 8px; color: #888; padding: 8px 12px; font-size: 12px; cursor: pointer; transition: all 0.2s; }
    .ft-data-btn:hover { background: #222; color: #fff; border-color: #444; }
    .ft-backup-hint { font-size: 10px; color: #444; line-height: 1.4; font-style: italic; }
    .ft-switch { position: relative; width: 44px; height: 24px; }
    .ft-switch input { opacity: 0; width: 0; height: 0; }
    .ft-switch-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #222; border-radius: 24px; transition: 0.3s; }
    .ft-switch-slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background: #555; border-radius: 50%; transition: 0.3s; }
    .ft-switch input:checked + .ft-switch-slider { background: #444; }
    .ft-switch input:checked + .ft-switch-slider:before { transform: translateX(20px); background: #fff; }
    .ft-select { background: #111; border: 1px solid #333; border-radius: 8px; color: #fff; padding: 8px 28px 8px 12px; font-size: 12px; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 8px center; }
    .ft-select:focus { outline: none; }
    .ft-version-badge { background: #0a0a0a; color: #888; font-size: 10px; padding: 3px 8px; border-radius: 6px; border: 1px solid #333; margin-left: auto; }
    .ft-changelog { max-height: 180px; overflow-y: auto; padding-right: 8px; margin-right: -4px; }
    .ft-changelog-item { padding: 10px 0; border-bottom: 1px solid #222; }
    .ft-changelog-item:last-child { border-bottom: none; padding-bottom: 0; }
    .ft-changelog-item:first-child { padding-top: 0; }
    .ft-changelog-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .ft-changelog-version { color: #888; font-weight: 600; font-size: 13px; }
    .ft-changelog-title { color: #fff; font-size: 12px; flex: 1; }
    .ft-changelog-check { flex-shrink: 0; width: 18px; height: 18px; background: #4ade80; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(74,222,128,0.5), 0 0 20px rgba(74,222,128,0.2); }
    .ft-changelog-check svg { width: 10px; height: 10px; stroke: #0a0a0a; stroke-width: 3; fill: none; }
    .ft-changelog-list { margin: 0; padding-left: 16px; color: #666; font-size: 11px; line-height: 1.6; }
    .ft-about-header { text-align: center; padding: 16px; }
    .ft-about-logo { margin: 0 auto 12px; }
    .ft-about-header h2 { color: #fff; margin: 0 0 6px; font-size: 18px; }
    .ft-about-version { color: #888; font-size: 12px; }
    .ft-about-desc { color: #666; font-size: 12px; text-align: center; }
    .ft-about-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 10px; }
    .ft-about-grid-2 { grid-template-columns: repeat(2, 1fr); }
    .ft-about-card { background: #141414; border: 1px solid #222; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 8px; transition: all 0.2s; }
    .ft-about-card:hover { border-color: #333; background: #1a1a1a; }
    .ft-about-card-link { text-decoration: none; cursor: pointer; }
    .ft-about-card-link:hover { border-color: #444; }
    .ft-about-card-label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
    .ft-about-card-value { font-size: 16px; color: #fff; font-weight: 600; }
    .ft-about-card-icon { width: 48px; height: 48px; background: #222; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .ft-status-online { color: #4ade80; }
    .ft-installs-count { color: #4ade80; }
    .ft-about-footer { text-align: center; padding: 20px 0 10px; color: #444; font-size: 11px; }
    .ft-donate-header { text-align: center; padding: 20px 0; }
    .ft-donate-icon { margin-bottom: 12px; }
    .ft-donate-header h2 { color: #fff; margin: 0 0 8px; font-size: 18px; }
    .ft-donate-desc { color: #666; font-size: 12px; }
    .ft-donate-method { display: flex; align-items: center; gap: 12px; }
    .ft-donate-method-icon { font-size: 24px; }
    .ft-donate-method-info { flex: 1; }
    .ft-donate-method-name { color: #fff; font-size: 13px; font-weight: 600; margin-bottom: 4px; }
    .ft-donate-link { color: #888; font-size: 12px; text-decoration: none; }
    .ft-donate-link:hover { text-decoration: underline; }
    .ft-donate-address { display: flex; align-items: center; gap: 8px; }
    .ft-donate-address code { color: #888; font-size: 11px; background: #0a0a0a; padding: 4px 8px; border-radius: 4px; }
    .ft-copy-btn { background: #1a1a1a; border: 1px solid #333; border-radius: 4px; color: #666; cursor: pointer; padding: 4px 6px; display: flex; align-items: center; }
    .ft-copy-btn:hover { background: #222; color: #fff; }
    .ft-qr-wrap { cursor: pointer; padding: 6px; border-radius: 6px; transition: all 0.2s; margin-left: auto; }
    .ft-qr-wrap:hover { background: rgba(255,255,255,0.1); }
    .ft-qr-wrap:hover svg { stroke: #fff; }
    .ft-qr-container { margin-top: 12px; text-align: center; padding: 12px; background: #0a0a0a; border-radius: 8px; }
    .ft-qr-code { width: 140px; height: 140px; border-radius: 8px; }
    .ft-qr-hint { color: #555; font-size: 10px; margin-top: 8px; }
    .ft-main::-webkit-scrollbar, .ft-changelog::-webkit-scrollbar { width: 4px; }
    .ft-main::-webkit-scrollbar-track, .ft-changelog::-webkit-scrollbar-track { background: transparent; }
    .ft-main::-webkit-scrollbar-thumb, .ft-changelog::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
    /* Toast notifications */
    .ft-toast { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(20px); background: #1a1a1a; border: 1px solid #333; border-radius: 10px; padding: 12px 20px; display: flex; align-items: center; gap: 10px; opacity: 0; transition: all 0.3s ease; z-index: 10000; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
    .ft-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
    .ft-toast-success { border-color: rgba(74,222,128,0.4); background: linear-gradient(135deg, rgba(74,222,128,0.1) 0%, #1a1a1a 100%); }
    .ft-toast-success .ft-toast-icon { color: #4ade80; }
    .ft-toast-error { border-color: rgba(248,113,113,0.4); background: linear-gradient(135deg, rgba(248,113,113,0.1) 0%, #1a1a1a 100%); }
    .ft-toast-error .ft-toast-icon { color: #f87171; }
    .ft-toast-icon { display: flex; align-items: center; justify-content: center; }
    .ft-toast-text { color: #fff; font-size: 13px; font-weight: 500; white-space: nowrap; }
  `;
  document.head.appendChild(s);
}
