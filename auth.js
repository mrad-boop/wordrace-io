// ═══ WORDRACE AUTH SYSTEM ════════════════════════════════════
// Login (username only — no email/password for free zone)
// Wallet connect required only for paid modes
;(function(){

// ── AUTH STATE ────────────────────────────────────────────────
const AUTH = {
  get user(){ 
    try { return JSON.parse(localStorage.getItem('wr_user')||'null'); }
    catch { return null; }
  },
  set user(v){ localStorage.setItem('wr_user', JSON.stringify(v)); },
  get isLoggedIn(){ return !!this.user; },
  get walletConnected(){ return this.user?.wallet || false; },
  login(username){
    const u = {
      id: 'u_' + Math.random().toString(36).slice(2,10),
      username,
      avatar: username[0].toUpperCase(),
      joinedAt: Date.now(),
      wallet: null,
      wrc: parseInt(localStorage.getItem('wrc_balance')||'150'),
    };
    this.user = u;
    // Notify all subscribers
    this._listeners.forEach(fn => fn(u));
    return u;
  },
  logout(){
    localStorage.removeItem('wr_user');
    this._listeners.forEach(fn => fn(null));
  },
  connectWallet(addr){
    const u = this.user;
    if(!u) return false;
    u.wallet = addr || '0x'+Math.random().toString(16).slice(2,18)+'...';
    u.walletType = addr?.startsWith('phantom') ? 'Solana' : 'Polygon';
    this.user = u;
    this._listeners.forEach(fn => fn(u));
    return true;
  },
  _listeners: [],
  subscribe(fn){ this._listeners.push(fn); fn(this.user); },
};
window.WRAuth = AUTH;

// ── CSS ───────────────────────────────────────────────────────
const CSS = `
/* LOGIN MODAL */
#wr-login-overlay {
  display:none; position:fixed; inset:0;
  background:rgba(0,0,0,.55); z-index:700;
  align-items:center; justify-content:center; padding:1rem;
}
#wr-login-overlay.open { display:flex; animation:wr-fade .2s ease; }

#wr-login-card {
  background:#fff; border-radius:1.2rem;
  padding:2rem 1.8rem; max-width:360px; width:100%;
  box-shadow:0 24px 60px rgba(0,0,0,.2);
}
.wrl-logo { font-family:'Bebas Neue',sans-serif; font-size:1.8rem; color:#1A1A1A; text-align:center; margin-bottom:.1rem; }
.wrl-logo span { color:#9FE870; }
.wrl-sub { font-family:'Space Mono',monospace; font-size:.58rem; color:#6B7280; text-align:center; letter-spacing:.1em; text-transform:uppercase; margin-bottom:1.5rem; }
.wrl-label { font-family:'Space Mono',monospace; font-size:.55rem; color:#6B7280; letter-spacing:.08em; text-transform:uppercase; display:block; margin-bottom:.3rem; }
.wrl-input { width:100%; padding:.72rem .9rem; border-radius:.55rem; border:1.5px solid rgba(0,0,0,.1); background:#F8F9F7; color:#1A1A1A; font-family:'Space Mono',monospace; font-size:.88rem; outline:none; transition:border .2s; margin-bottom:.8rem; }
.wrl-input:focus { border-color:#9FE870; background:#fff; }
.wrl-btn { width:100%; padding:.85rem; border-radius:.6rem; border:none; background:#9FE870; color:#163300; font-family:'Space Mono',monospace; font-size:.82rem; font-weight:700; cursor:pointer; letter-spacing:.05em; transition:background .18s; }
.wrl-btn:hover { background:#7DD45A; }
.wrl-btn:disabled { background:#F0F2EE; color:#9B9B9B; cursor:not-allowed; }
.wrl-note { font-family:'Space Mono',monospace; font-size:.56rem; color:#9B9B9B; text-align:center; margin-top:.7rem; line-height:1.5; }
.wrl-divider { display:flex; align-items:center; gap:.6rem; margin:.8rem 0; }
.wrl-divider::before,.wrl-divider::after { content:''; flex:1; height:1px; background:rgba(0,0,0,.08); }
.wrl-divider span { font-family:'Space Mono',monospace; font-size:.54rem; color:#9B9B9B; }
.wrl-error { background:#FEE2E2; border:1px solid rgba(239,68,68,.25); border-radius:.45rem; padding:.5rem .75rem; font-family:'Space Mono',monospace; font-size:.62rem; color:#EF4444; margin-bottom:.7rem; display:none; }

/* WALLET MODAL */
#wr-wallet-overlay {
  display:none; position:fixed; inset:0;
  background:rgba(0,0,0,.55); z-index:700;
  align-items:center; justify-content:center; padding:1rem;
}
#wr-wallet-overlay.open { display:flex; animation:wr-fade .2s ease; }
#wr-wallet-card {
  background:#fff; border-radius:1.2rem;
  padding:1.8rem; max-width:360px; width:100%;
  box-shadow:0 24px 60px rgba(0,0,0,.2);
}
.wrw-title { font-family:'Bebas Neue',sans-serif; font-size:1.6rem; color:#1A1A1A; margin-bottom:.2rem; letter-spacing:.03em; }
.wrw-sub { font-family:'Space Mono',monospace; font-size:.6rem; color:#6B7280; margin-bottom:1.2rem; line-height:1.5; }
.wrw-option { display:flex; align-items:center; gap:.75rem; padding:.85rem 1rem; border:1.5px solid rgba(0,0,0,.08); border-radius:.7rem; cursor:pointer; margin-bottom:.5rem; transition:all .18s; }
.wrw-option:hover { border-color:#9FE870; background:#E8F8DF; }
.wrw-option-icon { font-size:1.6rem; flex-shrink:0; }
.wrw-option-name { font-family:'Space Mono',monospace; font-size:.72rem; font-weight:700; color:#1A1A1A; }
.wrw-option-sub { font-family:'Space Mono',monospace; font-size:.58rem; color:#6B7280; }
.wrw-skip { width:100%; padding:.65rem; border-radius:.55rem; border:1px solid rgba(0,0,0,.08); background:transparent; color:#6B7280; font-family:'Space Mono',monospace; font-size:.7rem; cursor:pointer; margin-top:.5rem; }
.wrw-skip:hover { background:#F0F2EE; }

/* NAV USER BADGE */
#wr-nav-user {
  display:inline-flex; align-items:center; gap:.4rem;
  font-family:'Space Mono',monospace; font-size:.6rem; font-weight:700;
  padding:.25rem .65rem; border-radius:100px;
  background:#F0F2EE; border:1px solid rgba(0,0,0,.08);
  color:#1A1A1A; cursor:pointer; transition:all .15s;
  white-space:nowrap; flex-shrink:0;
}
#wr-nav-user:hover { background:#E8EBE5; }
#wr-nav-user .user-av {
  width:20px; height:20px; border-radius:50%;
  background:#9FE870; color:#163300;
  display:flex; align-items:center; justify-content:center;
  font-size:.65rem; font-weight:700; flex-shrink:0;
}

/* USER DROPDOWN */
#wr-user-dropdown {
  display:none; position:fixed; top:56px; right:1rem;
  background:#fff; border:1px solid rgba(0,0,0,.09);
  border-radius:.75rem; padding:.5rem;
  box-shadow:0 8px 24px rgba(0,0,0,.12); z-index:200;
  min-width:180px;
  animation:wr-fade .15s ease;
}
#wr-user-dropdown.open { display:block; }
.wrud-header { padding:.5rem .6rem .4rem; border-bottom:1px solid rgba(0,0,0,.06); margin-bottom:.3rem; }
.wrud-name { font-family:'Space Mono',monospace; font-size:.68rem; font-weight:700; color:#1A1A1A; }
.wrud-wallet { font-family:'Space Mono',monospace; font-size:.54rem; color:#6B7280; margin-top:.1rem; }
.wrud-wrc { font-family:'Space Mono',monospace; font-size:.6rem; color:#9FE870; font-weight:700; }
.wrud-item { display:flex; align-items:center; gap:.5rem; padding:.48rem .6rem; border-radius:.45rem; font-family:'Space Mono',monospace; font-size:.65rem; color:#1A1A1A; cursor:pointer; transition:background .12s; text-decoration:none; }
.wrud-item:hover { background:#F0F2EE; }
.wrud-item.danger:hover { background:#FEE2E2; color:#EF4444; }
.wrud-divider { height:1px; background:rgba(0,0,0,.06); margin:.3rem 0; }

@keyframes wr-fade { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }
`;

// ── BUILD MODALS ──────────────────────────────────────────────
function buildModals(){
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  // LOGIN MODAL
  const loginOverlay = document.createElement('div');
  loginOverlay.id = 'wr-login-overlay';
  loginOverlay.onclick = e => { if(e.target===loginOverlay) closeLogin(); };
  loginOverlay.innerHTML = `
    <div id="wr-login-card">
      <div class="wrl-logo">WORD<span>RACE</span>.IO</div>
      <div class="wrl-sub">Créer ou rejoindre un compte</div>
      <div class="wrl-error" id="wrl-error"></div>
      <label class="wrl-label">Nom d'utilisateur</label>
      <input class="wrl-input" id="wrl-username" type="text" placeholder="Ex: lexique_master"
        maxlength="20" autocorrect="off" autocomplete="off" autocapitalize="none"
        onkeydown="if(event.key==='Enter')WRAuth._doLogin()"/>
      <button class="wrl-btn" onclick="WRAuth._doLogin()">🎯 Jouer — Accès gratuit</button>
      <div class="wrl-note">
        Aucun email requis pour la Zone Gratuite.<br>
        Le wallet est demandé uniquement pour les modes P2E.
      </div>
      <div class="wrl-divider"><span>ou</span></div>
      <button class="wrl-btn" style="background:#F0F2EE;color:#6B7280;font-size:.72rem" onclick="WRAuth._doLogin('Invité')">
        👻 Continuer en Invité
      </button>
    </div>`;
  document.body.appendChild(loginOverlay);

  // WALLET MODAL
  const walletOverlay = document.createElement('div');
  walletOverlay.id = 'wr-wallet-overlay';
  walletOverlay.onclick = e => { if(e.target===walletOverlay) closeWallet(); };
  walletOverlay.innerHTML = `
    <div id="wr-wallet-card">
      <div class="wrw-title">💳 Connecter un Wallet</div>
      <div class="wrw-sub">Requis pour accéder aux modes payants (Duel Arena, Daily League). Vos fonds restent dans votre wallet — WordRace n'y a jamais accès.</div>
      <div class="wrw-option" onclick="WRAuth._connectWallet('metamask')">
        <div class="wrw-option-icon">🦊</div>
        <div><div class="wrw-option-name">MetaMask</div><div class="wrw-option-sub">Polygon USDT</div></div>
      </div>
      <div class="wrw-option" onclick="WRAuth._connectWallet('phantom')">
        <div class="wrw-option-icon">👻</div>
        <div><div class="wrw-option-name">Phantom</div><div class="wrw-option-sub">Solana USDT</div></div>
      </div>
      <div class="wrw-option" onclick="WRAuth._connectWallet('walletconnect')">
        <div class="wrw-option-icon">🔗</div>
        <div><div class="wrw-option-name">WalletConnect</div><div class="wrw-option-sub">Tout wallet compatible</div></div>
      </div>
      <button class="wrw-skip" onclick="closeWallet()">Plus tard — Rester en Zone Gratuite</button>
    </div>`;
  document.body.appendChild(walletOverlay);

  // USER DROPDOWN
  const dropdown = document.createElement('div');
  dropdown.id = 'wr-user-dropdown';
  document.body.appendChild(dropdown);
  document.addEventListener('click', e => {
    const nav = document.getElementById('wr-nav-user');
    const dd  = document.getElementById('wr-user-dropdown');
    if(dd && !dd.contains(e.target) && nav && !nav.contains(e.target)){
      dd.classList.remove('open');
    }
  });
}

// ── LOGIN ACTIONS ─────────────────────────────────────────────
AUTH._doLogin = function(forced){
  const inp = document.getElementById('wrl-username');
  const err = document.getElementById('wrl-error');
  let username = forced || (inp ? inp.value.trim() : '');
  if(!username){
    if(err){ err.textContent='⚠️ Entrez un nom d\'utilisateur'; err.style.display='block'; }
    return;
  }
  if(username.length < 3 && username !== 'Invité'){
    if(err){ err.textContent='⚠️ Minimum 3 caractères'; err.style.display='block'; }
    return;
  }
  // Clean username
  username = username.replace(/[^a-zA-Z0-9_\-\.]/g,'').slice(0,20) || 'Player_'+Math.floor(Math.random()*9999);
  if(username === 'Invité') username = 'Invité_'+Math.floor(Math.random()*999);

  AUTH.login(username);
  closeLogin();
  updateNavUser(AUTH.user);
  if(typeof showToast === 'function') showToast('✅ Bienvenue, '+username+' ! 150 WRC offerts.');
  if(typeof updateWRCUI === 'function') updateWRCUI();
};

AUTH._connectWallet = function(type){
  const btn_label = { metamask:'MetaMask', phantom:'Phantom', walletconnect:'WalletConnect' };
  const overlay = document.getElementById('wr-wallet-overlay');
  const card = document.getElementById('wr-wallet-card');
  if(card) card.innerHTML += `<div style="font-family:'Space Mono',monospace;font-size:.65rem;color:#6B7280;text-align:center;margin-top:.8rem">⏳ Connexion ${btn_label[type]}...</div>`;

  setTimeout(()=>{
    const addr = type==='phantom' ? 'phantom_'+Math.random().toString(36).slice(2,14) : '0x'+Math.random().toString(16).slice(2,18);
    AUTH.connectWallet(addr);
    closeWallet();
    updateNavUser(AUTH.user);
    if(typeof showToast==='function') showToast('✅ Wallet connecté ! Vous accédez aux modes P2E.');
    // Refresh WRC badge
    const b = document.getElementById('nav-wrc-val');
    if(b) b.textContent = (parseInt(localStorage.getItem('wrc_balance')||'150')).toLocaleString();
    // Continue pending action if any
    if(AUTH._pendingAction){ AUTH._pendingAction(); AUTH._pendingAction=null; }
  }, 1500);
};

function openLogin(){
  document.getElementById('wr-login-overlay')?.classList.add('open');
  setTimeout(()=>document.getElementById('wrl-username')?.focus(), 100);
}
function closeLogin(){ document.getElementById('wr-login-overlay')?.classList.remove('open'); }
function openWallet(){ document.getElementById('wr-wallet-overlay')?.classList.add('open'); }
function closeWallet(){ document.getElementById('wr-wallet-overlay')?.classList.remove('open'); }
window.openLogin  = openLogin;
window.closeLogin = closeLogin;
window.openWallet = openWallet;
window.closeWallet= closeWallet;

// ── NAV USER BADGE ────────────────────────────────────────────
function buildNavBadge(){
  const nav = document.querySelector('.topnav');
  if(!nav || document.getElementById('wr-nav-user')) return;

  // Hide WRC badge by default (shown only when logged in)
  const wrcBadge = document.getElementById('nav-wrc-badge');
  if(wrcBadge) wrcBadge.style.display = 'none';

  const btn = document.createElement('div');
  btn.id = 'wr-nav-user';
  btn.onclick = toggleUserDropdown;
  nav.appendChild(btn);

  AUTH.subscribe(user => {
    updateNavUser(user);
    // Show/hide WRC badge
    const wb = document.getElementById('nav-wrc-badge');
    if(wb) wb.style.display = user ? 'inline-flex' : 'none';
  });
}

function updateNavUser(user){
  const btn = document.getElementById('wr-nav-user');
  if(!btn) return;
  if(!user){
    btn.innerHTML = `<span style="font-size:.85rem">👤</span> Connexion`;
    btn.onclick = openLogin;
    return;
  }
  btn.innerHTML = `
    <div class="user-av">${user.avatar||user.username[0].toUpperCase()}</div>
    <span>${user.username.length>10?user.username.slice(0,10)+'…':user.username}</span>
    <span style="font-size:.6rem;color:#9B9B9B">▾</span>`;
  btn.onclick = toggleUserDropdown;

  // Update dropdown
  const dd = document.getElementById('wr-user-dropdown');
  if(!dd) return;
  const wrc = parseInt(localStorage.getItem('wrc_balance')||'150');
  dd.innerHTML = `
    <div class="wrud-header">
      <div class="wrud-name">👤 ${user.username}</div>
      <div class="wrud-wrc">🪙 ${wrc.toLocaleString()} WRC</div>
      ${user.wallet ? `<div class="wrud-wallet">🔗 ${user.wallet.slice(0,16)}...</div>` : `<div class="wrud-wallet" style="color:#F5C842;cursor:pointer" onclick="openWallet()">⚠️ Wallet non connecté</div>`}
    </div>
    <a class="wrud-item" href="profile.html">👤 Mon Profil</a>
    <a class="wrud-item" href="leaderboard.html">🏆 Leaderboard</a>
    ${!user.wallet ? `<div class="wrud-item" onclick="openWallet();document.getElementById('wr-user-dropdown').classList.remove('open')">💳 Connecter Wallet P2E</div>` : ''}
    <div class="wrud-divider"></div>
    <div class="wrud-item" onclick="if(typeof openWRCTopup==='function')openWRCTopup()">🪙 Recharger WRC</div>
    <div class="wrud-divider"></div>
    <div class="wrud-item danger" onclick="WRAuth.logout();location.reload()">🚪 Déconnexion</div>`;
}

function toggleUserDropdown(){
  document.getElementById('wr-user-dropdown')?.classList.toggle('open');
}

// ── GUARD: require login for paid modes ───────────────────────
window.requireLogin = function(cb){
  if(AUTH.isLoggedIn){ cb(); return; }
  AUTH._pendingAction = cb;
  openLogin();
};
window.requireWallet = function(cb){
  if(!AUTH.isLoggedIn){ AUTH._pendingAction = ()=>requireWallet(cb); openLogin(); return; }
  if(AUTH.walletConnected){ cb(); return; }
  AUTH._pendingAction = cb;
  openWallet();
};

// ── INIT ──────────────────────────────────────────────────────
function init(){
  if(window.location.pathname.includes('admin')||window.location.pathname.includes('cgu-admin')) return;
  buildModals();
  buildNavBadge();

  // Auto-show login if accessing paid page without login
  const isPaidPage = window.location.pathname.includes('duel') || window.location.pathname.includes('daily-league');
  if(isPaidPage && !AUTH.isLoggedIn){
    setTimeout(openLogin, 800);
  }
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
else init();
})();
