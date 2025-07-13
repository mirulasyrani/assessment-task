import React, { useEffect, useRef } from 'react';
import './Modal.css';

const Modal = ({ show, onClose, children, ariaLabelledBy, ariaDescribedBy }) => {
  const modalRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null); // To store the element that opened the modal

  // Close when clicking backdrop
  const handleBackdropClick = (e) => {
    // Check if the click occurred directly on the backdrop, not on the modal-box content
    if (e.target.classList.contains('modal-backdrop')) {
      onClose();
    }
  };

  // Effect for handling keyboard interactions (Escape, Tab trapping)
  // and managing body scroll
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Close on ESC key
      if (e.key === 'Escape') {
        e.stopPropagation(); // Prevent event from bubbling to parent handlers if any
        onClose();
      }

      // Trap focus inside modal
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );

        // If there are no focusable elements inside the modal, keep focus on the modal box itself
        if (focusableElements.length === 0) {
          e.preventDefault(); // Prevent tabbing out
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Shift + Tab: If focus is on the first element, move to the last
        if (e.shiftKey) {
          if (document.activeElement === firstElement || document.activeElement === modalRef.current) {
            e.preventDefault();
            lastElement.focus();
          }
        }
        // Tab: If focus is on the last element, move to the first
        else {
          if (document.activeElement === lastElement || document.activeElement === modalRef.current) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    if (show) {
      // Store the currently focused element before the modal opens
      previouslyFocusedElementRef.current = document.activeElement;

      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    } else {
      // Clean up when modal closes
      document.body.style.overflow = ''; // Restore background scroll
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus to the element that was focused before the modal opened
      if (previouslyFocusedElementRef.current && previouslyFocusedElementRef.current.focus) {
        previouslyFocusedElementRef.current.focus();
      }
    }

    // Cleanup function for useEffect
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = ''; // Ensure overflow is reset on unmount
      // Note: Focus restoration should happen when `show` becomes false,
      // handled above, not in the cleanup of the effect that runs on mount/unmount.
    };
  }, [show, onClose]); // Dependencies: re-run effect if show or onClose changes

  // Effect for setting initial focus when modal opens
  useEffect(() => {
    if (show && modalRef.current) {
      // Wait for the modal to be rendered and visible before attempting to focus
      // A small timeout can sometimes help with rendering delays,
      // but direct focus often works if modal is directly in DOM.
      // If modal content is dynamic, consider focusing a specific element inside, not just the box.
      modalRef.current.focus();
    }
  }, [show]); // Dependency: re-run when `show` changes

  // If modal is not shown, render nothing
  if (!show) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      aria-modal="true" // Indicates that content outside the modal is inert
      role="dialog"     // Defines the element as a dialog
      aria-labelledby={ariaLabelledBy} // Links to the modal's title (required for accessibility)
      aria-describedby={ariaDescribedBy} // Links to the modal's description (optional)
    >
      <div
        className="modal-box"
        ref={modalRef}
        tabIndex={-1} // Makes the modal box programmatically focusable
      >
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close modal" // Provides an accessible name for the close button
        >
          &times; {/* HTML entity for multiplication sign, common for close icons */}
        </button>
        {children} {/* Render the content passed to the modal */}
      </div>
    </div>
  );
};

export default Modal;