import React from 'react';

function Toast({ message, icon }) {
  return (
    <div className="toast" role="status">
      <span>{icon}</span>
      <span>{message}</span>
    </div>
  );
}

export default Toast;
