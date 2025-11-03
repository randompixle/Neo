import {h} from './common.js';

const NOTES_PATH='notes/notes.json';
const SUBMIT_ENDPOINT='../cgi-bin/submit_note.py';

function setStatus(msgEl, type, text){
  if(!msgEl) return;
  msgEl.textContent=text;
  msgEl.classList.remove('ok','err');
  if(type) msgEl.classList.add(type);
}

function setNotesMessage(container, text, state){
  if(!container) return;
  container.dataset.state=state||'';
  container.setAttribute('aria-busy', state==='loading' ? 'true' : 'false');
  container.innerHTML='';
  container.append(h('div',{class:'notes-placeholder'},text));
}

function renderNotes(container, data){
  if(!container) return;
  const entries=Object.entries(data||{})
    .map(([pkg, list])=>[pkg, Array.isArray(list)?list.filter(item=>typeof item==='string'&&item.trim()):[]])
    .filter(([, list])=>list.length>0)
    .sort((a,b)=>a[0].localeCompare(b[0], undefined,{sensitivity:'base'}));

  if(entries.length===0){
    setNotesMessage(container,'No notes yet. Submit the first update to kick things off.','empty');
    return;
  }

  container.dataset.state='ready';
  container.setAttribute('aria-busy','false');
  container.innerHTML='';
  const frag=document.createDocumentFragment();
  for(const [pkg, list] of entries){
    const items=list.map(item=>h('li',{},item));
    frag.append(h('article',{class:'notes-package', role:'listitem'},[
      h('div',{class:'notes-package-title'},pkg),
      h('ul',{class:'notes-package-list'},items)
    ]));
  }
  container.append(frag);
}

export default function initNotesPage(){
  const notesList=document.querySelector('[data-notes]');
  if(!notesList) return;

  const msg=document.getElementById('msg');
  const submitBtn=document.getElementById('submit');
  const pkgInput=document.getElementById('pkg');
  const noteInput=document.getElementById('note');
  const passwordInput=document.getElementById('password');
  const refreshBtn=document.querySelector('[data-notes-refresh]');
  const defaultSubmitLabel=submitBtn?.textContent||'Submit note';

  async function loadNotes({showSpinner=true}={}){
    if(showSpinner){
      setNotesMessage(notesList,'Loading notes…','loading');
    }
    try{
      const res=await fetch(`../${NOTES_PATH}?cache=`+Date.now(),{cache:'no-store'});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload=await res.json();
      renderNotes(notesList,payload);
    }catch(err){
      console.error('Failed to load notes',err);
      setNotesMessage(notesList,'Unable to load notes. Serve the repo with `python -m http.server --cgi` and ensure notes/notes.json exists.','error');
    }
  }

  submitBtn?.addEventListener('click', async()=>{
    setStatus(msg,'','');
    const pkg=(pkgInput?.value||'').trim();
    const note=(noteInput?.value||'').trim();
    const password=(passwordInput?.value||'').trim();
    const password=(document.getElementById('password')?.value||'').trim();
    if(!password){ setStatus(msg,'err','Password is required.'); return; }
    if(!pkg||!note){ setStatus(msg,'err','Package and note are required.'); return; }
    if(submitBtn){
      submitBtn.disabled=true;
      submitBtn.setAttribute('aria-busy','true');
      submitBtn.textContent='Submitting…';
    }
    try{
      const res=await fetch(SUBMIT_ENDPOINT,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({password,pkg,note})
      });
      let out=null;
      try{ out=await res.json(); }catch{}
      if(!res.ok||!out?.ok){
        const err=out?.error||`Submission failed (${res.status})`;
        throw new Error(err);
      }
      setStatus(msg,'ok','Note submitted.');
      if(pkgInput) pkgInput.value='';
      if(noteInput) noteInput.value='';
      await loadNotes({showSpinner:false});
    }catch(e){
      setStatus(msg,'err',String(e?.message||e||'Unknown error'));
    }finally{
      if(submitBtn){
        submitBtn.disabled=false;
        submitBtn.removeAttribute('aria-busy');
        submitBtn.textContent=defaultSubmitLabel;
      }
    }
  });

  refreshBtn?.addEventListener('click', ()=>{
    loadNotes({showSpinner:true});
  });

  loadNotes({showSpinner:true});
}
