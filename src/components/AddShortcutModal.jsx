import React, { useState, useEffect, useRef } from 'react';
import { STEAM_ICONS, WEB_ICONS, APP_ICONS, FOLDER_ICONS } from './ShortcutCard.jsx';

function AddShortcutModal({ onSave, onClose, editData }) {
  const [name, setName] = useState(editData?.name || '');
  const [type, setType] = useState(editData?.type || 'web');
  const [url, setUrl] = useState(editData?.url || '');
  const [steamId, setSteamId] = useState(editData?.steamId || '');
  const [path, setPath] = useState(editData?.path || '');
  const [icon, setIcon] = useState(editData?.icon || '');
  const [customImage, setCustomImage] = useState(editData?.customImage || '');
  const [closing, setClosing] = useState(false);
  const nameRef = useRef(null);

  useEffect(() => {
    nameRef.current?.focus();
    const handleEsc = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => onClose(), 280);
  };

  const icons = 
    type === 'steam' ? STEAM_ICONS : 
    type === 'web' ? WEB_ICONS : 
    type === 'app' ? APP_ICONS : 
    FOLDER_ICONS;

  const isValid = name.trim() && (
    (type === 'web' && url.trim()) ||
    (type === 'steam' && steamId.trim()) ||
    ((type === 'app' || type === 'folder') && path.trim())
  );

  const handleBrowse = async () => {
    try {
      const api = window.electronAPI;
      if (!api) return;
      const result = type === 'folder' ? await api.selectFolder() : await api.selectFile();
      if (result) {
        setPath(result);
        if (!name.trim()) {
          const lastPart = result.split('\\').pop().split('/').pop();
          setName(lastPart.replace(/\.exe$/i, ''));
        }
      }
    } catch (e) {
      console.error('Failed to browse', e);
    }
  };

  const handleImageUpload = async () => {
    try {
      const api = window.electronAPI;
      if (!api) return;
      const result = await api.selectImage();
      if (result) {
        setCustomImage(result);
        setIcon(''); // Clear emoji icon when custom image is set
      }
    } catch (e) {
      console.error('Failed to select image', e);
    }
  };

  const handleEmojiSelect = (ic) => {
    setIcon(ic);
    setCustomImage(''); // Clear custom image when emoji is selected
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;

    const shortcut = {
      ...(editData || {}),
      name: name.trim(),
      type,
      url: type === 'web' ? url.trim() : '',
      steamId: type === 'steam' ? steamId.trim() : '',
      path: (type === 'app' || type === 'folder') ? path.trim() : '',
      icon: customImage ? '' : (icon || icons[0]),
      customImage: customImage || '',
    };

    // Auto-prefix URL with https:// if needed
    if (shortcut.type === 'web' && shortcut.url && !shortcut.url.match(/^https?:\/\//)) {
      shortcut.url = 'https://' + shortcut.url;
    }

    onSave(shortcut);
  };

  return (
    <div className={`modal-overlay ${closing ? 'modal-closing' : ''}`} onClick={handleClose}>
      <div className={`modal ${closing ? 'modal-genie-out' : 'modal-genie-in'}`} onClick={(e) => e.stopPropagation()}>
        <h2>{editData ? '✏️ Edit Shortcut' : '✨ New Shortcut'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Type</label>
            <div className="type-selector" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className={`type-option web-type ${type === 'web' ? 'active' : ''}`}
                onClick={() => { setType('web'); setIcon(''); }}
              >
                <span className="type-emoji">🌐</span>
                Web URL
              </button>
              <button
                type="button"
                className={`type-option steam-type ${type === 'steam' ? 'active' : ''}`}
                onClick={() => { setType('steam'); setIcon(''); }}
              >
                <span className="type-emoji">🎮</span>
                Steam Game
              </button>
              <button
                type="button"
                className={`type-option app-type ${type === 'app' ? 'active' : ''}`}
                onClick={() => { setType('app'); setIcon(''); }}
              >
                <span className="type-emoji">🪟</span>
                Local App/Exe
              </button>
              <button
                type="button"
                className={`type-option folder-type ${type === 'folder' ? 'active' : ''}`}
                onClick={() => { setType('folder'); setIcon(''); }}
              >
                <span className="type-emoji">📁</span>
                Local Folder
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Name</label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Shortcut Name"
              id="shortcut-name-input"
            />
          </div>

          {type === 'web' && (
            <div className="form-group">
              <label>URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g. https://youtube.com"
                id="shortcut-url-input"
              />
            </div>
          )}
          
          {type === 'steam' && (
            <div className="form-group">
              <label>Steam App ID</label>
              <input
                type="text"
                value={steamId}
                onChange={(e) => setSteamId(e.target.value)}
                placeholder="e.g. 730 (CS2), 570 (Dota 2)"
                id="shortcut-steamid-input"
              />
            </div>
          )}

          {(type === 'app' || type === 'folder') && (
            <div className="form-group">
              <label>Path</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder={type === 'app' ? "C:\\Path\\To\\App.exe" : "C:\\Path\\To\\Folder"}
                  id="shortcut-path-input"
                  style={{ flex: 1 }}
                />
                <button 
                  type="button" 
                  onClick={handleBrowse}
                  className="btn-browse"
                >
                  Browse...
                </button>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Icon</label>
            <div className="icon-section">
              {/* Custom image upload */}
              <div className="custom-image-row">
                <button
                  type="button"
                  className={`custom-image-btn ${customImage ? 'has-image' : ''}`}
                  onClick={handleImageUpload}
                >
                  {customImage ? (
                    <img
                      src={`file://${customImage.replace(/\\/g, '/')}`}
                      alt="Custom"
                      className="custom-image-preview"
                    />
                  ) : (
                    <span className="upload-icon">📷</span>
                  )}
                </button>
                <span className="custom-image-label">
                  {customImage ? 'Custom image selected' : 'Upload custom image'}
                </span>
                {customImage && (
                  <button
                    type="button"
                    className="clear-image-btn"
                    onClick={() => { setCustomImage(''); }}
                  >
                    ✕
                  </button>
                )}
              </div>
              
              {/* Divider */}
              <div className="icon-divider">
                <span>or pick an emoji</span>
              </div>

              {/* Emoji picker */}
              <div className="icon-picker">
                {icons.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    className={`icon-picker-btn ${icon === ic && !customImage ? 'active' : ''}`}
                    onClick={() => handleEmojiSelect(ic)}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={!isValid} id="save-shortcut-btn">
              {editData ? 'Save Changes' : 'Add Shortcut'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddShortcutModal;
