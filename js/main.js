import { initializeScene } from './scene.js';
import { stories, themes } from './data.js';

const STORAGE_KEY = 'deltaArchivesPrefs';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore quota errors */
  }
}

function applyTheme(themeName = 'default') {
  const theme = themes[themeName] || themes.default;
  const root = document.body;

  root.style.setProperty('--bg-base', theme.base);
  root.style.setProperty('--bg-accent-one', theme.accentOne);
  root.style.setProperty('--bg-accent-two', theme.accentTwo);
  root.style.setProperty('--bg-accent-three', theme.accentThree);
  root.style.setProperty('--panel-border', theme.border);
  root.style.setProperty('--panel-surface', theme.panel);
  root.style.setProperty('--article-illustration-bg', theme.illustration);
}

/* ---------- Burger menu ---------- */
function initBurger() {
  const btn = document.getElementById('burger-btn');
  const nav = document.getElementById('primary-nav');
  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    btn.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      btn.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Открыть меню');
    });
  });
}

/* ---------- Story rendering & filtering ---------- */
const tropaHeadings = new Set([
  'Слово егерю:',
  'Дело о Тропе 17: новые подробности',
  '"Тропа 17: новые шокирующие подробности"',
  'Новые подозреваемые:',
  'Текущий статус расследования:',
  'Версии:',
  'Что дальше?',
  '"Тропа 17: разоблачение. Дело закрыто"',
  'Показания подсудимых',
  'Приговор',
  'Что было на самом деле?',
  'Расследование подтвердило:'
]);

const tropaLabels = new Set([
  'Константин Михайлович Иванов',
  'Геннадий Николаевич Попов',
  'Петр Зайцев (пожизненное заключение):',
  'Геннадий Попов (15 лет лишения свободы):',
  'Константин Иванов (15 лет лишения свободы):'
]);

function renderParagraphs(story) {
  const isDossier = story.id === 'tropa-17';

  return story.paragraphs
    .map((paragraph, index) => {
      if (!isDossier) {
        return `<p>${escapeHtml(paragraph)}</p>`;
      }

      if (tropaHeadings.has(paragraph)) {
        return `<h2 class="dossier-heading">${escapeHtml(paragraph)}</h2>`;
      }

      if (tropaLabels.has(paragraph)) {
        return `<h3 class="dossier-label">${escapeHtml(paragraph)}</h3>`;
      }

      if (
        paragraph.startsWith('Следователь:') ||
        paragraph.startsWith('Попов:') ||
        paragraph.startsWith('Иванов:') ||
        paragraph.startsWith('Зайцев (смеётся):') ||
        paragraph.startsWith('Психиатр:')
      ) {
        return `<p class="dossier-dialogue">${escapeHtml(paragraph)}</p>`;
      }

      if (paragraph.startsWith('"Тропа стала') || paragraph.startsWith('"Дальше идти нельзя')) {
        return `<blockquote class="dossier-quote">${escapeHtml(paragraph)}</blockquote>`;
      }

      if (
        (index >= 11 && index <= 13) ||
        (index >= 20 && index <= 27) ||
        (index >= 29 && index <= 31) ||
        (index >= 35 && index <= 37) ||
        (index >= 43 && index <= 45) ||
        (index >= 49 && index <= 51) ||
        (index >= 53 && index <= 55) ||
        (index >= 58 && index <= 60) ||
        (index >= 62 && index <= 64) ||
        (index >= 66 && index <= 68) ||
        (index >= 70 && index <= 72)
      ) {
        return `<p class="dossier-item">${escapeHtml(paragraph)}</p>`;
      }

      return `<p>${escapeHtml(paragraph)}</p>`;
    })
    .join('');
}

function cardHtml(story) {
  return `
    <article class="story-card" data-id="${escapeHtml(story.id)}" data-category="${escapeHtml(story.category)}">
      <span class="story-tag">${escapeHtml(story.category)}</span>
      <h3>${escapeHtml(story.title)}</h3>
      <p>${escapeHtml(story.excerpt)}</p>
      <div class="story-meta">
        <span>${escapeHtml(story.readingTime)}</span>
        <span>${escapeHtml(story.date)}</span>
      </div>
      <a class="card-link" href="./story.html?story=${encodeURIComponent(story.id)}">Читать рассказ</a>
    </article>
  `;
}

function initStoryGrid() {
  const storyGrid = document.getElementById('story-grid');
  const noResults = document.getElementById('no-results');
  const searchInput = document.getElementById('story-search');
  const tagFilters = document.getElementById('tag-filters');
  if (!storyGrid) return;

  const categories = [...new Set(stories.map((s) => s.category))];
  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tag-btn';
    btn.dataset.tag = cat;
    btn.textContent = cat;
    tagFilters.appendChild(btn);
  });

  let activeTag = 'all';
  let query = '';

  function render() {
    const filtered = stories.filter((story) => {
      const tagOk = activeTag === 'all' || story.category === activeTag;
      const q = query.trim().toLowerCase();
      const textOk =
        !q ||
        story.title.toLowerCase().includes(q) ||
        story.excerpt.toLowerCase().includes(q) ||
        story.category.toLowerCase().includes(q);
      return tagOk && textOk;
    });

    storyGrid.innerHTML = filtered.map(cardHtml).join('');
    if (noResults) {
      noResults.hidden = filtered.length > 0;
    }
  }

  tagFilters.addEventListener('click', (e) => {
    const btn = e.target.closest('.tag-btn');
    if (!btn) return;
    activeTag = btn.dataset.tag;
    tagFilters.querySelectorAll('.tag-btn').forEach((b) => b.classList.toggle('is-active', b === btn));
    render();
  });

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      query = searchInput.value;
      render();
    });
  }

  // Latest entry card from first story
  const latest = document.getElementById('latest-entry');
  if (latest && stories[0]) {
    const s = stories[0];
    latest.innerHTML = `
      <p class="small-label">Последняя запись</p>
      <h3>${escapeHtml(s.title)}</h3>
      <p>${escapeHtml(s.excerpt)}</p>
      <a class="card-link" href="./story.html?story=${encodeURIComponent(s.id)}">Читать</a>
    `;
  }

  render();
}

/* ---------- Story detail page ---------- */
function initArticle() {
  const articleContainer = document.getElementById('article-container');
  if (!articleContainer) return;

  const params = new URLSearchParams(window.location.search);
  const firstStory = stories[0];
  const storyId = params.get('story') || (firstStory && firstStory.id);
  const selectedStory = stories.find((story) => story.id === storyId) || stories[0];

  if (selectedStory) {
    applyTheme(selectedStory.theme || 'default');
    document.title = `${selectedStory.title} — Delta Archives`;

    articleContainer.innerHTML = `
      <header class="article-header">
        <p class="eyebrow">${escapeHtml(selectedStory.category)}</p>
        <h1>${escapeHtml(selectedStory.title)}</h1>
        <div class="article-meta">
          <span>${escapeHtml(selectedStory.date)}</span>
          <span>${escapeHtml(selectedStory.readingTime)}</span>
          <span>Рассказ</span>
        </div>
      </header>

      <div class="article-illustration" aria-hidden="true"></div>

      <article class="article-body ${selectedStory.id === 'tropa-17' ? 'article-body--dossier' : ''}">
        ${renderParagraphs(selectedStory)}
      </article>

      <footer class="article-footer">
        <a href="./index.html#stories">← Вернуться к рассказам</a>
      </footer>
    `;
  }
}

/* ---------- Account form ---------- */
function initAccount() {
  const form = document.getElementById('account-form');
  if (!form) return;

  const username = document.getElementById('username');
  const email = document.getElementById('email');
  const bgPreset = document.getElementById('bg-preset');
  const starDensity = document.getElementById('star-density');
  const cometFreq = document.getElementById('comet-freq');
  const starVal = document.getElementById('star-density-value');
  const cometVal = document.getElementById('comet-freq-value');
  const success = document.getElementById('form-success');
  const resetBtn = document.getElementById('reset-btn');

  const prefs = loadPrefs();

  if (prefs.username) username.value = prefs.username;
  if (prefs.email) email.value = prefs.email;
  if (prefs.bgPreset) {
    bgPreset.value = prefs.bgPreset;
    applyTheme(prefs.bgPreset);
  }
  if (prefs.starDensity != null) {
    starDensity.value = prefs.starDensity;
    starVal.textContent = prefs.starDensity;
  }
  if (prefs.cometFreq != null) {
    cometFreq.value = prefs.cometFreq;
    cometVal.textContent = prefs.cometFreq;
  }

  starDensity.addEventListener('input', () => {
    starVal.textContent = starDensity.value;
  });
  cometFreq.addEventListener('input', () => {
    cometVal.textContent = cometFreq.value;
  });

  bgPreset.addEventListener('change', () => {
    if (bgPreset.value) applyTheme(bgPreset.value);
  });

  function showError(id, show) {
    const el = document.getElementById(id);
    if (el) el.hidden = !show;
  }

  function validate() {
    let ok = true;

    const u = username.value.trim();
    const uValid = u.length >= 3 && u.length <= 30 && /^[A-Za-z0-9А-Яа-яЁё_\-]+$/.test(u);
    showError('username-error', !uValid);
    username.classList.toggle('is-invalid', !uValid);
    if (!uValid) ok = false;

    const e = email.value.trim();
    const eValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    showError('email-error', !eValid);
    email.classList.toggle('is-invalid', !eValid);
    if (!eValid) ok = false;

    const pValid = !!bgPreset.value;
    showError('bg-preset-error', !pValid);
    bgPreset.classList.toggle('is-invalid', !pValid);
    if (!pValid) ok = false;

    return ok;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    success.hidden = true;

    if (!validate()) return;

    const next = {
      username: username.value.trim(),
      email: email.value.trim(),
      bgPreset: bgPreset.value,
      starDensity: Number(starDensity.value),
      cometFreq: Number(cometFreq.value)
    };
    savePrefs(next);
    applyTheme(next.bgPreset);
    success.hidden = false;
  });

  resetBtn.addEventListener('click', () => {
    form.reset();
    starVal.textContent = '300';
    cometVal.textContent = '8';
    showError('username-error', false);
    showError('email-error', false);
    showError('bg-preset-error', false);
    username.classList.remove('is-invalid');
    email.classList.remove('is-invalid');
    bgPreset.classList.remove('is-invalid');
    success.hidden = true;
    applyTheme('default');
    savePrefs({});
  });
}

/* ---------- Boot ---------- */
const prefs = loadPrefs();
if (prefs.bgPreset) {
  applyTheme(prefs.bgPreset);
} else {
  applyTheme('default');
}

initializeScene();

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    initializeScene();
  }
});

initBurger();
initStoryGrid();
initArticle();
initAccount();
