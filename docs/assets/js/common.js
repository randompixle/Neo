export const BASE = "..";

export async function getJSON(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`fetch ${path} ${response.status}`);
  }
  return response.json();
}

export function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') {
      el.className = value;
    } else {
      el.setAttribute(key, value);
    }
  }
  ([]).concat(children).forEach(child => {
    el.append(child instanceof Node ? child : document.createTextNode(child));
  });
  return el;
}

export function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('solar-theme', theme);
}

export function initTheme() {
  const stored = localStorage.getItem('solar-theme') || 'mixed';
  setTheme(stored);
  const button = document.getElementById('theme-btn');
  if (!button) {
    return;
  }
  button.textContent = `Theme: ${stored}`;
  button.addEventListener('click', () => {
    const current = localStorage.getItem('solar-theme') || 'mixed';
    const next = current === 'mixed'
      ? 'purple'
      : current === 'purple'
        ? 'dark'
        : 'mixed';
    setTheme(next);
    button.textContent = `Theme: ${next}`;
  });
}

function createBrand() {
  const brand = document.createElement('div');
  brand.className = 'header-brand';
  const logo = document.createElement('div');
  logo.className = 'logo';
  const title = document.createElement('div');
  title.className = 'title';
  title.textContent = 'Solar Neo';
  brand.append(logo, title);
  return brand;
}

function createThemeButton() {
  const button = document.createElement('button');
  button.id = 'theme-btn';
  button.className = 'btn theme-toggle';
  button.type = 'button';
  button.textContent = 'Theme: mixed';
  return button;
}

function createToggle() {
  const button = document.createElement('button');
  button.className = 'btn nav-toggle';
  button.type = 'button';
  button.setAttribute('data-nav-toggle', '');
  button.setAttribute('aria-controls', 'site-nav');
  button.setAttribute('aria-expanded', 'false');
  button.textContent = 'Menu';
  return button;
}

function buildNav() {
  const path = (location.pathname || '').toLowerCase();
  const normalized = path.endsWith('/') ? `${path}index.html` : path;
  const inDocs = normalized.includes('/docs/');
  const isDocsIndex = normalized.endsWith('/docs/index.html');
  const isDocsDocumentation = inDocs && normalized.endsWith('/documentation.html');
  const isDocsVersions = inDocs && (normalized.endsWith('/versions.html') || normalized.endsWith('/version.html'));
  const isDocsLatest = inDocs && normalized.endsWith('/latest.html');
  const isHome = !inDocs && normalized.endsWith('/index.html');

  const nav = document.createElement('nav');
  nav.className = 'header-nav';
  nav.id = 'site-nav';
  nav.setAttribute('data-nav', '');

  const items = [
    { label: 'Home', href: inDocs ? '../index.HTML' : './index.HTML', active: isHome },
    { label: 'Documentation', href: inDocs ? './documentation.html' : './docs/documentation.html', active: isDocsDocumentation || isDocsIndex },
    { label: 'Release history', href: inDocs ? './versions.html' : './docs/versions.html', active: isDocsVersions },
    { label: 'Latest download', href: inDocs ? './latest.html' : './docs/latest.html', active: isDocsLatest },
  ];

  items.forEach(item => {
    const link = document.createElement('a');
    link.className = 'btn';
    link.href = item.href;
    link.textContent = item.label;
    if (item.active) {
      link.setAttribute('aria-current', 'page');
    }
    nav.appendChild(link);
  });

  return nav;
}

function pickFirst(primary, rest, selector, fallback) {
  const nodes = [];
  nodes.push(...primary.querySelectorAll(selector));
  rest.forEach(header => nodes.push(...header.querySelectorAll(selector)));
  const [first, ...others] = nodes;
  others.forEach(node => node.remove());
  if (first) {
    if (first.parentElement !== primary) {
      primary.appendChild(first);
    }
    return first;
  }
  return fallback ? fallback() : null;
}

function coalesceNavigation() {
  const headers = Array.from(document.querySelectorAll('.header'));
  if (!headers.length) {
    return { header: null, nav: null, toggle: null };
  }

  const [primary, ...rest] = headers;

  const brand = pickFirst(primary, rest, '.header-brand', createBrand);
  const theme = pickFirst(primary, rest, '#theme-btn', createThemeButton);
  const toggle = pickFirst(primary, rest, '[data-nav-toggle]', createToggle);
  const nav = buildNav();

  rest.forEach(header => header.remove());

  primary.textContent = '';
  [brand, theme, toggle, nav].forEach(node => {
    if (node) {
      primary.appendChild(node);
    }
  });

  return { header: primary, nav, toggle };
}

export function initNavigation() {
  const { nav, toggle } = coalesceNavigation();
  if (!toggle || !nav) {
    return;
  }

  const links = Array.from(nav.querySelectorAll('a'));
  const mobileQuery = window.matchMedia('(max-width: 840px)');

  const apply = open => {
    nav.dataset.open = open ? 'true' : 'false';
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  apply(false);

  toggle.addEventListener('click', () => {
    const next = nav.dataset.open !== 'true';
    apply(next);
    if (next) {
      const first = links[0];
      if (first) {
        first.focus();
      }
    }
  });

  links.forEach(link => {
    link.addEventListener('click', () => {
      if (mobileQuery.matches) {
        apply(false);
      }
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobileQuery.matches && nav.dataset.open === 'true') {
      apply(false);
      toggle.focus();
    }
  });
}

export async function sha256hex(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}
