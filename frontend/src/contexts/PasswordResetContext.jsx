// src/contexts/PasswordResetContext.jsx - Fixed version
import React, { createContext, useState, useContext, useCallback } from 'react';

const PasswordResetContext = createContext({
  resetData: { email: '', otp: '', step: 'forgot' },
  updateResetData: () => {},
  clearResetData: () => {},
});

export const usePasswordReset = () => {
  const context = useContext(PasswordResetContext);
  if (!context) {
    throw new Error('usePasswordReset must be used within PasswordResetProvider');
  }
  return context;
};

export const PasswordResetProvider = ({ children }) => {
  const [resetData, setResetData] = useState(() => {
    try {
      const saved = localStorage.getItem('passwordResetData');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure the parsed data has all required fields
        return {
          email: parsed.email || '',
          otp: parsed.otp || '',
          step: parsed.step || 'forgot',
        };
      }
    } catch (error) {
      console.error('Error parsing password reset data:', error);
    }
    return { email: '', otp: '', step: 'forgot' };
  });

  const updateResetData = useCallback((newData) => {
    setResetData(prev => {
      const updated = { ...prev, ...newData };
      try {
        localStorage.setItem('passwordResetData', JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving password reset data:', error);
      }
      return updated;
    });
  }, []);

  const clearResetData = useCallback(() => {
    try {
      localStorage.removeItem('passwordResetData');
    } catch (error) {
      console.error('Error clearing password reset data:', error);
    }
    setResetData({ email: '', otp: '', step: 'forgot' });
  }, []);

  const value = {
    resetData,
    updateResetData,
    clearResetData,
  };

  return (
    <PasswordResetContext.Provider value={value}>
      {children}
    </PasswordResetContext.Provider>
  );
};