const STARS_COUNT = 300;
const COMET_INTERVAL = 8000;
const MAX_COMETS_PER_WAVE = 7;

class Comet {
  constructor(width, height, fromRight, collisionPossible) {
    this.collisionPossible = collisionPossible;
    this.alive = true;

    const startX = fromRight
      ? width * (0.75 + Math.random() * 0.25)
      : width * (-0.12 + Math.random() * 0.25);
    const startY = height * (-0.18 + Math.random() * 0.38);

    this.x = startX;
    this.y = startY;

    const targetX = width * (0.3 + Math.random() * 0.4);
    const targetY = height * (0.3 + Math.random() * 0.4);
    const angle = Math.atan2(targetY - startY, targetX - startX);

    this.speed = 3 + Math.random() * 7;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.radius = 1.5 + Math.random() * 2;
    this.trail = [];
    this.maxTrail = 30 + Math.floor(Math.random() * 30);
    this.life = 0;
    this.maxLife = 140 + Math.floor(Math.random() * 260);
    this.fadeOutDuration = 50;
  }

  update(width, height) {
    this.life++;
    this.x += this.vx;
    this.y += this.vy;
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrail) this.trail.shift();

    const outOfScreen = this.x < -80 || this.x > width + 80 ||
      this.y < -80 || this.y > height + 80;
    if (outOfScreen || this.life >= this.maxLife) this.alive = false;
  }

  draw(context) {
    const remaining = this.maxLife - this.life;
    const fade = Math.min(1, remaining / this.fadeOutDuration);

    if (this.trail.length > 1) {
      for (let index = 1; index < this.trail.length; index++) {
        const trailProgress = index / this.trail.length;
        context.beginPath();
        context.moveTo(this.trail[index - 1].x, this.trail[index - 1].y);
        context.lineTo(this.trail[index].x, this.trail[index].y);
        context.strokeStyle = `rgba(200, 225, 255, ${trailProgress * trailProgress * fade})`;
        context.lineWidth = trailProgress * this.radius * 2.2;
        context.lineCap = 'round';
        context.stroke();
      }
    }

    const glow = context.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 5);
    glow.addColorStop(0, `rgba(255, 255, 255, ${fade})`);
    glow.addColorStop(0.3, `rgba(180, 215, 255, ${0.65 * fade})`);
    glow.addColorStop(1, 'rgba(180, 215, 255, 0)');
    context.fillStyle = glow;
    context.beginPath();
    context.arc(this.x, this.y, this.radius * 5, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = `rgba(255, 255, 255, ${fade})`;
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fill();
  }
}

export function initializeScene() {
  const background = document.getElementById('background');
  const linesCanvas = document.getElementById('star-lines');
  const linesContext = linesCanvas.getContext('2d');
  const cometsCanvas = document.getElementById('comets-canvas');
  const cometsContext = cometsCanvas.getContext('2d');
  const cometsLayer = document.getElementById('comets');
  const activeComets = [];
  const cometLaunchTimeouts = new Set();
  let cometIntervalId = null;
  let cursorPosition = null;
  let targetOffset = { x: 0, y: 0 };
  let currentOffset = { x: 0, y: 0 };
  let width = window.innerWidth;
  let height = window.innerHeight;

  function createStars() {
    background.replaceChildren();
    for (let index = 0; index < STARS_COUNT; index++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.top = `${Math.random() * window.innerHeight}px`;
      star.style.left = `${Math.random() * window.innerWidth}px`;
      star.style.setProperty('--glow-duration', `${2.5 + Math.random() * 4}s`);
      star.style.setProperty('--glow-delay', `${Math.random() * -6}s`);
      background.appendChild(star);
    }
  }

  function resizeCanvases() {
    const pixelRatio = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    linesCanvas.width = width * pixelRatio;
    linesCanvas.height = height * pixelRatio;
    linesContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    cometsCanvas.width = width * pixelRatio;
    cometsCanvas.height = height * pixelRatio;
    cometsContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function drawStarConnections() {
    linesContext.clearRect(0, 0, width, height);
    if (!cursorPosition) return;

    const nearbyStars = [...document.querySelectorAll('.star')]
      .map(star => {
        const bounds = star.getBoundingClientRect();
        const x = bounds.left + bounds.width / 2;
        const y = bounds.top + bounds.height / 2;
        return { x, y, distance: Math.hypot(x - cursorPosition.x, y - cursorPosition.y) };
      })
      .filter(star => star.distance < 230)
      .sort((first, second) => first.distance - second.distance)
      .slice(0, 12);

    nearbyStars.forEach(star => {
      const opacity = 0.42 * (1 - star.distance / 230);
      linesContext.beginPath();
      linesContext.moveTo(cursorPosition.x, cursorPosition.y);
      linesContext.lineTo(star.x, star.y);
      linesContext.strokeStyle = `rgba(150, 205, 255, ${opacity})`;
      linesContext.lineWidth = 1;
      linesContext.stroke();
    });
  }

  function createExplosion(x, y) {
    const explosion = document.createElement('span');
    explosion.className = 'comet-explosion';
    explosion.style.left = `${x}px`;
    explosion.style.top = `${y}px`;
    cometsLayer.appendChild(explosion);
    explosion.addEventListener('animationend', () => explosion.remove(), { once: true });
  }

  function checkCometCollisions() {
    for (let firstIndex = 0; firstIndex < activeComets.length; firstIndex++) {
      const first = activeComets[firstIndex];
      if (!first.alive || !first.collisionPossible) continue;
      for (let secondIndex = firstIndex + 1; secondIndex < activeComets.length; secondIndex++) {
        const second = activeComets[secondIndex];
        if (!second.alive || !second.collisionPossible) continue;
        if (Math.hypot(first.x - second.x, first.y - second.y) < 14) {
          createExplosion((first.x + second.x) / 2, (first.y + second.y) / 2);
          first.alive = false;
          second.alive = false;
          return;
        }
      }
    }
  }

  function launchCometWave() {
    if (document.hidden) return;
    const cometCount = Math.floor(Math.random() * (MAX_COMETS_PER_WAVE - 1)) + 2;
    const collisionPossible = Math.random() < 0.1;
    for (let index = 0; index < cometCount; index++) {
      const launchTimeout = window.setTimeout(() => {
        cometLaunchTimeouts.delete(launchTimeout);
        activeComets.push(new Comet(width, height, index % 2 === 1, collisionPossible));
      }, index * 1200 + Math.random() * 700);
      cometLaunchTimeouts.add(launchTimeout);
    }
  }

  function clearPendingComets() {
    cometLaunchTimeouts.forEach(timeoutId => window.clearTimeout(timeoutId));
    cometLaunchTimeouts.clear();
    activeComets.length = 0;
    cometsContext.clearRect(0, 0, width, height);
    cometsLayer.replaceChildren();
  }

  function animateScene() {
    currentOffset.x += (targetOffset.x - currentOffset.x) * 0.08;
    currentOffset.y += (targetOffset.y - currentOffset.y) * 0.08;
    background.style.transform = `translate(${currentOffset.x}px, ${currentOffset.y}px)`;
    drawStarConnections();
    activeComets.forEach(comet => comet.update(width, height));
    checkCometCollisions();
    for (let index = activeComets.length - 1; index >= 0; index--) {
      if (!activeComets[index].alive) activeComets.splice(index, 1);
    }
    cometsContext.clearRect(0, 0, width, height);
    activeComets.forEach(comet => comet.draw(cometsContext));
    requestAnimationFrame(animateScene);
  }

  createStars();
  resizeCanvases();
  animateScene();
  cometIntervalId = window.setInterval(launchCometWave, COMET_INTERVAL);

  document.addEventListener('mousemove', event => {
    cursorPosition = { x: event.clientX, y: event.clientY };
    targetOffset.x = (event.clientX / window.innerWidth - 0.5) * 20;
    targetOffset.y = (event.clientY / window.innerHeight - 0.5) * 20;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.clearInterval(cometIntervalId);
      cometIntervalId = null;
      clearPendingComets();
    } else if (cometIntervalId === null) {
      cometIntervalId = window.setInterval(launchCometWave, COMET_INTERVAL);
    }
  });
  window.addEventListener('resize', () => {
    createStars();
    resizeCanvases();
  });
}