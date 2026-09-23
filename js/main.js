import { initializeScene } from './scene.js';
import { stories, themes } from './data.js';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
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

      if (paragraph.startsWith('Следователь:') || paragraph.startsWith('Попов:') || paragraph.startsWith('Иванов:') || paragraph.startsWith('Зайцев (смеётся):') || paragraph.startsWith('Психиатр:')) {
        return `<p class="dossier-dialogue">${escapeHtml(paragraph)}</p>`;
      }

      if (paragraph.startsWith('"Тропа стала') || paragraph.startsWith('"Дальше идти нельзя')) {
        return `<blockquote class="dossier-quote">${escapeHtml(paragraph)}</blockquote>`;
      }

      if (index >= 11 && index <= 13 || index >= 20 && index <= 27 || index >= 29 && index <= 31 || index >= 35 && index <= 37 || index >= 43 && index <= 45 || index >= 49 && index <= 51 || index >= 53 && index <= 55 || index >= 58 && index <= 60 || index >= 62 && index <= 64 || index >= 66 && index <= 68 || index >= 70 && index <= 72) {
        return `<p class="dossier-item">${escapeHtml(paragraph)}</p>`;
      }

      return `<p>${escapeHtml(paragraph)}</p>`;
    })
    .join('');
}

initializeScene();

const storyGrid = document.getElementById('story-grid');
const articleContainer = document.getElementById('article-container');

if (storyGrid) {
  applyTheme('default');

  storyGrid.innerHTML = stories
    .map(
      (story) => `
        <article class="story-card">
          <span class="story-tag">${escapeHtml(story.category)}</span>
          <h3>${escapeHtml(story.title)}</h3>
          <p>${escapeHtml(story.excerpt)}</p>
          <div class="story-meta">
            <span>${escapeHtml(story.readingTime)}</span>
            <span>${escapeHtml(story.date)}</span>
          </div>
          <a class="card-link" href="./story.html?story=${story.id}">Читать рассказ</a>
        </article>
      `
    )
    .join('');
}

if (articleContainer) {
  const params = new URLSearchParams(window.location.search);
  const storyId = params.get('story') || stories[0]?.id;
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