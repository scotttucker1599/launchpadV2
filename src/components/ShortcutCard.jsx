import React, { useState, useRef } from 'react';

const STEAM_ICONS = ['🎮', '🕹️', '🏆', '⚔️', '🔫', '🏎️', '🧩', '🎯', '👾', '🐉'];
const WEB_ICONS = ['🌐', '📺', '🎵', '📰', '💬', '📧', '🛒', '📸', '🎬', '📚'];
const APP_ICONS = ['🪟', '🚀', '💻', '🧰', '🔨', '⚡', '📊', '✏️', '📸', '🛡️'];
const FOLDER_ICONS = ['📁', '📂', '🗂️', '🗄️', '📥', '📦', '🖼️', '🎵', '📄', '🗃️'];

function ShortcutCard({ shortcut, onLaunch, onEdit, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const [launchState, setLaunchState] = useState('idle'); // idle | launching | launched
  const cardRef = useRef(null);

  const handleLaunch = () => {
    if (launchState !== 'idle') return;
    setLaunchState('launching');
    
    // Wait for the genie animation to finish before actually launching
    setTimeout(() => {
      onLaunch(shortcut);
      setLaunchState('launched');
      // After a pause, reverse the genie (app comes back)
      setTimeout(() => {
        setLaunchState('idle');
      }, 800);
    }, 500);
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    onEdit(shortcut);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    onDelete(shortcut.id);
  };

  const defaultIcon = shortcut.type === 'steam' ? '🎮' : shortcut.type === 'web' ? '🌐' : shortcut.type === 'app' ? '🪟' : '📁';
  const isCustomImage = shortcut.customImage && shortcut.customImage.length > 0;
  const displayIcon = shortcut.icon || defaultIcon;

  const genieClass = launchState === 'launching' ? 'genie-out' : launchState === 'launched' ? 'genie-in' : '';

  return (
    <div
      ref={cardRef}
      className={`shortcut-card type-${shortcut.type} ${genieClass}`}
      onClick={handleLaunch}
      id={`shortcut-${shortcut.id}`}
      title={shortcut.type === 'steam' ? `Steam ID: ${shortcut.steamId}` : shortcut.type === 'web' ? shortcut.url : shortcut.path}
    >
      {launchState === 'launching' && <div className="launch-ripple" />}

      <button className="card-menu-btn" onClick={handleMenuClick} aria-label="Options">
        ⋯
      </button>

      {showMenu && (
        <div className="card-dropdown" onClick={(e) => e.stopPropagation()}>
          <button onClick={handleEdit}>✏️ Edit</button>
          <button className="danger" onClick={handleDelete}>🗑️ Delete</button>
        </div>
      )}

      <span className="card-type-badge">
        {shortcut.type === 'steam' ? 'STEAM' : shortcut.type === 'web' ? 'WEB' : shortcut.type === 'app' ? 'APP' : 'FOLDER'}
      </span>

      <div className="card-icon">
        {isCustomImage ? (
          <img
            src={`local-media://${shortcut.customImage.replace(/\\/g, '/')}`}
            alt={shortcut.name}
            className="card-custom-image"
            draggable="false"
          />
        ) : (
          displayIcon
        )}
      </div>

      <span className="card-label">{shortcut.name}</span>
    </div>
  );
}

export { STEAM_ICONS, WEB_ICONS, APP_ICONS, FOLDER_ICONS };
export default ShortcutCard;
