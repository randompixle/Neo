import {BASE,getJSON,h,sha256hex,initTheme} from './common.js';
async function main(){
  initTheme();
  const p=new URLSearchParams(location.search);
  const ver=p.get('v');
  const data=await getJSON(`${BASE}/Versions/Version_Index.json`);
  const entry=(data.versions||[]).find(x=>x.version===ver)||(data.versions||[])[0];
  if(!entry){ document.getElementById('content').innerHTML='<div class="panel">Version not found.</div>'; return; }
  document.getElementById('ver-title').textContent = `${entry.name} — ${entry.version}`;
  const kv=document.getElementById('kv'); kv.innerHTML=''; [['Version',entry.version],['Codename',entry.codename||'—'],['Released',entry.date||'—'],['Channel',entry.channel||'stable']].forEach(([k,v])=>{ kv.append(h('div',{},k),h('div',{},v)); });
  const zipUrl = `${BASE}/Versions/${entry.folder}/Release.zip`; const dl=document.getElementById('dl'); dl.href = zipUrl;
  if(entry.sha256) document.getElementById('sha-known').textContent = entry.sha256;
  document.getElementById('verify').addEventListener('click', async ()=>{ const out=document.getElementById('verify-out'); out.textContent='Computing…'; try{ const r=await fetch(zipUrl); const b=await r.arrayBuffer(); out.textContent = await sha256hex(b);}catch(e){ out.textContent='Verification failed (CORS?)'; } });
  try{ const md = await (await fetch(`${BASE}/Versions/${entry.folder}/CHANGELOG.md`)).text(); document.getElementById('changelog').textContent = md; }catch(e){ document.getElementById('changelog').textContent='No changelog found.'; }
}
main();