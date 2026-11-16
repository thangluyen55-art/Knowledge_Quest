/* Knowledge Quest - stable pixel-art platformer engine */
const $ = (id) => document.getElementById(id);
const screens = ["homeScreen", "mapScreen", "levelScreen", "gameScreen", "endingScreen"];
const showScreen = (id) => screens.forEach((screen) => $(screen).classList.toggle("hidden", screen !== id));

const canvas = $("gameCanvas");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;
const FLOOR = 456;
const WORLD_WIDTH = 2680;
// Ground sections are the only safe walking surfaces. Keep enemies and spikes
// inside these bounds so they never patrol or appear over a pit.
const GROUND_SEGMENTS = [
  { x: 0, w: 560 }, { x: 625, w: 360 }, { x: 1050, w: 390 },
  { x: 1515, w: 390 }, { x: 1985, w: 390 }, { x: 2450, w: 230 }
];

const levelData = [
  {
    name: "THẺ HTML", need: 5, sky: "#9be2e8", ground: "#986447",
    items: ["<html>", "<head>", "<body>", "<h1>", "<p>"],
    message: "Thầy cô đã giúp chúng em hiểu những viên gạch đầu tiên tạo nên một trang web.",
    hint: "Thu thập 5 thẻ HTML và vượt qua những Bug đầu tiên.", difficulty: "DỄ"
  },
  {
    name: "XÂY TRANG WEB", need: 6, sky: "#a9dfc4", ground: "#88634a",
    items: ["<div>", "<a>", "<img>", "<ul>", "<li>", "<form>"],
    message: "Cảm ơn thầy cô đã kiên nhẫn hướng dẫn chúng em sắp xếp từng thành phần thành một trang web hoàn chỉnh.",
    hint: "Bệ di chuyển và Bug bay đã xuất hiện. Hãy quan sát trước khi nhảy.", difficulty: "TRUNG BÌNH"
  },
  {
    name: "TRANG WEB HOÀN CHỈNH", need: 7, sky: "#f2d7a1", ground: "#805843",
    items: ["<title>", "<button>", "<section>", "<footer>", "<table>", "<label>", "</html>"],
    message: "Từ những thẻ HTML đầu tiên đến một trang web hoàn chỉnh, chúng em luôn ghi nhớ công sức và sự tận tâm của thầy cô.",
    hint: "Thử thách cuối: nhiều bẫy hơn, quái nhanh hơn và bệ di chuyển theo cả hai chiều.", difficulty: "KHÓ"
  }
];

let levelIndex = 0;
let player = null;
let platforms = [];
let collectibles = [];
let enemies = [];
let hazards = [];
let goal = null;
let cameraX = 0;
let running = false;
let rafId = 0;
let lastTime = 0;
let soundOn = true;
let audioContext = null;
let score = 0;
let lives = 3;
let keys = Object.create(null);
let invincibleFrames = 0;
let toast = "";
let toastFrames = 0;
let jumpWasDown = false;
let goalMessageCooldown = 0;

function beep(frequency = 500, duration = 0.08) {
  if (!soundOn) return;
  try {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.025;
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch (_) { /* Audio is optional. */ }
}

function rect(x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
}

function pixelLabel(text, x, y, size = 12, color = "#fff", align = "center", maxWidth = 1000) {
  // Canvas labels use a Vietnamese-capable sans font and a thin outline.
  // The pixel-art look comes from the sprites and block shapes, not unreadable text.
  ctx.save();
  ctx.font = `700 ${size}px "Be Vietnam Pro", "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(1, Math.min(2, size * 0.12));
  ctx.strokeStyle = "#263858";
  ctx.strokeText(text, x, y, maxWidth);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y, maxWidth);
  ctx.restore();
}

function makePlatform(x, y, width, height = 18, movement = null) {
  return { x, y, baseX: x, baseY: y, w: width, h: height, movement, phase: Math.random() * Math.PI * 2, dx: 0, dy: 0 };
}

function buildLevel(index) {
  const base = [
    ...GROUND_SEGMENTS.map((segment) => makePlatform(segment.x, FLOOR, segment.w, 100)),
    makePlatform(260, 355, 130), makePlatform(500, 300, 120),
    makePlatform(770, 355, 130), makePlatform(985, 300, 125),
    makePlatform(1240, 350, 135), makePlatform(1510, 300, 130),
    makePlatform(1760, 350, 135), makePlatform(2040, 295, 135)
  ];

  if (index >= 1) {
    base.push(makePlatform(590, 380, 100, 16, { axis: "x", range: 58, speed: 0.025 }));
    base.push(makePlatform(1110, 375, 105, 16, { axis: "y", range: 48, speed: 0.032 }));
    base.push(makePlatform(1640, 385, 100, 16, { axis: "x", range: 72, speed: 0.03 }));
  }
  if (index >= 2) {
    base.push(makePlatform(900, 390, 95, 16, { axis: "y", range: 72, speed: 0.04 }));
    base.push(makePlatform(1900, 380, 100, 16, { axis: "x", range: 90, speed: 0.042 }));
    base.push(makePlatform(2240, 345, 105, 16, { axis: "y", range: 58, speed: 0.045 }));
  }
  return base;
}

function makeGroundEnemy(type, x, segmentIndex, speed, direction) {
  const segment = GROUND_SEGMENTS[segmentIndex];
  const w = type === "hopper" ? 35 : 34;
  const h = type === "hopper" ? 32 : 27;
  return {
    type, x, y: FLOOR - (type === "hopper" ? 34 : 29),
    patrolMin: segment.x + 16,
    patrolMax: segment.x + segment.w - w - 16,
    speed, direction, w, h,
    ...(type === "hopper" ? { jumpTimer: 0 } : {})
  };
}

function buildEnemies(index) {
  // Each ground enemy is assigned to one actual ground segment. It turns
  // around with a safety margin before the pit instead of walking over it.
  const list = [
    makeGroundEnemy("crawler", 700, 1, 1.15, 1),
    makeGroundEnemy("crawler", 1240, 2, 1.35, -1),
    makeGroundEnemy("crawler", 1710, 3, 1.45, 1)
  ];
  if (index >= 1) {
    list.push({ type: "flyer", x: 900, y: 245, originY: 245, minX: 820, maxX: 1080, speed: 1.7, direction: 1, w: 34, h: 26, phase: 0 });
    list.push({ type: "flyer", x: 1680, y: 210, originY: 210, minX: 1570, maxX: 1850, speed: 1.5, direction: -1, w: 34, h: 26, phase: 1.5 });
  }
  if (index >= 2) {
    list.push(makeGroundEnemy("hopper", 1190, 2, 1.8, 1));
    list.push({ type: "flyer", x: 2180, y: 190, originY: 190, minX: 2070, maxX: 2350, speed: 2.1, direction: 1, w: 36, h: 27, phase: 2.4 });
  }
  return list;
}

function buildHazards(index) {
  const positions = [];
  if (index >= 1) positions.push(360, 2180);
  if (index >= 2) positions.push(500, 2300);

  // Validate every spike against a real ground segment with a safe margin.
  return positions.map((x) => {
    const width = 36;
    const supported = GROUND_SEGMENTS.some((segment) =>
      x >= segment.x + 16 && x + width <= segment.x + segment.w - 16
    );
    return supported ? { x, y: FLOOR - 18, w: width, h: 18, type: "spike" } : null;
  }).filter(Boolean);
}

function startLevel(index) {
  keys = Object.create(null);
  levelIndex = index;
  score = 0;
  lives = 3;
  cameraX = 0;
  invincibleFrames = 0;
  toast = "";
  toastFrames = 0;
  jumpWasDown = false;
  goalMessageCooldown = 0;
  player = { x: 70, y: 350, w: 30, h: 42, vx: 0, vy: 0, onGround: false, riding: null, face: 1 };
  platforms = buildLevel(index);
  enemies = buildEnemies(index);
  hazards = buildHazards(index);
  // Each larger card is placed over a matching floating platform.
  const positions = [
    [275, 310], [510, 255], [785, 310], [993, 255],
    [1255, 305], [1523, 255], [1775, 305], [2053, 250]
  ];
  collectibles = levelData[index].items.map((label, itemIndex) => {
    const pos = positions[itemIndex];
    return { x: pos[0], y: pos[1], w: 104, h: 48, label, got: false, phase: itemIndex * 0.9 };
  });
  goal = { x: 2570, y: FLOOR - 92, w: 42, h: 92 };

  $("hudLevel").textContent = `LEVEL 0${index + 1}`;
  $("scoreText").textContent = `0 / ${levelData[index].need}`;
  $("livesText").textContent = "♥ ♥ ♥";
  $("objectiveText").textContent = levelData[index].hint;
  $("difficultyText").textContent = levelData[index].difficulty;
  updateProgress();
  showScreen("gameScreen");
  $("overlay").classList.remove("hidden");
  $("overlayEyebrow").textContent = `KNOWLEDGE QUEST • WORLD 01 • LEVEL 0${index + 1}`;
  $("overlayTitle").textContent = "SẴN SÀNG CHƯA?";
  $("overlayText").textContent = `Thu thập ${levelData[index].need} mảnh kiến thức và chạm đến cột mốc Mentor.`;
  $("overlayBtn").textContent = "BẮT ĐẦU";
  $("overlayBtn").onclick = startLoop;
  running = false;
  cancelAnimationFrame(rafId);
  draw();
}

function updateProgress() {
  const percent = Math.round((score / levelData[levelIndex].need) * 100);
  $("progressFill").style.width = `${percent}%`;
  $("progressLabel").textContent = `${percent}% TRI THỨC`;
}

function startLoop() {
  if (running) return;
  keys = Object.create(null);
  jumpWasDown = false;
  running = true;
  lastTime = 0;
  $("overlay").classList.add("hidden");
  rafId = requestAnimationFrame(gameLoop);
}

function pauseGame() {
  if (!running) return;
  keys = Object.create(null);
  jumpWasDown = false;
  running = false;
  cancelAnimationFrame(rafId);
  $("overlay").classList.remove("hidden");
  $("overlayEyebrow").textContent = "TẠM DỪNG";
  $("overlayTitle").textContent = "NGHỈ MỘT CHÚT NHÉ!";
  $("overlayText").textContent = "Hít thở thật sâu, quan sát chướng ngại vật rồi tiếp tục hành trình.";
  $("overlayBtn").textContent = "TIẾP TỤC";
  $("overlayBtn").onclick = startLoop;
}

function gameLoop(timestamp) {
  if (!running) return;
  const delta = lastTime ? Math.min((timestamp - lastTime) / 16.667, 2) : 1;
  lastTime = timestamp;
  update(delta);
  draw();
  if (running) rafId = requestAnimationFrame(gameLoop);
}

function updateMovingObjects(delta) {
  platforms.forEach((platform) => {
    platform.dx = 0;
    platform.dy = 0;
    if (!platform.movement) return;
    platform.phase += platform.movement.speed * delta;
    const wave = Math.sin(platform.phase);
    const nextX = platform.baseX + (platform.movement.axis === "x" ? wave * platform.movement.range : 0);
    const nextY = platform.baseY + (platform.movement.axis === "y" ? wave * platform.movement.range : 0);
    platform.dx = nextX - platform.x;
    platform.dy = nextY - platform.y;
    platform.x = nextX;
    platform.y = nextY;
  });

  enemies.forEach((enemy) => {
    const minX = enemy.patrolMin ?? enemy.minX ?? enemy.min;
    const maxX = enemy.patrolMax ?? enemy.maxX ?? enemy.max;
    enemy.x += enemy.speed * enemy.direction * delta;
    if (enemy.x < minX) { enemy.x = minX; enemy.direction = 1; }
    if (enemy.x > maxX) { enemy.x = maxX; enemy.direction = -1; }
    if (enemy.type === "flyer") {
      enemy.phase += 0.055 * delta;
      enemy.y = enemy.originY + Math.sin(enemy.phase) * 48;
    } else if (enemy.type === "hopper") {
      enemy.jumpTimer += delta;
      enemy.y = FLOOR - 34 - Math.max(0, Math.sin(enemy.jumpTimer * 0.09)) * 62;
    }
  });
}

function update(delta) {
  updateMovingObjects(delta);
  const left = keys.ArrowLeft || keys.a || keys.A;
  const right = keys.ArrowRight || keys.d || keys.D;
  const jumpDown = keys.Space || keys.ArrowUp || keys.w || keys.W;
  player.vx = left === right ? 0 : left ? -4.1 : 4.1;
  if (left) player.face = -1;
  if (right) player.face = 1;

  if (player.riding) {
    player.x += player.riding.dx;
    player.y += player.riding.dy;
  }
  if (jumpDown && !jumpWasDown && player.onGround) {
    player.vy = -12.3;
    player.onGround = false;
    player.riding = null;
    beep(620, 0.06);
  }
  jumpWasDown = jumpDown;

  const previousBottom = player.y + player.h;
  player.x += player.vx * delta;
  player.vy = Math.min(player.vy + 0.62 * delta, 14);
  player.y += player.vy * delta;
  player.onGround = false;
  player.riding = null;

  // Land only when crossing a platform's top surface while falling.
  if (player.vy >= 0) {
    for (const platform of platforms) {
      const overlapsX = player.x + player.w > platform.x && player.x < platform.x + platform.w;
      const crossedTop = previousBottom <= platform.y + 8 && player.y + player.h >= platform.y;
      if (overlapsX && crossedTop) {
        player.y = platform.y - player.h;
        player.vy = 0;
        player.onGround = true;
        player.riding = platform.movement ? platform : null;
        break;
      }
    }
  }

  player.x = Math.max(0, Math.min(player.x, WORLD_WIDTH - player.w));
  if (player.y > H + 90) {
    loseLife("Bạn đã rơi khỏi đường đi!");
    player.x = Math.max(40, player.x - 125);
    player.y = 270;
    player.vy = 0;
  }

  if (invincibleFrames > 0) invincibleFrames -= delta;
  enemies.forEach((enemy) => {
    if (invincibleFrames <= 0 && intersects(player, enemy)) {
      loseLife("Cẩn thận! Bạn vừa chạm phải Bug.");
      player.vy = -7.5;
      player.x -= player.face * 24;
    }
  });
  hazards.forEach((hazard) => {
    if (invincibleFrames <= 0 && intersects(player, hazard)) {
      loseLife("Hãy chú ý những chiếc gai trên đường!");
      player.vy = -7;
      player.x -= player.face * 25;
    }
  });
  if (!running && lives <= 0) return;

  collectibles.forEach((item) => {
    item.phase += 0.08 * delta;
    const floatingItem = { x: item.x, y: item.y + Math.sin(item.phase) * 5, w: item.w, h: item.h };
    if (!item.got && intersects(player, floatingItem)) {
      item.got = true;
      score += 1;
      beep(850, 0.08);
      $("scoreText").textContent = `${score} / ${levelData[levelIndex].need}`;
      updateProgress();
      flashToast(`+1 KIẾN THỨC: ${item.label}`);
    }
  });

  if (intersects(player, goal)) {
    if (score >= levelData[levelIndex].need) {
      completeLevel();
    } else if (goalMessageCooldown <= 0) {
      flashToast(`CÒN ${levelData[levelIndex].need - score} MẢNH KIẾN THỨC!`);
      goalMessageCooldown = 60;
    }
  }
  cameraX = Math.max(0, Math.min(player.x - 260, WORLD_WIDTH - W));
  if (toastFrames > 0) toastFrames -= delta;
  if (goalMessageCooldown > 0) goalMessageCooldown -= delta;
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function loseLife(message) {
  if (invincibleFrames > 0 || lives <= 0) return;
  lives -= 1;
  invincibleFrames = 85;
  $("livesText").textContent = "♥ ".repeat(lives) + "♡ ".repeat(3 - lives);
  beep(160, 0.16);
  flashToast(message);
  if (lives <= 0) {
    running = false;
    cancelAnimationFrame(rafId);
    $("overlay").classList.remove("hidden");
    $("overlayEyebrow").textContent = "THỬ LẠI NÀO";
    $("overlayTitle").textContent = "ĐỪNG BỎ CUỘC!";
    $("overlayText").textContent = "Bug là một phần của hành trình lập trình. Hãy thử lại và chinh phục màn chơi nhé!";
    $("overlayBtn").textContent = "CHƠI LẠI MÀN";
    $("overlayBtn").onclick = () => startLevel(levelIndex);
  }
}

function flashToast(message) {
  toast = message;
  toastFrames = 90;
}

function drawBackground() {
  const data = levelData[levelIndex];
  rect(0, 0, W, H, data.sky);
  for (let i = 0; i < 8; i++) {
    const x = ((i * 185 - cameraX * 0.22) % (W + 150) + W + 150) % (W + 150) - 70;
    rect(x, 68 + (i % 3) * 42, 72, 17, "#efffff");
    rect(x + 17, 51 + (i % 3) * 42, 43, 18, "#efffff");
  }
  rect(0, 380, W, 78, "#83c58c");
  for (let i = 0; i < 12; i++) {
    const x = i * 120 - (cameraX * 0.34 % 120);
    rect(x, 354, 76, 29, "#70b77f");
  }
}

function drawPlatforms() {
  platforms.forEach((platform) => {
    const x = platform.x - cameraX;
    if (x + platform.w < -5 || x > W + 5) return;
    rect(x, platform.y, platform.w, platform.h, levelData[levelIndex].ground);
    rect(x, platform.y, platform.w, 8, "#d9a36a");
    for (let tile = 0; tile < platform.w; tile += 42) {
      rect(x + tile + 8, platform.y + 12, 4, 9, "#704c43");
      rect(x + tile + 24, platform.y + 25, 10, 4, "#704c43");
    }
    if (platform.movement) {
      rect(x + platform.w / 2 - 4, platform.y - 6, 8, 5, "#fff0a5");
    }
  });
}

function drawCollectibles() {
  collectibles.forEach((item) => {
    if (item.got) return;

    const x = Math.round(item.x - cameraX);
    const y = Math.round(item.y + Math.sin(item.phase) * 5);
    const w = item.w;
    const h = item.h;
    if (x < -w - 20 || x > W + 20) return;

    // Large knowledge card: clear border, readable tag text and consistent sizing.
    rect(x + 5, y - 2, w, h, "#263858");
    rect(x, y - 5, w, h, "#bd8745");
    rect(x + 3, y - 2, w - 6, h - 6, "#ffdf75");
    rect(x + 7, y + 1, w - 14, 5, "#fff1b7");
    rect(x + 7, y + 10, w - 14, 27, "#fffaf0");
    rect(x + 10, y + 41, 14, 3, "#e8ad4c");
    rect(x + w - 24, y + 41, 14, 3, "#e8ad4c");

    ctx.save();
    let fontSize = 16;
    const maxTextWidth = w - 22;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${fontSize}px "Courier New", monospace`;
    while (ctx.measureText(item.label).width > maxTextWidth && fontSize > 11) {
      fontSize -= 0.5;
      ctx.font = `700 ${fontSize}px "Courier New", monospace`;
    }
    ctx.fillStyle = "#263858";
    ctx.fillText(item.label, x + w / 2, y + 24, maxTextWidth);
    ctx.restore();

    pixelLabel("✦", x + w / 2, y - 11, 13, "#fff8cf");
  });
}

function drawEnemy(enemy) {
  const x = enemy.x - cameraX;
  if (x < -60 || x > W + 60) return;
  if (enemy.type === "flyer") {
    rect(x + 5, enemy.y + 7, 25, 15, "#263858");
    rect(x + 2, enemy.y + 5, 25, 15, "#8b72c7");
    rect(x - 5, enemy.y + 1, 12, 8, "#d7c8ff");
    rect(x + 22, enemy.y + 1, 12, 8, "#d7c8ff");
    rect(x + 8, enemy.y + 9, 4, 4, "#fff"); rect(x + 19, enemy.y + 9, 4, 4, "#fff");
  } else if (enemy.type === "hopper") {
    rect(x + 4, enemy.y + 8, 28, 22, "#263858");
    rect(x + 2, enemy.y + 4, 28, 22, "#e3a34e");
    rect(x + 7, enemy.y + 10, 5, 5, "#fff"); rect(x + 20, enemy.y + 10, 5, 5, "#fff");
    rect(x + 5, enemy.y + 27, 7, 5, "#263858"); rect(x + 23, enemy.y + 27, 7, 5, "#263858");
  } else {
    rect(x + 5, enemy.y + 8, 25, 17, "#263858");
    rect(x + 2, enemy.y + 4, 25, 17, "#e66d6d");
    rect(x + 7, enemy.y + 8, 5, 5, "#fff"); rect(x + 18, enemy.y + 8, 5, 5, "#fff");
    rect(x + 8, enemy.y + 10, 2, 2, "#263858"); rect(x + 19, enemy.y + 10, 2, 2, "#263858");
    rect(x + 3, enemy.y + 21, 7, 5, "#263858"); rect(x + 23, enemy.y + 21, 7, 5, "#263858");
  }
}

function drawHazards() {
  hazards.forEach((hazard) => {
    const x = hazard.x - cameraX;
    if (x < -50 || x > W + 50) return;
    for (let i = 0; i < hazard.w; i += 12) {
      ctx.fillStyle = "#f4f1dc";
      ctx.beginPath();
      ctx.moveTo(x + i, hazard.y + hazard.h);
      ctx.lineTo(x + i + 6, hazard.y);
      ctx.lineTo(x + i + 12, hazard.y + hazard.h);
      ctx.fill();
      ctx.strokeStyle = "#9b5960";
      ctx.stroke();
    }
  });
}

function drawPlayer() {
  if (invincibleFrames > 0 && Math.floor(invincibleFrames / 6) % 2 === 0) return;
  const x = player.x - cameraX;
  const y = player.y;
  // small original pixel adventurer sprite
  rect(x + 5, y + 13, 22, 27, "#263858");
  rect(x + 7, y + 2, 20, 19, "#f2c49a");
  rect(x + 4, y - 3, 24, 9, "#263858");
  rect(x + 7, y - 7, 18, 8, "#ed8b61");
  rect(x + (player.face > 0 ? 20 : 9), y + 9, 4, 4, "#263858");
  rect(x + 2, y + 38, 10, 6, "#263858");
  rect(x + 20, y + 38, 10, 6, "#263858");
  rect(x + 11, y + 24, 9, 4, "#fff");
}

function drawGoal() {
  const x = goal.x - cameraX;
  rect(x + 15, goal.y, 7, 92, "#5b5c70");
  rect(x + 22, goal.y, 82, 38, "#263858");
  rect(x + 18, goal.y - 4, 82, 38, "#ffdf75");
  rect(x + 22, goal.y, 74, 30, "#fff1b7");
  pixelLabel("MENTOR", x + 59, goal.y + 20, 13, "#263858");
  rect(x + 5, FLOOR - 8, 34, 8, "#6b9c70");
}

function draw() {
  drawBackground();
  drawPlatforms();
  drawHazards();
  drawCollectibles();
  enemies.forEach(drawEnemy);
  drawGoal();
  drawPlayer();
  for (let i = 0; i < 38; i++) {
    const x = (i * 31 - cameraX * 0.9) % (W + 20);
    rect(x < 0 ? x + W + 20 : x, FLOOR - 8, 4, 8, "#4e9b70");
  }
  if (toastFrames > 0) {
    const toastWidth = W - 300;
    rect(150, 20, toastWidth, 38, "#263858");
    pixelLabel(toast, W / 2, 45, 14, "#fff0a5", "center", toastWidth - 28);
  }
}

function completeLevel() {
  running = false;
  cancelAnimationFrame(rafId);
  beep(950, 0.2);
  $("overlay").classList.remove("hidden");
  $("overlayEyebrow").textContent = `LEVEL 0${levelIndex + 1} HOÀN THÀNH`;
  $("overlayTitle").textContent = "TUYỆT VỜI!";
  $("overlayText").textContent = levelData[levelIndex].message;
  $("overlayBtn").textContent = levelIndex < 2 ? "SANG MÀN TIẾP THEO" : "HOÀN THÀNH MAP 1";
  $("overlayBtn").onclick = () => {
    if (levelIndex < 2) startLevel(levelIndex + 1);
    else showScreen("endingScreen");
  };
}

$("startBtn").addEventListener("click", () => showScreen("mapScreen"));
$("backHomeBtn").addEventListener("click", () => showScreen("homeScreen"));
$("openHtmlBtn").addEventListener("click", () => showScreen("levelScreen"));
$("backMapBtn").addEventListener("click", () => showScreen("mapScreen"));
document.querySelectorAll(".level-card").forEach((button) => button.addEventListener("click", () => startLevel(Number(button.dataset.level))));
$("pauseBtn").addEventListener("click", pauseGame);
$("quitBtn").addEventListener("click", () => { keys = Object.create(null); jumpWasDown = false; running = false; cancelAnimationFrame(rafId); showScreen("levelScreen"); });
$("endingReplayBtn").addEventListener("click", () => startLevel(0));
$("endingMapBtn").addEventListener("click", () => showScreen("mapScreen"));
$("soundBtn").addEventListener("click", () => {
  soundOn = !soundOn;
  $("soundBtn").textContent = `♪ ÂM THANH: ${soundOn ? "BẬT" : "TẮT"}`;
});

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(event.code)) event.preventDefault();
  keys[event.code === "Space" ? "Space" : event.key] = true;
});
window.addEventListener("keyup", (event) => {
  keys[event.code === "Space" ? "Space" : event.key] = false;
});
window.addEventListener("blur", () => {
  keys = Object.create(null);
  jumpWasDown = false;
  if (running) pauseGame();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && running) pauseGame();
});

// Initial HUD values. The canvas is rendered when the player starts a level.
$("objectiveText").textContent = levelData[0].hint;
$("difficultyText").textContent = levelData[0].difficulty;
