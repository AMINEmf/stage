import React, { useState, useEffect, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import axios from "axios";
import { Button, Card, Tab, Tabs, Table, Modal, Form } from 'react-bootstrap';
import { faEdit, faTrash, faFilePdf, faFileExcel, faPrint, faSliders, faChevronDown, faChevronUp, faSearch, faCalendarAlt, faClipboardCheck, faIdCard, faFilter, faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Trash2, Edit2, Plus, Check, X } from 'lucide-react';
import { FaPlus } from "react-icons/fa6";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Box, Chip } from "@mui/material";
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
import ExpandRTable from "../Shared/ExpandRTable";
import { motion, AnimatePresence, color } from 'framer-motion';
import { FaPlusCircle } from "react-icons/fa";
import SectionTitle from "./SectionTitle";
import { useOpen } from "../../Acceuil/OpenProvider";
import FicheAffiliationCNSS from "./FicheAffiliationCNSS";

// Format date from ISO to DD/MM/YYYY
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    return '-';
  }
};

const themeColors = {
  success: "#4caf50",
  error: "#f44336",
  info: "#2196f3",
  textSecondary: "#64748b",
  textPrimary: "#1e293b",
};

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
      { key: 'periode', label: 'Période d\'affiliation', type: 'dateRange', dateDebut: '', dateFin: '', placeholderDebut: 'Date début', placeholderFin: 'Date fin' }
    ]
  });
  const [showImportDropdown, setShowImportDropdown] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [showFicheModal, setShowFicheModal] = useState(false);
  const [selectedEmployeeForPrint, setSelectedEmployeeForPrint] = useState(null);
  const dropdownRef = useRef(null);
  const employeesCacheRef = useRef(null);
  const affiliationsCacheRef = useRef(null);
  const hasSelectedDepartement = Boolean(departementId);

  const getEmployeeSalaryValue = useCallback((item) => {
    const employee = item?.employe && typeof item.employe === "object" ? item.employe : null;
    return (
      employee?.salaire_base ??
      employee?.salary ??
      employee?.salaire ??
      item?.salaire_base ??
      item?.salary ??
      item?.salaire
    );
  }, []);

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
        <span>{item.employe_nom || (typeof item.employe === 'string' ? item.employe : '-')}</span>
      )
    },
    { key: "numero_cnss", label: "N° CNSS" },
    {
      key: "salaire",
      label: "Salaire déclaré",
      render: (item) => {
        const salaryValue = getEmployeeSalaryValue(item);
        if (salaryValue == null || salaryValue === "") return <span>-</span>;

        const parsedSalary = parseFloat(salaryValue);
        if (Number.isNaN(parsedSalary)) return <span>-</span>;

        const formatted = parsedSalary.toLocaleString('fr-FR', {
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
        <span>{formatDate(item.date_debut || item.date_affiliation)}</span>
      )
    },
    {
      key: "date_fin",
      label: "Date fin",
      render: (item) => (
        <span>{formatDate(item.date_fin)}</span>
      )
    },
    {
      key: "statut",
      label: "Statut",
      render: (item) => {
        const colors = {
          'Actif': themeColors.success,
          'Inactif': themeColors.textSecondary,
          'Suspendu': themeColors.error
        };
        const color = colors[item.statut] || themeColors.textSecondary;
        return (
          <Chip
            label={item.statut || "-"}
            size="small"
            sx={{
              backgroundColor: `${color}15`,
              color,
              fontWeight: 700,
              fontSize: "0.65rem",
              borderRadius: "6px",
              textTransform: "uppercase"
            }}
          />
        );
      }
    },
  ], [getEmployeeSalaryValue]);

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

  const readCache = useCallback((key) => {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    try {
      const parsed = JSON.parse(cached);
      return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
      return null;
    }
  }, []);

  const hasWarmCache = useCallback(() => {
    const cachedEmployees = employeesCacheRef.current ?? readCache('cnssEmployees');
    const cachedAffiliations = affiliationsCacheRef.current ?? readCache('cnssAffiliations');
    return Array.isArray(cachedEmployees) || Array.isArray(cachedAffiliations);
  }, [readCache]);

  const fetchEmployees = useCallback(async (force = false) => {
    if (!force) {
      if (employeesCacheRef.current) {
        setEmployees(employeesCacheRef.current);
        return employeesCacheRef.current;
      }
      const cachedEmployees = readCache('cnssEmployees');
      if (cachedEmployees) {
        employeesCacheRef.current = cachedEmployees;
        setEmployees(cachedEmployees);
        return cachedEmployees;
      }
    }
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/departements/employes', { withCredentials: true });
      const employeesData = Array.isArray(response.data) ? response.data : [];
      setEmployees(employeesData);
      localStorage.setItem('cnssEmployees', JSON.stringify(employeesData));
      employeesCacheRef.current = employeesData;
      return employeesData;
    } catch (error) {
      console.error('CNSS: Error fetching employees:', error);
      return [];
    }
  }, [readCache]);

  const fetchCnssAffiliations = useCallback(async (force = false) => {
    if (!force) {
      if (affiliationsCacheRef.current) {
        setCnssAffiliations(affiliationsCacheRef.current);
        return affiliationsCacheRef.current;
      }
      const cachedAffiliations = readCache('cnssAffiliations');
      if (cachedAffiliations) {
        affiliationsCacheRef.current = cachedAffiliations;
        setCnssAffiliations(cachedAffiliations);
        return cachedAffiliations;
      }
    }
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/cnss/affiliations`, { withCredentials: true });
      const affiliationsData = Array.isArray(response.data) ? response.data : [];
      setCnssAffiliations(affiliationsData);
      localStorage.setItem("cnssAffiliations", JSON.stringify(affiliationsData));
      affiliationsCacheRef.current = affiliationsData;
      return affiliationsData;
    } catch (error) {
      console.error("Erreur lors de la récupération des affiliations CNSS:", error);
      return [];
    }
  }, [readCache]);

  const refreshCnssData = useCallback(async (force = false) => {
    await Promise.all([
      fetchEmployees(force),
      fetchCnssAffiliations(force),
    ]);
  }, [fetchEmployees, fetchCnssAffiliations]);

  useEffect(() => {
    let cancelled = false;

    if (!hasSelectedDepartement) {
      setIsTableLoading(false);
      return;
    }

    const fetchData = async () => {
      const warm = hasWarmCache();
      setIsTableLoading(!warm);

      try {
        await refreshCnssData(false);

        if (warm) {
          refreshCnssData(true).catch(() => {
            // Background refresh errors should not block UI.
          });
        }
      } catch (error) {
        console.error("Error fetching initial data", error);
      } finally {
        if (!cancelled) {
          setIsTableLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [hasSelectedDepartement, refreshCnssData, hasWarmCache]);

  useEffect(() => {
    if (!hasSelectedDepartement && showAddForm) {
      setSelectedCnss(null);
      setShowAddForm(false);
      setIsAddingCNSS(false);
    }
    setSelectedItems([]);
    setCurrentPage(0);
  }, [hasSelectedDepartement, showAddForm, setIsAddingCNSS, departementId]);

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
    if (!departementId) {
      return [];
    }

    // Calculer les IDs de départements à inclure
    const subIds = includeSubDepartments && getSubDepartmentIds
      ? getSubDepartmentIds(departements, departementId).map(String)
      : [String(departementId)];

    // NOUVELLE APPROCHE: Filtrer TOUTES les affiliations par departement_id directement
    const filteredAffiliations = cnssAffiliations.filter(aff => {
      const affDeptId = String(aff.departement_id || '');
      return subIds.includes(affDeptId);
    });

    // Créer un map des employés pour recherche rapide
    const employeesMap = new Map();
    employees.forEach(emp => {
      employeesMap.set(String(emp.id), emp);
    });

    // Merger les données affiliation avec les données employé
    const mergedData = filteredAffiliations.map(affiliation => {
      const employee = employeesMap.get(String(affiliation.employe_id)) || affiliation.employe;
      const employeeSalary =
        employee?.salaire_base ??
        employee?.salary ??
        employee?.salaire ??
        affiliation.salaire ??
        0;

      return {
        ...affiliation,
        employe: employee,
        matricule: employee?.matricule || affiliation.employe?.matricule || '-',
        employe_nom: employee 
          ? `${employee.nom || ''} ${employee.prenom || ''}`.trim() 
          : (affiliation.employe ? `${affiliation.employe.nom || ''} ${affiliation.employe.prenom || ''}`.trim() : '-'),
        salaire: employeeSalary,
      };
    });

    return mergedData;
  }, [employees, cnssAffiliations, departementId, includeSubDepartments, getSubDepartmentIds, departements]);

  const applyFilters = (cnssData) => {
    return cnssData.filter(cnss => {
      const statutFilter = filterOptions.filters.find(f => f.key === 'statut');
      const periodeFilter = filterOptions.filters.find(f => f.key === 'periode');

      const matchesStatut = !statutFilter?.value || cnss.statut?.toLowerCase() === statutFilter.value.toLowerCase();

      // Date period filter
      const matchesPeriode = (() => {
        if (!periodeFilter?.dateDebut && !periodeFilter?.dateFin) return true;
        const affiliationDate = new Date(cnss.date_debut || cnss.date_affiliation);
        if (isNaN(affiliationDate.getTime())) return true;

        if (periodeFilter.dateDebut) {
          const startDate = new Date(periodeFilter.dateDebut);
          if (affiliationDate < startDate) return false;
        }

        if (periodeFilter.dateFin) {
          const endDate = new Date(periodeFilter.dateFin);
          if (affiliationDate > endDate) return false;
        }

        return true;
      })();

      return matchesStatut && matchesPeriode;
    });
  };

  const normalizeValue = (value) => (value == null ? "" : String(value).toLowerCase().trim());
  const normalizedGlobalSearch = normalizeValue(globalSearch);

  const filteredCnssDataForFilters = applyFilters(
    filteredCnssData.filter(cnss =>
      normalizeValue(cnss.employe_nom)?.includes(normalizedGlobalSearch) ||
      normalizeValue(cnss.matricule)?.includes(normalizedGlobalSearch) ||
      normalizeValue(cnss.numero_cnss)?.includes(normalizedGlobalSearch)
    )
  );


  const renderCustomActions = useCallback((cnss) => {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setSelectedEmployeeForPrint(cnss);
          setShowFicheModal(true);
        }}
        aria-label="Fiche employé"
        title="Fiche employé"
        style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: '0 5px' }}
      >
        <FontAwesomeIcon icon={faIdCard} style={{ color: '#17a2b8', fontSize: '14px' }} />
      </button>
    );
  }, []);

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
      const nextItem = newCnss && typeof newCnss === "object" ? newCnss : null;
      if (!nextItem) return prev;
      const updated = nextItem.id != null
        ? [...prev.filter(cnss => cnss.id !== nextItem.id), nextItem]
        : [...prev, nextItem];
      affiliationsCacheRef.current = updated;
      localStorage.setItem("cnssAffiliations", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleCnssUpdated = useCallback((updatedCnss) => {
    setCnssAffiliations(prev => {
      const updated = prev.map(cnss => cnss.id === updatedCnss.id ? updatedCnss : cnss);
      affiliationsCacheRef.current = updated;
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
          affiliationsCacheRef.current = updated;
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
    if (!hasSelectedDepartement || showAddForm) {
      return;
    }

    setSelectedCnss(null);
    setShowAddForm(true);
    setIsAddingCNSS(true);
    setShowActions(false);
  }, [hasSelectedDepartement, showAddForm, setIsAddingCNSS]);

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

  const handleSelectAllChange = useCallback((eventOrChecked) => {
    const checked = typeof eventOrChecked === 'boolean'
      ? eventOrChecked
      : Boolean(eventOrChecked?.target?.checked);

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
          affiliationsCacheRef.current = updated;
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

  // Handle range filter change (for dates)
  const handleRangeFilterChange = (key, type, value) => {
    setFilterOptions(prev => {
      const newFilters = prev.filters.map(filter => {
        if (filter.key === key && (filter.type === 'range' || filter.type === 'dateRange')) {
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
    <>
      <style>{`
        .with-split-view .addemp-overlay, 
        .with-split-view .add-cnss-container, 
        .with-split-view .add-accident-container,
        .with-split-view .side-panel-container,
        .with-split-view .cnss-side-panel {
            position: relative !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            box-shadow: none !important;
            animation: none !important;
            border-radius: 0 !important;
        }
        
        /* Styles de section header */
        .section-header {
            border-bottom: none;
            padding-bottom: 15px;
            margin: 0.5% 1% 1%;
        }

        .section-description {
            color: #6c757d;
            font-size: 16px;
            margin-bottom: 0;
        }

        .btn-primary {
            background-color: #3a8a90;
            border-color: #3a8a90;
            color: white;
            border-radius: 0.375rem;
            font-weight: 500;
            padding: 0.5rem 1rem;
            transition: background-color 0.15s ease-in-out;
        }

        .content-title {
            font-size: 1.2rem;
            font-weight: 600;
            color: #4b5563;
            margin-bottom: 5px;
        }
      `}</style>

      <div className="with-split-view" style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        gap: showAddForm ? '10px' : '0',
        boxSizing: 'border-box'
      }}>
        {/* Colonne de Gauche : Tableau */}
        <div style={{
          flex: showAddForm ? '0 0 55%' : '1 1 100%',
          overflowY: 'auto',
          overflowX: 'auto',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
          transition: 'flex 0.3s ease-in-out',
          padding: '0 20px',
          backgroundColor: 'white',
          boxSizing: 'border-box'
        }}>
          <div className="mt-4">
            <div className="section-header mb-3">
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', columnGap: '24px', width: '100%' }}>
                <div>
                  <SectionTitle icon="fas fa-id-card" text="Affiliations CNSS" />
                  {!showAddForm && (
                    <p className="section-description text-muted mb-0">
                      {filteredCnssData.length} affiliation{filteredCnssData.length > 1 ? "s" : ""} affichee
                      {filteredCnssData.length > 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", gap: "12px", justifySelf: 'end' }}>
                  {true && (
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
                  )}

                  <Button
                    onClick={() => {
                      if (!hasSelectedDepartement) return;
                      handleAddNewCnss();
                    }}
                    className={`d-flex align-items-center justify-content-center ${!hasSelectedDepartement ? "disabled-btn" : ""}`}
                    size="sm"
                    style={{
                      minWidth: "220px",
                      height: "38px",
                      backgroundColor: hasSelectedDepartement ? "#3a8a90" : "#9ca3af",
                      border: "none",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      boxShadow: hasSelectedDepartement ? "0 3px 8px rgba(58, 138, 144, 0.28)" : "none",
                    }}
                  >
                    <FaPlusCircle className="me-2" />
                    Ajouter une affiliation CNSS
                  </Button>

                  {true && (
                    <Dropdown show={showDropdown} onToggle={(isOpen) => setShowDropdown(isOpen)} >
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
                  )}
                </div>
              </div>
            </div>
          </div>
          <AnimatePresence>
            {filtersVisible && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="filters-container"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "30px",
                  padding: "15px 25px",
                  overflowX: "auto",
                  flexWrap: "nowrap",
                  width: "100%",
                  WebkitOverflowScrolling: "touch",
                  boxSizing: "border-box"
                }}
              >
                <div
                  className="filters-icon-section"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flexShrink: 0,
                    marginRight: "5px",
                    position: "relative"
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a90a4" strokeWidth="2">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                  </svg>
                  <span className="filters-title">Filtres</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                    flexWrap: "nowrap",
                    flexShrink: 0
                  }}
                >
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
                      ) : filter.type === 'dateRange' ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <input
                            type="date"
                            value={filter.dateDebut}
                            onChange={(e) => handleRangeFilterChange(filter.key, 'dateDebut', e.target.value)}
                            placeholder={filter.placeholderDebut}
                            className="filter-input filter-range-input"
                            style={{
                              minWidth: 110,
                              maxWidth: 130,
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
                            type="date"
                            value={filter.dateFin}
                            onChange={(e) => handleRangeFilterChange(filter.key, 'dateFin', e.target.value)}
                            placeholder={filter.placeholderFin}
                            className="filter-input filter-range-input"
                            style={{
                              minWidth: 110,
                              maxWidth: 130,
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





          <style>{`
        .filters-container::-webkit-scrollbar {
          height: 5px;
        }
        .filters-container::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .filters-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .filters-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

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

          <ExpandRTable
            columns={visibleColumns}
            data={hasSelectedDepartement ? filteredCnssDataForFilters : []}
            loading={hasSelectedDepartement && isTableLoading}
            searchTerm={normalizedGlobalSearch}
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
            toggleRowExpansion={() => { }}
            renderExpandedRow={() => null}
            renderCustomActions={renderCustomActions}
          />
        </div>

        {/* Colonne de Droite : Formulaire */}
        {showAddForm && (
          <div style={{
            flex: '0 0 45%',
            overflowY: 'auto',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
            position: 'relative',
            height: '100%'
          }}>
            <AddCNSS
              toggleCnssForm={handleCloseForm}
              selectedDepartementId={departementId}
              onCnssAdded={handleCnssAdded}
              selectedCnss={selectedCnss}
              onCnssUpdated={handleCnssUpdated}
              fetchCnss={refreshCnssData}
              employeesList={employees}
              cnssAffiliationsList={cnssAffiliations}
            />
          </div>
        )}
      </div>

      <FicheAffiliationCNSS
        show={showFicheModal}
        onHide={() => {
          setShowFicheModal(false);
          setSelectedEmployeeForPrint(null);
        }}
        affiliation={selectedEmployeeForPrint}
      />
    </>
  );
});

export default CNSSTable;
