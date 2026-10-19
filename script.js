const scenes = [...document.querySelectorAll(".scene")];
let currentIndex = 0;
let isAnimating = false;
// Chỉ cho lướt ngược về tối đa cảnh "A little piece of my heart." (intro),
// không cho quay lại cổng thư / câu đố mở khóa.
const MIN_BACK_INDEX = Math.max(0, scenes.findIndex(s => s.id === "intro"));
let bouquetTimer = null;

// -------------------------------------------------------------
// TỰ ĐỘNG PHÁT NHẠC NỀN SOUND.MP3
// -------------------------------------------------------------
const bgMusic = document.getElementById("bgMusic");
let musicStarted = false;

function playMusic() {
  if (!musicStarted && bgMusic) {
    bgMusic.play().then(() => {
      musicStarted = true;
    }).catch(err => {
      console.log("Trình duyệt chờ tương tác để phát nhạc:", err);
    });
  }
}

window.addEventListener("click", playMusic, { once: true });
window.addEventListener("touchstart", playMusic, { once: true });

// -------------------------------------------------------------
// 1. TỐI ƯU HIỆU NĂNG CANVAS: TRÁI TIM & LỜI YÊU THƯƠNG MỘT MÀU HỒNG
// -------------------------------------------------------------
const canvas = document.querySelector("#sky");
const ctx = canvas.getContext("2d");

let W = 0, H = 0, dpr = 1;
let fallingParticles = [];

const loveMessages = [
  "Love you", "Tớ thương cậu", "Thương cậu nhiều", 
  "My favorite person", "Forever Love", "My Love", 
  "Yêu thương", "Bình yên bên cậu", "Nhớ cậu"
];

// Định nghĩa duy nhất 1 tông màu hồng tình yêu rực rỡ
const LOVE_PINK = "#ff4d78"; 

function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = innerWidth;
  H = innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  initParticles();
}

function initParticles() {
  fallingParticles = [];
  const total = Math.min(110, Math.floor(W / 7));

  for (let i = 0; i < total; i++) {
    const isText = Math.random() < 0.35;
    fallingParticles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      speedY: Math.random() * 0.7 + 0.3,
      speedX: (Math.random() - 0.5) * 0.3,
      size: isText ? Math.random() * 4 + 10 : Math.random() * 8 + 6,
      text: isText ? loveMessages[Math.floor(Math.random() * loveMessages.length)] : (Math.random() < 0.6 ? "♥" : "♡"),
      color: LOVE_PINK, // Chỉ dùng duy nhất 1 màu hồng
      alpha: Math.random() * 0.65 + 0.35,
      isText: isText
    });
  }
}

function drawBackground() {
  ctx.clearRect(0, 0, W, H);

  let hasDead = false;
  fallingParticles.forEach(p => {
    let alpha = p.alpha;

    if (p.burst) {
      // hạt nổ: bay tỏa ra, chậm dần, mờ dần rồi biến mất
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.97;
      p.vy = p.vy * 0.97 + 0.015;
      p.life--;
      if (p.life <= 0) { p.dead = true; hasDead = true; return; }
      alpha = p.alpha * Math.min(1, p.life / 45);
    } else {
      p.y += p.speedY;
      p.x += p.speedX;

      if (p.y > H + 20) {
        p.y = -20;
        p.x = Math.random() * W;
      }
      if (p.x < -20) p.x = W + 20;
      if (p.x > W + 20) p.x = -20;
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.shadowBlur = p.isText ? 10 : 14;
    ctx.shadowColor = p.color; // Phát sáng hiệu ứng dạ quang màu hồng

    if (p.isText) {
      ctx.font = `500 ${p.size}px "DM Sans", sans-serif`;
      ctx.fillText(p.text, p.x, p.y);
    } else {
      ctx.font = `${p.size}px "Segoe UI", sans-serif`;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.restore();
  });

  if (hasDead) fallingParticles = fallingParticles.filter(p => !p.dead);

  requestAnimationFrame(drawBackground);
}

// -------------------------------------------------------------
// 2. LOGIC CHUYỂN CẢNH TRƯỢT 1 CHIỀU & BẮT SỰ KIỆN
// -------------------------------------------------------------
function go(id) {
  const targetIndex = scenes.findIndex(s => s.id === id);
  if (targetIndex === -1) return;
  
  const changed = targetIndex !== currentIndex || scenes[targetIndex].classList.contains("active") === false;
  currentIndex = targetIndex;
  updateScenes();

  if (changed && id !== "gate") {
    sweepTransition();
    burstHearts(id === "collage" ? 16 : 22);
  }

  clearTimeout(collageTimer);
  clearTimeout(bouquetTimer);

  if (id === "fireworks") launchFireworksEffect();
  if (id === "bouquet") {
    // Khi bó hoa nhô lên xong thì tung một đợt tim chúc mừng
    bouquetTimer = setTimeout(() => {
      if (scenes[currentIndex] && scenes[currentIndex].id === "bouquet") burstHearts(46, true);
    }, 2100);
  }
  if (id === "letter") typeLetter();
  if (id === "collage") {
    // Khi 20 ảnh ghép xong (~4.4s) thì bắn một đợt tim chúc mừng
    clearTimeout(collageTimer);
    collageTimer = setTimeout(() => {
      if (scenes[currentIndex] && scenes[currentIndex].id === "collage") burstHearts(48, true);
    }, 4400);
  }
}

let collageTimer = null;

// Vệt sáng quét ngang màn hình
function sweepTransition() {
  const el = document.createElement("div");
  el.className = "scene-sweep";
  document.body.appendChild(el);
  el.addEventListener("animationend", () => el.remove(), { once: true });
}

// Nổ tim hồng tỏa ra từ giữa màn hình (hoặc từ phía dưới trái tim ảnh)
function burstHearts(count = 24, fromHeart = false) {
  const cx = W / 2;
  const cy = fromHeart ? H * 0.5 : H * 0.55;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 2;
    const isText = Math.random() < 0.08;
    fallingParticles.push({
      x: cx + (Math.random() - 0.5) * 40,
      y: cy + (Math.random() - 0.5) * 40,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.2,
      life: 70 + Math.random() * 50,
      burst: true,
      size: isText ? 12 + Math.random() * 3 : Math.random() * 10 + 8,
      text: isText ? loveMessages[Math.floor(Math.random() * loveMessages.length)] : (Math.random() < 0.65 ? "♥" : "♡"),
      color: LOVE_PINK,
      alpha: 0.95,
      isText: isText
    });
  }
}

function updateScenes() {
  scenes.forEach((s, idx) => {
    s.classList.remove("active", "previous");
    if (idx === currentIndex) {
      s.classList.add("active");
      s.scrollTop = 0;
    } else if (idx < currentIndex) {
      s.classList.add("previous");
    }
  });
}

function nextScene() {
  // Không cho vuốt/cuộn bỏ qua câu đố mở khóa.
  if (scenes[currentIndex] && scenes[currentIndex].id === "quiz") return;
  if (currentIndex < scenes.length - 1 && !isAnimating) {
    lockAnimation();
    const targetId = scenes[currentIndex + 1].id;
    go(targetId);
  }
}

function prevScene() {
  if (isAnimating || currentIndex <= MIN_BACK_INDEX) return;
  // Cảnh dài đang cuộn giữa chừng thì để người dùng cuộn nội dung, không lật cảnh
  const sc = scenes[currentIndex];
  if (sc && sc.scrollTop > 2) return;
  lockAnimation();
  go(scenes[currentIndex - 1].id);
}

function lockAnimation() {
  isAnimating = true;
  setTimeout(() => { isAnimating = false; }, 1000);
}

// Lắng nghe CLICK
const openEnvEl = document.querySelector("#openEnvelope");
if (openEnvEl) {
  openEnvEl.addEventListener("click", () => {
    playMusic();
    nextScene();
  });
}

const birthdayForm = document.querySelector("#birthdayForm");
const birthdayAnswer = document.querySelector("#birthdayAnswer");
const quizFeedback = document.querySelector("#quizFeedback");

// ---- Hàm flash overlay khi chuyển cảnh ----
function flashTransition(callback, delay = 0) {
  const flash = document.createElement("div");
  flash.className = "scene-flash";
  document.body.appendChild(flash);
  setTimeout(() => {
    callback();
    flash.addEventListener("animationend", () => flash.remove(), { once: true });
  }, delay);
}

const lockWrap    = document.querySelector("#lockWrap");
const quizGlow    = document.querySelector("#quizGlow");
const lockRipple  = document.querySelector("#lockRipple");

// ---- Rung khi sai ----
function shakeWrongLock() {
  lockWrap.classList.remove("shake");
  void lockWrap.offsetWidth; // reflow để reset animation
  lockWrap.classList.add("shake");
  lockWrap.addEventListener("animationend", () => lockWrap.classList.remove("shake"), { once: true });
}

// ---- Mở khóa khi đúng ----
function unlockAndGo() {
  lockWrap.classList.add("unlocking");
  quizGlow.classList.add("unlocked");
  // Sau 1.1s (khi animation [đủ thời gian xem hiệu ứng]), chuyển cảnh với flash
  setTimeout(() => {
    flashTransition(() => go("intro"), 200);
  }, 1100);
}

birthdayForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const answer = birthdayAnswer.value.replace(/\s/g, "");

  if (answer === "26032005") {
    quizFeedback.classList.remove("error");
    quizFeedback.textContent = "Đúng rồi, công chúa của tớ! Trái tim đã nhận ra cậu ♥";
    birthdayAnswer.disabled = true;
    birthdayForm.querySelector("button").disabled = true;
    birthdayForm.querySelector("button").style.opacity = "0.7";
    unlockAndGo();
  } else {
    quizFeedback.classList.remove("error");
    void quizFeedback.offsetWidth;
    quizFeedback.classList.add("error");
    quizFeedback.textContent = "Hmm… trái tim vẫn chưa nhận ra chủ nhân rồi. Thử lại nhé, công chúa ♥";
    shakeWrongLock();
    birthdayAnswer.select();
  }
});

birthdayAnswer.addEventListener("input", () => {
  birthdayAnswer.value = birthdayAnswer.value.replace(/[^0-9]/g, "").slice(0, 8);
});

document.querySelector("#openGift").addEventListener("click", () => go("fireworks"));
document.querySelector("#toHeart").addEventListener("click", () => go("heart"));
document.querySelector("#toLetter").addEventListener("click", () => go("letter"));
document.querySelector("#toMemories").addEventListener("click", () => go("card"));
document.querySelector("#toFilmFromCard").addEventListener("click", () => go("film"));
document.querySelector("#toCollage").addEventListener("click", () => go("collage"));
document.querySelector("#toBouquet").addEventListener("click", () => go("bouquet"));
document.querySelector("#restart").addEventListener("click", () => {
  typed = false;
  document.querySelector("#typedMessage").textContent = "";
  // Reset lại lock về trạng thái ban đầu
  lockWrap.classList.remove("unlocking", "shake");
  quizGlow.classList.remove("unlocked");
  birthdayAnswer.disabled = false;
  birthdayAnswer.value = "";
  birthdayForm.querySelector("button").disabled = false;
  birthdayForm.querySelector("button").style.opacity = "";
  quizFeedback.classList.remove("error");
  quizFeedback.textContent = "Chỉ người biết câu trả lời mới mở được món quà này ♥";
  go("intro");
});

// Lắng nghe VUỐT TAY: vuốt lên = cảnh kế tiếp, vuốt xuống = quay lại (tối đa tới cảnh intro)
let touchStartY = 0, touchStartX = 0;
let touchEndY = 0, touchEndX = 0;

window.addEventListener("touchstart", (e) => {
  touchStartY = e.touches[0].clientY;
  touchStartX = e.touches[0].clientX;
}, { passive: true });

window.addEventListener("touchend", (e) => {
  touchEndY = e.changedTouches[0].clientY;
  touchEndX = e.changedTouches[0].clientX;
  handleSwipe();
}, { passive: true });

function handleSwipe() {
  if (currentIndex === 0) return;
  const dy = touchStartY - touchEndY;
  const dx = touchStartX - touchEndX;
  if (Math.abs(dx) > Math.abs(dy)) return; // vuốt ngang thì bỏ qua
  if (dy > 50) nextScene();
  else if (dy < -50) prevScene();
}

// Lắng nghe CUỘN CHUỘT
window.addEventListener("wheel", (e) => {
  if (currentIndex === 0) return;
  if (e.deltaY > 30) nextScene();
  else if (e.deltaY < -30) prevScene();
}, { passive: true });

function launchFireworksEffect() {
  if (fallingParticles.length > 220) return;
  for (let i = 0; i < 25; i++) {
    fallingParticles.push({
      x: Math.random() * W,
      y: Math.random() * (H / 2),
      speedY: Math.random() * 1.2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 10 + 8,
      text: "♥",
      color: LOVE_PINK,
      alpha: 1,
      isText: false
    });
  }
}

// Nội dung bức thư & gõ chữ tự động
const letterText = `Tớ chẳng biết dùng từ nào để kể hết cảm giác của mình, nên tớ chỉ muốn nói những điều thật lòng nhất.

Từ khi có cậu, những ngày bình thường cũng có thêm điều để mong chờ. Tớ nhớ những câu chuyện nhỏ, những lần cùng cười, và cả cảm giác bình yên khi được ở cạnh cậu.

Tớ không hứa mọi ngày đều hoàn hảo. Nhưng tớ muốn luôn chân thành, biết lắng nghe và cùng cậu tạo nên thật nhiều kỷ niệm đẹp.

Cảm ơn cậu vì đã xuất hiện trong thế giới của tớ. Tớ thương cậu. ♥`;

let typed = false;
function typeLetter() {
  if (typed) return; 
  typed = true;
  const el = document.querySelector("#typedMessage"); 
  let i = 0;
  const timer = setInterval(() => {
    el.textContent = letterText.slice(0, i++);
    if (i > letterText.length) clearInterval(timer);
  }, 24);
}

// -------------------------------------------------------------
// 3. BÓ HOA: cắt ảnh thành các lát ngang để từng bông hoa đung đưa
// -------------------------------------------------------------
function buildBouquet() {
  const strips = document.querySelector("#bqStrips");
  if (!strips) return;
  const N = 36;
  const P1 = 7, P2 = 3.4;

  // Biên độ & pha theo độ cao t (0 = ngọn hoa, 1 = chân bó)
  const sway = (t) => {
    const w1 = Math.pow(Math.max(0, 1 - t / 0.92), 1.7);
    const w2 = Math.max(0, 1 - t / 0.6);
    return {
      "--a":  (2.4 * w1).toFixed(3) + "%",
      "--a2": (0.75 * w2).toFixed(3) + "%",
      "--p1": P1 + "s",
      "--p2": P2 + "s",
      "--ph":  (-P1 * 0.3 * t).toFixed(3) + "s",
      "--ph2": (-P2 * 0.6 * t).toFixed(3) + "s"
    };
  };

  for (let i = 0; i < N; i++) {
    const t = (i + 0.5) / N;
    const strip = document.createElement("div");
    strip.className = "bq-strip";
    strip.style.setProperty("--top", (i / N * 100) + "%");
    strip.style.setProperty("--h", `calc(${100 / N}% + 1px)`);
    const inner = document.createElement("div");
    inner.className = "bq-strip-in";
    inner.style.backgroundImage = 'url("photos/bouquet.webp")';
    inner.style.setProperty("--size", (N * 100) + "%");
    inner.style.setProperty("--pos", (i / (N - 1) * 100) + "%");
    const vars = sway(t);
    Object.keys(vars).forEach(k => strip.style.setProperty(k, vars[k]));
    strip.appendChild(inner);
    strips.appendChild(strip);
  }

  // Chữ trên thẻ/tag đung đưa cùng nhịp với lát ảnh ở cùng độ cao
  document.querySelectorAll(".bq-follow").forEach(el => {
    const vars = sway(parseFloat(el.dataset.t));
    Object.keys(vars).forEach(k => el.style.setProperty(k, vars[k]));
  });

  // Cánh hoa rơi
  const petals = document.querySelector("#bqPetals");
  for (let i = 0; i < 16; i++) {
    const p = document.createElement("span");
    p.className = "bq-petal";
    p.style.setProperty("--x", (Math.random() * 96 + 2) + "%");
    p.style.setProperty("--s", (Math.random() * 9 + 9) + "px");
    p.style.setProperty("--t", (Math.random() * 6 + 8) + "s");
    p.style.setProperty("--d", (-Math.random() * 12) + "s");
    petals.appendChild(p);
  }

  // Chạm vào bó hoa: lắc mạnh một nhịp + tim bay ra
  const flower = document.querySelector("#bqFlower");
  const tap = document.querySelector("#bqTap");
  flower.addEventListener("click", () => {
    tap.classList.remove("wiggle");
    void tap.offsetWidth;
    tap.classList.add("wiggle");
    tap.addEventListener("animationend", () => tap.classList.remove("wiggle"), { once: true });
    burstHearts(14, true);
  });
}
buildBouquet();

// Khởi chạy Canvas
window.addEventListener("resize", resizeCanvas);
resizeCanvas();
drawBackground();