import React, { useState, useEffect, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import axios from "axios";
import { Button, Card, Table, Form, Dropdown, Alert, Modal } from "react-bootstrap";
import { faEdit, faTrash, faFilePdf, faFileExcel, faPrint, faSliders, faChevronDown, faChevronUp, faSearch, faCalendarAlt, faClipboardCheck, faIdCard, faFilter, faClose, faChartBar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FaPlus, FaPlusCircle } from "react-icons/fa";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Box } from "@mui/material";
import { BarChart2, HelpCircle, AlertTriangle } from 'lucide-react';
import { BarChart } from "@mui/x-charts/BarChart";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { useOpen } from "../../Acceuil/OpenProvider";
import ExpandRTable from "../Shared/ExpandRTable";
import AddConflit from "./AddConflit";
import { motion, AnimatePresence } from 'framer-motion';
import Swal from "sweetalert2";
import "../Style.css";

const theme = createTheme();

const columns = [
  { key: "employe", label: "Employé concerné" },
  { key: "matricule", label: "Matricule" },
  { key: "departement", label: "Département" },
  { key: "poste", label: "Poste" },
  { key: "dateIncident", label: "Date incident" },
  { key: "lieuIncident", label: "Lieu" },
  { key: "natureConflit", label: "Nature" },
  { key: "partieNom", label: "Partie impliquée" },
  { key: "gravite", label: "Gravité" },
  { key: "confidentialite", label: "Confidentialité" },
  { key: "statut", label: "Statut" },
  { key: "responsableRh", label: "Responsable RH" },
  { key: "piecesJointes", label: "Fichiers" },
];

const natureLabels = {
  'conflit_interne': 'Conflit interne',
  'conflit_externe': 'Conflit avec partie externe',
  'incident_comportemental': 'Incident comportemental',
  'litige_professionnel': 'Litige professionnel',
  'harcelement': 'Harcèlement',
  'non_respect_procedures': 'Non-respect des procédures',
  'altercation': 'Altercation verbale ou physique',
  'autre': 'Autre',
};

const statutLabels = {
  'nouveau': 'Nouveau',
  'en_etude': 'En étude',
  'en_enquete': 'En enquête',
  'en_attente': 'En attente d\'informations',
  'en_decision': 'En décision',
  'cloture': 'Clôturé',
};

const graviteLabels = {
  'faible': 'Faible',
  'moyen': 'Moyen',
  'eleve': 'Élevé',
  'critique': 'Critique',
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return dateStr.split('T')[0];
};

const mapApiToUi = (api) => ({
  id: api.id,
  employe: api.employe || "N/A",
  matricule: api.matricule || "N/A",
  departement: api.departement || "N/A",
  poste: api.poste || "N/A",
  dateIncident: formatDate(api.date_incident),
  lieuIncident: api.lieu?.nom || api.lieu_incident || "N/A",
  conflit_lieu_id: api.conflit_lieu_id,
  natureConflit: api.type?.nom || natureLabels[api.nature_conflit] || api.nature_conflit || "N/A",
  conflit_type_id: api.conflit_type_id,
  partieNom: api.partie_nom || "N/A",
  partie_nom: api.partie_nom,
  partie_type: api.partie_type,
  partie_fonction: api.partie_fonction,
  partie_organisation: api.partie_organisation,
  description: api.description,
  temoins: api.temoins,
  circonstances: api.circonstances,
  gravite: graviteLabels[api.gravite] || api.gravite,
  gravite_raw: api.gravite,
  confidentialite: api.confidentialite === 'sensible' ? 'Sensible' : 'Normal',
  confidentialite_raw: api.confidentialite,
  statut: api.statut_dossier?.nom || statutLabels[api.statut] || api.statut || "N/A",
  conflit_statut_id: api.conflit_statut_id,
  responsableRh: api.responsable_rh || "N/A",
  responsable_rh: api.responsable_rh,
  commentaires_rh: api.commentaires_rh,
  piecesJointes: api.pieces_jointes ? api.pieces_jointes.length : 0,
  pieces_jointes: api.pieces_jointes || [],
});

const mapUiToApi = (ui) => ({
  employe: ui.employe,
  matricule: ui.matricule,
  departement: ui.departement,
  poste: ui.poste,
  date_incident: ui.dateIncident,
  conflit_lieu_id: ui.conflit_lieu_id,
  conflit_type_id: ui.conflit_type_id,
  partie_nom: ui.partie_nom,
  partie_type: ui.partie_type,
  partie_fonction: ui.partie_fonction,
  partie_organisation: ui.partie_organisation,
  description: ui.description,
  temoins: ui.temoins,
  circonstances: ui.circonstances,
  gravite: ui.gravite_raw,
  confidentialite: ui.confidentialite_raw,
  conflit_statut_id: ui.conflit_statut_id,
  responsable_rh: ui.responsable_rh,
  commentaires_rh: ui.commentaires_rh,
});

// Column visibility menu
const CustomMenu = forwardRef(({ children, style, className, 'aria-labelledby': labeledBy, columns_config, setColumnVisibility }, ref) => (
  <div ref={ref} style={{ ...style, padding: '10px', minWidth: '200px' }} className={className} aria-labelledby={labeledBy}>
    <h6 className='p-2 mb-0'>Colonnes visibles</h6>
    <hr className='my-2' />
    <Form className='p-2'>
      {(columns_config || []).map(col => (
        <Form.Check
          key={col.key}
          type="checkbox"
          label={col.label}
          checked={col.visible}
          onChange={() => setColumnVisibility(prev => ({ ...prev, [col.key]: !prev[col.key] }))}
          className='mb-2'
        />
      ))}
    </Form>
  </div>
));
CustomMenu.displayName = 'CustomMenu';

const ConflitTable = forwardRef((props, ref) => {
  const {
    globalSearch = "",
    isAddingEmploye,
    setIsAddingEmploye,
    filtersVisible,
    handleFiltersToggle,
    preloadedEmployees = []
  } = props;

  const { dynamicStyles } = useOpen();

  const [conflits, setConflits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedConflits, setSelectedConflits] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [allEmployeesCache, setAllEmployeesCache] = useState(preloadedEmployees);

  // States pour les filtres
  const [filterEmploye, setFilterEmploye] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterNature, setFilterNature] = useState("");
  const [filterGravite, setFilterGravite] = useState("");
  const [showCharts, setShowCharts] = useState(false);
  const [showProcedModal, setShowProcedModal] = useState(false);

  const [columnVisibility, setColumnVisibility] = useState({
    employe: true,
    matricule: true,
    departement: true,
    poste: true,
    dateIncident: true,
    lieuIncident: true,
    natureConflit: true,
    partieNom: true,
    gravite: true,
    confidentialite: true,
    statut: true,
    responsableRh: true,
    piecesJointes: true,
  });

  const iconButtonStyle = {
    backgroundColor: "#f9fafb",
    border: "1px solid #ccc",
    borderRadius: "5px",
    padding: "13px 16px",
    cursor: "pointer",
    transition: "background-color 0.3s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: '38px',
    width: '42px',
    marginLeft: '8px'
  };

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Get unique employees from conflits
  const uniqueEmployees = useMemo(() => {
    const employeeNames = conflits
      .map(c => c.employe)
      .filter(name => name && name !== "N/A");
    return [...new Set(employeeNames)].sort();
  }, [conflits]);

  const searched = useMemo(() => {
    let result = conflits;

    // Filtre global
    if (globalSearch && typeof globalSearch === 'string' && globalSearch.trim()) {
      const term = globalSearch.toLowerCase().trim();
      result = result.filter((row) => {
        if (!row) return false;
        return columns.some((c) => {
          try {
            const val = row[c.key];
            return val != null && String(val).toLowerCase().includes(term);
          } catch (e) {
            return false;
          }
        });
      });
    }

    // Filtre par employé
    if (filterEmploye.trim()) {
      result = result.filter(row => (row.employe || "") === filterEmploye);
    }

    // Filtre par statut
    if (filterStatut.trim()) {
      result = result.filter(row => (row.statut_raw || "") === filterStatut);
    }

    // Filtre par date
    if (filterDate.trim()) {
      result = result.filter(row => (row.dateIncident || "").includes(filterDate));
    }

    // Filtre par nature
    if (filterNature.trim()) {
      result = result.filter(row => (row.nature_conflit || "") === filterNature);
    }

    // Filtre par gravité
    if (filterGravite.trim()) {
      result = result.filter(row => (row.gravite_raw || "") === filterGravite);
    }

    return result;
  }, [conflits, globalSearch, filterEmploye, filterStatut, filterDate, filterNature, filterGravite]);

  // Chart data aggregated by month
  const chartData = useMemo(() => {
    const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const monthlyData = {};

    conflits.forEach(conf => {
      if (!conf.dateIncident) return;
      const date = new Date(conf.dateIncident);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${month}`;

      if (!monthlyData[key]) {
        monthlyData[key] = {
          year,
          month,
          label: `${monthLabels[month]} ${year}`,
          nombreConflits: 0
        };
      }
      monthlyData[key].nombreConflits += 1;
    });

    const sorted = Object.values(monthlyData)
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
      .slice(-6);

    return {
      labels: sorted.map(d => d.label),
      nombreConflits: sorted.map(d => d.nombreConflits),
      totalConflits: conflits.length,
      conflitsCritiques: conflits.filter(c => c.gravite_raw === 'critique').length,
      conflitsEnCours: conflits.filter(c => c.statut_raw !== 'cloture').length,
      moisAnalyses: sorted.length
    };
  }, [conflits]);

  const highlightText = useCallback((text, searchTerm) => {
    if (!text || !searchTerm) return text;
    const textStr = String(text);
    const searchTermLower = searchTerm.toLowerCase();
    if (!textStr.toLowerCase().includes(searchTermLower)) return textStr;
    const parts = textStr.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchTermLower
        ? <mark key={i} style={{ backgroundColor: 'yellow', padding: 0 }}>{part}</mark>
        : part
    );
  }, []);

  const [editingConflit, setEditingConflit] = useState(null);

  const handleClose = useCallback(() => {
    setIsAddingEmploye(false);
    setEditingConflit(null);
  }, [setIsAddingEmploye]);

  const onSave = (newData, files = []) => {
    const formData = new FormData();
    
    // Add all form fields
    Object.keys(newData).forEach(key => {
      if (newData[key] !== null && newData[key] !== undefined) {
        formData.append(key, newData[key]);
      }
    });

    // Add files
    files.forEach((file, index) => {
      formData.append(`pieces_jointes[${index}]`, file.file);
      formData.append(`types_fichiers[${index}]`, file.type || 'autre');
    });

    const config = {
      withCredentials: true,
      headers: { 'Content-Type': 'multipart/form-data' }
    };

    const request = editingConflit
      ? axios.post(`http://127.0.0.1:8000/api/conflits/${editingConflit.id}?_method=PUT`, formData, config)
      : axios.post("http://127.0.0.1:8000/api/conflits", formData, config);

    request
      .then((res) => {
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: editingConflit ? 'Conflit modifié avec succès' : 'Conflit enregistré avec succès',
          timer: 1500,
          showConfirmButton: false
        });
        handleClose();
        const mapped = mapApiToUi(res.data);
        if (editingConflit) {
          setConflits(prev => prev.map(c => c.id === mapped.id ? mapped : c));
        } else {
          setConflits(prev => [mapped, ...prev]);
        }
        localStorage.removeItem('conflitsCache');
      })
      .catch((err) => {
        console.error("Erreur enregistrement:", err.response?.data);
        const validationErrors = err.response?.data?.errors;
        if (validationErrors) {
          const messages = Object.values(validationErrors).flat().join('\n');
          Swal.fire({ icon: 'error', title: 'Erreur de validation', text: messages });
        } else {
          Swal.fire({ icon: 'error', title: 'Erreur', text: err.response?.data?.message || "Impossible d'enregistrer le conflit." });
        }
      });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Êtes-vous sûr?',
      text: "Vous ne pourrez pas revenir en arrière!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer!'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(`http://127.0.0.1:8000/api/conflits/${id}`, { withCredentials: true })
          .then(() => {
            setConflits(prev => prev.filter(c => c.id !== id));
            Swal.fire('Supprimé!', 'Le dossier a été supprimé.', 'success');
          })
          .catch(err => {
            console.error(err);
            Swal.fire('Erreur', 'Impossible de supprimer.', 'error');
          });
      }
    });
  };

  const handleDeleteSelected = useCallback(async () => {
    if (selectedConflits.length === 0) return;

    const result = await Swal.fire({
      title: "Êtes-vous sûr?",
      text: `Vous allez supprimer ${selectedConflits.length} conflit(s)!`,
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
          selectedConflits.map(id => axios.delete(`http://127.0.0.1:8000/api/conflits/${id}`, { withCredentials: true }))
        );
        setConflits(prev => prev.filter(c => !selectedConflits.includes(c.id)));
        setSelectedConflits([]);
        Swal.fire("Supprimés!", "Les conflits ont été supprimés.", "success");
      } catch (error) {
        console.error("Error deleting selected conflits:", error);
        Swal.fire("Erreur!", "Une erreur est survenue lors de la suppression.", "error");
      }
    }
  }, [selectedConflits]);

  const handleEdit = (row) => {
    setEditingConflit(row);
    setIsAddingEmploye(true);
  };

  const columns_config = useMemo(() => [
    { key: 'employe', label: "Employé concerné", visible: columnVisibility.employe },
    { key: 'matricule', label: "Matricule", visible: columnVisibility.matricule },
    { key: 'departement', label: "Département", visible: columnVisibility.departement },
    { key: 'poste', label: "Poste", visible: columnVisibility.poste },
    { key: 'dateIncident', label: "Date incident", visible: columnVisibility.dateIncident },
    { key: 'lieuIncident', label: "Lieu", visible: columnVisibility.lieuIncident },
    { key: 'natureConflit', label: "Nature", visible: columnVisibility.natureConflit },
    { key: 'partieNom', label: "Partie impliquée", visible: columnVisibility.partieNom },
    { key: 'gravite', label: "Gravité", visible: columnVisibility.gravite },
    { key: 'confidentialite', label: "Confidentialité", visible: columnVisibility.confidentialite },
    { key: 'statut', label: "Statut", visible: columnVisibility.statut },
    { key: 'responsableRh', label: "Responsable RH", visible: columnVisibility.responsableRh },
    { key: 'piecesJointes', label: "Fichiers", visible: columnVisibility.piecesJointes },
  ], [columnVisibility]);

  const table_columns = columns_config.filter(col => col.visible);

  const actions = [
    {
      label: 'Modifier',
      icon: <FontAwesomeIcon icon={faEdit} />,
      onClick: (row) => console.log('Edit', row),
      color: 'primary'
    },
    {
      label: 'Supprimer',
      icon: <FontAwesomeIcon icon={faTrash} />,
      onClick: (row) => console.log('Delete', row),
      color: 'error'
    }
  ];

  const handleSelectAllChange = (checked) => {
    if (checked) {
      setSelectedConflits(searched.map(c => c.id));
    } else {
      setSelectedConflits([]);
    }
  };

  const handleCheckboxChange = (id) => {
    setSelectedConflits(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const loadConflits = useCallback(() => {
    const cached = localStorage.getItem('conflitsCache');
    if (cached) {
      try {
        setConflits(JSON.parse(cached));
        setLoading(false);
      } catch (e) { /* ignore */ }
    }

    axios
      .get("http://127.0.0.1:8000/api/conflits", { withCredentials: true })
      .then((res) => {
        const payload = Array.isArray(res.data) ? res.data : [];
        const mapped = payload.map(mapApiToUi);
        setConflits(mapped);
        localStorage.setItem('conflitsCache', JSON.stringify(mapped));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadConflits(); }, [loadConflits]);

  useEffect(() => {
    if (preloadedEmployees && preloadedEmployees.length > 0) {
      setAllEmployeesCache(preloadedEmployees);
    }
  }, [preloadedEmployees]);

  // Export functions
  const exportToPDF = useCallback(() => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Liste des Conflits / Incidents", 14, 20);
    doc.setFontSize(10);
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 28);

    const tableData = searched.map(row => [
      row.employe,
      row.matricule,
      row.dateIncident,
      row.natureConflit,
      row.gravite,
      row.statut,
    ]);

    doc.autoTable({
      head: [['Employé', 'Matricule', 'Date', 'Nature', 'Gravité', 'Statut']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [44, 118, 124] },
    });

    doc.save('conflits.pdf');
  }, [searched]);

  const exportToExcel = useCallback(() => {
    const data = searched.map(row => ({
      'Employé': row.employe,
      'Matricule': row.matricule,
      'Département': row.departement,
      'Poste': row.poste,
      'Date Incident': row.dateIncident,
      'Lieu': row.lieuIncident,
      'Nature': row.natureConflit,
      'Partie Impliquée': row.partieNom,
      'Gravité': row.gravite,
      'Confidentialité': row.confidentialite,
      'Statut': row.statut,
      'Responsable RH': row.responsableRh,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Conflits');
    XLSX.writeFile(wb, 'conflits.xlsx');
  }, [searched]);

  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank');
    const visibleCols = columns_config.filter(c => c.visible);

    printWindow.document.write(`
      <html>
        <head>
          <title>Liste des Conflits</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2c767c; font-size: 18px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #2c767c; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>Liste des Conflits / Incidents</h1>
          <p>Date d'impression: ${new Date().toLocaleDateString('fr-FR')}</p>
          <table>
            <thead>
              <tr>${visibleCols.map(c => `<th>${c.label}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${searched.map(row => `
                <tr>${visibleCols.map(c => `<td>${row[c.key] ?? ''}</td>`).join('')}</tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [columns_config, searched]);

  useImperativeHandle(ref, () => ({
    exportToPDF,
    exportToExcel,
    handlePrint
  }), [exportToPDF, exportToExcel, handlePrint]);

  return (
    <ThemeProvider theme={theme}>
      <div style={{
        display: 'flex',
        flex: 1,
        minWidth: 0,
        height: '100%',
        gap: '10px',
      }}>
        {/* Table area */}
        <div style={{
          flex: 1,
          minWidth: 0,
          overflow: 'auto',
          height: '100%',
        }} className="container_employee">
          <div className="mt-4">
            <div className="section-header mb-3">
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', columnGap: '16px', width: '100%' }}>
                {/* Bloc titre */}
                <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                  <span className="section-title mb-1" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2c767c' }}>
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Gestion des Conflits / Incidents
                  </span>
                  <p className="section-description text-muted mb-0">
                    {searched.length} conflit{searched.length > 1 ? 's' : ''} actuellement affiché{searched.length > 1 ? 's' : ''}
                  </p>
                </div>

                {/* Bloc Dropdowns */}
                <div style={{ display: "flex", gap: "10px", alignItems: 'center', justifySelf: 'end' }}>
                  <FontAwesomeIcon
                    onClick={() => handleFiltersToggle && handleFiltersToggle(!filtersVisible)}
                    icon={filtersVisible ? faClose : faFilter}
                    style={{
                      cursor: "pointer",
                      fontSize: "1.9rem",
                      color: "#2c767c",
                      transition: 'all 0.2s ease',
                      marginTop: "1.3%",
                      marginRight: "8px",
                    }}
                  />

                  <button
                    onClick={() => setShowCharts(true)}
                    title="Graphe des conflits"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '34px',
                      height: '34px',
                      backgroundColor: showCharts ? '#245f64' : '#2c767c',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(44,118,124,0.35)',
                      transition: 'all 0.2s ease',
                      marginRight: '8px',
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = '#245f64';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(44,118,124,0.5)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = showCharts ? '#245f64' : '#2c767c';
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(44,118,124,0.35)';
                    }}
                  >
                    <BarChart2 size={18} color="#ffffff" strokeWidth={2} />
                  </button>

                  <button
                    onClick={() => setShowProcedModal(true)}
                    title="Procédure de gestion des conflits"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '34px',
                      height: '34px',
                      backgroundColor: '#2c767c',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(44,118,124,0.3)',
                      transition: 'all 0.2s ease',
                      marginRight: '8px',
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = '#245f64';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(44,118,124,0.4)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = '#2c767c';
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(44,118,124,0.3)';
                    }}
                  >
                    <HelpCircle size={18} color="#ffffff" strokeWidth={2} />
                  </button>

                  <Button
                    onClick={() => setIsAddingEmploye(true)}
                    className="btn d-flex align-items-center"
                    size="sm"
                    style={{
                      width: '200px',
                      backgroundColor: '#2c767c',
                      color: '#ffffff',
                      border: 'none',
                      marginRight: '10px'
                    }}
                  >
                    <FaPlusCircle className="me-2" />
                    Déclarer un conflit
                  </Button>

                  <Dropdown show={showDropdown} onToggle={(isOpen) => setShowDropdown(isOpen)}>
                    <Dropdown.Toggle as="button" style={iconButtonStyle} title="Visibilité Colonnes">
                      <FontAwesomeIcon icon={faSliders} style={{ width: 18, height: 18, color: '#4b5563' }} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu as={CustomMenu} columns_config={columns_config} setColumnVisibility={setColumnVisibility} />
                  </Dropdown>
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
                >
                  {/* Icône et titre */}
                  <div className="filters-icon-section">
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

                  {/* Filtre Employé */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <label className="filter-label" style={{
                      fontSize: '0.9rem',
                      margin: 0,
                      whiteSpace: 'nowrap',
                      fontWeight: 600,
                      color: '#2c3e50'
                    }}>Employé</label>
                    <select
                      value={filterEmploye}
                      onChange={(e) => setFilterEmploye(e.target.value)}
                      className="filter-input"
                      style={{
                        minWidth: 100,
                        height: 30,
                        fontSize: '0.9rem',
                        padding: '2px 6px',
                        borderRadius: 6
                      }}
                    >
                      <option value="">Tous</option>
                      {uniqueEmployees.map((empName, idx) => (
                        <option key={idx} value={empName}>{empName}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filtre Date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <label className="filter-label" style={{
                      fontSize: '0.9rem',
                      margin: 0,
                      whiteSpace: 'nowrap',
                      fontWeight: 600,
                      color: '#2c3e50'
                    }}>Date</label>
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="filter-input"
                      style={{
                        minWidth: 100,
                        height: 30,
                        fontSize: '0.9rem',
                        padding: '2px 6px',
                        borderRadius: 6
                      }}
                    />
                  </div>

                  {/* Filtre Nature */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <label className="filter-label" style={{
                      fontSize: '0.9rem',
                      margin: 0,
                      whiteSpace: 'nowrap',
                      fontWeight: 600,
                      color: '#2c3e50'
                    }}>Nature</label>
                    <select
                      value={filterNature}
                      onChange={(e) => setFilterNature(e.target.value)}
                      className="filter-input"
                      style={{
                        minWidth: 100,
                        height: 30,
                        fontSize: '0.9rem',
                        padding: '2px 6px',
                        borderRadius: 6
                      }}
                    >
                      <option value="">Toutes</option>
                      {Object.entries(natureLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filtre Gravité */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <label className="filter-label" style={{
                      fontSize: '0.9rem',
                      margin: 0,
                      whiteSpace: 'nowrap',
                      fontWeight: 600,
                      color: '#2c3e50'
                    }}>Gravité</label>
                    <select
                      value={filterGravite}
                      onChange={(e) => setFilterGravite(e.target.value)}
                      className="filter-input"
                      style={{
                        minWidth: 80,
                        height: 30,
                        fontSize: '0.9rem',
                        padding: '2px 6px',
                        borderRadius: 6
                      }}
                    >
                      <option value="">Toutes</option>
                      {Object.entries(graviteLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filtre Statut */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <label className="filter-label" style={{
                      fontSize: '0.9rem',
                      margin: 0,
                      whiteSpace: 'nowrap',
                      fontWeight: 600,
                      color: '#2c3e50'
                    }}>Statut</label>
                    <select
                      value={filterStatut}
                      onChange={(e) => setFilterStatut(e.target.value)}
                      className="filter-input"
                      style={{
                        minWidth: 100,
                        height: 30,
                        fontSize: '0.9rem',
                        padding: '2px 6px',
                        borderRadius: 6
                      }}
                    >
                      <option value="">Tous</option>
                      {Object.entries(statutLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <ExpandRTable
              data={searched}
              columns={table_columns}
              actions={actions}
              highlightText={highlightText}
              searchTerm={globalSearch}
              selectedItems={selectedConflits}
              handleSelectAllChange={handleSelectAllChange}
              handleCheckboxChange={handleCheckboxChange}
              selectAll={selectedConflits.length === searched.length && searched.length > 0}
              onRowClick={(row) => console.log('Row clicked', row)}
              page={page}
              rowsPerPage={rowsPerPage}
              handleChangePage={setPage}
              handleChangeRowsPerPage={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              handleDeleteSelected={handleDeleteSelected}
              getRowStyle={(row) => ({
                backgroundColor: (editingConflit && row.id === editingConflit.id)
                  ? '#d1fae5'
                  : (row.gravite_raw === 'critique' ? '#fee2e2' : 'white'),
                borderLeft: (editingConflit && row.id === editingConflit.id)
                  ? '4px solid #2c767c'
                  : (row.gravite_raw === 'critique' ? '4px solid #dc2626' : '4px solid transparent'),
                cursor: 'pointer',
              })}
            />
          </div>
        </div>

        {isAddingEmploye && (
          <AddConflit
            onClose={handleClose}
            onSave={onSave}
            initialData={editingConflit}
            preloadedEmployees={allEmployeesCache}
          />
        )}

        {/* Panel Graphe des Conflits */}
        {showCharts && (
          <>
            <style>
              {`
                @keyframes slideInChart {
                  from { transform: translateX(100%); opacity: 0; }
                  to { transform: translateX(0); opacity: 1; }
                }
              `}
            </style>
            <div
              className="add-accident-container shadow-lg"
              style={{ animation: 'slideInChart 0.3s cubic-bezier(0.4,0,0.2,1) both' }}
            >
              <div style={{
                position: 'relative',
                background: '#ffffff',
                borderBottom: '1px solid #e5e7eb',
                padding: '18px 48px 18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <h5 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: '#111827', textAlign: 'center' }}>
                  Statistiques des Conflits
                </h5>
                <button
                  onClick={() => setShowCharts(false)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '1.5rem',
                    color: '#6b7280',
                    cursor: 'pointer',
                    lineHeight: 1,
                    padding: '4px 8px',
                    borderRadius: '6px',
                  }}
                >
                  &times;
                </button>
              </div>
              <div className="form-body p-3 flex-grow-1 overflow-auto" style={{ backgroundColor: '#f8fafc' }}>
                {chartData.labels.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#64748b',
                    fontSize: '0.9rem'
                  }}>
                    Aucun conflit disponible pour afficher le graphe.
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '16px', color: '#1e293b', fontSize: '0.85rem' }}>
                      {chartData.totalConflits} conflit(s) enregistré(s)
                    </div>

                    {/* BarChart: Évolution mensuelle */}
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '16px',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
                    }}>
                      <h6 style={{
                        marginBottom: '12px',
                        color: '#1e293b',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        textTransform: 'uppercase'
                      }}>
                        Évolution mensuelle
                      </h6>
                      <BarChart
                        xAxis={[{ scaleType: 'band', data: chartData.labels }]}
                        series={[
                          { data: chartData.nombreConflits, label: 'Nombre de conflits', color: '#dc2626' }
                        ]}
                        height={300}
                        margin={{ bottom: 90 }}
                        slotProps={{
                          legend: {
                            position: { vertical: 'bottom', horizontal: 'middle' },
                            padding: { top: 20 }
                          }
                        }}
                      />
                    </div>

                    {/* BarChart: Répartition par gravité */}
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '16px',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
                    }}>
                      <h6 style={{
                        marginBottom: '12px',
                        color: '#1e293b',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        textTransform: 'uppercase'
                      }}>
                        Répartition par Gravité
                      </h6>
                      <BarChart
                        xAxis={[{ scaleType: 'band', data: ['Faible', 'Moyen', 'Élevé', 'Critique'] }]}
                        series={[
                          {
                            data: [
                              conflits.filter(c => c.gravite_raw === 'faible').length,
                              conflits.filter(c => c.gravite_raw === 'moyen').length,
                              conflits.filter(c => c.gravite_raw === 'eleve').length,
                              conflits.filter(c => c.gravite_raw === 'critique').length
                            ],
                            label: 'Conflits',
                            color: '#f59e0b'
                          }
                        ]}
                        height={230}
                        margin={{ bottom: 70 }}
                        slotProps={{
                          legend: {
                            position: { vertical: 'bottom', horizontal: 'middle' }
                          }
                        }}
                      />
                    </div>

                    {/* Summary Cards */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '12px',
                      marginTop: '16px'
                    }}>
                      {[
                        { label: 'Total Conflits', value: chartData.totalConflits, color: '#2c767c' },
                        { label: 'Critiques', value: chartData.conflitsCritiques, color: '#dc2626' },
                        { label: 'En Cours', value: chartData.conflitsEnCours, color: '#f59e0b' },
                        { label: 'Mois Analysés', value: chartData.moisAnalyses, color: '#10b981' }
                      ].map((card, index) => (
                        <div key={index} style={{
                          background: '#f8fafc',
                          border: `1px solid ${card.color}33`,
                          borderRadius: '10px',
                          padding: '14px 18px',
                          borderLeft: `4px solid ${card.color}`
                        }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: card.color }}>
                            {card.value}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {card.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Modal Aide Procédure RH */}
        <Modal show={showProcedModal} onHide={() => setShowProcedModal(false)} size="lg" centered>
          <Modal.Header closeButton style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
            <Modal.Title style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>
              <AlertTriangle className="me-2 text-warning" style={{ verticalAlign: 'middle' }} /> Procédure RH : Gestion des Conflits
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4" style={{ backgroundColor: '#fdfdfd' }}>
            <div className="mb-4">
              <h6 className="fw-bold" style={{ color: '#2c767c', display: 'flex', alignItems: 'center', fontSize: '0.95rem' }}>
                <div style={{ width: '26px', height: '26px', backgroundColor: '#2c767c', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', fontSize: '13px', flexShrink: 0 }}>1</div>
                Réception et Enregistrement
              </h6>
              <div style={{ marginLeft: '38px', lineHeight: '1.6' }} className="text-muted small">
                Recevoir la plainte ou le signalement (écrit ou oral). Enregistrer immédiatement l'incident dans le système avec toutes les informations disponibles. Informer les parties concernées de l'ouverture du dossier.
              </div>
            </div>
            <div className="mb-4">
              <h6 className="fw-bold" style={{ color: '#2c767c', display: 'flex', alignItems: 'center', fontSize: '0.95rem' }}>
                <div style={{ width: '26px', height: '26px', backgroundColor: '#2c767c', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', fontSize: '13px', flexShrink: 0 }}>2</div>
                Évaluation Préliminaire
              </h6>
              <div style={{ marginLeft: '38px', lineHeight: '1.6' }} className="text-muted small">
                Évaluer la gravité de l'incident. Déterminer si une enquête approfondie est nécessaire. Identifier les risques potentiels et prendre des mesures conservatoires si besoin (séparation des parties, etc.).
              </div>
            </div>
            <div className="mb-4">
              <h6 className="fw-bold" style={{ color: '#2c767c', display: 'flex', alignItems: 'center', fontSize: '0.95rem' }}>
                <div style={{ width: '26px', height: '26px', backgroundColor: '#2c767c', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', fontSize: '13px', flexShrink: 0 }}>3</div>
                Enquête et Collecte d'Éléments
              </h6>
              <div style={{ marginLeft: '38px', lineHeight: '1.6' }} className="text-muted small">
                Auditionner les parties impliquées séparément. Recueillir les témoignages et preuves (emails, messages, documents). Documenter toutes les étapes de l'enquête de manière confidentielle.
              </div>
            </div>
            <div className="mb-0">
              <h6 className="fw-bold" style={{ color: '#2c767c', display: 'flex', alignItems: 'center', fontSize: '0.95rem' }}>
                <div style={{ width: '26px', height: '26px', backgroundColor: '#2c767c', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', fontSize: '13px', flexShrink: 0 }}>4</div>
                Décision et Clôture
              </h6>
              <div style={{ marginLeft: '38px', lineHeight: '1.6' }} className="text-muted small">
                Analyser les faits et prendre une décision appropriée. Communiquer la décision aux parties concernées. Appliquer les mesures décidées (médiation, sanction, sensibilisation...). Clôturer le dossier avec un rapport final.
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer style={{ borderTop: 'none', padding: '15px 24px', backgroundColor: '#ffffff' }}>
            <Button variant="outline-secondary" onClick={() => setShowProcedModal(false)} style={{ borderRadius: '8px', padding: '8px 25px', fontWeight: 600, fontSize: '0.85rem' }}>
              J'ai compris
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </ThemeProvider>
  );
});

export default ConflitTable;
