\
```
██████╗  █████╗ ████████╗██╗ ██████╗ ██╗██████╗           ██████╗██╗     ██╗
██╔══██╗██╔══██╗╚══██╔══╝██║██╔═══██╗╚═╝██╔══██╗         ██╔════╝██║     ██║
██████╔╝███████║   ██║   ██║██║   ██║   ██║  ██║ ██████╗ ██║     ██║     ██║
██╔══██╗██╔══██║   ██║   ██║██║   ██║   ██║  ██║ ╚═════╝ ██║     ██║     ██║
██║  ██║██║  ██║   ██║   ██║╚██████╔╝   ██████╔╝         ╚██████╗███████╗██║
╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝    ╚═════╝           ╚═════╝╚══════╝╚═╝
```

**academia, straight to the terminal.**

> ⚠️ work in progress — not functional yet. this is the landing page for what's being built.

---

## what is this

ratio'd cli is a terminal interface for SRM's academia portal. same data as the web dashboard — attendance, marks, timetable, bunk calculator — but you never open a browser.

built with **Go** and **[Bubble Tea](https://github.com/charmbracelet/bubbletea)** for a proper interactive TUI.

---

## planned stack

| layer | tech |
|---|---|
| language | Go |
| tui framework | [Bubble Tea](https://github.com/charmbracelet/bubbletea) (charmbracelet) |
| styling | [Lip Gloss](https://github.com/charmbracelet/lipgloss) |
| http | Go standard `net/http` + the ratio'd backend API |
| auth | same AES-256 credential flow as the web app |
| landing page | Next.js (this repo) |

---

## planned features

- `ratio-d login` — authenticate once, credentials stored locally
- `ratio-d attendance` — view attendance with bunk calculator
- `ratio-d marks` — current internal marks + target calculator
- `ratio-d timetable` — today's / weekly schedule
- `ratio-d alerts` — configurable terminal notifications

---

## how it'll work

```
you
 │
 ▼
ratio-d (Go CLI / Bubble Tea TUI)
 │
 ▼
ratio'd backend API        ← same FastAPI servers as the web app
 │
 ▼
SRM academia portal
```

the CLI talks to the same backend that powers the web dashboard. no scraping happening on your machine — just API calls, rendered nicely in your terminal.

---

## status

| thing | status |
|---|---|
| landing page | ✅ done |
| go project scaffold | 🔜 |
| login flow | 🔜 |
| attendance view | 🔜 |
| marks view | 🔜 |
| timetable view | 🔜 |

---

## contributing

not ready for contributions yet since it barely exists. star it and check back later. or open an issue if you have ideas.

---

<div align="center">

part of the [ratio'd](https://github.com/projectakshith/ratio-d) ecosystem

</div>
