const STARS_COUNT = 300;
const COMET_INTERVAL = 8000;
const MAX_COMETS_PER_WAVE = 7;

function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

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

function destroyScene(scene) {
  if (!scene) return;

  if (scene.rafId) cancelAnimationFrame(scene.rafId);
  if (scene.cometIntervalId) clearInterval(scene.cometIntervalId);
  scene.cometLaunchTimeouts.forEach(timeoutId => clearTimeout(timeoutId));

  scene.onResize && window.removeEventListener('resize', scene.onResize);
  scene.onMouseMove && document.removeEventListener('mousemove', scene.onMouseMove);
  scene.onVisibilityChange && document.removeEventListener('visibilitychange', scene.onVisibilityChange);

  if (scene.background) clearElement(scene.background);
  if (scene.cometsLayer) clearElement(scene.cometsLayer);

  const context = scene.linesCanvas && scene.linesCanvas.getContext('2d');
  if (context && scene.width && scene.height) {
    context.clearRect(0, 0, scene.width, scene.height);
  }

  const cometsContext = scene.cometsCanvas && scene.cometsCanvas.getContext('2d');
  if (cometsContext && scene.width && scene.height) {
    cometsContext.clearRect(0, 0, scene.width, scene.height);
  }
}

export function initializeScene() {
  if (window.__deltaArchiveScene) {
    destroyScene(window.__deltaArchiveScene);
  }

  const background = document.getElementById('background');
  const linesCanvas = document.getElementById('star-lines');
  const cometsCanvas = document.getElementById('comets-canvas');
  const cometsLayer = document.getElementById('comets');

  if (!background || !linesCanvas || !cometsCanvas || !cometsLayer) {
    return;
  }

  const linesContext = linesCanvas.getContext('2d');
  const cometsContext = cometsCanvas.getContext('2d');
  if (!linesContext || !cometsContext) {
    return;
  }

  const scene = {
    background,
    linesCanvas,
    cometsCanvas,
    cometsLayer,
    width: window.innerWidth,
    height: window.innerHeight,
    activeComets: [],
    cometLaunchTimeouts: new Set(),
    cometIntervalId: null,
    cursorPosition: null,
    targetOffset: { x: 0, y: 0 },
    currentOffset: { x: 0, y: 0 },
    rafId: null,
    onResize: null,
    onMouseMove: null,
    onVisibilityChange: null,
  };

  window.__deltaArchiveScene = scene;

  function createStars() {
    clearElement(background);
    for (let index = 0; index < STARS_COUNT; index++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.top = `${Math.random() * scene.height}px`;
      star.style.left = `${Math.random() * scene.width}px`;
      star.style.setProperty('--glow-duration', `${2.5 + Math.random() * 4}s`);
      star.style.setProperty('--glow-delay', `${Math.random() * -6}s`);
      background.appendChild(star);
    }
  }

  function resizeCanvases() {
    const pixelRatio = window.devicePixelRatio || 1;
    scene.width = window.innerWidth;
    scene.height = window.innerHeight;
    linesCanvas.width = scene.width * pixelRatio;
    linesCanvas.height = scene.height * pixelRatio;
    linesContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    cometsCanvas.width = scene.width * pixelRatio;
    cometsCanvas.height = scene.height * pixelRatio;
    cometsContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function drawStarConnections() {
    linesContext.clearRect(0, 0, scene.width, scene.height);
    if (!scene.cursorPosition) return;

    const nearbyStars = [...document.querySelectorAll('.star')]
      .map(star => {
        const bounds = star.getBoundingClientRect();
        const x = bounds.left + bounds.width / 2;
        const y = bounds.top + bounds.height / 2;
        return { x, y, distance: Math.hypot(x - scene.cursorPosition.x, y - scene.cursorPosition.y) };
      })
      .filter(star => star.distance < 230)
      .sort((first, second) => first.distance - second.distance)
      .slice(0, 12);

    nearbyStars.forEach(star => {
      const opacity = 0.42 * (1 - star.distance / 230);
      linesContext.beginPath();
      linesContext.moveTo(scene.cursorPosition.x, scene.cursorPosition.y);
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
    for (let firstIndex = 0; firstIndex < scene.activeComets.length; firstIndex++) {
      const first = scene.activeComets[firstIndex];
      if (!first.alive || !first.collisionPossible) continue;
      for (let secondIndex = firstIndex + 1; secondIndex < scene.activeComets.length; secondIndex++) {
        const second = scene.activeComets[secondIndex];
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
        scene.cometLaunchTimeouts.delete(launchTimeout);
        scene.activeComets.push(new Comet(scene.width, scene.height, index % 2 === 1, collisionPossible));
      }, index * 1200 + Math.random() * 700);
      scene.cometLaunchTimeouts.add(launchTimeout);
    }
  }

  function clearPendingComets() {
    scene.cometLaunchTimeouts.forEach(timeoutId => window.clearTimeout(timeoutId));
    scene.cometLaunchTimeouts.clear();
    scene.activeComets.length = 0;
    cometsContext.clearRect(0, 0, scene.width, scene.height);
    clearElement(cometsLayer);
  }

  function animateScene() {
    scene.currentOffset.x += (scene.targetOffset.x - scene.currentOffset.x) * 0.08;
    scene.currentOffset.y += (scene.targetOffset.y - scene.currentOffset.y) * 0.08;
    background.style.transform = `translate(${scene.currentOffset.x}px, ${scene.currentOffset.y}px)`;
    drawStarConnections();
    scene.activeComets.forEach(comet => comet.update(scene.width, scene.height));
    checkCometCollisions();
    for (let index = scene.activeComets.length - 1; index >= 0; index--) {
      if (!scene.activeComets[index].alive) scene.activeComets.splice(index, 1);
    }
    cometsContext.clearRect(0, 0, scene.width, scene.height);
    scene.activeComets.forEach(comet => comet.draw(cometsContext));
    scene.rafId = requestAnimationFrame(animateScene);
  }

  scene.onMouseMove = (event) => {
    scene.cursorPosition = { x: event.clientX, y: event.clientY };
    scene.targetOffset.x = (event.clientX / window.innerWidth - 0.5) * 20;
    scene.targetOffset.y = (event.clientY / window.innerHeight - 0.5) * 20;
  };

  scene.onVisibilityChange = () => {
    if (document.hidden) {
      window.clearInterval(scene.cometIntervalId);
      scene.cometIntervalId = null;
      clearPendingComets();
    } else if (scene.cometIntervalId === null) {
      scene.cometIntervalId = window.setInterval(launchCometWave, COMET_INTERVAL);
    }
  };

  scene.onResize = () => {
    createStars();
    resizeCanvases();
  };

  createStars();
  resizeCanvases();
  animateScene();
  scene.cometIntervalId = window.setInterval(launchCometWave, COMET_INTERVAL);

  document.addEventListener('mousemove', scene.onMouseMove);
  document.addEventListener('visibilitychange', scene.onVisibilityChange);
  window.addEventListener('resize', scene.onResize);
}