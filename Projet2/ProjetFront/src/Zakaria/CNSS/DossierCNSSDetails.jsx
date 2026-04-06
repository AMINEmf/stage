import React, { useCallback, useEffect, useMemo, useRef, useState, forwardRef } from "react";
import axios from "axios";
import { Button, Dropdown, Form, Table } from "react-bootstrap";
import Swal from "sweetalert2";
import { Box, Typography, IconButton, Chip } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt, faCalendarTimes, faChartSimple, faClose, faDownload, faEye, faFilter, faSearch, faSliders, faTrash } from "@fortawesome/free-solid-svg-icons";
import SectionTitle from "./SectionTitle";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { FileText, PlusCircle, Download, Trash2, Eye, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import AddCnssOperation from "./AddCnssOperation";
import ExpandRTable from "../Shared/ExpandRTable";
import "../Employe/AddEmp.css";

const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:8000"
  : "http://127.0.0.1:8000";
const OPERATION_TYPES_ENDPOINT = `${API_BASE}/api/cnss/operation-types`;
const OPERATION_TYPES_ENDPOINT_STATUS_KEY = "cnss_operation_types_endpoint_status";
const CNSS_OPERATIONS_CACHE_PREFIX = "cnss_dossier_operations_";
const CNSS_OPERATIONS_CACHE_TTL_MS = 20 * 1000;
const operationsCacheMemory = new Map();

const getOperationsCacheKey = (employeId) => `${CNSS_OPERATIONS_CACHE_PREFIX}${String(employeId)}`;

const readCachedOperations = (employeId) => {
  if (!employeId) return null;

  const cacheKey = getOperationsCacheKey(employeId);
  const inMemoryEntry = operationsCacheMemory.get(cacheKey);
  if (inMemoryEntry && Array.isArray(inMemoryEntry.data)) {
    return inMemoryEntry;
  }

  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const data = Array.isArray(parsed) ? parsed : parsed?.data;

    if (!Array.isArray(data)) return null;

    const entry = {
      data,
      updatedAt: Number(parsed?.updatedAt ?? 0) || 0,
    };

    operationsCacheMemory.set(cacheKey, entry);
    return entry;
  } catch {
    return null;
  }
};

const writeCachedOperations = (employeId, data) => {
  if (!employeId) return;

  const entry = {
    data: Array.isArray(data) ? data : [],
    updatedAt: Date.now(),
  };

  const cacheKey = getOperationsCacheKey(employeId);
  operationsCacheMemory.set(cacheKey, entry);

  try {
    localStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch {
    // ignore storage quota / private mode errors
  }
};

const themeColors = {
  teal: "#2c767c",
  success: "#4caf50",
  warning: "#ff9800",
  error: "#f44336",
  info: "#2196f3",
  textSecondary: "#64748b",
  textPrimary: "#1e293b",
};

const formatCurrency = (value) => {
  const parsedValue = Number(value ?? 0);
  return `${parsedValue.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`;
};

const normalizeStatus = (value) => String(value || "").trim().replace(/\s+/g, "_").toUpperCase();

function DossierCNSSDetails({ dossier, onClose, onDocumentsUpdated, globalSearch = "" }) {
  const employeId = dossier?.id ?? null;
  const hasSelectedEmployee = Boolean(employeId);
  const latestOperationsFetchRef = useRef(0);

  const [operations, setOperations] = useState([]);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [operationDocumentsMap, setOperationDocumentsMap] = useState({});
  const [expandedOperationIds, setExpandedOperationIds] = useState([]);
  const [operationDrawerMode, setOperationDrawerMode] = useState(null);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [operationsPage, setOperationsPage] = useState(0);
  const [operationsRowsPerPage, setOperationsRowsPerPage] = useState(7);
  const [selectedOpIds, setSelectedOpIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [statsDrawerOpen, setStatsDrawerOpen] = useState(false);

  const [filterOptions, setFilterOptions] = useState({
    filters: [
      { key: "statut", label: "Statut", value: "" },
      { key: "date", label: "Date", value: "" },
      { key: "type", label: "Type", value: "" },
    ],
  });

  const [allOperationTypes, setAllOperationTypes] = useState([]);
  const [operationTypesEndpointAvailable, setOperationTypesEndpointAvailable] = useState(() => {
    try {
      const cached = localStorage.getItem(OPERATION_TYPES_ENDPOINT_STATUS_KEY);
      if (cached === "missing") return false;
      if (cached === "available") return true;
    } catch (error) {
      // ignore
    }
    return null;
  });

  const persistOperationTypesEndpointStatus = useCallback((status) => {
    try {
      localStorage.setItem(OPERATION_TYPES_ENDPOINT_STATUS_KEY, status ? "available" : "missing");
    } catch (error) {
      // ignore
    }
  }, []);

  useEffect(() => {
    const fetchAllTypes = async () => {
      if (operationTypesEndpointAvailable === false) return;
      try {
        const response = await axios.get(OPERATION_TYPES_ENDPOINT);
        const payload = response?.data?.data ?? response?.data ?? [];
        const names = (Array.isArray(payload) ? payload : [])
          .map((item) => {
            if (typeof item === "string") return item.trim().toUpperCase();
            return String(item?.label || item?.value || item?.name || "").trim().toUpperCase();
          })
          .filter(Boolean);
        setAllOperationTypes(names);
        setOperationTypesEndpointAvailable(true);
        persistOperationTypesEndpointStatus(true);
      } catch (error) {
        if (error?.response?.status === 404) {
          setOperationTypesEndpointAvailable(false);
          persistOperationTypesEndpointStatus(false);
        }
        // fallback: types will come from loaded operations
      }
    };
    fetchAllTypes();
  }, [operationTypesEndpointAvailable, persistOperationTypesEndpointStatus]);

  const getDeleteErrorMessage = useCallback((error) => {
    const status = error?.response?.status;
    const backendMessage = error?.response?.data?.message;

    if (status === 403) {
      return backendMessage || "Accès refusé : vous n'avez pas l'autorisation de supprimer cette opération.";
    }

    if (status === 401) {
      return "Session expirée, reconnectez-vous.";
    }

    if (backendMessage) return backendMessage;

    return "Impossible de supprimer l'opération.";
  }, []);

  const baseColumns = useMemo(() => ([
    {
      key: "date",
      label: "Date op.",
      align: "center",
      render: (item) => (
        <span style={{ whiteSpace: "nowrap" }}>
          {String(item.date || "").slice(0, 10) || "-"}
        </span>
      ),
    },
    { key: "type", label: "Type" },
    {
      key: "statut",
      label: "Statut",
      render: (item) => {
        const colors = { TERMINEE: themeColors.success, EN_COURS: themeColors.warning, ANNULEE: themeColors.error };
        const color = colors[item.statut] || themeColors.textSecondary;
        return (
          <Chip
            label={item.statut || "-"}
            size="small"
            sx={{ backgroundColor: `${color}15`, color, fontWeight: 700, fontSize: "0.65rem", borderRadius: "6px" }}
          />
        );
      },
    },
    {
      key: "beneficiaire",
      label: "Bénéficiaire",
      render: (item) => {
        const beneficiaryType = item.beneficiary_type || item.type_beneficiaire || "";
        const beneficiaryName = item.beneficiary_name || item.nom_beneficiaire || "";
        const value = `${beneficiaryType}${beneficiaryType && beneficiaryName ? " - " : ""}${beneficiaryName}`.trim();
        return value || "-";
      },
    },
    {
      key: "total",
      label: "Total",
      render: (item) => (
        <span style={{ whiteSpace: "nowrap" }}>
          {formatCurrency(item.montant_total ?? item.montant).replace(/\sDH$/, "\u00A0DH")}
        </span>
      ),
    },
    {
      key: "rembourse",
      label: "Remboursé",
      render: (item) => (
        <span style={{ whiteSpace: "nowrap" }}>
          {formatCurrency(item.montant_rembourse ?? item.montant_remboursement).replace(/\sDH$/, "\u00A0DH")}
        </span>
      ),
    },
    {
      key: "reste",
      label: "Reste",
      render: (item) => {
        const total = Number(item.montant_total ?? item.montant ?? 0);
        const rembourse = Number(item.montant_rembourse ?? item.montant_remboursement ?? 0);
        const reste = item.montant_reste_a_charge ?? item.reste_a_charge ?? item.reste ?? Math.max(total - rembourse, 0);
        return (
          <span style={{ whiteSpace: "nowrap" }}>
            {formatCurrency(reste).replace(/\sDH$/, "\u00A0DH")}
          </span>
        );
      },
    },
    {
      key: "commentaires",
      label: "Commentaire",
      render: (item) => item.notes || "-",
    },
    {
      key: "documents",
      label: "Documents",
      render: (item) => {
        const count = Number(item.documents_count ?? 0);
        return (
          <Box
            onClick={(event) => {
              event.stopPropagation();
              toggleRow(item.id);
            }}
            sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", color: themeColors.teal }}
          >
            <FileText size={14} />
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
              {count} Doc(s)
            </Typography>
            {expandedOperationIds.includes(item.id) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </Box>
        );
      },
    },
  ]), [expandedOperationIds]);

  const [columnVisibility, setColumnVisibility] = useState(() =>
    baseColumns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {})
  );

  // NOTE: pas de useEffect sur baseColumns pour setColumnVisibility
  // car baseColumns change à chaque expand/collapse (dépend de expandedOperationIds)
  // ce qui causerait une cascade de re-renders infinie

  const visibleColumns = useMemo(
    () => baseColumns.filter((col) => columnVisibility[col.key] !== false),
    [baseColumns, columnVisibility]
  );

  const toggleColumnVisibility = (key) => {
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const CustomMenu = forwardRef(({ style, className, "aria-labelledby": labeledBy }, ref) => (
    <div ref={ref} style={{ ...style, minWidth: 230, padding: "10px" }} className={className} aria-labelledby={labeledBy}>
      <div style={{ fontWeight: 600, marginBottom: 10, color: "#2c3e50", fontSize: "0.9rem" }}>Colonnes visibles</div>
      {baseColumns.map((col) => (
        <Form.Check
          key={col.key}
          type="checkbox"
          id={`col-${col.key}`}
          label={col.label}
          checked={columnVisibility[col.key] !== false}
          onChange={() => toggleColumnVisibility(col.key)}
          style={{ marginBottom: 6, fontSize: "0.85rem" }}
        />
      ))}
    </div>
  ));
  CustomMenu.displayName = "CustomMenu";

  const iconButtonStyle = {
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
    borderRadius: "8px",
    width: 38,
    height: 34,
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };

  const fetchOperations = useCallback(async ({ forceRefresh = false } = {}) => {
    if (!employeId) {
      setOperations([]);
      setOperationsLoading(false);
      return;
    }

    const cachedEntry = readCachedOperations(employeId);
    const hasWarmCache = Array.isArray(cachedEntry?.data);

    if (hasWarmCache) {
      setOperations(cachedEntry.data);
      setOperationsLoading(false);
    } else {
      setOperationsLoading(true);
    }

    const isCacheFresh = hasWarmCache
      && cachedEntry.updatedAt > 0
      && (Date.now() - cachedEntry.updatedAt) < CNSS_OPERATIONS_CACHE_TTL_MS;

    if (!forceRefresh && isCacheFresh) {
      return;
    }

    const fetchId = latestOperationsFetchRef.current + 1;
    latestOperationsFetchRef.current = fetchId;

    try {
      const response = await axios.get(`${API_BASE}/api/cnss/dossiers/${employeId}/operations`);
      if (latestOperationsFetchRef.current !== fetchId) return;

      const list = response.data?.data ?? response.data ?? [];
      const normalizedList = Array.isArray(list) ? list : [];

      setOperations(normalizedList);
      writeCachedOperations(employeId, normalizedList);
    } catch (error) {
      if (latestOperationsFetchRef.current !== fetchId) return;
      if (!hasWarmCache) {
        setOperations([]);
      }
    } finally {
      if (latestOperationsFetchRef.current === fetchId && !hasWarmCache) {
        setOperationsLoading(false);
      }
    }
  }, [employeId]);

  useEffect(() => {
    fetchOperations();
    setExpandedOperationIds([]);
    setOperationDocumentsMap({});
    setSelectedOpIds([]);
    setSelectAll(false);
    setOperationDrawerMode(null);
    setSelectedOperation(null);
    setOperationsPage(0);
    setStatsDrawerOpen(false);
  }, [fetchOperations]);

  const fetchDocs = useCallback(async (opId, force = false) => {
    if (!opId || (!force && operationDocumentsMap[opId])) return;
    try {
      const res = await axios.get(`${API_BASE}/api/cnss/operations/${opId}`);
      const data = res.data?.data ?? res.data;
      const docs = data?.documents ? (Array.isArray(data.documents) ? data.documents : data.documents.data || []) : [];
      setOperationDocumentsMap((prev) => ({ ...prev, [opId]: docs }));
    } catch (error) {
      setOperationDocumentsMap((prev) => ({ ...prev, [opId]: [] }));
    }
  }, [operationDocumentsMap]);

  const handleViewDocument = async (doc) => {
    try {
      const res = await axios.get(`${API_BASE}/api/cnss/documents/${doc.id}/download`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: res.headers["content-type"] || "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      Swal.fire("Erreur", "Visualisation impossible", "error");
    }
  };

  const handleDownload = async (doc) => {
    try {
      const res = await axios.get(`${API_BASE}/api/cnss/documents/${doc.id}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", doc.original_name || "document");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      Swal.fire("Erreur", "Téléchargement impossible", "error");
    }
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

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_BASE}/api/cnss/documents/${doc.id}`);
      await fetchDocs(opId, true);
      await fetchOperations({ forceRefresh: true });
      if (onDocumentsUpdated) onDocumentsUpdated();
      Swal.fire("Supprimé!", "Le document a été supprimé.", "success");
    } catch (error) {
      Swal.fire("Erreur!", "Impossible de supprimer le document.", "error");
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

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_BASE}/api/cnss/operations/${opId}`);
      await fetchOperations({ forceRefresh: true });
      if (onDocumentsUpdated) onDocumentsUpdated();
      Swal.fire("Supprimé!", "L'opération a été supprimée.", "success");
    } catch (error) {
      Swal.fire("Erreur!", getDeleteErrorMessage(error), "error");
    }
  }, [fetchOperations, onDocumentsUpdated, getDeleteErrorMessage]);

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

    if (!result.isConfirmed) return;

    try {
      await Promise.all(selectedOpIds.map((id) => axios.delete(`${API_BASE}/api/cnss/operations/${id}`)));
      setSelectedOpIds([]);
      setSelectAll(false);
      await fetchOperations({ forceRefresh: true });
      if (onDocumentsUpdated) onDocumentsUpdated();
      Swal.fire("Supprimées!", "Les opérations ont été supprimées.", "success");
    } catch (error) {
      Swal.fire("Erreur!", getDeleteErrorMessage(error), "error");
    }
  }, [selectedOpIds, fetchOperations, onDocumentsUpdated, getDeleteErrorMessage]);

  const toggleRow = (opId) => {
    setExpandedOperationIds((prev) => (prev.includes(opId) ? prev.filter((id) => id !== opId) : [...prev, opId]));
    fetchDocs(opId);
  };

  const setFilterValue = useCallback((key, value) => {
    setFilterOptions((prev) => ({
      filters: prev.filters.map((filter) => (filter.key === key ? { ...filter, value } : filter)),
    }));
  }, []);

  const getFilterValue = useCallback((key) => {
    return filterOptions.filters.find((filter) => filter.key === key)?.value || "";
  }, [filterOptions]);

  const statutFilterOptions = useMemo(() => {
    const values = Array.from(new Set((operations || []).map((op) => op.statut).filter(Boolean)));
    return values;
  }, [operations]);

  const typeFilterOptions = useMemo(() => {
    // 1. Valeurs par défaut "standard"
    const defaultTypes = ["REMBOURSEMENT", "PAIEMENT", "REGULARISATION", "DEPOT_DOSSIER", "DECLARATION", "ATTESTATION", "AUTRE"];

    // 2. Valeurs récupérées de l'API globale (toutes les opérations existantes au niveau global)
    const fromGlobal = (allOperationTypes || []).map(t => String(t || "").trim().toUpperCase());

    // 3. Valeurs présentes dans les opérations actuelles (au cas où il y en aurait des exotiques)
    const fromOps = (operations || []).map((op) => String(op.type_operation || "").trim().toUpperCase()).filter(Boolean);

    // Fusion unique et tri alphabétique
    const merged = Array.from(new Set([...defaultTypes, ...fromGlobal, ...fromOps]))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "fr"));

    return merged;
  }, [operations, allOperationTypes]);

  const filteredOperations = useMemo(() => {
    let mapped = operations.map((op) => ({
      ...op,
      date: op.date_operation,
      type: op.type_operation,
      documents: op.documents_count,
    }));

    const statutValue = getFilterValue("statut");
    const dateValue = getFilterValue("date");
    const typeValue = getFilterValue("type");

    if (statutValue) {
      mapped = mapped.filter((row) => String(row.statut || "") === statutValue);
    }

    if (dateValue) {
      mapped = mapped.filter((row) => {
        const rowDate = String(row.date || "").slice(0, 10);
        return rowDate === dateValue;
      });
    }

    if (typeValue) {
      mapped = mapped.filter((row) => String(row.type || "") === typeValue);
    }

    const globalTerm = String(globalSearch || "").trim().toLowerCase();
    if (globalTerm) {
      mapped = mapped.filter((row) => {
        const haystack = [
          row.reference,
          row.type,
          row.statut,
          row.notes,
          row.date,
          row.beneficiary_type,
          row.beneficiary_name,
        ]
          .map((value) => String(value || "").toLowerCase())
          .join(" ");
        return haystack.includes(globalTerm);
      });
    }

    return mapped;
  }, [operations, getFilterValue, globalSearch]);

  const statisticsData = useMemo(() => {
    const toNumber = (value) => {
      const parsedValue = Number(value ?? 0);
      return Number.isFinite(parsedValue) ? parsedValue : 0;
    };

    const source = Array.isArray(operations) ? operations : [];

    const totals = source.reduce(
      (acc, op) => {
        const montantTotal = toNumber(op.montant_total ?? op.montant);
        const montantRembourse = toNumber(op.montant_rembourse ?? op.montant_remboursement);
        const resteValue = op.reste_a_charge ?? op.reste;
        const reste = toNumber(resteValue ?? Math.max(montantTotal - montantRembourse, 0));

        return {
          total: acc.total + montantTotal,
          rembourse: acc.rembourse + montantRembourse,
          reste: acc.reste + reste,
        };
      },
      { total: 0, rembourse: 0, reste: 0 }
    );

    const totalsBar = [
      { label: "Frais", valeur: totals.total },
      { label: "Remboursé", valeur: totals.rembourse },
      { label: "Reste", valeur: totals.reste },
    ];

    const statusCounts = source.reduce((acc, op) => {
      const key = op.statut || "Non défini";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const statusPie = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    const typeCounts = source.reduce((acc, op) => {
      const key = op.type_operation || op.type || "Non défini";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const typeBar = Object.entries(typeCounts).map(([type, count]) => ({ type, count }));

    return {
      totalOperations: source.length,
      totalsBar,
      statusPie,
      typeBar,
    };
  }, [operations]);

  const pieColors = [themeColors.teal, themeColors.info, themeColors.warning, themeColors.success, themeColors.error, themeColors.textSecondary];

  const expandedRowsMap = useMemo(
    () => expandedOperationIds.reduce((acc, id) => ({ ...acc, [id]: true }), {}),
    [expandedOperationIds]
  );

  const handleOpCheckboxChange = useCallback((id) => {
    const newSelectedItems = selectedOpIds.includes(id)
      ? selectedOpIds.filter((itemId) => itemId !== id)
      : [...selectedOpIds, id];

    setSelectedOpIds(newSelectedItems);
    const currentIds = filteredOperations
      .slice(operationsPage * operationsRowsPerPage, (operationsPage + 1) * operationsRowsPerPage)
      .map((op) => op.id);
    setSelectAll(newSelectedItems.length > 0 && newSelectedItems.length === currentIds.length);
  }, [selectedOpIds, filteredOperations, operationsPage, operationsRowsPerPage]);

  const handleSelectAllOps = useCallback((event) => {
    if (event.target.checked) {
      const currentIds = filteredOperations
        .slice(operationsPage * operationsRowsPerPage, (operationsPage + 1) * operationsRowsPerPage)
        .map((op) => op.id);
      setSelectedOpIds(currentIds);
      setSelectAll(true);
      return;
    }

    setSelectedOpIds([]);
    setSelectAll(false);
  }, [filteredOperations, operationsPage, operationsRowsPerPage]);

  const renderExpanded = (op) => {
    const docs = operationDocumentsMap[op.id] || [];

    return (
      <Box sx={{ p: "0.75rem", backgroundColor: "#f8fafc", borderRadius: "0.5rem", m: "0.5rem", boxSizing: "border-box" }}>
        <Typography variant="subtitle2" sx={{ mb: "0.5rem", fontWeight: 800, fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", color: themeColors.textPrimary }}>
          <FileText size={14} /> DOCUMENTS DE L'OPÉRATION
        </Typography>
        <Box sx={{ overflowX: "auto", width: "100%", borderRadius: "0.5rem", border: "0.0625rem solid #e2e8f0" }}>
          <Table size="sm" style={{ backgroundColor: "white", margin: 0, minWidth: "300px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f1f5f9" }}>
                <th style={{ fontSize: "0.7rem", border: "none", padding: "0.5rem" }}>Fichier</th>
                <th style={{ fontSize: "0.7rem", border: "none", padding: "0.5rem" }}>Date</th>
                <th style={{ fontSize: "0.7rem", border: "none", padding: "0.5rem" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.length > 0 ? docs.map((doc) => (
                <tr key={doc.id}>
                  <td style={{ fontSize: "0.7rem", padding: "0.5rem" }}>{doc.original_name}</td>
                  <td style={{ fontSize: "0.7rem", padding: "0.5rem" }}>{doc.created_at}</td>
                  <td style={{ padding: "0.3rem" }}>
                    <Box sx={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                      <button
                        onClick={() => handleViewDocument(doc)}
                        aria-label="Voir"
                        title="Voir"
                        style={{ border: "none", backgroundColor: "transparent", cursor: "pointer" }}
                      >
                        <FontAwesomeIcon icon={faEye} style={{ color: "#007bff", fontSize: "14px" }} />
                      </button>
                      <button
                        onClick={() => handleDownload(doc)}
                        aria-label="Télécharger"
                        title="Télécharger"
                        style={{ border: "none", backgroundColor: "transparent", cursor: "pointer" }}
                      >
                        <FontAwesomeIcon icon={faDownload} style={{ color: "#17a2b8", fontSize: "14px" }} />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc, op.id)}
                        aria-label="Supprimer"
                        title="Supprimer"
                        style={{ border: "none", backgroundColor: "transparent", cursor: "pointer" }}
                      >
                        <FontAwesomeIcon icon={faTrash} style={{ color: "#ff0000", fontSize: "14px" }} />
                      </button>
                    </Box>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="text-center py-2 text-muted" style={{ fontSize: "0.7rem" }}>
                    Aucun document.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Box>
      </Box>
    );
  };

  return (
    <>
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

        .graph-action-btn {
          width: 38px;
          height: 34px;
          border: none;
          border-radius: 8px;
          background: #2c767c;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(44, 118, 124, 0.24);
          transition: all 0.2s ease;
          padding: 0;
        }

        .graph-action-btn:hover {
          background: #34848b;
          box-shadow: 0 4px 10px rgba(44, 118, 124, 0.3);
        }

        .graph-action-btn.active {
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.45), 0 4px 10px rgba(44, 118, 124, 0.32);
        }

        .graph-icon-svg {
          width: 16px;
          height: 16px;
          display: block;
        }

        .stats-drawer-shell {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #ffffff;
        }

        .stats-drawer-header {
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid #e5e7eb;
          padding: 12px 16px;
          min-height: 48px;
          position: relative;
        }

        .stats-drawer-title {
          font-weight: 600;
          font-size: 0.95rem;
          color: #1e293b;
          text-align: center;
        }

        .stats-drawer-close {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          font-size: 1.15rem;
          line-height: 1;
          transition: color 0.15s ease;
        }

        .stats-drawer-close:hover {
          color: #475569;
        }

        .stats-drawer-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .stats-section {
          margin-bottom: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: #ffffff;
          padding: 14px 14px 10px;
        }

        .stats-section:last-child {
          margin-bottom: 8px;
        }

        .stats-section-title {
          font-size: 0.85rem;
          color: #374151;
          font-weight: 600;
          margin-bottom: 10px;
          padding: 0;
        }

        .stats-chart-box {
          background: #ffffff;
        }
      `}</style>

      <div
        className="with-split-view"
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          gap: operationDrawerMode || statsDrawerOpen ? "10px" : "0",
          padding: 0,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            flexGrow: operationDrawerMode || statsDrawerOpen ? 0 : 1,
            flexShrink: operationDrawerMode || statsDrawerOpen ? 0 : 1,
            flexBasis: operationDrawerMode || statsDrawerOpen ? "54%" : "100%",
            overflowY: "auto",
            overflowX: "auto",
            border: "1px solid rgba(8, 179, 173, 0.1)",
            borderRadius: "12px",
            boxShadow: "0 6px 20px rgba(8, 179, 173, 0.08), 0 2px 6px rgba(8, 179, 173, 0.04)",
            transition: "flex-basis 0.35s cubic-bezier(0.4, 0, 0.2, 1), flex-grow 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            padding: "20px",
            backgroundColor: "white",
            boxSizing: "border-box",
          }}
        >
          <div>
            <div className="section-header mb-3">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "24px",
                  width: "100%",
                }}
              >
                <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                  <SectionTitle icon="fas fa-id-card" text="Opérations CNSS" />
                  <p className="section-description text-muted mb-0">
                    {hasSelectedEmployee ? `- ${dossier?.employe_label || "Employé sélectionné"}` : "- Groupe sélectionné"}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    marginLeft: "auto",
                    justifyContent: "flex-end",
                    flexShrink: 0,
                  }}
                >
                  <Button
                    onClick={() => {
                      setStatsDrawerOpen(false);
                      setSelectedOperation(null);
                      setOperationDrawerMode("add");
                    }}
                    className="d-flex align-items-center justify-content-center"
                    size="sm"
                    disabled={!hasSelectedEmployee}
                    title={!hasSelectedEmployee ? "Sélectionnez un employé pour ajouter une opération." : ""}
                    style={{
                      minWidth: "182px",
                      height: "38px",
                      backgroundColor: hasSelectedEmployee ? "#3a8a90" : "#9ebec1",
                      border: "none",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      boxShadow: hasSelectedEmployee ? "0 3px 8px rgba(58, 138, 144, 0.28)" : "none",
                      cursor: hasSelectedEmployee ? "pointer" : "not-allowed",
                      opacity: 1,
                    }}
                  >
                    <PlusCircle size={15} style={{ marginRight: "0.4rem" }} />
                    Ajouter une opération
                  </Button>

                  {true && (
                    <FontAwesomeIcon
                      onClick={() => setFiltersVisible((prev) => !prev)}
                      icon={filtersVisible ? faClose : faFilter}
                      color={filtersVisible ? "green" : ""}
                      style={{
                        cursor: "pointer",
                        fontSize: "1.9rem",
                        color: "#2c767c",
                        marginTop: "1.3%",
                        marginRight: "8px",
                      }}
                    />
                  )}

                  {true && (
                    <button
                      type="button"
                      onClick={() => {
                        setStatsDrawerOpen((prev) => !prev);
                        setFiltersVisible(false);
                      }}
                      className={`graph-action-btn ${statsDrawerOpen ? "active" : ""}`}
                      title="Statistiques des opérations CNSS"
                    >
                      <svg className="graph-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <rect x="4" y="12" width="3" height="8" rx="1" fill="#FFFFFF" />
                        <rect x="10.5" y="8" width="3" height="12" rx="1" fill="#FFFFFF" />
                        <rect x="17" y="10" width="3" height="10" rx="1" fill="#FFFFFF" />
                      </svg>
                    </button>
                  )}

                  {true && (
                    <Dropdown show={showDropdown} onToggle={(isOpen) => setShowDropdown(isOpen)}>
                      <Dropdown.Toggle
                        as="button"
                        id="dropdown-visibility-dossiers"
                        title="Visibilité Colonnes"
                        style={iconButtonStyle}
                      >
                        <FontAwesomeIcon icon={faSliders} style={{ width: 18, height: 18, color: "#4b5563" }} />
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
                  flexWrap: "nowrap",
                  overflowX: "auto",
                  padding: "15px 25px",
                  width: "100%",
                  backgroundColor: "rgba(8, 179, 173, 0.05)",
                  borderRadius: "12px",
                  marginBottom: "20px",
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
                    position: "relative",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a90a4" strokeWidth="2" className="filters-icon">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                  </svg>
                  <span className="filters-title">Filtres</span>
                </div>
                <div className="filter-group" style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  flexWrap: "nowrap",
                  flexShrink: 0
                }}>
                  <label className="filter-label" style={{ marginRight: "8px" }}>Statut</label>
                  <div className="filter-input-wrapper">
                    <Form.Select
                      value={getFilterValue("statut")}
                      onChange={(event) => setFilterValue("statut", event.target.value)}
                      className="filter-input"
                    >
                      <option value="">Tous</option>
                      {statutFilterOptions.map((statut) => (
                        <option key={statut} value={statut}>{statut}</option>
                      ))}
                    </Form.Select>
                  </div>

                  <label className="filter-label" style={{ marginRight: "8px", marginLeft: "16px" }}>Date</label>
                  <div className="filter-input-wrapper">
                    <input
                      type="date"
                      value={getFilterValue("date")}
                      onChange={(event) => setFilterValue("date", event.target.value)}
                      className="filter-input"
                    />
                  </div>

                  <label className="filter-label" style={{ marginRight: "8px", marginLeft: "16px" }}>Type</label>
                  <div className="filter-input-wrapper">
                    <Form.Select
                      value={getFilterValue("type")}
                      onChange={(event) => setFilterValue("type", event.target.value)}
                      className="filter-input"
                    >
                      <option value="">Tous</option>
                      {typeFilterOptions.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </Form.Select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ExpandRTable
            columns={visibleColumns}
            data={hasSelectedEmployee ? filteredOperations : []}
            filteredData={hasSelectedEmployee ? filteredOperations : []}
            loading={hasSelectedEmployee && operationsLoading && operations.length === 0}
            searchTerm={globalSearch || ""}
            highlightText={(text) => text}
            selectAll={selectAll}
            selectedItems={selectedOpIds}
            handleSelectAllChange={handleSelectAllOps}
            handleCheckboxChange={handleOpCheckboxChange}
            handleEdit={(item) => {
              setStatsDrawerOpen(false);
              setSelectedOperation(item);
              setOperationDrawerMode("edit");
            }}
            handleDelete={handleDeleteOperation}
            handleDeleteSelected={handleBulkDeleteOps}
            rowsPerPage={operationsRowsPerPage}
            page={operationsPage}
            handleChangePage={(page) => {
              setOperationsPage(page);
              setSelectedOpIds([]);
              setSelectAll(false);
            }}
            handleChangeRowsPerPage={(event) => {
              setOperationsRowsPerPage(parseInt(event.target.value, 10));
              setOperationsPage(0);
              setSelectedOpIds([]);
              setSelectAll(false);
            }}
            expandedRows={expandedRowsMap}
            toggleRowExpansion={toggleRow}
            renderExpandedRow={renderExpanded}
            renderCustomActions={(item) => (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setStatsDrawerOpen(false);
                  setSelectedOperation(item);
                  setOperationDrawerMode("view");
                }}
                aria-label="Voir"
                title="Voir"
                style={{
                  border: "none",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                }}
              >
                <FontAwesomeIcon icon={faEye} style={{ color: "#007bff", fontSize: "14px" }} />
              </button>
            )}
          />
        </div>

        {operationDrawerMode && hasSelectedEmployee && (
          <div
            style={{
              flex: "0 0 44%",
              overflowY: "auto",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
              position: "relative",
              height: "100%",
              boxSizing: "border-box",
            }}
          >
            <AddCnssOperation
              inline
              employeId={employeId}
              operation={selectedOperation}
              mode={operationDrawerMode}
              onClose={() => {
                setOperationDrawerMode(null);
                setSelectedOperation(null);
              }}
              onSaved={async () => {
                setOperationDrawerMode(null);
                setSelectedOperation(null);
                await fetchOperations({ forceRefresh: true });
                if (onDocumentsUpdated) onDocumentsUpdated();
              }}
            />
          </div>
        )}


        {statsDrawerOpen && !operationDrawerMode && hasSelectedEmployee && (
          <div
            style={{
              flex: "0 0 44%",
              overflow: "hidden",
              backgroundColor: "#ffffff",
              borderLeft: "1px solid #e2e8f0",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              boxShadow: "-4px 0 15px rgba(0,0,0,0.03)",
              animation: "slideInRight 0.3s ease-out"
            }}
          >
            {/* Header style matched to image */}
            <div style={{
              padding: "12px 20px",
              borderBottom: "1px solid #eef2f5",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#f8fafc",
              position: "relative"
            }}>
              <h6 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#1e293b", letterSpacing: "0.3px" }}>
                Statistiques des Opérations
              </h6>
              <button
                onClick={() => setStatsDrawerOpen(false)}
                style={{
                  position: "absolute",
                  right: "15px",
                  border: "none",
                  background: "transparent",
                  color: "#94a3b8",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                ×
              </button>
            </div>

            <div className="stats-drawer-content" style={{
              padding: "20px",
              overflowY: "auto",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              backgroundColor: "#ffffff"
            }}>
              {statisticsData.totalOperations === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-chart-bar fa-3x mb-3" style={{ color: "#cbd5e1" }}></i>
                  <p className="text-muted">Aucune donnée disponible pour afficher les graphiques.</p>
                </div>
              ) : (
                <>
                  {/* Card 1: Totals */}
                  <div style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "4px",
                    padding: "15px",
                    backgroundColor: "#fff"
                  }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, marginBottom: "15px", color: "#1e293b" }}>
                      Totaux (Frais, Remboursé, Reste)
                    </div>
                    <Box sx={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statisticsData.totalsBar} margin={{ bottom: 10 }}>
                          <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                          <YAxis tick={{ fontSize: 9, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                          <Tooltip
                            cursor={{ fill: "rgba(0,0,0,0.02)" }}
                            contentStyle={{ fontSize: "11px", borderRadius: "4px", border: "1px solid #e2e8f0" }}
                            formatter={(value) => formatCurrency(value)}
                          />
                          <Legend
                            verticalAlign="bottom"
                            align="center"
                            iconType="square"
                            wrapperStyle={{ fontSize: "10px", color: "#64748b", paddingTop: "10px" }}
                          />
                          <Bar dataKey="valeur" name="Montant" fill="#2c767c" radius={[0, 0, 0, 0]} barSize={80} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </div>

                  {/* Card 2: Status */}
                  <div style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "4px",
                    padding: "15px",
                    backgroundColor: "#fff"
                  }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, marginBottom: "15px", color: "#1e293b" }}>
                      Répartition par statut
                    </div>
                    <Box sx={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statisticsData.statusPie}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={85}
                            labelLine={false}
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                              const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                              const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                              const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                              return (
                                <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="700">
                                  {value}
                                </text>
                              );
                            }}
                          >
                            {statisticsData.statusPie.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.name === "TERMINEE" ? "#2c767c" : "#ff9800"} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "4px" }} />
                          <Legend
                            verticalAlign="bottom"
                            align="center"
                            iconType="square"
                            wrapperStyle={{ fontSize: "10px", color: "#64748b", paddingTop: "10px" }}
                            formatter={(value) => <span style={{ textTransform: "uppercase" }}>{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </div>

                  {/* Card 3: Type */}
                  <div style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "4px",
                    padding: "15px",
                    backgroundColor: "#fff"
                  }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, marginBottom: "15px", color: "#1e293b" }}>
                      Répartition par type
                    </div>
                    <Box sx={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statisticsData.typeBar} margin={{ bottom: 10 }}>
                          <XAxis
                            dataKey="type"
                            tick={{ fontSize: 9, fill: "#64748b" }}
                            axisLine={{ stroke: "#e2e8f0" }}
                            tickLine={false}
                            height={50}
                          />
                          <YAxis tick={{ fontSize: 9, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                          <Tooltip
                            cursor={{ fill: "rgba(0,0,0,0.02)" }}
                            contentStyle={{ fontSize: "11px", borderRadius: "4px" }}
                          />
                          <Legend
                            verticalAlign="bottom"
                            align="center"
                            iconType="square"
                            wrapperStyle={{ fontSize: "10px", color: "#64748b", paddingTop: "10px" }}
                          />
                          <Bar dataKey="count" name="Nombre d'opérations" fill="#2196f3" radius={[0, 0, 0, 0]} barSize={80} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default DossierCNSSDetails;
