import React, { useState, useEffect, useCallback, useMemo, forwardRef } from "react";
import axios from "axios";
import { Button, Dropdown, Modal } from "react-bootstrap";
import { faSliders, faFilter, faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FaPlusCircle } from "react-icons/fa";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { BarChart2, HelpCircle } from 'lucide-react';
import { BarChart } from "@mui/x-charts/BarChart";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import ExpandRTable from "../Shared/ExpandRTable";
import AddSanction from "./AddSanction";
import { motion, AnimatePresence } from 'framer-motion';
import Swal from "sweetalert2";
import "../Style.css";

const theme = createTheme();

const columns = [
  { key: "employe", label: "Employé" },
  { key: "matricule", label: "Matricule" },
  { key: "dateSanction", label: "Date sanction" },
  { key: "type", label: "Type" },
  { key: "gravite", label: "Gravité" },
  { key: "motif", label: "Motif" },
  { key: "statut", label: "Statut" },
  { key: "dateEffet", label: "Date effet" },
  { key: "dureeJours", label: "Durée (j)" },
  { key: "impactSalaire", label: "Impact salaire" },
];

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return dateStr.split('T')[0];
};

const mapApiToUi = (api) => ({
  id: api.id,
  employe: api.employe || "N/A",
  matricule: api.matricule || "N/A",
  dateSanction: formatDate(api.date_sanction),
  type: api.type?.nom || "N/A",
  sanction_type_id: api.sanction_type_id,
  gravite: api.gravite?.nom || "N/A",
  sanction_gravite_id: api.sanction_gravite_id,
  motif: api.motif_description ? (api.motif_description.length > 50 ? api.motif_description.substring(0, 50) + "..." : api.motif_description) : "N/A",
  motifDescription: api.motif_description || "",
  rappelFaits: api.rappel_faits || "",
  conflit_id: api.conflit_id,
  statut: api.statut?.nom || "N/A",
  sanction_statut_id: api.sanction_statut_id,
  dateEffet: formatDate(api.date_effet) || "-",
  dateFin: formatDate(api.date_fin) || "",
  dureeJours: api.duree_jours || "-",
  impactSalaire: api.impact_salaire ? "Oui" : "Non",
  montantImpact: api.montant_impact || "",
  referenceDossier: api.reference_dossier || "",
  commentairesRh: api.commentaires_rh || "",
  departement_id: api.departement_id,
  documents: api.documents || []
});

const mapUiToApi = (ui, deptId) => {
  const formData = new FormData();
  formData.append('employe', ui.employe);
  formData.append('matricule', ui.matricule);
  formData.append('date_sanction', ui.dateSanction);
  formData.append('reference_dossier', ui.referenceDossier || '');
  formData.append('departement_id', deptId || ui.departement_id || '');
  formData.append('sanction_type_id', ui.sanction_type_id);
  formData.append('motif_description', ui.motifDescription || '');
  formData.append('rappel_faits', ui.rappelFaits || '');
  formData.append('conflit_id', ui.conflit_id || '');
  formData.append('sanction_gravite_id', ui.sanction_gravite_id || '');
  formData.append('duree_jours', ui.dureeJours || '');
  formData.append('impact_salaire', ui.impactSalaire === 'Oui' || ui.impactSalaire === true ? '1' : '0');
  formData.append('montant_impact', (ui.impactSalaire === 'Oui' || ui.impactSalaire === true) ? (ui.montantImpact || '') : '');
  formData.append('date_effet', ui.dateEffet || '');
  formData.append('date_fin', ui.dateFin || '');
  formData.append('sanction_statut_id', ui.sanction_statut_id);
  formData.append('commentaires_rh', ui.commentairesRh || '');
  return formData;
};

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

const SanctionTable = forwardRef((props, ref) => {
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
    preloadedEmployees = []
  } = props;

  const [sanctions, setSanctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSanctions, setSelectedSanctions] = useState([]);
  const [allEmployeesCache, setAllEmployeesCache] = useState(preloadedEmployees);
  const [typesList, setTypesList] = useState([]);
  const [gravitesList, setGravitesList] = useState([]);
  const [statutsList, setStatutsList] = useState([]);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter states
  const [filterEmploye, setFilterEmploye] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterGravite, setFilterGravite] = useState("");
  const [showCharts, setShowCharts] = useState(false);
  const [showProcedModal, setShowProcedModal] = useState(false);

  const [columnVisibility, setColumnVisibility] = useState({
    employe: true,
    matricule: true,
    dateSanction: true,
    type: true,
    gravite: true,
    motif: true,
    statut: true,
    dateEffet: true,
    dureeJours: true,
    impactSalaire: true,
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

  const [editingSanction, setEditingSanction] = useState(null);

  const filtered = useMemo(() => {
    if (!departementId) return [];
    const ids = includeSubDepartments && getSubDepartmentIds ? getSubDepartmentIds(departements || [], departementId) : [departementId];
    const numericIds = ids.map(Number);
    return sanctions.filter((s) => numericIds.includes(Number(s.departement_id)));
  }, [sanctions, departementId, includeSubDepartments, getSubDepartmentIds, departements]);

  const uniqueEmployees = useMemo(() => {
    const employeeNames = filtered.map(s => s.employe).filter(name => name && name !== "N/A");
    return [...new Set(employeeNames)].sort();
  }, [filtered]);

  const searched = useMemo(() => {
    let result = filtered;

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

    if (filterEmploye.trim()) {
      result = result.filter(row => (row.employe || "") === filterEmploye);
    }

    if (filterStatut.trim()) {
      result = result.filter(row => (row.statut || "").toLowerCase() === filterStatut.toLowerCase());
    }

    if (filterDate.trim()) {
      result = result.filter(row => (row.dateSanction || "").includes(filterDate));
    }

    if (filterType.trim()) {
      result = result.filter(row => (row.type || "").toLowerCase() === filterType.toLowerCase());
    }

    if (filterGravite.trim()) {
      result = result.filter(row => (row.gravite || "").toLowerCase() === filterGravite.toLowerCase());
    }

    return result;
  }, [filtered, globalSearch, filterEmploye, filterStatut, filterDate, filterType, filterGravite]);

  // Chart data
  const chartData = useMemo(() => {
    const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const monthlyData = {};

    filtered.forEach(sanc => {
      if (!sanc.dateSanction) return;
      const date = new Date(sanc.dateSanction);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${month}`;

      if (!monthlyData[key]) {
        monthlyData[key] = { year, month, label: `${monthLabels[month]} ${year}`, count: 0 };
      }
      monthlyData[key].count += 1;
    });

    const sorted = Object.values(monthlyData)
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
      .slice(-6);

    // Type breakdown
    const byType = {};
    filtered.forEach(s => {
      const t = s.type || "Non défini";
      byType[t] = (byType[t] || 0) + 1;
    });

    return {
      labels: sorted.map(d => d.label),
      counts: sorted.map(d => d.count),
      totalSanctions: filtered.length,
      byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
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

  const onSave = async (formData, editId) => {
    try {
      const config = { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } };
      
      let res;
      if (editId) {
        formData.append('_method', 'PUT');
        res = await axios.post(`http://127.0.0.1:8000/api/sanctions/${editId}`, formData, config);
      } else {
        res = await axios.post("http://127.0.0.1:8000/api/sanctions", formData, config);
      }

      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: editId ? 'Sanction modifiée avec succès' : 'Sanction enregistrée avec succès',
        timer: 1500,
        showConfirmButton: false
      });

      handleClose();
      const mapped = mapApiToUi(res.data);
      if (editId) {
        setSanctions(prev => prev.map(s => s.id === mapped.id ? mapped : s));
      } else {
        setSanctions(prev => [mapped, ...prev]);
      }
      localStorage.removeItem('sanctionsCache');
    } catch (err) {
      console.error("Erreur enregistrement:", err.response?.data);
      const validationErrors = err.response?.data?.errors;
      if (validationErrors) {
        const messages = Object.values(validationErrors).flat().join('\n');
        Swal.fire({ icon: 'error', title: 'Erreur de validation', text: messages });
      } else {
        Swal.fire({ icon: 'error', title: 'Erreur', text: err.response?.data?.message || "Impossible d'enregistrer la sanction." });
      }
    }
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
        axios.delete(`http://127.0.0.1:8000/api/sanctions/${id}`, { withCredentials: true })
          .then(() => {
            setSanctions(prev => prev.filter(s => s.id !== id));
            Swal.fire('Supprimé!', 'La sanction a été supprimée.', 'success');
          })
          .catch(err => {
            console.error(err);
            Swal.fire('Erreur', 'Impossible de supprimer.', 'error');
          });
      }
    });
  };

  const handleDeleteSelected = useCallback(async () => {
    if (selectedSanctions.length === 0) return;

    const result = await Swal.fire({
      title: "Êtes-vous sûr?",
      text: `Vous allez supprimer ${selectedSanctions.length} sanction(s)!`,
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
          selectedSanctions.map(id => axios.delete(`http://127.0.0.1:8000/api/sanctions/${id}`, { withCredentials: true }))
        );
        setSanctions(prev => prev.filter(s => !selectedSanctions.includes(s.id)));
        setSelectedSanctions([]);
        Swal.fire("Supprimés!", "Les sanctions ont été supprimées.", "success");
      } catch (error) {
        console.error("Error deleting selected sanctions:", error);
        Swal.fire("Erreur!", "Une erreur est survenue lors de la suppression.", "error");
      }
    }
  }, [selectedSanctions]);

  const handleEdit = (row) => {
    // Prepare data for edit form
    const editData = {
      ...row,
      dateSanction: row.dateSanction,
      dateEffet: row.dateEffet === '-' ? '' : row.dateEffet,
      dateFin: row.dateFin,
      dureeJours: row.dureeJours === '-' ? '' : row.dureeJours,
      impactSalaire: row.impactSalaire === 'Oui',
      montantImpact: row.montantImpact || "",
    };
    setEditingSanction(editData);
    setIsAddingEmploye(true);
  };

  const columns_config = useMemo(() => [
    { key: 'employe', label: "Employé", visible: columnVisibility.employe },
    { key: 'matricule', label: "Matricule", visible: columnVisibility.matricule },
    { key: 'dateSanction', label: "Date sanction", visible: columnVisibility.dateSanction },
    { key: 'type', label: "Type", visible: columnVisibility.type },
    { key: 'gravite', label: "Gravité", visible: columnVisibility.gravite },
    { key: 'motif', label: "Motif", visible: columnVisibility.motif },
    { key: 'statut', label: "Statut", visible: columnVisibility.statut },
    { key: 'dateEffet', label: "Date effet", visible: columnVisibility.dateEffet },
    { key: 'dureeJours', label: "Durée (j)", visible: columnVisibility.dureeJours },
    { key: 'impactSalaire', label: "Impact salaire", visible: columnVisibility.impactSalaire },
  ], [columnVisibility]);

  const table_columns = columns_config.filter(col => col.visible);

  const handleSelectAllChange = (checked) => {
    if (checked) {
      setSelectedSanctions(searched.map(s => s.id));
    } else {
      setSelectedSanctions([]);
    }
  };

  const handleCheckboxChange = (id) => {
    setSelectedSanctions(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const loadSanctions = useCallback(() => {
    const cached = localStorage.getItem('sanctionsCache');
    if (cached) {
      try {
        setSanctions(JSON.parse(cached));
        setLoading(false);
      } catch (e) { /* ignore */ }
    }

    axios
      .get("http://127.0.0.1:8000/api/sanctions", { withCredentials: true })
      .then((res) => {
        const payload = Array.isArray(res.data) ? res.data : [];
        const mapped = payload.map(mapApiToUi);
        setSanctions(mapped);
        localStorage.setItem('sanctionsCache', JSON.stringify(mapped));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadSanctions(); }, [loadSanctions]);

  useEffect(() => {
    if (preloadedEmployees && preloadedEmployees.length > 0) {
      setAllEmployeesCache(preloadedEmployees);
    }
  }, [preloadedEmployees]);

  useEffect(() => {
    if (allEmployeesCache.length > 0) return;
    axios.get("http://127.0.0.1:8000/api/employes/light", { withCredentials: true })
      .then(res => {
        let emps = res.data;
        if (!Array.isArray(emps)) emps = [];
        setAllEmployeesCache(emps);
      })
      .catch(err => console.error("Error fetching employees:", err));
  }, [allEmployeesCache.length]);

  useEffect(() => {
    if (!departementId) {
      setFilterEmploye("");
      return;
    }
    setFilterEmploye("");
  }, [departementId]);

  // Fetch lists for filters
  useEffect(() => {
    const cachedTypes = localStorage.getItem('sanctionTypesCache');
    const cachedGravites = localStorage.getItem('sanctionGravitesCache');
    const cachedStatuts = localStorage.getItem('sanctionStatutsCache');

    if (cachedTypes) try { setTypesList(JSON.parse(cachedTypes)); } catch (e) { /* ignore */ }
    if (cachedGravites) try { setGravitesList(JSON.parse(cachedGravites)); } catch (e) { /* ignore */ }
    if (cachedStatuts) try { setStatutsList(JSON.parse(cachedStatuts)); } catch (e) { /* ignore */ }

    Promise.all([
      axios.get("http://127.0.0.1:8000/api/sanction-types", { withCredentials: true }),
      axios.get("http://127.0.0.1:8000/api/sanction-gravites", { withCredentials: true }),
      axios.get("http://127.0.0.1:8000/api/sanction-statuts", { withCredentials: true })
    ])
      .then(([typesRes, gravitesRes, statutsRes]) => {
        const typesData = Array.isArray(typesRes.data) ? typesRes.data : [];
        const gravitesData = Array.isArray(gravitesRes.data) ? gravitesRes.data : [];
        const statutsData = Array.isArray(statutsRes.data) ? statutsRes.data : [];
        setTypesList(typesData);
        setGravitesList(gravitesData);
        setStatutsList(statutsData);
        localStorage.setItem('sanctionTypesCache', JSON.stringify(typesData));
        localStorage.setItem('sanctionGravitesCache', JSON.stringify(gravitesData));
        localStorage.setItem('sanctionStatutsCache', JSON.stringify(statutsData));
      })
      .catch(err => console.error("Error fetching sanction lists:", err));
  }, []);

  const handleClose = () => {
    setIsAddingEmploye(false);
    setEditingSanction(null);
  };

  const exportToPDF = useCallback(() => {
    const doc = new jsPDF();
    const tableColumn = columns_config.filter(col => col.visible).map(col => col.label);
    const tableRows = searched.map(row =>
      columns_config.filter(col => col.visible).map(col => row[col.key])
    );
    doc.setFontSize(18);
    doc.text(`Sanctions disciplinaires - ${departementName || "Tous"}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
    });
    doc.save(`sanctions_${departementName || "tous"}_${new Date().toISOString()}.pdf`);
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
    XLSX.utils.book_append_sheet(wb, ws, "Sanctions");
    XLSX.writeFile(wb, `sanctions_${departementName || "tous"}_${new Date().toISOString()}.xlsx`);
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
            <h1>Sanctions disciplinaires - ${departementName || "Tous"}</h1>
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
    printWindow.focus();
    printWindow.print();
  }, [columns_config, searched, departementName]);

  const downloadDocument = (doc) => {
    window.open(`http://127.0.0.1:8000/storage/${doc.chemin}`, '_blank');
  };

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
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', columnGap: '16px', width: '100%' }}>
                {/* Bloc titre */}
                <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                  <span className="section-title mb-1" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2c767c' }}>
                    <i className="fas fa-gavel me-2"></i>
                    Détails Sanction
                  </span>
                  <p className="section-description text-muted mb-0">
                    {searched.length} sanction{searched.length > 1 ? 's' : ''} actuellement affiché{searched.length > 1 ? 'es' : 'e'}
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
                    title="Graphe des sanctions"
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
                    title="Procédure disciplinaire"
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
                      setEditingSanction(null);
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
                    Ajouter une sanction
                  </Button>

                  <Dropdown>
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
                      <option value="">Tous</option>
                      {typesList.map(t => (
                        <option key={t.id} value={t.nom}>{t.nom}</option>
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
                        minWidth: 100,
                        height: 30,
                        fontSize: '0.9rem',
                        padding: '2px 6px',
                        borderRadius: 6
                      }}
                    >
                      <option value="">Toutes</option>
                      {gravitesList.map(g => (
                        <option key={g.id} value={g.nom}>{g.nom}</option>
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
                      {statutsList.map(s => (
                        <option key={s.id} value={s.nom}>{s.nom}</option>
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
                </motion.div>
              )}
            </AnimatePresence>

            {/* Table */}
            <ExpandRTable
              data={searched}
              columns={table_columns}
              highlightText={highlightText}
              searchTerm={globalSearch}
              selectedItems={selectedSanctions}
              handleSelectAllChange={handleSelectAllChange}
              handleCheckboxChange={handleCheckboxChange}
              selectAll={selectedSanctions.length === searched.length && searched.length > 0}
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
                backgroundColor: (editingSanction && row.id === editingSanction.id)
                    ? '#d1fae5'
                    : 'white',
                borderLeft: (editingSanction && row.id === editingSanction.id)
                    ? '4px solid #2c767c'
                    : '4px solid transparent',
                '&:hover': { backgroundColor: (editingSanction && row.id === editingSanction.id) ? '#a7f3d0' : '#f9fafb' },
                cursor: 'pointer',
              })}
            />
          </div>
        </div>
        {/* end table area */}

        {isAddingEmploye && (
          <AddSanction
            onClose={handleClose}
            onSave={onSave}
            departementId={departementId}
            initialData={editingSanction}
            preloadedEmployees={allEmployeesCache}
            onResourceUpdate={loadSanctions}
          />
        )}

        {/* Panel Graphe des Sanctions */}
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
                  Statistiques des Sanctions
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
                    Aucune sanction disponible pour afficher le graphe.
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '16px', color: '#1e293b', fontSize: '0.85rem' }}>
                      {chartData.totalSanctions} sanction(s) enregistrée(s)
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
                        series={[{ data: chartData.counts, label: 'Sanctions', color: '#2c767c' }]}
                        height={250}
                        margin={{ bottom: 70 }}
                        slotProps={{
                          legend: {
                            position: { vertical: 'bottom', horizontal: 'middle' },
                            padding: { top: 20 }
                          }
                        }}
                      />
                    </div>

                    {/* Par type */}
                    {chartData.byType.length > 0 && (
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
                          Répartition par Type
                        </h6>
                        <BarChart
                          xAxis={[{ scaleType: 'band', data: chartData.byType.map(t => t.type) }]}
                          series={[{ data: chartData.byType.map(t => t.count), label: 'Sanctions', color: '#f59e0b' }]}
                          height={220}
                          margin={{ bottom: 80 }}
                          slotProps={{
                            legend: {
                              position: { vertical: 'bottom', horizontal: 'middle' }
                            }
                          }}
                        />
                      </div>
                    )}

                    {/* Summary Cards */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '12px',
                      marginTop: '16px'
                    }}>
                      {[
                        { label: 'Total Sanctions', value: chartData.totalSanctions, color: '#2c767c' },
                        { label: 'Types distincts', value: chartData.byType.length, color: '#f59e0b' },
                        { label: 'Mois analysés', value: chartData.labels.length, color: '#10b981' },
                        { label: 'Moy. / mois', value: chartData.labels.length > 0 ? Math.round(chartData.totalSanctions / chartData.labels.length) : 0, color: '#6366f1' }
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
      </div>

      {/* Procedure Modal */}
      <Modal show={showProcedModal} onHide={() => setShowProcedModal(false)} size="lg" centered>
        <Modal.Header closeButton style={{ borderBottom: '2px solid #2c767c' }}>
          <Modal.Title style={{ color: '#2c767c' }}>Procédure disciplinaire</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <h6 className="fw-bold mb-3">Échelle des sanctions (progressive):</h6>
            <ol className="ps-3">
              <li className="mb-2"><strong>Avertissement écrit</strong> - Premier manquement mineur</li>
              <li className="mb-2"><strong>Blâme</strong> - Récidive ou manquement plus important</li>
              <li className="mb-2"><strong>Mise à pied</strong> - Faute grave, suspension temporaire</li>
              <li className="mb-2"><strong>Mutation disciplinaire</strong> - Changement de poste/service</li>
              <li className="mb-2"><strong>Rétrogradation</strong> - Baisse de grade/responsabilités</li>
              <li className="mb-2"><strong>Licenciement disciplinaire</strong> - Faute très grave</li>
            </ol>
          </div>
          <div className="mb-4">
            <h6 className="fw-bold mb-3">Documents à fournir:</h6>
            <ul className="ps-3">
              <li>Lettre d'avertissement ou de sanction</li>
              <li>Décision signée par la direction</li>
              <li>Preuves (rapports, témoignages, etc.)</li>
              <li>Rapport RH détaillé</li>
            </ul>
          </div>
          <div className="alert alert-info">
            <strong>Important:</strong> Toute sanction doit être proportionnelle à la faute et respecter le principe de progressivité sauf en cas de faute grave ou lourde.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button style={{ backgroundColor: '#2c767c', borderColor: '#2c767c' }} onClick={() => setShowProcedModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
    </ThemeProvider>
  );
});

SanctionTable.displayName = 'SanctionTable';

export default SanctionTable;
