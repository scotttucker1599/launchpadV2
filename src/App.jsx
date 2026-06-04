import React, { useState, useEffect, useCallback } from 'react';
import TitleBar from './components/TitleBar.jsx';
import ShortcutCard from './components/ShortcutCard.jsx';
import AddShortcutModal from './components/AddShortcutModal.jsx';
import Toast from './components/Toast.jsx';

// Check if running inside Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI;

// Fallback for browser-only dev
const api = isElectron
  ? window.electronAPI
  : {
      getShortcuts: async () => JSON.parse(localStorage.getItem('launchpad-shortcuts') || '[]'),
      saveShortcuts: async (s) => localStorage.setItem('launchpad-shortcuts', JSON.stringify(s)),
      launchShortcut: async (s) => {
        const url = s.type === 'steam' ? `steam://rungameid/${s.steamId}` : s.url;
        window.open(url, '_blank');
      },
      minimizeWindow: async () => {},
      maximizeWindow: async () => {},
      closeWindow: async () => {},
      selectFile: async () => prompt('Enter file path:'),
      selectFolder: async () => prompt('Enter folder path:'),
      selectImage: async () => prompt('Enter image path:'),
    };

function App() {
  const [shortcuts, setShortcuts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState(null);
  const [toast, setToast] = useState(null);
  const [isWindowGenieMinimizing, setIsWindowGenieMinimizing] = useState(false);

  // Load shortcuts on mount
  useEffect(() => {
    api.getShortcuts().then(setShortcuts);
  }, []);

  // Save shortcuts whenever they change
  const persistShortcuts = useCallback(async (newShortcuts) => {
    setShortcuts(newShortcuts);
    await api.saveShortcuts(newShortcuts);
  }, []);

  const showToast = (message, icon = '✅') => {
    setToast({ message, icon });
    setTimeout(() => setToast(null), 2500);
  };

  const handleAddShortcut = async (shortcut) => {
    const newShortcut = {
      ...shortcut,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    await persistShortcuts([...shortcuts, newShortcut]);
    setShowModal(false);
    showToast(`Added "${shortcut.name}"`);
  };

  const handleEditShortcut = async (shortcut) => {
    const updated = shortcuts.map(s => s.id === shortcut.id ? shortcut : s);
    await persistShortcuts(updated);
    setEditingShortcut(null);
    showToast(`Updated "${shortcut.name}"`, '✏️');
  };

  const handleDeleteShortcut = async (id) => {
    const target = shortcuts.find(s => s.id === id);
    const filtered = shortcuts.filter(s => s.id !== id);
    await persistShortcuts(filtered);
    showToast(`Removed "${target?.name}"`, '🗑️');
  };

  const handleLaunch = async (shortcut) => {
    await api.launchShortcut(shortcut);
    showToast(`Launching "${shortcut.name}"`, '🚀');
  };

  const handleMinimizeWindow = async () => {
    if (isWindowGenieMinimizing) return;
    setIsWindowGenieMinimizing(true);
    await api.minimizeWindow();
    setIsWindowGenieMinimizing(false);
  };

  return (
    <div className={`app-container ${isWindowGenieMinimizing ? 'window-genie-out' : ''}`}>
      <div className="bg-glow" />
      <TitleBar api={{ ...api, minimizeWindow: handleMinimizeWindow }} />

      <div className="app-content">
        <div className="header">
          <div>
            <h1>LaunchPad</h1>
            <p className="header-subtitle">
              {shortcuts.length} shortcut{shortcuts.length !== 1 ? 's' : ''} configured
            </p>
          </div>
          <button className="add-btn" onClick={() => setShowModal(true)} id="add-shortcut-btn">
            <span className="plus-icon">+</span>
            Add Shortcut
          </button>
        </div>

        {shortcuts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🚀</div>
            <h2>No shortcuts yet</h2>
            <p>Click "Add Shortcut" to create your first launch button for a website or Steam game.</p>
          </div>
        ) : (
          <div className="shortcuts-grid">
            {shortcuts.map(shortcut => (
              <ShortcutCard
                key={shortcut.id}
                shortcut={shortcut}
                onLaunch={handleLaunch}
                onEdit={(s) => setEditingShortcut(s)}
                onDelete={handleDeleteShortcut}
              />
            ))}
          </div>
        )}
      </div>

      {(showModal || editingShortcut) && (
        <AddShortcutModal
          onSave={editingShortcut ? handleEditShortcut : handleAddShortcut}
          onClose={() => { setShowModal(false); setEditingShortcut(null); }}
          editData={editingShortcut}
        />
      )}

      {toast && <Toast message={toast.message} icon={toast.icon} />}
    </div>
  );
}

export default App;
