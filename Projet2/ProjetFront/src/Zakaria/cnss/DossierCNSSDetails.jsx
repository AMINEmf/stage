import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Button, Table } from "react-bootstrap";
import Swal from "sweetalert2";
import { Box, Typography, Grid, Card, CardContent, IconButton, Chip } from "@mui/material";
import {
  X, Activity, ClipboardList, FileText, PlusCircle,
  Download, Trash2, Eye, ChevronDown, ChevronUp, DollarSign, Pencil
} from "lucide-react";
import AddCnssOperation from "./AddCnssOperation";
import ExpandRTable from "../Employe/ExpandRTable";
import "../Employe/AddEmp.css";

const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:8000"
  : "http://127.0.0.1:8000";

const themeColors = {
  teal: "#2c767c",
  tealLight: "#4db6ac",
  tealDark: "#004d40",
  success: "#4caf50",
  warning: "#ff9800",
  error: "#f44336",
  info: "#2196f3",
  textPrimary: "#1e293b",
  textSecondary: "#64748b",
  divider: "rgba(44, 118, 124, 0.2)",
};

const formatCurrency = (value) => {
  const parsedValue = Number(value ?? 0);
  return `${parsedValue.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`;
};

const StatCard = ({ title, value, icon: Icon, color, suffix = "" }) => (
  <Card sx={{
    background: `linear-gradient(135deg, ${color}08 0%, ${color}04 100%)`,
    borderRadius: "1rem",
    boxShadow: "0 0.125rem 0.625rem rgba(0,0,0,0.04)",
    border: `0.0625rem solid ${color}15`,
    height: "100%",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": {
      transform: "translateY(-0.25rem)",
      boxShadow: "0 0.5rem 1.5625rem rgba(0,0,0,0.08)",
      borderColor: `${color}40`,
    },
  }}>
    <CardContent sx={{ p: "1rem", "&:last-child": { pb: "1rem" } }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
        <Box>
          <Typography variant="caption" sx={{ color: themeColors.textSecondary, fontWeight: 700, textTransform: "uppercase", fontSize: "0.65rem", display: "block", mb: "0.25rem" }}>
            {title}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: color, fontSize: "1.05rem", lineHeight: 1.2 }}>
            {value} <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{suffix}</span>
          </Typography>
        </Box>
        <Box sx={{ backgroundColor: `${color}15`, borderRadius: "0.625rem", p: "0.5rem", display: "flex" }}>
          <Icon size={18} color={color} />
        </Box>
      </Box>
    </CardContent>
  </Card>
);

function DossierCNSSDetails({ dossier, onClose, onDocumentsUpdated }) {
  const employeId = dossier?.id;
  const [operations, setOperations] = useState([]);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [operationDocumentsMap, setOperationDocumentsMap] = useState({});
  const [expandedOperationIds, setExpandedOperationIds] = useState([]);
  const [operationDrawerMode, setOperationDrawerMode] = useState(null);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [operationsPage, setOperationsPage] = useState(0);
  const [operationsRowsPerPage, setOperationsRowsPerPage] = useState(5);
  const [selectedOpIds, setSelectedOpIds] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);

  // Convert array to object for ExpandRTable compatibility
  const expandedRowsMap = useMemo(() => {
    return expandedOperationIds.reduce((acc, id) => ({ ...acc, [id]: true }), {});
  }, [expandedOperationIds]);

  const fetchUserAccess = useCallback(async () => {
    try {
      const resp = await axios.get(`${API_BASE}/api/user`, { withCredentials: true });
      const rolesData = Array.isArray(resp.data) ? resp.data[0]?.roles : resp.data?.roles;
      setRoles(Array.isArray(rolesData) ? rolesData.map(r => r.name) : []);
      setPermissions(rolesData && rolesData[0]?.permissions ? rolesData[0].permissions.map(p => p.name) : []);
    } catch (e) { }
  }, []);

  const fetchOperations = useCallback(async () => {
    if (!employeId) return;
    setOperationsLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/cnss/dossiers/${employeId}/operations`);
      setOperations(response.data?.data ?? response.data ?? []);
    } catch (error) { setOperations([]); } finally { setOperationsLoading(false); }
  }, [employeId]);

  const fetchDocs = useCallback(async (opId, force = false) => {
    if (!opId || (!force && operationDocumentsMap[opId])) return;
    try {
      const res = await axios.get(`${API_BASE}/api/cnss/operations/${opId}`);
      const data = res.data?.data ?? res.data;

      // Attempt to extract documents from possible nested structures
      let docs = [];
      if (data?.documents) {
        docs = Array.isArray(data.documents) ? data.documents : (data.documents.data || []);
      }

      setOperationDocumentsMap(prev => ({ ...prev, [opId]: docs }));
    } catch (e) {
      console.error("Error fetching docs:", e);
    }
  }, [operationDocumentsMap]);

  const handleViewDocument = async (doc) => {
    try {
      const res = await axios.get(`${API_BASE}/api/cnss/documents/${doc.id}/download`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: res.headers["content-type"] || "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (e) { Swal.fire("Erreur", "Visualisation impossible", "error"); }
  };

  const handleDeleteDocument = async (doc, opId) => {
    const result = await Swal.fire({
      title: "Êtes-vous sûr?",
      text: "Le document sera définitivement supprimé !",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: themeColors.error,
      cancelButtonColor: themeColors.teal,
      confirmButtonText: "Oui, supprimer !",
      cancelButtonText: "Annuler",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE}/api/cnss/documents/${doc.id}`);
        await fetchDocs(opId, true);
        await fetchOperations(); // Refresh counts in parent table
        if (onDocumentsUpdated) onDocumentsUpdated();
        Swal.fire("Supprimé!", "Le document a été supprimé.", "success");
      } catch (error) {
        console.error("Error deleting document:", error);
        Swal.fire("Erreur!", "Impossible de supprimer le document.", "error");
      }
    }
  };

  const handleDeleteOperation = useCallback(async (opId) => {
    const result = await Swal.fire({
      title: "Êtes-vous sûr?",
      text: "Cette opération et tous ses documents seront définitivement supprimés !",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: themeColors.error,
      cancelButtonColor: themeColors.teal,
      confirmButtonText: "Oui, supprimer !",
      cancelButtonText: "Annuler",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE}/api/cnss/operations/${opId}`);
        await fetchOperations();
        if (onDocumentsUpdated) onDocumentsUpdated();
        Swal.fire("Supprimé!", "L'opération a été supprimée.", "success");
      } catch (error) {
        console.error("Error deleting operation:", error);
        Swal.fire("Erreur!", "Impossible de supprimer l'opération.", "error");
      }
    }
  }, [fetchOperations, onDocumentsUpdated]);

  useEffect(() => { fetchUserAccess(); fetchOperations(); }, [fetchUserAccess, fetchOperations]);

  const stats = useMemo(() => ({
    totalAmount: operations.reduce((sum, op) => sum + Number(op.montant ?? 0), 0),
    count: operations.length,
    status: dossier?.cnss_affiliation_status || "N/A"
  }), [operations, dossier]);

  const handleDownload = async (doc) => {
    try {
      const res = await axios.get(`${API_BASE}/api/cnss/documents/${doc.id}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", doc.original_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) { Swal.fire("Erreur", "Téléchargement impossible", "error"); }
  };

  const toggleRow = (opId) => {
    setExpandedOperationIds(prev => prev.includes(opId) ? prev.filter(id => id !== opId) : [...prev, opId]);
    fetchDocs(opId);
  };

  const handleOpCheckboxChange = useCallback((id) => {
    setSelectedOpIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, []);

  const handleSelectAllOps = useCallback((event) => {
    if (event.target.checked) {
      const currentIds = operations.slice(operationsPage * operationsRowsPerPage, (operationsPage + 1) * operationsRowsPerPage).map(op => op.id);
      setSelectedOpIds(currentIds);
    } else {
      setSelectedOpIds([]);
    }
  }, [operations, operationsPage, operationsRowsPerPage]);

  const handleBulkDeleteOps = useCallback(async () => {
    if (selectedOpIds.length === 0) return;

    const result = await Swal.fire({
      title: "Êtes-vous sûr?",
      text: `Vous allez supprimer ${selectedOpIds.length} opération(s) et tous leurs documents !`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: themeColors.error,
      cancelButtonColor: themeColors.teal,
      confirmButtonText: "Oui, supprimer !",
      cancelButtonText: "Annuler",
    });

    if (result.isConfirmed) {
      try {
        await Promise.all(selectedOpIds.map(id => axios.delete(`${API_BASE}/api/cnss/operations/${id}`)));
        setSelectedOpIds([]);
        await fetchOperations();
        if (onDocumentsUpdated) onDocumentsUpdated();
        Swal.fire("Supprimées!", "Les opérations ont été supprimées.", "success");
      } catch (error) {
        console.error("Error deleting operations:", error);
        Swal.fire("Erreur!", "Impossible de supprimer les opérations.", "error");
      }
    }
  }, [selectedOpIds, fetchOperations, onDocumentsUpdated]);

  const opCols = useMemo(() => [
    { key: "date_operation", label: "Date" },
    { key: "type_operation", label: "Type" },
    {
      key: "statut", label: "Statut", render: (item) => {
        const colors = { TERMINEE: themeColors.success, EN_COURS: themeColors.warning, ANNULEE: themeColors.error };
        const color = colors[item.statut] || themeColors.textSecondary;
        return <Chip label={item.statut} size="small" sx={{ backgroundColor: `${color}15`, color, fontWeight: 700, fontSize: "0.65rem", borderRadius: "6px" }} />;
      }
    },
    { key: "montant", label: "Montant", render: (item) => formatCurrency(item.montant) },
    {
      key: "documents_count", label: "Documents", render: (item) => {
        const count = Number(item.documents_count ?? 0);
        return (
          <Box onClick={(e) => { e.stopPropagation(); toggleRow(item.id); }} sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", color: themeColors.teal }}>
            <FileText size={14} />
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.75rem" }}>{count} Doc(s)</Typography>
            {expandedOperationIds.includes(item.id) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </Box>
        );
      }
    }
  ], [expandedOperationIds, toggleRow]);

  const renderExpanded = (op) => {
    const docs = operationDocumentsMap[op.id] || [];
    return (
      <Box sx={{ p: "0.75rem", backgroundColor: "#f8fafc", borderRadius: "0.5rem", m: "0.5rem", boxSizing: "border-box" }}>
        <Typography variant="subtitle2" sx={{ mb: "0.5rem", fontWeight: 800, fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", color: themeColors.textPrimary }}>
          <FileText size={14} /> DOCUMENTS DE L'OPÉRATION
        </Typography>
        <Box sx={{ overflowX: "auto", width: "100%", borderRadius: "0.5rem", border: "0.0625rem solid #e2e8f0" }}>
          <Table size="sm" style={{ backgroundColor: "white", margin: 0, minWidth: "300px" }}>
            <thead><tr style={{ backgroundColor: "#f1f5f9" }}>
              <th style={{ fontSize: "0.7rem", border: "none", padding: "0.5rem" }}>Fichier</th>
              <th style={{ fontSize: "0.7rem", border: "none", padding: "0.5rem" }}>Date</th>
              <th style={{ fontSize: "0.7rem", border: "none", padding: "0.5rem" }}>Actions</th>
            </tr></thead>
            <tbody>
              {docs.length > 0 ? docs.map(d => (
                <tr key={d.id}>
                  <td style={{ fontSize: "0.7rem", padding: "0.5rem" }}>{d.original_name}</td>
                  <td style={{ fontSize: "0.7rem", padding: "0.5rem" }}>{d.created_at}</td>
                  <td style={{ padding: "0.3rem" }}>
                    <Box sx={{ display: "flex", gap: "0.25rem" }}>
                      <IconButton size="small" sx={{ p: "0.2rem" }} onClick={() => handleViewDocument(d)} title="Voir"><Eye size={12} color={themeColors.info} /></IconButton>
                      <IconButton size="small" sx={{ p: "0.2rem" }} onClick={() => handleDownload(d)} title="Télécharger"><Download size={12} color={themeColors.teal} /></IconButton>
                      <IconButton size="small" sx={{ p: "0.2rem" }} onClick={() => handleDeleteDocument(d, op.id)} title="Supprimer"><Trash2 size={12} color={themeColors.error} /></IconButton>
                    </Box>
                  </td>
                </tr>
              )) : <tr><td colSpan={3} className="text-center py-2 text-muted" style={{ fontSize: "0.7rem" }}>Aucun document.</td></tr>}
            </tbody>
          </Table>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", backgroundColor: "white", overflow: "hidden", position: "relative", boxSizing: "border-box" }}>
      <Box sx={{ p: "1rem", borderBottom: `0.0625rem solid ${themeColors.divider}`, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", flexShrink: 0 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: themeColors.textPrimary, fontSize: "1.1rem" }}>Dossier CNSS : {dossier?.numero_adherent || dossier?.matricule}</Typography>
          <Typography variant="body2" sx={{ color: themeColors.textSecondary, fontSize: "0.8rem" }}>{dossier?.matricule} - {dossier?.employe_label}</Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ p: "0.25rem" }}><X size={20} /></IconButton>
      </Box>
      <Box sx={{ flex: 1, overflowY: "auto", p: "1rem", maxHeight: "calc(100vh - 120px)", boxSizing: "border-box" }}>
        <Grid container spacing={2} sx={{ mb: "1.5rem" }}>
          <Grid item xs={12} md={4}><StatCard title="Montant Total" value={stats.totalAmount.toLocaleString()} suffix="DH" icon={DollarSign} color={themeColors.teal} /></Grid>
          <Grid item xs={6} md={4}><StatCard title="Opérations" value={stats.count} icon={ClipboardList} color={themeColors.success} /></Grid>
          <Grid item xs={6} md={4}><StatCard title="Statut" value={stats.status} icon={Activity} color={themeColors.info} /></Grid>
        </Grid>
        <Box sx={{ mb: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeColors.textPrimary }}>OPÉRATIONS DU DOSSIER</Typography>
          <Button size="sm" style={{ backgroundColor: themeColors.teal, border: "none", borderRadius: "0.375rem", fontWeight: 600, fontSize: "0.75rem", padding: "0.4rem 0.8rem" }} onClick={() => setOperationDrawerMode("add")}>
            <PlusCircle size={14} style={{ marginRight: "0.375rem" }} /> Ajouter une opération
          </Button>
        </Box>
        <ExpandRTable
          columns={opCols}
          data={operations}
          loading={operationsLoading}
          rowsPerPage={operationsRowsPerPage}
          page={operationsPage}
          searchTerm=""
          highlightText={(t) => t}
          selectedItems={selectedOpIds}
          handleCheckboxChange={handleOpCheckboxChange}
          selectAll={selectedOpIds.length > 0 && selectedOpIds.length === operations.slice(operationsPage * operationsRowsPerPage, (operationsPage + 1) * operationsRowsPerPage).length}
          handleSelectAllChange={handleSelectAllOps}
          handleDeleteSelected={handleBulkDeleteOps}
          handleChangePage={(p) => { setOperationsPage(p); setSelectedOpIds([]); }}
          handleChangeRowsPerPage={(e) => {
            setOperationsRowsPerPage(parseInt(e.target.value, 10));
            setOperationsPage(0);
            setSelectedOpIds([]);
          }}
          expandedRows={expandedRowsMap}
          toggleRowExpansion={toggleRow}
          renderExpandedRow={renderExpanded}
          canBulkDelete={true}
          renderCustomActions={(item) => (
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <IconButton size="small" onClick={() => { setSelectedOperation(item); setOperationDrawerMode("view"); }}><Eye size={14} color={themeColors.info} /></IconButton>
              <IconButton size="small" onClick={() => { setSelectedOperation(item); setOperationDrawerMode("edit"); }} disabled={item.statut !== "EN_COURS"}><Pencil size={14} color={item.statut === "EN_COURS" ? themeColors.teal : "#ccc"} /></IconButton>
              <IconButton size="small" onClick={() => handleDeleteOperation(item.id)}><Trash2 size={14} color={themeColors.error} /></IconButton>
            </Box>
          )}
        />
      </Box>
      <Box sx={{ p: "0.75rem", borderTop: `0.0625rem solid ${themeColors.divider}`, display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
        <Button variant="outline-secondary" size="sm" onClick={onClose} style={{ borderRadius: "0.375rem", fontWeight: 600, padding: "0.4rem 1rem" }}>Fermer</Button>
      </Box>
      {operationDrawerMode && <AddCnssOperation employeId={employeId} operation={selectedOperation} mode={operationDrawerMode} onClose={() => setOperationDrawerMode(null)} onSaved={() => { setOperationDrawerMode(null); fetchOperations(); if (onDocumentsUpdated) onDocumentsUpdated(); }} />}
    </Box>
  );
}

export default DossierCNSSDetails;