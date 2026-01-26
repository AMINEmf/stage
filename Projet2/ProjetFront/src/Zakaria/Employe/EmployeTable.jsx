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
import AddEmp from "./AddEmp";
import "../Style.css";
import ExpandRTable from "./ExpandRTable";
import { motion, AnimatePresence, color } from 'framer-motion';
import { FaPlusCircle } from "react-icons/fa";
import EmployeFichePrint from "./EmployeFichePrint";
import {useOpen} from "../../Acceuil/OpenProvider";



const EmployeTable = forwardRef((props, ref) => {
  const {
    globalSearch,
    setIsAddingEmploye,
    isAddingEmploye,
    departementId,
    departementName,
    includeSubDepartments,
    departements,
    getSubDepartmentIds,
    filtersVisible,
    handleFiltersToggle,
  } = props;
  
  // Initial column visibility from localStorage
  const getInitialColumnVisibility = () => {
    const storedVisibility = localStorage.getItem('employeeColumnVisibility');
    return storedVisibility ? JSON.parse(storedVisibility) : {
      url_img: true,
      matricule: true,
      num_badge: true,
      nom: true,
      prenom: true,
      contrat: true,
      lieu_naiss: true,
      date_naiss: true,
      cin: true,
      cnss: true,
      sexe: true,
      situation_fm: true,
      nb_enfants: true,
      adresse: true,
      ville: true,
      pays: true,
      code_postal: true,
      tel: true,
      fax: true,
      email: true,
      fonction: true,
      nationalite: true,
      niveau: true,
      echelon: true,
      categorie: true,
      coeficients: true,
      imputation: true,
      date_entree: true,
      date_embauche: true,
      date_sortie: true,
      salaire_base: true,
      salaire_moyen: true,
      salaire_reference_annuel: true,
      remarque: true,
      centreCout: true,
    };
  };

  // State variables
  const [employeesWithContracts, setEmployeesWithContracts] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEmployers, setSelectedEmployers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [employeesPerPage, setEmployeesPerPage] = useState(10);
  const [columnVisibility, setColumnVisibility] = useState(getInitialColumnVisibility());
  // const [globalSearch, setGlobalSearch] = useState('');
  const [data, setData] = useState([]);
  const dropdownRef = useRef(null);

  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [calendriers, setCalendriers] = useState([]);
  const [assignedCalendriers, setAssignedCalendriers] = useState([
    {
      calendrier_id: '',
      date_debut: '',
      date_fin: ''
    }
  ]);
  const [showActions, setShowActions] = useState(true);
  const [hovered, setHovered] = useState(false);

  const [hoveredColonnes, setHoveredColonnes] = useState(false);
const [hoveredPlanning, setHoveredPlanning] = useState(false);
const [hoveredAdd, setHoveredAdd] = useState(false);
const [showDropdownColonnes, setShowDropdownColonnes] = useState(false);
const [showDropdownPlanning, setShowDropdownPlanning] = useState(false);
/*  Régle compensation */
const [showRegleDropdown, setShowRegleDropdown] = useState(false);
const [reglesComp, setReglesComp] = useState([]);
const [assignedRegles, setAssignedRegles] = useState([
  { regle_id: '', date_debut: '', date_fin: '' }
]);

const [items, setItems] = useState([
  { date_debut: '', date_fin: '' }
]);


const [showRegleModal, setShowRegleModal] = useState(false);

const [showImportDropdown, setShowImportDropdown] = useState(false);
const [showImportModal, setShowImportModal] = useState(false);
const [selectedFile, setSelectedFile] = useState(null);
const [isExpanded, setIsExpanded] = useState(false);
const  {dynamicStyles} = useOpen();
const  {open} = useOpen();



// Print fiche employé
const [showFicheModal, setShowFicheModal] = useState(false);
const [selectedEmployeeForPrint, setSelectedEmployeeForPrint] = useState(null);

// Filter options state
const [filterOptions, setFilterOptions] = useState({
  filters: [
    {
      key: 'sexe',
      label: 'Sexe',
      value: '',
      placeholder: 'Sexe',
      type: 'select'
    },
    {
      key: 'pays',
      label: 'Pays',
      value: '',
      placeholder: 'Pays',
      type: 'select'
    },
    {
      key: 'ville',
      label: 'Ville',
      value: '',
      placeholder: 'Ville',
      type: 'select'
    },
    {
      key: 'salaire',
      label: 'Salaire',
      type: 'range',
      min: '',
      max: '',
      placeholderMin: 'Min',
      placeholderMax: 'Max'
    },
    {
      key: 'age',
      label: 'Âge',
      type: 'range',
      min: '',
      max: '',
      placeholderMin: 'Min',
      placeholderMax: 'Max'
    }
  ]
});




const allEmployeFields = [
  'matricule', 'num_badge', 'nom', 'prenom', 'lieu_naiss', 'date_naiss', 'cin', 'cnss', 'sexe',
  'situation_fm', 'nb_enfants', 'adresse', 'ville', 'pays', 'code_postal', 'tel', 'fax', 'email',
  'fonction', 'nationalite', 'niveau', 'echelon', 'categorie', 'coeficients', 'imputation',
  'date_entree', 'date_embauche', 'date_sortie', 'salaire_base', 'remarque',
  'centreCout', 'departement_id', 'delivree_par', 'date_expiration', 'carte_sejour',
  'motif_depart', 'dernier_jour_travaille', 'notification_rupture', 'engagement_procedure',
  'signature_rupture_conventionnelle', 'transaction_en_cours', 'bulletin_modele',
  'salaire_moyen', 'salaire_reference_annuel'
];

const [selectedFields, setSelectedFields] = useState([]);
const [fieldMappings, setFieldMappings] = useState({});


















  // Définition de TOUTES les colonnes disponibles (avant filtrage par visibilité)
  const allColumns = useMemo(() => [
    { 
      key: "url_img", 
      label: "Photo",
      render: (item) => (
        item.url_img ? (
          <img
            src={`http://127.0.0.1:8000/storage/${item.url_img}`}
            alt={`${item.nom} ${item.prenom}`}
            className="zoomable-image"

            style={{
              width: "60px",
              height: "60px",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: "50px",
              height: "50px",
              backgroundColor: "#fff",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              borderRadius: "50%",
            }}
          >
            No Photo
          </div>
        )
      )
    },
    { key: "matricule", label: "Matricule" },
    { key: "num_badge", label: "Num Badge" },
    { key: "nom", label: "Nom" },
    { key: "prenom", label: "Prenom" },
    { 
      key: "contrat", 
      label: "Contrat",
      render: (item, searchTerm, toggleRowExpansion) => (
        <button
          style={{
            backgroundColor: "#fff",
            fontSize: "0.875rem",
            border: "none",
            color: "#111827",
            fontWeight: 500,
            display: "flex",
            alignItems: "center"
          }}
          onClick={() => toggleRowExpansion(item.id)}
        >
          <FontAwesomeIcon
            style={{ marginRight: "5px" }}
            icon={expandedRows[item.id] ? faChevronUp : faChevronDown}
          />
          {item.contrat && item.contrat.length > 0
            ? item.contrat[0].type_contrat
            : "Pas de contrat"}
        </button>
      )
    },



    { key: "lieu_naiss", label: "Lieu de naissance" },
    { key: "date_naiss", label: "Date de naissance" },
    { key: "cin", label: "CIN" },
    { key: "cnss", label: "CNSS" },
    { key: "sexe", label: "Sexe" },
    { key: "situation_fm", label: "Situation familiale" },
    { key: "nb_enfants", label: "Nombre d'enfants" },
    { key: "adresse", label: "Adresse" },
    { key: "ville", label: "Ville" },
    { key: "pays", label: "Pays" },
    { key: "code_postal", label: "Code postal" },
    { key: "tel", label: "Téléphone" },
    { key: "fax", label: "Fax" },
    { key: "email", label: "Email" },
    { key: "fonction", label: "Fonction" },
    { key: "nationalite", label: "Nationalité" },
    { key: "niveau", label: "Niveau" },
    { key: "echelon", label: "Échelon" },
    { key: "categorie", label: "Catégorie" },
    { key: "coeficients", label: "Coefficients" },
    { key: "imputation", label: "Imputation" },
    { key: "date_entree", label: "Date d'entrée" },
    { key: "date_embauche", label: "Date d'embauche" },
    { key: "date_sortie", label: "Date de sortie" },
    { key: "salaire_base", label: "Salaire de base" },
    { key: "salaire_moyen", label: "Salaire Moyen" },
    { key: "salaire_reference_annuel", label: "Salaire Anuelle" },
    { key: "remarque", label: "Remarque" },
    { key: "centreCout", label: "Centre de coût" },
  ], [expandedRows]);

  // Filtrer les colonnes pour l'affichage dans le tableau
  const visibleColumns = useMemo(() => {
    return allColumns.filter(col => columnVisibility[col.key]);
  }, [allColumns, columnVisibility]);

  // Colonnes pour les contrats

  const contratColumns = useMemo(() => [
    { label: "Numéro de contrat", key: "numero_contrat" },
    { label: "Type de contrat", key: "type_contrat" },
    { label: "Arrêt prévu", key: "arret_prevu" },
    { label: "Durée prévue", key: "duree_prevu" },
    { label: "désignation", key: "design" },
    { label: "Début le", key: "debut_le" },
    { label: "Arrêt effectif", key: "arret_effectif" },
    { label: "Durée effective", key: "duree_effective" },
  ], []);



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
  




  const fetchCalendriers = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/calendrie');
      setCalendriers(response.data.calendrie); 
      console.log(' Données reçues calendriers :', response.data.calendrie);

    } catch (error) {
      console.error('Erreur lors de la récupération des calendriers', error);
    }
  };

  useEffect(() => {
    fetchCalendriers();
  }, []);

  const fetchEmployersWithContracts = useCallback(async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/departements/employes`);
      if (response.data && Array.isArray(response.data)) {
        setEmployeesWithContracts(response.data);
        localStorage.setItem("employeesWithContracts", JSON.stringify(response.data));
        console.log("Employés récupérés:", response.data);

      }
    } catch (error) {
      console.error("Erreur lors de la récupération des employés:", error);
    }
  }, []);



  useEffect(() => {
    const storedData = localStorage.getItem("employeesWithContracts");
    if (storedData) {
      setEmployeesWithContracts(JSON.parse(storedData));
    }
    fetchEmployersWithContracts();
  }, [fetchEmployersWithContracts]);




  useEffect(() => {
    fetch('http://localhost:8000/api/full-data')
      .then(response => response.json())
      .then(data => {
        setData(data);
      })
      .catch(error => console.error('Erreur de chargement:', error));
  }, []);



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
  //       });
  
  
  //   if (globalSearch.trim()) {
  //     const searchTermLower = globalSearch.toLowerCase().trim();
  //     result = result.filter((employer) => {
  //       const columnMatch = allColumns.some((column) => {
  //         const value = employer[column.key];
  //         return value && value.toString().toLowerCase().includes(searchTermLower);
  //       });
  
  //       const contractMatch =
  //         employer.contracts &&
  //         employer.contracts.some((contract) =>
  //           contratColumns.some((column) => {
  //             const value = contract[column.key];
  //             return value && value.toString().toLowerCase().includes(searchTermLower);
  //           })
  //         );
  
  //       return columnMatch || contractMatch;
  //     });
  
  //   }
  
  //   return result;
  // }, [
  //   employeesWithContracts,
  //   departementId,
  //   includeSubDepartments,
  //   getSubDepartmentIds,
  //   departements,
  //   globalSearch,
  //   allColumns,
  //   contratColumns
  // ]);
  






  const filteredEmployers = useMemo(() => {
  
    let result = includeSubDepartments
      ? employeesWithContracts.filter((emp) => {
          const subIds = getSubDepartmentIds(departements, departementId);
  
          return (
            (emp.departements &&
              emp.departements.length > 0 &&
              emp.departements.some((dept) => subIds.includes(dept.id))) ||
            subIds.includes(emp.departement_id)
          );
        })
      : employeesWithContracts.filter((emp) => {
          return (
            (emp.departements &&
              emp.departements.length > 0 &&
              emp.departements.some((dept) => dept.id === departementId)) ||
            emp.departement_id === departementId
          );
        });
  
  
    if (globalSearch.trim()) {
      const searchTermLower = globalSearch.toLowerCase().trim();
      result = result.filter((employer) => {
        const columnMatch = allColumns.some((column) => {
          const value = employer[column.key];
          return value && value.toString().toLowerCase().includes(searchTermLower);
        });
  
        const contractMatch =
          employer.contracts &&
          employer.contracts.some((contract) =>
            contratColumns.some((column) => {
              const value = contract[column.key];
              return value && value.toString().toLowerCase().includes(searchTermLower);
            })
          );
  
        return columnMatch || contractMatch;
      });
    }
  
    return result;
  }, [
    employeesWithContracts,
    departementId,
    includeSubDepartments,
    getSubDepartmentIds,
    departements,
    globalSearch,
    allColumns,
    contratColumns
  ]);
  







  const handleColumnsChange = useCallback((column) => {
    setColumnVisibility(prev => {
      const newVisibility = { ...prev, [column]: !prev[column] };
      localStorage.setItem('employeeColumnVisibility', JSON.stringify(newVisibility));
      return newVisibility;
    });
  }, []);

  useEffect(() => {
    const savedColumnVisibility = localStorage.getItem('employeeColumnVisibility');
    
    if (savedColumnVisibility) {
      setColumnVisibility(JSON.parse(savedColumnVisibility));
    } else {
      const defaultVisibility = {};
      allColumns.forEach(col => {
        defaultVisibility[col.key] = true;
      });
      setColumnVisibility(defaultVisibility);
      localStorage.setItem('employeeColumnVisibility', JSON.stringify(defaultVisibility));
    }
  }, [allColumns]);
  
  const toggleRowExpansion = useCallback((employeId) => {
    setExpandedRows(prev => ({
      ...prev,
      [employeId]: !prev[employeId]
    }));
  }, []);

  const handleEmployerAdded = useCallback((newEmployer) => {
    setEmployeesWithContracts(prev => {
      const updated = [...prev, newEmployer];
      localStorage.setItem("employeesWithContracts", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleEmployerUpdated = useCallback((updatedEmployer) => {
    setEmployeesWithContracts(prev => {
      const updated = prev.map(emp => emp.id === updatedEmployer.id ? updatedEmployer : emp);
      localStorage.setItem("employeesWithContracts", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleDeleteEmployer = useCallback(async (id) => {
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
        await axios.delete(`http://127.0.0.1:8000/api/employes/${id}`);
        setEmployeesWithContracts(prev => {
          const updated = prev.filter(emp => emp.id !== id);
          localStorage.setItem("employeesWithContracts", JSON.stringify(updated));
          return updated;
        });
        Swal.fire("Supprimé!", "L'employé a été supprimé.", "success");
      } catch (error) {
        console.error("Error deleting employer:", error);
        Swal.fire("Erreur!", "Une erreur est survenue lors de la suppression.", "error");
      }
    }
  }, []);

  const handleSelectEmployer = useCallback((employer) => {
    setSelectedEmployer(employer);
  }, []);

  const handleAddNewEmployee = useCallback(() => {
    if (!showAddForm) {
      setSelectedEmployer(null);
      setShowAddForm(true);
      setIsAddingEmploye(true);
      setShowActions(false);
    }
  }, [showAddForm, setIsAddingEmploye]);
  
  const handleEditEmployer = useCallback((employer) => {
    setSelectedEmployer(employer);
    setShowAddForm(true);
    setIsAddingEmploye(true);
    setShowActions(false);
  }, [setIsAddingEmploye]);
     
  useEffect(() => {
    if (!showAddForm) {
      setShowActions(true);
    }
  }, [showAddForm]);
  

  const handleCloseForm = useCallback(() => {
    setSelectedEmployer(null);
    setShowAddForm(false);
    setIsAddingEmploye(false);
  }, [setIsAddingEmploye]);


  const exportToPDF = useCallback(() => {
    const doc = new jsPDF();
    const tableColumn = allColumns.filter(col => columnVisibility[col.key]).map(col => col.label);
    const tableRows = filteredEmployers.map(emp =>
      allColumns.filter(col => columnVisibility[col.key]).map(col => emp[col.key])
    );
    doc.setFontSize(18);
    doc.text(`Employés - ${departementName}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
    });
    doc.save(`employes_${departementName}_${new Date().toISOString()}.pdf`);
  }, [allColumns, columnVisibility, filteredEmployers, departementName]);
  



  // Export to Excel
  const exportToExcel = useCallback(() => {
    const ws = XLSX.utils.json_to_sheet(
      filteredEmployers.map(emp => {
        const row = {};
        allColumns.forEach(col => {
          if (columnVisibility[col.key]) {
            row[col.label] = emp[col.key];
          }
        });
        return row;
      })
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employés");
    XLSX.writeFile(wb, `employes_${departementName}_${new Date().toISOString()}.xlsx`);
  }, [allColumns, columnVisibility, filteredEmployers, departementName]);
  
  // Print handler
  const handlePrint = useCallback(() => {
    const printWindow = window.open("", "_blank");
    const tableColumn = allColumns.filter(col => columnVisibility[col.key]).map(col => col.label);
    const tableRows = filteredEmployers.map(emp =>
      allColumns.filter(col => columnVisibility[col.key]).map(col => emp[col.key])
    );
  
    printWindow.document.write(`
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid black; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { margin-bottom: 20px; }




@page {
  margin: 0;
}
body {
  margin: 1cm;
}
  

          </style>
        </head>
        <body>
          <div class="header">
            <h1>Employés dans ${departementName}</h1>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>${tableColumn.map(col => `<th>${col}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${tableRows.map(row => `
                <tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>
              `).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [allColumns, columnVisibility, filteredEmployers, departementName]);
  
  

  useImperativeHandle(ref, () => ({
    exportToPDF,
    exportToExcel,
    handlePrint
  }));







  const handleSelectAllChange = useCallback(() => {
    if (selectedEmployers.length === filteredEmployers.length) {
      setSelectedEmployers([]);
    } else {
      setSelectedEmployers(filteredEmployers.map(emp => emp.id));
    }
  }, [filteredEmployers, selectedEmployers]);

  const handleCheckboxChange = useCallback((id) => {
    setSelectedEmployers(prev => {
      if (prev.includes(id)) {
        return prev.filter(empId => empId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedEmployers.length === 0) return;

    const result = await Swal.fire({
      title: "Êtes-vous sûr?",
      text: `Vous allez supprimer ${selectedEmployers.length} employé(s)!`,
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
          selectedEmployers.map(id => axios.delete(`http://127.0.0.1:8000/api/employes/${id}`))
        );
        
        setEmployeesWithContracts(prev => {
          const updated = prev.filter(emp => !selectedEmployers.includes(emp.id));
          localStorage.setItem("employeesWithContracts", JSON.stringify(updated));
          return updated;
        });
        
        setSelectedEmployers([]);
        Swal.fire("Supprimés!", "Les employés ont été supprimés.", "success");
      } catch (error) {
        console.error("Error deleting selected employers:", error);
        Swal.fire("Erreur!", "Une erreur est survenue lors de la suppression.", "error");
      }
    }
  }, [selectedEmployers]);




  const handleChangePage = useCallback((event, newPage) => {
    setCurrentPage(newPage);
  }, []);


  const handleChangeRowsPerPage = useCallback((event) => {
    setEmployeesPerPage(parseInt(event.target.value, 10));
    setCurrentPage(0);
  }, []);


    // Handle global search change
    const handleGlobalSearchChange = (e) => {
      setGlobalSearch(e.target.value);
      setPage(0);
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
  
  // Function to calculate age from date of birth
  const calculateAge = (dateNaiss) => {
    if (!dateNaiss) return null;
    const today = new Date();
    const birthDate = new Date(dateNaiss);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };
  
  const applyFilters = (employees) => {
    return employees.filter(emp => {
      const villeFilter = filterOptions.filters.find(f => f.key === 'ville');
      const paysFilter = filterOptions.filters.find(f => f.key === 'pays');
      const sexeFilter = filterOptions.filters.find(f => f.key === 'sexe');
      const salaireFilter = filterOptions.filters.find(f => f.key === 'salaire');
      const ageFilter = filterOptions.filters.find(f => f.key === 'age');
  
      const matchesVille = !villeFilter?.value || emp.ville?.toLowerCase() === villeFilter.value.toLowerCase();
      const matchesPays = !paysFilter?.value || emp.pays?.toLowerCase() === paysFilter.value.toLowerCase();
      const matchesSexe = !sexeFilter?.value || emp.sexe?.toLowerCase() === sexeFilter.value.toLowerCase();
      
      // Salary filter
      const matchesSalaire = (() => {
        if (!salaireFilter?.min && !salaireFilter?.max) return true;
        const salary = parseFloat(emp.salaire_base) || 0;
        const minSalary = salaireFilter.min ? parseFloat(salaireFilter.min) : 0;
        const maxSalary = salaireFilter.max ? parseFloat(salaireFilter.max) : Infinity;
        
        return salary >= minSalary && salary <= maxSalary;
      })();
      
      // Age filter
      const matchesAge = (() => {
        if (!ageFilter?.min && !ageFilter?.max) return true;
        const age = calculateAge(emp.date_naiss);
        if (age === null) return false;
        
        const minAge = ageFilter.min ? parseInt(ageFilter.min) : 0;
        const maxAge = ageFilter.max ? parseInt(ageFilter.max) : Infinity;
        
        return age >= minAge && age <= maxAge;
      })();
  
      return matchesVille && matchesPays && matchesSexe && matchesSalaire && matchesAge;
    });
  };
  
  useEffect(() => {
    const getUniqueValues = (data, key) => {
      return [...new Set(data.map(emp => emp[key]).filter(Boolean))];
    };
  
    setFilterOptions(prev => ({
      filters: prev.filters.map(filter => {
        if (filter.type === 'select') {
          let options = [];
          if (filter.key === 'ville') {
            options = getUniqueValues(employeesWithContracts, 'ville').map(val => ({ label: val, value: val }));
          } else if (filter.key === 'pays') {
            options = getUniqueValues(employeesWithContracts, 'pays').map(val => ({ label: val, value: val }));
          } else if (filter.key === 'sexe') {
            options = getUniqueValues(employeesWithContracts, 'sexe').map(val => ({ label: val, value: val }));
          }
          return { ...filter, options };
        }
        return filter;
      })
    }));
  }, [employeesWithContracts]);
  
  const normalizeValue = (value) => String(value).toLowerCase().trim();
  
  const filteredEmployees = applyFilters(
    filteredEmployers.filter(emp =>
      globalSearch
        .toLowerCase()
        .split(/\s+/)
        .every(term =>
          Object.values(emp).some(
            value =>
              value !== null &&
              normalizeValue(value.toString()).includes(normalizeValue(term))
          )
        )
    )
  );
  












  const handleChangeDate = (index, field, value) => {
    const updated = [...assignedCalendriers];
    updated[index][field] = value;
    setAssignedCalendriers(updated);
  };
  

  const handleChangeCalendrier = (index, value) => {
    const updated = [...assignedCalendriers];
    updated[index].calendrier_id = value;
    setAssignedCalendriers(updated);
  };


  const handleAffecterPlanning = async () => {
    if (selectedEmployers.length === 0) {
      Swal.fire("Attention", "Veuillez sélectionner un ou plusieurs employés.", "warning");
      return;
    }
  
    try {
      console.log("Début de l'affectation du planning...");
  
      for (const employerId of selectedEmployers) {
        console.log(`Affectation pour employé ID: ${employerId}`);
  
        for (const item of assignedCalendriers) {
          if (!item.calendrier_id || !item.date_debut || !item.date_fin) {
            console.warn(" Champs manquants pour un des plannings :", item);
            continue;
          }
  
          const payload = {
            employe_id: employerId,
            calendrier_id: item.calendrier_id,
            date_debut: item.date_debut,
            date_fin: item.date_fin,
          };
  
          console.log(" Envoi du planning :", payload);
  
          await axios.post("http://127.0.0.1:8000/api/calendriers-employes", payload);
  
          console.log(`Planning affecté à l'employé ${employerId}`);
        }
      }
  
      Swal.fire("Succès", "Planning(s) affecté(s) avec succès !", "success");
  
      setShowPlanningModal(false);
      setSelectedEmployers([]);
  
      console.log("Tous les plannings ont été affectés avec succès.");
    } catch (error) {
      console.error(" Erreur lors de l'affectation du planning :", error);
      Swal.fire("Erreur", "Échec de l'affectation du planning", "error");
    }
  };
  



// <----------------- Affecter regle componsation-------------------------> 


const fetchRegles = async () => {
  try {
    const res = await axios.get(
      'http://127.0.0.1:8000/api/regle-compensations'
    );
    setReglesComp(Array.isArray(res.data) ? res.data : res.data.data);
    console.log("res.data regle", res.data)
  } catch (err) {
    console.error('Erreur fetch règles', err);
  }
};

useEffect(() => { fetchRegles(); }, []);
  

const handleChangeRegleDate = (idx, field, value) => {
  const copy = [...assignedRegles];
  copy[idx][field] = value;
  setAssignedRegles(copy);
};

const handleChangeRegle = (idx, regleId) => {
  const copy = [...assignedRegles];
  copy[idx].regle_id  = regleId;

  const regle = reglesComp.find(r => r.id === Number(regleId));
  copy[idx].frequence = regle ? regle.frequence_calcul : '';

  setAssignedRegles(copy);
};

const handleAffecterRegle = async () => {
  if (selectedEmployers.length === 0) {
    Swal.fire("Attention", "Veuillez sélectionner un ou plusieurs employés.", "warning");
    return;
  }


  try {
    for (const empId of selectedEmployers) {
      for (const it of assignedRegles) {
        if (!it.regle_id || !it.date_debut || !it.date_fin) continue;

        await axios.post(
          'http://127.0.0.1:8000/api/regles-comp-employes',

          {
            employe_id: empId,
            regle_compensation_id: it.regle_id,
            date_debut: it.date_debut,
            date_fin: it.date_fin
          }
        );
      }
    }

    Swal.fire("Succès", "Règle(s) affectée(s) avec succès !", "success");

    setShowRegleModal(false);
    setSelectedEmployers([]);
  } catch (err) {
    console.error('Erreur affectation règle', err);
    Swal.fire("Erreur", "Échec de l'affectation des règles", "error");
  }
};

// <----------------- Insertion des données à partir du fichier excel -------------------------> 



const handleExcelImport = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);

    axios.post('http://localhost:8000/api/employes', { data: json })
      .then(() => {
        Swal.fire('Succès', 'Employés importés avec succès', 'success');
      })
      .catch(error => {
        console.error(error);
        Swal.fire('Erreur', 'Erreur lors d importation', 'error');
      });
  };

  reader.readAsArrayBuffer(file);
};








const handleFileChange = (e) => {
  setSelectedFile(e.target.files[0]);
};

const handleImportValidation = () => {
  if (!selectedFile) {
    alert("Veuillez sélectionner un fichier Excel.");
    return;
  }

  const formData = new FormData();
  formData.append("file", selectedFile);
  formData.append("fieldMappings", JSON.stringify(fieldMappings));
  formData.append("departement_id", departementId);

  axios.post("http://127.0.0.1:8000/api/import-employes", formData)
    .then(response => {
      Swal.fire("Succès", "Importation terminée !", "success");

      fetchEmployersWithContracts(); 

      setShowImportModal(false);
      setShowDropdown(false);
    })
    .catch(error => {
      Swal.fire("Erreur", "Échec de l'importation", "error");
      console.error(error);
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
  

  // Fonction pour afficher les détails du contrat
  const renderExpandedRow = useCallback((employer) => {
    console.log("Employer reçu dans renderExpandedRow :", employer);
    console.log("Contrats :", employer.contrat);
  
    return (
      <table className="w-full">
        <thead  className="border-b">
          <tr   style={{ backgroundColor:'red'}}>
            {contratColumns.map((col) => (
              <th key={col.key} className="border px-2 py-1 text-sm" >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employer.contrat && employer.contrat.length > 0 ? (
            employer.contrat.map((contrat, index) => {
              return (
                <tr key={contrat.id}>
                  {contratColumns.map((col) => (
                    <td key={col.key} className="border px-2 py-1 text-sm">
                      {contrat[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={contratColumns.length} className="text-center py-2">
                Aucun contrat trouvé pour cet employé.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
  }, [contratColumns]);
  




  const renderCustomActions = useCallback((employer) => {
    return (
      <>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEmployeeForPrint(employer);
            setShowFicheModal(true);
          }}
          aria-label="Fiche employé"
          title="Fiche employé"
          style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
        >
          <FontAwesomeIcon icon={faIdCard} style={{ color: '#17a2b8', fontSize: '14px' }} />
        </button>
      </>
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





  const handleChangeDateRegle = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
  };
   



  const handleOpenPlanningModal = () => {
    setAssignedCalendriers([{
      calendrier_id: '',
      date_debut: '',
      date_fin: ''
    }]);
    setShowPlanningModal(true);
  };

  const handleOpenRegleModal = () => {
    const initial = [{
      regle_id: '',
      frequence: '',
      date_debut: '',
      date_fin: ''
    }];
    setAssignedRegles(initial);
    setItems(initial); 
    setShowRegleModal(true);
  };
      




  return (

    <div style={{
      position: 'relative',
      left: "-2%",
      // top: "14.19%",
      top : "0",
      height: 'calc(100vh - 160px)',
    }} className={`${isAddingEmploye ? "with-form" : "container_employee"}`}>
      
      
      <div className="mt-4"   >
        <div className="section-header mb-3">
          <div className="d-flex align-items-center justify-content-between" style={{ gap: 24 }}>
            {/* Bloc titre */}
            <div>
              <span className="section-title mb-1">
                <i className="fas fa-calendar-times me-2"></i>
                Détails Employé
              </span>
              {!showAddForm && (
  <p className="section-description text-muted mb-0">
    {filteredEmployees.length} employé
    {filteredEmployees.length > 1 ? 's' : ''} actuellement affiché
    {filteredEmployees.length > 1 ? 's' : ''}
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
    handleAddNewEmployee();
  }}
  className={`btn btn-outline-primary d-flex align-items-center ${!departementId ? "disabled-btn" : ""}`}
  size="sm"
              style={{   marginRight:'30px !important' ,
                width: '160px',              }}
            >
              <FaPlusCircle className="me-2" />
              Ajouter Employé
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
              
              <Dropdown show={showDropdown} onToggle={(isOpen) => setShowDropdown(isOpen)}>
                <Dropdown.Toggle
                  as="button"
                  id="dropdown-planning"
                  title="Affecter Planning"
                  onClick={handleOpenPlanningModal}
                  style={{
                    ...iconButtonStyle,
                    cursor: selectedEmployers.length === 0 ? "not-allowed" : "pointer",
                    backgroundColor: selectedEmployers.length === 0 ? "#e5e7eb" : "#ffffff", 
                    borderColor: selectedEmployers.length === 0 ? "#d1d5db" : "#ccc"
                  }}
                  disabled={selectedEmployers.length === 0}
                >
                  <FontAwesomeIcon
                    icon={faCalendarAlt}
                    style={{
                      width: 18,
                      height: 18,
                      color: selectedEmployers.length === 0 ? "#9ca3af" : "#4b5563"
                    }}
                  />
                </Dropdown.Toggle>
              </Dropdown>
              <Dropdown
                show={showRegleDropdown}
                onToggle={isOpen => setShowRegleDropdown(isOpen)}
              >
                <Dropdown.Toggle
                  as="button"
                  id="dropdown-regle"
                  title="Affecter règle compensation"
                  onClick={handleOpenRegleModal}
                  style={{
                    ...iconButtonStyle,
                    cursor: selectedEmployers.length === 0 ? "not-allowed" : "pointer",
                    backgroundColor: selectedEmployers.length === 0 ? "#e5e7eb" : "#ffffff",
                    borderColor: selectedEmployers.length === 0 ? "#d1d5db" : "#ccc"
                  }}
                  disabled={selectedEmployers.length === 0}
                >
                  <FontAwesomeIcon
                    icon={faClipboardCheck}
                    style={{
                      width: 18,
                      height: 18,
                      color: selectedEmployers.length === 0 ? "#9ca3af" : "#4b5563"
                    }}
                  />
                </Dropdown.Toggle>
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


      {/* Modal pour l'affectation du planning */}
      <Modal
  show={showPlanningModal}
  onHide={() => setShowPlanningModal(false)}
  dialogClassName="custom-modal"
  centered
>
  <Modal.Body className="d-flex flex-column align-items-center justify-content-center pt-0">
    <div className="position-relative w-100" style={{ marginTop: '30px' }}>
      {/* Titre flottant */}
      <div
        style={{
          position: 'absolute',
          top: '-12px',
          left: '20px',
          backgroundColor: 'white',
          padding: '0 12px',
          color: '#00afaa',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          zIndex: 1,
        }}
      >
        Affecter un planning
      </div>

      {/* Contenu encadré */}
      <div
        style={{
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          padding: '30px 25px 10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          backgroundColor: 'white',
          maxHeight: '400px',
          overflowY: 'auto',
        }}
      >
        <Table className="custom-header" style={{ marginBottom: 0 }}>
          <thead>
            <tr style={{ textAlign: 'center' }}>
              <th style={{ color: '#4b5563', backgroundColor: '#f9fafb', fontWeight: '600' }}>Planning</th>
              <th style={{ color: '#4b5563', backgroundColor: '#f9fafb', fontWeight: '600' }}>Date début</th>
              <th style={{ color: '#4b5563', backgroundColor: '#f9fafb', fontWeight: '600' }}>Date fin</th>
              <th style={{ color: '#4b5563', backgroundColor: '#f9fafb', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignedCalendriers.map((item, index) => (
              <tr key={index}>
                <td>
                  <Form.Select
                    value={item.calendrier_id}
                    onChange={(e) => handleChangeCalendrier(index, e.target.value)}
                    style={{
                      height: 40,
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="">-- Choisir --</option>
                    {Array.isArray(calendriers) && calendriers.map((cal) => ( 
  <option key={cal.id} value={cal.id}>
    {cal.nom}
  </option>
))}
                  </Form.Select>
                </td>
                <td>
                  <Form.Control
                    type="date"
                    value={item.date_debut}
                    onChange={(e) => handleChangeDate(index, "date_debut", e.target.value)}
                    style={{
                      height: 40,
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}
                  />
                </td>
                <td>
                  <Form.Control
                    type="date"
                    value={item.date_fin}
                    onChange={(e) => handleChangeDate(index, "date_fin", e.target.value)}
                    style={{
                      height: 40,
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}
                  />
                </td>
                <td>
                  <FontAwesomeIcon
                    onClick={() => {
                      const newList = [...assignedCalendriers];
                      newList.splice(index, 1);
                      setAssignedCalendriers(newList.length ? newList : [{
                        calendrier_id: '',
                        date_debut: '',
                        date_fin: ''
                      }]);
                    }}
                    icon={faTrash}
                    style={{
                      color: "#ff4757",
                      cursor: "pointer",
                      fontSize: '1.1rem',
                      transition: 'all 0.2s ease',
                      marginLeft: '30px'
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {/* Info nombre de plannings */}
        <div className="mt-3 text-end">
          <small className="text-muted">
            {assignedCalendriers.length} planning(s) assigné(s)
          </small>
        </div>
      </div>
    </div>
  </Modal.Body>

  <Modal.Footer className="border-0 pt-0 d-flex justify-content-center">
  <button
      className="btn px-4 py-2"
      style={{
        backgroundColor: '#00afaa',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontWeight: '500',
        transition: 'all 0.2s ease'
      }}
      onClick={handleAffecterPlanning}
    >
      <i className="fas fa-check me-2"></i>
      Valider
    </button>

    <button
      className="btn px-4 py-2 me-3"
      style={{
        backgroundColor: 'white',
        color: '#00afaa',
        border: '1px solid #00afaa',
        borderRadius: '8px',
        fontWeight: '500',
        transition: 'all 0.2s ease'
      }}
      onClick={() => setShowPlanningModal(false)}
    >
      Annuler
    </button>
  </Modal.Footer>
</Modal>
      {/* Modal pour l'affectation de règle compensation */}
      <Modal
        show={showRegleModal}
        onHide={() => setShowRegleModal(false)}
        dialogClassName="custom-modal"
        centered
      >
        <Modal.Body className="d-flex flex-column align-items-center justify-content-center pt-0">
          {/* Conteneur pour l'affectation de règle */}
          <div className="position-relative w-100" style={{ marginTop: '30px'}} >
          {/* Titre flottant */}
            <div
              style={{
                position: 'absolute',
                top: '-12px',
                left: '20px',
                backgroundColor: 'white',
                padding: '0 12px',
                color: '#00afaa',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                zIndex: 1,
              }}
            >
              Affecter une règle de compensation
            </div>

            {/* Contenu encadré */}
            <div
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                padding: '30px 25px 10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                backgroundColor: 'white',
                maxHeight: '400px',
                overflowY: 'auto',
              }}
            >
{/* <div className="d-flex justify-content mb-3">
  <span
    style={{
      color: '#4b5563',
      cursor: 'pointer',
      textDecoration: 'underline',
      fontWeight: '500',
      fontSize: '0.95rem'
    }}
    onClick={() =>
      setAssignedRegles(prev => [
        ...prev,
        { regle_id: '', frequence: '', date_debut: '', date_fin: '' }
      ])
    }
  >
    + Ajouter une règle
  </span>
</div> */}

              <Table className="custom-header" style={{ marginBottom: 0 }}>
                <thead>
                  <tr style={{  textAlign: 'center'}}>
                    <th style={{ color: '#4b5563', backgroundColor: '#f9fafb',fontWeight: '600' }}>Règle</th>
                    <th style={{ color: '#4b5563', backgroundColor: '#f9fafb',fontWeight: '600' }}>Fréquence</th>
                    <th style={{ color: '#4b5563', backgroundColor: '#f9fafb',fontWeight: '600' }}>Date début</th>
                    <th style={{ color: '#4b5563', backgroundColor: '#f9fafb',fontWeight: '600' }}>Date fin</th>
                    <th style={{ color: '#4b5563', backgroundColor: '#f9fafb',fontWeight: '600' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedRegles.map((it, idx) => (
                    <tr key={idx}>
                      {/* Sélecteur de règle */}
                      <td>
                        <Form.Select
                          value={it.regle_id}
                          onChange={e => handleChangeRegle(idx, e.target.value)}
                          style={{ 
                            height: 40,
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            fontSize: '0.9rem'
                          }}
                        >
                          <option value="">-- Choisir --</option>
                          {reglesComp.map(r => (
                            <option key={r.id} value={r.id}>
                              {r.description ?? r.nom ?? `Règle ${r.id}`}
                            </option>
                          ))}
                        </Form.Select>
                      </td>

                      {/* Fréquence */}
                      <td>
                        <Form.Control
                          plaintext
                          readOnly
                          value={it.frequence}
                          style={{ 
                            height: 40,
                            fontSize: '0.9rem',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            placeholder: 'Fréquence'
                          }}
                        />
                      </td>

                      {/* Date début */}
                      <td>
                        <Form.Control
                          type="date"
                          value={items[idx].date_debut || ''}
                          onChange={(e) => handleChangeDateRegle(idx, 'date_debut', e.target.value)}
                          style={{ 
                            height: 40,
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            fontSize: '0.9rem',

                          }}
                        />
                      </td>

                      {/* Date fin */}
                      <td>
                        <Form.Control
                          type="date"
                          value={items[idx].date_fin || ''}
                          onChange={(e) => handleChangeDateRegle(idx, 'date_fin', e.target.value)}
                          style={{ 
                            height: 40,
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            fontSize: '0.9rem'
                          }}
                        />
                      </td>

                      {/* Icône suppression */}
                      <td>
                        <FontAwesomeIcon
                          icon={faTrash}
                          style={{ 
                            color: '#ff4757', 
                            cursor: 'pointer',
                            fontSize: '1.1rem',
                            transition: 'all 0.2s ease', 
                            marginLeft: '30px'
                          }}
                          onClick={() => {
                            const copy = [...assignedRegles];
                            copy.splice(idx, 1);
                            setAssignedRegles(copy.length ? copy : [{ regle_id:'', frequence:'', date_debut:'', date_fin:'' }]);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Information sur les règles assignées */}
              <div className="mt-3 text-end">
                <small className="text-muted">
                  {assignedRegles.length} règle(s) assignée(s)
                </small>
              </div>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer className="border-0 pt-0 d-flex justify-content-center">
        <button
            className="btn px-4 py-2"
            style={{ 
              backgroundColor: '#00afaa', 
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onClick={handleAffecterRegle}
          >
            <i className="fas fa-check me-2"></i>
            Valider
          </button>

          <button
            className="btn px-4 py-2 me-3"
            style={{ 
              backgroundColor: 'white', 
              color: '#00afaa', 
              border: '1px solid #00afaa',
              borderRadius: '8px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setShowRegleModal(false)}
          >
            Annuler
          </button>
        </Modal.Footer>
      </Modal>

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

      {/* Modal pour insertion des données excel  */}

      <Modal
  show={showImportModal}
  onHide={() => setShowImportModal(false)}
  dialogClassName="custom-modal-excel"
  centered

>
{/* <Modal.Header closeButton>
    <Modal.Title>Importer des employés depuis Excel</Modal.Title>
  </Modal.Header> */}
  
  <Modal.Body className="d-flex flex-column align-items-center justify-content-center pt-0">
  <Form.Group  className="mb-4 "        style={{
      marginRight:'530px',
      marginTop:'40px'
      }}>

  <div
    className="import-file-container px-4 py-3"
    style={{
      border: '2px dashed #00afaa',
      borderRadius: '8px',
      backgroundColor: 'rgba(0, 175, 170, 0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      marginTop: '15 px',
      width:'182%', 
      marginLeft:'none'

    }}
  >
    <i
      className="fas fa-cloud-upload-alt"
      style={{ fontSize: '1.5rem', color: '#00afaa' }}
    ></i>
    <h6 className="mb-0" style={{ whiteSpace: 'nowrap' }}>
      Déposez votre fichier :
    </h6>
    <Form.Control
      type="file"
      accept=".xlsx, .xls"
      onChange={handleFileChange}
      style={{ maxWidth: '400px' }}
    />
  </div>
</Form.Group>

    {/* Conteneur pour les champs à importer */}
    <div className="position-relative mb-4 w-100">
      {/* Titre flottant */}
      <div
        style={{
          position: 'absolute',
          top: '-12px',
          left: '20px',
          backgroundColor: 'white',
          padding: '0 12px',
          color: '#00afaa',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          zIndex: 1
        }}
      >
        Champs à importer
      </div>

      {/* Contenu encadré */}
      <div
        style={{
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          padding: '30px 25px 20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          backgroundColor: 'white',
        }}
      >
        <div className="d-flex justify-content-between flex-wrap">
          {/* Colonne 1 */}
          <div className="d-flex flex-column me-2" style={{ minWidth: '120px' }}>
            {allEmployeFields.slice(0, 11).map(field => (
              <div className="d-flex align-items-center mb-2">
  <Form.Check
    type="checkbox"
    id={`field-${field}`}
    label={field}
    className="me-2 custom-checkbox1"
    checked={selectedFields.includes(field)}
    onChange={(e) => {
      if (e.target.checked) {
        setSelectedFields([...selectedFields, field]);
      } else {
        setSelectedFields(selectedFields.filter((f) => f !== field));
        const updatedMapping = { ...fieldMappings };
        delete updatedMapping[field];
        setFieldMappings(updatedMapping);
      }
    }}
  />
  
  {selectedFields.includes(field) && (
    <Form.Control
      type="text"
      placeholder="ex: A, B, M1..."
      value={fieldMappings[field] || ''}
      onChange={(e) =>
        setFieldMappings({ ...fieldMappings, [field]: e.target.value })
      }
      style={{ width: '70px', fontSize: '0.8rem' }}
    />
  )}
</div>
            ))}
          </div>

          {/* Colonne 2 */}
          <div className="d-flex flex-column me-2" style={{ minWidth: '120px' }}>
            {allEmployeFields.slice(11, 22).map(field => (
              <div className="d-flex align-items-center mb-2">
  <Form.Check
    type="checkbox"
    id={`field-${field}`}
    label={field}
    className="me-2 custom-checkbox1"
    checked={selectedFields.includes(field)}
    onChange={(e) => {
      if (e.target.checked) {
        setSelectedFields([...selectedFields, field]);
      } else {
        setSelectedFields(selectedFields.filter((f) => f !== field));
        const updatedMapping = { ...fieldMappings };
        delete updatedMapping[field];
        setFieldMappings(updatedMapping);
      }
    }}
  />
  
  {selectedFields.includes(field) && (
    <Form.Control
      type="text"
      placeholder="ex: A, B, M1..."
      value={fieldMappings[field] || ''}
      onChange={(e) =>
        setFieldMappings({ ...fieldMappings, [field]: e.target.value })
      }
      style={{ width: '70px', fontSize: '0.8rem' }}
    />
  )}
</div>
            ))}
          </div>

          {/* Colonne 3 */}
          <div className="d-flex flex-column me-2" style={{ minWidth: '120px' }}>
            {allEmployeFields.slice(22, 33).map(field => (
              <div className="d-flex align-items-center mb-2">
  <Form.Check
    type="checkbox"
    id={`field-${field}`}
    label={field}
    className="me-2 custom-checkbox1"
    checked={selectedFields.includes(field)}
    onChange={(e) => {
      if (e.target.checked) {
        setSelectedFields([...selectedFields, field]);
      } else {
        setSelectedFields(selectedFields.filter((f) => f !== field));
        const updatedMapping = { ...fieldMappings };
        delete updatedMapping[field];
        setFieldMappings(updatedMapping);
      }
    }}
  />
  
  {selectedFields.includes(field) && (
    <Form.Control
      type="text"
      placeholder="ex: A, B, M1..."
      value={fieldMappings[field] || ''}
      onChange={(e) =>
        setFieldMappings({ ...fieldMappings, [field]: e.target.value })
      }
      style={{ width: '70px', fontSize: '0.8rem' }}
    />
  )}
</div>
            ))}
          </div>

          {/* Colonne 4 */}
          <div className="d-flex flex-column" style={{ minWidth: '120px' }}>
            {allEmployeFields.slice(33).map(field => (
              <div className="d-flex align-items-center mb-2">
  <Form.Check
    type="checkbox"
    id={`field-${field}`}
    label={field}
    className="me-2 custom-checkbox1"
    checked={selectedFields.includes(field)}
    onChange={(e) => {
      if (e.target.checked) {
        setSelectedFields([...selectedFields, field]);
      } else {
        setSelectedFields(selectedFields.filter((f) => f !== field));
        const updatedMapping = { ...fieldMappings };
        delete updatedMapping[field];
        setFieldMappings(updatedMapping);
      }
    }}
  />
  
  {selectedFields.includes(field) && (
    <Form.Control
      type="text"
      placeholder="ex: A, B, M1..."
      value={fieldMappings[field] || ''}
      onChange={(e) =>
        setFieldMappings({ ...fieldMappings, [field]: e.target.value })
      }
      style={{ width: '70px', fontSize: '0.8rem' }}
    />
  )}
</div>
            ))}
          </div>
        </div>

        {/* Information sur les champs sélectionnés */}
        <div className="mt-3 text-end">
          <small className="text-muted">
            {selectedFields.length} champ(s) sélectionné(s)
          </small>
        </div>
      </div>
    </div>
  </Modal.Body>
  
  <Modal.Footer className="border-0 pt-0 d-flex justify-content-center">
    <button
      className="btn px-4 py-2 me-3"
      style={{ 
        backgroundColor: 'white', 
        color: '#00afaa', 
        border: '1px solid #00afaa',
        borderRadius: '8px',
        fontWeight: '500',
        transition: 'all 0.2s ease'
      }}
      onClick={() => {
        setShowImportModal(false);
        setShowDropdown(false);
      }}
    >
      Annuler
    </button>
    <button
      className="btn px-4 py-2"
      style={{ 
        backgroundColor: '#00afaa', 
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontWeight: '500',
        transition: 'all 0.2s ease'
      }}
      onClick={handleImportValidation}
    >
      <i className="fas fa-check me-2"></i>
      Valider 
    </button>
  </Modal.Footer>


  <style jsx>{`
    .custom-checkbox1 .form-check-input:checked {
      background-color: #00afaa;
      border-color: #00afaa;
    }
    
    .custom-checkbox1 .form-check-input:focus {
      border-color: #00afaa;
      box-shadow: 0 0 0 0.25rem rgba(0, 175, 170, 0.25);
    }
    
    /* Ajouter animation et transition pour une meilleure UX */
    .custom-modal .modal-content {
      animation: fadeIn 0.3s;
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

  `}</style>


</Modal>






      <ExpandRTable
        columns={visibleColumns}
        data={filteredEmployees}
        searchTerm={globalSearch.toLowerCase()}
        highlightText={highlightText}
        selectAll={selectedEmployers.length === filteredEmployers.length && filteredEmployers.length > 0}
        selectedItems={selectedEmployers}
        handleSelectAllChange={handleSelectAllChange}
        handleCheckboxChange={handleCheckboxChange}
        handleEdit={handleEditEmployer}
        handleDelete={handleDeleteEmployer}
        handleDeleteSelected={handleDeleteSelected}
        rowsPerPage={employeesPerPage}
        page={currentPage}
        handleChangePage={handleChangePage}
        handleChangeRowsPerPage={handleChangeRowsPerPage}
        expandedRows={expandedRows}
        toggleRowExpansion={toggleRowExpansion}
        renderExpandedRow={renderExpandedRow}
        renderCustomActions={renderCustomActions}
      />

      <EmployeFichePrint
        show={showFicheModal}
        onHide={() => { setShowFicheModal(false); setSelectedEmployeeForPrint(null); }}
        employee={selectedEmployeeForPrint}
      />

      {showAddForm && (
        <AddEmp
          toggleEmpForm={handleCloseForm}
          selectedDepartementId={departementId}
          onEmployeAdded={handleEmployerAdded}
          selectedEmployer={selectedEmployer}
          onEmployeUpdated={handleEmployerUpdated}
          fetchEmployers={fetchEmployersWithContracts}
        />
      )}

    </div>

  );
});

export default EmployeTable;