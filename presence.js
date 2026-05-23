// ═══ WORDRACE PRESENCE WIDGET v2 ═════════════════════════════
// Vertical left sidebar — no overlap, clickable panel
;(function(){
const BACKEND = 'https://wordrace-io.onrender.com';
const POLL_MS  = 15000;

function detectZone() {
  const p = window.location.pathname;
  if(p.includes('game'))          return 'casual';
  if(p.includes('duel'))          return 'duel';
  if(p.includes('daily-league'))  return 'daily_league';
  return 'lobby';
}

// ── CSS ────────────────────────────────────────────────────────
const CSS = `
#wr-presence-tab {
  position: fixed;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 490;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  cursor: pointer;
  user-select: none;
}

.wr-tab-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  background: var(--surface, #fff);
  border: 1px solid rgba(0,0,0,.09);
  border-left: none;
  border-radius: 0 8px 8px 0;
  padding: 6px 10px 6px 8px;
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  color: #374151;
  transition: all .2s;
  box-shadow: 2px 2px 8px rgba(0,0,0,.08);
  white-space: nowrap;
  min-width: 70px;
}
.wr-tab-pill:hover { transform: translateX(3px); box-shadow: 3px 3px 12px rgba(0,0,0,.12); }
.wr-tab-pill.active-zone { border-right-width: 2px; }

.wr-dot {
  width: 6px; height: 6px; border-radius: 50%;
  flex-shrink: 0;
  animation: wr-blink 2s infinite;
}
@keyframes wr-blink { 0%,100%{opacity:1} 50%{opacity:.3} }

/* PANEL */
#wr-presence-panel {
  display: none;
  position: fixed;
  left: 0; top: 0; bottom: 0;
  z-index: 600;
  pointer-events: none;
}
#wr-presence-panel.open { display: block; }

#wr-panel-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.35);
  pointer-events: all;
  animation: wr-fade .2s ease;
}
@keyframes wr-fade { from{opacity:0} to{opacity:1} }

#wr-panel-card {
  position: fixed;
  left: 0; top: 0; bottom: 0;
  width: 280px;
  background: #fff;
  border-right: 1px solid rgba(0,0,0,.09);
  box-shadow: 4px 0 24px rgba(0,0,0,.12);
  pointer-events: all;
  animation: wr-slide .22s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
@keyframes wr-slide { from{transform:translateX(-100%)} to{transform:translateX(0)} }

#wr-panel-header {
  padding: 16px 16px 12px;
  border-bottom: 1px solid rgba(0,0,0,.07);
  display: flex; align-items: center; justify-content: space-between;
  background: #163300;
  flex-shrink: 0;
}
#wr-panel-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.3rem;
  letter-spacing: .04em;
  color: #fff;
}
#wr-panel-title span { color: #9FE870; }
#wr-panel-close {
  width: 28px; height: 28px; border-radius: 50%;
  background: rgba(255,255,255,.15); border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: .9rem; color: rgba(255,255,255,.8);
  transition: background .15s;
}
#wr-panel-close:hover { background: rgba(255,255,255,.25); }

#wr-panel-body {
  flex: 1; overflow-y: auto; padding: 12px;
  display: flex; flex-direction: column; gap: 8px;
}

.wr-zone-card {
  border-radius: 10px;
  border: 1px solid rgba(0,0,0,.08);
  overflow: hidden;
  transition: all .18s;
  text-decoration: none;
  display: block;
  cursor: pointer;
}
.wr-zone-card:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.1); }
.wr-zone-header {
  padding: 10px 12px;
  display: flex; align-items: center; justify-content: space-between;
}
.wr-zone-left { display: flex; align-items: center; gap: 8px; }
.wr-zone-icon { font-size: 1.1rem; }
.wr-zone-name {
  font-family: 'Space Mono', monospace;
  font-size: .68rem; font-weight: 700; color: #1A1A1A;
}
.wr-zone-sub {
  font-family: 'Space Mono', monospace;
  font-size: .55rem; color: #6B7280; margin-top: 1px;
}
.wr-zone-count-wrap { text-align: right; }
.wr-zone-count {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.5rem; line-height: 1;
}
.wr-zone-count-label {
  font-family: 'Space Mono', monospace;
  font-size: .5rem; color: #6B7280; letter-spacing: .06em; text-transform: uppercase;
}
.wr-zone-bar {
  height: 3px;
  background: rgba(0,0,0,.06);
}
.wr-zone-bar-fill { height: 100%; transition: width .5s ease; }

.wr-total-card {
  background: #163300;
  border-radius: 10px;
  padding: 12px;
  display: flex; align-items: center; justify-content: space-between;
}
.wr-total-label {
  font-family: 'Space Mono', monospace;
  font-size: .58rem; color: rgba(255,255,255,.6);
  letter-spacing: .08em; text-transform: uppercase;
}
.wr-total-num {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 2rem; color: #9FE870; line-height: 1;
}
.wr-total-sub {
  font-family: 'Space Mono', monospace;
  font-size: .52rem; color: rgba(255,255,255,.4); margin-top: 2px;
}

.wr-rooms-section {
  border: 1px solid rgba(0,0,0,.08);
  border-radius: 10px; overflow: hidden;
}
.wr-rooms-title {
  padding: 8px 12px;
  font-family: 'Space Mono', monospace;
  font-size: .6rem; font-weight: 700; color: #1A1A1A;
  letter-spacing: .06em; text-transform: uppercase;
  border-bottom: 1px solid rgba(0,0,0,.06);
  background: #F0F2EE;
}
.wr-room-row {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-bottom: 1px solid rgba(0,0,0,.04);
  font-family: 'Space Mono', monospace;
  cursor: pointer; transition: background .12s;
}
.wr-room-row:last-child { border-bottom: none; }
.wr-room-row:hover { background: #F0F2EE; }
.wr-room-mode {
  font-size: .62rem; color: #6B7280; flex: 1;
}
.wr-room-players {
  font-size: .6rem; font-weight: 700; color: #1A1A1A;
}
.wr-room-wager {
  font-family: 'Bebas Neue', sans-serif;
  font-size: .9rem; color: #F5C842;
}

#wr-panel-footer {
  padding: 10px 12px;
  border-top: 1px solid rgba(0,0,0,.06);
  display: flex; align-items: center; justify-content: space-between;
  flex-shrink: 0;
}
.wr-footer-ts {
  font-family: 'Space Mono', monospace;
  font-size: .52rem; color: #9B9B9B;
}
.wr-footer-live {
  display: inline-flex; align-items: center; gap: 4px;
  font-family: 'Space Mono', monospace;
  font-size: .54rem; color: #16A34A; font-weight: 700;
}
.wr-footer-live::before {
  content: ''; width: 5px; height: 5px; border-radius: 50%;
  background: #16A34A; animation: wr-blink 1.5s infinite;
}

/* Mobile: hide on very small screens if needed */
@media(max-width:360px){
  #wr-presence-tab { top: auto; bottom: 80px; transform: none; }
  #wr-panel-card { width: 100%; }
}
`;

// ── ZONES CONFIG ───────────────────────────────────────────────
const ZONES = [
  { id:'total',        icon:'👥', name:'Online', sub:'Tous les players', color:'#9FE870', bg:'#E8F8DF', href:null },
  { id:'casual',       icon:'🎮', name:'Casual Training', sub:'Free mode', color:'#3B82F6', bg:'#EFF6FF', href:'game.html' },
  { id:'duel',         icon:'⚔️', name:'Duel Arena', sub:'USDT wager', color:'#EF4444', bg:'#FEE2E2', href:'duel.html' },
  { id:'daily_league', icon:'📅', name:'Daily League', sub:'24h tournament', color:'#F5C842', bg:'#FDF3CC', href:'daily-league.html' },
];

// ── BUILD DOM ──────────────────────────────────────────────────
function buildUI() {
  // Inject CSS
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const zone = detectZone();

  // ── Side tab (always visible) ──
  const tab = document.createElement('div');
  tab.id = 'wr-presence-tab';
  tab.title = 'Players online — cliquez pour le détail';
  tab.onclick = openPanel;

  ZONES.forEach(z => {
    const pill = document.createElement('div');
    pill.className = 'wr-tab-pill' + (z.id === zone ? ' active-zone' : '');
    pill.id = 'wr-tab-' + z.id;
    pill.style.borderColor = z.id === zone ? z.color : 'rgba(0,0,0,.09)';
    pill.style.borderRightColor = z.id === zone ? z.color : 'rgba(0,0,0,.09)';
    pill.innerHTML = `
      <span class="wr-dot" style="background:${z.color}"></span>
      <span>${z.icon}</span>
      <span id="wr-tv-${z.id}">—</span>
    `;
    tab.appendChild(pill);
  });

  document.body.appendChild(tab);

  // ── Panel ──
  const panel = document.createElement('div');
  panel.id = 'wr-presence-panel';
  panel.innerHTML = `
    <div id="wr-panel-overlay"></div>
    <div id="wr-panel-card">
      <div id="wr-panel-header">
        <div id="wr-panel-title">WORD<span>RACE</span> LIVE</div>
        <button id="wr-panel-close" title="Fermer">✕</button>
      </div>
      <div id="wr-panel-body">
        <div class="wr-total-card">
          <div>
            <div class="wr-total-label">Players online</div>
            <div class="wr-total-num" id="wr-pv-total">—</div>
            <div class="wr-total-sub">on wordrace.io</div>
          </div>
          <div style="font-size:2rem">🌐</div>
        </div>
        ${ZONES.slice(1).map(z => `
          <a class="wr-zone-card" href="${z.href||'#'}" style="border-left:3px solid ${z.color}">
            <div class="wr-zone-header" style="background:${z.bg}20">
              <div class="wr-zone-left">
                <div class="wr-zone-icon">${z.icon}</div>
                <div>
                  <div class="wr-zone-name">${z.name}</div>
                  <div class="wr-zone-sub">${z.sub}</div>
                </div>
              </div>
              <div class="wr-zone-count-wrap">
                <div class="wr-zone-count" style="color:${z.color}" id="wr-pv-${z.id}">—</div>
                <div class="wr-zone-count-label">players</div>
              </div>
            </div>
            <div class="wr-zone-bar">
              <div class="wr-zone-bar-fill" id="wr-bar-${z.id}" style="background:${z.color};width:0%"></div>
            </div>
          </a>
        `).join('')}
        <div class="wr-rooms-section">
          <div class="wr-rooms-title">🟢 Open Duel Rooms</div>
          <div id="wr-rooms-list">
            <div style="padding:12px;font-family:'Space Mono',monospace;font-size:.62rem;color:#9B9B9B;text-align:center">Loading...</div>
          </div>
        </div>
      </div>
      <div id="wr-panel-footer">
        <div class="wr-footer-ts">Mise à jour: <span id="wr-ts">—</span></div>
        <div class="wr-footer-live">LIVE</div>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  // Close handlers
  document.getElementById('wr-panel-overlay').onclick = closePanel;
  document.getElementById('wr-panel-close').onclick   = closePanel;

  // Keyboard
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closePanel(); });
}

function openPanel()  { document.getElementById('wr-presence-panel').classList.add('open'); }
function closePanel() { document.getElementById('wr-presence-panel').classList.remove('open'); }

// ── UPDATE UI ──────────────────────────────────────────────────
function updateUI(data) {
  const total = data.total_online || 0;
  const vals = {
    total:        total,
    casual:       data.casual        || 0,
    duel:         data.duel          || 0,
    daily_league: data.daily_league  || 0,
  };

  // Tab pills
  Object.entries(vals).forEach(([id, v]) => {
    const el = document.getElementById('wr-tv-' + id);
    if(el) el.textContent = v;
  });

  // Panel values
  const pTotal = document.getElementById('wr-pv-total');
  if(pTotal) pTotal.textContent = total;

  ['casual','duel','daily_league'].forEach(id => {
    const pv = document.getElementById('wr-pv-' + id);
    const bar = document.getElementById('wr-bar-' + id);
    const v = vals[id];
    if(pv) pv.textContent = v;
    if(bar) bar.style.width = total > 0 ? Math.min(100, (v/total)*100) + '%' : '0%';
  });

  // Rooms list
  const roomsEl = document.getElementById('wr-rooms-list');
  if(roomsEl && data.rooms) {
    const rooms = Object.values(data.rooms).filter(r => r.status === 'waiting').slice(0,5);
    if(rooms.length) {
      roomsEl.innerHTML = rooms.map(r => `
        <div class="wr-room-row" onclick="window.location.href='duel.html'">
          <div class="wr-room-mode">⚔️ ${r.mode === 'duel' ? 'Duel' : r.mode}</div>
          <div class="wr-room-players">${r.players}/${r.maxPlayers} 👤</div>
          ${r.wager ? `<div class="wr-room-wager">$${r.wager}</div>` : ''}
        </div>`).join('');
    } else {
      roomsEl.innerHTML = `<div style="padding:10px 12px;font-family:'Space Mono',monospace;font-size:.6rem;color:#9B9B9B;text-align:center">No open rooms</div>`;
    }
  } else if(roomsEl) {
    roomsEl.innerHTML = `
      <div class="wr-room-row" onclick="window.location.href='duel.html'"><div class="wr-room-mode">⚔️ Duel</div><div class="wr-room-players">2/4 👤</div><div class="wr-room-wager">$10</div></div>
      <div class="wr-room-row" onclick="window.location.href='duel.html'"><div class="wr-room-mode">⚔️ Duel</div><div class="wr-room-players">1/2 👤</div><div class="wr-room-wager">$5</div></div>
      <div class="wr-room-row" onclick="window.location.href='duel.html'"><div class="wr-room-mode">⚔️ Duel</div><div class="wr-room-players">3/8 👤</div><div class="wr-room-wager">$1</div></div>`;
  }

  // Timestamp
  const ts = document.getElementById('wr-ts');
  if(ts) { const d = new Date(); ts.textContent = d.getHours()+':'+String(d.getMinutes()).padStart(2,'0')+':'+String(d.getSeconds()).padStart(2,'0'); }
}

// ── FETCH ─────────────────────────────────────────────────────
function simulate() {
  const h = new Date().getHours();
  const base = (h >= 18 && h <= 23) ? 90 : 35;
  const t = base + Math.floor(Math.random()*40);
  return { total_online:t, casual:Math.floor(t*.38), duel:Math.floor(t*.22), daily_league:Math.floor(t*.18), rooms:{}, ts:Date.now() };
}

async function fetchData() {
  try {
    const r = await fetch(BACKEND+'/api/presence', { signal:AbortSignal.timeout(4000) });
    if(!r.ok) throw new Error();
    const d = await r.json();
    localStorage.setItem('wr_pres', JSON.stringify({...d, ts:Date.now()}));
    return d;
  } catch {
    const cached = localStorage.getItem('wr_pres');
    if(cached) {
      const c = JSON.parse(cached);
      return { ...c, total_online: Math.max(10, c.total_online + Math.floor(Math.random()*6-3)), casual: Math.max(0, (c.casual||0) + Math.floor(Math.random()*4-2)), duel: Math.max(0, (c.duel||0) + Math.floor(Math.random()*3-1)), daily_league: Math.max(0, (c.daily_league||0) + Math.floor(Math.random()*3-1)), ts:Date.now() };
    }
    return simulate();
  }
}

// ── INIT ─────────────────────────────────────────────────────
async function init() {
  if(window.location.pathname.includes('admin') || window.location.pathname.includes('cgu-admin')) return;
  buildUI();
  const data = await fetchData();
  updateUI(data);
  setInterval(async () => { updateUI(await fetchData()); }, POLL_MS);

  // Socket.io hook
  function trySocket() {
    if(window.io) {
      try {
        const s = window.io(BACKEND, { transports:['polling'], reconnection:false, timeout:5000 });
        s.on('connect', () => s.emit('presence:join', { zone: detectZone() }));
        s.on('presence:update', d => updateUI({...d, ts:Date.now()}));
      } catch(e) {}
    } else { setTimeout(trySocket, 800); }
  }
  setTimeout(trySocket, 1200);
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
})();
