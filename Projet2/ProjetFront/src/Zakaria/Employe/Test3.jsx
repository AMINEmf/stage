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
    <div style={{ marginTop: '5%', width: '50%', marginLeft: '10%', backgroundColor:'red' }} className="w-full p-4">
      <div className="d-flex justify-content-between align-items-center" style={{ marginTop: "1.2%" }}>
        <p
          className="titreColore d-flex justify-content-between align-items-center"
          style={{ width: '50%', marginBottom: '5%', marginTop: '-35px', marginLeft: '1%',  fontSize: "1.35rem",
            fontWeight: "bold",
            color: "#111827",
           }}
        >
          {title}
        </p>

        <div style={{ marginTop: '-105px', marginRight: '-85%', backgroundColor:'green' }} className="d-flex flex-column flex-md-row align-items-center">
          <FontAwesomeIcon
            onClick={toggleFilters}
            icon={showFilters ? faClose : faFilter}
            color={showFilters ? 'green' : ''}
            style={{
              cursor: "pointer",
              fontSize: "2rem",
              color: "#0d6efd",
              marginRight: "25px",
            }}
          />

          <div style={{ width: "500px", maxWidth: "500px", marginBottom: "2px", marginRight: "2%" }}>
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
                style: { borderRadius: "20px", height: '30px', width: '500px' }
              }}
              className="w-1/3"
            />
          </div>

          <div className="d-flex">
            <FontAwesomeIcon
              style={{
                cursor: "pointer",
                color: "red",
                fontSize: "2rem",
                marginLeft: "15px",
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
                fontSize: "2rem",
                marginLeft: "15px",
              }}
              title="Exporter en Excel"
            />
            <FontAwesomeIcon
              style={{
                cursor: "pointer",
                color: "grey",
                fontSize: "2rem",
                marginLeft: "15px",
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