import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useOpen } from "../../Acceuil/OpenProvider";
import { useHeader } from "../../Acceuil/HeaderContext";
import ConflitTable from "./ConflitTable";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Box } from "@mui/material";
import "../Style.css";

const ConflitManager = () => {
  const { dynamicStyles } = useOpen();
  const { setTitle, setOnPrint, setOnExportPDF, setOnExportExcel, searchQuery, clearActions } = useHeader();
  const [isAddingEmploye, setIsAddingEmploye] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [preloadedEmployees, setPreloadedEmployees] = useState([]);
  const tableRef = useRef(null);

  useEffect(() => {
    setTitle("Gestion des Conflits / Incidents");
    setOnPrint(() => () => {
      if (tableRef.current?.handlePrint) {
        tableRef.current.handlePrint();
      }
    });
    setOnExportPDF(() => () => {
      if (tableRef.current?.exportToPDF) {
        tableRef.current.exportToPDF();
      }
    });
    setOnExportExcel(() => () => {
      if (tableRef.current?.exportToExcel) {
        tableRef.current.exportToExcel();
      }
    });

    return () => {
      clearActions();
    };
  }, [setTitle, setOnPrint, setOnExportPDF, setOnExportExcel, clearActions]);

  // Précharger les employés dès le montage du composant
  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/employes/light", { withCredentials: true })
      .then(res => {
        if (Array.isArray(res.data)) {
          setPreloadedEmployees(res.data);
        }
      })
      .catch(err => console.error("Error preloading employees", err));
  }, []);

  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{ ...dynamicStyles }}>
        <Box component="main" sx={{ flexGrow: 1, p: 0, mt: 12 }}>
          <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
            <ConflitTable
              ref={tableRef}
              globalSearch={searchQuery}
              isAddingEmploye={isAddingEmploye}
              setIsAddingEmploye={setIsAddingEmploye}
              filtersVisible={filtersVisible}
              handleFiltersToggle={setFiltersVisible}
              preloadedEmployees={preloadedEmployees}
            />
          </div>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default ConflitManager;
