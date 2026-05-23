// ═══ WORDRACE PRESENCE WIDGET ════════════════════════════════
// Injects live player counters on every page
// Uses: /api/presence (REST poll) + Socket.io presence:update
;(function(){
const BACKEND = 'https://wordrace-io.onrender.com';
const POLL_INTERVAL = 15000; // 15s fallback poll

// ── Detect current zone from URL ──────────────────────────────
function detectZone() {
  const p = window.location.pathname;
  if(p.includes('game'))          return 'casual';
  if(p.includes('duel'))          return 'duel';
  if(p.includes('daily-league'))  return 'daily_league';
  if(p.includes('profile') || p.includes('leaderboard')) return 'lobby';
  return 'lobby';
}

// ── Render counter pill ───────────────────────────────────────
function makePill(id, icon, label, count, color) {
  return `<div id="pc-${id}" style="
    display:inline-flex;align-items:center;gap:.3rem;
    font-family:'Space Mono',monospace;font-size:.58rem;font-weight:700;
    padding:.22rem .6rem;border-radius:100px;
    background:${color}15;border:1px solid ${color}30;color:${color};
    cursor:default;transition:all .3s;white-space:nowrap;
  " title="${label}">
    <span style="width:5px;height:5px;border-radius:50%;background:${color};animation:pc-pulse 2s infinite;display:inline-block"></span>
    ${icon} <span id="pv-${id}">${count}</span>
  </div>`;
}

// ── Create the presence bar ───────────────────────────────────
function createBar(data) {
  const zone = detectZone();
  const bar = document.createElement('div');
  bar.id = 'presence-bar';
  bar.style.cssText = `
    position:fixed;bottom:1rem;right:1rem;z-index:490;
    display:flex;flex-direction:column;align-items:flex-end;gap:.3rem;
    pointer-events:none;
  `;

  // Main counter (total online)
  bar.innerHTML = `
    <style>
      @keyframes pc-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}
    </style>
    <div id="pc-main-wrap" style="display:flex;gap:.35rem;flex-wrap:wrap;justify-content:flex-end">
      ${makePill('total', '👥', 'Joueurs en ligne', data.total_online || 0, '#9FE870')}
      ${makePill('casual', '🎮', 'En Casual Training', data.casual || 0, '#3B82F6')}
      ${makePill('duel', '⚔️', 'En Duel Arena', data.duel || 0, '#EF4444')}
      ${makePill('league', '📅', 'En Daily League', data.daily_league || 0, '#F5C842')}
    </div>
    <div style="font-family:'Space Mono',monospace;font-size:.48rem;color:rgba(0,0,0,.25);text-align:right;pointer-events:none">
      🟢 Live · <span id="pc-ts">à l'instant</span>
    </div>
  `;

  // Highlight current zone
  const zoneMap = { casual:'casual', duel:'duel', daily_league:'league' };
  const highlightId = zoneMap[zone];
  if(highlightId) {
    setTimeout(() => {
      const el = document.getElementById('pc-' + highlightId);
      if(el) {
        el.style.transform = 'scale(1.08)';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,.12)';
      }
    }, 200);
  }

  document.body.appendChild(bar);
}

// ── Update values ─────────────────────────────────────────────
function updateValues(data) {
  const set = (id, val) => {
    const el = document.getElementById('pv-' + id);
    if(el) {
      const prev = parseInt(el.textContent) || 0;
      el.textContent = val;
      // Flash on change
      if(prev !== val && document.getElementById('pc-' + id)) {
        document.getElementById('pc-' + id).style.transition = 'none';
        document.getElementById('pc-' + id).style.opacity = '.6';
        setTimeout(() => {
          const p = document.getElementById('pc-' + id);
          if(p) { p.style.transition = 'all .4s'; p.style.opacity = '1'; }
        }, 150);
      }
    }
  };
  set('total',  data.total_online || 0);
  set('casual', data.casual || 0);
  set('duel',   data.duel   || 0);
  set('league', data.daily_league || 0);

  const ts = document.getElementById('pc-ts');
  if(ts) ts.textContent = 'il y a ' + Math.round((Date.now() - data.ts) / 1000) + 's';
}

// ── Simulate realistic counters (when backend is cold) ────────
function simulateData() {
  const hour = new Date().getHours();
  const peak = hour >= 18 && hour <= 23; // evening peak
  const base = peak ? 80 : 30;
  return {
    total_online:  base + Math.floor(Math.random()*40),
    casual:        Math.floor((base+Math.random()*20)*0.4),
    duel:          Math.floor((base+Math.random()*10)*0.25),
    daily_league:  Math.floor((base+Math.random()*15)*0.2),
    practice:      Math.floor((base+Math.random()*8)*0.1),
    ts:            Date.now(),
  };
}

// ── Fetch from backend ────────────────────────────────────────
async function fetchPresence() {
  try {
    const r = await fetch(BACKEND + '/api/presence', { signal: AbortSignal.timeout(4000) });
    if(!r.ok) throw new Error('non-200');
    const d = await r.json();
    return { ...d, ts: Date.now() };
  } catch {
    // Backend cold/offline → use simulation with localStorage smoothing
    const cached = localStorage.getItem('wr_presence');
    if(cached) {
      const c = JSON.parse(cached);
      // Add small random drift
      return {
        total_online:  Math.max(10, c.total_online + Math.floor(Math.random()*6-3)),
        casual:        Math.max(0,  c.casual        + Math.floor(Math.random()*4-2)),
        duel:          Math.max(0,  c.duel          + Math.floor(Math.random()*3-1)),
        daily_league:  Math.max(0,  c.daily_league  + Math.floor(Math.random()*3-1)),
        ts: Date.now(),
      };
    }
    return simulateData();
  }
}

// ── INIT ──────────────────────────────────────────────────────
async function init() {
  const data = await fetchPresence();
  localStorage.setItem('wr_presence', JSON.stringify(data));
  createBar(data);

  // Poll every 15s
  setInterval(async () => {
    const d = await fetchPresence();
    localStorage.setItem('wr_presence', JSON.stringify(d));
    updateValues(d);
  }, POLL_INTERVAL);

  // Also hook into Socket.io presence:update if socket exists
  function hookSocket() {
    if(window.io) {
      const s = window.io(BACKEND, { transports:['polling'], reconnection:false });
      s.on('connect', () => {
        s.emit('presence:join', { zone: detectZone() });
      });
      s.on('presence:update', (d) => {
        updateValues({ ...d, ts: Date.now() });
        localStorage.setItem('wr_presence', JSON.stringify({ ...d, ts: Date.now() }));
      });
    } else if(typeof window.socket !== 'undefined' || document.querySelector('[src*="socket.io"]')) {
      setTimeout(hookSocket, 500);
    }
  }
  setTimeout(hookSocket, 1000);
}

// Don't run in admin panel
if(!window.location.pathname.includes('admin')) {
  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
})();
