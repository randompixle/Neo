import {BASE,getJSON,h,sha256hex,initNavigation,initTheme} from './common.js';

function renderNotFound(){
  const title=document.getElementById('ver-title');
  if(title){
    title.textContent='Version not found';
  }
  const kv=document.getElementById('kv');
  if(kv){
    kv.innerHTML='';
    kv.append(h('div',{},'Sorry!'),h('div',{},'That release is missing.'));
  }
  const changelog=document.getElementById('changelog');
  if(changelog){
    changelog.textContent='No changelog available.';
  }
}

async function loadChangelog(entry){
  const target=document.getElementById('changelog');
  if(!target){
    return;
  }

  if(!entry?.folder){
    target.textContent='No changelog found.';
    return;
  }

  const basePath = entry.changelog
    ? entry.changelog.replace(/^\/+/, '')
    : `${entry.folder}/Release/CHANGELOG.md`;

  try{
    const response=await fetch(`${BASE}/Versions/${basePath}`,{cache:'no-store'});
    if(!response.ok){
      throw new Error(`fetch changelog ${response.status}`);
    }
    target.textContent=await response.text();
  }catch(err){
    console.error(err);
    target.textContent='No changelog found.';
  }
}

async function main(){
  initTheme();
  initNavigation();
  const p=new URLSearchParams(location.search);
  const ver=p.get('v');
  const data=await getJSON(`${BASE}/Versions/Version_Index.json`);
  const versions=Array.isArray(data?.versions)?data.versions:[];
  const entry=versions.find(x=>x.version===ver)||versions[0];
  if(!entry){
    renderNotFound();
    return;
  }
  const title=document.getElementById('ver-title');
  if(title){
    title.textContent=`${entry.name} — ${entry.version}`;
  }
  const kv=document.getElementById('kv');
  if(kv){
    kv.innerHTML='';
    [['Version',entry.version],['Codename',entry.codename||'—'],['Released',entry.date||'—'],['Channel',entry.channel||'stable']].forEach(([k,v])=>{
      kv.append(h('div',{},k),h('div',{},v));
    });
  }

  const zipUrl = entry.folder ? `${BASE}/Versions/${entry.folder}/Release.zip` : null;
  const dl=document.getElementById('dl');
  if(dl){
    if(zipUrl){
      dl.href=zipUrl;
    }else{
      dl.removeAttribute('href');
    }
  }

  if(entry.sha256){
    const sha=document.getElementById('sha-known');
    if(sha){
      sha.textContent=entry.sha256;
    }
  }

  const verify=document.getElementById('verify');
  if(verify){
    verify.addEventListener('click',async()=>{
      const out=document.getElementById('verify-out');
      if(!out){
        return;
      }
      out.textContent='Computing…';
      try{
        if(!zipUrl){
          throw new Error('missing zip path');
        }
        const r=await fetch(zipUrl);
        if(!r.ok){
          throw new Error(`fetch zip ${r.status}`);
        }
        const b=await r.arrayBuffer();
        out.textContent=await sha256hex(b);
      }catch(e){
        console.error(e);
        out.textContent='Verification failed (CORS?)';
      }
    });
  }

  await loadChangelog(entry);
}

main();
