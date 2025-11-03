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

export function initNavigation() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');
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
