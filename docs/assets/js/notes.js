(function () {
  const NOTES_JSON_URL = "../../notes/notes.json";
  const SUBMIT_URL     = "../../cgi-bin/submit_note.py";

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else node.setAttribute(k, v);
    });
    [].concat(children).forEach(c => node.appendChild(c));
    return node;
  }

  async function loadNotes() {
    const list = document.getElementById("notes-list");
    try {
      const res = await fetch(NOTES_JSON_URL, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const notes = await res.json();
      if (!Array.isArray(notes) || notes.length === 0) {
        list.textContent = "No notes yet.";
        return;
      }
      list.textContent = "";
      notes.slice().reverse().forEach(n => {
        const when = new Date(n.timestamp || Date.now());
        const card = document.createElement("div");
        card.className = "note-card";
        const meta = document.createElement("div");
        meta.className = "note-meta";
        meta.textContent = `${n.author || "anonymous"} — ${when.toLocaleString()}`;
        const text = document.createElement("div");
        text.className = "note-text";
        text.textContent = n.text || "";
        card.appendChild(meta);
        card.appendChild(text);
        list.appendChild(card);
      });
    } catch (e) {
      list.textContent = "Failed to load notes.";
      console.error(e);
    }
  }

  async function submitNote(ev) {
    ev.preventDefault();
    const msg = document.getElementById("note-msg");
    msg.textContent = "";

    const author = document.getElementById("author").value.trim();
    const text   = document.getElementById("text").value.trim();
    const key    = document.getElementById("key").value.trim();

    if (!/^\d{4}$/.test(key)) {
      msg.textContent = "Key must be 4 digits.";
      return;
    }
    if (!text) {
      msg.textContent = "Please write a note.";
      return;
    }

    try {
      const res = await fetch(SUBMIT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, text, key })
      });
      let data = {};
      try { data = await res.json(); } catch (_) {}
      if (!res.ok || !data.ok) {
        msg.textContent = data && data.error ? `Error: ${data.error}` : `Server error (${res.status})`;
        return;
      }
      msg.textContent = "Saved!";
      document.getElementById("text").value = "";
      document.getElementById("key").value = "";
      await loadNotes();
    } catch (e) {
      console.error(e);
      msg.textContent = "Network error. Try again.";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("note-form");
    if (form) form.addEventListener("submit", submitNote);
    loadNotes();
  });
})();