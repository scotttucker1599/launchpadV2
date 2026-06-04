# 🚀 LaunchPad

A sleek, macOS-inspired desktop Stream Deck app for launching your favorite websites, Steam games, local applications, and folders — all from one beautiful dashboard.

![LaunchPad Preview](public/icon.png)

## ✨ Features

- **🌐 Web URLs** — Open any website (launches in Chrome by default)
- **🎮 Steam Games** — Launch Steam games by App ID
- **🪟 Local Apps** — Launch any `.exe`, `.bat`, or `.cmd` file
- **📁 Folders** — Quick-open any folder on your system
- **🖼️ Custom Icons** — Upload your own images as shortcut icons, or pick from emoji
- **✨ Genie Animations** — macOS-style genie effect when launching shortcuts and opening modals
- **🎨 macOS Dark UI** — Frosted glass, traffic light window controls, smooth micro-animations
- **💾 Persistent Storage** — All shortcuts are saved locally and persist across restarts

## 📦 Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
- [Git](https://git-scm.com/)

### Clone & Install

```bash
cd "C:\Users\scott\Videos"/Exsampale
git clone https://github.com/scotttucker1599/launchpadV2.git
cd launchpad
npm install
```

### Run in Development Mode

```bash
npm run dev
```

This starts both the Vite dev server and Electron together. The app will open automatically with hot-reload enabled.

### Build a Standalone Executable / Installer

#### Windows (Portable Folder)
```bash
npm run package:win
```
This builds a portable folder in `release-builds/` where you can run `LaunchPad.exe` directly without installation.

#### Windows (Single-File Installer)
```bash
npm run dist:win
```
This builds a standard single-file Windows setup installer (`LaunchPad Setup 1.0.0.exe`) under the `release/` folder, which installs the app and sets up Start Menu/Desktop shortcuts.

#### macOS (Portable Folder)
```bash
npm run package:mac
```

#### Linux (Portable Folder)
```bash
npm run package:linux
```

## 🛠️ Project Structure

```
launchpad/
├── electron/
│   ├── main.cjs          # Electron main process (IPC, window, file dialogs)
│   └── preload.cjs       # Context bridge (secure API for renderer)
├── src/
│   ├── components/
│   │   ├── AddShortcutModal.jsx   # Add/Edit shortcut modal
│   │   ├── ShortcutCard.jsx       # Individual shortcut tile
│   │   ├── TitleBar.jsx           # macOS-style title bar
│   │   └── Toast.jsx              # Notification toasts
│   ├── App.jsx            # Main app component
│   ├── index.css          # Full design system (dark theme, animations)
│   └── main.jsx           # React entry point
├── public/
│   ├── icon.png           # App icon (PNG)
│   └── icon.ico           # App icon (Windows ICO)
├── index.html             # HTML entry point
├── vite.config.js         # Vite configuration
└── package.json           # Dependencies & scripts
```

## 🎮 How to Find a Steam App ID

1. Go to the game's **Steam Store page** in your browser
2. The App ID is the number in the URL:
   `https://store.steampowered.com/app/`**`730`**`/Counter_Strike_2/`
3. Common examples:
   - **Counter-Strike 2**: `730`
   - **Dota 2**: `570`
   - **Cyberpunk 2077**: `1091500`

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## 📄 License

MIT License — do whatever you want with it.
