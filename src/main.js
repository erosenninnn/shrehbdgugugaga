import kaplay from "kaplay";

const k = kaplay({
  width: 960,
  height: 540,
  letterbox: true,
  background: [20, 10, 30],
  title: "🍅TOMATO LAND🍅",
  pixelArt: true,
  font: "pressstart2p",
  maxFPS: 60, // to prevent slow movement on high refresh rate monitors
  // FIX 1: Removed pixelDensity: window.devicePixelRatio
  // That option causes non-integer scaling which produces black fringe artifacts
  // on pixel art sprites (the "black lines" on Shre). Kaplay renders crisply at 1x.
});
k.loadFont("pressstart2p", "/fonts/PressStart2P-Regular.ttf");
// ─── PIXEL-ART CONSTANTS ──────────────────────────────────────────────────────
const SPRITE_SCALE = 3;
const BOAT_SCALE   = 2;
const SHRE_BOAT_OFFSET = k.vec2(0, -52);

function snapPixelPos(obj) {
  obj.pos.x = Math.round(obj.pos.x);
  obj.pos.y = Math.round(obj.pos.y);
}


//sounds
k.loadSound("bgm_main", "sounds/bgm_main.ogg");
k.loadSound("bgm_cake", "sounds/bgm_cake.ogg");
k.loadSound("pond_music", "sounds/pond_music.ogg");
k.loadSound("quiz_music", "sounds/quiz_music.ogg");
k.loadSound("level2_music", "sounds/level2_music.ogg");
k.loadSound("level3_music", "sounds/level3_music.ogg");
k.loadSound("jump", "sounds/jump.wav");
k.loadSound("collect", "sounds/collect.wav");
k.loadSound("hurt", "sounds/hurt.wav");
k.loadSound("correct", "sounds/correct.wav");
k.loadSound("wrong", "sounds/wrong.wav");
k.loadSound("dialogue", "sounds/dialogue.wav");
k.loadSound("level_clear", "sounds/level_clear.wav");
k.loadSound("jumpscare_sfx", "sounds/jumpscare.wav");
k.loadSound("candle", "sounds/candle.wav");
k.loadSound("confetti", "sounds/confetti.wav");
k.loadSound("select", "sounds/select.wav");
k.loadSound("boat", "sounds/boat.wav");

let bgMusic = null;
let pondMusic = null;
let quizMusic = null;
let level2Music = null;
let level3Music = null;

function playSfx(name, volume = 0.5) {
  return k.play(name, { volume });
}

function stopPondMusic() {
  if (pondMusic) {
    pondMusic.stop();
    pondMusic = null;
  }
}

function stopQuizMusic() {
  if (quizMusic) {
    quizMusic.stop();
    quizMusic = null;
  }
}

function stopLevel2Music() {
  if (level2Music) {
    level2Music.stop();
    level2Music = null;
  }
}

function stopLevel3Music() {
  if (level3Music) {
    level3Music.stop();
    level3Music = null;
  }
}

function playTimedSfx(name, timer, interval, volume = 0.35) {
  if (timer <= 0) {
    playSfx(name, volume);
    return interval;
  }
  return timer;
}








// ─── SPRITE LOADING ───────────────────────────────────────────────────────────
k.loadSprite("sunflower_bg", "sprites/sunflowabg.png");
k.loadSprite("pondbackground", "sprites/pondbackground.png");
k.loadSprite("level1_bg", "sprites/level1bg.png");
k.loadSprite("level2_bg", "sprites/level2bg.png");
k.loadSprite("level3_bg", "sprites/level3bg.png");
k.loadSprite("cake_bg", "sprites/cake_bg.png");
function addBackground() {
  k.add([
    k.sprite("cake_bg", { width: k.width(), height: k.height() }),
    k.pos(0, 0),
    k.z(0)
  ]);
}
k.loadSprite("kuromi", "sprites/kuromi.png", {
  sliceX: 3, sliceY: 1,
  anims: {
    wave: { from: 0, to: 0, loop: true, speed: 6 },
    idle: { from: 1, to: 1, loop: true, speed: 6 },
    walk: { from: 2, to: 2, loop: true, speed: 8 },
  },
});
k.loadSprite("shre", "sprites/shre.png", {
  sliceX: 4, sliceY: 1,
  anims: {
    idle:  { from: 0, to: 0, loop: true,  speed: 4 },
    walkR: { from: 1, to: 1, loop: true,  speed: 8 },
    walkL: { from: 2, to: 2, loop: true,  speed: 8 },
    jump:  { from: 3, to: 3, loop: false, speed: 6 },
  },
});
k.loadSprite("simba", "sprites/simba.png", {
  sliceX: 2, sliceY: 1,
  anims: {
    idle: { from: 0, to: 0, loop: true, speed: 4 },
    walk: { from: 1, to: 1, loop: true, speed: 8 },
  },
});
k.loadSprite("duckboat", "sprites/duckboat.png", {
  sliceX: 1, sliceY: 1,
  anims: { float: { from: 0, to: 0, loop: true, speed: 4 } },
});

k.loadSprite("cake", "sprites/cake.png", {
  sliceX: 2, sliceY: 1,
  anims: {
    lit:   { from: 0, to: 0, loop: true, speed: 6 },
    blown: { from: 1, to: 1, loop: true, speed: 4 },
  },
});
// ─── SPRITE LOADING ───────────────────────────────────────────────────────────
k.loadSprite("flag", "sprites/flagnew.png"); // Make sure the name matches exactly!
k.loadSprite("jumpscare", "sprites/jumpscare.jpeg", { filter: "linear" });
k.loadSprite("level1cleared", "sprites/level1cleared.jpeg", { filter: "linear" });
k.loadSprite("prank", "sprites/prank.jpeg", { filter: "linear" });
["memory1","memory2","memory3","memory4","memory5","memory6","memory7","memory8","memory9","memory10","memory11"]
  .forEach(name => k.loadSprite(name, `sprites/${name}.jpeg`, { filter: "linear" }));
// ─── SHARED STATE ─────────────────────────────────────────────────────────────
let completedLevels = [false, false, false];
let jumpscareFrom   = "pondlevel1";

// ─── UTILITIES ────────────────────────────────────────────────────────────────
function showDialogue(lines, onDone) {
  let idx = 0;
  let charIdx = 0;
  let typeTimer = 0;
  let isTyping = true;

  function getSpeakerSprite(line) {
    const speaker = line.split(":")[0]?.trim().toLowerCase();
    if (speaker === "kuromi" || speaker === "simba") return speaker;
    return null;
  }

  // Made the box slightly taller and wider
  const box = k.add([
    k.rect(760, 130), k.pos(k.width()/2, k.height()-80),
    k.anchor("center"), k.color(20,10,30),
    k.outline(3, k.rgb(255,182,213)),
    k.fixed(), k.z(150), k.opacity(0.95),
  ]);

  const portraitBg = k.add([
    k.rect(80, 80, { radius: 8 }),
    k.pos(k.width()/2 - 320, k.height()-80),
    k.anchor("center"), k.color(40,20,60),
    k.outline(2, k.rgb(180,140,200)),
    k.fixed(), k.z(151)
  ]);
  const portrait = k.add([
    k.sprite(getSpeakerSprite(lines[idx]) ?? "kuromi", { anim: "idle" }),
    k.pos(k.width()/2 - 320, k.height()-80),
    k.anchor("center"), k.scale(2.5),
    k.fixed(), k.z(152)
  ]);
  portrait.hidden = !getSpeakerSprite(lines[idx]);

  function updatePortrait() {
    const speakerSprite = getSpeakerSprite(lines[idx]);
    if (!speakerSprite) {
      portrait.hidden = true;
      return;
    }

    portrait.hidden = false;
    portrait.use(k.sprite(speakerSprite, { anim: "idle" }));
  }

  const txt = k.add([
    // ✨ ADDED lineSpacing: 6 so the chunky text doesn't overlap
    k.text("", { size: 10, width: 540, lineSpacing: 6 }), 
    k.pos(k.width()/2 + 10, k.height()-80),
    k.anchor("center"), k.color(255,182,213),
    k.fixed(), k.z(151),
  ]);

  const hint = k.add([
    k.text("SPACE to continue", { size: 8 }),
    // ✨ Anchored firmly to the bottom right of the box so it NEVER falls out
    k.pos(k.width()/2 + 350, k.height()-30), 
    k.anchor("right"), k.color(160,140,180),
    k.fixed(), k.z(151),
  ]);

  const typeUpdate = k.onUpdate(() => {
    if (!isTyping) return;
    typeTimer += k.dt();
    if (typeTimer > 0.03) { 
      typeTimer = 0;
      charIdx++;
      txt.text = lines[idx].substring(0, charIdx);
      if (charIdx >= lines[idx].length) isTyping = false;
    }
  });

  const advance = k.onKeyPress("space", () => {
    playSfx("dialogue", 0.22);
    if (isTyping) {
      isTyping = false;
      txt.text = lines[idx];
    } else {
      idx++;
      if (idx >= lines.length) {
        advance.cancel(); typeUpdate.cancel();
        box.destroy(); txt.destroy(); hint.destroy();
        portraitBg.destroy(); portrait.destroy();
        onDone();
      } else {
        charIdx = 0;
        isTyping = true;
        txt.text = "";
        updatePortrait();
      }
    }
  });
}

// ─── SCENE: LOADING ──────────────────────────────────────────────────────────
k.scene("loading", () => {
  k.setGravity(0);
  k.setBackground(20, 10, 30);
  k.add([k.text("🍅 TOMATO LAND 🍅", { size: 32 }), k.pos(k.width()/2, k.height()/2-40), k.anchor("center"), k.color(255,182,213)]);
  k.add([k.rect(400, 16, { radius: 8 }), k.pos(k.width()/2, k.height()/2+50), k.anchor("center"), k.color(50,30,60)]);
  const bar = k.add([k.rect(0, 16, { radius: 8 }), k.pos(k.width()/2-200, k.height()/2+42), k.color(255,182,213)]);
  k.add([k.text("loading...", { size: 10 }), k.pos(k.width()/2, k.height()/2+80), k.anchor("center"), k.color(160,140,200)]);
  let elapsed = 0, gone = false;
  k.onUpdate(() => {
    elapsed += k.dt();
    bar.width = Math.min((elapsed/2.5)*400, 400);
    if (elapsed >= 2.5 && !gone) { gone = true; k.go("grassland"); }
  });
});

// ─── SCENE: GRASSLAND ────────────────────────────────────────────────────────
//k.play("bgm_main", { loop: true, volume: 0.4 });
k.scene("grassland", () => {
  k.setGravity(0);
  // 2. Play the music right as this scene loads!
  if (!bgMusic) {
    bgMusic = k.play("bgm_main", { loop: true, volume: 0.4 });
  }

  k.add([
    k.sprite("sunflower_bg", { width: k.width(), height: k.height() }),
    k.pos(0, 0), k.z(0),
  ]);
  k.add([k.sprite("shre", { anim: "idle" }), k.pos(200, k.height()-133), k.anchor("bot"), k.scale(SPRITE_SCALE), k.z(10)]);
  k.add([k.text("🍅 TOMATO LAND 🍅", { size: 24 }), k.pos(k.width()/2, 60), k.anchor("center"), k.color(255,182,213), k.z(10)]);
  k.add([k.text("Press any key to begin ✨", { size: 12 }), k.pos(k.width()/2, k.height()-150), k.anchor("center"), k.color(255,240,255), k.z(10)]);
  const go = () => { playSfx("select", 0.35); k.go("greeting"); };
  k.onKeyPress(go);
  k.onClick(go);
  k.onGamepadButtonPress(go);
});

// ─── SCENE: GREETING ─────────────────────────────────────────────────────────

k.scene("greeting", () => {
  k.setGravity(0);

  k.add([
    k.sprite("sunflower_bg", { width: k.width(), height: k.height() }),
    k.pos(0, 0), k.z(0),
  ]);

  const groundY = k.height() - 133;

  const shre = k.add([
    k.sprite("shre", { anim: "idle" }),
    k.pos(180, groundY),
    k.anchor("bot"), k.scale(SPRITE_SCALE), k.z(10),
  ]);
  const shreLabel = k.add([
    k.text("Shre", { size: 6 }),
    k.pos(180, groundY - 58),
    k.anchor("center"), k.color(255,182,213), k.z(12),
  ]);

  const kuromi = k.add([
    k.sprite("kuromi", { anim: "walk" }),
    k.pos(k.width() + 60, groundY),
    k.anchor("bot"), k.scale(SPRITE_SCALE), k.z(10),
  ]);
  kuromi.flipX = true;
  const kLabel = k.add([
    k.text("Kuromi", { size: 6 }),
    k.pos(0, 0), k.anchor("center"), k.color(200,180,255), k.z(12),
  ]);

  const simba = k.add([
    k.sprite("simba", { anim: "walk" }),
    k.pos(k.width() + 220, groundY),
    k.anchor("bot"), k.scale(SPRITE_SCALE), k.z(10),
  ]);
  simba.flipX = true;
  const sLabel = k.add([
    k.text("Simba", { size: 6 }),
    k.pos(0, 0), k.anchor("center"), k.color(210,170,100), k.z(12),
  ]);

  let phase = 0;
  let dialogueStarted = false;
  let shreAnim = "idle";
  const WALK_SPEED  = 130;
  const SHRE_SPEED  = 180;
  const KUROMI_TARGET = 580;
  const SIMBA_TARGET  = 700;

  function setShreAnim(a) {
    if (shreAnim !== a) { shreAnim = a; shre.play(a); }
  }

  k.onUpdate(() => {
    shreLabel.pos = k.vec2(shre.pos.x, shre.pos.y - 58);
    kLabel.pos    = k.vec2(kuromi.pos.x, kuromi.pos.y - 58);
    sLabel.pos    = k.vec2(simba.pos.x,  simba.pos.y  - 58);

    if (phase === 0) {
      kuromi.pos.x -= WALK_SPEED * k.dt();
      snapPixelPos(kuromi);
      if (kuromi.pos.x <= KUROMI_TARGET) {
        kuromi.pos.x = KUROMI_TARGET;
        kuromi.play("idle");
        kuromi.flipX = false;
        phase = 1;
      }
    }

    else if (phase === 1) {
      simba.pos.x -= WALK_SPEED * k.dt();
      snapPixelPos(simba);
      if (simba.pos.x <= SIMBA_TARGET) {
        simba.pos.x = SIMBA_TARGET;
        simba.play("idle");
        simba.flipX = false;
        phase = 2;
        if (!dialogueStarted) {
          dialogueStarted = true;
          kuromi.play("wave");
          showDialogue([
            "Kuromi: Shre!! We've been waiting for you 🖤",
            "Kuromi: Come on — the pond is this way! 🎀",
            "Simba: *wags tail excitedly*",
          ], () => {
            kuromi.play("walk");
            kuromi.flipX = false;
            simba.play("walk");
            simba.flipX = false;
            phase = 3;
          });
        }
      }
    }

    else if (phase === 3) {
      kuromi.pos.x += WALK_SPEED * k.dt();
      simba.pos.x  += WALK_SPEED * k.dt();
      snapPixelPos(kuromi);
      snapPixelPos(simba);

      const left  = k.isKeyDown("left")  || k.isKeyDown("a");
      const right = k.isKeyDown("right") || k.isKeyDown("d");
      if (left && shre.pos.x > 0) {
        shre.pos.x -= SHRE_SPEED * k.dt();
        shre.flipX = true;
        setShreAnim("walkL");
      } else if (right) {
        shre.pos.x += SHRE_SPEED * k.dt();
        shre.flipX = false;
        setShreAnim("walkR");
      } else {
        setShreAnim("idle");
      }
      snapPixelPos(shre);

      if (shre.pos.x > k.width() + 20) {
        playSfx("select", 0.3);
        k.go("pond");
      }
    }
  });
});

// ─── SCENE: POND OVERWORLD ────────────────────────────────────────────────────
//k.stop("bgm_main");
k.scene("pond", () => {
  k.setGravity(0);
  // 3. Properly stop the music when entering the pond
  if (bgMusic) {
    bgMusic.stop();
    bgMusic = null;
  }
  stopQuizMusic();
  stopLevel2Music();
  stopLevel3Music();
  if (!pondMusic) {
    pondMusic = k.play("pond_music", { loop: true, volume: 0.3 });
  }

  // FIX 3: If all 3 levels are done, skip the pond entirely → go to reunion
  if (completedLevels.every(v => v)) {
    stopPondMusic();
    k.go("reunion",{ startBoatX: k.width() - 300 });//If you want it even closer, use k.width() - 350 or k.width() - 300
    return;
  }

  const WATER_Y      = k.height() - 200;
  const BANK_Y       = k.height() - 200;
  const BOAT_Y_BASE  = k.height() - 130;
  const BOAT_SPEED   = 100;
  const CROSS_SPEED  = 110;
  const RETURN_SPEED = 150;
  const WALK_SPEED   = 130;
  const LEFT_DOCK_X  = 195;
  const RIGHT_DOCK_X = k.width() - 195;
  const LEFT_NPC_X   = 90;
  const RIGHT_NPC_X  = k.width() - 130;
  const flagXs       = [320, 480, 640];
  

  k.add([
    k.sprite("pondbackground", { width: k.width(), height: k.height() }),
    k.pos(0, 0),
    k.z(0)
  ]);

  const flagData = [
    { x: flagXs[0], levelIdx: 0, color: k.rgb(255,182,213), label: "1" },
    { x: flagXs[1], levelIdx: 1, color: k.rgb(200,180,255), label: "2" },
    { x: flagXs[2], levelIdx: 2, color: k.rgb(255,220,150), label: "3" },
  ];
  let flagsBuilt = false;

  function buildFlags() {
    if (flagsBuilt) return;
    flagsBuilt = true;
    
    flagData.forEach(({ x, label }) => {
      // Add the new pixel art flag sprite
      k.add([
        k.sprite("flag"),
        k.pos(x, WATER_Y + 8), // Plants the flag right on the water/ground line [cite: 55]
        k.anchor("bot"),       // Anchoring at the bottom makes it easy to plant [cite: 55]
        k.scale(3),            // Scale it up so it matches the chunky pixel art style [cite: 55]
        k.z(5)
      ]);

      // Keep the "Level 1", "Level 2" text underneath so players know where to go
      k.add([
        k.text(`Level ${label}`, { size: 6 }), 
        k.pos(x, WATER_Y + 25), // Pushed down slightly to sit under your new sprite
        k.anchor("center"), 
        k.color(220, 245, 255), 
        k.opacity(0.9), 
        k.z(5)
      ]);
    });
  }

  // ── NPCs ──────────────────────────────────────────────────────────────────
  const kuromi = k.add([k.sprite("kuromi",{anim:"idle"}), k.pos(LEFT_NPC_X,BANK_Y),      k.anchor("bot"), k.scale(SPRITE_SCALE), k.z(5)]);
  // FIX 2: Labels are separate objects whose positions we manage manually.
  // We now also sync their .hidden to the NPC's .hidden so they vanish during crossing.
  const kLabel = k.add([k.text("Kuromi",{size: 8}), k.pos(LEFT_NPC_X,BANK_Y-58),         k.anchor("center"), k.color(200,180,255), k.z(6)]);
  const simba  = k.add([k.sprite("simba", {anim:"idle"}), k.pos(LEFT_NPC_X+100,BANK_Y),  k.anchor("bot"), k.scale(SPRITE_SCALE), k.z(5)]);
  const sLabel = k.add([k.text("Simba",{size: 8}), k.pos(LEFT_NPC_X+100,BANK_Y-58),      k.anchor("center"), k.color(210,170,100), k.z(6)]);

  const shre = k.add([k.sprite("shre",{anim:"idle"}), k.pos(55,BANK_Y), k.anchor("bot"), k.scale(SPRITE_SCALE), k.z(8)]);

  const boat = k.add([k.sprite("duckboat",{anim:"float"}), k.pos(LEFT_DOCK_X,BOAT_Y_BASE), k.anchor("bot"), k.scale(BOAT_SCALE), k.z(6)]);

  const rider = k.add([k.sprite("kuromi",{anim:"idle"}), k.pos(-999,-999), k.anchor("bot"), k.scale(SPRITE_SCALE), k.z(7)]);
  rider.hidden = true;

  const hintLabel = k.add([
    k.text("← → to sail  |  reach a flag to enter the level", {size: 8}),
    k.pos(k.width()/2,20), k.anchor("center"), k.color(60,40,90), k.fixed(), k.z(20), k.opacity(0),
  ]);

  function bobY() { return BOAT_Y_BASE + Math.sin(k.time() * 2.2) * 3; }

  function placeRiderOnBoat() {
    rider.hidden = false;
    rider.pos = k.vec2(boat.pos.x + SHRE_BOAT_OFFSET.x, boat.pos.y + SHRE_BOAT_OFFSET.y);
  }

  const DOCK_X = 175;
  const returningFromLevel = completedLevels.some(v => v);

  if (returningFromLevel) {
    kuromi.pos = k.vec2(RIGHT_NPC_X, BANK_Y);
    kuromi.play("wave"); kuromi.flipX = true;
    // FIX 2: sync label to NPC position when repositioning
    kLabel.pos = k.vec2(RIGHT_NPC_X, BANK_Y - 58);
    simba.pos  = k.vec2(RIGHT_NPC_X + 90, BANK_Y);
    simba.play("idle"); simba.flipX = true;
    sLabel.pos = k.vec2(RIGHT_NPC_X + 90, BANK_Y - 58);
    shre.hidden = true;
    rider.use(k.sprite("shre", { anim: "idle" }));
    rider.hidden = false;

    // FIX 3: startX — place boat just before the NEXT incomplete level's flag.
    // Find the last completed level and start just past it, but cap so we
    // don't start past the last flag (which would prevent any flag trigger).
    let nextIncompleteIdx = completedLevels.findIndex(v => !v);
    // nextIncompleteIdx will be 0,1,2 or -1 (all done, handled above by early return)
    let startX = nextIncompleteIdx === 0
      ? LEFT_DOCK_X                        // no levels done yet
      : flagXs[nextIncompleteIdx - 1] + 50; // just past the last completed flag

    boat.pos.x = startX;
    buildFlags();
    hintLabel.opacity = 1;
  }

  let iPhase  = returningFromLevel ? 8 : 0;
  let iTimer  = 0;
  let boatSfxTimer = 0;
  let scriptedBoatSfxTimer = 0;

  let playerMode  = returningFromLevel;
  let shreAnim    = "idle";
  function setShreAnim(a) { if (shreAnim !== a) { shreAnim = a; rider.play(a); } }

  k.onUpdate(() => {
    // FIX 2: Only update label position when NPC is visible; hide label when NPC is hidden
    if (!kuromi.hidden) {
      kLabel.hidden = false;
      kLabel.pos = k.vec2(kuromi.pos.x, kuromi.pos.y - 58);
    } else {
      kLabel.hidden = true;
    }
    if (!simba.hidden) {
      sLabel.hidden = false;
      sLabel.pos = k.vec2(simba.pos.x,  simba.pos.y  - 58);
    } else {
      sLabel.hidden = true;
    }

    // Always bob the boat
    if (!playerMode) {
      boat.pos.y = bobY();
      if (!rider.hidden) {
        rider.pos = k.vec2(boat.pos.x + SHRE_BOAT_OFFSET.x, boat.pos.y + SHRE_BOAT_OFFSET.y);
      }
    }

    if (!playerMode) {
      scriptedBoatSfxTimer -= k.dt();
      iTimer += k.dt();

      if (iPhase === 0 && iTimer > 0.6) {
        kuromi.play("walk");
        kuromi.flipX = false;
        iPhase = 1; iTimer = 0;
      }

      else if (iPhase === 1) {
        kuromi.pos.x -= WALK_SPEED * k.dt();
        snapPixelPos(kuromi);
        if (kuromi.pos.x <= DOCK_X) {
          kuromi.pos.x = DOCK_X;
          kuromi.play("idle");
          kuromi.hidden = true;          // boards — label hides automatically via onUpdate
          rider.use(k.sprite("kuromi", { anim: "idle" }));
          placeRiderOnBoat();
          iPhase = 2; iTimer = 0;
        }
      }

      else if (iPhase === 2) {
        boat.pos.x += CROSS_SPEED * k.dt();
        scriptedBoatSfxTimer = playTimedSfx("boat", scriptedBoatSfxTimer, 0.45, 0.18);
        snapPixelPos(boat);
        if (boat.pos.x >= RIGHT_DOCK_X) {
          boat.pos.x = RIGHT_DOCK_X;
          rider.hidden = true;
          kuromi.pos = k.vec2(RIGHT_NPC_X, BANK_Y);
          kuromi.hidden = false;         // label shows automatically via onUpdate
          kuromi.play("wave");
          kuromi.flipX = true;
          iPhase = 3; iTimer = 0;
        }
      }

      else if (iPhase === 3) {
        boat.pos.x -= RETURN_SPEED * k.dt();
        scriptedBoatSfxTimer = playTimedSfx("boat", scriptedBoatSfxTimer, 0.45, 0.18);
        snapPixelPos(boat);
        if (boat.pos.x <= LEFT_DOCK_X) {
          boat.pos.x = LEFT_DOCK_X;
          simba.play("walk");
          simba.flipX = false;
          iPhase = 4; iTimer = 0;
        }
      }

      else if (iPhase === 4) {
        simba.pos.x -= WALK_SPEED * k.dt();
        snapPixelPos(simba);
        if (simba.pos.x <= DOCK_X) {
          simba.pos.x = DOCK_X;
          simba.play("idle");
          simba.hidden = true;           // boards — label hides automatically
          rider.use(k.sprite("simba", { anim: "idle" }));
          placeRiderOnBoat();
          iPhase = 5; iTimer = 0;
        }
      }

      else if (iPhase === 5) {
        boat.pos.x += CROSS_SPEED * k.dt();
        scriptedBoatSfxTimer = playTimedSfx("boat", scriptedBoatSfxTimer, 0.45, 0.18);
        snapPixelPos(boat);
        if (boat.pos.x >= RIGHT_DOCK_X) {
          boat.pos.x = RIGHT_DOCK_X;
          rider.hidden = true;
          simba.pos = k.vec2(RIGHT_NPC_X + 90, BANK_Y);
          simba.hidden = false;          // label shows automatically
          simba.play("idle");
          simba.flipX = true;
          iPhase = 6; iTimer = 0;
        }
      }

      else if (iPhase === 6) {
        boat.pos.x -= RETURN_SPEED * k.dt();
        scriptedBoatSfxTimer = playTimedSfx("boat", scriptedBoatSfxTimer, 0.45, 0.18);
        snapPixelPos(boat);
        if (boat.pos.x <= LEFT_DOCK_X) {
          boat.pos.x = LEFT_DOCK_X;
          iPhase = 7; iTimer = 0;
          showDialogue([
            "Kuromi: Your turn, Shre! The pond has a few surprises 🎀",
            "Kuromi: Sail to each flag to play — we'll be cheering! 🖤",
          ], () => {
            buildFlags();
            hintLabel.opacity = 1;
            shre.hidden = true;
            rider.use(k.sprite("shre", { anim: "idle" }));
            rider.hidden = false;
            // Start boat at correct position for current progress
            let nextIdx = completedLevels.findIndex(v => !v);
            boat.pos.x = nextIdx <= 0 ? LEFT_DOCK_X : flagXs[nextIdx - 1] + 50;
            playerMode = true;
            iPhase = 8;
          });
        }
      }
    }

    // ── Player mode ───────────────────────────────────────────────────────
    else {
      boatSfxTimer -= k.dt();
      const left  = k.isKeyDown("left")  || k.isKeyDown("a");
      const right = k.isKeyDown("right") || k.isKeyDown("d");

      if (left && boat.pos.x > 200) {
        boat.pos.x -= BOAT_SPEED * k.dt();
        rider.flipX = true;
        setShreAnim("walkL");
        boatSfxTimer = playTimedSfx("boat", boatSfxTimer, 0.45, 0.18);
      } else if (right && boat.pos.x < k.width()-200) {
        boat.pos.x += BOAT_SPEED * k.dt();
        rider.flipX = false;
        setShreAnim("walkR");
        boatSfxTimer = playTimedSfx("boat", boatSfxTimer, 0.45, 0.18);
      } else {
        setShreAnim("idle");
      }

      boat.pos.y = bobY();
      rider.pos  = k.vec2(boat.pos.x + SHRE_BOAT_OFFSET.x, boat.pos.y + SHRE_BOAT_OFFSET.y);
      snapPixelPos(boat);
      snapPixelPos(rider);

      // FIX 3: Only trigger flags that haven't been completed yet
      flagData.forEach(({ x, levelIdx }) => {
        if (!completedLevels[levelIdx] && Math.abs(boat.pos.x - x) < 36) {
          playSfx("select", 0.35);
          k.go(`pondlevel${levelIdx + 1}`);
        }
      });
    }
  });
});

// ─── SCENE: POND LEVEL 1 — TRIVIA ────────────────────────────────────────────
// ─── SCENE: POND LEVEL 1 — TRIVIA ────────────────────────────────────────────
k.scene("pondlevel1", () => {
  k.setGravity(0);
  stopPondMusic();
  if (bgMusic) {
    bgMusic.stop();
    bgMusic = null; // Clear it out
  }
  if (!quizMusic) {
    quizMusic = k.play("quiz_music", { loop: true, volume: 0.28 });
  }
  
  // 1. ADD YOUR NEW BACKGROUND AT THE BOTTOM LAYER
  k.add([
    k.sprite("level1_bg", { width: k.width(), height: k.height() }),
    k.pos(0, 0),
    k.z(0) 
  ]);

  // (Notice that k.setBackground, k.rect for the ground, and the star loops 
  // have all been completely DELETED from here!)

  // 2. YOUR EXISTING CHARACTERS GO HERE (Notice z is 3 and 4, so they sit on top)
  k.add([k.sprite("kuromi", { anim: "wave" }), k.pos(60, k.height()-90), k.anchor("bot"), k.scale(3), k.z(3)]);
  k.add([k.text("Kuromi",{size: 6}), k.pos(60, k.height()-148), k.anchor("center"), k.color(200,180,255), k.z(4)]);
  k.add([k.sprite("simba", { anim: "idle" }), k.pos(k.width()-60, k.height()-90), k.anchor("bot"), k.scale(3), k.z(3)]);
  k.add([k.text("Simba",{size: 6}), k.pos(k.width()-60, k.height()-148), k.anchor("center"), k.color(210,170,100), k.z(4)]);

  // ... the rest of your trivia questions code continues normally below this!

  const questions = [
    {
      q: "Who is the GOAT?",
      options: ["A. SHRE", "B. GUGLOODON", "C. TOMATO", "D. ALL OF THE ABOVE"],
      correct: 3,
      wrongLines: ["Kuromi: girl you sure about that...?? xp", "Simba: *bark (bruh) bark*", "Kuromi: So close… but not quite 🖤"],
      rightLine: "Kuromi: OBVIOUSLY. All of the above!! 🖤🩷",
    },
    {
      q: "Shreya Prasad is the CEO of?",
      options: ["A. Vakil Prasad and Sons", "B. SHRENOYO PVT. LMTD.", "C. Patra Electronics", "D. CEO of SEX"],
      correct: 2,
      wrongLines: ["Simba: *shakes head slowly*", "Kuromi: That's not it bestie 😭", "Kuromi: LMAOOO no 💀"],
      rightLine: "Kuromi: THE CEO OF PATRA ELECTRONICS 🎉",
    },
    {
      q: "Shre loves many things,\nbut what does she love MOST?",
      options: ["A. Fish", "B. Porn", "C. Girls", "D. poopchamp?"],
      correct: 3,
      wrongLines: ["Simba: *tilts head*", "Kuromi: Hmmmm. Try again 👀", "Kuromi: Are you Shre? Because Shre would know 😭"],
      rightLine: "Kuromi: POOPCHAMP!!! Obviously!! 🩷🩷",
    },
  ];

  let currentQ = 0, lives = 3, answered = false;
  const heartsLabel = k.add([k.text("", {size: 12}), k.pos(k.width()/2, 28), k.anchor("center"), k.color(255,100,150), k.fixed(), k.z(30)]);
  function updateHearts() { heartsLabel.text = "🩷".repeat(lives) + "🖤".repeat(3-lives); }
  updateHearts();

  k.add([k.rect(760,90,{radius:10}), k.pos(k.width()/2,95), k.anchor("center"), k.color(20,12,40), k.outline(2,k.rgb(200,170,255)), k.fixed(), k.z(10)]);
  const qText = k.add([k.text("", {size: 12, width:700, align:"center"}), k.pos(k.width()/2,95), k.anchor("center"), k.color(255,240,255), k.fixed(), k.z(11)]);

  const BTN_W = 340, BTN_H = 52, GAP = 16;
  const BTN_POS = [
    k.vec2(k.width()/2 - BTN_W - GAP/2, 230),
    k.vec2(k.width()/2 + GAP/2,          230),
    k.vec2(k.width()/2 - BTN_W - GAP/2,  298),
    k.vec2(k.width()/2 + GAP/2,           298),
  ];
  const BASE_COLORS = [k.rgb(80,50,120),k.rgb(80,50,120),k.rgb(80,50,120),k.rgb(80,50,120)];
  const LBL_COLORS  = [k.rgb(255,182,213),k.rgb(200,180,255),k.rgb(180,240,200),k.rgb(255,220,150)];
  const btnRects = [], btnLabels = [];
  for (let i = 0; i < 4; i++) {
    btnRects.push(k.add([k.rect(BTN_W,BTN_H,{radius:8}), k.pos(BTN_POS[i].x, BTN_POS[i].y), k.color(BASE_COLORS[i]), k.outline(2,k.rgb(120,90,160)), k.area(), k.fixed(), k.z(10)]));
    btnLabels.push(k.add([k.text("", {size:15, width:BTN_W-20}), k.pos(BTN_POS[i].x+BTN_W/2, BTN_POS[i].y+BTN_H/2), k.anchor("center"), k.color(LBL_COLORS[i]), k.fixed(), k.z(11)]));
  }
  const feedbackText = k.add([k.text("", {size: 10, width:680, align:"center"}), k.pos(k.width()/2,380), k.anchor("center"), k.color(255,200,220), k.fixed(), k.z(12)]);
  const continueHint = k.add([k.text("", {size: 8}), k.pos(k.width()/2,430), k.anchor("center"), k.color(160,140,200), k.fixed(), k.z(12)]);

  function loadQuestion(idx) {
    answered = false;
    const q = questions[idx];
    qText.text = `Q${idx+1}: ${q.q}`;
    feedbackText.text = ""; continueHint.text = "";
    for (let i = 0; i < 4; i++) { btnLabels[i].text = q.options[i]; btnRects[i].color = BASE_COLORS[i]; }
  }
  function flashScreen(color, duration) {
    const flash = k.add([k.rect(k.width(),k.height()), k.pos(0,0), k.color(color), k.opacity(0.85), k.fixed(), k.z(500)]);
    k.wait(duration, () => flash.destroy());
  }
  function handleAnswer(idx) {
    if (answered) return;
    answered = true;
    const q = questions[currentQ];
    if (idx === q.correct) {
      playSfx("correct", 0.45);
      btnRects[idx].color = k.rgb(60,180,100);
      flashScreen(k.rgb(60,200,80), 0.15);
      feedbackText.text = q.rightLine;
      continueHint.text = "— SPACE to continue —";
      const next = k.onKeyPress("space", () => {
        playSfx("select", 0.25);
        next.cancel();
        currentQ++;
        if (currentQ >= questions.length) { stopQuizMusic(); k.go("level1cleared"); }
        else { loadQuestion(currentQ); }
      });
    } else {
      playSfx("wrong", 0.45);
      btnRects[idx].color = k.rgb(200,60,60);
      flashScreen(k.rgb(220,40,40), 0.15);
      lives--;
      updateHearts();
      feedbackText.text = q.wrongLines[Math.min(3-lives, q.wrongLines.length-1)];
      if (lives <= 0) {
        jumpscareFrom = "pondlevel1";
        k.wait(1.0, () => { stopQuizMusic(); k.go("jumpscare"); });
      } else {
        continueHint.text = "— try again! —";
        k.wait(1.2, () => { answered = false; feedbackText.text = ""; continueHint.text = ""; btnRects[idx].color = BASE_COLORS[idx]; });
      }
    }
  }
  for (let i = 0; i < 4; i++) { const idx=i; btnRects[i].onClick(() => handleAnswer(idx)); }
  k.onKeyPress("a", () => handleAnswer(0));
  k.onKeyPress("b", () => handleAnswer(1));
  k.onKeyPress("c", () => handleAnswer(2));
  k.onKeyPress("d", () => handleAnswer(3));
  loadQuestion(0);
});

// ─── SCENE: JUMPSCARE ─────────────────────────────────────────────────────────
k.scene("jumpscare", () => {
  k.setGravity(0);
  playSfx("jumpscare_sfx", 0.65);
  
  k.setBackground(255, 255, 255);
  k.add([k.sprite("jumpscare"), k.pos(k.width()/2, k.height()/2), k.anchor("center"), k.scale(k.height()/1280*1.1), k.z(10)]);
  k.add([k.rect(k.width(),k.height()), k.pos(0,0), k.color(255,50,50), k.opacity(0.22), k.z(9)]);
  k.add([k.text("SON IM CRINE LMFAO", {size: 48}), k.pos(k.width()/2, k.height()/2-140), k.anchor("center"), k.color(255,30,30), k.fixed(), k.z(20)]);
  k.camPos(k.width()/2, k.height()/2);
  let shakeT = 0;
  k.onUpdate(() => {
    shakeT += k.dt();
    if (shakeT < 0.8) k.camPos(k.width()/2 + Math.sin(shakeT*55)*8, k.height()/2 + Math.cos(shakeT*47)*6);
    else k.camPos(k.width()/2, k.height()/2);
  });
  k.wait(1.2, () => {
    k.add([k.text("YOU GOT TS GIRL 🩷", {size: 20}), k.pos(k.width()/2, k.height()-100), k.anchor("center"), k.color(255,182,213), k.fixed(), k.z(25)]);
    k.add([k.text("press SPACE", {size: 10}), k.pos(k.width()/2, k.height()-65), k.anchor("center"), k.color(200,180,255), k.fixed(), k.z(25)]);
    k.onKeyPress("space", () => { playSfx("select", 0.25); k.camPos(k.width()/2, k.height()/2); k.go(jumpscareFrom); });
    k.onClick(()         => { playSfx("select", 0.25); k.camPos(k.width()/2, k.height()/2); k.go(jumpscareFrom); });
  });
});

// ─── SCENE: LEVEL 1 CLEARED ───────────────────────────────────────────────────
k.scene("level1cleared", () => {
  k.setGravity(0);
  playSfx("level_clear", 0.45);
  playSfx("confetti", 0.22);
  k.setBackground(10, 5, 25);
  k.add([k.sprite("level1cleared"), k.pos(k.width()/2, k.height()/2), k.anchor("center"), k.scale(k.width()/1280), k.z(1)]);
  k.add([k.rect(k.width(),k.height()), k.pos(0,0), k.color(0,0,0), k.opacity(0.35), k.fixed(), k.z(2)]);
  const COLORS = [k.rgb(255,182,213),k.rgb(200,180,255),k.rgb(255,220,100),k.rgb(150,230,200)];
  const pieces = [];
  for (let i = 0; i < 45; i++) {
    const p = k.add([k.rect(k.rand(5,10),k.rand(5,10),{radius:1}), k.pos(k.rand(0,k.width()),k.rand(-150,-5)), k.color(COLORS[Math.floor(k.rand(0,COLORS.length))]), k.z(15), {vy:k.rand(70,150),vx:k.rand(-25,25)}]);
    pieces.push(p);
  }
  k.onUpdate(() => { pieces.forEach(p => { p.pos.y+=p.vy*k.dt(); p.pos.x+=p.vx*k.dt(); if(p.pos.y>k.height()+20){p.pos.y=k.rand(-80,-5);p.pos.x=k.rand(0,k.width());} }); });
  k.add([k.text("LEVEL 1 CLEARED! 🎉", {size: 28}), k.pos(k.width()/2,80), k.anchor("center"), k.color(255,182,213), k.fixed(), k.z(20)]);
  k.add([k.text("You know your stuff, Shre 🩷", {size: 12}), k.pos(k.width()/2,138), k.anchor("center"), k.color(255,240,255), k.fixed(), k.z(20)]);
  k.wait(1.5, () => {
    k.add([k.text("Press SPACE to keep sailing →", {size: 10}), k.pos(k.width()/2, k.height()-55), k.anchor("center"), k.color(200,180,255), k.fixed(), k.z(20)]);
    k.onKeyPress("space", () => { playSfx("select", 0.25); completedLevels[0]=true; k.go("pond"); });
    k.onClick(()         => { playSfx("select", 0.25); completedLevels[0]=true; k.go("pond"); });
  });
});

// ─── SCENE: POND LEVEL 2 — PETAL CATCH ───────────────────────────────────────
k.scene("pondlevel2", () => {
  k.setGravity(0);
  stopPondMusic();
  if (!level2Music) {
    level2Music = k.play("level2_music", { loop: true, volume: 0.3 });
  }

  // 1. ADD THE NEW BACKGROUND
  k.add([
    k.sprite("level2_bg", { width: k.width(), height: k.height() }),
    k.pos(0, 0),
    k.z(0) 
  ]);

  // 2. THE MASTER FLOOR HEIGHT
  // If their feet are buried in the floor, change 80 to 100.
  // If they are floating in the air, change 80 to 60.
  const FLOOR_Y = k.height() - 71;

  // 3. ADD KUROMI & SIMBA (Using FLOOR_Y)
  k.add([k.sprite("kuromi", { anim: "wave" }), k.pos(60, FLOOR_Y), k.anchor("bot"), k.scale(3), k.z(3)]);
  k.add([k.text("Kuromi",{size: 6}), k.pos(60, FLOOR_Y - 58), k.anchor("center"), k.color(200,180,255), k.z(4)]);
  
  k.add([k.sprite("simba", { anim: "idle" }), k.pos(k.width()-60, FLOOR_Y), k.anchor("bot"), k.scale(3), k.z(3)]);
  k.add([k.text("Simba",{size: 6}), k.pos(k.width()-60, FLOOR_Y - 58), k.anchor("center"), k.color(210,170,100), k.z(4)]);

  // 4. ADD SHRE (Fixed the crash by using "idle" instead of "walk")
  const shre = k.add([
    k.sprite("shre", { anim: "idle" }),
    k.pos(k.width() / 2, FLOOR_Y),
    k.anchor("bot"),
    k.scale(4),
    k.z(10),
    k.area({ shape: new k.Rect(k.vec2(0, -20), 12, 24) }),
    "player"
  ]);

  const GROUND_Y    = k.height() - 80;
  const MOVE_SPEED  = 350; // Speed adjustment for smooth movement
  const CATCH_DIST  = 52;
  const FAIR_NEEDED = 8;

  let lives         = 3;
  let gameActive    = false;
  let phase         = "rigged";
  let prankShown    = false;
  let fairCaught    = 0;
  let spawnTimer    = 0;
  let activePetals  = [];
  let processingHit = false;

  const heartsLabel = k.add([
    k.text("", { size: 12 }),
    k.pos(k.width() / 2, 22),
    k.anchor("center"), k.color(255, 100, 150), k.fixed(), k.z(30),
  ]);
  const scoreLabel = k.add([
    k.text("", { size: 13 }),
    k.pos(k.width() - 16, 22),
    k.anchor("right"), k.color(200, 180, 255), k.fixed(), k.z(30),
  ]);
  const tipLabel = k.add([
    k.text("← → to move  |  catch pink 🌸  |  dodge black 🖤", { size: 8 }),
    k.pos(k.width() / 2, k.height() - 8),
    k.anchor("center"), k.color(160, 130, 200), k.fixed(), k.z(20),
  ]);

  function updateHUD() {
    heartsLabel.text = "🩷".repeat(lives) + "🖤".repeat(3 - lives);
    scoreLabel.text  = phase === "fair" ? `${fairCaught} / ${FAIR_NEEDED}` : "";
  }

  let currentAnim = "idle";
  function setAnim(a) {
    if (currentAnim !== a) { currentAnim = a; shre.play(a); }
  }

  function flashScreen(color, duration) {
    const f = k.add([
      k.rect(k.width(), k.height()), k.pos(0, 0),
      k.color(color), k.opacity(0.5), k.fixed(), k.z(400),
    ]);
    k.wait(duration, () => { if (!f.is("destroyed")) f.destroy(); });
  }

  function destroyPetal(entry) {
    try { entry.petal.destroy(); } catch (_) {}
    try { entry.glow.destroy();  } catch (_) {}
    try { entry.lbl.destroy();   } catch (_) {}
  }

  function clearAllPetals() {
    activePetals.forEach(destroyPetal);
    activePetals = [];
  }

  function spawnPetal() {
    const isBlack = phase === "rigged"
      ? Math.random() < 0.80
      : Math.random() < 0.28;

    const baseSpeed = phase === "rigged" ? 160 : 100;
    const speed     = k.rand(baseSpeed, baseSpeed + 60);
    const x         = k.rand(80, k.width() - 80);

    const col  = isBlack ? k.rgb(50, 20, 70)       : k.rgb(255, 182, 213);
    const gCol = isBlack ? k.rgb(120, 60, 160)      : k.rgb(255, 220, 240);

    const glow  = k.add([k.circle(22),  k.pos(x, -30), k.color(gCol), k.opacity(0.35), k.z(6)]);
    const petal = k.add([
      k.circle(11), k.pos(x, -30), k.color(col),
      k.outline(2, isBlack ? k.rgb(180, 80, 220) : k.rgb(255, 140, 200)),
      k.z(7),
    ]);
    const lbl = k.add([
      k.text(isBlack ? "🖤" : "🌸", { size: 10 }),
      k.pos(x, -30), k.anchor("center"), k.z(8),
    ]);

    activePetals.push({ petal, glow, lbl, isBlack, speed });
  }

  function spawnInterval() {
    return phase === "rigged" ? 0.45 : 0.85;
  }

  function showPrankPopup(onDone) {
    gameActive = false;
    clearAllPetals();
    spawnTimer = 0;

    const objs = [];
    objs.push(k.add([
      k.rect(k.width(), k.height()), k.pos(0, 0),
      k.color(0, 0, 0), k.opacity(0.7), k.fixed(), k.z(200),
    ]));
    objs.push(k.add([
      k.rect(500, 370, { radius: 14 }), k.pos(k.width() / 2, k.height() / 2),
      k.anchor("center"), k.color(20, 10, 35),
      k.outline(3, k.rgb(255, 182, 213)), k.fixed(), k.z(201),
    ]));
    objs.push(k.add([
      k.text("DW GANG, I WON'T MAKE IT THAT TUFF FOR YOU, IT WAS DONE FOR PURELY FUNNY PURPOSES, HEHE", { size: 12, width: 440, align: "center" }),
      k.pos(k.width() / 2, k.height() / 2 - 148),
      k.anchor("center"), k.color(255, 182, 213), k.fixed(), k.z(202),
    ]));
    objs.push(k.add([
      k.sprite("prank"), k.pos(k.width() / 2, k.height() / 2 + 10),
      k.anchor("center"), k.scale(0.22), k.fixed(), k.z(202),
    ]));
    const hint = k.add([
      k.text("— SPACE to continue —", { size: 8 }),
      k.pos(k.width() / 2, k.height() / 2 + 168),
      k.anchor("center"), k.color(160, 140, 200), k.fixed(), k.z(202),
    ]);
    objs.push(hint);

    k.wait(0.6, () => {
      const kh = k.onKeyPress("space", dismiss);
      const ch = k.onClick(dismiss);

      function dismiss() {
        playSfx("select", 0.25);
        kh.cancel();
        ch.cancel();
        objs.forEach(o => { try { o.destroy(); } catch (_) {} });

        prankShown = true;
        phase      = "fair";
        lives      = 3;
        fairCaught = 0;
        spawnTimer = 0;
        processingHit = false;
        updateHUD();
        flashScreen(k.rgb(100, 255, 150), 0.2);

        showDialogue([
          "Kuromi: Okay okay — for real this time 🌸",
          "Kuromi: Pink petals = catch, black = dodge. Only 8 to win! 🖤",
        ], () => {
          gameActive = true;
          onDone();
        });
      }
    });
  }

  function loseLife(resume) {
    if (processingHit) return;
    playSfx("hurt", 0.4);
    processingHit = true;
    gameActive    = false;

    lives--;
    updateHUD();
    flashScreen(k.rgb(220, 40, 40), 0.2);
    clearAllPetals();
    spawnTimer = 0;

    if (lives <= 0) {
      jumpscareFrom = "pondlevel2";
      k.wait(0.6, () => { stopLevel2Music(); k.go("jumpscare"); });
      return;
    }

    if (!prankShown && lives === 1) {
      k.wait(0.5, () => showPrankPopup(() => {
        processingHit = false;
      }));
      return;
    }

    k.wait(0.8, () => {
      processingHit = false;
      gameActive    = true;
      if (resume) resume();
    });
  }

  function winLevel() {
    gameActive = false;
    clearAllPetals();
    completedLevels[1] = true;
    stopLevel2Music();
    k.go("level2cleared");
  }

  k.onUpdate(() => {
    // Left & Right Player Movement incorporated directly into the update loop
    const left  = k.isKeyDown("left")  || k.isKeyDown("a");
    const right = k.isKeyDown("right") || k.isKeyDown("d");
    
    if (left && shre.pos.x > 40) {
      shre.pos.x -= MOVE_SPEED * k.dt();
      shre.flipX  = true;
      setAnim("walkL");
    } else if (right && shre.pos.x < k.width() - 40) {
      shre.pos.x += MOVE_SPEED * k.dt();
      shre.flipX  = false;
      setAnim("walkR");
    } else {
      setAnim("idle");
    }
    
    // Snaps pixel to avoid tearing with the pixel art resolution
    snapPixelPos(shre);

    if (!gameActive) return;

    spawnTimer += k.dt();
    if (spawnTimer >= spawnInterval()) {
      spawnTimer = 0;
      spawnPetal();
      if (phase === "rigged" && Math.random() < 0.55) spawnPetal();
    }

    for (let i = activePetals.length - 1; i >= 0; i--) {
      if (processingHit) break;

      const entry = activePetals[i];
      const { petal, glow, lbl, isBlack, speed } = entry;

      petal.pos.y += speed * k.dt();
      glow.pos.y   = petal.pos.y;
      glow.pos.x   = petal.pos.x;
      lbl.pos.y    = petal.pos.y;
      lbl.pos.x    = petal.pos.x;

      const dx   = petal.pos.x - shre.pos.x;
      const dy   = petal.pos.y - (shre.pos.y - 24);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CATCH_DIST) {
        activePetals.splice(i, 1);
        destroyPetal(entry);

        if (isBlack) {
          loseLife(null);
          return;
        } else {
          playSfx("collect", 0.35);
          flashScreen(k.rgb(255, 100, 180), 0.12);
          if (phase === "fair") {
            fairCaught++;
            updateHUD();
            if (fairCaught >= FAIR_NEEDED) {
              winLevel();
              return;
            }
          }
        }

      } else if (petal.pos.y > GROUND_Y + 20) {
        activePetals.splice(i, 1);
        destroyPetal(entry);

        if (!isBlack) {
          loseLife(null);
          return;
        }
      }
    }
  });

  updateHUD();
  showDialogue([
    "Kuromi: Cherry blossoms are falling, Shre! 🌸",
    "Kuromi: Catch the pink ones — and watch out for the dark ones! 🖤",
  ], () => { gameActive = true; });
});
 

// ─── SCENE: LEVEL 2 CLEARED ───────────────────────────────────────────────────
k.scene("level2cleared", () => {
  k.setGravity(0);
  playSfx("level_clear", 0.45);
  playSfx("confetti", 0.22);
  k.setBackground(10, 5, 25);

  k.add([
    k.rect(k.width(), k.height()), k.pos(0, 0),
    k.color(0, 0, 0), k.opacity(0.35), k.fixed(), k.z(2),
  ]);

  const COLORS = [
    k.rgb(255, 182, 213), k.rgb(200, 180, 255),
    k.rgb(255, 220, 100), k.rgb(150, 230, 200),
  ];
  const pieces = [];
  for (let i = 0; i < 45; i++) {
    const p = k.add([
      k.rect(k.rand(5, 10), k.rand(5, 10), { radius: 1 }),
      k.pos(k.rand(0, k.width()), k.rand(-150, -5)),
      k.color(COLORS[Math.floor(k.rand(0, COLORS.length))]),
      k.z(15),
      { vy: k.rand(70, 150), vx: k.rand(-25, 25) },
    ]);
    pieces.push(p);
  }
  k.onUpdate(() => {
    pieces.forEach(p => {
      p.pos.y += p.vy * k.dt();
      p.pos.x += p.vx * k.dt();
      if (p.pos.y > k.height() + 20) {
        p.pos.y = k.rand(-80, -5);
        p.pos.x = k.rand(0, k.width());
      }
    });
  });

  k.add([
    k.text("LEVEL 2 CLEARED! 🌸", { size: 28 }),
    k.pos(k.width() / 2, 80), k.anchor("center"),
    k.color(255, 182, 213), k.fixed(), k.z(20),
  ]);
  k.add([
    k.text("Every blossom caught, Shre 🩷", { size: 12 }),
    k.pos(k.width() / 2, 138), k.anchor("center"),
    k.color(255, 240, 255), k.fixed(), k.z(20),
  ]);

  k.wait(1.5, () => {
    k.add([
      k.text("Press SPACE to keep sailing →", { size: 10 }),
      k.pos(k.width() / 2, k.height() - 55), k.anchor("center"),
      k.color(200, 180, 255), k.fixed(), k.z(20),
    ]);
    k.onKeyPress("space", () => { playSfx("select", 0.25); completedLevels[1] = true; k.go("pond"); });
    k.onClick(()         => { playSfx("select", 0.25); completedLevels[1] = true; k.go("pond"); });
  });
});


// ─── SCENE: POND LEVEL 3 — MEMORY RAIN ───────────────────────────────────────
k.scene("pondlevel3", () => {
  k.setGravity(1200);
  stopPondMusic();
  if (!level3Music) {
    level3Music = k.play("level3_music", { loop: true, volume: 0.32 });
  }

  // 1. ADD THE NEW BACKGROUND
  k.add([
    k.sprite("level3_bg", { width: k.width(), height: k.height() }),
    k.pos(0, 0),
    k.z(0)
  ]);

  const GROUND_Y   = k.height() - 100;
  const MOVE_SPEED = 300; 
  const JUMP_FORCE = 650;
  const FALL_SPEED = 120;
  
  // TWEAK THIS NUMBER: If your memory photos are too big or small in the popup, change this 0.25!
  const IMG_SCALE_POPUP = 0.25; 

  // Invisible floor for gravity to work against the custom background
  k.add([
    k.rect(k.width(), 80), 
    k.pos(0, GROUND_Y), 
    k.area(), 
    k.body({ isStatic: true }), 
    k.opacity(0), 
    k.z(2)
  ]);

  k.add([k.sprite("kuromi",{anim:"wave"}), k.pos(55,GROUND_Y), k.anchor("bot"), k.scale(SPRITE_SCALE), k.z(5)]);
  k.add([k.text("Kuromi",{size: 6}), k.pos(55,GROUND_Y-58), k.anchor("center"), k.color(200,180,255), k.z(6)]);
  k.add([k.sprite("simba",{anim:"idle"}), k.pos(k.width()-55,GROUND_Y), k.anchor("bot"), k.scale(SPRITE_SCALE), k.z(5)]);
  k.add([k.text("Simba",{size: 6}), k.pos(k.width()-55,GROUND_Y-58), k.anchor("center"), k.color(210,170,100), k.z(6)]);

  const memoryData = [
    { sprite: "memory1", caption: "familia" },
    { sprite: "memory2", caption: "from ne" },
    { sprite: "memory3", caption: "woof woof madre" },
    { sprite: "memory4", caption: "happy burday sheruu,\nthank vv for being there through those fuckass years. u da day one twin🔥 genuine grateful found u from the queue <crazy butterfly effect; lives were def altered>. come lko ghummi fasfas pls miss hanging out w u sm😞 we’ll explore new places and cook tgt and make dancey reels pakka promise <nashe asw hehe>. miss getting high w u and listening to ur elite music taste <bombay bandook will always be associated w u>. lwk a hoe for getting 99 w everyone tho💔. dont forget me when u go to da big city make an exception pls ik u dont like college people🥀💔\nlove u gemini u da real art😛" },
    { sprite: "memory5", caption: "happy birthday shre!! first sem felt so easy with you, you became such a core memory of my college life omg we are already talking this like a nostalgia AAAA nvm I hope if we ever decide to do mba, I’ll pray for the same college and then we’ll have the same class so we can sneak out for some beer😝 and this time we will try all the food recommendation together <3 thank you for always being there I cannot imagine those mid semester crisis without you, ly" },
    { sprite: "memory6", caption: "happiest birthday shre <3!\nty for being the most genuine person i know. also ty for interacting with me before college and just being there yk :). i hope you get everything you want and deserve in life bub, also peep my aura farm pose 😝. i just realized we dont have any pics together so we do need to fix that, see you soon in blr 😈😈.\nalso shoutout to aryan for cooking ts hard\n- weeboo" },
    { sprite: "memory7", caption: "hi hiii\nhappyyy birthdayyy shre!!! 🩷\nwill always be grateful that out of that whole line of randoms 3.something years ago, it was u that we chose <3\nwill always be grateful for this friendship and for getting to know someone like u.\nheavy miss u js randomly entering the room w absolutely anything and everything \nheavy miss the gossip sessions\ntop tier activity honestly.\nand i’ll always be sorry for all the times i ended up hurting u in some way or the other :( never intentional but i know that doesn’t make it hurt less.\ni really hope u know how loved and appreciated u are. like actually. u deserve the softest happiest things always.\nalways always just a text or call away if u ever need kuch bhi, or even if u just wanna talk/rant/cry/gossip about kuch bhi. no matter how much time passes.\npraying this year brings u peace, good people, good health, good memories and everything good and nice only!!\nthank u for being u, shre 🫶\nhappy burdayyy" },
    { sprite: "memory8", caption: "happy birthday shre <3\ni still curse aryan in my mind for not finding you earlier. you are really da most genuine person i know :3 thank you for hearing me out whenever im ranting about the same shit again and again [especially when aryan keeps letting his undiagnosed adhd get to him (we still love you aryan)]\ni love you and you will forever mean so much to me :*" },
    
    { sprite: "memory9", caption: "nigga j told me to add ts here so" },
    { sprite: "memory10", caption: "you da shi - mir" },
    { sprite: "memory11", caption: "poopchamp shi" },
  ];

  let lives = 3, caught = 0;
  const heartsLabel = k.add([k.text("",{size: 12}), k.pos(k.width()/2,22), k.anchor("center"), k.color(255,100,150), k.fixed(), k.z(30)]);
  const scoreLabel  = k.add([k.text("",{size:13}), k.pos(k.width()-16,22), k.anchor("right"), k.color(200,180,255), k.fixed(), k.z(30)]);
  function updateHUD() { heartsLabel.text = "🩷".repeat(lives) + "🖤".repeat(3-lives); scoreLabel.text = `${caught} / ${memoryData.length}`; }
  
  // Updated tip label removing SPACE
  k.add([
    k.text("← → to run  |  W / ↑ to jump  |  catch the stars! ✨", { size: 8 }), 
    k.pos(k.width()/2, k.height() - 10), 
    k.anchor("center"), 
    k.color(160, 130, 200), 
    k.fixed(), 
    k.z(20)
  ]);

  const shre = k.add([
    k.sprite("shre", { anim: "idle" }), 
    k.pos(k.width() / 2, GROUND_Y), 
    k.anchor("bot"), 
    k.scale(SPRITE_SCALE), 
    k.area(), 
    k.body(), 
    k.z(10)
  ]);
  
  let currentAnim = "idle";
  function setAnim(a) { if (currentAnim !== a) { currentAnim = a; shre.play(a); } }

  let gameActive = true, showingPopup = false, currentIdx = 0, fallingMem = null, glowRing = null;

  function showPopup(data, onDone) {
    showingPopup = true; const objs = [];
    objs.push(k.add([k.rect(k.width(), k.height()), k.pos(0, 0), k.color(0, 0, 0), k.opacity(0.85), k.fixed(), k.z(200)]));
    
    const textBlockWidth = 400; // ✨ Made the text area much wider
    // ✨ Added lineSpacing: 8 for extreme legibility on long paragraphs
    const textOpts = { size: 8, width: textBlockWidth, align: "left", lineSpacing: 8 }; 

    const hiddenText = k.add([k.text(data.caption, textOpts), k.pos(-1000, -1000), k.opacity(0)]);
    const textH = hiddenText.height; hiddenText.destroy(); 
    
    const img = k.add([k.sprite(data.sprite), k.pos(-1000, -1000), k.fixed(), k.z(202)]);
    const MAX_IMG_W = 380, MAX_IMG_H = 340;
    const finalScale = Math.min(MAX_IMG_W / img.width, MAX_IMG_H / img.height, 1); 
    img.scale = k.vec2(finalScale); 
    const scaledW = img.width * finalScale, scaledH = img.height * finalScale;
    
    const gapX = 40, padX = 40, padTop = 40, padBot = 70; // ✨ Increased bottom padding so prompt doesn't fall out
    const contentW = scaledW + gapX + textBlockWidth; 
    const contentH = Math.max(scaledH, textH); 
    const boxW = contentW + (padX * 2), boxH = Math.max(contentH + padTop + padBot, 280);
    const centerX = k.width() / 2, centerY = k.height() / 2;
    
    objs.push(k.add([k.rect(boxW, boxH, { radius: 14 }), k.pos(centerX, centerY), k.anchor("center"), k.color(20, 10, 35), k.outline(3, k.rgb(255, 182, 213)), k.fixed(), k.z(201)]));
    
    const visualCenterY = centerY - 10, startX = centerX - (contentW / 2); 
    img.pos = k.vec2(startX + (scaledW / 2), visualCenterY); img.anchor = "center"; objs.push(img);
    
    objs.push(k.add([k.text(data.caption, textOpts), k.pos(startX + scaledW + gapX, visualCenterY), k.anchor("left"), k.color(255, 182, 213), k.fixed(), k.z(202)]));
    
    k.wait(0.4, () => {
      // ✨ Anchored perfectly relative to the bottom edge of the newly calculated box size
      const hint = k.add([k.text("— SPACE to continue —", { size: 8 }), k.pos(centerX, centerY + (boxH / 2) - 25), k.anchor("center"), k.color(160, 140, 200), k.fixed(), k.z(202)]);
      objs.push(hint);
      const kh = k.onKeyPress("space", dismiss), ch = k.onClick(dismiss);
      function dismiss() { playSfx("select", 0.25); kh.cancel(); ch.cancel(); objs.forEach(o => { if (o && !o.destroyed) o.destroy(); }); showingPopup = false; onDone(); }
    });
  }

  function spawnMemory() {
    if (currentIdx >= memoryData.length || !gameActive) return;
    const x = k.rand(110, k.width()-110);
    
    // Spawns a glowing star instead of the picture
    glowRing  = k.add([k.circle(28), k.pos(x,-55), k.color(255,200,230), k.opacity(0.45), k.z(7)]);
    fallingMem = k.add([
        k.text("✨", { size: 36 }), 
        k.pos(x, -55), 
        k.anchor("center"), 
        k.z(8), 
        { active: true }
    ]);
  }

  function catchMemory() {
    playSfx("collect", 0.4);
    fallingMem.active = false; fallingMem.destroy(); fallingMem = null;
    if (glowRing) { glowRing.destroy(); glowRing = null; }
    caught++; updateHUD();
    const flash = k.add([k.rect(k.width(),k.height()), k.pos(0,0), k.color(60,200,80), k.opacity(0.25), k.fixed(), k.z(300)]);
    k.wait(0.15, () => flash.destroy());
    const data = memoryData[currentIdx]; currentIdx++;
    gameActive = false;
    showPopup(data, () => { 
        gameActive = true; 
        if (currentIdx >= memoryData.length) { 
            stopLevel3Music();
            completedLevels[2]=true; k.go("level3cleared"); 
        } else { 
            spawnMemory(); 
        } 
    });
  }

  function missMemory() {
    playSfx("hurt", 0.4);
    fallingMem.active = false; fallingMem.destroy(); fallingMem = null;
    if (glowRing) { glowRing.destroy(); glowRing = null; }
    lives--; updateHUD();
    const flash = k.add([k.rect(k.width(),k.height()), k.pos(0,0), k.color(220,40,40), k.opacity(0.35), k.fixed(), k.z(300)]);
    k.wait(0.2, () => flash.destroy());
    if (lives <= 0) { jumpscareFrom = "pondlevel3"; k.wait(0.5, () => { stopLevel3Music(); k.go("jumpscare"); }); }
    else { k.wait(0.9, () => spawnMemory()); }
  }

  k.onUpdate(() => {
    if (showingPopup) return;
    
    const left  = k.isKeyDown("left")  || k.isKeyDown("a");
    const right = k.isKeyDown("right") || k.isKeyDown("d");
    
    if      (left)               { shre.move(-MOVE_SPEED,0); shre.flipX=true;  setAnim("walkL"); }
    else if (right)              { shre.move( MOVE_SPEED,0); shre.flipX=false; setAnim("walkR"); }
    else if (!shre.isGrounded()) { setAnim("jump"); }
    else                         { setAnim("idle"); }
    
    shre.pos.x = Math.max(28, Math.min(k.width()-28, shre.pos.x));
    
    if (fallingMem && fallingMem.active) {
      fallingMem.pos.y += FALL_SPEED * k.dt();
      if (glowRing) glowRing.pos = k.vec2(fallingMem.pos.x, fallingMem.pos.y);
      
      const dx = fallingMem.pos.x - shre.pos.x;
      const dy = fallingMem.pos.y - (shre.pos.y - 24);
      
      if (Math.sqrt(dx*dx+dy*dy) < 52) { catchMemory(); return; }
      if (fallingMem.pos.y > GROUND_Y + 10) { missMemory(); }
    }
  });

  // Jump controls restricted to UP and W only
  k.onKeyPress(["up", "w"], () => { 
    if (!showingPopup && shre.isGrounded()) {
      playSfx("jump", 0.35);
      shre.jump(JUMP_FORCE);
    } 
  });
  
  updateHUD();
  showDialogue([
    "Kuromi: These are some of da messages from poeple who fw you heavy\nhope you like  🖤",
    "Kuromi: Catch the sparkling stars to unlock them! 🎀",
  ], () => spawnMemory());
});

// ─── SCENE: LEVEL 3 CLEARED ──────────────────────────────────────────────────
k.scene("level3cleared", () => {
  k.setGravity(0);
  playSfx("level_clear", 0.45);
  playSfx("confetti", 0.22);
  k.setBackground(10, 5, 25);

  k.add([k.rect(k.width(),k.height()), k.pos(0,0), k.color(0,0,0), k.opacity(0.35), k.fixed(), k.z(2)]);

  const COLORS = [k.rgb(255,182,213), k.rgb(200,180,255), k.rgb(255,220,100), k.rgb(150,230,200)];
  const pieces = [];
  for (let i = 0; i < 45; i++) {
    const p = k.add([
      k.rect(k.rand(5,10), k.rand(5,10), {radius:1}),
      k.pos(k.rand(0,k.width()), k.rand(-150,-5)),
      k.color(COLORS[Math.floor(k.rand(0, COLORS.length))]),
      k.z(15),
      { vy: k.rand(70,150), vx: k.rand(-25,25) },
    ]);
    pieces.push(p);
  }
  k.onUpdate(() => {
    pieces.forEach(p => {
      p.pos.y += p.vy * k.dt();
      p.pos.x += p.vx * k.dt();
      if (p.pos.y > k.height()+20) { p.pos.y = k.rand(-80,-5); p.pos.x = k.rand(0,k.width()); }
    });
  });

  k.add([k.text("LEVEL 3 CLEARED! ✨", {size: 28}), k.pos(k.width()/2, 80), k.anchor("center"), k.color(255,182,213), k.fixed(), k.z(20)]);
  k.add([k.text("All memories unlocked, Shre 🩷", {size: 12}), k.pos(k.width()/2, 138), k.anchor("center"), k.color(255,240,255), k.fixed(), k.z(20)]);

  k.wait(1.5, () => {
    k.add([k.text("Press SPACE to reach the shore →", {size: 10}), k.pos(k.width()/2, k.height()-55), k.anchor("center"), k.color(200,180,255), k.fixed(), k.z(20)]);
    k.onKeyPress("space", () => { playSfx("select", 0.25); completedLevels[2] = true; k.go("pond"); });
    k.onClick(()         => { playSfx("select", 0.25); completedLevels[2] = true; k.go("pond"); });
  });
});

// ─── SCENE: REUNION ──────────────────────────────────────────────────────────
k.scene("reunion", (args = {}) => {
  k.setGravity(0);
  let reunionBoatSfxTimer = 0;

  k.add([
    k.sprite("pondbackground", { width: k.width(), height: k.height() }),
    k.pos(0, 0), k.z(0),
  ]);

  // ── Constants — RIGHT bank values must match what you see in the screenshot ─
  // The right cliff top in your background image sits around y = height - 200
  // Kuromi was floating → they need to be ON the cliff, not at water level.
  // Adjust BANK_Y here if they're still slightly off.
  const BANK_Y       = k.height() - 200;   // top of the right grass cliff
  const BOAT_Y_BASE  = k.height() - 120;   // water surface (where boat floats)
  const RIGHT_DOCK_X = k.width() - 195;    // where the boat stops on the right
  const SAIL_SPEED   = 110;
  const WALK_SPEED   = 130;
  const SHRE_SPEED   = 180;

  // Kuromi and Simba already on the right bank, waving
  const kuromi = k.add([
    k.sprite("kuromi", { anim: "wave" }),
    k.pos(RIGHT_DOCK_X + 100, BANK_Y),
    k.anchor("bot"), k.scale(SPRITE_SCALE), k.z(5),
  ]);
  kuromi.flipX = true;

  const kLabel = k.add([
    k.text("Kuromi", { size: 8 }),
    k.pos(0, 0), k.anchor("center"), k.color(200, 180, 255), k.z(6),
  ]);

  const simba = k.add([
    k.sprite("simba", { anim: "idle" }),
    k.pos(RIGHT_DOCK_X + 160, BANK_Y),
    k.anchor("bot"), k.scale(SPRITE_SCALE), k.z(5),
  ]);
  simba.flipX = true;

  const sLabel = k.add([
    k.text("Simba", { size: 8 }),
    k.pos(0, 0), k.anchor("center"), k.color(210, 170, 100), k.z(6),
  ]);

  // ── Boat starts at flag 3's x position (or passed in from pond scene) ────
  const startBoatX = args.startBoatX ?? (k.width() - 350);

  const boat = k.add([
    k.sprite("duckboat", { anim: "float" }),
    k.pos(startBoatX, BOAT_Y_BASE),
    k.anchor("bot"), k.scale(BOAT_SCALE), k.z(6),
  ]);

  // Shre riding the boat (visible from the start)
  const rider = k.add([
    k.sprite("shre", { anim: "idle" }),
    k.pos(startBoatX + SHRE_BOAT_OFFSET.x, BOAT_Y_BASE + SHRE_BOAT_OFFSET.y),
    k.anchor("bot"), k.scale(SPRITE_SCALE), k.z(7),
  ]);

  // Shre on the bank — hidden until she disembarks
  const SHRE_BANK_X = RIGHT_DOCK_X + 50;
  const shre = k.add([
    k.sprite("shre", { anim: "idle" }),
    k.pos(SHRE_BANK_X, BANK_Y),
    k.anchor("bot"), k.scale(SPRITE_SCALE), k.z(8),
  ]);
  shre.hidden = true;

  const shreLabel = k.add([
    k.text("Shre", { size: 8 }),
    k.pos(0, 0), k.anchor("center"), k.color(255, 182, 213), k.z(9),
  ]);
  shreLabel.hidden = true;

  let phase = 0;       // 0 = boat sailing, 1 = docked pause, 2 = dialogue, 3 = escort walk, 4 = shre walks
  let dockTimer = 0;
  let shreAnim = "idle";

  function setShreAnim(a) {
    if (shreAnim !== a) { shreAnim = a; shre.play(a); }
  }

  function bobY() {
    return BOAT_Y_BASE + Math.sin(k.time() * 2.2) * 3;
  }

  k.onUpdate(() => {
    // ── Label sync ────────────────────────────────────────────────────────
    kLabel.hidden = kuromi.hidden;
    if (!kuromi.hidden) kLabel.pos = k.vec2(kuromi.pos.x, kuromi.pos.y - 58);

    sLabel.hidden = simba.hidden;
    if (!simba.hidden) sLabel.pos = k.vec2(simba.pos.x, simba.pos.y - 58);

    shreLabel.hidden = shre.hidden;
    if (!shre.hidden) shreLabel.pos = k.vec2(shre.pos.x, shre.pos.y - 58);

    // ── Phase 0: boat sails right to the dock ────────────────────────────
    if (phase === 0) {
      reunionBoatSfxTimer -= k.dt();
      boat.pos.x += SAIL_SPEED * k.dt();
      boat.pos.y  = bobY();
      reunionBoatSfxTimer = playTimedSfx("boat", reunionBoatSfxTimer, 0.45, 0.18);
      rider.pos.x = boat.pos.x + SHRE_BOAT_OFFSET.x;
      rider.pos.y = boat.pos.y + SHRE_BOAT_OFFSET.y;
      snapPixelPos(boat);
      snapPixelPos(rider);

      if (boat.pos.x >= RIGHT_DOCK_X) {
        boat.pos.x = RIGHT_DOCK_X;
        phase      = 1;
        dockTimer  = 0;
      }
    }

    // ── Phase 1: short pause, boat bobs, then Shre disembarks ────────────
    else if (phase === 1) {
      boat.pos.y  = bobY();
      rider.pos.x = boat.pos.x + SHRE_BOAT_OFFSET.x;
      rider.pos.y = boat.pos.y + SHRE_BOAT_OFFSET.y;
      dockTimer  += k.dt();

      if (dockTimer >= 0.7) {
        rider.hidden     = true;
        shre.hidden      = false;
        shreLabel.hidden = false;
        shre.pos         = k.vec2(SHRE_BANK_X, BANK_Y);
        shre.play("idle");
        phase = 2;

        showDialogue([
          "Kuromi: YOU MADE IT!! 🖤🖤🖤",
          "Simba: *zooms around Shre in excited circles*",
          "Kuromi: Come on — there's one more thing waiting for you 🎂",
        ], () => {
          kuromi.flipX = false;
          kuromi.play("walk");
          simba.flipX  = false;
          simba.play("walk");
          phase = 3;
        });
      }
    }

    // ── Phase 3: Kuromi & Simba walk off right ────────────────────────────
    else if (phase === 3) {
      kuromi.pos.x += WALK_SPEED * k.dt();
      simba.pos.x  += WALK_SPEED * k.dt();
      snapPixelPos(kuromi);
      snapPixelPos(simba);

      if (kuromi.pos.x > k.width() + 40) {
        phase = 4;
        const hint = k.add([
          k.text("→ follow them!", { size: 13 }),
          k.pos(shre.pos.x + 80, shre.pos.y - 80),
          k.anchor("center"), k.color(255, 220, 180), k.opacity(0.9), k.z(20),
        ]);
        k.wait(2.0, () => { try { hint.destroy(); } catch (_) {} });
      }
    }

    // ── Phase 4: Player walks Shre off-screen → cake ──────────────────────
    else if (phase === 4) {
      const left  = k.isKeyDown("left")  || k.isKeyDown("a");
      const right = k.isKeyDown("right") || k.isKeyDown("d");

      if (left && shre.pos.x > 0) {
        shre.pos.x -= SHRE_SPEED * k.dt();
        shre.flipX  = true;
        setShreAnim("walkL");
      } else if (right) {
        shre.pos.x += SHRE_SPEED * k.dt();
        shre.flipX  = false;
        setShreAnim("walkR");
      } else {
        setShreAnim("idle");
      }
      snapPixelPos(shre);

      if (shre.pos.x > k.width() + 20) {
        playSfx("select", 0.3);
        k.go("pre_cake");
      }
    }
  });
});

// ─── SCENE: THE QUIET REVEAL (PRE-CAKE) ───────────────────────────────────────
k.scene("pre_cake", () => {
  k.setGravity(0);
  stopPondMusic();
  // 2. Play the music right as this scene loads!
  if (!bgMusic) {
    bgMusic = k.play("bgm_cake", { loop: true, volume: 0.4 });
  }
  k.setBackground(20, 10, 30); // A blank, dark background to build suspense

  // Just Shre standing alone in the center
  k.add([
    k.sprite("shre", { anim: "idle" }), 
    k.pos(k.width()/2, k.height()/2 + 120), 
    k.anchor("bot"), 
    k.scale(4)
  ]);

  // The Popup Box
  k.add([
    k.rect(600, 200, {radius: 12}), 
    k.pos(k.width()/2, k.height()/2 - 60), 
    k.anchor("center"), 
    k.color(20, 10, 35), 
    k.outline(3, k.rgb(255, 182, 213))
  ]);
  
  // The Message
  k.add([
    k.text("You made it through the memory rain, Shre... \n\nBut wait, what is that glowing in the distance?", {
        size: 12, 
        width: 560, 
        align: "center"
    }), 
    k.pos(k.width()/2, k.height()/2 - 90), 
    k.anchor("center"), 
    k.color(255, 240, 245)
  ]);

  // The Continue Button
  const nextBtn = k.add([
    k.rect(200, 44, {radius: 8}), 
    k.pos(k.width()/2, k.height()/2), 
    k.anchor("center"), 
    k.color(255, 100, 160), 
    k.area(),
    "btn"
  ]);
  k.add([k.text("Follow the light ✨", {size: 10}), k.pos(k.width()/2, k.height()/2), k.anchor("center"), k.color(255, 255, 255)]);

  // Make the button hoverable/clickable
  nextBtn.onHover(() => nextBtn.color = k.rgb(255, 130, 180));
  nextBtn.onHoverEnd(() => nextBtn.color = k.rgb(255, 100, 160));
  nextBtn.onClick(() => { playSfx("select", 0.3); k.go("cake"); });
});

// ─── SCENE: CAKE ENDING ───────────────────────────────────────────────────────
k.scene("cake", () => {
  k.setGravity(0);
  
  addBackground("cake_bg"); 

  const FLOOR_Y = k.height() - 80;
  const CAKE_Y = FLOOR_Y + 20; 

  // Draw starfield particles
  for (let i=0; i<60; i++) k.add([k.circle(k.rand(1,2.5)), k.pos(k.rand(0,k.width()), k.rand(0,k.height()*0.75)), k.color(255,240,255), k.opacity(k.rand(0.3,0.9)), k.z(1)]);

  // Characters 
  k.add([k.sprite("shre", {anim:"idle"}), k.pos(k.width()/2-180, FLOOR_Y), k.anchor("bot"), k.scale(4), k.z(5)]);
  k.add([k.sprite("kuromi", {anim:"wave"}), k.pos(k.width()/2+180, FLOOR_Y), k.anchor("bot"), k.scale(4), k.z(5)]);
  k.add([k.sprite("simba", {anim:"idle"}), k.pos(k.width()/2+320, FLOOR_Y), k.anchor("bot"), k.scale(4), k.z(5)]);

  // Cake 
  k.add([k.sprite("cake",{anim:"lit"}), k.pos(k.width()/2, CAKE_Y + 10), k.anchor("bot"), k.scale(2.5), k.z(4)]);
  
  const hint = k.add([k.text("🕯️ Click the cake to make a wish!",{size: 10}),k.pos(k.width()/2,k.height()-400),k.anchor("center"),k.color(255,220,180),k.z(10)]);
  let hintT=0, popupOpen=false;
  k.onUpdate(() => { hintT+=k.dt(); hint.opacity=0.6+0.4*Math.sin(hintT*3); });
  
  const cakeClick = k.add([k.rect(384,320),k.pos(k.width()/2, CAKE_Y),k.anchor("bot"),k.area(),k.opacity(0),k.fixed(),k.z(50)]);
  
  cakeClick.onClick(() => {
    if (popupOpen) return; popupOpen=true; hint.destroy();
    playSfx("select", 0.25);
    k.add([k.rect(k.width(),k.height()),k.pos(0,0),k.color(0,0,0),k.opacity(0.55),k.fixed(),k.z(200)]);
    k.add([k.rect(480,200,{radius:12}),k.pos(k.width()/2,k.height()/2),k.anchor("center"),k.color(20,10,35),k.outline(3,k.rgb(255,182,213)),k.fixed(),k.z(201)]);
    k.add([k.text("🕯️  Make a wish, Shre!",{size:22}),k.pos(k.width()/2,k.height()/2-50),k.anchor("center"),k.color(255,220,180),k.fixed(),k.z(202)]);
    k.add([k.text("Blow out the candles?",{size: 10}),k.pos(k.width()/2,k.height()/2-10),k.anchor("center"),k.color(220,200,255),k.fixed(),k.z(202)]);
    const yes=k.add([k.rect(140,44,{radius:8}),k.pos(k.width()/2-85,k.height()/2+55),k.anchor("center"),k.color(255,100,160),k.area(),k.fixed(),k.z(202)]);
    k.add([k.text("Yes! 🎂",{size: 10}),k.pos(k.width()/2-85,k.height()/2+55),k.anchor("center"),k.color(255,255,255),k.fixed(),k.z(203)]);
    const no=k.add([k.rect(140,44,{radius:8}),k.pos(k.width()/2+85,k.height()/2+55),k.anchor("center"),k.color(60,40,90),k.outline(2,k.rgb(180,160,220)),k.area(),k.fixed(),k.z(202)]);
    k.add([k.text("Not yet…",{size: 10}),k.pos(k.width()/2+85,k.height()/2+55),k.anchor("center"),k.color(200,180,255),k.fixed(),k.z(203)]);
    yes.onClick(() => { playSfx("candle", 0.45); k.go("celebration"); });
    no.onClick(()  => { playSfx("select", 0.25); k.go("cake"); });
  });
});

// ─── SCENE: CELEBRATION ───────────────────────────────────────────────────────
k.scene("celebration", () => {
  k.setGravity(0); // TURN GRAVITY OFF to prevent physics crashes!
  playSfx("confetti", 0.35);
  addBackground("cake_bg");

  const FLOOR_Y = k.height() - 80;
  const CAKE_Y = FLOOR_Y + 20; 

  // Characters
  k.add([k.sprite("shre", {anim:"idle"}), k.pos(k.width()/2-180, FLOOR_Y), k.anchor("bot"), k.scale(4), k.z(5)]);
  k.add([k.sprite("kuromi", {anim:"wave"}), k.pos(k.width()/2+180, FLOOR_Y), k.anchor("bot"), k.scale(4), k.z(5)]);
  k.add([k.sprite("simba", {anim:"idle"}), k.pos(k.width()/2+320, FLOOR_Y), k.anchor("bot"), k.scale(4), k.z(5)]);
  
  // Blown Cake
  k.add([k.sprite("cake", {anim:"blown"}), k.pos(k.width()/2, CAKE_Y + 10), k.anchor("bot"), k.scale(2.5), k.z(4)]); 
  
  const COLORS = [k.rgb(255,182,213), k.rgb(200,180,255), k.rgb(255,220,100), k.rgb(255,255,255)];
  
  // 1. THE INITIAL SPARKLE FOUNTAIN (Using lightweight custom physics)
  for (let i = 0; i < 80; i++) {
      const isCircle = k.rand() > 0.5;
      const size = k.rand(4, 10);
      k.add([
          isCircle ? k.circle(size/2) : k.rect(size, size, { radius: 2 }),
          k.pos(k.width()/2, CAKE_Y - 80),
          k.color(COLORS[Math.floor(k.rand(0, COLORS.length))]),
          k.anchor("center"),
          k.z(15),
          "particle",
          // Adding a custom "vy" (vertical velocity) instead of using k.body()
          { vx: k.rand(-600, 600), vy: k.rand(-900, -300), spinSpeed: k.rand(-300, 300) }
      ]);
  }

  // 2. THE CONTINUOUS RAIN
  const rainTexts = ["Happy Birthday!", "🖤", "🩷", "tomato", "🎂", "✨" ,"balle balle"];
  k.loop(0.1, () => {
      const isText = k.rand() > 0.7; 
      if (isText) {
          k.add([
              k.text(k.choose(rainTexts), { size: k.rand(16, 28) }),
              k.pos(k.rand(50, k.width()-50), -50),
              k.color(COLORS[Math.floor(k.rand(0, COLORS.length))]),
              k.z(14), "particle",
              { vx: k.rand(-30, 30), vy: k.rand(100, 200), spinSpeed: 0 } 
          ]);
      } else {
          k.add([
              k.circle(k.rand(3, 7)),
              k.pos(k.rand(0, k.width()), -50),
              k.color(COLORS[Math.floor(k.rand(0, COLORS.length))]),
              k.z(14), "particle",
              { vx: k.rand(-50, 50), vy: k.rand(100, 200), spinSpeed: 0 }
          ]);
      }
  });

  // ─── CRASH-PROOF CUSTOM PHYSICS ───
  k.onUpdate("particle", (p) => {
    p.vy += 800 * k.dt();
    p.pos.y += p.vy * k.dt();
    p.pos.x += p.vx * k.dt();
    if (p.spinSpeed) p.angle += p.spinSpeed * k.dt();
    if (p.pos.y > k.height() + 100) p.destroy(); 
});

// 3. THE DELAYED POPUP CHAIN
k.wait(14.5, () => {

  // ── POPUP 1 — shown first ──────────────────────────────────────────────
  const p1objs = [];

  p1objs.push(k.add([k.rect(k.width(), k.height()), k.pos(0,0), k.color(0,0,0), k.opacity(0.65), k.fixed(), k.z(20)]));
  p1objs.push(k.add([k.rect(580, 220, {radius: 16}), k.pos(k.width()/2, k.height()/2), k.anchor("center"), k.color(20, 10, 35), k.outline(4, k.rgb(255, 182, 213)), k.fixed(), k.z(21)]));

  // ← PUT YOUR POPUP 1 MESSAGE HERE
  p1objs.push(k.add([
    k.text("HAPPY SHRE DAY", {size: 20}),
    k.pos(k.width()/2, k.height()/2 - 55),
    k.anchor("center"), k.color(255, 182, 213), k.fixed(), k.z(22)
  ]));
  p1objs.push(k.add([
    k.text("You are loved sheru, always remember that. Nobody could be as majestic as a 22 y/o shre btw. \nSHRE WILL ALWAYS BE LOVED", {size: 10, width: 500, align: "center"}),
    k.pos(k.width()/2, k.height()/2 + 15),
    k.anchor("center"), k.color(255, 240, 245), k.fixed(), k.z(22)
  ]));

  const p1hint = k.add([
    k.text("— SPACE to continue —", {size: 8}),
    k.pos(k.width()/2, k.height()/2 + 85),
    k.anchor("center"), k.color(160, 140, 200), k.fixed(), k.z(22)
  ]);
  p1objs.push(p1hint);

  // When dismissed → show the love letter
  k.wait(0.4, () => {
    const kh = k.onKeyPress("space", dismiss1);
    const ch = k.onClick(dismiss1);

    function dismiss1() {
      playSfx("dialogue", 0.22);
      kh.cancel(); ch.cancel();
      p1objs.forEach(o => { try { o.destroy(); } catch(_) {} });
      showLoveLetter();
    }
  });
});

// ── POPUP 2 — the love letter ──────────────────────────────────────────────
function showLoveLetter() {
  k.add([k.rect(k.width(), k.height()), k.pos(0,0), k.color(0,0,0), k.opacity(0.65), k.fixed(), k.z(20)]);
  k.add([k.rect(760, 380, {radius: 16}), k.pos(k.width()/2, k.height()/2 - 20), k.anchor("center"), k.color(20, 10, 35), k.outline(4, k.rgb(255, 182, 213)), k.fixed(), k.z(21)]);
  
  k.add([k.text("HAPPY 22 SHRE", {size: 24}), k.pos(k.width()/2, k.height()/2 - 140), k.anchor("center"), k.color(255,182,213), k.fixed(), k.z(22)]);
  k.add([k.text("Made with luh by poopchamp", {size: 8}), k.pos(k.width()/2, k.height()/2 - 90), k.anchor("center"), k.color(200,180,255), k.fixed(), k.z(22)]);
  
  k.add([
    // ✨ ADDED lineSpacing: 8 and increased width so the final message looks gorgeous
    k.text("I will always fw you heavy dawg, hope this works as a small reminder for that. You da shi brah\n\nHAPPY 22 gugloodon\nI love you", {size: 10, width: 680, align: "center", lineSpacing: 8}),
    k.pos(k.width()/2, k.height()/2 + 30), k.anchor("center"), k.color(255, 240, 245), k.fixed(), k.z(22)
  ]);
}
});


// ─── START ────────────────────────────────────────────────────────────────────
k.go("loading");
// k.go("reunion");
//k.go("celebration");
//k.go("cake");
//k.go("pre_cake");
// k.go("pondlevel3");
//k.go("level3cleared");