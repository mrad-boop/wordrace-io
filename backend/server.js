/**
 * WORDRACE.IO — Backend Server
 * Express + Socket.io · Real-time multiplayer
 * Modules: Auth, Rooms, Game Engine, Leaderboard, Anti-Cheat
 */

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs         = require('fs');
const path       = require('path');

const app    = express();
const server = http.createServer(app);

// ─── SOCKET.IO ────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: [
      'https://wordrace-io.vercel.app',
      'http://localhost:3000',
      'http://localhost:5500',
    ],
    methods: ['GET','POST'],
    credentials: true,
  },
  pingTimeout: 20000,
  pingInterval: 10000,
});

// ─── MIDDLEWARE ───────────────────────────────────────────────
app.use(cors({
  origin: ['https://wordrace-io.vercel.app','http://localhost:3000','http://localhost:5500'],
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  credentials: true,
}));
app.use(express.json());
app.use((req,_,next) => { console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`); next(); });

// ─── IN-MEMORY STORE ──────────────────────────────────────────
// Production: replace with PostgreSQL / Supabase
const store = {
  users:        new Map(),   // socketId → UserSession
  rooms:        new Map(),   // roomId   → Room
  leaderboard:  [],          // [{userId,username,score,rank}]
  dailyEntries: new Map(),   // userId   → {tier, score, submittedAt}
  anticheat:    new Map(),   // socketId → AnticheatState
  cgu:          null,        // {content, lastUpdated}
};

// ─── CGU PERSISTENCE ──────────────────────────────────────────
const CGU_PATH = path.join(__dirname, 'cgu.json');
const CGU_DEFAULT_CONTENT = `<div id="cgu-body"><h2>Terms &amp; Conditions</h2><p>Content not yet loaded.</p></div>`;

function cguRead(){
  try{ return JSON.parse(fs.readFileSync(CGU_PATH,'utf8')); }
  catch{ return { content: CGU_DEFAULT_CONTENT, lastUpdated: 'May 26, 2026' }; }
}
function cguWrite(d){
  try{ fs.writeFileSync(CGU_PATH, JSON.stringify(d), 'utf8'); }
  catch(e){ console.error('[CGU] Write error:', e.message); }
}
store.cgu = cguRead();
console.log('[CGU] Loaded, lastUpdated:', store.cgu.lastUpdated);

// ─── GAME CONFIG ──────────────────────────────────────────────
const CONFIG = {
  ROUND_DURATION:  40,       // seconds
  CATEGORIES: ['Animal','Pays','Prénom','Aliment','Métier','Marque','Sport','Film/Série'],
  LETTERS: 'ABCDEFGHIJKLMNOPRSTUVWXYZ'.split(''),
  POINTS_VALID:  10,
  POINTS_UNIQUE: 5,          // bonus if only player with that word
  BOT_NAMES: ['Bot_Easy','Bot_Medium','Bot_Hard'],
  RAKE_DUEL:    0.05,        // 5%
  RAKE_LEAGUE:  0.10,        // 10%
  MAX_PLAYERS:  8,
  MIN_KEYSTROKE_INTERVAL: 80, // ms — below = bot detected
};

// ─── DICTIONARY (Tier 1 validation) ──────────────────────────
const DICT = {
  Animal:   ['aigle','baleine','chameau','dauphin','éléphant','faucon','girafe','hippopotame','jaguar','kangourou','léopard','lion','lynx','mamba','narval','ocelot','panthère','requin','serpent','tigre','tortue','zèbre','crocodile','guépard','gorille','pingouin','toucan','perroquet','python','cobra'],
  Pays:     ['algérie','allemagne','argentine','australie','brésil','canada','chili','chine','france','inde','italie','japon','maroc','mexique','norvège','portugal','russie','sénégal','suisse','tunisie','turquie','espagne','grèce','belgique','irlande','pologne','suède','nigeria','kenya','ghana'],
  Prénom:   ['alice','benjamin','camille','daniel','emma','fatima','gabriel','hugo','isabelle','julien','kenza','lucas','marie','nicolas','omar','pierre','rachid','sarah','thomas','yasmine','amine','leila','nour','rayan','sofia','elena','lena','adam','lea','noah'],
  Aliment:  ['avocat','banane','carotte','datte','fraise','grenade','huître','kiwi','lait','mangue','noix','orange','poire','raisin','saumon','tomate','vanille','yaourt','chocolat','fromage','beurre','cerise','citron','figue','melon','pêche','prune','ananas','crevette','agneau'],
  Métier:   ['architecte','biologiste','chimiste','dentiste','enseignant','fermier','géographe','historien','ingénieur','journaliste','libraire','médecin','notaire','opticien','pharmacien','radiologue','styliste','technicien','vétérinaire','avocat','comptable','cuisinier','pilote','pompier','policier','chirurgien','économiste','psychologue','photographe','designer'],
  Marque:   ['adidas','apple','bmw','canon','disney','emirates','ferrari','google','hermès','intel','jaguar','kfc','lamborghini','mercedes','netflix','openai','porsche','rolex','samsung','tesla','uber','visa','youtube','zoom','nike','sony','amazon','microsoft','airbnb','spotify'],
  Sport:    ['athlétisme','badminton','basketball','cyclisme','escalade','football','golf','handball','judo','karaté','lutte','marathon','natation','patinage','rugby','ski','tennis','triathlon','volleyball','boxe','escrime','équitation','aviron','plongeon','surf','taekwondo','biathlon','curling','hockey','baseball'],
  'Film/Série': ['avatar','barbie','coco','dune','encanto','gladiator','inception','joker','matrix','oppenheimer','parasite','ratatouille','soul','titanic','interstellar','nomadland','parasite','up','mufasa','naruto','avengers','batman','frozen','moana','zootopia','alien','gravity','her','arrival','spotlight'],
};

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i===0?j:j===0?i:0));
  for(let i=1;i<=m;i++) for(let j=1;j<=n;j++)
    dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  return dp[m][n];
}

function validateWord(word, category, letter) {
  const clean = word.trim().toLowerCase();
  if (!clean) return { valid:false, reason:'empty' };
  if (clean[0] !== letter.toLowerCase()) return { valid:false, reason:'wrong_letter' };

  const words = DICT[category] || [];

  // Tier 1: exact
  if (words.includes(clean)) return { valid:true, tier:1, word:clean };

  // Tier 2: fuzzy
  const maxDist = clean.length<=5?0:clean.length<=8?1:2;
  let best=null, bestDist=Infinity;
  for(const w of words){
    const d = levenshtein(clean,w);
    if(d<bestDist){bestDist=d;best=w;}
  }
  if(bestDist<=maxDist) return { valid:true, tier:2, word:best, corrected:best!==clean };

  return { valid:false, tier:3, reason:'not_found' };
}

// ─── ROOM HELPERS ─────────────────────────────────────────────
function createRoom(hostId, mode, options={}) {
  const roomId = uuidv4().slice(0,8).toUpperCase();
  const room = {
    id: roomId,
    mode,
    hostId,
    status: 'waiting',       // waiting | countdown | playing | results | completed
    players: [],             // [{id,username,score,answers,ready,connected}]
    bots: [],
    round: 0,
    totalRounds: mode==='daily_league' ? 3 : 1,
    currentLetter: null,
    roundTimer: null,
    secondsLeft: CONFIG.ROUND_DURATION,
    roundAnswers: {},        // {playerId: {catIdx: word}}
    roundValidations: {},    // {playerId: {catIdx: {valid,word,pts}}}
    wager: options.wager || 0,
    entryFee: options.entryFee || 0,
    prizePool: 0,
    createdAt: Date.now(),
    options,
  };
  store.rooms.set(roomId, room);
  return room;
}

function getRoomState(room) {
  return {
    id:           room.id,
    mode:         room.mode,
    status:       room.status,
    round:        room.round,
    totalRounds:  room.totalRounds,
    letter:       room.currentLetter,
    secondsLeft:  room.secondsLeft,
    players:      room.players.map(p=>({
      id: p.id, username: p.username,
      score: p.score, ready: p.ready,
      connected: p.connected, isBot: p.isBot||false,
    })),
    wager:      room.wager,
    prizePool:  room.prizePool,
    categories: CONFIG.CATEGORIES,
  };
}

function pickLetter() {
  return CONFIG.LETTERS[Math.floor(Math.random()*CONFIG.LETTERS.length)];
}

// ─── BOT ENGINE ───────────────────────────────────────────────
const BOT_SPEED = { easy:[12000,35000], medium:[6000,22000], hard:[2000,12000] };

function scheduleBotAnswers(room, botPlayer) {
  const diff = botPlayer.difficulty || 'medium';
  const [min,max] = BOT_SPEED[diff];

  CONFIG.CATEGORIES.forEach((cat,ci)=>{
    const delay = min + Math.random()*(max-min);
    setTimeout(()=>{
      if(room.status !== 'playing') return;
      const words = (DICT[cat]||[]).filter(w=>w[0]===room.currentLetter?.toLowerCase());
      if(!words.length) return;
      const word = words[Math.floor(Math.random()*words.length)];
      if(!room.roundAnswers[botPlayer.id]) room.roundAnswers[botPlayer.id]={};
      room.roundAnswers[botPlayer.id][ci] = word;
      // Broadcast bot answer to room
      io.to(room.id).emit('player:answer', {
        playerId: botPlayer.id,
        username: botPlayer.username,
        catIdx: ci,
        word,
        isBot: true,
      });
    }, delay);
  });
}

// ─── ROUND ENGINE ─────────────────────────────────────────────
function startRound(room) {
  room.round++;
  room.status = 'playing';
  room.currentLetter = pickLetter();
  room.secondsLeft = CONFIG.ROUND_DURATION;
  room.roundAnswers = {};
  room.roundValidations = {};

  io.to(room.id).emit('round:start', {
    round:       room.round,
    totalRounds: room.totalRounds,
    letter:      room.currentLetter,
    duration:    CONFIG.ROUND_DURATION,
    categories:  CONFIG.CATEGORIES,
  });

  // Schedule bot answers
  room.bots.forEach(bot => scheduleBotAnswers(room, bot));

  // Timer tick
  room.roundTimer = setInterval(()=>{
    room.secondsLeft--;
    io.to(room.id).emit('timer:tick', { secondsLeft: room.secondsLeft });
    if(room.secondsLeft <= 0) {
      clearInterval(room.roundTimer);
      endRound(room);
    }
  }, 1000);
}

function endRound(room) {
  clearInterval(room.roundTimer);
  room.status = 'results';

  // Validate all answers
  const allWords = {}; // {catIdx: [word]} — to detect unique words

  // Collect all submitted words per category
  room.players.forEach(p=>{
    const pAnswers = room.roundAnswers[p.id] || {};
    CONFIG.CATEGORIES.forEach((_,ci)=>{
      const w = pAnswers[ci];
      if(w) {
        if(!allWords[ci]) allWords[ci]=[];
        allWords[ci].push(w.toLowerCase().trim());
      }
    });
  });

  // Validate & score
  let roundResults = {};
  room.players.forEach(p=>{
    const pAnswers = room.roundAnswers[p.id] || {};
    let roundPts = 0;
    const validations = {};

    CONFIG.CATEGORIES.forEach((cat,ci)=>{
      const raw = pAnswers[ci] || '';
      const result = validateWord(raw, cat, room.currentLetter);
      let pts = 0;

      if(result.valid){
        pts += CONFIG.POINTS_VALID;
        // Unique word bonus
        const wordOccurrences = allWords[ci]?.filter(w=>w===result.word?.toLowerCase()).length||0;
        if(wordOccurrences === 1) pts += CONFIG.POINTS_UNIQUE;
      }

      validations[ci] = { ...result, pts, raw };
      roundPts += pts;
    });

    p.score += roundPts;
    room.roundValidations[p.id] = validations;
    roundResults[p.id] = { pts:roundPts, validations, totalScore:p.score };
  });

  // Emit round results
  io.to(room.id).emit('round:end', {
    round:        room.round,
    letter:       room.currentLetter,
    results:      roundResults,
    players:      room.players.map(p=>({id:p.id,username:p.username,score:p.score,isBot:p.isBot||false})),
    hasNextRound: room.round < room.totalRounds,
  });

  // Auto-start next round or finish game
  if(room.round < room.totalRounds){
    setTimeout(()=>startRound(room), 4000);
  } else {
    setTimeout(()=>finishGame(room), 4000);
  }
}

function finishGame(room) {
  room.status = 'completed';
  const sorted = [...room.players].sort((a,b)=>b.score-a.score);
  const winner = sorted[0];

  // Calculate payouts
  let payouts = {};
  if(room.mode==='duel' && room.wager>0){
    const rake = room.prizePool * CONFIG.RAKE_DUEL;
    const net  = room.prizePool - rake;
    payouts[winner.id] = net;
  }

  io.to(room.id).emit('game:end', {
    rankings: sorted.map((p,i)=>({
      rank: i+1, id:p.id, username:p.username,
      score:p.score, payout:payouts[p.id]||0, isBot:p.isBot||false,
    })),
    winner: { id:winner.id, username:winner.username, score:winner.score },
    prizePool: room.prizePool,
  });

  // Update leaderboard
  sorted.forEach((p,i)=>{
    if(!p.isBot){
      store.leaderboard.push({
        userId: p.id, username: p.username,
        score: p.score, rank: i+1,
        mode: room.mode, date: new Date().toISOString(),
      });
    }
  });

  // Cleanup after 5min
  setTimeout(()=>store.rooms.delete(room.id), 300000);
}


// ─── PRESENCE TRACKING ───────────────────────────────────────
// Tracks which zone each connected socket is in
const presence = {
  casual:      new Set(),   // socketIds in casual game
  duel:        new Set(),   // socketIds in duel rooms
  daily_league: new Set(),  // socketIds in daily league
  lobby:       new Set(),   // socketIds in lobby/browsing
  practice:    new Set(),   // socketIds in practice zone
};

function updatePresence(socketId, zone) {
  // Remove from all zones first
  Object.values(presence).forEach(s => s.delete(socketId));
  // Add to new zone
  if (zone && presence[zone]) presence[zone].add(socketId);
}

function getPresenceStats() {
  const rooms = [...store.rooms.values()];
  const roomStats = {};
  rooms.forEach(r => {
    roomStats[r.id] = {
      id: r.id,
      mode: r.mode,
      players: r.players.filter(p => !p.isBot && p.connected).length,
      maxPlayers: CONFIG.MAX_PLAYERS,
      status: r.status,
      wager: r.wager || 0,
    };
  });

  return {
    total_online:    store.users.size,
    casual:          presence.casual.size,
    duel:            presence.duel.size,
    daily_league:    presence.daily_league.size,
    practice:        presence.practice.size,
    lobby:           store.users.size - presence.casual.size - presence.duel.size - presence.daily_league.size - presence.practice.size,
    rooms_active:    rooms.filter(r => r.status === 'playing').length,
    rooms_waiting:   rooms.filter(r => r.status === 'waiting').length,
    rooms:           roomStats,
    ts:              Date.now(),
  };
}

// Broadcast presence update to all connected clients every 5s
setInterval(() => {
  const stats = getPresenceStats();
  io.emit('presence:update', stats);
}, 5000);

// ─── SOCKET.IO EVENTS ─────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // ── AUTH ──
  socket.on('auth', ({ username }, cb) => {
    const user = {
      id: socket.id,
      username: username || `Player_${socket.id.slice(0,4)}`,
      score: 0,
      connectedAt: Date.now(),
    };
    store.users.set(socket.id, user);
    store.anticheat.set(socket.id, { tabSwitches:0, pasteAttempts:0, keyIntervals:[], flagged:false });
    console.log(`[Auth] ${user.username} (${socket.id})`);
    if(cb) cb({ ok:true, user });
    socket.emit('auth:ok', user);
  });


  // ── PRESENCE: Zone tracking ──
  socket.on('presence:join', ({ zone }) => {
    updatePresence(socket.id, zone);
    // Immediately send current stats back
    socket.emit('presence:update', getPresenceStats());
  });

  // ── ROOM: CREATE ──
  socket.on('room:create', ({ mode, options={} }, cb) => {
    const user = store.users.get(socket.id);
    if(!user) return cb?.({ error:'Not authenticated' });

    const room = createRoom(socket.id, mode, options);
    const player = { ...user, score:0, ready:false, connected:true, isBot:false };
    room.players.push(player);
    room.prizePool += room.wager;

    // Add bots for casual mode
    if(mode==='casual'){
      ['easy','medium','hard'].forEach(diff=>{
        const bot = { id:'bot-'+diff, username:'Bot_'+diff.charAt(0).toUpperCase()+diff.slice(1), score:0, ready:true, connected:true, isBot:true, difficulty:diff };
        room.bots.push(bot);
        room.players.push(bot);
      });
    }

    socket.join(room.id);
    console.log(`[Room] Created: ${room.id} mode=${mode} by ${user.username}`);
    if(cb) cb({ ok:true, room: getRoomState(room) });
    socket.emit('room:joined', getRoomState(room));
  });

  // ── ROOM: JOIN ──
  socket.on('room:join', ({ roomId }, cb) => {
    const user = store.users.get(socket.id);
    const room = store.rooms.get(roomId);

    if(!user) return cb?.({ error:'Not authenticated' });
    if(!room) return cb?.({ error:'Room not found' });
    if(room.status !== 'waiting') return cb?.({ error:'Game already started' });
    if(room.players.length >= CONFIG.MAX_PLAYERS) return cb?.({ error:'Room full' });

    const player = { ...user, score:0, ready:false, connected:true, isBot:false };
    room.players.push(player);
    room.prizePool += room.wager;

    socket.join(room.id);
    console.log(`[Room] ${user.username} joined ${roomId}`);

    // Notify room
    io.to(room.id).emit('player:joined', { player:{ id:player.id, username:player.username }, roomState:getRoomState(room) });
    if(cb) cb({ ok:true, room:getRoomState(room) });
  });

  // ── ROOM: READY ──
  socket.on('player:ready', ({ roomId }) => {
    const room = store.rooms.get(roomId);
    if(!room) return;
    const player = room.players.find(p=>p.id===socket.id);
    if(player) player.ready = true;

    io.to(roomId).emit('player:ready', { playerId:socket.id });

    // Auto-start if all humans ready
    const humans = room.players.filter(p=>!p.isBot);
    const allReady = humans.every(p=>p.ready);
    if(allReady && humans.length >= 1){
      room.status = 'countdown';
      io.to(roomId).emit('room:countdown', { seconds:3 });
      setTimeout(()=>startRound(room), 3500);
    }
  });

  // ── ROUND: SUBMIT ANSWER ──
  socket.on('round:answer', ({ roomId, catIdx, word }, cb) => {
    const room = store.rooms.get(roomId);
    if(!room || room.status!=='playing') return;

    // Anti-cheat: validate timing
    const ac = store.anticheat.get(socket.id);
    if(ac?.flagged) return cb?.({ error:'Flagged for cheating' });

    if(!room.roundAnswers[socket.id]) room.roundAnswers[socket.id]={};
    room.roundAnswers[socket.id][catIdx] = word;

    // Real-time validate Tier 1+2 instantly
    const result = validateWord(word, CONFIG.CATEGORIES[catIdx], room.currentLetter);
    if(cb) cb({ ...result, catIdx });

    // Broadcast to room (other players see "answered" indicator)
    socket.to(roomId).emit('player:answered', { playerId:socket.id, catIdx, hasAnswer:!!word.trim() });
  });

  // ── ROUND: EARLY SUBMIT ──
  socket.on('round:submit', ({ roomId }) => {
    const room = store.rooms.get(roomId);
    if(!room || room.status!=='playing') return;

    // Check if all human players submitted
    const humans = room.players.filter(p=>!p.isBot);
    const allSubmitted = humans.every(p=>room.roundAnswers[p.id]);
    if(allSubmitted){
      clearInterval(room.roundTimer);
      endRound(room);
    }
  });

  // ── ANTI-CHEAT EVENTS ──
  socket.on('anticheat:tab_switch', ({ roomId }) => {
    const ac = store.anticheat.get(socket.id);
    const room = store.rooms.get(roomId);
    if(!ac || !room) return;

    ac.tabSwitches++;
    console.log(`[AntiCheat] Tab switch: ${socket.id} (${ac.tabSwitches} times)`);

    if(ac.tabSwitches >= 1 && room.status==='playing'){
      ac.flagged = true;
      // Force submit with current (incomplete) answers
      socket.emit('anticheat:disqualified', { reason:'tab_switch', message:'Changement d\'onglet détecté — Disqualifié' });
      io.to(roomId).emit('player:disqualified', { playerId:socket.id, reason:'tab_switch' });
    }
  });

  socket.on('anticheat:paste', ({ roomId }) => {
    const ac = store.anticheat.get(socket.id);
    if(!ac) return;
    ac.pasteAttempts++;
    console.log(`[AntiCheat] Paste attempt: ${socket.id}`);
    socket.emit('anticheat:warning', { type:'paste', message:'Copy/Paste interdit !' });
  });

  socket.on('anticheat:keystrokes', ({ intervals }) => {
    const ac = store.anticheat.get(socket.id);
    if(!ac) return;
    const suspiciouslyFast = intervals.filter(i=>i<CONFIG.MIN_KEYSTROKE_INTERVAL);
    if(suspiciouslyFast.length > 5){
      ac.flagged = true;
      console.log(`[AntiCheat] Bot detected (keystroke): ${socket.id}`);
      socket.emit('anticheat:disqualified', { reason:'bot_detected', message:'Comportement automatisé détecté' });
    }
  });

  // ── POWERUP: FREEZE ──
  socket.on('powerup:freeze', ({ roomId }, cb) => {
    const room = store.rooms.get(roomId);
    if(!room || room.status!=='playing') return;
    // Pause timer for 5s (only for requesting player — server just acknowledges)
    socket.emit('powerup:freeze:ok', { duration:5000 });
    if(cb) cb({ ok:true });
  });

  // ── CHAT ──
  socket.on('room:chat', ({ roomId, message }) => {
    const user = store.users.get(socket.id);
    if(!user || !message?.trim()) return;
    const clean = message.trim().slice(0,120);
    io.to(roomId).emit('room:chat', { from:user.username, message:clean, ts:Date.now() });
  });

  // ── DISCONNECT ──
  socket.on('disconnect', () => {
    const user = store.users.get(socket.id);
    console.log(`[Socket] Disconnected: ${socket.id} (${user?.username||'?'})`);

    // Mark player as disconnected in their room
    store.rooms.forEach(room=>{
      const p = room.players.find(p=>p.id===socket.id);
      if(p){
        p.connected = false;
        io.to(room.id).emit('player:disconnected', { playerId:socket.id, username:p.username });
        // If host left, pick new host
        if(room.hostId===socket.id){
          const nextHuman = room.players.find(p=>!p.isBot&&p.connected&&p.id!==socket.id);
          if(nextHuman) room.hostId=nextHuman.id;
        }
      }
    });

    updatePresence(socket.id, null);
    store.users.delete(socket.id);
    store.anticheat.delete(socket.id);
  });
});

// ─── REST API ─────────────────────────────────────────────────

// Health
app.get('/api/health', (_, res) => res.json({
  status: 'ok', app:'wordrace-io', version:'1.0.0',
  rooms: store.rooms.size, users: store.users.size,
  uptime: process.uptime(),
  ts: new Date().toISOString(),
}));

// List open rooms
app.get('/api/rooms', (req, res) => {
  const { mode, status='waiting' } = req.query;
  let rooms = [...store.rooms.values()];
  if(mode)   rooms = rooms.filter(r=>r.mode===mode);
  if(status) rooms = rooms.filter(r=>r.status===status);
  res.json(rooms.map(r=>({
    id: r.id, mode:r.mode, status:r.status,
    players:r.players.filter(p=>!p.isBot).length,
    maxPlayers:CONFIG.MAX_PLAYERS,
    wager:r.wager, prizePool:r.prizePool,
    createdAt:r.createdAt,
  })));
});

// Room detail
app.get('/api/rooms/:id', (req, res) => {
  const room = store.rooms.get(req.params.id);
  if(!room) return res.status(404).json({error:'Room not found'});
  res.json(getRoomState(room));
});

// Leaderboard
app.get('/api/leaderboard', (req, res) => {
  const { mode='casual', limit=20 } = req.query;
  const filtered = store.leaderboard
    .filter(e=>e.mode===mode)
    .sort((a,b)=>b.score-a.score)
    .slice(0,parseInt(limit))
    .map((e,i)=>({...e,rank:i+1}));
  res.json(filtered);
});

// Daily League entry
app.post('/api/league/enter', (req, res) => {
  const { userId, username, tier } = req.body;
  if(!userId||!username||!tier) return res.status(400).json({error:'Missing fields'});
  const key = `${userId}-${tier}-${new Date().toISOString().slice(0,10)}`;
  if(store.dailyEntries.has(key)) return res.status(409).json({error:'Already entered today'});

  const entry = { userId, username, tier, score:0, submittedAt:null, enteredAt:new Date().toISOString() };
  store.dailyEntries.set(key, entry);

  // Create or find league room for this tier
  let leagueRoom = [...store.rooms.values()].find(r=>r.mode==='daily_league'&&r.options?.tier===tier&&r.status==='waiting');
  if(!leagueRoom) leagueRoom = createRoom('system','daily_league',{tier,entryFee:parseFloat(tier)});

  res.json({ ok:true, roomId:leagueRoom.id, entry });
});

// Validate word (REST endpoint for non-socket clients)
app.post('/api/validate', (req, res) => {
  const { word, category, letter } = req.body;
  if(!word||!category||!letter) return res.status(400).json({error:'Missing fields'});
  const t0 = Date.now();
  const result = validateWord(word, category, letter);
  res.json({ ...result, ms:Date.now()-t0 });
});

// Server stats (admin)
app.get('/api/stats', (req, res) => {
  const rooms = [...store.rooms.values()];
  const ps = getPresenceStats();
  res.json({
    users_online:    store.users.size,
    rooms_total:     rooms.length,
    rooms_active:    rooms.filter(r=>r.status==='playing').length,
    rooms_waiting:   rooms.filter(r=>r.status==='waiting').length,
    leaderboard_entries: store.leaderboard.length,
    daily_entries:   store.dailyEntries.size,
    uptime_seconds:  Math.round(process.uptime()),
    presence:        ps,
  });
});


// Presence stats (detailed)
app.get('/api/presence', (_, res) => {
  res.json(getPresenceStats());
});

// CGU — read (public)
app.get('/api/cgu', (_,res) => res.json(store.cgu));

// CGU — write (admin only)
app.put('/api/cgu', (req,res) => {
  const {password,content,lastUpdated} = req.body;
  if(password !== 'wordrace2026') return res.status(401).json({error:'Unauthorized'});
  if(!content || !content.trim()) return res.status(400).json({error:'Content required'});
  const newDate = (lastUpdated||'').trim() ||
    new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  store.cgu = {content, lastUpdated: newDate};
  cguWrite(store.cgu);
  console.log('[CGU] Updated, lastUpdated:', newDate);
  res.json({ok:true, lastUpdated:newDate});
});

// ─── START ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 WordRace.io Backend running on port ${PORT}`);
  console.log(`   REST API : http://localhost:${PORT}/api`);
  console.log(`   Socket.io: ws://localhost:${PORT}`);
  console.log(`   Health   : http://localhost:${PORT}/api/health\n`);
});

module.exports = { app, server, io };
