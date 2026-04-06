import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Button, Dropdown, Form } from "react-bootstrap";
import { faClose, faFilter, faSliders, faEye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { FaPlusCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Box, ThemeProvider, createTheme } from "@mui/material";
import ExpandRTable from "../Employe/ExpandRTable";
import SectionTitle from "../CNSS/SectionTitle";
import apiClient from "../../services/apiClient";
import { useHeader } from "../../Acceuil/HeaderContext";
import { useOpen } from "../../Acceuil/OpenProvider";
import { STATUTS_CYCLE_FORMATION } from "../../constants/status";
import { prefetchFormationSessions } from "./features/formations/useFormationSessions";
import "../Style.css";
import "./CareerTraining.css";

const normalizeValue = (value) => (value == null ? "" : String(value).toLowerCase().trim());

const formatDate = (value) => {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString("fr-FR", { year: "numeric", month: "2-digit", day: "2-digit" });
  } catch {
    return value;
  }
};

const formatBudget = (value) => {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return "-";
  return `${parsed.toLocaleString("fr-FR")} MAD`;
};

const formatDuration = (value) => {
  if (!value) return "—";
  const str = String(value).trim();
  // Already formatted (contains text)
  if (/[a-zA-Zàéèê]/.test(str)) return str;
  // Pure number - parse and format
  const num = parseInt(str, 10);
  if (isNaN(num) || num <= 0) return str;
  if (num === 1) return "1 jour";
  if (num < 7) return `${num} jours`;
  if (num === 7) return "1 semaine";
  if (num < 30) {
    const weeks = Math.floor(num / 7);
    const days = num % 7;
    if (days === 0) return `${weeks} semaine${weeks > 1 ? 's' : ''}`;
    return `${weeks} sem. ${days}j`;
  }
  if (num === 30) return "1 mois";
  const months = Math.floor(num / 30);
  const remainingDays = num % 30;
  if (remainingDays === 0) return `${months} mois`;
  const weeks = Math.floor(remainingDays / 7);
  if (weeks > 0) return `${months} mois ${weeks} sem.`;
  return `${months} mois ${remainingDays}j`;
};

const TrainingCatalog = forwardRef(
  (
    {
      embedded = false,
      showHeader = true,
      onViewDetails,
      onAdd,
      onEdit,
      onDelete,
      onParticipantsHover,
      onParticipantsClick,
      globalSearch,
      filtersVisible,
      handleFiltersToggle,
      drawerOpen,
      rows: externalRows,
      onRowsChange,
      selectedRowId,
    },
    ref
  ) => {
    const { setTitle, clearActions, searchQuery } = useHeader();
    const { dynamicStyles } = useOpen();

    const [internalRows, setInternalRows] = useState([]);
    const rows = externalRows || internalRows;
    const setRows = onRowsChange || setInternalRows;

    const [showDropdown, setShowDropdown] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedItems, setSelectedItems] = useState([]);
    const [columnVisibility, setColumnVisibility] = useState({});
    const [expandedRows, setExpandedRows] = useState({});
    const [sessionsData, setSessionsData] = useState({});
    const [loadingSessionsData, setLoadingSessionsData] = useState({});
    const sessionsPrefetchedAtRef = useRef(new Map());
    const expandedRowsRef = useRef({});
    const sessionsDataRef = useRef({});
    const toggleRowExpansionRef = useRef(null);
    const [filterOptions, setFilterOptions] = useState({
      filters: [
        {
          key: "domaine",
          label: "Domaine",
          type: "select",
          value: "",
          options: [],
          placeholder: "Tous",
        },
        {
          key: "type",
          label: "Type",
          type: "select",
          value: "",
          options: [
            { label: "Interne", value: "Interne" },
            { label: "Externe", value: "Externe" },
          ],
          placeholder: "Tous",
        },
        {
          key: "mode_formation",
          label: "Mode",
          type: "select",
          value: "",
          options: [
            { label: "Présentiel", value: "Présentiel" },
            { label: "En ligne", value: "En ligne" },
            { label: "Hybride", value: "Hybride" },
          ],
          placeholder: "Tous",
        },
        {
          key: "statut",
          label: "Statut",
          type: "select",
          value: "",
          options: [
            { label: STATUTS_CYCLE_FORMATION.PLANIFIEE, value: STATUTS_CYCLE_FORMATION.PLANIFIEE },
            { label: STATUTS_CYCLE_FORMATION.EN_COURS, value: STATUTS_CYCLE_FORMATION.EN_COURS },
            { label: STATUTS_CYCLE_FORMATION.TERMINEE, value: STATUTS_CYCLE_FORMATION.TERMINEE },
            { label: STATUTS_CYCLE_FORMATION.ANNULEE, value: STATUTS_CYCLE_FORMATION.ANNULEE },
          ],
          placeholder: "Tous",
        },
        {
          key: "formateur_nom",
          label: "Formateur",
          type: "select",
          value: "",
          options: [],
          placeholder: "Tous",
        },
        {
          key: "organisme",
          label: "Organisme",
          type: "select",
          value: "",
          options: [],
          placeholder: "Tous",
        },
      ],
    });

    /* Update filter options when rows change */
    useEffect(() => {
      const domaines = [...new Set(rows.map((t) => t.domaine).filter(Boolean))];
      const formateurs = [...new Set(rows.map((t) => t.formateur_nom).filter(Boolean))];
      const organismes = [...new Set(rows.map((t) => t.organisme).filter(Boolean))];
      
      setFilterOptions((prev) => ({
        ...prev,
        filters: prev.filters.map((f) => {
          if (f.key === "domaine") {
            return { ...f, options: domaines.map((d) => ({ label: d, value: d })) };
          }
          if (f.key === "formateur_nom") {
            return { ...f, options: formateurs.map((d) => ({ label: d, value: d })) };
          }
          if (f.key === "organisme") {
            return { ...f, options: organismes.map((d) => ({ label: d, value: d })) };
          }
          return f;
        }),
      }));
    }, [rows]);

    useEffect(() => {
      if (embedded) return;
      setTitle("Formations");
      return () => clearActions();
    }, [setTitle, clearActions, embedded]);

    const allColumns = useMemo(
      () => [
        {
          key: "code",
          label: "Code",
          render: (item) => (
            <span
              style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100px" }}
              title={item.code || ""}
            >
              {item.code || "—"}
            </span>
          ),
        },
        {
          key: "titre",
          label: "Formation",
          render: (item) => (
            <span
              style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" }}
              title={item.titre || ""}
            >
              {item.titre || "—"}
            </span>
          ),
        },
        {
          key: "domaine",
          label: "Domaine",
          render: (item) => (
            <span
              style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "120px" }}
              title={item.domaine || ""}
            >
              {item.domaine || "—"}
            </span>
          ),
        },
        {
          key: "type",
          label: "Type",
          render: (item) => {
            const value = item.type || item.type_formation || "—";
            const badgeClass = value === "Interne" ? "info" : "warning";
            return <span className={`career-badge ${badgeClass}`}>{value}</span>;
          },
        },
        {
          key: "mode_formation",
          label: "Mode",
          render: (item) => {
            const value = item.mode_formation || "—";
            return (
              <span
                style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "110px" }}
                title={value}
              >
                {value}
              </span>
            );
          },
        },
        {
          key: "duree",
          label: "Durée",
          render: (item) => (
            <span
              style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "120px" }}
              title={formatDuration(item.duree)}
            >
              {formatDuration(item.duree)}
            </span>
          ),
        },
        {
          key: "formateur_nom",
          label: "Formateur",
          render: (item) => (
            <span
              style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "150px" }}
              title={item.formateur_nom || ""}
            >
              {item.formateur_nom || "—"}
            </span>
          ),
        },
        {
          key: "statut",
          label: "Statut",
          render: (item) => (
            <span
              className={`career-badge ${
                item.statut === STATUTS_CYCLE_FORMATION.TERMINEE
                  ? "success"
                  : item.statut === STATUTS_CYCLE_FORMATION.EN_COURS
                  ? "info"
                  : "warning"
              }`}
            >
              {item.statut}
            </span>
          ),
        },
        {
          key: "date_debut",
          label: "Date début",
          render: (item) => (
            <span style={{ whiteSpace: "nowrap" }}>{formatDate(item.date_debut)}</span>
          ),
        },
        {
          key: "date_fin",
          label: "Date fin",
          render: (item) => (
            <span style={{ whiteSpace: "nowrap" }}>{formatDate(item.date_fin)}</span>
          ),
        },
        {
          key: "budget",
          label: "Budget",
          render: (item) => (
            <span style={{ whiteSpace: "nowrap" }}>{formatBudget(item.budget)}</span>
          ),
        },
        {
          key: "organisme",
          label: "Organisme",
          render: (item) => (
            <span
              style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "180px" }}
              title={item.organisme || ""}
            >
              {item.organisme || "—"}
            </span>
          ),
        },
        {
          key: "effectif",
          label: "Effectif",
          render: (item) => (
            <span style={{ whiteSpace: "nowrap" }}>{item.effectif || "—"}</span>
          ),
        },
        {
          key: "participants_count",
          label: "Participants",
          render: (item) => {
            const count = item.participants_count || 0;
            const effectif = item.effectif;
            const isComplete = effectif && count >= effectif;
            if (onParticipantsClick) {
              return (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onParticipantsClick(item); }}
                  onMouseEnter={() => {
                    if (onParticipantsHover) {
                      onParticipantsHover(item);
                    }
                  }}
                  onFocus={() => {
                    if (onParticipantsHover) {
                      onParticipantsHover(item);
                    }
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: count > 0 ? "#1d4ed8" : "#6b7280",
                    fontWeight: count > 0 ? 600 : 400,
                    textDecoration: "underline",
                    fontSize: "inherit",
                    whiteSpace: "nowrap",
                  }}
                  title="Voir les participants"
                >
                  {count}{effectif ? ` / ${effectif}` : ""}
                  {isComplete && <span style={{ color: "#dc2626", fontWeight: 600, marginLeft: "4px" }}>(Complet)</span>}
                </button>
              );
            }
            return (
              <span style={{ whiteSpace: "nowrap" }}>
                {count}{effectif ? ` / ${effectif}` : ""}
                {isComplete && <span style={{ color: "#dc2626", fontWeight: 600, marginLeft: "4px" }}>(Complet)</span>}
              </span>
            );
          },
        },
        {
          key: "sessions_count",
          label: "Séances",
          render: (item) => {
            const count = item.sessions_count ?? 0;
            const isExpanded = expandedRows[item.id];
            return (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRowExpansion(item.id);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: count > 0 ? "pointer" : "not-allowed",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    opacity: count > 0 ? 1 : 0.3,
                  }}
                  disabled={count === 0}
                  title={count > 0 ? (isExpanded ? "Masquer les séances" : "Voir les séances") : "Aucune séance"}
                >
                  <span style={{ 
                    fontSize: "12px", 
                    transition: "transform 0.2s",
                    display: "inline-block",
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)"
                  }}>
                    ▼
                  </span>
                </button>
                <span style={{ fontSize: "0.82rem", color: count > 0 ? "#374151" : "#9ca3af" }}>
                  📅 {count} séance{count !== 1 ? "s" : ""}
                </span>
              </div>
            );
          },
        },
        {
          key: "attendance_rate",
          label: "Présence",
          render: (item) => {
            const rate = item.attendance_rate;
            if (rate == null) {
              return <span style={{ fontSize: "0.78rem", color: "#9ca3af", whiteSpace: "nowrap" }}>—</span>;
            }
            const color = rate >= 80 ? "#16a34a" : rate >= 50 ? "#d97706" : "#dc2626";
            const bg    = rate >= 80 ? "#dcfce7" : rate >= 50 ? "#fef3c7" : "#fee2e2";
            return (
              <span style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: "12px",
                backgroundColor: bg,
                color,
                fontWeight: 700,
                fontSize: "0.78rem",
                whiteSpace: "nowrap",
              }}>
                🎯 {rate}%
              </span>
            );
          },
        },
      ],
      []
    );

    useEffect(() => {
      const saved = localStorage.getItem("formationsColumnVisibility");
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = { ...parsed };
        allColumns.forEach((col) => {
          if (merged[col.key] === undefined) merged[col.key] = true;
        });
        setColumnVisibility(merged);
        localStorage.setItem("formationsColumnVisibility", JSON.stringify(merged));
        return;
      }
      const defaults = {};
      allColumns.forEach((col) => {
        defaults[col.key] = true;
      });
      setColumnVisibility(defaults);
      localStorage.setItem("formationsColumnVisibility", JSON.stringify(defaults));
    }, [allColumns]);

    useEffect(() => {
      expandedRowsRef.current = expandedRows;
    }, [expandedRows]);

    useEffect(() => {
      sessionsDataRef.current = sessionsData;
    }, [sessionsData]);

    useEffect(() => {
      if (!Array.isArray(rows) || rows.length === 0) return;

      setSessionsData((prev) => {
        let changed = false;
        const next = { ...prev };

        rows.forEach((row) => {
          const key = String(row?.id ?? "");
          if (!key) return;

          if (Array.isArray(row?.sessions)) {
            const current = next[key];
            const currentLength = Array.isArray(current) ? current.length : -1;
            if (!Array.isArray(current) || row.sessions.length > currentLength) {
              next[key] = row.sessions;
              changed = true;
            }
            return;
          }

          if (!Object.hasOwn(next, key) && Number(row?.sessions_count ?? 0) === 0) {
            next[key] = [];
            changed = true;
          }
        });

        return changed ? next : prev;
      });
    }, [rows]);

    const searchTerm = globalSearch || searchQuery || "";

    const filteredBySearch = useMemo(() => {
      const s = normalizeValue(searchTerm);
      if (!s) return rows;
      return rows.filter((item) =>
        [
          item.code,
          item.titre,
          item.domaine,
          item.type || item.type_formation,
          item.mode_formation,
          item.statut,
          item.organisme,
          item.formateur_nom,
          item.duree,
          formatDuration(item.duree),
          item.date_debut,
          item.date_fin,
          item.budget,
          item.effectif,
        ]
          .filter(Boolean)
          .some((v) => normalizeValue(v).includes(s))
      );
    }, [rows, searchTerm]);

    const filteredRows = useMemo(() => {
      return filteredBySearch.filter((item) => {
        for (const filter of filterOptions.filters) {
          if (filter.value) {
            let itemValue = item[filter.key];
            // Handle special case for type field
            if (filter.key === "type") {
              itemValue = item.type || item.type_formation;
            }
            if (normalizeValue(itemValue) !== normalizeValue(filter.value)) {
              return false;
            }
          }
        }
        return true;
      });
    }, [filteredBySearch, filterOptions]);

    const visibleColumns = useMemo(
      () => allColumns.filter((col) => columnVisibility[col.key]),
      [allColumns, columnVisibility]
    );

    const handleColumnsChange = useCallback((key) => {
      setColumnVisibility((prev) => {
        const updated = { ...prev, [key]: !prev[key] };
        localStorage.setItem("formationsColumnVisibility", JSON.stringify(updated));
        return updated;
      });
    }, []);

    const handleFilterChange = useCallback((key, value) => {
      setFilterOptions((prev) => ({
        ...prev,
        filters: prev.filters.map((f) => (f.key === key ? { ...f, value } : f)),
      }));
    }, []);

    const handleResetFilters = useCallback(() => {
      setFilterOptions((prev) => ({
        ...prev,
        filters: prev.filters.map((f) => {
          if (f.type === "dateRange" || f.type === "range") {
            return { ...f, dateDebut: "", dateFin: "" };
          }
          return { ...f, value: "" };
        }),
      }));
      setCurrentPage(0);
    }, []);

    const handleChangePage = useCallback((newPage) => setCurrentPage(newPage), []);
    const handleChangeRowsPerPage = useCallback((event) => {
      setItemsPerPage(parseInt(event.target.value, 10));
      setCurrentPage(0);
    }, []);

    const handleSelectAllChange = useCallback(
      (checked) => {
        setSelectedItems(checked ? filteredRows.map((item) => item.id) : []);
      },
      [filteredRows]
    );

    const handleCheckboxChange = useCallback((id) => {
      setSelectedItems((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    }, []);

    const handleDeleteSelected = useCallback(async () => {
      if (selectedItems.length === 0) return;
      const result = await Swal.fire({
        title: "Êtes-vous sûr ?",
        text: "Les formations sélectionnées seront supprimées.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Oui, supprimer",
        cancelButtonText: "Annuler",
      });
      if (!result.isConfirmed) return;
      try {
        await Promise.all(selectedItems.map((id) => apiClient.delete(`/formations/${id}`)));
        setRows((prev) => prev.filter((item) => !selectedItems.includes(item.id)));
        setSelectedItems([]);
        Swal.fire("Supprimé", "Les formations ont été supprimées.", "success");
      } catch (err) {
        console.error("Erreur suppression multiple:", err);
        Swal.fire({ icon: "error", title: "Erreur", text: "Erreur lors de la suppression." });
      }
    }, [selectedItems, setRows]);

    const handleDeleteRow = useCallback(
      async (item) => {
        const result = await Swal.fire({
          title: "Êtes-vous sûr ?",
          text: `La formation "${item.titre}" sera supprimée.`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Oui, supprimer",
          cancelButtonText: "Annuler",
        });
        if (!result.isConfirmed) return;
        if (onDelete) {
          onDelete(item);
        } else {
          setRows((prev) => prev.filter((r) => r.id !== item.id));
        }
        Swal.fire("Supprimé", "La formation a été supprimée.", "success");
      },
      [onDelete, setRows]
    );

    const highlightText = useCallback((text, term) => {
      if (!text || !term) return text;
      const str = String(text);
      const lower = term.toLowerCase();
      if (!str.toLowerCase().includes(lower)) return str;
      const parts = str.split(new RegExp(`(${term})`, "gi"));
      return parts.map((part, i) =>
        part.toLowerCase() === lower ? (
          <mark key={i} style={{ backgroundColor: "yellow" }}>
            {part}
          </mark>
        ) : (
          part
        )
      );
    }, []);

    const fetchSessionsForFormation = useCallback(async (formationId, options = {}) => {
      const { forceRefresh = false, knownSessionsCount = null } = options;
      if (!formationId) return [];

      const key = String(formationId);
      try {
        setLoadingSessionsData((prev) => ({ ...prev, [key]: true }));
        const sessions = await prefetchFormationSessions(formationId, {
          forceRefresh,
          knownSessionsCount,
        });
        setSessionsData((prev) => ({
          ...prev,
          [key]: Array.isArray(sessions) ? sessions : [],
        }));
        return Array.isArray(sessions) ? sessions : [];
      } catch (err) {
        console.error("Erreur chargement séances:", err);
        setSessionsData((prev) => ({
          ...prev,
          [key]: [],
        }));
        return [];
      } finally {
        setLoadingSessionsData((prev) => ({ ...prev, [key]: false }));
      }
    }, []);

    const toggleRowExpansion = useCallback(async (formationId) => {
      const key = String(formationId);
      const row = rows.find((item) => String(item.id) === key);
      setExpandedRows((prev) => {
        const isCurrentlyExpanded = prev[key];
        const newState = { ...prev, [key]: !isCurrentlyExpanded };
        const hasInlineSessions = Array.isArray(row?.sessions);
        
        // If expanding and sessions not yet loaded, fetch them
        if (
          !isCurrentlyExpanded &&
          !hasInlineSessions &&
          !Object.hasOwn(sessionsData, key)
        ) {
          fetchSessionsForFormation(formationId, {
            knownSessionsCount: row?.sessions_count,
          });
        }
        
        return newState;
      });
    }, [rows, sessionsData, fetchSessionsForFormation]);

    useEffect(() => {
      toggleRowExpansionRef.current = toggleRowExpansion;
    }, [toggleRowExpansion]);

    useEffect(() => {
      const expandedKeys = Object.keys(expandedRows).filter((key) => !!expandedRows[key]);
      if (expandedKeys.length === 0) return;

      expandedKeys.forEach((key) => {
        const row = rows.find((item) => String(item?.id) === key);
        if (!row) return;
        if (Array.isArray(row.sessions)) return;
        if (Object.hasOwn(sessionsData, key)) return;
        if (loadingSessionsData[key]) return;

        fetchSessionsForFormation(row.id, {
          knownSessionsCount: row.sessions_count,
        });
      });
    }, [expandedRows, rows, sessionsData, loadingSessionsData, fetchSessionsForFormation]);

    useEffect(() => {
      if (!Array.isArray(filteredRows) || filteredRows.length === 0) return;

      const start = currentPage * itemsPerPage;
      const end = start + itemsPerPage;
      const now = Date.now();
      const candidates = filteredRows
        .slice(start, end)
        .filter((row) => Number(row?.sessions_count ?? 0) > 0)
        .filter((row) => !Array.isArray(row?.sessions))
        .filter((row) => {
          const key = String(row.id || "");
          if (!key) return false;
          const last = sessionsPrefetchedAtRef.current.get(key) || 0;
          if (now - last < 90 * 1000) return false;
          sessionsPrefetchedAtRef.current.set(key, now);
          return true;
        });

      if (candidates.length === 0) return;

      let cancelled = false;

      const warm = async () => {
        for (let i = 0; i < candidates.length; i += 3) {
          if (cancelled) return;
          const chunk = candidates.slice(i, i + 3);
          await Promise.allSettled(
            chunk.map((row) =>
              fetchSessionsForFormation(row.id, {
                knownSessionsCount: row.sessions_count,
              })
            )
          );
        }
      };

      warm();

      return () => {
        cancelled = true;
      };
    }, [filteredRows, currentPage, itemsPerPage, fetchSessionsForFormation]);

    const exportToPDF = useCallback(() => {
      const doc = new jsPDF();
      const cols = visibleColumns.map((c) => c.label);
      const tableRows = filteredRows.map((item) =>
        visibleColumns.map((c) => (c.key === "budget" ? formatBudget(item[c.key]) : (item[c.key] ?? "-")))
      );
      doc.setFontSize(18);
      doc.text("Liste des formations", 14, 22);
      doc.autoTable({ head: [cols], body: tableRows, startY: 30 });
      doc.save("formations.pdf");
    }, [visibleColumns, filteredRows]);

    const exportToExcel = useCallback(() => {
      const data = filteredRows.map((item) => {
        const row = {};
        visibleColumns.forEach((c) => {
          row[c.label] = c.key === "budget" ? formatBudget(item[c.key]) : (item[c.key] ?? "-");
        });
        return row;
      });
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Formations");
      XLSX.writeFile(wb, "formations.xlsx");
    }, [visibleColumns, filteredRows]);

    const handlePrint = useCallback(() => {
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;
      const cols = visibleColumns.map((c) => c.label);
      const tableRows = filteredRows.map((item) =>
        visibleColumns.map((c) => (c.key === "budget" ? formatBudget(item[c.key]) : (item[c.key] ?? "-")))
      );
      printWindow.document.write(`
        <html><head><title>Formations</title>
        <style>table{border-collapse:collapse;width:100%}th,td{border:1px solid #000;padding:8px}th{background:#f2f2f2}</style>
        </head><body><h1>Formations</h1>
        <table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
        <tbody>${tableRows.map((r) => `<tr>${r.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
        </table></body></html>
      `);
      printWindow.document.close();
      printWindow.print();
    }, [visibleColumns, filteredRows]);

    useImperativeHandle(ref, () => ({ exportToPDF, exportToExcel, handlePrint }), [
      exportToPDF,
      exportToExcel,
      handlePrint,
    ]);

    const iconButtonStyle = {
      backgroundColor: "#f9fafb",
      border: "1px solid #ccc",
      borderRadius: "5px",
      padding: "13px 16px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    };

    const CustomMenu = React.forwardRef(({ className, "aria-labelledby": labeledBy }, menuRef) => (
      <div
        ref={menuRef}
        className={className}
        aria-labelledby={labeledBy}
        style={{
          padding: "10px",
          backgroundColor: "white",
          border: "1px solid #ccc",
          borderRadius: "5px",
          maxHeight: "400px",
          overflowY: "auto",
        }}
      >
        <Form onClick={(e) => e.stopPropagation()}>
          {allColumns.map((col) => (
            <Form.Check
              key={col.key}
              type="checkbox"
              id={`formation-col-${col.key}`}
              label={col.label}
              checked={!!columnVisibility[col.key]}
              onChange={() => handleColumnsChange(col.key)}
            />
          ))}
        </Form>
      </div>
    ));

    const tableContent = (
      <>
        <style>{`
          .filters-container::-webkit-scrollbar { height: 5px; }
          .filters-container::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
          .filters-container::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
          .filters-container::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
          .with-split-view .addemp-overlay,
          .with-split-view .add-cnss-container,
          .with-split-view .side-panel-container,
          .with-split-view .cnss-side-panel {
            position: relative !important; top: 0 !important; left: 0 !important;
            width: 100% !important; height: 100% !important;
            box-shadow: none !important; animation: none !important; border-radius: 0 !important;
          }
          .section-header { border-bottom: none; padding-bottom: 15px; margin: 0.5% 1% 1%; }
          .btn-primary { background-color: #3a8a90; border-color: #3a8a90; color: white;
            border-radius: 0.375rem; font-weight: 500; padding: 0.5rem 1rem;
            transition: background-color 0.15s ease-in-out; }
        `}</style>

        <div className="mt-4">
          <div className="section-header mb-3">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto",
                alignItems: "center",
                columnGap: "16px",
                width: "100%",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <SectionTitle icon="fas fa-graduation-cap" text="Formations" />
                {!drawerOpen && (
                  <p className="section-description text-muted mb-0">
                    {filteredRows.length} formation{filteredRows.length !== 1 ? "s" : ""} affichée
                    {filteredRows.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "center", justifySelf: "end" }}>
                <FontAwesomeIcon
                  onClick={() => handleFiltersToggle && handleFiltersToggle(!filtersVisible)}
                  icon={filtersVisible ? faClose : faFilter}
                  style={{
                    cursor: "pointer",
                    fontSize: "1.9rem",
                    color: "#2c767c",
                    marginTop: "1.3%",
                    marginRight: "8px",
                  }}
                />

                <Button
                  onClick={() => onAdd && onAdd()}
                  className="d-flex align-items-center justify-content-center"
                  size="sm"
                  style={{
                    minWidth: "220px",
                    height: "38px",
                    backgroundColor: "#3a8a90",
                    border: "none",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    boxShadow: "0 3px 8px rgba(58, 138, 144, 0.28)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <FaPlusCircle className="me-2" />
                  Ajouter une formation
                </Button>

                <Dropdown show={showDropdown} onToggle={(isOpen) => setShowDropdown(isOpen)}>
                  <Dropdown.Toggle
                    as="button"
                    id="dropdown-visibility-formations"
                    title="Visibilité Colonnes"
                    style={iconButtonStyle}
                  >
                    <FontAwesomeIcon icon={faSliders} style={{ width: 18, height: 18, color: "#4b5563" }} />
                  </Dropdown.Toggle>
                  <Dropdown.Menu as={CustomMenu} />
                </Dropdown>
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
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, marginRight: "5px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a90a4" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                <span className="filters-title">Filtres</span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  style={{
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    color: "#334155",
                    borderRadius: "6px",
                    height: "30px",
                    padding: "0 10px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    marginLeft: "8px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Réinitialiser
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "nowrap", flexShrink: 0 }}>
                {filterOptions.filters.map((filter) => (
                  <div key={filter.key} style={{ display: "flex", alignItems: "center", margin: 0, marginRight: "46px" }}>
                    <label
                      style={{
                        fontSize: "0.9rem",
                        margin: 0,
                        marginRight: "-44px",
                        whiteSpace: "nowrap",
                        fontWeight: 600,
                        color: "#2c3e50",
                      }}
                    >
                      {filter.label}
                    </label>
                    <select
                      value={filter.value}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      className="filter-input"
                      style={{
                        minWidth: 110,
                        maxWidth: 150,
                        height: 30,
                        fontSize: "0.9rem",
                        padding: "2px 6px",
                        borderRadius: 6,
                      }}
                    >
                      <option value="">{filter.placeholder}</option>
                      {filter.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <ExpandRTable
          columns={visibleColumns}
          data={filteredRows}
          searchTerm={normalizeValue(searchTerm)}
          highlightText={highlightText}
          selectAll={selectedItems.length === filteredRows.length && filteredRows.length > 0}
          selectedItems={selectedItems}
          handleSelectAllChange={handleSelectAllChange}
          handleCheckboxChange={handleCheckboxChange}
          handleEdit={(item) => onEdit && onEdit(item)}
          handleDelete={handleDeleteRow}
          handleDeleteSelected={handleDeleteSelected}
          rowsPerPage={itemsPerPage}
          page={currentPage}
          handleChangePage={handleChangePage}
          handleChangeRowsPerPage={handleChangeRowsPerPage}
          getRowStyle={(item) => ({
            backgroundColor: item.id === selectedRowId ? "#e0f2f1" : "white",
            '&:hover': {
              backgroundColor: item.id === selectedRowId ? "#b2dfdb" : "#f9fafb",
            },
            cursor: "pointer",
            transition: "background-color 0.2s ease",
          })}
          renderCustomActions={(item) => (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onViewDetails) onViewDetails(item);
              }}
              aria-label="Voir détails"
              title="Voir détails"
              style={{
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
              }}
            >
              <FontAwesomeIcon icon={faEye} style={{ color: "#2c767c", fontSize: "14px" }} />
            </button>
          )}
          expandedRows={expandedRows}
          toggleRowExpansion={toggleRowExpansion}
          renderExpandedRow={(item) => {
            const key = String(item.id);
            const hasInlineSessions = Array.isArray(item.sessions);
            const hasStateSessions = Object.hasOwn(sessionsData, key);
            const stateSessions = hasStateSessions ? sessionsData[key] : null;
            const normalizedStateSessions = Array.isArray(stateSessions) ? stateSessions : [];
            const inlineSessions = hasInlineSessions ? item.sessions : [];
            const useInlineOverState =
              hasInlineSessions &&
              normalizedStateSessions.length === 0 &&
              inlineSessions.length > 0;
            const sessions = useInlineOverState
              ? inlineSessions
              : hasStateSessions
                ? normalizedStateSessions
                : inlineSessions;
            const hasLoadedSessions = hasInlineSessions || hasStateSessions;
            const isLoadingSessions = !!loadingSessionsData[key] && !hasLoadedSessions;
            
            if (isLoadingSessions) {
              return (
                <div style={{ padding: "12px 20px" }} />
              );
            }

            if (sessions.length === 0) {
              return (
                <div style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>
                  Aucune séance planifiée
                </div>
              );
            }

            return (
              <div style={{ padding: "10px 20px", backgroundColor: "#f9fafb" }}>
                <table style={{ 
                  width: "100%", 
                  borderCollapse: "collapse",
                  fontSize: "0.875rem",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  overflow: "hidden"
                }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f3f4f6" }}>
                      <th style={{ padding: "10px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "2px solid #e5e7eb" }}>Date</th>
                      <th style={{ padding: "10px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "2px solid #e5e7eb" }}>Heure</th>
                      <th style={{ padding: "10px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "2px solid #e5e7eb" }}>Salle</th>
                      <th style={{ padding: "10px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "2px solid #e5e7eb" }}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session, index) => (
                      <tr key={session.id} style={{ 
                        borderBottom: index < sessions.length - 1 ? "1px solid #e5e7eb" : "none",
                      }}>
                        <td style={{ padding: "10px", color: "#1f2937" }}>
                          {session.date ? new Date(session.date).toLocaleDateString("fr-FR") : "—"}
                        </td>
                        <td style={{ padding: "10px", color: "#1f2937" }}>
                          {session.heure_debut && session.heure_fin 
                            ? `${session.heure_debut} – ${session.heure_fin}` 
                            : "—"}
                        </td>
                        <td style={{ padding: "10px", color: "#1f2937" }}>
                          {session.salle || "—"}
                        </td>
                        <td style={{ padding: "10px" }}>
                          <span style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            borderRadius: "999px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            backgroundColor: session.statut === "Terminée" 
                              ? "#dcfce7" 
                              : session.statut === "Annulée" 
                              ? "#fee2e2" 
                              : "#dbeafe",
                            color: session.statut === "Terminée" 
                              ? "#15803d" 
                              : session.statut === "Annulée" 
                              ? "#dc2626" 
                              : "#1d4ed8",
                          }}>
                            {session.statut || "Planifiée"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }}
        />
      </>
    );

    if (embedded) return tableContent;

    return (
      <ThemeProvider theme={createTheme()}>
        <Box sx={{ ...dynamicStyles, minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
          <Box component="main" sx={{ flexGrow: 1, p: 0, mt: 12 }}>
            {tableContent}
          </Box>
        </Box>
      </ThemeProvider>
    );
  }
);

export default TrainingCatalog;
