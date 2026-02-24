import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Box } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { FaPlusCircle } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose, faEdit, faFilter, faTrash } from "@fortawesome/free-solid-svg-icons";
import { BarChart2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "react-bootstrap";
import Swal from "sweetalert2";
import { useHeader } from "../../Acceuil/HeaderContext";
import { useOpen } from "../../Acceuil/OpenProvider";
import { DepartmentPanel } from "../../ComponentHistorique/DepartementPanel";
import ExpandRTable from "../Employe/ExpandRTable";
import AddDeclarationIndividuelle from "./AddDeclarationIndividuelle";
import "../Style.css";

const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:8000"
  : "http://127.0.0.1:8000";

const STATUT_CONFIG = {
  non_declare:  { label: "Non déclaré",  bg: "#fef2f2", color: "#dc2626" },
  declare:      { label: "Déclaré",      bg: "#fff7ed", color: "#d97706" },
  valide:       { label: "Validé",       bg: "#f0fdf4", color: "#16a34a" },
  paye:         { label: "Payé",         bg: "#eff6ff", color: "#2563eb" },
};

const StatutChip = ({ statut }) => {
  const cfg = STATUT_CONFIG[statut] || { label: statut || "N/A", bg: "#f1f5f9", color: "#64748b" };
  return (
    <span style={{
      backgroundColor: cfg.bg, color: cfg.color,
      padding: "0.25rem 0.625rem", borderRadius: "0.75rem",
      fontSize: "0.75rem", fontWeight: 600,
      display: "inline-block", whiteSpace: "nowrap",
    }}>
      {cfg.label}
    </span>
  );
};

const MOIS_LABELS = ["", "Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

// ─── Composant principal ────────────────────────────────────────────────────────
function DeclarationsIndividuellesCNSS() {
  const { dynamicStyles } = useOpen();
  const { setTitle, setOnPrint, setOnExportPDF, searchQuery, clearActions } = useHeader();
  const location = useLocation();

  // ── DepartmentPanel state ─────────────────────────────────────────────────────
  const [selectedDepartementId, setSelectedDepartementId] = useState(null);
  const [includeSubDepartments, setIncludeSubDepartments] = useState(false);
  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // ── Déclarations ──────────────────────────────────────────────────────────────
  const [declarations, setDeclarations] = useState([]);
  const [loadingDecl, setLoadingDecl] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ── Formulaire ────────────────────────────────────────────────────────────────
  const [formMode, setFormMode] = useState(null);
  const [editDeclaration, setEditDeclaration] = useState(null);

  // ── Graphe ────────────────────────────────────────────────────────────────────
  const [showChart, setShowChart] = useState(false);

  // ── Expand rows ───────────────────────────────────────────────────────────────
  const [expandedRows, setExpandedRows] = useState({});
  const toggleRowExpansion = useCallback((id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // ── Filtres ───────────────────────────────────────────────────────────────────
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [statutFilter, setStatutFilter] = useState("");
  const [moisFilter, setMoisFilter] = useState("");
  const [anneeFilter, setAnneeFilter] = useState(String(new Date().getFullYear()));

  // ── Recherche globale ─────────────────────────────────────────────────────────
  const [globalSearch, setGlobalSearch] = useState('');
  useEffect(() => { setGlobalSearch(searchQuery || ''); }, [searchQuery]);

  // ── Resize (form panel) ───────────────────────────────────────────────────────
  const [drawerWidth, setDrawerWidth] = useState(45);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setTitle("Déclarations individuelles CNSS");
    return () => clearActions();
  }, [setTitle, clearActions]);

  // ── Export PDF ────────────────────────────────────────────────────────────────
  const exportToPDF = useCallback(() => {
    const data = declarations.filter((d) => {
      if (statutFilter && d.statut !== statutFilter) return false;
      if (moisFilter && String(d.mois) !== moisFilter) return false;
      if (anneeFilter && String(d.annee) !== anneeFilter) return false;
      return true;
    });
    const doc = new jsPDF({ orientation: "landscape" });
    const empLabel = selectedEmployee ? `${selectedEmployee.nom} ${selectedEmployee.prenom}` : "Tous";
    doc.setFontSize(16);
    doc.text("Déclarations individuelles CNSS", 14, 18);
    doc.setFontSize(10);
    doc.text(`Employé : ${empLabel}`, 14, 26);
    doc.text(`Date d'édition : ${new Date().toLocaleDateString("fr-FR")}`, 14, 32);
    doc.autoTable({
      startY: 38,
      head: [["Matricule", "Nom Prénom", "CIN", "Salaire base (MAD)", "Jours trav.", "Salaire brut imp. (MAD)", "Mois", "Année", "Statut"]],
      body: data.map((d) => [
        d.matricule ?? "",
        `${d.nom ?? ""} ${d.prenom ?? ""}`.trim(),
        d.cin ?? "",
        Number(d.salaire_base || 0).toFixed(2),
        d.jours_travailles ?? "",
        Number(d.salaire_brut_imposable || 0).toFixed(2),
        MOIS_LABELS[d.mois] || d.mois,
        d.annee ?? "",
        STATUT_CONFIG[d.statut]?.label ?? d.statut ?? "",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [44, 118, 124] },
      alternateRowStyles: { fillColor: [245, 250, 251] },
    });
    doc.save(`declarations_cnss_${empLabel.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
  }, [declarations, statutFilter, moisFilter, anneeFilter, selectedEmployee]);

  // ── Impression ────────────────────────────────────────────────────────────────
  const handlePrint = useCallback(() => {
    const data = declarations.filter((d) => {
      if (statutFilter && d.statut !== statutFilter) return false;
      if (moisFilter && String(d.mois) !== moisFilter) return false;
      if (anneeFilter && String(d.annee) !== anneeFilter) return false;
      return true;
    });
    const empLabel = selectedEmployee ? `${selectedEmployee.nom} ${selectedEmployee.prenom}` : "Tous";
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const rows = data.map((d) => `
      <tr>
        <td>${d.matricule ?? ""}</td>
        <td>${(d.nom ?? "")} ${(d.prenom ?? "")}</td>
        <td>${d.cin ?? ""}</td>
        <td>${Number(d.salaire_base || 0).toFixed(2)}</td>
        <td>${d.jours_travailles ?? ""}</td>
        <td>${Number(d.salaire_brut_imposable || 0).toFixed(2)}</td>
        <td>${MOIS_LABELS[d.mois] || d.mois}</td>
        <td>${d.annee ?? ""}</td>
        <td>${STATUT_CONFIG[d.statut]?.label ?? d.statut ?? ""}</td>
      </tr>`).join("");
    printWindow.document.write(`<html><head><title>Déclarations CNSS</title><style>
      body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
      h2 { color: #2c767c; margin-bottom: 4px; }
      p { margin: 2px 0 12px; color: #555; font-size: 11px; }
      table { border-collapse: collapse; width: 100%; }
      th { background: #2c767c; color: #fff; padding: 7px 8px; text-align: left; font-size: 11px; }
      td { border: 1px solid #ddd; padding: 6px 8px; font-size: 11px; }
      tr:nth-child(even) td { background: #f5fafb; }
      @media print { @page { size: landscape; margin: 15mm; } }
    </style></head><body>
      <h2>Déclarations individuelles CNSS</h2>
      <p>Employé : ${empLabel} &nbsp;|&nbsp; Édition : ${new Date().toLocaleDateString("fr-FR")}</p>
      <table>
        <thead><tr>
          <th>Matricule</th><th>Nom Prénom</th><th>CIN</th>
          <th>Salaire base (MAD)</th><th>Jours trav.</th><th>Salaire brut imp. (MAD)</th>
          <th>Mois</th><th>Année</th><th>Statut</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, [declarations, statutFilter, moisFilter, anneeFilter, selectedEmployee]);

  // ── Enregistrer dans le header ────────────────────────────────────────────────
  useEffect(() => {
    if (setOnPrint) setOnPrint(() => handlePrint);
    if (setOnExportPDF) setOnExportPDF(() => exportToPDF);
  }, [setOnPrint, setOnExportPDF, handlePrint, exportToPDF]);

  // ── Fetch employés par département (pour DepartmentPanel) ─────────────────────
  const fetchEmployes = useCallback(async (deptId) => {
    if (!deptId) { setDepartmentEmployees([]); return; }
    try {
      const res = await axios.get(`${API_BASE}/api/employes`);
      const list = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      const filtered = list.filter((e) => {
        if (e.departement_id) return String(e.departement_id) === String(deptId);
        if (Array.isArray(e.departements)) return e.departements.some((d) => String(d.id) === String(deptId));
        return false;
      });
      setDepartmentEmployees(filtered);
    } catch { setDepartmentEmployees([]); }
  }, []);

  // ── Fetch déclarations par employé ────────────────────────────────────────────
  const fetchDeclarations = useCallback(async (employeId) => {
    if (!employeId) { setDeclarations([]); return; }
    setLoadingDecl(true);
    try {
      const res = await axios.get(`${API_BASE}/api/employes/${employeId}/declarations-individuelles`);
      setDeclarations(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    } catch { setDeclarations([]); }
    finally { setLoadingDecl(false); }
  }, []);

  // ── Handlers DepartmentPanel ──────────────────────────────────────────────────
  const handleSelectDepartment = useCallback((deptId) => {
    setSelectedDepartementId(deptId);
    setSelectedEmployee(null);
    setDeclarations([]);
    setFormMode(null);
    fetchEmployes(deptId);
  }, [fetchEmployes]);

  const handleSelectEmployee = useCallback((emp) => {
    setSelectedEmployee(emp);
    setFormMode(null);
    setEditDeclaration(null);
    fetchDeclarations(emp?.id);
  }, [fetchDeclarations]);

  // ── Auto-sélection via navigation state (depuis DeclarationDetails) ───────────
  useEffect(() => {
    const state = location.state;
    if (!state?.employeeId) return;
    // Clear nav state to avoid re-triggering on page refresh
    window.history.replaceState({}, "");
    // Build a minimal employee object from the state passed by DeclarationDetails
    const emp = {
      id: state.employeeId,
      nom: state.employeeNom ?? "",
      prenom: state.employeePrenom ?? "",
    };
    setSelectedEmployee(emp);
    fetchDeclarations(emp.id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers formulaire ───────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    if (!selectedEmployee) return;
    setShowChart(false);
    setEditDeclaration(null);
    setFormMode("add");
  };

  const handleOpenEdit = (decl) => {
    setShowChart(false);
    setEditDeclaration(decl);
    setFormMode("edit");
  };

  const handleCloseForm = () => { setFormMode(null); setEditDeclaration(null); };

  const handleSaved = () => {
    handleCloseForm();
    if (selectedEmployee) fetchDeclarations(selectedEmployee.id);
  };

  // ── Suppression en masse ─────────────────────────────────────────────────────
  const handleDeleteSelected = useCallback(async () => {
    if (selectedItems.length === 0) return;
    const result = await Swal.fire({
      title: "Supprimer la sélection ?",
      text: `${selectedItems.length} déclaration(s) seront supprimées.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    });
    if (!result.isConfirmed) return;
    try {
      await Promise.all(
        selectedItems.map((id) =>
          axios.delete(`${API_BASE}/api/cnss/declarations-individuelles/${id}`)
        )
      );
      setSelectedItems([]);
      Swal.fire("Supprimé", "Les déclarations sélectionnées ont été supprimées.", "success");
      if (selectedEmployee) fetchDeclarations(selectedEmployee.id);
    } catch {
      Swal.fire("Erreur", "Impossible de supprimer certaines déclarations.", "error");
    }
  }, [selectedItems, selectedEmployee, fetchDeclarations]);

  // ── Suppression ───────────────────────────────────────────────────────────────
  const handleDelete = async (decl) => {
    const result = await Swal.fire({
      title: "Supprimer la déclaration ?",
      text: `Déclaration ${MOIS_LABELS[decl.mois] || decl.mois}/${decl.annee} — ${decl.nom ?? ""} ${decl.prenom ?? ""}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    });
    if (!result.isConfirmed) return;
    try {
      await axios.delete(`${API_BASE}/api/cnss/declarations-individuelles/${decl.id}`);
      Swal.fire("Supprimé", "Déclaration supprimée.", "success");
      if (selectedEmployee) fetchDeclarations(selectedEmployee.id);
    } catch { Swal.fire("Erreur", "Impossible de supprimer.", "error"); }
  };

  // ── Resize ────────────────────────────────────────────────────────────────────
  const startResizing = useCallback((e) => { e.preventDefault(); setIsResizing(true); }, []);
  const stopResizing = useCallback(() => setIsResizing(false), []);
  const resize = useCallback((e) => {
    if (isResizing && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newW = ((rect.right - e.clientX) / rect.width) * 100;
      if (newW > 15 && newW < 80) setDrawerWidth(newW);
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) { window.addEventListener("mousemove", resize); window.addEventListener("mouseup", stopResizing); }
    else { window.removeEventListener("mousemove", resize); window.removeEventListener("mouseup", stopResizing); }
    return () => { window.removeEventListener("mousemove", resize); window.removeEventListener("mouseup", stopResizing); };
  }, [isResizing, resize, stopResizing]);

  // ── Données filtrées ──────────────────────────────────────────────────────────
  const filteredDeclarations = declarations.filter((d) => {
    if (statutFilter && d.statut !== statutFilter) return false;
    if (moisFilter && String(d.mois) !== moisFilter) return false;
    if (anneeFilter && String(d.annee) !== anneeFilter) return false;
    return true;
  });

  // ── Colonnes tableau ──────────────────────────────────────────────────────────
  const columns = [
    { key: "matricule",              label: "Matricule" },
    { key: "nom",                    label: "Nom" },
    { key: "cin",                    label: "CIN" },
    { key: "salaire_base",           label: "Salaire base",           render: (d) => `${Number(d.salaire_base || 0).toFixed(2)} MAD` },
    { key: "jours_travailles",       label: "Jours travaillés" },
    { key: "salaire_brut_imposable", label: "Salaire brut imposable", render: (d) => `${Number(d.salaire_brut_imposable || 0).toFixed(2)} MAD` },
    { key: "mois",                   label: "Mois",                   render: (d) => MOIS_LABELS[d.mois] || d.mois },
    { key: "annee",                  label: "Année" },
    { key: "statut",                 label: "Statut",                 render: (d) => <StatutChip statut={d.statut} /> },
  ];

  // ── Expanded row : détails cotisations ───────────────────────────────────────
  const renderExpandedRow = useCallback((decl) => {
    const s = parseFloat(decl.salaire_brut_imposable) || 0;
    const plafond = 6000;
    const base = Math.min(s, plafond);
    const cotSal = ((base * 0.0429) + (s * 0.0226)).toFixed(2);
    const cotPat = ((base * 0.0898) + (s * 0.1211)).toFixed(2);
    const total  = (parseFloat(cotSal) + parseFloat(cotPat)).toFixed(2);

    const rows = [
      { label: "Salaire base",            value: `${Number(decl.salaire_base || 0).toFixed(2)} MAD` },
      { label: "Salaire brut imposable",  value: `${s.toFixed(2)} MAD` },
      { label: "Base plafonnée",          value: `${base.toFixed(2)} MAD` },
      { label: "Jours travaillés",        value: decl.jours_travailles },
      { label: "Cotisation salarié",      value: `${cotSal} MAD`, color: "#2563eb" },
      { label: "Cotisation patronale",    value: `${cotPat} MAD`, color: "#d97706" },
      { label: "Total cotisations",       value: `${total} MAD`,  color: "#16a34a", bold: true },
    ];

    return (
      <div style={{ padding: "8px 0" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          marginBottom: "12px", fontWeight: 700, fontSize: "0.8rem",
          color: "#2c767c", textTransform: "uppercase", letterSpacing: "0.06em",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2c767c" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          Détails de la déclaration — {MOIS_LABELS[decl.mois] || decl.mois} {decl.annee}
        </div>
        <table style={{
          width: "100%", borderCollapse: "collapse",
          fontSize: "0.85rem", backgroundColor: "#fff",
          border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden",
        }}>
          <thead>
            <tr style={{ backgroundColor: "#f0fdf4" }}>
              {["Libellé", "Valeur"].map((h) => (
                <th key={h} style={{
                  padding: "10px 16px", textAlign: "left",
                  fontWeight: 700, color: "#374151",
                  fontSize: "0.78rem", textTransform: "uppercase",
                  letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.label} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                <td style={{
                  padding: "9px 16px", color: "#6b7280",
                  borderBottom: "1px solid #f3f4f6", fontWeight: 500,
                }}>{r.label}</td>
                <td style={{
                  padding: "9px 16px",
                  color: r.color || "#111827",
                  fontWeight: r.bold ? 700 : 500,
                  borderBottom: "1px solid #f3f4f6",
                }}>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }, []);

  const isFormOpen = Boolean(formMode);
  const isRightOpen = isFormOpen || showChart;

  // ── Données pour le graphe ────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    const sorted = [...declarations].sort((a, b) =>
      a.annee !== b.annee ? a.annee - b.annee : a.mois - b.mois
    );
    return {
      labels: sorted.map((d) => `${MOIS_LABELS[d.mois] || d.mois} ${d.annee}`),
      salaireBase:         sorted.map((d) => Number(d.salaire_base           || 0)),
      salaireBrutImposable: sorted.map((d) => Number(d.salaire_brut_imposable || 0)),
      joursTravailles:     sorted.map((d) => Number(d.jours_travailles       || 0)),
    };
  }, [declarations]);

  return (
    <ThemeProvider theme={createTheme()}>
      <style>{`
        @keyframes slideInChart {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
      <Box sx={{ ...dynamicStyles }}>
        <Box component="main" sx={{ flexGrow: 1, p: 0, mt: 12 }}>
          <div style={{ display: "flex", flex: 1, position: "relative", margin: 0, padding: 0, height: "calc(100vh - 80px)" }}>

            {/* ── GAUCHE : DepartmentPanel ─────────────────────────────────── */}
            <div style={{ width: "34%", height: "100%", margin: 0, padding: 0 }}>
              <DepartmentPanel
                onSelectDepartment={handleSelectDepartment}
                selectedDepartmentId={selectedDepartementId}
                includeSubDepartments={includeSubDepartments}
                onIncludeSubDepartmentsChange={setIncludeSubDepartments}
                employees={departmentEmployees}
                selectedEmployee={selectedEmployee}
                selectedEmployees={selectedEmployee ? new Set([selectedEmployee.id]) : new Set()}
                processedEmployees={new Set()}
                onSelectEmployee={handleSelectEmployee}
                onCheckEmployee={() => {}}
                findDepartmentName={() => ""}
                filtersVisible={false}
              />
            </div>

            {/* ── DROITE : Table + formulaire (container3) ─────────────────── */}
            <div className="container3" ref={containerRef} style={{ display: "flex", overflow: "hidden" }}>

              {/* Panel tableau */}
              <div style={{
                flex: isRightOpen ? `1 1 ${100 - drawerWidth}%` : "1 1 100%",
                borderRight: isRightOpen ? "2px solid #eef2f5" : "none",
                minWidth: 0, height: "100%",
                overflowY: "auto", overflowX: "hidden",
                transition: isResizing ? "none" : "all 0.3s ease",
                boxSizing: "border-box",
              }}>
                <div className="mt-4">
                  {/* En-tête section */}
                  <div className="section-header mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="section-title mb-1" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2c767c', textTransform: 'none' }}>
                          <i className="fas fa-id-card me-2"></i>
                          Déclarations individuelles CNSS
                        </span>
                        <p className="section-description text-muted mb-0" style={{ fontSize: "13px" }}>
                          {selectedEmployee
                            ? `${filteredDeclarations.length} déclaration(s) — ${selectedEmployee.nom} ${selectedEmployee.prenom}`
                            : "Sélectionnez un employé pour voir ses déclarations"}
                        </p>
                      </div>
                      {!isFormOpen && (
                        <div className="d-flex align-items-center" style={{ gap: "12px" }}>
                          <FontAwesomeIcon
                            onClick={() => setFiltersVisible((v) => !v)}
                            icon={filtersVisible ? faClose : faFilter}
                            style={{ cursor: "pointer", fontSize: "1.9rem", color: filtersVisible ? "green" : "#2c767c", marginTop: "4px" }}
                          />
                          <button
                            onClick={() => { setFormMode(null); setEditDeclaration(null); setShowChart((v) => !v); }}
                            title="Voir graphe"
                            style={{
                              backgroundColor: "#2c767c",
                              border: "1px solid #2c767c",
                              borderRadius: "10px",
                              padding: "6px 12px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                            }}
                          >
                            <BarChart2 size={18} color="#ffffff" strokeWidth={2} />
                          </button>
                          <Button
                            onClick={handleOpenAdd}
                            disabled={!selectedEmployee}
                            size="sm"
                            className={`btn d-flex align-items-center ${!selectedEmployee ? "disabled-btn" : ""}`}
                            style={{ width: "200px", marginRight: "8px", backgroundColor: "#2c767c", borderColor: "#2c767c", color: "#fff" }}
                          >
                            <FaPlusCircle className="me-2" />Ajouter déclaration
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Filtres */}
                  <AnimatePresence>
                    {filtersVisible && !isFormOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="filters-container"
                      >
                        <div className="filters-icon-section">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a90a4" strokeWidth="2" className="filters-icon">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                          </svg>
                          <span className="filters-title">Filtres</span>
                        </div>
                        <div className="filter-group" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                          <label className="filter-label" style={{ marginRight: "-4%" }}>Statut</label>
                          <div className="filter-input-wrapper">
                            <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)} className="filter-input">
                              <option value="">Tous</option>
                              <option value="non_declare">Non déclaré</option>
                              <option value="declare">Déclaré</option>
                              <option value="valide">Validé</option>
                              <option value="paye">Payé</option>
                            </select>
                          </div>
                        </div>
                        <div className="filter-group" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                          <label className="filter-label" style={{ marginRight: "-4%" }}>Mois</label>
                          <div className="filter-input-wrapper">
                            <select value={moisFilter} onChange={(e) => setMoisFilter(e.target.value)} className="filter-input">
                              <option value="">Tous</option>
                              {MOIS_LABELS.slice(1).map((label, i) => (
                                <option key={i + 1} value={String(i + 1)}>{label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="filter-group" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                          <label className="filter-label" style={{ marginRight: "-4%" }}>Année</label>
                          <div className="filter-input-wrapper">
                            <select
                              value={anneeFilter}
                              onChange={(e) => setAnneeFilter(e.target.value)}
                              className="filter-input"
                            >
                              <option value="">Tous</option>
                              {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((y) => (
                                <option key={y} value={String(y)}>{y}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Tableau */}
                  <ExpandRTable
                    columns={columns}
                    data={filteredDeclarations}
                    filteredData={filteredDeclarations}
                    loading={loadingDecl}
                    loadingText="Chargement des déclarations…"
                    searchTerm={globalSearch}
                    highlightText={(text) => text}
                    selectAll={selectedItems.length === filteredDeclarations.length && filteredDeclarations.length > 0}
                    selectedItems={selectedItems}
                    handleSelectAllChange={(e) => {
                      if (e.target.checked) setSelectedItems(filteredDeclarations.map((d) => d.id));
                      else setSelectedItems([]);
                    }}
                    handleCheckboxChange={(id) => setSelectedItems((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
                    handleDeleteSelected={handleDeleteSelected}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    handleChangePage={(_, newPage) => setPage(newPage)}
                    handleChangeRowsPerPage={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    expandedRows={expandedRows}
                    toggleRowExpansion={toggleRowExpansion}
                    renderExpandedRow={renderExpandedRow}
                    renderCustomActions={(decl) => (
                      <div className="d-flex align-items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(decl); }} title="Modifier"
                          style={{ border: "none", background: "transparent", cursor: "pointer", color: "#2c767c" }}>
                          <FontAwesomeIcon icon={faEdit} style={{ fontSize: "14px" }} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(decl); }} title="Supprimer"
                          style={{ border: "none", background: "transparent", cursor: "pointer", color: "#dc2626" }}>
                          <FontAwesomeIcon icon={faTrash} style={{ fontSize: "14px" }} />
                        </button>
                      </div>
                    )}
                    canEdit={false}
                    canDelete={false}
                    canBulkDelete={true}
                  />
                </div>
              </div>

              {/* Resizer */}
              {isRightOpen && (
                <div
                  onMouseDown={startResizing}
                  style={{
                    width: "8px", cursor: "col-resize",
                    backgroundColor: isResizing ? "#2c767c" : "transparent",
                    transition: "background-color 0.2s", zIndex: 10,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  <div style={{ width: "2px", height: "30px", backgroundColor: "#e2e8f0", borderRadius: "1px" }} />
                </div>
              )}

              {/* Formulaire */}
              {isFormOpen && (
                <div style={{
                  flex: `1 1 ${drawerWidth}%`,
                  height: "100%", overflow: "auto", position: "relative",
                  backgroundColor: "#fdfdfd",
                  boxShadow: "-4px 0 15px rgba(0,0,0,0.05)",
                  transition: isResizing ? "none" : "flex 0.3s ease",
                  minWidth: 0, maxWidth: "90vw", boxSizing: "border-box",
                }}>
                  <AddDeclarationIndividuelle
                    employe={selectedEmployee}
                    declaration={editDeclaration}
                    mode={formMode}
                    onClose={handleCloseForm}
                    onSaved={handleSaved}
                  />
                </div>
              )}

              {/* Graphe */}
              {showChart && (
                <div style={{
                  flex: `1 1 ${drawerWidth}%`,
                  height: "100%", display: "flex", flexDirection: "column",
                  overflow: "hidden", position: "relative",
                  backgroundColor: "#fff",
                  boxShadow: "-4px 0 15px rgba(0,0,0,0.05)",
                  transition: isResizing ? "none" : "flex 0.3s ease",
                  minWidth: 0, maxWidth: "90vw", boxSizing: "border-box",
                  animation: "slideInChart 0.3s cubic-bezier(0.4,0,0.2,1) both",
                }}>
                  {/* Header */}
                  <div style={{
                    padding: "16px 24px",
                    background: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    flexShrink: 0,
                  }}>
                    <h3 style={{ margin: 0, fontSize: "18px", color: "#2c767c", fontWeight: 600, display: "flex", alignItems: "center", gap: "10px" }}>
                      <BarChart2 size={18} color="#2c767c" strokeWidth={2} />
                      Graphe des D&eacute;clarations
                    </h3>
                    <button
                      onClick={() => setShowChart(false)}
                      style={{
                        background: "transparent", border: "none", color: "#94a3b8",
                        cursor: "pointer", padding: "4px", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontSize: "1.5rem", lineHeight: 1,
                      }}
                      aria-label="Fermer"
                    >
                      &times;
                    </button>
                  </div>

                  {/* Body scrollable */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
                    {!selectedEmployee ? (
                      <p style={{ textAlign: "center", color: "#6b7280", padding: "60px 0" }}>
                        Sélectionnez un employé pour voir le graphe.
                      </p>
                    ) : declarations.length === 0 ? (
                      <p style={{ textAlign: "center", color: "#6b7280", padding: "60px 0" }}>
                        Aucune déclaration disponible pour afficher le graphe.
                      </p>
                    ) : (
                      <>
                        <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "20px" }}>
                          {selectedEmployee.nom} {selectedEmployee.prenom} — {declarations.length}&nbsp;déclaration(s)
                        </p>

                        {/* Salaires */}
                        <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                          Salaires (MAD)
                        </p>
                        <BarChart
                          xAxis={[{ scaleType: "band", data: chartData.labels, tickLabelStyle: { fontSize: 10 } }]}
                          series={[
                            { data: chartData.salaireBase,          label: "Salaire base",          color: "#2c767c", valueFormatter: (v) => `${v.toLocaleString("fr-FR")} MAD` },
                            { data: chartData.salaireBrutImposable, label: "Salaire brut imposable", color: "#f59e0b", valueFormatter: (v) => `${v.toLocaleString("fr-FR")} MAD` },
                          ]}
                          height={300}
                          margin={{ top: 10, right: 20, bottom: 90, left: 80 }}
                          slotProps={{
                            legend: {
                              position: { vertical: "bottom", horizontal: "middle" },
                              itemMarkWidth: 12,
                              itemMarkHeight: 12,
                              markGap: 5,
                              itemGap: 20,
                            },
                          }}
                          sx={{ ".MuiChartsAxis-tickLabel": { fontSize: "0.72rem" } }}
                        />

                        {/* Jours travailles */}
                        <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "24px", marginBottom: "8px" }}>
                          Jours travaillés
                        </p>
                        <BarChart
                          xAxis={[{ scaleType: "band", data: chartData.labels, tickLabelStyle: { fontSize: 10 } }]}
                          series={[
                            { data: chartData.joursTravailles, label: "Jours travaillés", color: "#6366f1", valueFormatter: (v) => `${v} j` },
                          ]}
                          height={230}
                          margin={{ top: 20, right: 20, bottom: 70, left: 60 }}
                          sx={{ ".MuiChartsAxis-tickLabel": { fontSize: "0.72rem" }, ".MuiChartsLegend-root": { fontSize: "0.75rem" } }}
                        />

                        {/* Cards résumé */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "24px" }}>
                          {[
                            { label: "Salaire base moy.",     value: (declarations.reduce((s, d) => s + Number(d.salaire_base || 0), 0) / declarations.length).toFixed(2) + " MAD", color: "#2c767c" },
                            { label: "Brut imposable moy.",   value: (declarations.reduce((s, d) => s + Number(d.salaire_brut_imposable || 0), 0) / declarations.length).toFixed(2) + " MAD", color: "#f59e0b" },
                            { label: "Total jours travaillés", value: String(declarations.reduce((s, d) => s + Number(d.jours_travailles || 0), 0)) + " j", color: "#6366f1" },
                            { label: "Mois déclarés",          value: String(declarations.length), color: "#10b981" },
                          ].map((card) => (
                            <div key={card.label} style={{ background: "#f8fafc", border: `1px solid ${card.color}33`, borderRadius: "10px", padding: "14px 18px" }}>
                              <p style={{ margin: 0, fontSize: "0.72rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{card.label}</p>
                              <p style={{ margin: "6px 0 0", fontSize: "1.05rem", fontWeight: 700, color: card.color }}>{card.value}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default DeclarationsIndividuellesCNSS;
