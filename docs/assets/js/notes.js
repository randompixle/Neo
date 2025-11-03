
const OWNER='randompixle', REPO='Solar-Neo', BRANCH='main';
const NOTES_PATH='notes/notes.json';
const notesBox=document.getElementById('notes');
const msg=document.getElementById('msg');
const submitBtn=document.getElementById('submit');

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
    notesBox.textContent=lines.join('\\n');
  }catch{ notesBox.textContent='No notes yet or failed to load.'; }
}
loadNotes();

function getToken(){ return localStorage.getItem('SOLAR_GH_TOKEN') || ''; }

async function shaOf(path){
  const r=await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`, {headers:{'Accept':'application/vnd.github+json'}});
  if(!r.ok) return null; const j=await r.json(); return j.sha||null;
}

async function readNotesFromGit(){
  const r=await fetch(`https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${NOTES_PATH}?cache=`+Date.now());
  if(!r.ok) return {}; try{ return await r.json(); }catch{ return {}; }
}

async function writeFileToGit(path, content, message){
  const token=getToken(); if(!token) throw new Error('No token in localStorage under SOLAR_GH_TOKEN');
  const sha=await shaOf(path);
  const body={ message, content:btoa(unescape(encodeURIComponent(content))), branch:BRANCH };
  if(sha) body.sha=sha;
  const r=await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
    method:'PUT', headers:{'Authorization':`Bearer ${token}`,'Accept':'application/vnd.github+json'}, body:JSON.stringify(body)
  });
  if(!r.ok){ throw new Error('GitHub write failed: '+await r.text()); }
  return await r.json();
}

submitBtn?.addEventListener('click', async()=>{
  msg.textContent='';
  const pkg=(document.getElementById('pkg').value||'').trim();
  const note=(document.getElementById('note').value||'').trim();
  if(!pkg||!note){ msg.textContent='Package and note are required.'; return; }
  submitBtn.disabled=true;
  try{
    const notes=await readNotesFromGit();
    if(!notes[pkg]) notes[pkg]=[];
    notes[pkg].push(note);
    const newContent=JSON.stringify(notes,null,2);
    await writeFileToGit(NOTES_PATH,newContent,`Add note for ${pkg}`);
    msg.textContent='Note submitted.';
    await loadNotes();
  }catch(e){ msg.textContent=String(e.message||e); }
  finally{ submitBtn.disabled=false; }
});
