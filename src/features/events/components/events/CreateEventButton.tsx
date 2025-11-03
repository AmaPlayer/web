import React from 'react';

interface CreateEventButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const CreateEventButton: React.FC<CreateEventButtonProps> = ({ 
  onClick, 
  disabled = false 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="create-event-button"
      aria-label="Create new event"
      title={disabled ? "Please log in to create an event" : "Create new event"}
    >
      <span className="button-icon">+</span>
      <span className="button-text">Create Event</span>
    </button>
  );
};
