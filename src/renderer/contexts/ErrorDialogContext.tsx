import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ErrorDialog, ErrorDialogType } from '../components/ErrorDialog';

interface ErrorDialogState {
  isOpen: boolean;
  type: ErrorDialogType;
  title?: string;
  message: string;
  details?: string;
}

interface ErrorDialogContextValue {
  showError: (message: string, title?: string, details?: string) => void;
  showWarning: (message: string, title?: string, details?: string) => void;
  showSuccess: (message: string, title?: string, details?: string) => void;
  showInfo: (message: string, title?: string, details?: string) => void;
}

const ErrorDialogContext = createContext<ErrorDialogContextValue | undefined>(undefined);

interface ErrorDialogProviderProps {
  children: ReactNode;
}

export function ErrorDialogProvider({ children }: ErrorDialogProviderProps) {
  const [dialogState, setDialogState] = useState<ErrorDialogState>({
    isOpen: false,
    type: 'error',
    message: '',
  });

  const showDialog = (type: ErrorDialogType, message: string, title?: string, details?: string) => {
    setDialogState({
      isOpen: true,
      type,
      title,
      message,
      details,
    });
  };

  const closeDialog = () => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  };

  const contextValue: ErrorDialogContextValue = {
    showError: (message: string, title?: string, details?: string) =>
      showDialog('error', message, title, details),
    showWarning: (message: string, title?: string, details?: string) =>
      showDialog('warning', message, title, details),
    showSuccess: (message: string, title?: string, details?: string) =>
      showDialog('success', message, title, details),
    showInfo: (message: string, title?: string, details?: string) =>
      showDialog('info', message, title, details),
  };

  return (
    <ErrorDialogContext.Provider value={contextValue}>
      {children}
      <ErrorDialog
        isOpen={dialogState.isOpen}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        details={dialogState.details}
        onClose={closeDialog}
      />
    </ErrorDialogContext.Provider>
  );
}

export function useErrorDialog(): ErrorDialogContextValue {
  const context = useContext(ErrorDialogContext);
  if (context === undefined) {
    throw new Error('useErrorDialog must be used within an ErrorDialogProvider');
  }
  return context;
}
