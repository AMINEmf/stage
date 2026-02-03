import React, { useState, useEffect, useCallback, useMemo, useRef,forwardRef, useImperativeHandle } from "react";
import axios from "axios";
import { Button, Card, Tab, Tabs, Table, Modal, Form } from 'react-bootstrap';
import { faEdit, faTrash, faFilePdf, faFileExcel, faPrint, faSliders, faChevronDown, faChevronUp, faSearch, faCalendarAlt, faClipboardCheck, faIdCard, faFilter, faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Trash2, Edit2, Plus, Check, X } from 'lucide-react';
import { FaPlus } from "react-icons/fa6";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Box } from "@mui/material";
// import { faUserPlus } from "@fortawesome/free-solid-svg-icons";
import PageHeader from "../../ComponentHistorique/PageHeader";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FaUserPlus } from 'react-icons/fa';
import Dropdown from "react-bootstrap/Dropdown";
import Swal from "sweetalert2";
import { TextField } from '@mui/material';
import AddCNSS from "./AddCNSS";
import "../Style.css";
import ExpandRTable from "../Employe/ExpandRTable";
import { motion, AnimatePresence, color } from 'framer-motion';
import { FaPlusCircle } from "react-icons/fa";
import {useOpen} from "../../Acceuil/OpenProvider";



const CNSSTable = forwardRef((props, ref) => {
  const {
    globalSearch,
    setIsAddingCNSS,
    isAddingCNSS,
    departementId,
    departementName,
    includeSubDepartments,
    getSubDepartmentIds,
    departements,
    filtersVisible,
    handleFiltersToggle,
  } = props;

  // State management
  const [employees, setEmployees] = useState([]);
  const [cnssAffiliations, setCnssAffiliations] = useState([]);
  const [selectedCnss, setSelectedCnss] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showActions, setShowActions] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    filters: [
      { key: 'statut', label: 'Statut', type: 'select', value: '', options: [{ label: 'Actif', value: 'Actif' }, { label: 'Inactif', value: 'Inactif' }], placeholder: 'Tous' },
      { key: 'salaire', label: 'Salaire', type: 'range', min: '', max: '', placeholderMin: 'Min', placeholderMax: 'Max' }
    ]
  });
  const [showImportDropdown, setShowImportDropdown] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Définition de TOUTES les colonnes disponibles (avant filtrage par visibilité)
  const allColumns = useMemo(() => [
    { 
      key: "matricule", 
      label: "Matricule",
      render: (item) => (
        <span>{item.matricule || item.employe_matricule || '-'}</span>
      )
    },
    { 
      key: "employe", 
      label: "Employé",
      render: (item) => (
        // Use employe_nom if employe is an object to avoid React error
        <span>{item.employe_nom || (typeof item.employe === 'string' ? item.employe : '-') }</span>
      )
    },
    { key: "numero_cnss", label: "N° CNSS" },
    { 
      key: "salaire", 
      label: "Salaire déclaré",
      render: (item) => {
        if (!item.salaire) return <span>-</span>;
        const formatted = parseFloat(item.salaire).toLocaleString('fr-FR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        return <span>{formatted} MAD</span>;
      }
    },
    { 
      key: "date_debut", 
      label: "Date affiliation",
      render: (item) => (
        <span>{item.date_debut || item.date_affiliation || '-'}</span>
      )
    },
    { 
      key: "date_fin", 
      label: "Date fin",
      render: (item) => (
        <span>{item.date_fin || '-'}</span>
      )
    },
    { 
      key: "statut", 
      label: "Statut",
      render: (item) => (
        <span 
          className={`badge ${
            item.statut === 'Actif' ? 'bg-success' : 
            item.statut === 'Inactif' ? 'bg-secondary' : 
            item.statut === 'Suspendu' ? 'bg-danger' : 'bg-secondary'
          }`}
        >
          {item.statut || 'N/A'}
        </span>
      )
    },
  ], []);

  // Filtrer les colonnes pour l'affichage dans le tableau
  const visibleColumns = useMemo(() => {
    return allColumns.filter(col => columnVisibility[col.key]);
  }, [allColumns, columnVisibility]);

  const iconButtonStyle = {
    backgroundColor: "#f9fafb",
    border: "1px solid #ccc",
    borderRadius: "5px",
    padding: "13px 16px",
    margin: "0 0px",
    cursor: "pointer",
    transition: "background-color 0.3s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  




  const fetchEmployees = useCallback(async () => {
    if (!departementId) return;
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/departements/employes');
      if (response.data && Array.isArray(response.data)) {
        setEmployees(response.data);
        localStorage.setItem('cnssEmployees', JSON.stringify(response.data));
        console.log('CNSS: Employees fetched, count:', response.data.length);
      }
    } catch (error) {
      console.error('CNSS: Error fetching employees:', error);
    }
  }, [departementId]);

  const fetchCnssAffiliations = useCallback(async () => {
    if (!departementId) return;
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/cnss/affiliations`);
      if (response.data && Array.isArray(response.data)) {
        setCnssAffiliations(response.data);
        localStorage.setItem("cnssAffiliations", JSON.stringify(response.data));
        console.log("CNSS: Affiliations fetched, count:", response.data.length);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des affiliations CNSS:", error);
    }
  }, [departementId]);

  useEffect(() => {
    // Si pas de département, on reset et on arrête le chargement immédiatement
    if (!departementId) {
        setEmployees([]);
        setCnssAffiliations([]);
        setIsLoading(false); 
        return;
    }

    const fetchData = async () => {
        setIsLoading(true);
        // Introduire un petit délai pour rendre le spinner visible uniquement si le chargement prend du temps
        // Cela évite le flash blanc ou le spinner instantané pour des réponses très rapides
        // const minLoadingTime = new Promise(resolve => setTimeout(resolve, 300));
        
        try {
            await Promise.all([
                fetchEmployees(),
                fetchCnssAffiliations(),
                // minLoadingTime 
            ]);
        } catch (error) {
            console.error("Error fetching initial data", error);
        } finally {
            setIsLoading(false);
        }
    };

    fetchData();
  }, [departementId, fetchEmployees, fetchCnssAffiliations]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  // const filteredEmployers = useMemo(() => {
  
  //   let result = includeSubDepartments
  //     ? employeesWithContracts.filter((emp) => {
  //         const subIds = getSubDepartmentIds(departements, departementId);
  //         return emp.departements.some((dept) => subIds.includes(dept.id));
  //       })
  //     : employeesWithContracts.filter((emp) => {
  //         return emp.departements.some((dept) => dept.id === departementId);






  const filteredCnssData = useMemo(() => {
    console.log('CNSS: Filtering - departementId:', departementId, 'employees:', employees.length, 'affiliations:', cnssAffiliations.length);
    
    if (!departementId) {
      console.log('CNSS: No department selected');
      return [];
    }
    
    // ÉTAPE 1 : Filtrer les employés du département sélectionné
    const employeesInDepartment = includeSubDepartments
      ? employees.filter((emp) => {
          if (!emp.departements || !Array.isArray(emp.departements)) return false;
          const subIds = getSubDepartmentIds(departements, departementId);
          // Convert IDs to strings for comparison to avoid type mismatch
          return emp.departements.some(dept => subIds.map(String).includes(String(dept.id)));
        })
      : employees.filter((emp) => {
          if (!emp.departements || !Array.isArray(emp.departements)) return false;
          // Loose equality (==) or String conversion for safety
          return emp.departements.some(dept => String(dept.id) === String(departementId));
        });
    
    console.log('CNSS: Employees in department:', employeesInDepartment.length);
    
    // ÉTAPE 2 : Récupérer les IDs des employés affiliés à la CNSS
    // Ensure IDs are consistent (e.g. all strings or all numbers)
    const affiliatedEmployeeIds = cnssAffiliations.map(cnss => String(cnss.employe_id));
    console.log('CNSS: Affiliated employee IDs:', affiliatedEmployeeIds);
    
    // ÉTAPE 3 : INTERSECTION - Garder uniquement les employés du département QUI SONT affiliés
    const affiliatedEmployees = employeesInDepartment.filter(emp => 
      affiliatedEmployeeIds.includes(String(emp.id))
    );
    
    console.log('CNSS: Affiliated employees in department:', affiliatedEmployees.length);
    
    // ÉTAPE 4 : Merger les données employé avec les données CNSS
    const mergedData = affiliatedEmployees.map(employee => {
      // Find affiliation using string comparison
      const affiliation = cnssAffiliations.find(cnss => String(cnss.employe_id) === String(employee.id));
      return {
        ...affiliation,
        employe: employee,
        matricule: employee.matricule,
        employe_nom: `${employee.nom} ${employee.prenom}`
      };
    });
    
    console.log('CNSS: Final merged data:', mergedData.length);
    return mergedData;
  }, [employees, cnssAffiliations, departementId, includeSubDepartments, getSubDepartmentIds, departements]);

  const applyFilters = (cnssData) => {
    return cnssData.filter(cnss => {
      const statutFilter = filterOptions.filters.find(f => f.key === 'statut');
      const salaireFilter = filterOptions.filters.find(f => f.key === 'salaire');

      const matchesStatut = !statutFilter?.value || cnss.statut?.toLowerCase() === statutFilter.value.toLowerCase();
      
      // Salary filter
      const matchesSalaire = (() => {
        if (!salaireFilter?.min && !salaireFilter?.max) return true;
        const salary = parseFloat(cnss.salaire) || 0;
        const minSalary = salaireFilter.min ? parseFloat(salaireFilter.min) : 0;
        const maxSalary = salaireFilter.max ? parseFloat(salaireFilter.max) : Infinity;
        
        return salary >= minSalary && salary <= maxSalary;
      })();

      return matchesStatut && matchesSalaire;
    });
  };
  
  const normalizeValue = (value) => String(value).toLowerCase().trim();
  
  const filteredCnssDataForFilters = applyFilters(
    filteredCnssData.filter(cnss =>
      normalizeValue(cnss.employe_nom)?.includes(normalizeValue(globalSearch)) ||
      normalizeValue(cnss.matricule)?.includes(normalizeValue(globalSearch)) ||
      normalizeValue(cnss.numero_cnss)?.includes(normalizeValue(globalSearch))
    )
  );

  const handleColumnsChange = useCallback((column) => {
    setColumnVisibility(prev => {
      const newVisibility = { ...prev, [column]: !prev[column] };
      localStorage.setItem('cnssColumnVisibility', JSON.stringify(newVisibility));
      return newVisibility;
    });
  }, []);

  useEffect(() => {
    const savedColumnVisibility = localStorage.getItem('cnssColumnVisibility');
    
    if (savedColumnVisibility) {
      setColumnVisibility(JSON.parse(savedColumnVisibility));
    } else {
      const defaultVisibility = {};
      allColumns.forEach(col => {
        defaultVisibility[col.key] = true;
      });
      setColumnVisibility(defaultVisibility);
      localStorage.setItem('cnssColumnVisibility', JSON.stringify(defaultVisibility));
    }
  }, [allColumns]);
  
  const handleCnssAdded = useCallback((newCnss) => {
    setCnssAffiliations(prev => {
      const updated = [...prev, newCnss];
      localStorage.setItem("cnssAffiliations", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleCnssUpdated = useCallback((updatedCnss) => {
    setCnssAffiliations(prev => {
      const updated = prev.map(cnss => cnss.id === updatedCnss.id ? updatedCnss : cnss);
      localStorage.setItem("cnssAffiliations", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleDeleteCnss = useCallback(async (id) => {
    const result = await Swal.fire({
      title: "Êtes-vous sûr?",
      text: "Vous ne pourrez pas revenir en arrière!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui, supprimer!",
      cancelButtonText: "Annuler",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/cnss/affiliations/${id}`);
        setCnssAffiliations(prev => {
          const updated = prev.filter(cnss => cnss.id !== id);
          localStorage.setItem("cnssAffiliations", JSON.stringify(updated));
          return updated;
        });
        Swal.fire("Supprimé!", "L'affiliation CNSS a été supprimée.", "success");
      } catch (error) {
        console.error("Error deleting CNSS affiliation:", error);
        Swal.fire("Erreur!", "Une erreur est survenue lors de la suppression.", "error");
      }
    }
  }, []);

  const handleAddNewCnss = useCallback(() => {
    console.log('CNSS: Add button clicked, departementId:', departementId);
    if (!showAddForm) {
      setSelectedCnss(null);
      setShowAddForm(true);
      setIsAddingCNSS(true);
      setShowActions(false);
      console.log('CNSS: Form should now open');
    } else {
      console.log('CNSS: Form already open');
    }
  }, [showAddForm, setIsAddingCNSS, departementId]);
  
  const handleEditCnss = useCallback((cnss) => {
    setSelectedCnss(cnss);
    setShowAddForm(true);
    setIsAddingCNSS(true);
    setShowActions(false);
  }, [setIsAddingCNSS]);
     
  useEffect(() => {
    if (!showAddForm) {
      setShowActions(true);
    }
  }, [showAddForm]);
  

  const handleCloseForm = useCallback(() => {
    setSelectedCnss(null);
    setShowAddForm(false);
    setIsAddingCNSS(false);
  }, [setIsAddingCNSS]);


  const exportToPDF = useCallback(() => {
    const doc = new jsPDF();
    const tableColumn = allColumns.filter(col => columnVisibility[col.key]).map(col => col.label);
    const tableRows = filteredCnssDataForFilters.map(item =>
      allColumns.filter(col => columnVisibility[col.key]).map(col => item[col.key])
    );
    doc.setFontSize(18);
    doc.text(`Affiliations CNSS - ${departementName}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
    });
    doc.save(`cnss_${departementName}_${new Date().toISOString()}.pdf`);
  }, [allColumns, columnVisibility, filteredCnssDataForFilters, departementName]);
  



  // Export to Excel
  const exportToExcel = useCallback(() => {
    const ws = XLSX.utils.json_to_sheet(
      filteredCnssDataForFilters.map(item => {
        const row = {};
        allColumns.forEach(col => {
          if (columnVisibility[col.key]) {
            row[col.label] = item[col.key];
          }
        });
        return row;
      })
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Affiliations CNSS");
    XLSX.writeFile(wb, `cnss_${departementName}_${new Date().toISOString()}.xlsx`);
  }, [allColumns, columnVisibility, filteredCnssDataForFilters, departementName]);
  
  // Print handler
  const handlePrint = useCallback(() => {
    const printWindow = window.open("", "_blank");
    const tableColumn = allColumns.filter(col => columnVisibility[col.key]).map(col => col.label);
    const tableRows = filteredCnssDataForFilters.map(item =>
      allColumns.filter(col => columnVisibility[col.key]).map(col => item[col.key])
    );
  
    const tableHtml = `
      <html>
        <head>
          <title>Affiliations CNSS - ${departementName}</title>
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Affiliations CNSS - ${departementName}</h1>
          <table>
            <thead>
              <tr>${tableColumn.map(col => `<th>${col}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${tableRows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    printWindow.document.write(tableHtml);
    printWindow.document.close();
    printWindow.print();
  }, [allColumns, columnVisibility, filteredCnssDataForFilters, departementName]);
  
  const handleSelectAllChange = useCallback((checked) => {
    if (checked) {
      setSelectedItems(filteredCnssDataForFilters.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  }, [filteredCnssDataForFilters]);

  const handleCheckboxChange = useCallback((id) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    const result = await Swal.fire({
      title: "Êtes-vous sûr?",
      text: "Vous ne pourrez pas revenir en arrière!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui, supprimer!",
      cancelButtonText: "Annuler",
    });
    if (result.isConfirmed) {
      try {
        await Promise.all(
          selectedItems.map(id => axios.delete(`http://127.0.0.1:8000/api/cnss/affiliations/${id}`))
        );

        setCnssAffiliations(prev => {
          const updated = prev.filter(item => !selectedItems.includes(item.id));
          localStorage.setItem("cnssAffiliations", JSON.stringify(updated));
          return updated;
        });

        setSelectedItems([]);
        Swal.fire("Supprimées!", "Les affiliations CNSS ont été supprimées.", "success");
      } catch (error) {
        console.error("Error deleting selected CNSS affiliations:", error);
        Swal.fire("Erreur!", "Une erreur est survenue lors de la suppression.", "error");
      }
    }
  }, [selectedItems]);

  useImperativeHandle(ref, () => ({
    exportToPDF,
    exportToExcel,
    handlePrint
  }), [exportToPDF, exportToExcel, handlePrint]);




  const handleChangePage = useCallback((event, newPage) => {
    setCurrentPage(newPage);
  }, []);


  const handleChangeRowsPerPage = useCallback((event) => {
    setItemsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(0);
  }, []);


    // Handle global search change
    const handleGlobalSearchChange = (e) => {
        setGlobalSearch(e.target.value);
        setCurrentPage(0);
  };

  const handleFilterChange = (key, value) => {
    setFilterOptions(prev => {
      const newFilters = prev.filters.map(filter => {
        if (filter.key === key && filter.type === 'select') {
          return { ...filter, value };
        }
        return filter;
      });
      return { ...prev, filters: newFilters };
    });
  };
  
  // Handle range filter change (for salary and age)
  const handleRangeFilterChange = (key, type, value) => {
    setFilterOptions(prev => {
      const newFilters = prev.filters.map(filter => {
        if (filter.key === key && filter.type === 'range') {
          return { ...filter, [type]: value };
        }
        return filter;
      });
      return { ...prev, filters: newFilters };
    });
  };
  
  const highlightText = useCallback((text, searchTerm) => {
    if (!text || !searchTerm) return text;
    
    const textStr = String(text);
    const searchTermLower = searchTerm.toLowerCase();
    
    if (!textStr.toLowerCase().includes(searchTermLower)) return textStr;
    
    const parts = textStr.split(new RegExp(`(${searchTerm})`, 'gi'));
    
    return parts.map((part, i) => 
      part.toLowerCase() === searchTermLower 
        ? <mark key={i} style={{ backgroundColor: 'yellow' }}>{part}</mark>
        : part
    );
  }, []);
  


  






  // Custom Menu pour dropdown de visibilité des colonnes - UTILISE TOUTES LES COLONNES
  const CustomMenu = React.forwardRef(
    ({ children, style, className, "aria-labelledby": labeledBy }, ref) => {
      return (
        <div
          ref={ref}
          style={{
            padding: "10px",
            backgroundColor: "white",
            border: "1px solid #ccc",
            borderRadius: "5px",
            maxHeight: "400px",
            overflowY: "auto"
          }}
          className={className}
          aria-labelledby={labeledBy}
        >
          <Form onClick={(e) => e.stopPropagation()}>
            {allColumns.map((column) => (
              <Form.Check
                key={column.key}
                type="checkbox"
                id={`checkbox-${column.key}`}
                label={column.label}
                checked={columnVisibility[column.key]}
                onChange={() => handleColumnsChange(column.key)}
              />
            ))}
          </Form>
        </div>
      );
    }
  );

  return (

    <div style={{
      position: 'relative',
      left: "-2%",
      // top: "14.19%",
      top : "0",
      height: 'calc(100vh - 160px)',
    }} className={`${isAddingCNSS ? "with-form" : "container_employee"}`}>
      
      
      <div className="mt-4"   >
        <div className="section-header mb-3">
          <div className="d-flex align-items-center justify-content-between" style={{ gap: 24 }}>
            {/* Bloc titre */}
            <div>
              <span className="section-title mb-1">
                <i className="fas fa-id-card me-2"></i>
                Affiliations CNSS
              </span>
              {!showAddForm && (
  <p className="section-description text-muted mb-0">
    {filteredCnssData.length} affiliation
    {filteredCnssData.length > 1 ? 's' : ''} actuellement affichée
    {filteredCnssData.length > 1 ? 's' : ''}
  </p>
)}


            </div>
            {/* Bloc Dropdowns */}
            <div style={{ display: "flex", gap: "12px" }}>

            <FontAwesomeIcon
              onClick={() => handleFiltersToggle && handleFiltersToggle(!filtersVisible)}
              icon={filtersVisible ? faClose : faFilter}
              color={filtersVisible ? 'green' : ''}
            style={{
              cursor: "pointer",
              fontSize: "1.9rem",
              color: "#2c767c",
              marginTop: "1.3%",
              marginRight: "8px",
            }}
          />



                         {/* Bouton Ajouter */}
            <Button
  onClick={() => {
    if (!departementId) return;
    handleAddNewCnss();
  }}
  className={`btn btn-outline-primary d-flex align-items-center ${!departementId ? "disabled-btn" : ""}`}
  size="sm"
              style={{   marginRight:'30px !important' ,
                width: '160px',              }}
            >
              <FaPlusCircle className="me-2" />
              Ajouter une affiliation CNSS
            </Button>


              <Dropdown show={showDropdown} onToggle={(isOpen) => setShowDropdown(isOpen) } >
                <Dropdown.Toggle
                  as="button"
                  id="dropdown-visibility"
                  title="Visibilité Colonnes"
                  style={iconButtonStyle}
                >
                  <FontAwesomeIcon
                    icon={faSliders}
                    style={{ width: 18, height: 18, color: "#4b5563" }}
                  />
                </Dropdown.Toggle>
                <Dropdown.Menu as={CustomMenu} />
              </Dropdown>
              <Dropdown show={showImportDropdown} onToggle={(isOpen) => setShowImportDropdown(isOpen)}>
                <Dropdown.Toggle
                  as="button"
                  id="dropdown-import"
                  title="Importer Employés"
                  onClick={() => setShowImportModal(true)}
                  style={iconButtonStyle}
                >
                  <FontAwesomeIcon
                    icon={faFileExcel}
                    style={{ width: 18, height: 18, color: '#4b5563' }}
                  />
                </Dropdown.Toggle>
              </Dropdown>



            </div>
          </div>
        </div>
      </div>
                                      {/* Section des filtres */}
<AnimatePresence>
  {filtersVisible && (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="filters-container"
      style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '12px', 
        padding: '16px 20px',
        minHeight: 0 
      }}
    >
      {/* Ligne 1: Icône et titre */}
      <div className="filters-icon-section" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        justifyContent: 'center',
        marginLeft:'-8px', 
        marginRight:'14%',
      }}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4a90a4"
          strokeWidth="2"
          className="filters-icon"
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
        <span className="filters-title">Filtres</span>
      </div>

      {/* Ligne 2: Tous les filtres */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1px', 
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginLeft:'10.2%'
      }}>
        {filterOptions.filters.map((filter, index) => (
          <div key={index} style={{
  display: 'flex',
  alignItems: 'center',
  margin: 0,
  marginRight: '46px' 
}}>            <label className="filter-label" style={{ 
              fontSize: '0.9rem', 
              margin: 0, 
              marginRight: '-44px',
              whiteSpace: 'nowrap',
              minWidth: 'auto',
              fontWeight: 600,
              color: '#2c3e50'
            }}>
              {filter.label}
            </label>
            
            {filter.type === 'select' ? (
              <select
                value={filter.value}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className="filter-input"
                style={{ 
                  minWidth: 80, 
                  maxWidth: 110, 
                  height: 30, 
                  fontSize: '0.9rem', 
                  padding: '2px 6px', 
                  borderRadius: 6 
                }}
              >
                <option value="">{filter.placeholder}</option>
                {filter.options?.map((option, optIndex) => (
                  <option key={optIndex} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : filter.type === 'range' ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px' 
              }}>
                <input
                  type="number"
                  value={filter.min}
                  onChange={(e) => handleRangeFilterChange(filter.key, 'min', e.target.value)}
                  placeholder={filter.placeholderMin}
                  className="filter-input filter-range-input"
                  style={{ 
                    minWidth: 50, 
                    maxWidth: 70, 
                    height: 30, 
                    fontSize: '0.9rem', 
                    padding: '2px 4px', 
                    borderRadius: 6 
                  }}
                />
                <span className="filter-range-separator" style={{ 
                  margin: '0 2px',
                  fontSize: '0.9rem',
                  color: '#666'
                }}>
                  -
                </span>
                <input
                  type="number"
                  value={filter.max}
                  onChange={(e) => handleRangeFilterChange(filter.key, 'max', e.target.value)}
                  placeholder={filter.placeholderMax}
                  className="filter-input filter-range-input"
                  style={{ 
                    minWidth: 50, 
                    maxWidth: 70, 
                    height: 30, 
                    fontSize: '0.9rem', 
                    padding: '2px 4px', 
                    borderRadius: 6 
                  }}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </motion.div>
  )}
</AnimatePresence>





      <style jsx>{`
        // .custom-checkbox1 .form-check-input:checked {
        //   background-color: #00afaa;
        //   border-color: #00afaa;
        // }
        
        // .custom-checkbox1 .form-check-input:focus {
        //   border-color: #00afaa;
        //   box-shadow: 0 0 0 0.25rem rgba(0, 175, 170, 0.25);
        // }
        
        /* Ajouter animation et transition pour une meilleure UX */
        .custom-modal-excel .modal-content {
          animation: fadeIn 0.3s;
          border-radius: 12px;
          border: none;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Style pour hover sur les boutons */
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        /* Style pour hover sur les icônes */
        .fa-trash:hover {
          color: #ff3742 !important;
          transform: scale(1.1);
        }

        /* Style pour les en-têtes de tableau */
        .custom-header th {
          background-color: rgba(0, 175, 170, 0.05);
          border-color: #e0e0e0;
        }

        /* Style pour les cellules de tableau */
        .custom-header td {
          vertical-align: middle;
          border-color: #e0e0e0;
        }

                  .btn-primary:hover:not(:disabled) {
            background-color: #009691;
            border-color: #009691;
          }

      `}</style>


      {isLoading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      ) : (
      <ExpandRTable
        columns={visibleColumns}
        data={filteredCnssDataForFilters}
        searchTerm={globalSearch.toLowerCase()}
        highlightText={highlightText}
        selectAll={selectedItems.length === filteredCnssDataForFilters.length && filteredCnssDataForFilters.length > 0}
        selectedItems={selectedItems}
        handleSelectAllChange={handleSelectAllChange}
        handleCheckboxChange={handleCheckboxChange}
        handleEdit={handleEditCnss}
        handleDelete={handleDeleteCnss}
        handleDeleteSelected={handleDeleteSelected}
        rowsPerPage={itemsPerPage}
        page={currentPage}
        handleChangePage={handleChangePage}
        handleChangeRowsPerPage={handleChangeRowsPerPage}
        expandedRows={[]}
        toggleRowExpansion={() => {}}
        renderExpandedRow={() => null}
        renderCustomActions={() => null}
      />
      )}

      {showAddForm && (
        <AddCNSS
          toggleCnssForm={handleCloseForm}
          selectedDepartementId={departementId}
          onCnssAdded={handleCnssAdded}
          selectedCnss={selectedCnss}
          onCnssUpdated={handleCnssUpdated}
          fetchCnss={fetchCnssAffiliations}
          employeesList={employees}
          cnssAffiliationsList={cnssAffiliations}
        />
      )}

    </div>

  );
});

export default CNSSTable;