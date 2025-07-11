// src/components/Modal.js
import React from 'react';
import './Modal.css';

const Modal = ({ show, onClose, children }) => {
  if (!show) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
