import { BASE, getJSON, initTheme } from './common.js';

function normalizeVersion(value) {
  if (value == null) return null;
  const text = String(value).trim();
  if (!text) return null;
  return text.replace(/^v/i, '');
}

function extractVersion(entry) {
  if (!entry) return null;
  if (entry.version) return entry.version;
  const fromFolder = typeof entry.folder === 'string'
    ? entry.folder.match(/\d+(?:\.\d+)*/)
    : null;
  if (fromFolder && fromFolder[0]) return fromFolder[0];
  const fromName = typeof entry.name === 'string'
    ? entry.name.match(/\d+(?:\.\d+)*/)
    : null;
  return fromName && fromName[0] ? fromName[0] : null;
}

function formatDisplayVersion(value) {
  const normalized = normalizeVersion(value);
  if (!normalized) return null;
  return `v${normalized}`;
}

function pickLatest(entries) {
  if (!Array.isArray(entries)) return null;
  const sorted = entries
    .filter(Boolean)
    .sort((a, b) => {
      const av = normalizeVersion(extractVersion(a) ?? '');
      const bv = normalizeVersion(extractVersion(b) ?? '');
      if (!av && !bv) return 0;
      if (!av) return 1;
      if (!bv) return -1;
      return bv.localeCompare(av, undefined, { numeric: true, sensitivity: 'base' });
    });
  return sorted.find(entry => extractVersion(entry));
}

function replaceToken(template, token, value) {
  if (typeof template !== 'string') return template;
  return template.split(token).join(value);
}

function updateBadge(version) {
  const badge = document.querySelector('[data-role="version-badge"]');
  if (!badge) return;
  const template = badge.dataset.template || badge.textContent;
  const fallback = badge.dataset.fallback || badge.textContent;
  if (version) {
    badge.textContent = replaceToken(template, '{version}', version);
  } else if (fallback) {
    badge.textContent = fallback;
  }
}

function updateMessage(version) {
  const message = document.querySelector('[data-role="version-message"]');
  if (!message) return;
  const prefix = message.dataset.prefix || '';
  const suffix = message.dataset.suffix || '';
  const fallback = message.dataset.fallback || message.textContent;
  if (version) {
    message.textContent = `${prefix}${version}${suffix}`;
  } else if (fallback) {
    message.textContent = fallback;
  }
}

function updateDownloadLabels(version) {
  document.querySelectorAll('[data-role="download-latest"]').forEach(el => {
    const template = el.dataset.labelTemplate || el.textContent;
    const fallback = el.dataset.fallback || el.textContent;
    if (version && template) {
      el.textContent = replaceToken(template, '{version}', version);
    } else if (fallback) {
      el.textContent = fallback;
    }
  });
}

function updateVersionCount(count) {
  document.querySelectorAll('[data-role="version-count"]').forEach(el => {
    const template = el.dataset.template || el.textContent;
    const fallback = el.dataset.fallback || el.textContent;
    if (typeof count === 'number' && Number.isFinite(count)) {
      el.textContent = replaceToken(template, '{count}', String(count));
    } else if (fallback) {
      el.textContent = fallback;
    }
  });
}

async function hydrateSiteMetadata() {
  let entries = [];
  try {
    const data = await getJSON(`${BASE}/Versions/Version_Index.json`);
    entries = Array.isArray(data?.versions) && data.versions.length
      ? data.versions
      : Array.isArray(data?.files)
        ? data.files
        : [];
  } catch (error) {
    console.error('Failed to load Version_Index.json', error);
  }

  const latest = pickLatest(entries);
  const versionValue = latest ? extractVersion(latest) : null;
  const displayVersion = formatDisplayVersion(versionValue);
  const versionCount = entries.filter(entry => extractVersion(entry)).length;

  updateBadge(displayVersion);
  updateMessage(displayVersion);
  updateDownloadLabels(displayVersion);
  updateVersionCount(versionCount);
}

initTheme();
hydrateSiteMetadata();
