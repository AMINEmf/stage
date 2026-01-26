import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilePdf,
  faFileExcel,
  faPrint,
  faFilter,
  faClose,
  faSearch
} from "@fortawesome/free-solid-svg-icons";
import { TextField } from '@mui/material';

const PageHeader = ({ 
  title, 
  onExportPDF, 
  onExportExcel, 
  onPrint,
  globalSearch = "",
  onGlobalSearchChange,
  onFiltersToggle
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const toggleFilters = () => {
    const newState = !showFilters;
    setShowFilters(newState);
    if (onFiltersToggle) {
      onFiltersToggle(newState);
    }
  };

  const handleGlobalSearch = (e) => {
    if (onGlobalSearchChange) {
      onGlobalSearchChange(e);
    }
  };

  return (
    <div style={{ marginTop: '4%', marginLeft: '12%', width: '88%' , 
      borderRadius: '10px',  
    //   borderBottom: "1px solid #e9ecef",
      background:'#f9fafb',
      boxShadow : '0 0 10px rgba(0,0,0,0.1)'

    }}>
      <div 
        className="d-flex justify-content-between align-items-center" 
        style={{ 
          padding: '15px 20px',
          borderRadius: '8px',
          width: '100%'
        }}
      >
        
        {/* PARTIE GAUCHE - TITRE */}
        <div style={{ flex: '0 0 auto' }}>
          <h1
            style={{
              fontSize: "1.35rem",
              fontWeight: "bold",
              color: "#2c3e50",
              marginLeft: "30px"
            }}
          >
            {title}
          </h1>
        </div>

        {/* PARTIE DROITE - FILTRE, RECHERCHE, ICONES */}
        <div className="d-flex align-items-center" style={{ gap: '15px' }}>
          
          {/* Icône Filtre */}
          <FontAwesomeIcon
            onClick={toggleFilters}
            icon={showFilters ? faClose : faFilter}
            style={{
              cursor: "pointer",
              fontSize: "1.5rem",
              color: showFilters ? 'green' : "#0d6efd"
            }}
          />

          {/* Barre de recherche */}
          <div style={{ width: "350px" }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Recherche globale..."
              value={globalSearch}
              onChange={handleGlobalSearch}
              InputProps={{
                startAdornment: (
                  <FontAwesomeIcon
                    icon={faSearch}
                    style={{ marginRight: "10px", color: "#888" }}
                  />
                ),
                style: { 
                  borderRadius: "20px", 
                  height: '40px', 
                  backgroundColor: 'white'
                }
              }}
              fullWidth
            />
          </div>

          {/* Icônes d'export */}
          <div className="d-flex align-items-center" style={{ gap: '10px' }}>
            <FontAwesomeIcon
              style={{
                cursor: "pointer",
                color: "red",
                fontSize: "1.5rem"
              }}
              onClick={onExportPDF}
              icon={faFilePdf}
              title="Exporter en PDF"
            />
            <FontAwesomeIcon
              icon={faFileExcel}
              onClick={onExportExcel}
              style={{
                cursor: "pointer",
                color: "green",
                fontSize: "1.5rem"
              }}
              title="Exporter en Excel"
            />
            <FontAwesomeIcon
              style={{
                cursor: "pointer",
                color: "grey",
                fontSize: "1.5rem"
              }}
              onClick={onPrint}
              icon={faPrint}
              title="Imprimer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;