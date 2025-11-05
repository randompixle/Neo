# Solar Neo
**A simple Linux package manager**

Solar Neo combines Flatpak and DNF support with update checks and a small community-powered notes system.  
Lightweight. Local. No account required (unless you’re a dev adding notes).

---

### What Solar Neo Does

- Install & remove apps
- Search packages
- Check for backend support (Flatpak / DNF5)
- View and add community notes for apps
- Developer-level notes with token authentication
- Self-update check via GitHub Releases

---

### Commands

```
solar install <package>
solar remove <package>
solar search <query>
solar sys
solar version
solar update
solar notes <app>
solar notes <app> add "<message>"
```

Example:
```
solar install com.obsproject.Studio
solar notes obs add "Great for creators"
```

---

### Install

```
chmod +x install.sh
./install.sh
```

> If needed, add this to PATH:
> `echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc`

---

### Requirements

| Component | Needed for |
|----------|------------|
| Python 3.7+ | Running Solar Neo |
| Flatpak or DNF5 | Installing apps |

---

### Status

Stable enough to use.  
Polishing / store / GUI (might be) coming soon.

Current version: **v0.7 “Astra”**
