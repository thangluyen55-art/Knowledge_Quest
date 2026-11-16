/* Knowledge Quest - stable pixel-art platformer engine */
const $ = (id) => document.getElementById(id);
const screens = ["homeScreen", "mapScreen", "levelScreen", "gameScreen", "endingScreen"];
const showScreen = (id) => screens.forEach((screen) => $(screen).classList.toggle("hidden", screen !== id));

const canvas = $("gameCanvas");
// Render the 960x540 game world onto a 2x backing canvas. This preserves the
// original gameplay coordinates while giving canvas text and sprites more
// pixels before the browser scales the frame to the page width.
const W = 960;
const H = 540;
const RENDER_SCALE = 2;
canvas.width = W * RENDER_SCALE;
canvas.height = H * RENDER_SCALE;
const ctx = canvas.getContext("2d", { alpha: false });
ctx.scale(RENDER_SCALE, RENDER_SCALE);
ctx.imageSmoothingEnabled = true;
const FLOOR = 456;
const WORLD_WIDTH = 2680;
// Ground sections are the only safe walking surfaces. Keep enemies and spikes
// inside these bounds so they never patrol or appear over a pit.
const GROUND_SEGMENTS = [
  { x: 0, w: 560 }, { x: 625, w: 360 }, { x: 1050, w: 390 },
  { x: 1515, w: 390 }, { x: 1985, w: 390 }, { x: 2450, w: 230 }
];

const makeLevel = (name, need, items, sky, ground, hint, difficulty, message, options = {}) => ({
  name, need, items, sky, ground,
  icon: options.icon || ({
    "Thẻ HTML": "🏷", "Xây trang web": "🧱", "Trang web hoàn chỉnh": "🎨",
    "Biến và dữ liệu": "🌱", "Hàm và mảng": "🧩", "Vòng lặp và DOM": "⚡",
    "Class và Object": "🏰", "Kế thừa và Interface": "🛡️", "Chinh phục Java": "☕"
  }[name] || "✦"),
  platformTop: options.platformTop || "#d9a36a",
  card: options.card || "#ffdf75",
  cardEdge: options.cardEdge || "#bd8745",
  cardFace: options.cardFace || "#fffaf0",
  hint, difficulty, message,
  movingPlatforms: options.movingPlatforms || [],
  groundEnemies: options.groundEnemies || [],
  flyers: options.flyers || [],
  hazards: options.hazards || []
});

const worldData = [
  {
    short: "HTML", title: "VƯƠNG QUỐC HTML", symbol: "</>",
    summary: "Nền móng tạo nên cấu trúc của mọi trang web.",
    endingTitle: "BẠN ĐÃ HOÀN THÀNH<br><span>HÀNH TRÌNH HTML!</span>",
    endingMessage: "Mỗi thẻ HTML là một viên gạch nhỏ xây nên thế giới web. Cảm ơn thầy cô đã kiên nhẫn đặt những viên gạch đầu tiên cùng chúng em.",
    endingQuote: "Cảm ơn thầy cô đã giúp chúng em hiểu cách một trang web được hình thành, từ cấu trúc nhỏ nhất đến một sản phẩm hoàn chỉnh.",
    palette: { land: "#83c58c", distant: "#70b77f", card: "#ffdf75", cardEdge: "#bd8745", cardFace: "#fffaf0" },
    levels: [
      makeLevel("Thẻ HTML", 5, ["<html>", "<head>", "<body>", "<h1>", "<p>"], "#9be2e8", "#986447", "Thu thập 5 thẻ HTML và vượt qua những Bug đầu tiên.", "DỄ", "Bạn đã nắm được những thẻ HTML nền tảng. Từng dòng cấu trúc hôm nay sẽ mở ra một thế giới web ngày mai.", {
        groundEnemies: [{segment:1,offset:80,speed:1.05,direction:1},{segment:3,offset:85,speed:1.1,direction:-1}]
      }),
      makeLevel("Xây trang web", 6, ["<div>", "<a>", "<img>", "<ul>", "<li>", "<form>"], "#a9dfc4", "#88634a", "Bệ di chuyển và Bug bay đã xuất hiện. Quan sát trước khi nhảy.", "TRUNG BÌNH", "Bạn đã biết cách kết hợp các thành phần thành một trang web có tổ chức. Cảm ơn thầy cô vì đã luôn kiên nhẫn hướng dẫn.", {
        groundEnemies: [{segment:0,offset:320,speed:1.2,direction:1},{segment:2,offset:130,speed:1.3,direction:-1},{segment:4,offset:125,speed:1.35,direction:1}],
        flyers: [{x:900,y:245,minX:820,maxX:1080,speed:1.55,direction:1}], hazards:[360,2180],
        movingPlatforms:[{x:590,y:380,w:100,axis:"x",range:58,speed:.025},{x:1110,y:375,w:105,axis:"y",range:48,speed:.032}]
      }),
      makeLevel("Trang web hoàn chỉnh", 7, ["<title>", "<button>", "<section>", "<footer>", "<table>", "<label>", "</html>"], "#f2d7a1", "#805843", "Thử thách cuối HTML: nhiều bẫy hơn và các bệ di chuyển theo hai chiều.", "KHÓ", "Bạn đã hoàn thành Vương quốc HTML! Cảm ơn thầy cô vì những viên gạch đầu tiên trên hành trình lập trình.", {
        groundEnemies:[{segment:0,offset:340,speed:1.35,direction:1},{segment:2,offset:145,speed:1.45,direction:-1},{segment:2,offset:245,speed:1.65,direction:1,type:"hopper"},{segment:4,offset:145,speed:1.5,direction:-1}],
        flyers:[{x:900,y:225,minX:820,maxX:1080,speed:1.75,direction:1},{x:1680,y:205,minX:1570,maxX:1850,speed:1.65,direction:-1},{x:2180,y:185,minX:2070,maxX:2350,speed:1.95,direction:1}],
        hazards:[500,1180,2300],
        movingPlatforms:[{x:590,y:380,w:100,axis:"x",range:65,speed:.03},{x:1110,y:375,w:105,axis:"y",range:55,speed:.035},{x:1640,y:385,w:100,axis:"x",range:78,speed:.035},{x:2240,y:345,w:105,axis:"y",range:48,speed:.04}]
      })
    ]
  },
  {
    short: "JAVASCRIPT", title: "KHU RỪNG JAVASCRIPT", symbol: "JS",
    summary: "Đánh thức logic, biến dữ liệu thành tương tác sống động.",
    endingTitle: "BẠN ĐÃ ĐÁNH THỨC<br><span>KHU RỪNG JAVASCRIPT!</span>",
    endingMessage: "Từ biến, hàm đến sự kiện trên trang web, bạn đã biến những dòng lệnh thành hành động. Cảm ơn thầy cô đã dạy chúng em cách suy nghĩ, thử nghiệm và sáng tạo.",
    endingQuote: "Cảm ơn thầy cô đã chỉ cho chúng em rằng lập trình không chỉ là viết cú pháp, mà còn là chia nhỏ vấn đề, đặt câu hỏi và kiên trì tìm lời giải.",
    palette: { land: "#83bd76", distant: "#5da66e", card: "#ffe07b", cardEdge: "#a98237", cardFace: "#fffbea" },
    levels: [
      makeLevel("Biến và dữ liệu", 5, ["let", "const", "var", "string", "number"], "#c9e99b", "#795d42", "Khu rừng bắt đầu chuyển động. Thu thập biến và tránh các Bug Undefined.", "DỄ", "Bạn đã phân biệt được biến và kiểu dữ liệu. Mọi chương trình lớn đều bắt đầu từ những giá trị nhỏ.", {
        groundEnemies:[{segment:1,offset:100,speed:1.2,direction:1,color:"#d96d58"},{segment:4,offset:110,speed:1.25,direction:-1,color:"#d96d58"}],
        flyers:[{x:900,y:230,minX:820,maxX:1080,speed:1.55,direction:1,color:"#765bc2"}],
        movingPlatforms:[{x:590,y:380,w:100,axis:"x",range:55,speed:.027}], card:"#dfff8a",cardEdge:"#719b45",cardFace:"#f7ffed"
      }),
      makeLevel("Hàm và mảng", 6, ["function", "return", "array[]", "push()", "map()", "filter()"], "#b7e4a0", "#75583f", "Ghép các mảnh logic, dùng hàm và mảng để vượt qua rừng dữ liệu.", "TRUNG BÌNH", "Bạn đã biết cách đóng gói logic trong hàm và xử lý nhiều giá trị bằng mảng. Một bước tiến lớn trong tư duy lập trình!", {
        groundEnemies:[{segment:0,offset:320,speed:1.35,direction:1,color:"#d96d58"},{segment:2,offset:160,speed:1.55,direction:-1,type:"hopper",color:"#e3a34e"},{segment:4,offset:145,speed:1.45,direction:-1,color:"#d96d58"}],
        flyers:[{x:900,y:225,minX:820,maxX:1080,speed:1.75,direction:1,color:"#765bc2"},{x:1680,y:200,minX:1570,maxX:1850,speed:1.65,direction:-1,color:"#765bc2"}],
        hazards:[360,1600],movingPlatforms:[{x:590,y:380,w:100,axis:"x",range:68,speed:.03},{x:1110,y:375,w:105,axis:"y",range:52,speed:.035},{x:1640,y:385,w:100,axis:"x",range:75,speed:.034}],
        card:"#dfff8a",cardEdge:"#719b45",cardFace:"#f7ffed"
      }),
      makeLevel("Vòng lặp và DOM", 7, ["for", "while", "DOM", "querySelector", "addEventListener", "click", "render()"], "#a8dfbe", "#665540", "Thử thách JavaScript cuối: né Undefined, xử lý sự kiện và vượt bẫy logic.", "KHÓ", "Bạn đã hoàn thành Khu rừng JavaScript! Từ những vòng lặp đến tương tác DOM, bạn đã biến logic thành trải nghiệm.", {
        groundEnemies:[{segment:0,offset:335,speed:1.5,direction:1,color:"#d96d58"},{segment:2,offset:150,speed:1.75,direction:-1,type:"hopper",color:"#e3a34e"},{segment:3,offset:145,speed:1.65,direction:1,color:"#d96d58"},{segment:4,offset:160,speed:1.7,direction:-1,color:"#d96d58"}],
        flyers:[{x:900,y:220,minX:820,maxX:1080,speed:1.95,direction:1,color:"#765bc2"},{x:1680,y:195,minX:1570,maxX:1850,speed:1.85,direction:-1,color:"#765bc2"},{x:2180,y:185,minX:2070,maxX:2350,speed:2.05,direction:1,color:"#765bc2"}],
        hazards:[330,760,1180,2070,2500],movingPlatforms:[{x:590,y:380,w:100,axis:"x",range:75,speed:.035},{x:1110,y:375,w:105,axis:"y",range:65,speed:.04},{x:1640,y:385,w:100,axis:"x",range:90,speed:.04},{x:2240,y:345,w:105,axis:"y",range:60,speed:.045}],
        card:"#dfff8a",cardEdge:"#719b45",cardFace:"#f7ffed"
      })
    ]
  },
  {
    short: "JAVA", title: "THÀNH TRÌ JAVA", symbol: "☕",
    summary: "Rèn tư duy hướng đối tượng và xây dựng chương trình vững chắc.",
    endingTitle: "BẠN ĐÃ CHINH PHỤC<br><span>THÀNH TRÌ JAVA!</span>",
    endingMessage: "Bạn đã đi qua thế giới hướng đối tượng, kế thừa, xử lý ngoại lệ và cấu trúc dữ liệu. Cảm ơn thầy cô đã trao cho chúng em nền tảng để tự tin xây dựng những điều lớn hơn.",
    endingQuote: "Cảm ơn thầy cô đã truyền cho chúng em không chỉ kiến thức Java, mà cả sự cẩn thận, tư duy hệ thống và tinh thần không ngại thử thách.",
    palette: { land: "#91a9d8", distant: "#7187bd", card: "#ffd78a", cardEdge: "#ad743f", cardFace: "#fff8ed" },
    levels: [
      makeLevel("Class và Object", 5, ["class", "new", "object", "field", "method"], "#b9c9ec", "#745747", "Bước vào thành trì Java. Thu thập Class, Object và các thành phần đầu tiên.", "DỄ", "Bạn đã hiểu lớp là bản thiết kế và đối tượng là thể hiện cụ thể. Nền tảng OOP đã được đặt xuống!", {
        groundEnemies:[{segment:1,offset:110,speed:1.25,direction:1,color:"#cf6a4b"},{segment:4,offset:125,speed:1.3,direction:-1,color:"#cf6a4b"}],
        flyers:[{x:900,y:225,minX:820,maxX:1080,speed:1.55,direction:1,color:"#6474b7"}],
        movingPlatforms:[{x:590,y:380,w:100,axis:"x",range:55,speed:.027}],card:"#ffd78a",cardEdge:"#ad743f",cardFace:"#fff8ed"
      }),
      makeLevel("Kế thừa và Interface", 6, ["extends", "implements", "super()", "override", "abstract", "interface"], "#aebfe5", "#6d5148", "Vượt qua các cổng kế thừa. Bệ di chuyển và Exception bắt đầu xuất hiện.", "TRUNG BÌNH", "Bạn đã kết nối được các lớp bằng kế thừa và interface. Kiến trúc chương trình đang trở nên rõ ràng hơn.", {
        groundEnemies:[{segment:0,offset:320,speed:1.35,direction:1,color:"#cf6a4b"},{segment:2,offset:150,speed:1.6,direction:-1,type:"hopper",color:"#e5a44f"},{segment:4,offset:145,speed:1.45,direction:-1,color:"#cf6a4b"}],
        flyers:[{x:900,y:220,minX:820,maxX:1080,speed:1.7,direction:1,color:"#6474b7"},{x:1680,y:200,minX:1570,maxX:1850,speed:1.6,direction:-1,color:"#6474b7"}],
        hazards:[360,1600],movingPlatforms:[{x:590,y:380,w:100,axis:"x",range:65,speed:.03},{x:1110,y:375,w:105,axis:"y",range:55,speed:.035},{x:1640,y:385,w:100,axis:"x",range:78,speed:.035}],
        card:"#ffd78a",cardEdge:"#ad743f",cardFace:"#fff8ed"
      }),
      makeLevel("Chinh phục Java", 7, ["public", "static", "main()", "try", "catch", "List<T>", "JVM"], "#9eafd9", "#604a45", "Trận cuối Java: né Exception, vượt gai và thu thập những mảnh ghép JVM.", "KHÓ", "Bạn đã chinh phục cả ba thế giới của Knowledge Quest! Hành trình tri thức khép lại, nhưng hành trình biết ơn và học hỏi vẫn tiếp tục.", {
        groundEnemies:[{segment:0,offset:330,speed:1.5,direction:1,color:"#cf6a4b"},{segment:1,offset:130,speed:1.7,direction:-1,type:"hopper",color:"#e5a44f"},{segment:2,offset:165,speed:1.65,direction:1,color:"#cf6a4b"},{segment:4,offset:155,speed:1.85,direction:-1,type:"hopper",color:"#e5a44f"}],
        flyers:[{x:900,y:220,minX:820,maxX:1080,speed:1.95,direction:1,color:"#6474b7"},{x:1680,y:195,minX:1570,maxX:1850,speed:1.85,direction:-1,color:"#6474b7"},{x:2180,y:185,minX:2070,maxX:2350,speed:2.1,direction:1,color:"#6474b7"}],
        hazards:[330,760,1180,1600,2070,2500],movingPlatforms:[{x:590,y:380,w:100,axis:"x",range:78,speed:.037},{x:1110,y:375,w:105,axis:"y",range:68,speed:.043},{x:1640,y:385,w:100,axis:"x",range:95,speed:.044},{x:2240,y:345,w:105,axis:"y",range:62,speed:.048}],
        card:"#ffd78a",cardEdge:"#ad743f",cardFace:"#fff8ed"
      })
    ]
  }
];

let worldIndex = 0;
let levelIndex = 0;
let levelData = worldData[worldIndex].levels;
let completedWorlds = [false, false, false];
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
  // Keep the pixel-art shapes, but render lettering with normal antialiasing.
  // A subtle shadow is clearer than the thick stroke used by the old helper.
  ctx.save();
  ctx.font = `700 ${size}px "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  ctx.shadowColor = "rgba(25, 40, 68, 0.28)";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0.6;
  ctx.shadowOffsetY = 0.8;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y, maxWidth);
  ctx.restore();
}

function makePlatform(x, y, width, height = 18, movement = null) {
  return { x, y, baseX: x, baseY: y, w: width, h: height, movement, phase: (x + y) * 0.013, dx: 0, dy: 0 };
}

function buildLevel(index) {
  const base = [
    ...GROUND_SEGMENTS.map((segment) => makePlatform(segment.x, FLOOR, segment.w, 100)),
    makePlatform(260, 355, 130), makePlatform(500, 300, 120),
    makePlatform(770, 355, 130), makePlatform(985, 300, 125),
    makePlatform(1240, 350, 135), makePlatform(1510, 300, 130),
    makePlatform(1760, 350, 135), makePlatform(2040, 295, 135)
  ];
  (levelData[index].movingPlatforms || []).forEach((item) => {
    base.push(makePlatform(item.x, item.y, item.w, 16, { axis: item.axis, range: item.range, speed: item.speed }));
  });
  return base;
}

function makeGroundEnemy(type, x, segmentIndex, speed, direction, color = "#e66d6d") {
  const segment = GROUND_SEGMENTS[segmentIndex];
  const w = type === "hopper" ? 35 : 34;
  const h = type === "hopper" ? 32 : 27;
  const patrolMin = segment.x + 22;
  const patrolMax = segment.x + segment.w - w - 22;
  return {
    type, x: Math.max(patrolMin, Math.min(x, patrolMax)), y: FLOOR - (type === "hopper" ? 34 : 29),
    patrolMin, patrolMax, speed, direction, w, h, color,
    ...(type === "hopper" ? { jumpTimer: 0 } : {})
  };
}

function buildEnemies(index) {
  const definition = levelData[index];
  const list = (definition.groundEnemies || []).map((item) => makeGroundEnemy(
    item.type || "crawler",
    GROUND_SEGMENTS[item.segment].x + item.offset,
    item.segment,
    item.speed,
    item.direction,
    item.color || "#e66d6d"
  ));
  (definition.flyers || []).forEach((item, i) => list.push({
    type: "flyer", x: item.x, y: item.y, originY: item.y,
    minX: item.minX, maxX: item.maxX, speed: item.speed, direction: item.direction,
    w: 34, h: 26, phase: i * 1.5, color: item.color || "#8b72c7"
  }));
  return list;
}

function buildHazards(index) {
  const positions = levelData[index].hazards || [];
  return positions.map((x) => {
    const width = 36;
    const supported = GROUND_SEGMENTS.some((segment) =>
      x >= segment.x + 18 && x + width <= segment.x + segment.w - 18
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
    return { x: pos[0], y: pos[1], w: 132, h: 48, label, got: false, phase: itemIndex * 0.9 };
  });
  goal = { x: 2570, y: FLOOR - 92, w: 42, h: 92 };

  $("hudWorld").textContent = `KNOWLEDGE QUEST • WORLD 0${worldIndex + 1}: ${worldData[worldIndex].short}`;
  $("hudLevel").textContent = `LEVEL 0${index + 1} • ${levelData[index].name}`;
  $("scoreText").textContent = `0 / ${levelData[index].need}`;
  $("livesText").textContent = "♥ ♥ ♥";
  $("objectiveText").textContent = levelData[index].hint;
  $("difficultyText").textContent = levelData[index].difficulty;
  updateProgress();
  showScreen("gameScreen");
  $("overlay").classList.remove("hidden");
  $("overlayEyebrow").textContent = `WORLD 0${worldIndex + 1} • ${worldData[worldIndex].short} • LEVEL 0${index + 1}`;
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
  const world = worldData[worldIndex];
  const palette = world.palette;
  rect(0, 0, W, H, data.sky);
  for (let i = 0; i < 8; i++) {
    const x = ((i * 185 - cameraX * 0.22) % (W + 150) + W + 150) % (W + 150) - 70;
    rect(x, 68 + (i % 3) * 42, 72, 17, "#efffff");
    rect(x + 17, 51 + (i % 3) * 42, 43, 18, "#efffff");
  }
  rect(0, 380, W, 78, palette.land);
  for (let i = 0; i < 12; i++) {
    const x = i * 120 - (cameraX * 0.34 % 120);
    rect(x, 354, 76, 29, palette.distant);
  }
  if (worldIndex === 1) {
    // JavaScript world: small glowing data nodes in a lush forest.
    for (let i = 0; i < 7; i++) {
      const x = ((i * 157 - cameraX * 0.16) % (W + 120) + W + 120) % (W + 120) - 50;
      rect(x, 150 + (i % 3) * 43, 5, 5, "#fff0a5");
      rect(x + 14, 164 + (i % 2) * 40, 3, 11, "#fff0a5");
    }
    pixelLabel("{ }", 865, 115, 20, "#fff5c6");
  } else if (worldIndex === 2) {
    // Java world: fortress towers behind the platforms.
    const shift = (cameraX * 0.12) % 260;
    [30, 300, 570, 840].forEach((baseX, i) => {
      const x = baseX - shift;
      rect(x, 265 + (i % 2) * 18, 38, 92, "#7188b7");
      rect(x + 8, 242 + (i % 2) * 18, 22, 25, "#7188b7");
      rect(x + 15, 285 + (i % 2) * 18, 8, 24, "#d8e2ff");
    });
    pixelLabel("JAVA", 860, 115, 17, "#fff3d6");
  } else {
    pixelLabel("</>", 860, 115, 17, "#fff3d6");
  }
}

function drawPlatforms() {
  platforms.forEach((platform) => {
    const x = platform.x - cameraX;
    if (x + platform.w < -5 || x > W + 5) return;
    rect(x, platform.y, platform.w, platform.h, levelData[levelIndex].ground);
    rect(x, platform.y, platform.w, 8, levelData[levelIndex].platformTop);
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
  const level = levelData[levelIndex];
  collectibles.forEach((item) => {
    if (item.got) return;

    const x = Math.round(item.x - cameraX);
    const y = Math.round(item.y + Math.sin(item.phase) * 5);
    const w = item.w;
    const h = item.h;
    if (x < -w - 20 || x > W + 20) return;

    // Large knowledge card: clear border, readable tag text and consistent sizing.
    rect(x + 5, y - 2, w, h, "#263858");
    rect(x, y - 5, w, h, level.cardEdge);
    rect(x + 3, y - 2, w - 6, h - 6, level.card);
    rect(x + 7, y + 1, w - 14, 5, "#fff1b7");
    rect(x + 7, y + 10, w - 14, 27, level.cardFace);
    rect(x + 10, y + 41, 14, 3, level.cardEdge);
    rect(x + w - 24, y + 41, 14, 3, level.cardEdge);

    ctx.save();
    let fontSize = 17;
    const maxTextWidth = w - 24;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#263858";
    ctx.font = `800 ${fontSize}px "Segoe UI", Arial, sans-serif`;
    // Shrink only when necessary; do not use fillText(maxWidth), which
    // horizontally squashes glyphs and makes tags look distorted.
    while (ctx.measureText(item.label).width > maxTextWidth && fontSize > 11) {
      fontSize -= 0.5;
      ctx.font = `800 ${fontSize}px "Segoe UI", Arial, sans-serif`;
    }
    ctx.fillText(item.label, x + w / 2, y + 24);
    ctx.restore();

    pixelLabel("✦", x + w / 2, y - 11, 13, "#fff8cf");
  });
}

function drawEnemy(enemy) {
  const x = enemy.x - cameraX;
  if (x < -60 || x > W + 60) return;
  if (enemy.type === "flyer") {
    rect(x + 5, enemy.y + 7, 25, 15, "#263858");
    rect(x + 2, enemy.y + 5, 25, 15, enemy.color || "#8b72c7");
    rect(x - 5, enemy.y + 1, 12, 8, "#d7c8ff");
    rect(x + 22, enemy.y + 1, 12, 8, "#d7c8ff");
    rect(x + 8, enemy.y + 9, 4, 4, "#fff"); rect(x + 19, enemy.y + 9, 4, 4, "#fff");
  } else if (enemy.type === "hopper") {
    rect(x + 4, enemy.y + 8, 28, 22, "#263858");
    rect(x + 2, enemy.y + 4, 28, 22, enemy.color || "#e3a34e");
    rect(x + 7, enemy.y + 10, 5, 5, "#fff"); rect(x + 20, enemy.y + 10, 5, 5, "#fff");
    rect(x + 5, enemy.y + 27, 7, 5, "#263858"); rect(x + 23, enemy.y + 27, 7, 5, "#263858");
  } else {
    rect(x + 5, enemy.y + 8, 25, 17, "#263858");
    rect(x + 2, enemy.y + 4, 25, 17, enemy.color || "#e66d6d");
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
  rect(x + 7, y - 7, 18, 8, worldIndex === 2 ? "#6d82c0" : worldIndex === 1 ? "#70aa67" : "#ed8b61");
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
  pixelLabel("MENTOR", x + 59, goal.y + 20, 15, "#263858");
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
    pixelLabel(toast, W / 2, 45, 15, "#fff0a5", "center", toastWidth - 28);
  }
}

function completeLevel() {
  running = false;
  cancelAnimationFrame(rafId);
  beep(950, 0.2);
  $("overlay").classList.remove("hidden");
  $("overlayEyebrow").textContent = `WORLD 0${worldIndex + 1} • LEVEL 0${levelIndex + 1} HOÀN THÀNH`;
  $("overlayTitle").textContent = "TUYỆT VỜI!";
  $("overlayText").textContent = levelData[levelIndex].message;
  if (levelIndex < levelData.length - 1) {
    $("overlayBtn").textContent = "SANG MÀN TIẾP THEO";
    $("overlayBtn").onclick = () => startLevel(levelIndex + 1);
  } else {
    $("overlayBtn").textContent = "HOÀN THÀNH THẾ GIỚI";
    $("overlayBtn").onclick = finishWorld;
  }
}

function renderLevelCards() {
  const world = worldData[worldIndex];
  $("levelWorldKicker").textContent = `KNOWLEDGE QUEST • WORLD 0${worldIndex + 1}: ${world.short}`;
  $("levelWorldTitle").textContent = `CHỌN MÀN CHƠI — ${world.short}`;
  $("levelWorldSummary").textContent = world.summary;
  $("levelGrid").innerHTML = world.levels.map((level, index) => `
    <button class="level-card active" data-level="${index}" type="button">
      <span class="level-icon">${level.icon}</span>
      <b>LEVEL 0${index + 1}</b>
      <strong>${level.name}</strong>
      <small>${level.hint}</small>
      <em>▶ CHƠI • ${level.difficulty}</em>
    </button>`).join("");
  document.querySelectorAll(".level-card").forEach((button) => {
    button.addEventListener("click", () => startLevel(Number(button.dataset.level)));
  });
}

function selectWorld(index) {
  worldIndex = Math.max(0, Math.min(index, worldData.length - 1));
  levelData = worldData[worldIndex].levels;
  renderLevelCards();
  showScreen("levelScreen");
}

function updateWorldStatuses() {
  ["openHtmlBtn", "openJsBtn", "openJavaBtn"].forEach((id, index) => {
    const button = $(id);
    const status = button.closest(".world-card").querySelector(".status-open");
    status.textContent = completedWorlds[index] ? "✓ ĐÃ HOÀN THÀNH • CHƠI LẠI" : "● 3 MÀN ĐÃ SẴN SÀNG";
  });
}

function finishWorld() {
  completedWorlds[worldIndex] = true;
  updateWorldStatuses();
  const world = worldData[worldIndex];
  $("endingEyebrow").textContent = `KNOWLEDGE QUEST • WORLD 0${worldIndex + 1} COMPLETED`;
  $("endingTitle").innerHTML = world.endingTitle;
  $("endingMessage").textContent = world.endingMessage;
  $("endingQuote").textContent = `“${world.endingQuote}”`;
  $("endingSignature").textContent = "— TỪ NHỮNG HỌC VIÊN CODEGYM —";
  $("endingReplayBtn").textContent = "CHƠI LẠI MAP";
  $("endingNextBtn").classList.toggle("hidden", worldIndex >= worldData.length - 1);
  showScreen("endingScreen");
}

$("startBtn").addEventListener("click", () => showScreen("mapScreen"));
$("backHomeBtn").addEventListener("click", () => showScreen("homeScreen"));
$("openHtmlBtn").addEventListener("click", () => selectWorld(0));
$("openJsBtn").addEventListener("click", () => selectWorld(1));
$("openJavaBtn").addEventListener("click", () => selectWorld(2));
$("backMapBtn").addEventListener("click", () => showScreen("mapScreen"));
$("pauseBtn").addEventListener("click", pauseGame);
$("quitBtn").addEventListener("click", () => {
  keys = Object.create(null);
  jumpWasDown = false;
  running = false;
  cancelAnimationFrame(rafId);
  showScreen("levelScreen");
});
$("endingReplayBtn").addEventListener("click", () => startLevel(0));
$("endingNextBtn").addEventListener("click", () => {
  if (worldIndex < worldData.length - 1) selectWorld(worldIndex + 1);
});
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

// Initial map screen metadata. The canvas is drawn when a level is selected.
updateWorldStatuses();
$("objectiveText").textContent = levelData[0].hint;
$("difficultyText").textContent = levelData[0].difficulty;
