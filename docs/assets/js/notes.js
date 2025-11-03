const NOTES_PATH='notes/notes.json';
const SUBMIT_ENDPOINT='../cgi-bin/submit_note.py';

function setStatus(msgEl, type, text){
  if(!msgEl) return;
  msgEl.textContent=text;
  msgEl.classList.remove('ok','err');
  if(type) msgEl.classList.add(type);
}

export default function initNotesPage(){
  const notesBox=document.getElementById('notes');
  if(!notesBox) return;
  const msg=document.getElementById('msg');
  const submitBtn=document.getElementById('submit');
  const pkgInput=document.getElementById('pkg');
  const noteInput=document.getElementById('note');

  async function loadNotes(){
    try{
      const res=await fetch(`../${NOTES_PATH}?cache=`+Date.now());
      if(!res.ok) throw 0;
      const j=await res.json();
      const lines=[];
      for(const [pkg, arr] of Object.entries(j)){
        lines.push(`## ${pkg}`);
        for(const t of arr) lines.push(`- ${t}`);
        lines.push('');
      }
      notesBox.textContent=lines.join('\n').trim()||'No notes yet.';
    }catch{
      notesBox.textContent='No notes yet or failed to load.';
    }
  }

  submitBtn?.addEventListener('click', async()=>{
    setStatus(msg,'','');
    const pkg=(pkgInput?.value||'').trim();
    const note=(noteInput?.value||'').trim();
    const password=(document.getElementById('password')?.value||'').trim();
    if(!password){ setStatus(msg,'err','Password is required.'); return; }
    if(!pkg||!note){ setStatus(msg,'err','Package and note are required.'); return; }
    submitBtn.disabled=true;
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
      await loadNotes();
    }catch(e){ setStatus(msg,'err',String(e?.message||e||'Unknown error')); }
    finally{ submitBtn.disabled=false; }
  });

  loadNotes();
}
