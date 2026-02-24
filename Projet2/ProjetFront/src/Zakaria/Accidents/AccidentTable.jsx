import React, { useState, useEffect, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import axios from "axios";
import { Button, Card, Table, Form, Dropdown, Alert, Modal } from "react-bootstrap";
import { faEdit, faTrash, faFilePdf, faFileExcel, faPrint, faSliders, faChevronDown, faChevronUp, faSearch, faCalendarAlt, faClipboardCheck, faIdCard, faFilter, faClose, faChartBar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FaPlus, FaPlusCircle } from "react-icons/fa";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Box } from "@mui/material";
import { BarChart2, HelpCircle } from 'lucide-react';
import { BarChart } from "@mui/x-charts/BarChart";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { useOpen } from "../../Acceuil/OpenProvider";
import ExpandRTable from "../Shared/ExpandRTable";
import AddAccident from "./AddAccident";
import { motion, AnimatePresence } from 'framer-motion';
import Swal from "sweetalert2";
import "../Style.css";

const theme = createTheme();

const initialAccidents = [
  {
    id: 1,
    employe: "Ahmed Ben Salah",
    matricule: "EMP-001",
    dateAccident: "2026-01-15",
    heure: "09:20",
    lieu: "Atelier A",
    typeAccident: "Chute",
    arretTravail: "oui",
    dureeArret: 3,
    statut: "en cours",
    departement_id: 1,
  },
  {
    id: 2,
    employe: "Sara El Idrissi",
    matricule: "EMP-002",
    dateAccident: "2026-01-20",
    heure: "14:05",
    lieu: "Chantier B",
    typeAccident: "Coupure",
    arretTravail: "oui",
    dureeArret: 14,
    statut: "déclaré",
    departement_id: 2,
  },
];

const columns = [
  { key: "employe", label: "Employé" },
  { key: "matricule", label: "Matricule" },
  { key: "dateAccident", label: "Date accident" },
  { key: "heure", label: "Heure" },
  { key: "lieu", label: "Lieu" },
  { key: "type", label: "Type d'accident" },
  { key: "nature", label: "Nature d'accident" },
  { key: "statut", label: "Statut" },
  { key: "arretTravail", label: "Arrêt travail" },
  { key: "dureeArret", label: "Durée arrêt (j)" },
  { key: "commentaire", label: "Commentaire" },
];

const mapApiToUi = (api) => ({
  id: api.id,
  employe: (typeof api.employe === 'string' ? api.employe : api.employe?.nom) || api.nom_complet || "N/A",
  matricule: (typeof api.matricule === 'string' ? api.matricule : api.employe?.matricule) || "N/A",
  dateAccident: api.date_accident,
  heure: api.heure,
  lieu: api.lieu ? api.lieu.nom : (api.lieu_nom || "N/A"), // Handle object or legacy string if needed
  accident_lieu_id: api.accident_lieu_id, // For edit mode
  type: api.type ? api.type.nom : "N/A",
  accident_type_id: api.accident_type_id,
  nature: api.nature ? api.nature.nom : "N/A",
  accident_nature_id: api.accident_nature_id,
  arretTravail: api.arret_travail ? "oui" : "non",
  dureeArret: api.duree_arret || 0,
  statut: api.statut_dossier || api.statut,
  commentaire: api.commentaire || "",
  departement_id: api.departement_id
});

const mapUiToApi = (ui, deptId) => ({
  departement_id: deptId || ui.departement_id || null,
  nom_complet: ui.employe,
  matricule: ui.matricule,
  date_accident: ui.dateAccident,
  heure: ui.heure,
  accident_lieu_id: ui.accident_lieu_id,
  accident_type_id: ui.accident_type_id,
  accident_nature_id: ui.accident_nature_id,
  type_accident: ui.type || "",
  arret_travail: ui.arretTravail === "oui",
  duree_arret: ui.dureeArret ? parseInt(ui.dureeArret) : 0,
  statut_dossier: ui.statut,
  commentaire: ui.commentaire || "",
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

const AccidentTable = forwardRef((props, ref) => {
  const {
    departementId,
    departementName = "Tous",
    includeSubDepartments,
    getSubDepartmentIds,
    departements,
    globalSearch = "",
    isAddingEmploye,
    setIsAddingEmploye,
    filtersVisible,
    handleFiltersToggle,
    preloadedEmployees = [] // Employés préchargés par le parent
  } = props;

  const { dynamicStyles } = useOpen();

  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState("");
  const [selectedAccidents, setSelectedAccidents] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  // Initialiser avec les employés préchargés (si disponibles)
  const [allEmployeesCache, setAllEmployeesCache] = useState(preloadedEmployees);
  const [employeesList, setEmployeesList] = useState([]);
  const [lieusList, setLieusList] = useState([]);
  const [typesList, setTypesList] = useState([]);
  const [naturesList, setNaturesList] = useState([]);

  // States pour les filtres
  const [filterEmploye, setFilterEmploye] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterLieu, setFilterLieu] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterNature, setFilterNature] = useState("");
  const [filterArretTravail, setFilterArretTravail] = useState("");
  const [showCharts, setShowCharts] = useState(false);
  const [showProcedModal, setShowProcedModal] = useState(false);

  const [columnVisibility, setColumnVisibility] = useState({
    employe: true,
    matricule: true,
    dateAccident: true,
    heure: true,
    lieu: true,
    type: true,
    nature: true,
    statut: true,
    arretTravail: true,
    dureeArret: true,
    commentaire: true,
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
  const [form, setForm] = useState({
    employe: "",
    matricule: "",
    dateAccident: "",
    heure: "",
    lieu: "",
    type: "",
    nature: "",
    arretTravail: "non",
    dureeArret: 0,
    statut: "en cours",
    commentaire: "",
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filtered = useMemo(() => {
    if (!departementId) return [];
    const ids = includeSubDepartments && getSubDepartmentIds ? getSubDepartmentIds(departements || [], departementId) : [departementId];
    // Ensure both are numbers for comparison
    const numericIds = ids.map(Number);
    return accidents.filter((a) => numericIds.includes(Number(a.departement_id)));
  }, [accidents, departementId, includeSubDepartments, getSubDepartmentIds, departements]);

  // Get unique employees from filtered accidents (employees who have accidents in this department)
  const uniqueEmployees = useMemo(() => {
    const employeeNames = filtered
      .map(a => a.employe)
      .filter(name => name && name !== "N/A");
    return [...new Set(employeeNames)].sort();
  }, [filtered]);

  const searched = useMemo(() => {
    let result = filtered;

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
            console.warn("Search error on row/col:", row, c, e);
            return false;
          }
        });
      });
    }

    // Filtre par employé (exact match since dropdown values come from data)
    if (filterEmploye.trim()) {
      result = result.filter(row =>
        (row.employe || "") === filterEmploye
      );
    }

    // Filtre par statut
    if (filterStatut.trim()) {
      result = result.filter(row =>
        (row.statut || "").toLowerCase() === filterStatut.toLowerCase()
      );
    }

    // Filtre par date
    if (filterDate.trim()) {
      result = result.filter(row =>
        (row.dateAccident || "").includes(filterDate)
      );
    }

    // Filtre par lieu (exact match)
    if (filterLieu.trim()) {
      result = result.filter(row =>
        (row.lieu || "").toLowerCase() === filterLieu.toLowerCase()
      );
    }

    // Filtre par type (exact match)
    if (filterType.trim()) {
      result = result.filter(row =>
        (row.type || "").toLowerCase() === filterType.toLowerCase()
      );
    }

    // Filtre par nature (exact match)
    if (filterNature.trim()) {
      result = result.filter(row =>
        (row.nature || "").toLowerCase() === filterNature.toLowerCase()
      );
    }

    // Filtre par arrêt travail
    if (filterArretTravail.trim()) {
      result = result.filter(row =>
        (row.arretTravail || "").toLowerCase() === filterArretTravail.toLowerCase()
      );
    }

    return result;
  }, [filtered, globalSearch, filterEmploye, filterStatut, filterDate, filterLieu, filterType, filterNature, filterArretTravail]);

  // Chart data aggregated by month
  const chartData = useMemo(() => {
    const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const monthlyData = {};

    filtered.forEach(acc => {
      if (!acc.dateAccident) return;
      const date = new Date(acc.dateAccident);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${month}`;

      if (!monthlyData[key]) {
        monthlyData[key] = {
          year,
          month,
          label: `${monthLabels[month]} ${year}`,
          nombreAccidents: 0,
          joursArret: 0
        };
      }
      monthlyData[key].nombreAccidents += 1;
      monthlyData[key].joursArret += parseInt(acc.dureeArret) || 0;
    });

    // Sort by date and take last 6 months
    const sorted = Object.values(monthlyData)
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
      .slice(-6);

    return {
      labels: sorted.map(d => d.label),
      nombreAccidents: sorted.map(d => d.nombreAccidents),
      joursArret: sorted.map(d => d.joursArret),
      totalAccidents: filtered.length,
      totalJoursArret: filtered.reduce((sum, a) => sum + (parseInt(a.dureeArret) || 0), 0),
      accidentsAvecArret: filtered.filter(a => a.arretTravail === 'oui').length,
      moisDeclares: sorted.length
    };
  }, [filtered]);

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

  const [editingAccident, setEditingAccident] = useState(null);

  const resetForm = useCallback(() => {
    setForm({
      employe: "",
      matricule: "",
      dateAccident: "",
      heure: "",
      lieu: "",
      type: "",
      nature: "",
      arretTravail: "non",
      dureeArret: 0,
      statut: "en cours",
      commentaire: "",
    });
  }, []);

  const onSave = (newData) => {
    const payload = mapUiToApi(newData, departementId);
    console.log("Payload envoyé:", payload);

    const request = editingAccident
      ? axios.put(`http://127.0.0.1:8000/api/accidents/${editingAccident.id}`, payload, { withCredentials: true })
      : axios.post("http://127.0.0.1:8000/api/accidents", payload, { withCredentials: true });

    request
      .then((res) => {
        // Afficher le message de succès immédiatement
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: editingAccident ? 'Accident modifié avec succès' : 'Accident enregistré avec succès',
          timer: 1500,
          showConfirmButton: false
        });
        handleClose();
        // Mise à jour optimiste: ajouter/modifier dans le state local
        const mapped = mapApiToUi(res.data);
        if (editingAccident) {
          setAccidents(prev => prev.map(a => a.id === mapped.id ? mapped : a));
        } else {
          setAccidents(prev => [mapped, ...prev]);
        }
        // Invalider le cache pour la prochaine visite
        localStorage.removeItem('accidentsCache');
      })
      .catch((err) => {
        console.error("Erreur enregistrement:", err.response?.data);
        const validationErrors = err.response?.data?.errors;
        if (validationErrors) {
          const messages = Object.values(validationErrors).flat().join('\n');
          Swal.fire({ icon: 'error', title: 'Erreur de validation', text: messages });
        } else {
          Swal.fire({ icon: 'error', title: 'Erreur', text: err.response?.data?.message || "Impossible d'enregistrer l'accident." });
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
        axios.delete(`http://127.0.0.1:8000/api/accidents/${id}`, { withCredentials: true })
          .then(() => {
            setAccidents(prev => prev.filter(a => a.id !== id));
            Swal.fire('Supprimé!', 'Le dossier a été supprimé.', 'success');
          })
          .catch(err => {
            console.error(err);
            Swal.fire('Erreur', 'Impossible de supprimer.', 'error');
          });
      }
    })
  };

  const handleDeleteSelected = useCallback(async () => {
    if (selectedAccidents.length === 0) return;

    const result = await Swal.fire({
      title: "Êtes-vous sûr?",
      text: `Vous allez supprimer ${selectedAccidents.length} accident(s)!`,
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
          selectedAccidents.map(id => axios.delete(`http://127.0.0.1:8000/api/accidents/${id}`, { withCredentials: true }))
        );

        setAccidents(prev => prev.filter(a => !selectedAccidents.includes(a.id)));
        setSelectedAccidents([]);
        Swal.fire("Supprimés!", "Les accidents ont été supprimés.", "success");
      } catch (error) {
        console.error("Error deleting selected accidents:", error);
        Swal.fire("Erreur!", "Une erreur est survenue lors de la suppression.", "error");
      }
    }
  }, [selectedAccidents]);

  const handleEdit = (row) => {
    setEditingAccident(row);
    setIsAddingEmploye(true);
  };

  const columns_config = useMemo(() => [
    { key: 'employe', label: "Employé", visible: columnVisibility.employe },
    { key: 'matricule', label: "Matricule", visible: columnVisibility.matricule },
    { key: 'dateAccident', label: "Date accident", visible: columnVisibility.dateAccident },
    { key: 'heure', label: "Heure", visible: columnVisibility.heure },
    { key: 'lieu', label: "Lieu", visible: columnVisibility.lieu },
    { key: 'type', label: "Type d'accident", visible: columnVisibility.type },
    { key: 'nature', label: "Nature d'accident", visible: columnVisibility.nature },
    { key: 'statut', label: "Statut", visible: columnVisibility.statut },
    { key: 'arretTravail', label: "Arrêt travail", visible: columnVisibility.arretTravail },
    { key: 'dureeArret', label: "Durée arrêt (j)", visible: columnVisibility.dureeArret },
    { key: 'commentaire', label: "Commentaire", visible: columnVisibility.commentaire },
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
      setSelectedAccidents(searched.map(a => a.id));
    } else {
      setSelectedAccidents([]);
    }
  };

  const handleCheckboxChange = (id) => {
    setSelectedAccidents(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const loadAccidents = useCallback(() => {
    // Charger depuis le cache d'abord pour affichage immédiat
    const cached = localStorage.getItem('accidentsCache');
    if (cached) {
      try {
        setAccidents(JSON.parse(cached));
        setLoading(false);
      } catch (e) { /* ignore parse error */ }
    }

    // Puis mettre à jour depuis l'API
    axios
      .get("http://127.0.0.1:8000/api/accidents", { withCredentials: true })
      .then((res) => {
        const payload = Array.isArray(res.data) ? res.data : [];
        const mapped = payload.map(mapApiToUi);
        setAccidents(mapped);
        localStorage.setItem('accidentsCache', JSON.stringify(mapped));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadAccidents(); }, [loadAccidents]);

  // Mettre à jour le cache si les employés préchargés changent
  useEffect(() => {
    if (preloadedEmployees && preloadedEmployees.length > 0) {
      setAllEmployeesCache(preloadedEmployees);
    }
  }, [preloadedEmployees]);

  // Charger les employés seulement si pas déjà préchargés
  useEffect(() => {
    if (allEmployeesCache.length > 0) return; // Déjà préchargés
    axios.get("http://127.0.0.1:8000/api/employes/light", { withCredentials: true })
      .then(res => {
        let emps = res.data;
        if (!Array.isArray(emps)) emps = [];
        setAllEmployeesCache(emps);
      })
      .catch(err => console.error("Error fetching employees:", err));
  }, [allEmployeesCache.length]);

  // Filtrer les employés localement quand le département change
  useEffect(() => {
    if (!departementId) {
      setEmployeesList([]);
      setFilterEmploye("");
      return;
    }

    // Reset filter when department changes
    setFilterEmploye("");

    // Filtrage local instantané (pas de requête HTTP)
    const ids = includeSubDepartments && getSubDepartmentIds ? getSubDepartmentIds(departements || [], departementId) : [departementId];
    const numericIds = ids.map(Number);
    const filtered = allEmployeesCache.filter(e => numericIds.includes(Number(e.departement_id)));
    setEmployeesList(filtered);
  }, [departementId, departements, includeSubDepartments, getSubDepartmentIds, allEmployeesCache]);

  // Fetch lieux, types, natures lists - avec cache localStorage
  useEffect(() => {
    // Charger depuis localStorage d'abord
    const cachedLieux = localStorage.getItem('accidentLieuxCache');
    const cachedTypes = localStorage.getItem('accidentTypesCache');
    const cachedNatures = localStorage.getItem('accidentNaturesCache');

    if (cachedLieux) try { setLieusList(JSON.parse(cachedLieux)); } catch (e) { /* ignore */ }
    if (cachedTypes) try { setTypesList(JSON.parse(cachedTypes)); } catch (e) { /* ignore */ }
    if (cachedNatures) try { setNaturesList(JSON.parse(cachedNatures)); } catch (e) { /* ignore */ }

    // Puis mettre à jour depuis l'API
    Promise.all([
      axios.get("http://127.0.0.1:8000/api/accident-lieux", { withCredentials: true }),
      axios.get("http://127.0.0.1:8000/api/accident-types", { withCredentials: true }),
      axios.get("http://127.0.0.1:8000/api/accident-natures", { withCredentials: true })
    ])
      .then(([lieuxRes, typesRes, naturesRes]) => {
        const lieux = Array.isArray(lieuxRes.data) ? lieuxRes.data : [];
        const types = Array.isArray(typesRes.data) ? typesRes.data : [];
        const natures = Array.isArray(naturesRes.data) ? naturesRes.data : [];
        setLieusList(lieux);
        setTypesList(types);
        setNaturesList(natures);
        localStorage.setItem('accidentLieuxCache', JSON.stringify(lieux));
        localStorage.setItem('accidentTypesCache', JSON.stringify(types));
        localStorage.setItem('accidentNaturesCache', JSON.stringify(natures));
      })
      .catch(err => console.error("Error fetching accident lists:", err));
  }, []);

  // Écouter les changements localStorage pour mettre à jour les filtres
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'accidentLieuxCache' && e.newValue) {
        try { setLieusList(JSON.parse(e.newValue)); } catch (err) { /* ignore */ }
      }
      if (e.key === 'accidentTypesCache' && e.newValue) {
        try { setTypesList(JSON.parse(e.newValue)); } catch (err) { /* ignore */ }
      }
      if (e.key === 'accidentNaturesCache' && e.newValue) {
        try { setNaturesList(JSON.parse(e.newValue)); } catch (err) { /* ignore */ }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleClose = () => {
    setIsAddingEmploye(false);
    setEditingAccident(null);
  }

  const exportToPDF = useCallback(() => {
    const doc = new jsPDF();
    const tableColumn = columns_config.filter(col => col.visible).map(col => col.label);
    const tableRows = searched.map(row =>
      columns_config.filter(col => col.visible).map(col => row[col.key])
    );
    doc.setFontSize(18);
    doc.text(`Accidents de travail - ${departementName || "Tous"}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
    });
    doc.save(`accidents_${departementName || "tous"}_${new Date().toISOString()}.pdf`);
  }, [columns_config, searched, departementName]);

  const exportToExcel = useCallback(() => {
    const ws = XLSX.utils.json_to_sheet(
      searched.map(row => {
        const item = {};
        columns_config.forEach(col => {
          if (col.visible) {
            item[col.label] = row[col.key];
          }
        });
        return item;
      })
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Accidents");
    XLSX.writeFile(wb, `accidents_${departementName || "tous"}_${new Date().toISOString()}.xlsx`);
  }, [columns_config, searched, departementName]);

  const handlePrint = useCallback(() => {
    const printWindow = window.open("", "_blank");
    const tableColumn = columns_config.filter(col => col.visible).map(col => col.label);
    const tableRows = searched.map(row =>
      columns_config.filter(col => col.visible).map(col => row[col.key])
    );

    printWindow.document.write(`
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; color: #2c767c; }
            .header { margin-bottom: 20px; }
            @page { margin: 1cm; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Accidents de travail - ${departementName || "Tous"}</h1>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>${tableColumn.map(col => `<th>${col}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${tableRows.map(row => `
                <tr>${row.map(cell => `<td>${cell || ""}</td>`).join("")}</tr>
              `).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [columns_config, searched, departementName]);

  useImperativeHandle(ref, () => ({
    exportToPDF,
    exportToExcel,
    handlePrint
  }), [exportToPDF, exportToExcel, handlePrint]);

  return (
    <ThemeProvider theme={theme}>
      {/* Flex row wrapper: table area | form/charts panel */}
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
              <div className="d-flex align-items-center justify-content-between flex-wrap" style={{ gap: '16px' }}>
                {/* Bloc titre */}
                <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                  <span className="section-title mb-1" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2c767c' }}>
                    <i className="fas fa-users me-2"></i>
                    Détails Accident
                  </span>
                  <p className="section-description text-muted mb-0">
                    {searched.length} accident{searched.length > 1 ? 's' : ''} actuellement affiché{searched.length > 1 ? 's' : ''}
                  </p>
                </div>

                {/* Bloc Dropdowns */}
                <div style={{ display: "flex", gap: "10px", alignItems: 'center', flexWrap: 'wrap' }}>
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
                    title="Graphe des accidents"
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
                    title="Procédure en cas d'accident"
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
                    onClick={() => {
                      if (!departementId) return;
                      setIsAddingEmploye(true);
                    }}
                    className={`btn d-flex align-items-center ${!departementId ? "disabled-btn" : ""}`}
                    size="sm"
                    style={{
                      width: '180px',
                      backgroundColor: '#2c767c',
                      color: '#ffffff',
                      border: 'none',
                      marginRight: '10px'
                    }}
                  >
                    <FaPlusCircle className="me-2" />
                    Ajouter un accident
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
                      <option value="">Employé</option>
                      {uniqueEmployees.map((empName, idx) => (
                        <option key={idx} value={empName}>
                          {empName}
                        </option>
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

                  {/* Filtre Lieu */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <label className="filter-label" style={{
                      fontSize: '0.9rem',
                      margin: 0,
                      whiteSpace: 'nowrap',
                      fontWeight: 600,
                      color: '#2c3e50'
                    }}>Lieu</label>
                    <select
                      value={filterLieu}
                      onChange={(e) => setFilterLieu(e.target.value)}
                      className="filter-input"
                      style={{
                        minWidth: 100,
                        height: 30,
                        fontSize: '0.9rem',
                        padding: '2px 6px',
                        borderRadius: 6
                      }}
                    >
                      <option value="">Lieu</option>
                      {lieusList.map(lieu => (
                        <option key={lieu.id} value={lieu.nom}>{lieu.nom}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filtre Type */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <label className="filter-label" style={{
                      fontSize: '0.9rem',
                      margin: 0,
                      whiteSpace: 'nowrap',
                      fontWeight: 600,
                      color: '#2c3e50'
                    }}>Type</label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="filter-input"
                      style={{
                        minWidth: 100,
                        height: 30,
                        fontSize: '0.9rem',
                        padding: '2px 6px',
                        borderRadius: 6
                      }}
                    >
                      <option value="">Type</option>
                      {typesList.map(type => (
                        <option key={type.id} value={type.nom}>{type.nom}</option>
                      ))}
                    </select>
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
                      <option value="">Nature</option>
                      {naturesList.map(nature => (
                        <option key={nature.id} value={nature.nom}>{nature.nom}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filtre Arrêt */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <label className="filter-label" style={{
                      fontSize: '0.9rem',
                      margin: 0,
                      whiteSpace: 'nowrap',
                      fontWeight: 600,
                      color: '#2c3e50'
                    }}>Arrêt</label>
                    <select
                      value={filterArretTravail}
                      onChange={(e) => setFilterArretTravail(e.target.value)}
                      className="filter-input"
                      style={{
                        minWidth: 60,
                        height: 30,
                        fontSize: '0.9rem',
                        padding: '2px 6px',
                        borderRadius: 6
                      }}
                    >
                      <option value="">Arrêt</option>
                      <option value="oui">Oui</option>
                      <option value="non">Non</option>
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
                        minWidth: 80,
                        height: 30,
                        fontSize: '0.9rem',
                        padding: '2px 6px',
                        borderRadius: 6
                      }}
                    >
                      <option value="">Statut</option>
                      <option value="en cours">En cours</option>
                      <option value="déclaré">Déclaré</option>
                      <option value="clôturé">Clôturé</option>
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
              selectedItems={selectedAccidents}
              handleSelectAllChange={handleSelectAllChange}
              handleCheckboxChange={handleCheckboxChange}
              selectAll={selectedAccidents.length === searched.length && searched.length > 0}
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
                backgroundColor: (editingAccident && row.id === editingAccident.id)
                    ? '#d1fae5'
                    : 'white',
                borderLeft: (editingAccident && row.id === editingAccident.id)
                    ? '4px solid #2c767c'
                    : '4px solid transparent',
                '&:hover': { backgroundColor: (editingAccident && row.id === editingAccident.id) ? '#a7f3d0' : '#f9fafb' },
                cursor: 'pointer',
              })}
            />
          </div>
        </div>
        {/* end table area */}

        {isAddingEmploye && (
          <AddAccident
            onClose={handleClose}
            onSave={onSave}
            departementId={departementId}
            initialData={editingAccident}
            preloadedEmployees={allEmployeesCache}
            onResourceUpdate={(type, data) => {
              if (type === 'lieux') setLieusList(data);
              else if (type === 'types') setTypesList(data);
              else if (type === 'natures') setNaturesList(data);
            }}
          />
        )}

        {/* Panel Graphe des Accidents (right side drawer) */}
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
                  Graphe des Accidents
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
                    Aucun accident disponible pour afficher le graphe.
                  </div>
                ) : (
                  <>
                    {/* Info header */}
                    <div style={{
                      marginBottom: '16px',
                      color: '#1e293b',
                      fontSize: '0.85rem'
                    }}>
                      {departementName} — {chartData.totalAccidents} accident(s)
                    </div>

                    {/* BarChart: Nombre d'accidents & Jours d'arrêt */}
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
                        Accidents & Jours d'arrêt
                      </h6>
                      <BarChart
                        xAxis={[{ scaleType: 'band', data: chartData.labels }]}
                        series={[
                          { data: chartData.nombreAccidents, label: 'Nombre accidents', color: '#2c767c' },
                          { data: chartData.joursArret, label: 'Jours d\'arrêt', color: '#f59e0b' }
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

                    {/* BarChart: Répartition par statut */}
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
                        Répartition par Statut
                      </h6>
                      <BarChart
                        xAxis={[{ scaleType: 'band', data: ['En cours', 'Déclaré', 'Clôturé'] }]}
                        series={[
                          {
                            data: [
                              filtered.filter(a => a.statut === 'en cours').length,
                              filtered.filter(a => a.statut === 'déclaré').length,
                              filtered.filter(a => a.statut === 'clôturé').length
                            ],
                            label: 'Accidents',
                            color: '#6366f1'
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
                        { label: 'Total Accidents', value: chartData.totalAccidents, color: '#2c767c' },
                        { label: 'Total Jours Arrêt', value: chartData.totalJoursArret, color: '#f59e0b' },
                        { label: 'Avec Arrêt', value: chartData.accidentsAvecArret, color: '#6366f1' },
                        { label: 'Mois Analysés', value: chartData.moisDeclares, color: '#10b981' }
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
              <HelpCircle className="me-2 text-warning" style={{ verticalAlign: 'middle' }} /> Procédure RH : Accident de Travail
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4" style={{ backgroundColor: '#fdfdfd' }}>
            <div className="mb-4">
              <h6 className="fw-bold" style={{ color: '#2c767c', display: 'flex', alignItems: 'center', fontSize: '0.95rem' }}>
                <div style={{ width: '26px', height: '26px', backgroundColor: '#2c767c', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', fontSize: '13px', flexShrink: 0 }}>1</div>
                Soins et Mesures d'Urgence
              </h6>
              <div style={{ marginLeft: '38px', lineHeight: '1.6' }} className="text-muted small">
                Porter immédiatement secours à la victime. Transporter l'employé à la clinique conventionnée la plus proche si nécessaire. Informer la direction et le service sécurité sans délai.
              </div>
            </div>
            <div className="mb-4">
              <h6 className="fw-bold" style={{ color: '#2c767c', display: 'flex', alignItems: 'center', fontSize: '0.95rem' }}>
                <div style={{ width: '26px', height: '26px', backgroundColor: '#2c767c', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', fontSize: '13px', flexShrink: 0 }}>2</div>
                Constat et rapport interne
              </h6>
              <div style={{ marginLeft: '38px', lineHeight: '1.6' }} className="text-muted small">
                Recueillir les témoignages (Lieu, heure exacte, circonstances). Remplir une fiche de constat interne détaillant les faits et prendre des photos si pertinent pour le dossier.
              </div>
            </div>
            <div className="mb-4">
              <h6 className="fw-bold" style={{ color: '#2c767c', display: 'flex', alignItems: 'center', fontSize: '0.95rem' }}>
                <div style={{ width: '26px', height: '26px', backgroundColor: '#2c767c', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', fontSize: '13px', flexShrink: 0 }}>3</div>
                Déclaration à l'Assurance (48H)
              </h6>
              <div style={{ marginLeft: '38px', lineHeight: '1.6' }} className="text-muted small">
                Déclarer l'accident à l'assurance AT dans un délai maximum de <strong>48 heures ouvrables</strong>. Préparer le dossier : copie CIN, dernier bulletin de paie, rapport interne et certificat médical initial.
              </div>
            </div>
            <div className="mb-0">
              <h6 className="fw-bold" style={{ color: '#2c767c', display: 'flex', alignItems: 'center', fontSize: '0.95rem' }}>
                <div style={{ width: '26px', height: '26px', backgroundColor: '#2c767c', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', fontSize: '13px', flexShrink: 0 }}>4</div>
                Suivi et Clôture du dossier
              </h6>
              <div style={{ marginLeft: '38px', lineHeight: '1.6' }} className="text-muted small">
                Suivre les certificats de prolongation. À la fin du traitement, s'assurer de la réception du certificat de <strong>guérison</strong> ou de <strong>consolidation</strong> avec IPP pour clôturer le dossier auprès de l'assurance.
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
    </ThemeProvider >
  );
});

export default AccidentTable;

