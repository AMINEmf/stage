import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "../Employe/DepartementManager.css";
import "bootstrap/dist/css/bootstrap.min.css";
import CimrDeclarationTable from "./CimrDeclarationTable";
import { useHeader } from "../../Acceuil/HeaderContext";
import { useOpen } from "../../Acceuil/OpenProvider";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Box } from "@mui/material";

function CimrDeclarationManager() {
    const [isAddingEmploye, setIsAddingEmploye] = useState(false);
    const { setTitle, setOnPrint, setOnExportPDF, setOnExportExcel, clearActions } = useHeader();
    const { dynamicStyles } = useOpen();
    const tableRef = useRef(null);

    useEffect(() => {
        setTitle("Déclarations CIMR");
        setOnPrint(() => () => { if (tableRef.current) tableRef.current.handlePrint(); });
        setOnExportPDF(() => () => { if (tableRef.current) tableRef.current.exportToPDF(); });
        setOnExportExcel(() => () => { if (tableRef.current) tableRef.current.exportToExcel(); });
        return () => {
            clearActions();
        };
    }, [setTitle, setOnPrint, setOnExportPDF, setOnExportExcel, clearActions]);

    return (
        <ThemeProvider theme={createTheme()}>
            <Box sx={{ ...dynamicStyles }}>
                <Box component="main" sx={{ flexGrow: 1, p: 0, mt: 12 }}>
                    <div style={{ padding: "0 20px" }}>
                        <CimrDeclarationTable
                            ref={tableRef}
                            isAddingEmploye={isAddingEmploye}
                            setIsAddingEmploye={setIsAddingEmploye}
                        />
                    </div>
                </Box>
            </Box>
        </ThemeProvider>
    );
}

export default CimrDeclarationManager;
