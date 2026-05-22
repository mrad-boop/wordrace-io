import { useState, useRef, useCallback } from "react";

// ─── PALETTE ────────────────────────────────────────────────
const C = {
  bg:"#F8F9F7", surface:"#FFFFFF", surface2:"#F0F2EE",
  border:"rgba(0,0,0,0.08)", lime:"#9FE870", limeD:"#7DD45A",
  limeBg:"#E8F8DF", gold:"#F5C842", goldBg:"#FDF3CC",
  text:"#1A1A1A", muted:"#6B7280", forest:"#163300",
  valid:"#16A34A", validBg:"#DCFCE7",
  invalid:"#EF4444", invalidBg:"#FEE2E2",
  warn:"#D97706", warnBg:"#FEF3C7",
  blue:"#3B82F6", blueBg:"#EFF6FF",
  purple:"#7C3AED", purpleBg:"#F5F3FF",
};

// ─── TIER 1 : DICTIONNAIRE LOCAL ────────────────────────────
// Dictionnaire simplifié par catégorie (en production: base PostgreSQL)
const DICTIONARY = {
  Animal: [
    "aigle","alligator","antilope","araignée","autruche","autruche",
    "baleine","bison","buffle","boa",
    "chameau","cheetah","chimpanzé","cobra","condor","crocodile",
    "dauphin","dingo","dromadaire",
    "éléphant","émeu","épaulard",
    "faucon","flamant","fourmilier",
    "girafe","gorille","guépard",
    "hamster","hippopotame","hyène",
    "ibis","iguane","impala",
    "jaguar","kangourou","koala",
    "léopard","lion","loup","lynx",
    "mamba","manchot","mouflon",
    "narval","ocelot","orque","otarie",
    "panthère","perroquet","pingouin","piranha","python",
    "requin","rhinocéros",
    "salamandre","scorpion","serpent","singe",
    "tigre","tortue","toucan","vautour","zèbre",
  ],
  Pays: [
    "afghanistan","algérie","allemagne","angola","arabie saoudite","argentine","australie","autriche","azerbaïdjan",
    "bahreïn","bangladesh","belgique","bolivie","botswana","brésil","bulgarie",
    "cameroun","canada","chili","chine","chypre","colombie","congo","corée","croatie","cuba",
    "danemark","djibouti","dubai",
    "egypte","emirats","equateur","espagne","estonie","éthiopie",
    "finlande","france",
    "gabon","ghana","grèce","guatemala","guinée",
    "hongrie","inde","indonésie","irak","iran","irlande","islande","israel","italie",
    "jamaïque","japon","jordanie",
    "kenya","kirghizstan","koweït",
    "laos","liban","libye","lituanie","luxembourg",
    "madagascar","malaisie","mali","maroc","mexique","mongolie","mozambique",
    "namibie","népal","niger","nigeria","norvège",
    "oman","ouganda",
    "pakistan","panama","paraguay","pays-bas","pérou","philippines","pologne","portugal",
    "qatar",
    "roumanie","russie","rwanda",
    "sénégal","serbie","singapour","slovaquie","slovénie","somalie","soudan","suède","suisse","syrie",
    "tanzanie","tchad","thaïlande","tunisie","turquie",
    "ukraine","uruguay",
    "venezuela","vietnam",
    "yémen","zambie","zimbabwe",
  ],
  Prénom: [
    "aaron","adam","adil","ahmed","aida","aicha","alice","alicia","aline","alisha","amal","amani","amine","amira",
    "baptiste","benjamin","camille","caroline","charlotte","chloe","clara",
    "daniel","david","diana","dounia","dylan",
    "elena","elias","elise","emile","emma","ethan",
    "fatima","felix","florence","francois",
    "gabriel","giulia","guillaume",
    "hamza","hugo","ibrahim","imane","inès","isabelle",
    "jade","jasmine","jean","jessica","julien","justin",
    "kenza","kevin","khaled","laila","laura","layla","lea","leila","lena","leon","lina","lisa","louis","lucas","lucie","luka","luna",
    "malak","manon","marc","maria","marie","mariam","mario","martin","mathieu","mathis","maya","mehdi","melanie","michael","mohamed","morgane",
    "nadia","naomi","nassim","nathan","nicolas","nina","nora","nour",
    "omar","oscar","oumaima",
    "paul","pauline","pedro","pierre",
    "rachid","rafael","rania","raphael","rayan","reem","robin","romane","ryan",
    "samir","sandra","sara","sarah","sasha","simon","sofia","sophie","soukaina",
    "thomas","tiago","timothee","tom","yanis","yasmine","youssef","yuna","zoe","zineb",
  ],
  Aliment: [
    "abricot","agneau","ail","amande","ananas","anchois","artichaut","asperge","aubergine","avocat",
    "banane","beurre","biscuit","boeuf","brocoli",
    "cacahuète","café","calmar","canard","carotte","cerise","champignon","chocolat","citron","clémentine","courgette","crêpe","crevette",
    "datte","dinde",
    "epinard","escalope",
    "figue","fraise","framboise","fromage",
    "gâteau","gingembre","grenade","gruyère",
    "homard","huile","huître",
    "igname",
    "jambon",
    "kiwi",
    "lait","laitue","langouste","lapin","lentille","lime","limonade",
    "maïs","mandarine","mangue","melon","miel","moule","mouton","mûre",
    "noisette","noix","nougat",
    "oignon","olive","orange","orge",
    "pamplemousse","pastèque","pâtes","pêche","pintade","pistache","poire","pois","poireau","poisson","poivre","pomme","pomme de terre","poulet","prune",
    "radis","raisin","riz","romarin",
    "safran","saumon","sel","semoule","soja","sucre",
    "thon","tomate","truffe","thé",
    "veau","vanille",
    "yaourt",
  ],
  Métier: [
    "acteur","agent","agriculteur","ambulancier","analyste","architecte","astronaute","avocat",
    "banquier","biologiste","boucher","boulanger","botaniste",
    "cardiologue","charpentier","chauffeur","chef","chimiste","chirurgien","coiffeur","comptable","cuisinier",
    "dentiste","designer","diplomate","directeur","docteur",
    "économiste","éducateur","électricien","enseignant","ergothérapeute",
    "fermier","fisc","fleuriste","formateur",
    "géographe","géologue","gérant","graphiste","gynécologue",
    "historien","hôtelier","humoriste",
    "illustrateur","informaticien","ingénieur","inspecteur",
    "jardinier","journaliste","juge",
    "kinésithérapeute",
    "libraire","logisticien",
    "maçon","manager","marin","mathématicien","mécanicien","médecin","menuisier","militaire",
    "notaire","nutritionniste",
    "océanographe","opticien","orthophoniste",
    "pédiatre","pharmacien","photographe","physicien","pilote","plombier","policier","pompier","professeur","programmeur","psychologue",
    "radiologue","réalisateur","rédacteur",
    "sage-femme","scientifique","secrétaire","sociologue","soldat","styliste",
    "technicien","thérapeute","traducteur",
    "urbaniste",
    "vétérinaire","vidéaste",
  ],
  Marque: [
    "adidas","adobe","airbnb","alibaba","amazon","apple","audi",
    "binance","bmw","boeing","booking",
    "canon","cartier","chanel","cisco","coca-cola","coinbase","corsair",
    "deezer","dell","disney","dropbox",
    "ebay","emirates",
    "facebook","ferrari","ford",
    "github","google","gucci",
    "harley","hermès","honda","huawei","hyundai",
    "ibm","intel","instagram",
    "jaguar","johnson",
    "kia","kfc",
    "lamborghini","lacoste","lenovo","lexus","linkedin","logitech","louis vuitton",
    "mastercard","mcdonald","mercedes","microsoft","mitsubishi","montblanc",
    "netflix","nike","nintendo","nvidia",
    "oracle","openai",
    "paypal","peugeot","porsche",
    "qualcomm",
    "realme","renault","rolex",
    "samsung","sap","seat","shopify","siemens","snapchat","sony","spotify","starbucks","suzuki",
    "tesla","tiktok","toyota","twitter",
    "uber","unilever",
    "visa","volkswagen",
    "xiaomi",
    "yahoo","yamaha","youtube",
    "zoom",
  ],
  Sport: [
    "aikido","alpinisme","athlétisme",
    "badminton","baseball","basketball","biathlon","billard","bobsleigh","boxe",
    "canoë","catch","cricket","croquet","curling","cyclisme",
    "danse","décathlon","escalade",
    "escrime","équitation",
    "football","formule","futsal",
    "golf","gymnastique",
    "handball","hockey","haltérophilie",
    "judo","karaté","kayak","kickboxing",
    "lancer","lutte",
    "marathon","motocross","moto","musculation",
    "natation",
    "parachutisme","patinage","pétanque","plongeon","polo",
    "quad",
    "rallye","rameur","rugby",
    "skateboard","ski","snooker","surf","squash",
    "taekwondo","tennis","tir","triathlon",
    "voile","volleyball",
    "wakeboard","water-polo","windsurf","wrestling",
  ],
};

// ─── TIER 2 : LEVENSHTEIN FUZZY MATCH ───────────────────────
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m+1 }, (_, i) => Array.from({ length: n+1 }, (_, j) => i===0?j:j===0?i:0));
  for (let i=1;i<=m;i++) for (let j=1;j<=n;j++)
    dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1] : 1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  return dp[m][n];
}

function maxAllowedDistance(wordLen) {
  if (wordLen <= 5) return 0;   // 3-5 lettres → 0 typo
  if (wordLen <= 8) return 1;   // 6-8 lettres → 1 typo
  return 2;                      // 9+ lettres  → 2 typos
}

function fuzzyMatch(input, category) {
  const words = DICTIONARY[category] || [];
  let best = null, bestDist = Infinity;
  for (const word of words) {
    const dist = levenshtein(input, word);
    if (dist < bestDist) { bestDist = dist; best = word; }
  }
  const allowed = maxAllowedDistance(input.length);
  return bestDist <= allowed ? { word: best, distance: bestDist } : null;
}

// ─── TIER 3 : AI ARBITRATOR (Claude API) ────────────────────
async function aiArbitrate(word, category, letter) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `Tu es un arbitre strict pour le jeu de mots "WordRace" (style Petit Bac).
Règles:
- Le mot doit appartenir à la catégorie demandée
- Le mot doit commencer par la lettre indiquée
- Accepte les variantes d'orthographe courantes, les mots rares, noms propres, argot
- Réponds UNIQUEMENT en JSON: {"valid": true/false, "reason": "explication courte", "corrected": "mot corrigé si besoin"}`,
      messages: [{
        role: "user",
        content: `Catégorie: ${category}\nLettre: ${letter}\nMot soumis: "${word}"\n\nCe mot est-il valide ?`
      }]
    })
  });
  const data = await response.json();
  const text = data.content?.[0]?.text || "{}";
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return { valid: false, reason: "Erreur de parsing" };
  }
}

// ─── MAIN VALIDATION FUNCTION ────────────────────────────────
async function validateWord(input, category, letter, onProgress) {
  const start = Date.now();
  const clean = input.trim().toLowerCase();

  if (!clean) return { tier: null, valid: false, reason: "Mot vide", ms: 0 };
  if (clean[0] !== letter.toLowerCase())
    return { tier: null, valid: false, reason: `Ne commence pas par ${letter}`, ms: 0 };

  // TIER 1 — Exact match
  onProgress(1);
  await new Promise(r => setTimeout(r, 80)); // simulate DB query
  const words = DICTIONARY[category] || [];
  if (words.includes(clean)) {
    return { tier: 1, valid: true, word: clean, reason: "Correspondance exacte", ms: Date.now()-start };
  }

  // TIER 2 — Fuzzy match
  onProgress(2);
  await new Promise(r => setTimeout(r, 120));
  const fuzzy = fuzzyMatch(clean, category);
  if (fuzzy) {
    return {
      tier: 2, valid: true, word: fuzzy.word,
      reason: `Correction automatique (${fuzzy.distance} typo${fuzzy.distance>1?"s":""})`,
      corrected: fuzzy.word !== clean,
      ms: Date.now()-start
    };
  }

  // TIER 3 — AI Arbitrator
  onProgress(3);
  try {
    const ai = await aiArbitrate(clean, category, letter);
    return {
      tier: 3, valid: ai.valid,
      word: ai.corrected || clean,
      reason: ai.reason || (ai.valid ? "Validé par IA" : "Rejeté par IA"),
      corrected: !!ai.corrected && ai.corrected !== clean,
      ms: Date.now()-start
    };
  } catch {
    return { tier: 3, valid: false, reason: "IA indisponible — mot rejeté par défaut", ms: Date.now()-start };
  }
}

// ─── UI COMPONENTS ───────────────────────────────────────────
const CATEGORIES = Object.keys(DICTIONARY);
const LETTERS = "ABCDEFGHIJKLMNOPRSTUVWXYZ".split("");

function TierBadge({ tier, active, done, valid }) {
  const configs = {
    1: { label:"Tier 1", sub:"Exact Match",   color: C.lime,   bg: C.limeBg,   icon:"🔍" },
    2: { label:"Tier 2", sub:"Fuzzy Match",   color: C.gold,   bg: C.goldBg,   icon:"🔧" },
    3: { label:"Tier 3", sub:"AI Arbitrator", color: C.purple, bg: C.purpleBg, icon:"🤖" },
  };
  const cfg = configs[tier];
  const isActive = active === tier;
  const isDone = done >= tier;

  return (
    <div style={{
      flex:1, padding:"0.9rem 0.7rem", borderRadius:"0.8rem", textAlign:"center",
      background: isDone ? (valid ? C.validBg : isActive ? cfg.bg : C.invalidBg) : isActive ? cfg.bg : C.surface2,
      border:`1.5px solid ${isDone ? (valid ? C.valid : isActive ? cfg.color : C.invalid) : isActive ? cfg.color : C.border}`,
      transition:"all .3s",
      opacity: !isActive && !isDone ? 0.45 : 1,
    }}>
      <div style={{ fontSize:"1.3rem", marginBottom:"0.2rem" }}>
        {isDone ? (valid || done > tier ? "✅" : done === tier ? "❌" : cfg.icon) : isActive ? "⏳" : cfg.icon}
      </div>
      <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.6rem", fontWeight:700, color: isActive ? cfg.color : C.text, letterSpacing:"0.08em" }}>{cfg.label}</div>
      <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.55rem", color:C.muted, marginTop:"0.1rem" }}>{cfg.sub}</div>
    </div>
  );
}

function ResultCard({ result }) {
  if (!result) return null;
  const isValid = result.valid;
  const tierColors = { 1: C.lime, 2: C.gold, 3: C.purple };
  const tierNames  = { 1: "Exact Match", 2: "Fuzzy Match", 3: "AI Arbitrator" };

  return (
    <div style={{
      borderRadius:"0.9rem", overflow:"hidden",
      border:`2px solid ${isValid ? C.valid : C.invalid}`,
      background: isValid ? C.validBg : C.invalidBg,
    }}>
      <div style={{ padding:"0.9rem 1.1rem", background: isValid ? C.valid : C.invalid, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.4rem", color:"#fff", letterSpacing:"0.05em" }}>
          {isValid ? "✅ MOT VALIDE" : "❌ MOT INVALIDE"}
        </div>
        {result.tier && (
          <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.58rem", fontWeight:700, letterSpacing:"0.1em", padding:"0.2rem 0.5rem", borderRadius:100, background:"rgba(255,255,255,0.25)", color:"#fff" }}>
            {tierNames[result.tier]}
          </span>
        )}
      </div>
      <div style={{ padding:"0.9rem 1.1rem", display:"flex", flexDirection:"column", gap:"0.5rem" }}>
        {result.corrected && (
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.7rem", color:C.warn, background:C.warnBg, padding:"0.35rem 0.6rem", borderRadius:"0.4rem" }}>
            ✏️ Corrigé automatiquement → <strong>{result.word}</strong>
          </div>
        )}
        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.7rem", color: isValid ? C.valid : C.invalid }}>
          {result.reason}
        </div>
        <div style={{ display:"flex", gap:"1rem", fontFamily:"'Space Mono',monospace", fontSize:"0.6rem", color:C.muted }}>
          <span>⏱️ {result.ms}ms</span>
          {result.tier && <span style={{ color: tierColors[result.tier] }}>● Tier {result.tier}</span>}
        </div>
      </div>
    </div>
  );
}

function BatchTester({ letter }) {
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);

  const tests = [
    { word: letter+"igle",    cat:"Animal",  desc:"Exact match" },
    { word: letter+"aleine",  cat:"Animal",  desc:"Fuzzy (si typo)" },
    { word: letter+"rance",   cat:"Pays",    desc:"Exact match" },
    { word: letter+"eresa",   cat:"Prénom",  desc:"Rare — IA" },
    { word: "Z"+letter+"bra", cat:"Animal",  desc:"Mauvaise lettre" },
  ].filter(t => t.word[0].toUpperCase() === letter || t.desc === "Mauvaise lettre");

  const runBatch = async () => {
    setRunning(true);
    setResults([]);
    for (const t of tests) {
      const r = await validateWord(t.word, t.cat, letter, ()=>{});
      setResults(prev => [...prev, { ...t, result: r }]);
      await new Promise(r => setTimeout(r, 200));
    }
    setRunning(false);
  };

  return (
    <div style={{ background:C.surface, borderRadius:"0.9rem", border:`1px solid ${C.border}`, padding:"1.2rem", marginTop:"1rem" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.8rem" }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.2rem", color:C.text, letterSpacing:"0.05em" }}>
          🧪 Batch Tester
        </div>
        <button onClick={runBatch} disabled={running} style={{ padding:"0.45rem 0.9rem", borderRadius:"0.5rem", border:"none", background: running ? C.surface2 : C.lime, color: running ? C.muted : C.forest, fontFamily:"'Space Mono',monospace", fontSize:"0.65rem", fontWeight:700, cursor: running ? "not-allowed" : "pointer" }}>
          {running ? "⏳ Running..." : "▶ Run All"}
        </button>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
        {tests.map((t, i) => {
          const r = results[i];
          return (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:"0.6rem", padding:"0.45rem 0.7rem", borderRadius:"0.5rem", background: r ? (r.result.valid ? C.validBg : C.invalidBg) : C.surface2 }}>
              <span style={{ fontSize:"0.9rem" }}>{r ? (r.result.valid ? "✅" : "❌") : "⬜"}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.68rem", fontWeight:700, color:C.text }}>{t.word} <span style={{ color:C.muted, fontWeight:400 }}>({t.cat})</span></div>
                {r && <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.58rem", color:C.muted }}>{r.result.reason} · {r.result.ms}ms · Tier {r.result.tier||"—"}</div>}
              </div>
              {r?.result.tier && (
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.55rem", padding:"0.15rem 0.4rem", borderRadius:100, background: [C.limeBg,C.goldBg,C.purpleBg][r.result.tier-1], color:[C.forest,C.warn,C.purple][r.result.tier-1] }}>T{r.result.tier}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────
export default function ValidationEngine() {
  const [letter, setLetter]     = useState("A");
  const [category, setCategory] = useState("Animal");
  const [input, setInput]       = useState("");
  const [activeTier, setActive] = useState(0);
  const [doneTier, setDone]     = useState(0);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [cache, setCache]       = useState({});
  const inputRef = useRef(null);

  const handleValidate = useCallback(async () => {
    if (!input.trim() || loading) return;
    const key = `${input.trim().toLowerCase()}|${category}|${letter}`;

    // Cache hit
    if (cache[key]) {
      setResult({ ...cache[key], fromCache: true });
      setActive(0); setDone(cache[key].tier || 0);
      return;
    }

    setLoading(true);
    setResult(null);
    setActive(0);
    setDone(0);

    const r = await validateWord(input, category, letter, (tier) => {
      setActive(tier);
      setDone(tier - 1);
    });

    setActive(0);
    setDone(r.tier || 0);
    setResult(r);
    setLoading(false);

    // Save to cache
    if (r.valid) setCache(prev => ({ ...prev, [key]: r }));
  }, [input, category, letter, loading, cache]);

  const handleKey = (e) => { if (e.key === "Enter") handleValidate(); };

  const handleInput = (e) => {
    const v = e.target.value;
    if (v.length > 0 && v[0].toUpperCase() !== letter) return;
    setInput(v);
    setResult(null);
    setActive(0);
    setDone(0);
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Inter',sans-serif", paddingBottom:"3rem" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
      `}</style>

      {/* HEADER */}
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"1rem 1.5rem", display:"flex", alignItems:"center", gap:"1rem", boxShadow:"0 1px 4px rgba(0,0,0,.05)" }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.6rem", color:C.text }}>
          WORD<span style={{color:C.lime}}>RACE</span>
        </div>
        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.62rem", color:C.muted, letterSpacing:"0.08em" }}>
          MODULE D — VALIDATION ENGINE
        </div>
        <div style={{ marginLeft:"auto", background:C.limeBg, border:`1px solid ${C.lime}`, borderRadius:100, padding:"0.22rem 0.6rem", fontFamily:"'Space Mono',monospace", fontSize:"0.58rem", color:C.forest, fontWeight:700 }}>
          3-TIER · &lt;500ms
        </div>
      </div>

      <div style={{ maxWidth:680, margin:"0 auto", padding:"1.5rem 1.2rem", display:"flex", flexDirection:"column", gap:"1.2rem" }}>

        {/* ARCHITECTURE CARD */}
        <div style={{ background:C.surface, borderRadius:"1rem", border:`1px solid ${C.border}`, padding:"1.2rem", boxShadow:"0 2px 8px rgba(0,0,0,.05)" }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.1rem", color:C.text, letterSpacing:"0.05em", marginBottom:"0.8rem" }}>
            ⚙️ Architecture de Validation
          </div>
          <div style={{ display:"flex", gap:"0.5rem" }}>
            {[1,2,3].map(t => <TierBadge key={t} tier={t} active={activeTier} done={doneTier} valid={result?.valid} />)}
          </div>
          <div style={{ marginTop:"0.8rem", display:"flex", alignItems:"center", gap:"0.4rem", fontFamily:"'Space Mono',monospace", fontSize:"0.6rem", color:C.muted }}>
            <span style={{ background:C.limeBg, color:C.forest, padding:"0.12rem 0.4rem", borderRadius:4 }}>T1</span>
            <span>DB exacte → si raté →</span>
            <span style={{ background:C.goldBg, color:C.warn, padding:"0.12rem 0.4rem", borderRadius:4 }}>T2</span>
            <span>Levenshtein → si raté →</span>
            <span style={{ background:C.purpleBg, color:C.purple, padding:"0.12rem 0.4rem", borderRadius:4 }}>T3</span>
            <span>Claude AI</span>
          </div>
        </div>

        {/* CONTROLS */}
        <div style={{ background:C.surface, borderRadius:"1rem", border:`1px solid ${C.border}`, padding:"1.2rem", boxShadow:"0 2px 8px rgba(0,0,0,.05)" }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.1rem", color:C.text, letterSpacing:"0.05em", marginBottom:"0.9rem" }}>
            🎮 Tester le Validateur
          </div>

          {/* Letter + Category selectors */}
          <div style={{ display:"flex", gap:"0.6rem", marginBottom:"0.8rem", flexWrap:"wrap" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.3rem" }}>
              <label style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.58rem", color:C.muted, letterSpacing:"0.08em", textTransform:"uppercase" }}>Lettre</label>
              <select value={letter} onChange={e=>{setLetter(e.target.value);setInput("");setResult(null);}}
                style={{ padding:"0.5rem 0.7rem", borderRadius:"0.5rem", border:`1px solid ${C.border}`, fontFamily:"'Space Mono',monospace", fontSize:"0.8rem", fontWeight:700, color:C.forest, background:C.limeBg, cursor:"pointer" }}>
                {LETTERS.map(l=><option key={l}>{l}</option>)}
              </select>
            </div>
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"0.3rem" }}>
              <label style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.58rem", color:C.muted, letterSpacing:"0.08em", textTransform:"uppercase" }}>Catégorie</label>
              <select value={category} onChange={e=>{setCategory(e.target.value);setResult(null);}}
                style={{ padding:"0.5rem 0.7rem", borderRadius:"0.5rem", border:`1px solid ${C.border}`, fontFamily:"'Space Mono',monospace", fontSize:"0.75rem", color:C.text, background:C.surface, cursor:"pointer", width:"100%" }}>
                {CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Input */}
          <div style={{ display:"flex", gap:"0.5rem" }}>
            <input
              ref={inputRef}
              type="text" value={input} onChange={handleInput} onKeyDown={handleKey}
              placeholder={`${letter}... (commence par ${letter})`}
              autoCorrect="off" autoComplete="off" autoCapitalize="none" spellCheck={false}
              onPaste={e=>e.preventDefault()}
              disabled={loading}
              style={{ flex:1, padding:"0.75rem 1rem", borderRadius:"0.6rem", fontFamily:"'Space Mono',monospace", fontSize:"0.9rem", border:`2px solid ${result ? (result.valid ? C.valid : C.invalid) : C.border}`, background:C.surface, color:C.text, outline:"none", transition:"border .2s" }}
            />
            <button onClick={handleValidate} disabled={loading || !input.trim()}
              style={{ padding:"0.75rem 1.2rem", borderRadius:"0.6rem", border:"none", background: loading || !input.trim() ? C.surface2 : C.lime, color: loading || !input.trim() ? C.muted : C.forest, fontFamily:"'Space Mono',monospace", fontSize:"0.75rem", fontWeight:700, cursor: loading || !input.trim() ? "not-allowed" : "pointer", transition:"all .2s", minWidth:90 }}>
              {loading
                ? <span style={{ display:"inline-block", width:14, height:14, border:"2px solid #0003", borderTopColor:C.forest, borderRadius:"50%", animation:"spin .7s linear infinite" }}/>
                : "Valider →"}
            </button>
          </div>

          {/* hint */}
          <p style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.58rem", color:C.muted, marginTop:"0.4rem" }}>
            ↵ Enter pour valider · Copy/Paste désactivé · Lettre {letter} obligatoire
          </p>
        </div>

        {/* RESULT */}
        {result && (
          <div style={{ animation:"fadeIn .3s ease" }}>
            <ResultCard result={result} />
            {result.fromCache && (
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.58rem", color:C.muted, marginTop:"0.4rem", textAlign:"center" }}>
                ⚡ Résultat depuis le cache local (0ms)
              </div>
            )}
          </div>
        )}

        {/* CACHE STATS */}
        {Object.keys(cache).length > 0 && (
          <div style={{ background:C.blueBg, border:`1px solid ${C.blue}`, borderRadius:"0.7rem", padding:"0.7rem 1rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.65rem", color:C.blue }}>
              💾 Cache AI : <strong>{Object.keys(cache).length}</strong> mot{Object.keys(cache).length>1?"s":""} sauvegardé{Object.keys(cache).length>1?"s":""}
            </div>
            <button onClick={()=>setCache({})} style={{ background:"none", border:`1px solid ${C.blue}`, borderRadius:"0.35rem", padding:"0.18rem 0.5rem", fontFamily:"'Space Mono',monospace", fontSize:"0.55rem", color:C.blue, cursor:"pointer" }}>
              Clear
            </button>
          </div>
        )}

        {/* LEVENSHTEIN EXPLAINER */}
        <div style={{ background:C.surface, borderRadius:"1rem", border:`1px solid ${C.border}`, padding:"1.2rem", boxShadow:"0 2px 8px rgba(0,0,0,.05)" }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.1rem", color:C.text, letterSpacing:"0.05em", marginBottom:"0.8rem" }}>
            🔧 Règles Fuzzy (Levenshtein)
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
            {[["3–5 lettres","0 typo","Exact obligatoire",C.valid],["6–8 lettres","1 typo","1 erreur tolérée",C.gold],["9+ lettres","2 typos","2 erreurs tolérées",C.purple]].map(([len,typo,desc,color])=>(
              <div key={len} style={{ display:"flex", alignItems:"center", gap:"0.7rem", padding:"0.45rem 0.7rem", borderRadius:"0.5rem", background:C.surface2 }}>
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.65rem", fontWeight:700, color, minWidth:60 }}>{len}</span>
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.65rem", fontWeight:700, background:`${color}22`, color, padding:"0.12rem 0.4rem", borderRadius:4 }}>{typo}</span>
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.62rem", color:C.muted }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* BATCH TESTER */}
        <BatchTester letter={letter} />

      </div>
    </div>
  );
}
