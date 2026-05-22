/**
 * WORDRACE.IO — Socket.io Client Library
 * Include this in game.html, daily-league.html, duel.html
 * Usage: const wr = new WordRaceClient('https://wordrace-backend.onrender.com')
 */

class WordRaceClient {
  constructor(serverUrl) {
    this.url        = serverUrl;
    this.socket     = null;
    this.user       = null;
    this.room       = null;
    this.listeners  = {};
    this._keyIntervals = [];
    this._lastKeyTime  = null;
  }

  // ── CONNECT ──────────────────────────────────────────────────
  connect(username) {
    return new Promise((resolve, reject) => {
      // Dynamically load socket.io client
      if (!window.io) {
        const script = document.createElement('script');
        script.src = 'https://cdn.socket.io/4.7.4/socket.io.min.js';
        script.onload = () => this._initSocket(username, resolve, reject);
        script.onerror = () => reject(new Error('Failed to load socket.io'));
        document.head.appendChild(script);
      } else {
        this._initSocket(username, resolve, reject);
      }
    });
  }

  _initSocket(username, resolve, reject) {
    this.socket = window.io(this.url, {
      transports: ['websocket','polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('[WR] Connected:', this.socket.id);
      this.socket.emit('auth', { username }, (res) => {
        if (res?.ok) {
          this.user = res.user;
          this._setupListeners();
          this._setupAnticheat();
          resolve(res.user);
        } else {
          reject(new Error('Auth failed'));
        }
      });
    });

    this.socket.on('connect_error', (err) => {
      console.error('[WR] Connection error:', err.message);
      reject(err);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('[WR] Disconnected:', reason);
      this._emit('disconnected', { reason });
    });

    this.socket.on('reconnect', () => {
      console.log('[WR] Reconnected');
      this._emit('reconnected', {});
    });
  }

  // ── ROOM ACTIONS ─────────────────────────────────────────────
  createRoom(mode, options = {}) {
    return this._call('room:create', { mode, options });
  }

  joinRoom(roomId) {
    return this._call('room:join', { roomId }).then(res => {
      if (res.ok) this.room = res.room;
      return res;
    });
  }

  setReady(roomId) {
    this.socket.emit('player:ready', { roomId });
  }

  // ── GAME ACTIONS ──────────────────────────────────────────────
  submitAnswer(roomId, catIdx, word) {
    return this._call('round:answer', { roomId, catIdx, word });
  }

  submitRound(roomId) {
    this.socket.emit('round:submit', { roomId });
  }

  useFreeze(roomId) {
    return this._call('powerup:freeze', { roomId });
  }

  sendChat(roomId, message) {
    this.socket.emit('room:chat', { roomId, message });
  }

  // ── ANTI-CHEAT REPORTING ─────────────────────────────────────
  _setupAnticheat() {
    // Tab switch detection
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.room) {
        this.socket.emit('anticheat:tab_switch', { roomId: this.room.id });
      }
    });

    // Paste blocking + reporting
    document.addEventListener('paste', (e) => {
      e.preventDefault();
      if (this.room) {
        this.socket.emit('anticheat:paste', { roomId: this.room.id });
      }
    });

    // Keystroke dynamics (send batch every 5s)
    document.addEventListener('keydown', () => {
      const now = Date.now();
      if (this._lastKeyTime) {
        this._keyIntervals.push(now - this._lastKeyTime);
        if (this._keyIntervals.length >= 20) {
          this.socket.emit('anticheat:keystrokes', { intervals: this._keyIntervals });
          this._keyIntervals = [];
        }
      }
      this._lastKeyTime = now;
    });
  }

  // ── EVENT LISTENERS ───────────────────────────────────────────
  _setupListeners() {
    const events = [
      'room:joined','player:joined','player:disconnected','player:ready',
      'room:countdown','round:start','round:end','game:end',
      'timer:tick','player:answer','player:answered',
      'player:disqualified','anticheat:disqualified','anticheat:warning',
      'room:chat','powerup:freeze:ok',
    ];
    events.forEach(ev => {
      this.socket.on(ev, (data) => this._emit(ev, data));
    });
  }

  on(event, handler) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
    return this; // chainable
  }

  off(event, handler) {
    if (handler) {
      this.listeners[event] = (this.listeners[event]||[]).filter(h=>h!==handler);
    } else {
      delete this.listeners[event];
    }
  }

  _emit(event, data) {
    (this.listeners[event]||[]).forEach(h => { try { h(data); } catch(e) { console.error(e); } });
  }

  _call(event, data) {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) return reject(new Error('Not connected'));
      this.socket.emit(event, data, (res) => {
        if (res?.error) reject(new Error(res.error));
        else resolve(res || {});
      });
    });
  }

  // ── UTILS ─────────────────────────────────────────────────────
  get isConnected() { return this.socket?.connected || false; }
  get socketId()    { return this.socket?.id || null; }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.user   = null;
    this.room   = null;
  }
}

// Usage example:
/*
const wr = new WordRaceClient('https://wordrace-backend.onrender.com');

async function init() {
  const user = await wr.connect('MyUsername');
  console.log('Connected as:', user.username);

  // Create a casual room
  const { room } = await wr.createRoom('casual');

  // Listen to game events
  wr
    .on('round:start', ({ letter, duration, categories }) => {
      console.log('Round started! Letter:', letter);
      startGameUI(letter, categories, duration);
    })
    .on('timer:tick', ({ secondsLeft }) => {
      updateTimer(secondsLeft);
    })
    .on('player:answer', ({ username, catIdx, word, isBot }) => {
      showBotAnswer(catIdx, word); // show bot answers in real-time
    })
    .on('round:end', ({ results, players }) => {
      showRoundResults(results, players);
    })
    .on('game:end', ({ rankings }) => {
      showFinalResults(rankings);
    })
    .on('anticheat:disqualified', ({ reason, message }) => {
      alert(message); // disqualification notification
    });

  // Submit answer
  const result = await wr.submitAnswer(room.id, 0, 'Lion');
  console.log('Validation:', result); // { valid: true, tier: 1, word: 'lion' }

  // Set ready to start
  wr.setReady(room.id);
}
*/

if (typeof module !== 'undefined') module.exports = WordRaceClient;
