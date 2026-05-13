import { useState, useEffect, useRef, useCallback } from "react";
// ─── ORIENTATION STATE ───────────────────────────────────────────────────
  const [isPortrait, setIsPortrait] = useState(
    window.innerHeight > window.innerWidth && window.innerWidth < 768
  );

  useEffect(() => {
    const handleResize = () => {
      // Check if it's a mobile device AND currently being held vertically
      setIsPortrait(window.innerHeight > window.innerWidth && window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    // Call it once on mount just to be sure
    handleResize(); 
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
const PS = 86;
const G = 4;
const GAP = 3;
const SNAP = 75;
const BX = 420;
const BY = 40;
const BOARD_SIZE = G * (PS + GAP) - GAP;

const PRESETS = [
  { seed: "forestgrove1",  label: "Ancient Forest",    icon: "🌲" },
  { seed: "skypalace99",   label: "Sky Palace",         icon: "🏯" },
  { seed: "koipond42",     label: "Koi Pond",           icon: "🎏" },
  { seed: "blossomhill7",  label: "Blossom Hill",       icon: "🌸" },
  { seed: "lanternfest",   label: "Spirit Lanterns",    icon: "🏮" },
  { seed: "mistymount88",  label: "Misty Mountain",     icon: "⛰️" },
];

const imgUrl = seed => `https://picsum.photos/seed/${seed}/${G * PS}/${G * PS}`;

const slotPos = (col, row) => ({
  x: BX + col * (PS + GAP),
  y: BY + row * (PS + GAP),
});

function fisherYates(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makePieces(tw, th) {
  const order = fisherYates(Array.from({ length: 16 }, (_, i) => i));
  const placed = [];
  return order.map(id => {
    let x, y, t = 0;
    do {
      x = 10 + Math.random() * (tw - PS - 20);
      y = 10 + Math.random() * (th - PS - 20);
      t++;
    } while (t < 60 && placed.some(p => Math.abs(p.x - x) < PS - 10 && Math.abs(p.y - y) < PS - 10));
    placed.push({ x, y });
    return { id, col: id % G, row: Math.floor(id / G), x, y, locked: false };
  });
}

const CONFETTI_COLORS = ["#FFD700","#FF6B6B","#4ECDC4","#FF9F43","#A29BFE","#FD79A8","#55EFC4","#FDCB6E","#E17055","#6C5CE7"];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,600;0,700;1,400&family=Nunito:wght@600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{overflow-x:hidden}
@keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
@keyframes pop{0%{transform:scale(.7);opacity:0}70%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes confetti{0%{transform:scale(0) rotate(0deg);opacity:1}100%{transform:scale(2.2) rotate(200deg);opacity:0}}
@keyframes shimmer{0%,100%{opacity:.4}50%{opacity:.9}}
@keyframes snap{0%{transform:scale(1.1)}100%{transform:scale(1)}}
@keyframes wink{0%,90%,100%{opacity:1}95%{opacity:0}}
.btn-primary{background:linear-gradient(135deg,#5B8C42,#3a6128);color:#fff;border:none;padding:14px 44px;border-radius:50px;font-size:18px;font-family:'Nunito',sans-serif;font-weight:800;cursor:pointer;box-shadow:0 4px 22px rgba(91,140,66,.45);transition:transform .2s,box-shadow .2s;letter-spacing:.4px}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(91,140,66,.6)}
.btn-primary:active{transform:translateY(1px)}
.btn-secondary{background:rgba(255,255,255,.07);color:#F0E8D0;border:1.5px solid rgba(255,255,255,.2);padding:9px 22px;border-radius:50px;font-size:14px;font-family:'Nunito',sans-serif;font-weight:700;cursor:pointer;transition:background .2s,border-color .2s}
.btn-secondary:hover{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.32)}
.preset-card{cursor:pointer;border-radius:14px;overflow:hidden;transition:transform .2s,box-shadow .2s;border:3px solid transparent;position:relative}
.preset-card:hover{transform:scale(1.05);box-shadow:0 10px 28px rgba(0,0,0,.45)}
.preset-card.active{border-color:#D4A940;box-shadow:0 0 0 2px rgba(212,169,64,.35),0 10px 28px rgba(0,0,0,.45)}
.piece{transition:box-shadow .12s,border-color .12s}
.piece.locked{animation:snap .22s ease}
.piece:not(.locked):hover{box-shadow:0 8px 24px rgba(0,0,0,.5)!important}
.upload-zone{cursor:pointer;border:2px dashed rgba(255,255,255,.2);border-radius:14px;padding:14px 24px;font-size:14px;color:rgba(240,232,208,.65);display:inline-flex;align-items:center;gap:9px;transition:border-color .2s,background .2s}
.upload-zone:hover{border-color:rgba(255,255,255,.38);background:rgba(255,255,255,.05)}
`;

export default function App() {
  const [page,        setPage]        = useState("home");
  const [preset,      setPreset]      = useState(PRESETS[0]);
  const [customImg,   setCustomImg]   = useState(null);
  const [activeImg,   setActiveImg]   = useState(imgUrl(PRESETS[0].seed));
  const [pieces,      setPieces]      = useState([]);
  const [moves,       setMoves]       = useState(0);
  const [secs,        setSecs]        = useState(0);
  const [running,     setRunning]     = useState(false);
  const [preview,     setPreview]     = useState(false);
  const [confetti,    setConfetti]    = useState([]);
  const [draggingId,  setDraggingId]  = useState(null);

  const drag   = useRef(null);
  const arena  = useRef(null);
  const ticker = useRef(null);

  const TW = BX - 14;
  const GH = BY * 2 + BOARD_SIZE;
  const GW = BX + BOARD_SIZE + 22;

  const locked = pieces.filter(p => p.locked).length;
  const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  function startGame(url = activeImg) {
    setPieces(makePieces(TW, GH));
    setMoves(0); setSecs(0);
    setRunning(true); setPreview(false);
    setPage("game");
  }

  function selectPreset(p) {
    setPreset(p);
    setActiveImg(imgUrl(p.seed));
    setCustomImg(null);
  }

  function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setCustomImg(ev.target.result);
      setActiveImg(ev.target.result);
      setPreset(null);
    };
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    if (running) { ticker.current = setInterval(() => setSecs(s => s+1), 1000); }
    else clearInterval(ticker.current);
    return () => clearInterval(ticker.current);
  }, [running]);
// Watch the game state and trigger the win screen when all 16 pieces lock
  useEffect(() => {
    if (running && locked === 16) {
      setRunning(false);
      setTimeout(() => {
        setConfetti(Array.from({ length: 55 }, (_, i) => ({
          id: i, x: 5 + Math.random()*90, y: 5 + Math.random()*90,
          size: 7 + Math.random()*18, delay: Math.random()*2.8,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          shape: Math.random() > .5 ? "4px" : "50%",
        })));
        setPage("win");
      }, 500);
    }
  }, [locked, running]);
  const getXY = e => e.touches ? [e.touches[0].clientX, e.touches[0].clientY] : [e.clientX, e.clientY];

  const onDown = useCallback((e, id, isLocked) => {
    if (isLocked) return;
    if (e.cancelable) e.preventDefault();

    const r = arena.current.getBoundingClientRect();
    const [cx, cy] = getXY(e);

    setDraggingId(id);

    setPieces(prev => {
      const p = prev.find(q => q.id === id);
      if (!p) return prev;
      
      // Save exact starting coordinates
      drag.current = { 
        id, 
        ox: cx - r.left - p.x, 
        oy: cy - r.top - p.y, 
        hasMoved: false,
        startX: p.x,
        startY: p.y
      };

      const a = [...prev];
      const i = a.findIndex(q => q.id === id);
      const [it] = a.splice(i, 1);
      return [...a, it];
    });
  }, []);

  const onMove = useCallback(e => {
    if (!drag.current || !arena.current) return;
    if (e.cancelable) e.preventDefault();

    const [cx, cy] = getXY(e);
    drag.current.hasMoved = true;

    // 🚨 THE CRASH FIX: Bypass React entirely during the drag!
    // We update the HTML element's style directly. Zero React re-renders.
    requestAnimationFrame(() => {
      if (!drag.current) return;
      const r = arena.current.getBoundingClientRect();
      const newX = cx - r.left - drag.current.ox;
      const newY = cy - r.top - drag.current.oy;

      // Find the specific puzzle piece on the screen and move it
      const element = document.getElementById(`piece-${drag.current.id}`);
      if (element) {
        element.style.left = `${newX}px`;
        element.style.top = `${newY}px`;
        // Save the live coordinates so onUp knows where it landed
        drag.current.liveX = newX;
        drag.current.liveY = newY;
      }
    });
  }, []);

  const onUp = useCallback(() => {
    if (!drag.current) return;
    
    const id = drag.current.id;
    const didActuallyMove = drag.current.hasMoved;
    
    // Get the final dropped location, or default to where it started
    const dropX = drag.current.liveX ?? drag.current.startX;
    const dropY = drag.current.liveY ?? drag.current.startY;
    
    drag.current = null;
    setDraggingId(null);

    // Now we update React state just ONCE when the mouse is released
    setPieces(prev => {
      const p = prev.find(q => q.id === id);
      if (!p) return prev;
      const sp = slotPos(p.col, p.row);
      const dist = Math.hypot(dropX - sp.x, dropY - sp.y);

      if (dist < SNAP) {
        return prev.map(q => q.id === id ? { ...q, x: sp.x, y: sp.y, locked: true } : q);
      }
      
      // If it didn't snap, save its new resting place
      return prev.map(q => q.id === id ? { ...q, x: dropX, y: dropY } : q);
    });

    if (didActuallyMove) {
      setMoves(m => m + 1);
    }
  }, [slotPos]);
  
  useEffect(() => {
    const opts = { passive: false };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, opts);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [onMove, onUp]);

  const BG = "radial-gradient(ellipse at 25% 75%, #0C1F14 0%, #162A1E 55%, #091410 100%)";
// 🚨 PORTRAIT MODE BLOCKER
  if (isPortrait) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", background:"#1a1a1a", color:"#F0E8D0", textAlign:"center", padding:30 }}>
        <div style={{ fontSize:50, marginBottom:20, animation:"pulse 2s infinite" }}>
          🔄📱
        </div>
        <h2 style={{ fontFamily:"'Lora', serif", color:"#D4A940", fontSize:28, marginBottom:10 }}>
          Rotate Your Device
        </h2>
        <p style={{ fontSize:16, lineHeight:1.5, color:"rgba(240,232,208,.7)" }}>
          Puzzle Grove requires a wider screen to give you enough room to arrange the pieces. <br/><br/>
          Please turn your phone sideways to play!
        </p>
      </div>
    );
  }
  // ─── HOME ────────────────────────────────────────────────────────────────
  if (page === "home") return (
    <div style={{ fontFamily:"'Nunito',sans-serif", minHeight:"100vh", background:BG, color:"#F0E8D0", display:"flex", flexDirection:"column", alignItems:"center", padding:"32px 20px 48px", userSelect:"none", overflowX:"hidden" }}>
      <style>{CSS}</style>

      {/* ambient glows */}
      <div style={{ position:"fixed", top:"-8%", right:"-6%", width:340, height:340, borderRadius:"50%", background:"radial-gradient(circle,rgba(91,140,66,.12) 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"fixed", bottom:"2%", left:"-10%", width:420, height:420, borderRadius:"50%", background:"radial-gradient(circle,rgba(212,169,64,.07) 0%,transparent 70%)", pointerEvents:"none" }} />

      {/* Hero */}
      <div style={{ textAlign:"center", marginBottom:38, animation:"fadeUp .8s ease both" }}>
        <div style={{ fontSize:52, animation:"float 3s ease-in-out infinite", display:"inline-block", marginBottom:6 }}>🌿</div>
        <h1 style={{ fontFamily:"'Lora',serif", fontSize:44, fontWeight:700, letterSpacing:"-1px", background:"linear-gradient(135deg,#E8D08A 30%,#C4A43A 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", lineHeight:1.15 }}>
          Puzzle Grove
        </h1>
        <p style={{ fontFamily:"'Lora',serif", fontStyle:"italic", fontSize:16, color:"rgba(240,232,208,.55)", marginTop:8 }}>
          "Where every piece finds its home"
        </p>
      </div>

      {/* Preset grid */}
      <div style={{ width:"100%", maxWidth:700, animation:"fadeUp .9s .1s ease both" }}>
        <p style={{ textAlign:"center", fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:3, color:"rgba(240,232,208,.38)", marginBottom:14 }}>
          ✦ &nbsp; Choose your puzzle &nbsp; ✦
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
          {PRESETS.map(p => (
            <div key={p.seed} className={`preset-card${preset?.seed === p.seed ? " active" : ""}`} onClick={() => selectPreset(p)}>
              <img src={imgUrl(p.seed)} alt={p.label} style={{ width:"100%", height:105, objectFit:"cover", display:"block" }} crossOrigin="anonymous" />
              <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(transparent,rgba(0,0,0,.72))", padding:"20px 10px 9px", fontSize:13, fontWeight:700, color:"#fff", textAlign:"center" }}>
                {p.icon} {p.label}
              </div>
              {preset?.seed === p.seed && (
                <div style={{ position:"absolute", top:8, right:8, width:24, height:24, borderRadius:"50%", background:"#D4A940", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:"#1a1a1a", fontWeight:800 }}>✓</div>
              )}
            </div>
          ))}
        </div>

        {/* Upload */}
        <div style={{ marginTop:18, textAlign:"center" }}>
          <label className="upload-zone">
            <span style={{ fontSize:18 }}>📂</span>
            Upload your own image
            <input type="file" accept="image/*" onChange={handleUpload} style={{ display:"none" }} />
          </label>
          {customImg && (
            <div style={{ marginTop:12, display:"inline-flex", alignItems:"center", gap:12 }}>
              <img src={customImg} alt="custom" onClick={() => { setActiveImg(customImg); setPreset(null); }} style={{ width:54, height:54, objectFit:"cover", borderRadius:10, border:`2px solid ${!preset ? "#D4A940" : "rgba(255,255,255,.15)"}`, cursor:"pointer" }} />
              <span style={{ fontSize:13, color:"rgba(240,232,208,.55)" }}>
                {!preset ? "✓ Custom image selected" : "Click to select custom image"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Start */}
      <div style={{ marginTop:36, animation:"fadeUp 1s .2s ease both" }}>
        <button className="btn-primary" onClick={() => startGame()} style={{ fontSize:20, padding:"16px 60px" }}>
          ✦ &nbsp; Start Puzzle &nbsp; ✦
        </button>
      </div>

      <p style={{ marginTop:22, fontSize:12, color:"rgba(240,232,208,.25)", animation:"fadeUp 1.1s .3s ease both", textAlign:"center" }}>
        Drag pieces from the tray onto the board · Pieces snap into place when close enough
      </p>

      {/* Decorative dots */}
      <div style={{ position:"fixed", bottom:30, right:30, opacity:.12 }}>
        {[...Array(9)].map((_,i) => (
          <div key={i} style={{ width:5, height:5, borderRadius:"50%", background:"#D4A940", display:"inline-block", margin:"3px", animation:`shimmer ${1.5+i*.2}s ease-in-out infinite` }} />
        ))}
      </div>
    </div>
  );

  // ─── WIN ─────────────────────────────────────────────────────────────────
  if (page === "win") return (
    <div style={{ fontFamily:"'Nunito',sans-serif", minHeight:"100vh", background:BG, color:"#F0E8D0", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:28, userSelect:"none", position:"relative", overflow:"hidden" }}>
      <style>{CSS}</style>
      {confetti.map(s => (
        <div key={s.id} style={{ position:"absolute", left:`${s.x}%`, top:`${s.y}%`, width:s.size, height:s.size, background:s.color, borderRadius:s.shape, animation:`confetti 2.5s ${s.delay}s ease-out both`, pointerEvents:"none" }} />
      ))}
      <div style={{ textAlign:"center", zIndex:10, animation:"pop .6s ease" }}>
        <div style={{ fontSize:76, marginBottom:10 }}>🎉</div>
        <h1 style={{ fontFamily:"'Lora',serif", fontSize:38, fontWeight:700, background:"linear-gradient(135deg,#FFD700,#FF6B6B,#4ECDC4)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:6 }}>
          Puzzle Complete!
        </h1>
        <p style={{ fontFamily:"'Lora',serif", fontStyle:"italic", color:"rgba(240,232,208,.65)", marginBottom:26, fontSize:17 }}>
          The grove is whole again ✨
        </p>
        <div style={{ width:BOARD_SIZE, height:BOARD_SIZE, backgroundImage:`url(${activeImg})`, backgroundSize:"100% 100%", borderRadius:18, margin:"0 auto 28px", boxShadow:"0 24px 64px rgba(0,0,0,.55), 0 0 0 3px #D4A940, 0 0 0 6px rgba(212,169,64,.2)" }} />
        <div style={{ display:"flex", gap:18, justifyContent:"center", marginBottom:30 }}>
          {[{ icon:"⏱", val:fmt(secs), label:"Time" }, { icon:"✋", val:moves, label:"Moves" }].map(s => (
            <div key={s.label} style={{ background:"rgba(255,255,255,.07)", borderRadius:14, padding:"12px 26px", textAlign:"center", border:"1px solid rgba(255,255,255,.1)" }}>
              <div style={{ fontSize:22, marginBottom:2 }}>{s.icon}</div>
              <div style={{ fontWeight:800, fontSize:24, color:"#D4A940" }}>{s.val}</div>
              <div style={{ fontSize:11, color:"rgba(240,232,208,.45)", textTransform:"uppercase", letterSpacing:1, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
          <button className="btn-primary" onClick={() => startGame()}>Play Again</button>
          <button className="btn-secondary" onClick={() => setPage("home")}>New Puzzle</button>
        </div>
      </div>
    </div>
  );

  // ─── GAME ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"'Nunito',sans-serif", minHeight:"100vh", background:BG, color:"#F0E8D0", display:"flex", flexDirection:"column", alignItems:"center", padding:"18px 12px 24px", userSelect:"none", overflow:"hidden" }}>
      <style>{CSS}</style>

      {/* Top bar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", maxWidth:GW, marginBottom:14 }}>
        <button className="btn-secondary" style={{ padding:"8px 16px", fontSize:13 }} onClick={() => { setRunning(false); setPage("home"); }}>
          ← Home
        </button>
        <div style={{ textAlign:"center" }}>
          <span style={{ fontFamily:"'Lora',serif", fontSize:22, fontWeight:700, color:"#D4A940" }}>Puzzle Grove</span>
        </div>
        <button 
          className="btn-secondary" 
          style={{ padding:"8px 16px", fontSize:13, touchAction: "none", userSelect: "none" }}
          onPointerDown={() => setPreview(true)} 
          onPointerUp={() => setPreview(false)}
          onPointerLeave={() => setPreview(false)}
        >
          👁 Hold to Preview
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap", justifyContent:"center" }}>
        {[
          { icon:"⏱", val:fmt(secs), label:"Time" },
          { icon:"✋", val:moves, label:"Moves" },
          { icon:"🧩", val:`${locked} / 16`, label:"Placed" },
        ].map(s => (
          <div key={s.label} style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, padding:"6px 18px", display:"flex", alignItems:"center", gap:8, fontSize:15, fontWeight:700 }}>
            <span>{s.icon}</span>
            <span style={{ color:"#D4A940" }}>{s.val}</span>
            <span style={{ fontSize:11, color:"rgba(240,232,208,.38)", textTransform:"uppercase", letterSpacing:1 }}>{s.label}</span>
          </div>
        ))}
        <button className="btn-secondary" style={{ padding:"6px 16px", fontSize:13 }} onClick={() => startGame()}>
          ↺ Shuffle
        </button>
      </div>

      {/* Arena wrapper */}
      <div style={{ position:"relative", width:GW, maxWidth:"100%" }}>

        {/* Tray panel */}
        <div style={{ position:"absolute", left:0, top:0, width:TW, height:GH, border:"1.5px dashed rgba(212,169,64,.18)", borderRadius:16, background:"rgba(244,232,195,.03)", pointerEvents:"none", zIndex:0 }}>
          <span style={{ position:"absolute", bottom:12, left:"50%", transform:"translateX(-50%)", fontSize:11, color:"rgba(212,169,64,.3)", textTransform:"uppercase", letterSpacing:2, fontWeight:700, whiteSpace:"nowrap" }}>Piece Tray</span>
        </div>

        {/* Board panel */}
        <div style={{ position:"absolute", left:BX-14, top:BY-14, width:BOARD_SIZE+28, height:BOARD_SIZE+28, background:"rgba(22,42,28,.75)", border:"2px solid rgba(212,169,64,.2)", borderRadius:16, boxShadow:"inset 0 2px 24px rgba(0,0,0,.45), 0 6px 28px rgba(0,0,0,.3)", pointerEvents:"none", zIndex:0 }}>
          <span style={{ position:"absolute", top:-11, left:"50%", transform:"translateX(-50%)", background:"#162A1E", padding:"2px 12px", fontSize:11, color:"rgba(212,169,64,.4)", textTransform:"uppercase", letterSpacing:2, fontWeight:700, whiteSpace:"nowrap", border:"1px solid rgba(212,169,64,.15)", borderRadius:20 }}>Puzzle Board</span>
        </div>

        {/* Coordinate arena */}
        <div ref={arena} style={{ position:"relative", width:GW, height:GH, overflow:"visible" }}>

          {/* Ghost slots */}
          {Array.from({ length: 16 }, (_, i) => {
            const col = i % G, row = Math.floor(i / G);
            const sp = slotPos(col, row);
            const filled = pieces.some(p => p.locked && p.col === col && p.row === row);
            return (
              <div key={i} style={{ position:"absolute", left:sp.x, top:sp.y, width:PS, height:PS, border: filled ? "none" : "1.5px dashed rgba(212,169,64,.22)", borderRadius:6, background: filled ? "transparent" : "rgba(255,255,255,.015)", zIndex:1, pointerEvents:"none" }} />
            );
          })}

          {/* Pieces */}
          {pieces.map(p => {
            const isActive = draggingId === p.id;
            return (
              <div
                key={p.id}
                id={`piece-${p.id}`} // <--- ADD THIS LINE HERE
                className={`piece${p.locked ? " locked" : ""}`}
                onMouseDown={e => onDown(e, p.id, p.locked)}
onTouchStart={e => onDown(e, p.id, p.locked)}
                style={{
                  position:"absolute", left:p.x, top:p.y,
                  width:PS, height:PS,
                  backgroundImage:`url(${activeImg})`,
                  backgroundSize:`${G*PS}px ${G*PS}px`,
                  backgroundPosition:`-${p.col*PS}px -${p.row*PS}px`,
                  borderRadius: p.locked ? 6 : 9,
                  cursor: p.locked ? "default" : isActive ? "grabbing" : "grab",
                  boxShadow: p.locked ? "none" : isActive ? "0 16px 38px rgba(0,0,0,.6)" : "0 4px 16px rgba(0,0,0,.38)",
                  border: p.locked ? "none" : isActive ? "2px solid rgba(212,169,64,.6)" : "2px solid rgba(255,255,255,.3)",
                  outline: p.locked ? "1.5px solid rgba(91,140,66,.45)" : "none",
                  zIndex: p.locked ? 2 : isActive ? 200 : 12,
                  transform: isActive ? "scale(1.07) rotate(.8deg)" : "scale(1)",
                  transition: p.locked ? "transform .22s cubic-bezier(.34,1.56,.64,1)" : isActive ? "none" : "box-shadow .12s",
                  filter: p.locked ? "brightness(1.06) saturate(1.1)" : "none",
                  willChange: isActive ? "transform" : "auto",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Progress */}
      <div style={{ width:"100%", maxWidth:GW, marginTop:15 }}>
        <div style={{ height:5, background:"rgba(255,255,255,.08)", borderRadius:3, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${(locked/16)*100}%`, background:"linear-gradient(90deg,#5B8C42,#D4A940)", borderRadius:3, transition:"width .4s ease" }} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:5, fontSize:11, color:"rgba(240,232,208,.3)", fontWeight:700, textTransform:"uppercase", letterSpacing:1 }}>
          <span>Start</span>
          <span>{locked > 0 ? `${Math.round(locked/16*100)}% complete` : "Drag pieces to the board"}</span>
          <span>Finish</span>
        </div>
      </div>

      {/* Preview overlay */}
      {preview && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.72)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, backdropFilter:"blur(10px)", pointerEvents: "none" }}>
          <div style={{ textAlign:"center" }}>
            <p style={{ fontFamily:"'Lora',serif", color:"#D4A940", fontSize:16, fontStyle:"italic", marginBottom:14 }}>Target Image</p>
            <img src={activeImg} alt="preview" style={{ width:300, height:300, objectFit:"cover", borderRadius:14, border:"2.5px solid rgba(212,169,64,.5)", boxShadow:"0 24px 60px rgba(0,0,0,.65)" }} />
            <p style={{ color:"rgba(240,232,208,.35)", marginTop:12, fontSize:12 }}>Release to close</p>
          </div>
        </div>
      )}
    </div>
  );
}
