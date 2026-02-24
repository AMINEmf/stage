import React, { useEffect, useRef, useState, useCallback } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Box } from "@mui/material";
import { useHeader } from "../../Acceuil/HeaderContext";
import { useOpen } from "../../Acceuil/OpenProvider";
import DeclarationsTable from "./DeclarationsTable";
import "../Employe/DepartementManager.css";

function DeclarationsCNSS() {
  const declarationsTableRef = useRef(null);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const { dynamicStyles } = useOpen();
  const { setTitle, setOnPrint, setOnExportPDF, setOnExportExcel, searchQuery, clearActions } = useHeader();

  useEffect(() => {
    setTitle("Declarations CNSS");
    setOnPrint(() => () => {
      if (declarationsTableRef.current) declarationsTableRef.current.handlePrint();
    });
    setOnExportPDF(() => () => {
      if (declarationsTableRef.current) declarationsTableRef.current.exportToPDF();
    });
    setOnExportExcel(() => () => {
      if (declarationsTableRef.current) declarationsTableRef.current.exportToExcel();
    });

    return () => {
      clearActions();
    };
  }, [setTitle, setOnPrint, setOnExportPDF, setOnExportExcel, clearActions]);

  const handleFiltersToggle = useCallback((isVisible) => {
    if (isVisible) {
      setFiltersVisible(true);
      return;
    }
    setTimeout(() => setFiltersVisible(false), 300);
  }, []);

  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{ ...dynamicStyles, minHeight: "100vh", backgroundColor: "#fff", height: "100vh", display: "flex", flexDirection: "column" }}>
        <Box component="main" sx={{ flexGrow: 1, p: 0, mt: 12, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <DeclarationsTable
            ref={declarationsTableRef}
            globalSearch={searchQuery}
            filtersVisible={filtersVisible}
            handleFiltersToggle={handleFiltersToggle}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default DeclarationsCNSS;
