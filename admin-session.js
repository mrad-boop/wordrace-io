// ═══ WORDRACE ADMIN SESSION ══════════════════════════════════
// Shared session system for all admin pages.
// - Persists across refreshes via localStorage
// - Auto-logout after TIMEOUT ms of inactivity
// - All admin pages include this script and call WRAdminSession.guard()
;(function(){

const KEY     = 'wr_admin_session';
const TIMEOUT = 15 * 60 * 1000; // 15 minutes
const PWD     = 'wordrace2026';

const WRAdminSession = {

  // ── READ / WRITE ────────────────────────────────────────────
  _get(){
    try { return JSON.parse(localStorage.getItem(KEY)||'null'); } catch{ return null; }
  },
  _set(){ localStorage.setItem(KEY, JSON.stringify({ts: Date.now()})); },
  _clear(){ localStorage.removeItem(KEY); },

  // ── STATUS ──────────────────────────────────────────────────
  isValid(){
    const s = this._get();
    if(!s) return false;
    return (Date.now() - s.ts) < TIMEOUT;
  },

  // ── TOUCH (reset inactivity timer) ──────────────────────────
  touch(){
    if(this.isValid()) this._set();
  },

  // ── LOGIN ────────────────────────────────────────────────────
  login(pwd){
    if(pwd !== PWD) return false;
    this._set();
    return true;
  },

  // ── LOGOUT ──────────────────────────────────────────────────
  logout(){
    this._clear();
    // Each page defines onAdminLogout() to handle its own UI reset
    if(typeof onAdminLogout === 'function') onAdminLogout();
  },

  // ── GUARD: call once on page load ───────────────────────────
  // showFn()  → called when session is valid (show admin UI)
  // hideFn()  → called when session is expired/missing (show login)
  guard(showFn, hideFn){
    this._showFn = showFn;
    this._hideFn = hideFn;

    if(this.isValid()){
      this._set(); // refresh ts
      showFn();
    } else {
      this._clear();
      hideFn();
    }

    // Activity tracking — resets inactivity timer
    ['mousemove','keydown','mousedown','touchstart','scroll'].forEach(ev =>
      document.addEventListener(ev, ()=>this.touch(), {passive:true})
    );

    // Polling check every 30s — auto-logout on timeout
    this._poll = setInterval(()=>{
      if(!this.isValid()){
        clearInterval(this._poll);
        this.logout();
        hideFn();
        this._showBanner();
      }
    }, 30_000);
  },

  // ── INACTIVITY BANNER ────────────────────────────────────────
  _showBanner(){
    const b = document.createElement('div');
    b.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99999;background:#1e293b;color:#f8fafc;text-align:center;padding:14px;font-family:Calibri,sans-serif;font-size:.95rem;border-bottom:2px solid #9FE870';
    b.textContent='⏱ Session expirée après 15 min d\'inactivité. Veuillez vous reconnecter.';
    document.body.prepend(b);
  },
};

window.WRAdminSession = WRAdminSession;

})();
