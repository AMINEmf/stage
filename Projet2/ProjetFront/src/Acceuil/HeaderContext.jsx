import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

const HeaderContext = createContext(null);

export function HeaderProvider({ children }) {
  const [title, setTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [onPrint, setOnPrint] = useState(undefined);
  const [onExportPDF, setOnExportPDF] = useState(undefined);
  const [onExportExcel, setOnExportExcel] = useState(undefined);

  const clearActions = useCallback(() => {
    setOnPrint(undefined);
    setOnExportPDF(undefined);
    setOnExportExcel(undefined);
  }, []);

  const value = useMemo(
    () => ({
      title,
      setTitle,
      searchQuery,
      setSearchQuery,
      onPrint,
      setOnPrint,
      onExportPDF,
      setOnExportPDF,
      onExportExcel,
      setOnExportExcel,
      clearActions,
    }),
    [title, searchQuery, onPrint, onExportPDF, onExportExcel, clearActions]
  );

  return <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>;
}

export function useHeader() {
  const ctx = useContext(HeaderContext);
  if (!ctx) throw new Error("useHeader must be used within a HeaderProvider");
  return ctx;
} 