import {BASE, getJSON, h, initTheme} from './common.js';

function normalizeFile(entry, file) {
  if (!file) return { name: 'Download', path: null };
  if (typeof file === 'string') {
    return { name: file, path: `${entry.folder || ''}/${file}` };
  }
  const name = file.name || (file.path ? file.path.split('/').pop() : 'Download');
  const path = file.path ?? (file.name ? `${entry.folder || ''}/${file.name}` : null);
  return { name, path };
}

function buildCard(entry) {
  const title = entry.name && entry.version
    ? `${entry.name} — ${entry.version}`
    : entry.name || entry.version || entry.folder || 'Version';

  const details = [];
  if (entry.codename) details.push(h('div', { class: 'card-sub' }, `Codename: ${entry.codename}`));
  if (entry.channel) details.push(h('div', { class: 'card-sub' }, `Channel: ${entry.channel}`));
  if (entry.date) details.push(h('div', { class: 'card-sub' }, `Released: ${entry.date}`));

  const fileEntries = Array.isArray(entry.files) && entry.files.length
    ? entry.files
    : (entry.folder ? [{ name: 'Release.zip', path: `${entry.folder}/Release.zip` }] : []);

  const actions = fileEntries
    .map(file => {
      const meta = normalizeFile(entry, file);
      if (!meta.path) return null;
      const cleanPath = meta.path.replace(/^\/+/, '');
      const url = `${BASE}/Versions/${cleanPath}`;
      return h('a', { class: 'btn', href: url }, meta.name);
    })
    .filter(Boolean);

  if (entry.version) {
    actions.push(h('a', { class: 'btn', href: `./version.html?v=${encodeURIComponent(entry.version)}` }, 'Details'));
  }

  const footer = actions.length
    ? h('div', { class: 'card-foot' }, actions)
    : h('div', { class: 'card-foot' }, 'No downloadable files.');

  return h('div', { class: 'card' }, [
    h('div', { class: 'card-title' }, title),
    ...details,
    footer,
  ]);
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    const av = a.version || a.folder || '';
    const bv = b.version || b.folder || '';
    return bv.localeCompare(av, undefined, { numeric: true, sensitivity: 'base' });
  });
}

async function main() {
  initTheme();
  const grid = document.getElementById('grid');
  if (!grid) return;
  grid.innerHTML = '<div class="panel">Loading…</div>';

  try {
    const data = await getJSON(`${BASE}/Versions/Version_Index.json`);
    const entries = Array.isArray(data?.versions) && data.versions.length
      ? data.versions
      : Array.isArray(data?.files)
        ? data.files
        : [];

    if (!entries.length) {
      grid.innerHTML = '';
      grid.append(h('div', { class: 'panel' }, 'No versions found in /Versions.'));
      return;
    }

    grid.innerHTML = '';
    sortEntries(entries).forEach(entry => grid.append(buildCard(entry)));
  } catch (error) {
    console.error(error);
    grid.innerHTML = '';
    grid.append(h('div', { class: 'panel' }, 'Failed to load versions directory.'));
  }
}

main();
