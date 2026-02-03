import React, { createContext, useContext, useState, useEffect } from 'react';

// Créer un contexte pour l'état "open"
const OpenContext = createContext();

export const OpenProvider = ({ children }) => {
  const [open, setOpen] = useState(true);
  const [dynamicStyles, setDynamicStyles] = useState({
    // width: '100%',
    left: 0,
    right: 0,
    position: 'relative',
    marginTop: '0px',

    transition: 'all 0.2s ease',
  });

  // Fonction pour basculer l'état "open" et mettre à jour les styles
  const toggleOpen = () => {
    setOpen(prevOpen => !prevOpen);
  };

  useEffect(() => {
    setDynamicStyles(prevStyles => ({
      ...prevStyles,
      left: open ? '260px' : '72px',
      width: open ? 'calc(100% - 260px)' : 'calc(100% - 72px)',
    }));
  }, [open]);

  return (
    <OpenContext.Provider value={{ dynamicStyles, open, toggleOpen }}>
      {children}
    </OpenContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte "open"
export const useOpen = () => useContext(OpenContext);
