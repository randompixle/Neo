import {BASE,getJSON,h,initTheme} from './common.js';
const INDEX = `${BASE}/Versions/Version_Index.json`;
function card(v){ return h('a',{class:'card',href:`./version.html?v=${encodeURIComponent(v.version)}`},[ h('div',{class:'card-title'},v.name), h('div',{class:'card-sub'},`Version ${v.version}`), h('div',{class:'card-foot'}, v.date?`Released ${v.date}`:'Release') ]); }
async function main(){ initTheme(); const wrap=document.getElementById('grid'); const data=await getJSON(INDEX); const all=(data.versions||[]).sort((a,b)=>(b.version||'').localeCompare(a.version||'')); all.forEach(v=>wrap.append(card(v))); }
main().catch(e=>{ document.getElementById('grid').innerHTML = `<div class="panel">Failed to load versions index: ${e}</div>`; });