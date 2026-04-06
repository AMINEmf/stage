import React, { useState, useEffect, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import { Button, Form } from "react-bootstrap";
import { faSliders, faFilter, faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Dropdown from "react-bootstrap/Dropdown";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlusCircle } from "react-icons/fa";
import { X } from "lucide-react";
import ExpandRTable from "../Employe/ExpandRTable";
import SectionTitle from "../CNSS/SectionTitle";
import AddCarriere from "./AddCarriere";
import apiClient from "../../services/apiClient";
import "../Style.css";
import "./CareerTraining.css";

const DEBUG_CARRIERES = false;

const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    return "-";
  }
};

const normalizeValue = (value) => (value == null ? "" : String(value).toLowerCase().trim());
const normalizeId = (value) => (value == null || value === "" ? null : String(value));

const formatDuration = (startDate, endDate = new Date()) => {
  if (!startDate) return "—";
  const start = new Date(startDate);
  const today = new Date();
  const end = endDate ? new Date(endDate) : today;
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "—";
  if (end < start) return "—";

  const isSameDayAsToday = start.toDateString() === today.toDateString();
  if (isSameDayAsToday) return "Aujourd'hui";

  const rawTotalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));
  const effectiveEnd = rawTotalDays === 0 ? today : end;
  const diffMs = effectiveEnd - start;
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (totalDays <= 0) return "—";

  let months = (effectiveEnd.getFullYear() - start.getFullYear()) * 12 + (effectiveEnd.getMonth() - start.getMonth());
  if (effectiveEnd.getDate() < start.getDate()) {
    months -= 1;
  }
  if (months < 0) months = 0;

  // For durations less than 1 month, show weeks/days
  if (months === 0) {
    const weeks = Math.floor(totalDays / 7);
    const days = totalDays % 7;
    const parts = [];
    if (weeks > 0) parts.push(`${weeks} sem.`);
    if (days > 0) parts.push(`${days} j`);
    return parts.join(" ") || "—";
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  const parts = [];
  if (years > 0) parts.push(`${years} an${years > 1 ? "s" : ""}`);
  if (remainingMonths > 0) parts.push(`${remainingMonths} mois`);
  if (parts.length === 0) return "—";
  return parts.join(" ");
};

  export const EmployeeProfileDrawer = ({ employee, onClose }) => {
    if (!employee) return null;
  
    const history = Array.isArray(employee.historique) ? employee.historique : [];
      const getHistoryStartDate = (step) => (
        step?.start ||
        step?.date_debut ||
        step?.dateDebut ||
        step?.date ||
        step?.created_at ||
        step?.createdAt ||
        null
      );
      const getHistoryEndDate = (step) => (
        step?.end ||
        step?.date_fin ||
        step?.dateFin ||
        null
      );
      const orderedHistory = useMemo(() => {
        if (history.length <= 1) return history;
        const toTimestamp = (value) => {
          if (!value) return Number.MAX_SAFE_INTEGER;
          const date = new Date(value);
          const time = date.getTime();
          return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
        };
        return [...history].sort((a, b) => toTimestamp(getHistoryStartDate(a)) - toTimestamp(getHistoryStartDate(b)));
      }, [history]);
    const email =
      employee.email ??
      employee.mail ??
      employee.email_pro ??
      employee.emailPro ??
      "";
    const phone =
      employee.telephone ??
      employee.tel ??
      employee.phone ??
      "";
    const hireDate =
      employee.date_embauche ??
      employee.dateEmbauche ??
      employee.date_entree ??
      employee.dateEntree ??
      "";
    const contrats = Array.isArray(employee.contrat)
      ? employee.contrat
      : Array.isArray(employee.contrats)
        ? employee.contrats
        : employee.contrat
          ? [employee.contrat]
          : [];
    const contractType =
      employee.type_contrat ??
      employee.typeContrat ??
      contrats[0]?.type_contrat ??
      contrats[0]?.type ??
      "";
    const managerName =
      employee.manager?.nom_complet ??
      employee.manager_name ??
      employee.managerNom ??
      "";
    const managerMatricule =
      employee.manager?.matricule ??
      employee.manager_matricule ??
      "";
  
    const fullName =
      employee.full_name ||
      [employee.nom, employee.prenom].filter(Boolean).join(" ") ||
      employee.nom ||
      employee.prenom ||
      "Profil employé";

    return (
      <>
        <style>{`
          .parcours-historique-scroll {
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 #f1f5f9;
          }
          
          .parcours-historique-scroll::-webkit-scrollbar {
            width: 6px;
          }
          
          .parcours-historique-scroll::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
          }
          
          .parcours-historique-scroll::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
            transition: background 0.2s ease;
          }
          
          .parcours-historique-scroll::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }

          .history-timeline {
            display: flex;
            flex-direction: column;
            gap: 12px;
            height: clamp(320px, calc(100vh - 360px), 560px);
            overflow-y: scroll;
            overflow-x: hidden;
            overscroll-behavior: contain;
            scrollbar-gutter: stable;
            padding-right: 8px;
            margin-right: 0;
            padding-bottom: 8px;
          }

          @media (max-width: 992px) {
            .history-timeline {
              height: clamp(260px, calc(100vh - 420px), 440px);
            }
          }

          .history-row {
            display: flex;
            gap: 10px;
            align-items: stretch;
          }

          .history-marker-col {
            width: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            flex-shrink: 0;
          }

          .history-dot {
            width: 10px;
            height: 10px;
            border-radius: 999px;
            margin-top: 6px;
            box-shadow: 0 0 0 2px #fff;
          }

          .history-dot-poste {
            background: #0ea5e9;
          }

          .history-dot-formation {
            background: #6366f1;
          }

          .history-line {
            width: 2px;
            flex: 1;
            margin-top: 2px;
            border-radius: 99px;
            background: linear-gradient(180deg, #cbd5e1 0%, #e2e8f0 100%);
          }

          .history-card {
            flex: 1;
            min-width: 0;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 10px 12px;
          }

          .history-title {
            font-weight: 700;
            color: #0f172a;
            display: flex;
            align-items: center;
            gap: 6px;
            line-height: 1.3;
          }

          .history-meta {
            color: #64748b;
            font-size: 0.8rem;
            margin-top: 3px;
            line-height: 1.35;
          }

          .history-tag {
            display: inline-block;
            margin-top: 6px;
            font-size: 0.72rem;
            font-weight: 600;
            color: #0f766e;
            background: #ccfbf1;
            border: 1px solid #99f6e4;
            border-radius: 999px;
            padding: 2px 8px;
          }

          @media (max-width: 576px) {
            .history-timeline {
              height: clamp(220px, calc(100vh - 500px), 320px);
            }
          }
        `}</style>
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            minHeight: 0,
            overflow: "hidden",
            backgroundColor: "#fdfdfd",
            boxShadow: "-4px 0 15px rgba(0,0,0,0.05)",
            position: "relative",
          }}
        >
        <div 
          className="career-drawer-content"
          onClick={(event) => event.stopPropagation()}
          style={{
            width: "100%",
            height: "100%",
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden", 
            backgroundColor: "#fff",
          }}
        >
          <div className="form-header" style={{ flexShrink: 0 }}>
            <div>
              <h3>{fullName}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={24} />
            </button>
          </div>
  
          <div className="form-body" style={{ flex: "1 1 0", minHeight: 0, overflowY: "auto", padding: "16px 16px 28px" }}>
            <div className="career-drawer-section">
              <h6>Informations générales</h6>
              <div className="row g-2">
                <div className="col-12 col-md-6" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>Email</div>
                  <div className="text-muted" style={{ overflowWrap: "anywhere", wordBreak: "break-word", lineHeight: 1.35 }}>
                    {email || "—"}
                  </div>
                </div>
                <div className="col-12 col-md-6" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>Téléphone</div>
                  <div className="text-muted" style={{ overflowWrap: "anywhere", wordBreak: "break-word", lineHeight: 1.35 }}>
                    {phone || "—"}
                  </div>
                </div>
                <div className="col-12 col-md-6" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>Date d'embauche</div>
                  <div className="text-muted" style={{ overflowWrap: "anywhere", wordBreak: "break-word", lineHeight: 1.35 }}>
                    {hireDate || "—"}
                  </div>
                </div>
                <div className="col-12 col-md-6" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>Type de contrat</div>
                  <div className="text-muted" style={{ overflowWrap: "anywhere", wordBreak: "break-word", lineHeight: 1.35 }}>
                    {contractType || "—"}
                  </div>
                </div>
                <div className="col-12 col-md-6" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>Ancienneté</div>
                  <div className="text-muted" style={{ overflowWrap: "anywhere", wordBreak: "break-word", lineHeight: 1.35 }}>
                    {formatDuration(hireDate, null)}
                  </div>
                </div>
                <div className="col-12 col-md-6" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>Manager direct</div>
                  <div className="text-muted" style={{ overflowWrap: "anywhere", wordBreak: "break-word", lineHeight: 1.35 }}>
                    {managerName ? `${managerName}${managerMatricule ? ` (${managerMatricule})` : ""}` : "—"}
                  </div>
                </div>
              </div>
            </div>
  
            <div className="career-drawer-section">
              <h6>Compétences</h6>
              {(() => {
                const empCompetences = Array.isArray(employee.competences) ? employee.competences : [];
                if (empCompetences.length === 0) {
                  return <span className="text-muted" style={{ fontSize: "0.85rem" }}>Aucune compétence enregistrée.</span>;
                }
                return (
                  <div 
                    className="d-flex flex-column gap-2 parcours-historique-scroll"
                    style={{
                      maxHeight: "300px",
                      overflowY: "auto",
                      paddingRight: "8px",
                      marginRight: "-8px"
                    }}
                  >
                    {empCompetences.map((c) => (
                      <div key={c.id || c.nom} className="d-flex justify-content-between align-items-center py-2" style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <div>
                          <span style={{ fontSize: "0.9rem", color: "#334155", fontWeight: 600 }}>{c.nom}</span>
                          {c.categorie && (
                            <span className="text-muted" style={{ fontSize: "0.75rem", marginLeft: "8px" }}>({c.categorie})</span>
                          )}
                        </div>
                        {(c.niveau || c.niveau_acquis) && (
                          <span 
                            style={{ 
                              fontSize: "0.75rem", 
                              fontWeight: 600, 
                              padding: "2px 8px", 
                              borderRadius: "12px",
                              backgroundColor: "#e0f2fe",
                              color: "#0369a1"
                            }}
                          >
                            {c.niveau_acquis || c.niveau}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
  
            <div className="career-drawer-section">
              <h6>Parcours & Historique</h6>
              {history.length === 0 && (
                <span className="text-muted">Aucun historique disponible.</span>
              )}
              {history.length > 0 && (
                <div
                  className="parcours-historique-scroll history-timeline"
                  onWheel={(event) => event.stopPropagation()}
                >
                  {orderedHistory.map((step, index) => {
                    const normalizedType = normalizeValue(step?.type);
                    const isFormation = normalizedType.includes("formation");
                    const title = isFormation ? step.formation : step.poste;
                    const subtitle = isFormation ? `Domaine: ${step.domaine || "—"}` : step.evolution || "—";
                    const start = getHistoryStartDate(step);
                    const end = getHistoryEndDate(step);
                    const dateStartLabel = start || "—";
                    const dateEndLabel = end || (isFormation ? "—" : "Aujourd'hui");
                    const durationLabel = isFormation ? "" : formatDuration(start, end);

                    return (
                      <div key={`${title || "etape"}-${index}`} className="history-row">
                        <div className="history-marker-col">
                          <span className={`history-dot ${isFormation ? "history-dot-formation" : "history-dot-poste"}`} />
                          {index < orderedHistory.length - 1 && <span className="history-line" />}
                        </div>
                        <div className="history-card">
                          <div className="history-title">
                            {isFormation && <span aria-hidden="true">📚</span>}
                            <span>{title || "—"}</span>
                          </div>
                          <div className="history-meta">
                            {dateStartLabel} → {dateEndLabel}
                          </div>
                          <div className="history-meta">
                            {subtitle}
                            {durationLabel ? ` · ${durationLabel}` : ""}
                          </div>
                          <span className="history-tag">{isFormation ? "Formation" : "Poste"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
  

          </div>
        </div>
      </div>
      </>
    );
  };

const getStartDate = (row) =>
  row?.date_debut_poste ||
  row?.dateDebutPoste ||
  row?.date_derniere_promotion ||
  row?.derniere_promotion ||
  row?.created_at ||
  row?.createdAt ||
  null;

const getTypeEvolution = (row) =>
  row?.type_evolution ||
  row?.typeEvolution ||
  row?.evolution_type ||
  row?.evolutionType ||
  row?.type ||
  "";

const getEvolutionBadgeClass = (value) => {
  const normalized = normalizeValue(value);
  if (!normalized) return "warning";
  if (normalized.includes("promotion")) return "success";
  if (normalized.includes("mutation")) return "info";
  if (normalized.includes("mobilite") || normalized.includes("mobilité")) return "info";
  if (normalized.includes("recrutement")) return "warning";
  return "warning";
};

const getEvolutionLabel = (value) => {
  if (!value) return "—";
  const normalized = normalizeValue(value);
  if (!normalized) return "—";
  if (normalized.includes("promotion")) return "Promotion";
  if (normalized.includes("mutation")) return "Mutation";
  if (normalized.includes("mobilite") || normalized.includes("mobilité")) return "Mobilité";
  if (normalized.includes("recrutement")) return "Recrutement externe";
  return value;
};

const getRowDeptId = (row) => {
  if (!row || typeof row !== "object") return null;
  const directId =
    row.departement_id ??
    row.department_id ??
    row.departementId ??
    row.departmentId ??
    row.departementID ??
    row.departmentID ??
    null;
  if (directId != null && directId !== "") return normalizeId(directId);

  const nested = row.departement ?? row.department ?? null;
  if (nested && typeof nested === "object") {
    const nestedId =
      nested.id ??
      nested.value ??
      nested.departement_id ??
      nested.department_id ??
      nested.departementId ??
      nested.departmentId ??
      null;
    return normalizeId(nestedId);
  }
  return null;
};

const getRowDeptName = (row) => {
  if (!row || typeof row !== "object") return "";
  const directName =
    row.departement_name ??
    row.departementNom ??
    row.department_name ??
    row.departmentNom ??
    row.departementName ??
    row.departmentName ??
    row.departement ??
    row.department ??
    "";
  if (typeof directName === "string") return normalizeValue(directName);
  if (directName && typeof directName === "object") {
    const nestedName =
      directName.nom ??
      directName.name ??
      directName.label ??
      "";
    return normalizeValue(nestedName);
  }
  return normalizeValue(directName);
};

const getSelectedDeptId = (selected) => {
  if (!selected) return null;
  if (typeof selected === "object") {
    const raw =
      selected.id ??
      selected.value ??
      selected.departement_id ??
      selected.department_id ??
      selected.departementId ??
      selected.departmentId ??
      null;
    return normalizeId(raw);
  }
  return normalizeId(selected);
};

const getSelectedDeptName = (selected) => {
  if (!selected) return "";
  if (typeof selected === "object") {
    const raw = selected.nom ?? selected.name ?? selected.label ?? "";
    return normalizeValue(raw);
  }
  return normalizeValue(selected);
};

const findDepartmentById = (departments, targetId) => {
  if (!Array.isArray(departments) || !targetId) return null;
  const target = String(targetId);
  for (let dept of departments) {
    if (String(dept.id) === target) return dept;
    if (dept.children && dept.children.length > 0) {
      const found = findDepartmentById(dept.children, targetId);
      if (found) return found;
    }
  }
  return null;
};

const CarrieresTable = forwardRef((props, ref) => {
  const {
    globalSearch,
    setIsAddingCarriere,
    departementId,
    departementName,
    includeSubDepartments,
    departements,
    filtersVisible,
    handleFiltersToggle,
    selectedEmployee: preSelectedEmployee,
    onEmployeeSelect,
  } = props;

  const [carriereRows, setCarriereRows] = useState([]);
  const [loadingCarrieres, setLoadingCarrieres] = useState(false);

  const fetchCarrieres = useCallback(async () => {
    let hasCachedData = false;
    
    // Load from cache immediately for instant display
    try {
      const cachedData = localStorage.getItem('carrieres_cache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCarriereRows(parsed);
          setLoadingCarrieres(false);
          hasCachedData = true;
          if (DEBUG_CARRIERES) console.log("[Carrieres] Loaded from cache:", parsed.length, "rows");
        }
      }
    } catch (e) {
      console.warn('Cache carrières invalide:', e);
    }

    // Fetch fresh data from API in background
    setLoadingCarrieres(true);
    try {
      const response = await apiClient.get("/carrieres");
      const data = Array.isArray(response.data) ? response.data : (response.data?.data ?? []);
      setCarriereRows(data);
      if (DEBUG_CARRIERES) console.log("[Carrieres] Fetched from API:", data.length, "rows");
      // Cache will be updated automatically by the useEffect
    } catch (error) {
      console.error("[Carrieres] Failed to fetch:", error);
      if (!hasCachedData) {
        setCarriereRows([]);
      }
    } finally {
      setLoadingCarrieres(false);
    }
  }, []);

  useEffect(() => {
    fetchCarrieres();
  }, [fetchCarrieres]);

  // Auto-update cache whenever carriereRows changes
  useEffect(() => {
    if (carriereRows.length > 0) {
      try {
        localStorage.setItem('carrieres_cache', JSON.stringify(carriereRows));
      } catch (e) {
        console.warn('Erreur mise à jour cache carrières:', e);
      }
    }
  }, [carriereRows]);

  const [selectedCarriere, setSelectedCarriere] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    filters: [
      {
        key: "matricule",
        label: "Matricule",
        type: "select",
        value: "",
        options: [],
        placeholder: "Tous",
      },
      {
        key: "full_name",
        label: "Employé",
        type: "select",
        value: "",
        options: [],
        placeholder: "Tous",
      },
      {
        key: "poste_actuel",
        label: "Poste",
        type: "select",
        value: "",
        options: [],
        placeholder: "Tous",
      },
      {
        key: "manager_name",
        label: "Manager",
        type: "select",
        value: "",
        options: [],
        placeholder: "Tous",
      },
      {
        key: "grade",
        label: "Grade",
        type: "select",
        value: "",
        options: [],
        placeholder: "Tous",
      },
      {
        key: "type_evolution",
        label: "Type évolution",
        type: "select",
        value: "",
        options: [],
        placeholder: "Tous",
      },
      {
        key: "promotion",
        label: "Dernière promotion",
        type: "dateRange",
        dateDebut: "",
        dateFin: "",
        placeholderDebut: "Date début",
        placeholderFin: "Date fin",
      },
    ],
  });

  const dropdownRef = useRef(null);
  const selectedDeptId = getSelectedDeptId(departementId);
  const selectedDeptName = useMemo(() => {
    if (departementName) return normalizeValue(departementName);
    const fromPayload = getSelectedDeptName(departementId);
    if (fromPayload) return fromPayload;
    if (selectedDeptId) {
      const found = findDepartmentById(departements, selectedDeptId);
      if (found?.nom) return normalizeValue(found.nom);
      if (found?.name) return normalizeValue(found.name);
    }
    return "";
  }, [departementName, departementId, departements, selectedDeptId]);
  const hasSelectedDepartement = Boolean(selectedDeptId || selectedDeptName);

  // Fermer tous les drawers lors du changement de département
  useEffect(() => {
    setShowAddForm(false);
    setSelectedCarriere(null);
    setSelectedEmployee(null);
    setIsAddingCarriere(false);
  }, [departementId, setIsAddingCarriere]);

  const allColumns = useMemo(
    () => [
      { key: "matricule", label: "Matricule" },
      {
        key: "full_name",
        label: "Employé",
        render: (item) => (
          <span
            title={item.full_name || "-"}
            style={{
              display: "inline-block",
              maxWidth: "160px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              verticalAlign: "middle",
            }}
          >
            {item.full_name || "-"}
          </span>
        ),
      },
      {
        key: "poste_actuel",
        label: "Poste actuel",
        render: (item) => (
          <span
            title={item.poste_actuel || "-"}
            style={{
              display: "inline-block",
              maxWidth: "180px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              verticalAlign: "middle",
            }}
          >
            {item.poste_actuel || "-"}
          </span>
        ),
      },
      {
        key: "grade",
        label: "Grade",
        render: (item) => <span>{item.grade || "-"}</span>,
      },
      {
        key: "manager_name",
        label: "Manager",
        render: (item) => {
          const managerName = item.manager_name || item.manager?.nom_complet;
          const managerMatricule = item.manager?.matricule;
          if (!managerName) return <span>-</span>;
          const managerText = `${managerName}${managerMatricule ? ` (${managerMatricule})` : ""}`;
          return (
            <span
              title={managerText}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                maxWidth: "210px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                verticalAlign: "middle",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "999px",
                  backgroundColor: "#3b82f6",
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {managerText}
              </span>
            </span>
          );
        },
      },
      {
        key: "periode",
        label: "Période",
        render: (item) => <span>{formatDuration(getStartDate(item), new Date())}</span>,
      },
      {
        key: "type_evolution",
        label: "Type d’évolution",
        render: (item) => {
          const value = getEvolutionLabel(getTypeEvolution(item));
          return (
            <span className={`career-badge ${getEvolutionBadgeClass(value)}`}>
              {value}
            </span>
          );
        },
      },
      {
        key: "derniere_promotion",
        label: "Dernière promotion",
        render: (item) => <span>{formatDate(item.derniere_promotion)}</span>,
      },
    ],
    []
  );

  const visibleColumns = useMemo(() => {
    return allColumns.filter((col) => columnVisibility[col.key]);
  }, [allColumns, columnVisibility]);

  useEffect(() => {
    const savedColumnVisibility = localStorage.getItem("carrieresColumnVisibility");

    if (savedColumnVisibility) {
      const parsed = JSON.parse(savedColumnVisibility);
      const merged = { ...parsed };
      allColumns.forEach((col) => {
        if (merged[col.key] === undefined) merged[col.key] = true;
      });
      setColumnVisibility(merged);
      localStorage.setItem("carrieresColumnVisibility", JSON.stringify(merged));
    } else {
      const defaultVisibility = {};
      allColumns.forEach((col) => {
        defaultVisibility[col.key] = true;
      });
      setColumnVisibility(defaultVisibility);
      localStorage.setItem("carrieresColumnVisibility", JSON.stringify(defaultVisibility));
    }
  }, [allColumns]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!hasSelectedDepartement && showAddForm) {
      setSelectedCarriere(null);
      setShowAddForm(false);
      setIsAddingCarriere(false);
    }
    setSelectedItems([]);
    setCurrentPage(0);
  }, [hasSelectedDepartement, showAddForm, setIsAddingCarriere, departementId]);

  const baseRows = useMemo(() => {
    return Array.isArray(carriereRows) ? carriereRows : [];
  }, [carriereRows]);

  const departmentNameSet = useMemo(() => {
    if (!hasSelectedDepartement) return new Set();

    const names = [];

    const addNames = (dept) => {
      if (!dept) return;
      names.push(dept.nom);
      if (dept.children && dept.children.length > 0) {
        dept.children.forEach(addNames);
      }
    };

    const findDepartment = (list, id) => {
      for (let dept of list) {
        if (dept.id === id) return dept;
        if (dept.children && dept.children.length > 0) {
          const found = findDepartment(dept.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    if (includeSubDepartments && selectedDeptId) {
      const target = findDepartment(departements, Number(selectedDeptId));
      addNames(target);
    } else if (selectedDeptName) {
      names.push(selectedDeptName);
    }

    return new Set(names.map((name) => normalizeValue(name)));
  }, [hasSelectedDepartement, includeSubDepartments, departements, selectedDeptId, selectedDeptName]);

  const departmentIdSet = useMemo(() => {
    if (!selectedDeptId) return new Set();

    const ids = new Set();

    const addIds = (dept) => {
      if (!dept) return;
      ids.add(String(dept.id));
      if (dept.children && dept.children.length > 0) {
        dept.children.forEach(addIds);
      }
    };

    const findDepartment = (list, id) => {
      for (let dept of list) {
        if (dept.id === id) return dept;
        if (dept.children && dept.children.length > 0) {
          const found = findDepartment(dept.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    if (includeSubDepartments) {
      const target = findDepartment(departements, Number(selectedDeptId));
      addIds(target);
    } else {
      ids.add(String(selectedDeptId));
    }

    return ids;
  }, [selectedDeptId, includeSubDepartments, departements]);

  const filteredCarriereData = useMemo(() => {
    if (preSelectedEmployee?.id) {
      return baseRows.filter(
        (row) =>
          normalizeId(row.employe_id) === normalizeId(preSelectedEmployee.id) ||
          normalizeId(row.id_employe) === normalizeId(preSelectedEmployee.id)
      );
    }

    if (!hasSelectedDepartement) {
      return [];
    }

    const normalizedNames = departmentNameSet.size
      ? departmentNameSet
      : selectedDeptName
        ? new Set([normalizeValue(selectedDeptName)])
        : new Set();

    const filtered = baseRows.filter((row) => {
      const rowDeptId = getRowDeptId(row);
      if (rowDeptId) {
        return departmentIdSet.has(rowDeptId);
      }
      const rowDeptName = getRowDeptName(row);
      return normalizedNames.has(rowDeptName);
    });

    if (DEBUG_CARRIERES) {
      console.log("[Carrieres] preSelectedEmployee:", preSelectedEmployee);
      console.log("[Carrieres] selectedDeptId:", selectedDeptId, "selectedDeptName:", selectedDeptName);
      console.log("[Carrieres] baseRows:", baseRows.length, "filteredRows:", filtered.length);
    }

    return filtered;
  }, [
    baseRows,
    departmentIdSet,
    departmentNameSet,
    hasSelectedDepartement,
    selectedDeptId,
    selectedDeptName,
    preSelectedEmployee,
  ]);

  // Mettre à jour les options de filtres à partir des lignes du contexte courant (département/employé)
  useEffect(() => {
    const rowsSource = Array.isArray(filteredCarriereData) ? filteredCarriereData : [];
    const matricules = [...new Set(rowsSource.map((row) => row.matricule).filter(Boolean))];
    const employes = [...new Set(rowsSource.map((row) => row.full_name).filter(Boolean))];
    const postes = [...new Set(rowsSource.map((row) => row.poste_actuel).filter(Boolean))];
    const managers = [...new Set(rowsSource.map((row) => row.manager_name || row.manager?.nom_complet).filter(Boolean))];
    const grades = [...new Set(rowsSource.map((row) => row.grade).filter(Boolean))];
    const evolutions = [...new Set(rowsSource.map((row) => getEvolutionLabel(getTypeEvolution(row))).filter((v) => v && v !== "—"))];

    setFilterOptions((prev) => ({
      ...prev,
      filters: prev.filters.map((f) => {
        let options = f.options || [];
        if (f.key === "matricule") {
          options = matricules.map((v) => ({ label: String(v), value: String(v) }));
        } else if (f.key === "full_name") {
          options = employes.map((v) => ({ label: v, value: v }));
        } else if (f.key === "poste_actuel") {
          options = postes.map((v) => ({ label: v, value: v }));
        } else if (f.key === "manager_name") {
          options = managers.map((v) => ({ label: v, value: v }));
        } else if (f.key === "grade") {
          options = grades.map((v) => ({ label: v, value: v }));
        } else if (f.key === "type_evolution") {
          options = evolutions.map((v) => ({ label: v, value: v }));
        }

        if (f.type === "select" && f.value && !options.some((opt) => normalizeValue(opt.value) === normalizeValue(f.value))) {
          return { ...f, value: "", options };
        }

        return { ...f, options };
      }),
    }));
  }, [filteredCarriereData]);

  const employeeHasCareer = useMemo(() => {
    if (preSelectedEmployee?.id) {
      return filteredCarriereData.length > 0;
    }
    return false;
  }, [preSelectedEmployee, filteredCarriereData]);

  const applyFilters = useCallback(
    (rows) =>
      rows.filter((row) => {
        const promotionFilter = filterOptions.filters.find((f) => f.key === "promotion");

        const matchesSelectFilters = filterOptions.filters.every((filter) => {
          if (filter.type !== "select" || !filter.value) return true;

          if (filter.key === "type_evolution") {
            return normalizeValue(getEvolutionLabel(getTypeEvolution(row))) === normalizeValue(filter.value);
          }

          return normalizeValue(row[filter.key]) === normalizeValue(filter.value);
        });

        const matchesPromotion = (() => {
          if (!promotionFilter?.dateDebut && !promotionFilter?.dateFin) return true;
          const promotionDate = new Date(row.derniere_promotion);
          if (isNaN(promotionDate.getTime())) return true;

          if (promotionFilter.dateDebut) {
            const startDate = new Date(promotionFilter.dateDebut);
            if (promotionDate < startDate) return false;
          }

          if (promotionFilter.dateFin) {
            const endDate = new Date(promotionFilter.dateFin);
            if (promotionDate > endDate) return false;
          }

          return true;
        })();

        return matchesSelectFilters && matchesPromotion;
      }),
    [filterOptions.filters]
  );

  const normalizedGlobalSearch = normalizeValue(globalSearch);
  const filteredCarriereDataForFilters = applyFilters(
    filteredCarriereData.filter((row) => {
      return (
        normalizeValue(row.full_name).includes(normalizedGlobalSearch) ||
        normalizeValue(row.matricule).includes(normalizedGlobalSearch) ||
        normalizeValue(row.poste_actuel).includes(normalizedGlobalSearch) ||
        normalizeValue(row.manager_name || row.manager?.nom_complet).includes(normalizedGlobalSearch) ||
        normalizeValue(row.grade).includes(normalizedGlobalSearch) ||
        normalizeValue(getEvolutionLabel(getTypeEvolution(row))).includes(normalizedGlobalSearch) ||
        normalizeValue(row.derniere_promotion).includes(normalizedGlobalSearch) ||
        normalizeValue(formatDuration(getStartDate(row), new Date())).includes(normalizedGlobalSearch)
      );
    })
  );

  // Calculate unique employees count (1 employee = 1 career)
  const uniqueEmployeesCount = useMemo(() => {
    const uniqueMatricules = new Set(
      filteredCarriereDataForFilters
        .map(row => row.matricule)
        .filter(matricule => matricule != null && matricule !== "")
    );
    return uniqueMatricules.size;
  }, [filteredCarriereDataForFilters]);

  const handleColumnsChange = useCallback((column) => {
    setColumnVisibility((prev) => {
      const newVisibility = { ...prev, [column]: !prev[column] };
      localStorage.setItem("carrieresColumnVisibility", JSON.stringify(newVisibility));
      return newVisibility;
    });
  }, []);

  const handleCarriereAdded = useCallback(() => {
    fetchCarrieres();
  }, [fetchCarrieres]);

  const handleCarriereUpdated = useCallback(() => {
    fetchCarrieres();
  }, [fetchCarrieres]);

  const handleDeleteCarriere = useCallback(async (id) => {
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
        await apiClient.delete(`/carrieres/${id}`);
        Swal.fire("Supprimé!", "La carrière a été supprimée.", "success");
        fetchCarrieres();
      } catch (error) {
        console.error("Delete error:", error);
        Swal.fire("Erreur", "Impossible de supprimer cette carrière.", "error");
      }
    }
  }, [fetchCarrieres]);

  const handleAddNewCarriere = useCallback(() => {
    if (!hasSelectedDepartement || showAddForm) {
      return;
    }
    setSelectedCarriere(null);
    setShowAddForm(true);
    setIsAddingCarriere(true);
  }, [hasSelectedDepartement, showAddForm, setIsAddingCarriere]);

  const handleEditCarriere = useCallback(
    (carriere) => {
      setSelectedEmployee(null);
      setSelectedCarriere(carriere);
      setShowAddForm(true);
      setIsAddingCarriere(true);
    },
    [setIsAddingCarriere]
  );

  const handleCloseForm = useCallback(() => {
    setSelectedCarriere(null);
    setShowAddForm(false);
    setIsAddingCarriere(false);
  }, [setIsAddingCarriere]);

  const handleViewParcours = useCallback(async (employee) => {
    // Fermer le drawer d'ajout/modification immédiatement
    setSelectedCarriere(null);
    setShowAddForm(false);
    setIsAddingCarriere(false);

    const employeId =
      employee?.employe_id ??
      employee?.id_employe ??
      employee?.employee_id ??
      employee?.employe?.id ??
      preSelectedEmployee?.id ??
      employee?.id;
    
    const employeeMatricule = employee.matricule || employee.matricule_employe || "—";
    
    // Récupérer TOUTES les lignes de carrière de cet employé depuis le tableau
    const employeeCareerLines = filteredCarriereData.filter(row => 
      (row.matricule === employeeMatricule || 
       row.matricule_employe === employeeMatricule) &&
      employeeMatricule !== "—"
    );
    
    console.log('🔍 Career lines for matricule', employeeMatricule, ':', employeeCareerLines);
    
    // Construire l'historique initial à partir des lignes du tableau
    const initialHistorique = employeeCareerLines
      .map(line => ({
        type: 'poste',
        poste: line.poste_actuel || line.posteActuel || line.poste || "—",
        grade: line.grade || "—",
        start: line.date_debut_poste || line.date_debut || line.dateDebut || null,
        end: line.date_fin_poste || line.date_fin || line.dateFin || null,
        evolution: line.type_evolution || line.evolution || line.type_dev || "—",
        statut: line.statut,
        duration: line.duration,
      }))
      .sort((a, b) => {
        // Trier par date de début (plus récent en premier)
        const dateA = a.start ? new Date(a.start).getTime() : 0;
        const dateB = b.start ? new Date(b.start).getTime() : 0;
        return dateB - dateA;
      });
    
    // Construire les formations initiales depuis employee si disponibles
    const initialFormations = Array.isArray(employee.formations) 
      ? employee.formations.map(f => ({
          type: 'formation',
          formation: f.intitule || f.formation || f.nom || "Formation",
          domaine: f.domaine || "",
          start: f.date_debut || null,
          end: f.date_fin || null,
          date_debut: f.date_debut || null,
          date_fin: f.date_fin || null,
        }))
      : [];
    
    console.log('🎓 FORMATIONS INITIALES:', initialFormations);
    
    const mapped = {
      id: employeId ?? null,
      matricule: employeeMatricule,
      full_name:
        employee.full_name ||
        employee.employe ||
        employee.nom_complet ||
        [preSelectedEmployee?.nom, preSelectedEmployee?.prenom].filter(Boolean).join(" ") ||
        "—",
      departement: employee.departement || employee.departement_name || employee.departementNom || "—",
      poste_actuel: employee.poste_actuel || employee.posteActuel || employee.poste || "—",
      grade: employee.grade || "—",
      date_debut_poste: employee.date_debut_poste || employee.dateDebutPoste || null,
      manager_id: employee.manager_id || employee.manager?.id || null,
      manager_name: employee.manager_name || employee.manager?.nom_complet || "",
      manager: employee.manager || null,
      promotions: initialHistorique,
      historique: [...initialHistorique, ...initialFormations].sort((a, b) => {
        const dateA = a.start ? new Date(a.start).getTime() : 0;
        const dateB = b.start ? new Date(b.start).getTime() : 0;
        return dateB - dateA;
      }),
      competences: employee.competences || employee.skills || [],
      formations: initialFormations,
    };
    
    // Mettre à jour immédiatement avec les données de base pour un feedback rapide
    setSelectedEmployee(mapped);
    
    // Notifier le parent (CarrieresPage) pour synchroniser l'employé sélectionné
    if (onEmployeeSelect) {
      onEmployeeSelect({
        id: employeId,
        matricule: employeeMatricule,
        nom: employee.nom || preSelectedEmployee?.nom || "",
        prenom: employee.prenom || preSelectedEmployee?.prenom || "",
        full_name: mapped.full_name,
      });
    }

    if (!employeId) return;

    try {
      const response = await apiClient.get(`/employes/${employeId}/parcours`);
      const payload = response?.data ?? {};
      const rawParcours = Array.isArray(payload?.parcours)
        ? payload.parcours
        : Array.isArray(payload)
          ? payload
          : [];

      console.log('📊 PARCOURS DATA:', rawParcours);

      // Séparer les formations des postes dans la réponse API
      const formationsFromAPI = rawParcours
        .filter(item => item.type === 'formation')
        .map((item) => ({
          type: 'formation',
          formation: item.formation || item.intitule || "Formation",
          domaine: item.domaine || "",
          start: item.date_debut || null,
          end: item.date_fin || null,
          date_debut: item.date_debut || null,
          date_fin: item.date_fin || null,
        }));

      console.log('📚 FORMATIONS FROM API:', formationsFromAPI);

      // Vérifier que l'employé sélectionné est toujours le même avant de mettre à jour
      setSelectedEmployee((prev) => {
        // Si l'employé a changé entre-temps, ne pas mettre à jour
        if (prev?.id !== employeId) return prev;
        
        // Fusionner l'historique du tableau avec les formations de l'API
        const postesFromTable = (prev.historique || []).filter(item => item.type !== 'formation');
        
        // Garder les formations déjà présentes si l'API n'en retourne pas
        const formationsToUse = formationsFromAPI.length > 0 ? formationsFromAPI : (prev.formations || []);
        
        const mergedHistorique = [...postesFromTable, ...formationsToUse]
          .sort((a, b) => {
            const dateA = a.start ? new Date(a.start).getTime() : 0;
            const dateB = b.start ? new Date(b.start).getTime() : 0;
            return dateB - dateA;
          });
        
        console.log('✅ MERGED HISTORIQUE:', mergedHistorique);
        
        return {
          ...prev,
          historique: mergedHistorique,
          promotions: mergedHistorique,
          formations: formationsToUse,
          postes_en_attente: payload.postes_en_attente || [],
          full_name: payload.full_name || prev.full_name,
          matricule: payload.matricule || prev.matricule,
          email: payload.email || prev.email,
          telephone: payload.telephone || payload.tel || prev.telephone,
          date_embauche: payload.date_embauche || prev.date_embauche,
          date_entree: payload.date_entree || prev.date_entree,
          type_contrat: payload.type_contrat || prev.type_contrat,
          contrat: payload.contrat || prev.contrat,
          competences: payload.competences || prev.competences,
          manager_id: payload.manager_id ?? prev.manager_id,
          manager: payload.manager ?? prev.manager,
          manager_name: payload.manager?.nom_complet || prev.manager_name,
        };
      });
    } catch (error) {
      // Keep the drawer open with base info if parcours fails
      console.error("PARCOURS_LOAD_ERROR", error);
      console.log("Employee data preserved:", error);
    }
  }, [setIsAddingCarriere, preSelectedEmployee, filteredCarriereData]);

  const getColumnValue = useCallback((item, column) => {
    if (column.key === "periode") {
      const start = getStartDate(item);
      const end = item.date_fin_poste || item.date_fin || null;
      return formatDuration(start, end ? new Date(end) : new Date());
    }
    if (column.key === "type_evolution") {
      return getEvolutionLabel(getTypeEvolution(item));
    }
    if (column.key === "derniere_promotion") {
      return formatDate(item.derniere_promotion);
    }
    return item[column.key];
  }, []);
  const exportToPDF = useCallback(() => {
    const doc = new jsPDF();
    const tableColumn = allColumns.filter((col) => columnVisibility[col.key]).map((col) => col.label);
    const tableRows = filteredCarriereDataForFilters.map((item) =>
      allColumns
        .filter((col) => columnVisibility[col.key])
        .map((col) => getColumnValue(item, col))
    );
    doc.setFontSize(18);
    doc.text(`Carrières - ${departementName || ""}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
    });
    doc.save(`carrieres_${departementName || "departement"}_${new Date().toISOString()}.pdf`);
  }, [allColumns, columnVisibility, filteredCarriereDataForFilters, departementName, getColumnValue]);

  const exportToExcel = useCallback(() => {
    const ws = XLSX.utils.json_to_sheet(
      filteredCarriereDataForFilters.map((item) => {
        const row = {};
        allColumns.forEach((col) => {
          if (columnVisibility[col.key]) {
            row[col.label] = getColumnValue(item, col);
          }
        });
        return row;
      })
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Carrières");
    XLSX.writeFile(wb, `carrieres_${departementName || "departement"}_${new Date().toISOString()}.xlsx`);
  }, [allColumns, columnVisibility, filteredCarriereDataForFilters, departementName, getColumnValue]);

  const handlePrint = useCallback(() => {
    const printWindow = window.open("", "_blank");
    const tableColumn = allColumns.filter((col) => columnVisibility[col.key]).map((col) => col.label);
    const tableRows = filteredCarriereDataForFilters.map((item) =>
      allColumns
        .filter((col) => columnVisibility[col.key])
        .map((col) => getColumnValue(item, col))
    );

    const tableHtml = `
      <html>
        <head>
          <title>Carrières - ${departementName || ""}</title>
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Carrières - ${departementName || ""}</h1>
          <table>
            <thead>
              <tr>${tableColumn.map((col) => `<th>${col}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${tableRows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(tableHtml);
    printWindow.document.close();
    printWindow.print();
  }, [allColumns, columnVisibility, filteredCarriereDataForFilters, departementName, getColumnValue]);

  const handleSelectAllChange = useCallback(
    (eventOrChecked) => {
      const checked =
        typeof eventOrChecked === "boolean"
          ? eventOrChecked
          : Boolean(eventOrChecked?.target?.checked);

      if (checked) {
        setSelectedItems(filteredCarriereDataForFilters.map((item) => item.id));
      } else {
        setSelectedItems([]);
      }
    },
    [filteredCarriereDataForFilters]
  );

  const handleCheckboxChange = useCallback((id) => {
    setSelectedItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
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
        await Promise.all(selectedItems.map((itemId) => apiClient.delete(`/carrieres/${itemId}`)));
        setSelectedItems([]);
        Swal.fire("Supprimées!", "Les carrières ont été supprimées.", "success");
        fetchCarrieres();
      } catch (error) {
        console.error("Delete selected error:", error);
        Swal.fire("Erreur", "Impossible de supprimer les carrières.", "error");
      }
    }
  }, [selectedItems]);

  useImperativeHandle(
    ref,
    () => ({
      exportToPDF,
      exportToExcel,
      handlePrint,
      refreshData: fetchCarrieres,
    }),
    [exportToPDF, exportToExcel, handlePrint, fetchCarrieres]
  );

  const handleChangePage = useCallback((event, newPage) => {
    setCurrentPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setItemsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(0);
  }, []);

  const handleFilterChange = (key, value) => {
    setFilterOptions((prev) => {
      const newFilters = prev.filters.map((filter) => {
        if (filter.key === key && filter.type === "select") {
          return { ...filter, value };
        }
        return filter;
      });
      return { ...prev, filters: newFilters };
    });
  };

  const handleRangeFilterChange = (key, type, value) => {
    setFilterOptions((prev) => {
      const newFilters = prev.filters.map((filter) => {
        if (filter.key === key && (filter.type === "range" || filter.type === "dateRange")) {
          return { ...filter, [type]: value };
        }
        return filter;
      });
      return { ...prev, filters: newFilters };
    });
  };

  const handleResetFilters = useCallback(() => {
    setFilterOptions((prev) => ({
      ...prev,
      filters: prev.filters.map((filter) => {
        if (filter.type === "dateRange" || filter.type === "range") {
          return { ...filter, dateDebut: "", dateFin: "" };
        }
        return { ...filter, value: "" };
      }),
    }));
    setCurrentPage(0);
  }, []);

  const visibleFilters = useMemo(() => {
    if (preSelectedEmployee?.id) {
      return filterOptions.filters.filter(
        (filter) => filter.key !== "matricule" && filter.key !== "full_name"
      );
    }
    return filterOptions.filters;
  }, [filterOptions.filters, preSelectedEmployee]);

  const highlightText = useCallback((text, searchTerm) => {
    if (!text || !searchTerm) return text;
    const textStr = String(text);
    const searchTermLower = searchTerm.toLowerCase();
    if (!textStr.toLowerCase().includes(searchTermLower)) return textStr;
    const parts = textStr.split(new RegExp(`(${searchTerm})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === searchTermLower ? (
        <mark key={i} style={{ backgroundColor: "yellow" }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  }, []);

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

  const CustomMenu = React.forwardRef(({ className, "aria-labelledby": labeledBy }, menuRef) => {
    return (
      <div
        ref={menuRef}
        style={{
          padding: "10px",
          backgroundColor: "white",
          border: "1px solid #ccc",
          borderRadius: "5px",
          maxHeight: "400px",
          overflowY: "auto",
        }}
        className={className}
        aria-labelledby={labeledBy}
      >
        <Form onClick={(event) => event.stopPropagation()}>
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
  });
  return (
    <>
      <style>{`
        .with-split-view .addemp-overlay,
        .with-split-view .add-cnss-container,
        .with-split-view .add-accident-container,
        .with-split-view .side-panel-container,
        .with-split-view .career-drawer-content,
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

        @media (max-width: 1200px) {
          .with-split-view {
            flex-direction: column !important;
            gap: 16px !important;
          }
          .with-split-view .career-table-panel,
          .with-split-view .career-form-panel {
            flex: 1 1 auto !important;
            max-width: 100% !important;
            width: 100% !important;
          }
        }
      `}</style>

      <div
        className="with-split-view"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: "24px",
          boxSizing: "border-box",
          alignItems: "stretch",
          height: "100%",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <div
          className="career-table-panel"
          style={{
            gridColumn: showAddForm ? "span 7" : (selectedEmployee ? "span 8" : "span 12"),
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
            padding: "0 20px",
            backgroundColor: "white",
            boxSizing: "border-box",
            height: "100%",
            overflowY: "auto",
          }}
        >
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
                  <SectionTitle icon="fas fa-briefcase" text="Carrières" />
                </div>

                <div style={{ display: "flex", gap: "12px", alignItems: "center", justifySelf: "end" }}>
                  {true && (
                    <FontAwesomeIcon
                      onClick={() => handleFiltersToggle && handleFiltersToggle(!filtersVisible)}
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

                  {!employeeHasCareer && (
                    <Button
                      onClick={() => {
                        if (!hasSelectedDepartement) return;
                        handleAddNewCarriere();
                      }}
                      className={`d-flex align-items-center justify-content-center ${!hasSelectedDepartement ? "disabled-btn" : ""
                        }`}
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
                        boxShadow: hasSelectedDepartement
                          ? "0 3px 8px rgba(58, 138, 144, 0.28)"
                          : "none",
                      }}
                    >
                      <FaPlusCircle className="me-2" />
                      Ajouter à la carrière
                    </Button>
                  )}

                  {true && (
                    <Dropdown show={showDropdown} onToggle={(isOpen) => setShowDropdown(isOpen)}>
                      <Dropdown.Toggle
                        as="button"
                        id="dropdown-visibility"
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
                  padding: "15px 25px",
                  overflowX: "auto",
                  flexWrap: "nowrap",
                  width: "100%",
                  WebkitOverflowScrolling: "touch",
                  boxSizing: "border-box",
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a90a4" strokeWidth="2">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
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

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    flexWrap: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {visibleFilters.map((filter, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        margin: 0,
                        marginRight: "12px",
                        gap: "10px",
                      }}
                    >
                      <label
                        className="filter-label"
                        style={{
                          fontSize: "0.9rem",
                          margin: 0,
                          marginRight: "0",
                          whiteSpace: "nowrap",
                          minWidth: "auto",
                          fontWeight: 600,
                          color: "#2c3e50",
                        }}
                      >
                        {filter.label}
                      </label>

                      {filter.type === "select" ? (
                        <select
                          value={filter.value}
                          onChange={(event) => handleFilterChange(filter.key, event.target.value)}
                          className="filter-input"
                          style={{
                            minWidth: 140,
                            maxWidth: 170,
                            height: 30,
                            fontSize: "0.9rem",
                            padding: "2px 6px",
                            borderRadius: 6,
                          }}
                        >
                          <option value="">{filter.placeholder}</option>
                          {filter.options?.map((option, optIndex) => (
                            <option key={optIndex} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : filter.type === "dateRange" ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <input
                            type="date"
                            value={filter.dateDebut}
                            onChange={(event) =>
                              handleRangeFilterChange(filter.key, "dateDebut", event.target.value)
                            }
                            placeholder={filter.placeholderDebut}
                            className="filter-input filter-range-input"
                            style={{
                              minWidth: 128,
                              maxWidth: 130,
                              height: 30,
                              fontSize: "0.9rem",
                              padding: "2px 4px",
                              borderRadius: 6,
                            }}
                          />
                          <span
                            className="filter-range-separator"
                            style={{
                              margin: "0 2px",
                              fontSize: "0.9rem",
                              color: "#666",
                            }}
                          >
                            -
                          </span>
                          <input
                            type="date"
                            value={filter.dateFin}
                            onChange={(event) =>
                              handleRangeFilterChange(filter.key, "dateFin", event.target.value)
                            }
                            placeholder={filter.placeholderFin}
                            className="filter-input filter-range-input"
                            style={{
                              minWidth: 128,
                              maxWidth: 130,
                              height: 30,
                              fontSize: "0.9rem",
                              padding: "2px 4px",
                              borderRadius: 6,
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

            .custom-modal-excel .modal-content {
              animation: fadeIn 0.3s;
              border-radius: 12px;
              border: none;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            }

            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            button:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }

            .fa-trash:hover {
              color: #ff3742 !important;
              transform: scale(1.1);
            }

            .custom-header th {
              background-color: rgba(0, 175, 170, 0.05);
              border-color: #e0e0e0;
            }

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
            data={hasSelectedDepartement ? filteredCarriereDataForFilters : []}
            loading={hasSelectedDepartement && false}
            loadingText="Chargement des carrières..."
            searchTerm={normalizedGlobalSearch}
            highlightText={highlightText}
            selectAll={
              selectedItems.length === filteredCarriereDataForFilters.length &&
              filteredCarriereDataForFilters.length > 0
            }
            selectedItems={selectedItems}
            handleSelectAllChange={handleSelectAllChange}
            handleCheckboxChange={handleCheckboxChange}
            handleEdit={handleEditCarriere}
            handleDelete={handleDeleteCarriere}
            handleDeleteSelected={handleDeleteSelected}
            rowsPerPage={itemsPerPage}
            page={currentPage}
            handleChangePage={handleChangePage}
            handleChangeRowsPerPage={handleChangeRowsPerPage}
            expandedRows={[]}
            toggleRowExpansion={() => { }}
            renderExpandedRow={() => null}
            renderActions={(rowData) => {
              return (
                <button
                  className="btn btn-sm"
                  style={{ backgroundColor: "#2c767c", color: "white" }}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleViewParcours(rowData);
                  }}
                >
                  Voir parcours
                </button>
              );
            }}
          />
        </div>

        {selectedEmployee && (
          <div style={{ height: "100%", gridColumn: "span 4", position: "relative" }}>
            <style>{`
              .employee-drawer-wrapper {
                height: 100%;
                overflow: hidden;
              }
              
              .employee-drawer-wrapper > div {
                width: 100% !important;
                flex: 1 !important;
                box-shadow: 0 2px 12px rgba(0,0,0,0.07) !important;
                border-radius: 10px !important;
                border: 1px solid #e2e8f0 !important;
                height: 100% !important; 
                overflow: hidden !important;
                display: flex !important;
                flex-direction: column !important;
              }
              
              @keyframes slideInRight {
                from {
                  opacity: 0;
                  transform: translateX(20px);
                }
                to {
                  opacity: 1;
                  transform: translateX(0);
                }
              }
              
              .employee-drawer-wrapper {
                animation: slideInRight 0.3s ease-out;
              }
            `}</style>
            <div className="employee-drawer-wrapper" key={selectedEmployee.id}>
              <EmployeeProfileDrawer
                employee={selectedEmployee}
                onClose={() => setSelectedEmployee(null)}
              />
            </div>
          </div>
        )}

        {showAddForm && (
          <div
            className="career-form-panel"
            style={{
              gridColumn: "span 5",
              height: "100%",
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
              position: "relative",
              boxSizing: "border-box"
            }}
          >
            <AddCarriere
              toggleCarriereForm={handleCloseForm}
              departementId={departementId}
              selectedDepartementName={departementName}
              onCarriereAdded={handleCarriereAdded}
              selectedCarriere={selectedCarriere}
              onCarriereUpdated={handleCarriereUpdated}
              preSelectedEmployee={preSelectedEmployee}
            />
          </div>
        )}
      </div>

    </>
  );
});

export default CarrieresTable;
