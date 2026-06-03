import React, { useState } from 'react';

function TitleBar({ api }) {
  const [hovering, setHovering] = useState(false);

  return (
    <div className="titlebar">
      <div
        className={`titlebar-traffic ${hovering ? 'hovered' : ''}`}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <button
          className="traffic-btn close"
          onClick={() => api.closeWindow()}
          id="window-close-btn"
          aria-label="Close"
        >
          <svg width="8" height="8" viewBox="0 0 8 8">
            <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
        <button
          className="traffic-btn minimize"
          onClick={() => api.minimizeWindow()}
          id="window-minimize-btn"
          aria-label="Minimize"
        >
          <svg width="8" height="2" viewBox="0 0 8 2">
            <path d="M1 1H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
        <button
          className="traffic-btn maximize"
          onClick={() => api.maximizeWindow()}
          id="window-maximize-btn"
          aria-label="Maximize"
        >
          <svg width="8" height="8" viewBox="0 0 8 8">
            <path d="M0 2.5C0 1.12 1.12 0 2.5 0H5.5C6.88 0 8 1.12 8 2.5V5.5C8 6.88 6.88 8 5.5 8H2.5C1.12 8 0 6.88 0 5.5V2.5Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
      <div className="titlebar-title">LaunchPad</div>
      <div className="titlebar-spacer" />
    </div>
  );
}

export default TitleBar;
