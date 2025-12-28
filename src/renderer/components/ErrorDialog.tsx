import React, { useEffect, useState } from 'react';

export type ErrorDialogType = 'error' | 'warning' | 'success' | 'info';

interface ErrorDialogProps {
  isOpen: boolean;
  type: ErrorDialogType;
  title?: string;
  message: string;
  details?: string;
  onClose: () => void;
}

const DEFAULT_TITLES: Record<ErrorDialogType, string> = {
  error: 'Error',
  warning: 'Warning',
  success: 'Success',
  info: 'Information',
};

const ICONS: Record<ErrorDialogType, string> = {
  error: '✕',
  warning: '⚠',
  success: '✓',
  info: 'ℹ',
};

const BUTTON_STYLES: Record<ErrorDialogType, string> = {
  error: 'bg-button-red hover:bg-red-700 text-white',
  warning: 'bg-status-warning hover:bg-amber-600 text-white',
  success: 'bg-status-success hover:bg-emerald-600 text-white',
  info: 'bg-label-blue hover:bg-button-dark text-white',
};

export function ErrorDialog({ isOpen, type, title, message, details, onClose }: ErrorDialogProps) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        onClose();
      }
    };

    if (isOpen) {
      // Reset details expansion when dialog opens
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowDetails(false);
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayTitle = title || DEFAULT_TITLES[type];
  const icon = ICONS[type];
  const buttonClass = BUTTON_STYLES[type];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-panel-light rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-panel-dark flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <h2 className="text-xl font-semibold text-label-black">{displayTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-label-gray hover:text-label-black"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-sm text-label-black whitespace-pre-line">{message}</p>

          {/* Details section */}
          {details && (
            <div className="mt-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-label-blue hover:text-button-dark flex items-center gap-1 font-medium"
              >
                <span
                  className="transform transition-transform"
                  style={{
                    display: 'inline-block',
                    transform: showDetails ? 'rotate(90deg)' : 'rotate(0deg)',
                  }}
                >
                  ▶
                </span>
                {showDetails ? 'Hide' : 'Show'} technical details
              </button>

              {showDetails && (
                <div className="mt-2 p-3 bg-panel-dark rounded text-xs font-mono text-label-black whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                  {details}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-panel-dark flex items-center justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${buttonClass}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
