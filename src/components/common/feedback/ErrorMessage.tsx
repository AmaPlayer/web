import React, { memo } from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../../contexts/UnifiedPreferencesContext';
import './ErrorMessage.css';

interface ErrorMessageProps {
  message: string;
  type?: 'error' | 'warning' | 'info';
  onDismiss?: () => void;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

const ErrorMessage = memo<ErrorMessageProps>(({
  message,
  type = 'error',
  onDismiss,
  onRetry,
  retryLabel = 'Try Again',
  className = ''
}) => {
  const { t } = useLanguage();
  return (
    <div className={`error-message ${type} ${className}`}>
      <div className="error-content">
        <AlertCircle size={16} className="error-icon" />
        <span className="error-text">{message}</span>
      </div>
      
      <div className="error-actions">
        {onRetry && (
          <button 
            className="retry-button"
            onClick={onRetry}
            aria-label={retryLabel || t('tryAgain') || 'Try Again'}
          >
            <RefreshCw size={14} />
            <span>{retryLabel || t('tryAgain') || 'Try Again'}</span>
          </button>
        )}
        
        {onDismiss && (
          <button 
            className="dismiss-button"
            onClick={onDismiss}
            aria-label={t('dismissError') || 'Dismiss error'}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
});

ErrorMessage.displayName = 'ErrorMessage';

export default ErrorMessage;