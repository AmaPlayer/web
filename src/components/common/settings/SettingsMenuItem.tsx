import React, { KeyboardEvent } from 'react';
import { LucideIcon } from 'lucide-react';
import './SettingsMenuItem.css';

interface SettingsMenuItemProps {
  icon?: LucideIcon;
  label: string;
  onClick?: (e: React.MouseEvent | React.KeyboardEvent) => void;
  children?: React.ReactNode;
  isActive?: boolean;
  showDivider?: boolean;
  ariaLabel?: string;
}

const SettingsMenuItem: React.FC<SettingsMenuItemProps> = ({
  icon: Icon,
  label,
  onClick,
  children,
  isActive = false,
  showDivider = false,
  ariaLabel,
}) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(e);
    }
  };

  return (
    <>
      <div
        className={`settings-menu-item ${isActive ? 'active' : ''}`}
        onClick={onClick}
        role="menuitem"
        tabIndex={0}
        aria-label={ariaLabel || label}
        onKeyDown={handleKeyDown}
      >
        <div className="settings-menu-item-content">
          {Icon && (
            <div className="settings-menu-item-icon">
              <Icon size={20} />
            </div>
          )}
          <span className="settings-menu-item-label">{label}</span>
        </div>
        {children && <div className="settings-menu-item-children">{children}</div>}
      </div>
      {showDivider && <div className="settings-menu-divider" />}
    </>
  );
};

export default SettingsMenuItem;
