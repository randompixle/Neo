
(async function(){
  const tbody = document.querySelector('#versions-table tbody');
  try {
    const res = await fetch('../Versions/Version_Index.json', {cache:'no-store'});
    if (!res.ok) throw new Error('index not found');
    const idx = await res.json();
    for (const item of idx.files || []) {
      const tr = document.createElement('tr');
      const a = document.createElement('a');
      a.href = `../Versions/${encodeURIComponent(item.path)}`;
      a.textContent = item.name;
      const tdv = document.createElement('td'); tdv.textContent = item.version || '-';
      const tdf = document.createElement('td'); tdf.appendChild(a);
      const tds = document.createElement('td'); tds.textContent = item.size || '-';
      tr.appendChild(tdv); tr.appendChild(tdf); tr.appendChild(tds);
      tbody.appendChild(tr);
    }
  } catch(e) {
    const tr = document.createElement('tr');
    const td = document.createElement('td'); td.colSpan = 3; td.textContent = 'No Version_Index.json or no files listed.';
    tr.appendChild(td); tbody.appendChild(tr);
  }
})();
