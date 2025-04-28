import React, { createContext, useState, useContext } from 'react';

const HandNavigationContext = createContext();

export const HandNavigationProvider = ({ children }) => {
  // Recuperar el estado del localStorage si existe
  const [isHandNavigationEnabled, setIsHandNavigationEnabled] = useState(() => {
    const saved = localStorage.getItem('handNavigationEnabled');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleHandNavigation = (enabled) => {
    setIsHandNavigationEnabled(enabled);
    // Guardar preferencia en localStorage
    localStorage.setItem('handNavigationEnabled', enabled);
  };

  return (
    <HandNavigationContext.Provider value={{ isHandNavigationEnabled, toggleHandNavigation }}>
      {children}
    </HandNavigationContext.Provider>
  );
};

export const useHandNavigation = () => {
  const context = useContext(HandNavigationContext);
  if (!context) {
    throw new Error('useHandNavigation must be used within a HandNavigationProvider');
  }
  return context;
};