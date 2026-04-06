import React, { useState, useEffect, useCallback, useMemo, Component } from "react";
import PropTypes from "prop-types";
import apiClient from "../../../services/apiClient";
import { Button, Badge, Dropdown, Form } from "react-bootstrap";
import { FaPlusCircle, FaEye } from "react-icons/fa";
import { BarChart2 } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faClose, faSliders, faFileAlt, faChevronDown, faChevronUp, faDownload, faTrash } from "@fortawesome/free-solid-svg-icons";
import { AnimatePresence, motion } from "framer-motion";
import DepartmentPanel from "../../../ComponentHistorique/DepartementPanel";
import AddMutuelleOperation from "./AddMutuelleOperation";
import OperationDetails from "./OperationDetails";
import OperationStatsPanel from "./OperationStatsPanel";
import ExpandRTable from "../../Shared/ExpandRTable";
import {
  showSuccessMessage,
  showErrorMessage,
  showErrorFromResponse,
  showConfirmDialog,
  showInfoMessage,
  STANDARD_MESSAGES
} from "../../../utils/messageHelper";
import "../AffiliationMutuelle/AffiliationMutuelleManager.css";
import "../../Employe/DepartementManager.css";
import "../../Style.css";
import "./GestionOperationsEmployes.css";
import { useHeader } from "../../../Acceuil/HeaderContext";

// Error Boundary pour capturer les erreurs
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red' }}>
          <h2>Une erreur s'est produite</h2>
          <pre>{this.state.error?.message}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

const api = apiClient;

const OPERATION_TYPE_OPTIONS = [
  { value: "", label: "Tous" },
  { value: "DEPOT_DOSSIER", label: "Dépôt Dossier" },
  { value: "REMBOURSEMENT", label: "Remboursement" },
  { value: "PRISE_EN_CHARGE", label: "Prise en Charge" },
  { value: "RECLAMATION", label: "Réclamation" },
  { value: "ATTESTATION", label: "Attestation" },
  { value: "REGULARISATION", label: "Régularisation" },
  { value: "AUTRE", label: "Autre" },
];

const normalizeTypeValue = (value) => {
  if (!value) return "";
  return value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
};

const STATUT_OPTIONS = [
  { value: "", label: "Tous" },
  { value: "EN_COURS", label: "En cours" },
  { value: "TERMINEE", label: "Validée" },
  { value: "REMBOURSEE", label: "Remboursée" },
  { value: "ANNULEE", label: "Refusée" },
];

const initialFilters = {
  dateOperationFrom: "",
  dateOperationTo: "",
  type: "",
  statut: "",
  dateRemboursementFrom: "",
  dateRemboursementTo: "",
};

const OPERATION_COLUMNS = [
  { key: "date_operation", label: "Date Op." },
  { key: "type_operation", label: "Type" },
  { key: "statut", label: "Statut" },
  { key: "beneficiaire", label: "Bénéficiaire" },
  { key: "montant_total", label: "Total" },
  { key: "montant_rembourse", label: "Remboursé" },
  { key: "reste_a_charge", label: "Reste" },
  { key: "date_remboursement", label: "Date Remb." },
  { key: "cout_documents", label: "Documents" },
  { key: "commentaire", label: "Commentaire" },
];

const getInitialOperationsColumnVisibility = () => {
  const defaults = {};
  OPERATION_COLUMNS.forEach((col) => (defaults[col.key] = true));
  const saved = localStorage.getItem("operationsColumnVisibility");
  if (saved) {
    try { return { ...defaults, ...JSON.parse(saved) }; }
    catch { return defaults; }
  }
  return defaults;
};

function GestionOperationsEmployes() {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [allEmployees, setAllEmployees] = useState(() => {
    const cached = localStorage.getItem("employeesWithContracts");
    return cached ? JSON.parse(cached) : [];
  });

  const [departments, setDepartments] = useState(() => {
    const cached = localStorage.getItem('departmentPanelData');
    return cached ? JSON.parse(cached) : [];
  });
  const [operations, setOperations] = useState([]);
  const [loadingOperations, setLoadingOperations] = useState(false);
  const [showAddOperation, setShowAddOperation] = useState(false);
  const [includeSubDeps, setIncludeSubDeps] = useState(false);
  const [selectedEmployeesSet, setSelectedEmployeesSet] = useState(new Set());
  const [processedEmployeesSet] = useState(new Set());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(7);
  const { searchQuery } = useHeader();
  const normalizedSearch = (searchQuery || "").toLowerCase().trim();

  const [selectedOperation, setSelectedOperation] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showOperationDetails, setShowOperationDetails] = useState(false);
  const [selectedOperations, setSelectedOperations] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState(getInitialOperationsColumnVisibility);
  const [showStats, setShowStats] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const toggleRowExpansion = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const [filterOperationTypes, setFilterOperationTypes] = useState([
    { value: "", label: "Tous" },
    ...OPERATION_TYPE_OPTIONS.slice(1),
  ]);


  // Chargement dynamique des types d'opération depuis l'API
  const fetchFilterTypes = useCallback(() => {
    api.get('/mutuelles/parametrage/types-operations')
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          const opts = [
            { value: "", label: "Tous" },
            ...res.data.map((item) => ({
              value: normalizeTypeValue(item.label || item.value || item.code || item.nom),
              label: item.label || item.nom || item.value || item.code
            })),
          ];
          setFilterOperationTypes(opts);
        }
      })
      .catch(() => {/* garder les options statiques par défaut */ });
  }, []);

  // Rechargement au montage initial
  useEffect(() => { fetchFilterTypes(); }, [fetchFilterTypes]);

  // Rechargement à chaque ouverture du panneau filtres
  useEffect(() => { if (filtersVisible) fetchFilterTypes(); }, [filtersVisible, fetchFilterTypes]);

  // Rechargement quand le formulaire se ferme (l'utilisateur a pu modifier les types via le +)
  useEffect(() => { if (!showAddOperation) fetchFilterTypes(); }, [showAddOperation, fetchFilterTypes]);

  // Écouter les mises à jour globales des types d'opération (via CustomEvent)
  useEffect(() => {
    const handleUpdate = () => fetchFilterTypes();
    window.addEventListener('operationTypesUpdated', handleUpdate);
    return () => window.removeEventListener('operationTypesUpdated', handleUpdate);
  }, [fetchFilterTypes]);

  const findDepartmentName = useCallback(
    (deptId) => {
      const all = [];
      const walk = (nodes) => {
        nodes.forEach((d) => {
          all.push(d);
          if (d.children) walk(d.children);
        });
      };
      walk(departments);
      return all.find((d) => d.id === deptId)?.nom || `Département ${deptId} `;
    },
    [departments]
  );


  // Fonction pour récupérer les IDs des sous-départements (comme dans EmployeTable)
  const getSubDepartmentIds = useCallback((departmentsHierarchy, targetId) => {
    const allFoundIds = new Set([targetId]);

    const collectAll = (nodes) => {
      nodes.forEach(node => {
        if (!allFoundIds.has(node.id)) {
          allFoundIds.add(node.id);
          if (node.children) collectAll(node.children);
        }
      });
    };

    const findTarget = (nodes) => {
      for (const node of nodes) {
        if (node.id === targetId) {
          if (node.children) collectAll(node.children);
          return true;
        }
        if (node.children && findTarget(node.children)) return true;
      }
      return false;
    };

    if (Array.isArray(departmentsHierarchy)) {
      findTarget(departmentsHierarchy);
    }
    return Array.from(allFoundIds);
  }, []);

  // Charger TOUS les employés une seule fois (comme EmployeTable)
  useEffect(() => {
    const fetchAllEmployees = async () => {
      try {
        const response = await api.get("/departements/employes");
        const data = response.data;
        const employees = Array.isArray(data) ? data : [];
        setAllEmployees(employees);
        localStorage.setItem("employeesWithContracts", JSON.stringify(employees));
      } catch (err) {
        setAllEmployees([]);
      }
    };
    fetchAllEmployees();
  }, []);

  // Charger la hiérarchie des départements (comme DepartmentPanel)
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get("/departements/hierarchy");
        setDepartments(response.data || []);
      } catch (err) {
        setDepartments([]);
      }
    };
    fetchDepartments();
  }, []);

  const handleDepartmentSelect = useCallback((deptId) => {
    setSelectedDepartmentId(deptId);
    setSelectedEmployee(null);
    setOperations([]);
    setShowAddOperation(false);
    setSelectedEmployeesSet(new Set());
  }, []);

  // Filtrer les employés par département via useMemo pour éviter les clignotements
  const departmentEmployees = useMemo(() => {
    if (!selectedDepartmentId || allEmployees.length === 0) {
      return [];
    }

    let filtered;
    if (includeSubDeps) {
      const subIds = getSubDepartmentIds(departments, selectedDepartmentId);
      filtered = allEmployees.filter((emp) => {
        const match = (
          (emp.departements &&
            emp.departements.length > 0 &&
            emp.departements.some((dept) => subIds.includes(dept.id))) ||
          subIds.includes(emp.departement_id)
        );
        return match;
      });
    } else {
      filtered = allEmployees.filter((emp) => {
        const match = (
          (emp.departements &&
            emp.departements.length > 0 &&
            emp.departements.some((dept) => dept.id === selectedDepartmentId)) ||
          emp.departement_id === selectedDepartmentId
        );
        return match;
      });
    }
    return filtered;
  }, [selectedDepartmentId, includeSubDeps, allEmployees, departments, getSubDepartmentIds]);

  const filteredEmployees = useMemo(() => {
    if (!selectedDepartmentId) return [];
    let list = departmentEmployees;
    if (normalizedSearch) {
      list = list.filter((emp) => {
        const values = [emp.nom, emp.prenom, emp.matricule];
        return values.some((v) => v && v.toString().toLowerCase().includes(normalizedSearch));
      });
    }
    return list;
  }, [departmentEmployees, normalizedSearch, selectedDepartmentId]);

  const hasActiveFilters = useCallback((f = initialFilters) => {
    return Boolean(
      f?.dateOperationFrom ||
      f?.dateOperationTo ||
      f?.type ||
      f?.statut ||
      f?.dateRemboursementFrom ||
      f?.dateRemboursementTo
    );
  }, []);

  const fetchEmployeeOperations = useCallback(async (
    employeId,
    currentFilters = filters,
    showLoading = false,
    forceRefresh = false
  ) => {
    const employeeId = typeof employeId === "object" ? employeId?.id : employeId;
    if (!employeeId) {
      console.warn("[OPS] fetchEmployeeOperations appelé sans employeId");
      return;
    }

    const cacheKey = `ops_cache_${employeeId}`;
    const noFilters = !hasActiveFilters(currentFilters);
    const cachedData = noFilters ? localStorage.getItem(cacheKey) : null;

    // Si le cache existe (même tableau vide), on l'utilise immédiatement sans requête réseau.
    if (!forceRefresh && cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        if (Array.isArray(parsed)) {
          setOperations(parsed);
          setPage(0);
          setLoadingOperations(false);
          return;
        }
      } catch (e) {
        console.warn("[OPS] Erreur lecture cache:", e);
      }
    }

    if (showLoading) setLoadingOperations(true);

    try {
      const url = `mutuelles/dossiers/${encodeURIComponent(employeeId)}/operations`;
      const params = {
        date_operation_from: currentFilters.dateOperationFrom || undefined,
        date_operation_to: currentFilters.dateOperationTo || undefined,
        type: currentFilters.type || undefined,
        statut: currentFilters.statut || undefined,
        date_remboursement_from: currentFilters.dateRemboursementFrom || undefined,
        date_remboursement_to: currentFilters.dateRemboursementTo || undefined,
      };
      const response = await api.get(url, { params });
      const data = response.data?.data ?? response.data;
      const list = Array.isArray(data) ? data : [];

      setOperations(list);

      if (noFilters) {
        localStorage.setItem(cacheKey, JSON.stringify(list));
      }

      setPage(0);
    } catch (err) {
      console.error("❌ Erreur lors du chargement des opérations:", err);
      if (!localStorage.getItem(cacheKey)) {
        setOperations([]);
      }
      if (err?.response?.status !== 404) {
        console.error("Détails de l'erreur:", err.response?.data);
      }
    } finally {
      if (showLoading) setLoadingOperations(false);
    }
  }, [filters, hasActiveFilters]);

  const handleEmployeeSelect = useCallback(
    (employee) => {
      if (!employee?.id) {
        console.warn("[OPS] handleEmployeeSelect appelé avec un employé invalide:", employee);
        return;
      }
      setSelectedEmployee(employee);
      setFilters(initialFilters);
      setFiltersVisible(false);
      setShowAddOperation(false);
      setPage(0);
      setSelectedOperations([]);
      setOperations([]);
      setLoadingOperations(false);
      setSelectedEmployeesSet(new Set([employee.id]));

      const affiliationsCount = Number(employee.affiliations_mutuelle_count);
      if (Number.isFinite(affiliationsCount) && affiliationsCount === 0) {
        localStorage.setItem(`ops_cache_${employee.id}`, JSON.stringify([]));
        return;
      }

      fetchEmployeeOperations(employee.id, initialFilters, false, false);
    },
    [fetchEmployeeOperations]
  );

  const handleCheckEmployee = useCallback(
    (_evt, employee, forceChecked) => {
      if (!employee?.id) return;
      setSelectedEmployeesSet((prev) => {
        const next = new Set(prev);
        if (employee.id === "all") {
          const shouldSelect = forceChecked !== undefined
            ? forceChecked
            : !filteredEmployees.every((e) => next.has(e.id));
          if (shouldSelect) {
            filteredEmployees.forEach((e) => next.add(e.id));
          } else {
            filteredEmployees.forEach((e) => next.delete(e.id));
          }
        } else {
          if (next.has(employee.id)) {
            next.delete(employee.id);
          } else {
            next.add(employee.id);
          }
        }
        return next;
      });
    },
    [filteredEmployees]
  );

  const handleAddOperation = () => {
    if (!selectedEmployee) {
      showInfoMessage(
        "Sélection requise",
        "Veuillez sélectionner un employé pour ajouter une opération."
      );
      return;
    }
    setSelectedOperation(null);
    setIsReadOnly(false);
    setShowOperationDetails(false);
    setShowAddOperation(true);
    setShowStats(false);
  };

  const canAddOperation = Boolean(selectedEmployee);


  const handleEditOperation = (operationId) => {
    // Find the original operation object
    const op = operations.find(o => o.id === operationId);
    if (!op) return;

    // Use selectedOperation state before showing the modal
    setSelectedOperation(op);
    setIsReadOnly(false);
    setShowOperationDetails(false);
    setShowAddOperation(true);
    setShowStats(false);
  };

  const handleOperationSaved = () => {
    if (selectedEmployee) fetchEmployeeOperations(selectedEmployee.id, filters, false, true);
    setShowAddOperation(false);
    setShowOperationDetails(false);
    setSelectedOperation(null);
    setIsReadOnly(false);
    setSelectedOperations([]);
  };

  const handleViewDetails = (operationId) => {
    const op = operations.find(o => o.id === operationId);
    if (op) {
      setSelectedOperation(op);
      setShowAddOperation(false);
      setShowStats(false);
      setShowOperationDetails(true);
    }
  };

  const handleFilterChange = (patch) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch };
      if (selectedEmployee) fetchEmployeeOperations(selectedEmployee.id, next, false, true);
      return next;
    });
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
    if (selectedEmployee) fetchEmployeeOperations(selectedEmployee.id, initialFilters);
  };

  const filteredOperations = useMemo(() => {
    if (!normalizedSearch) return operations;
    const searchLower = normalizedSearch.toLowerCase();

    // If the search matches the employee being viewed, show all their operations
    const empFullName = `${selectedEmployee?.nom || ""} ${selectedEmployee?.prenom || ""}`.toLowerCase();
    const empMatricule = (selectedEmployee?.matricule || "").toLowerCase();

    if (empFullName.includes(searchLower) || empMatricule.includes(searchLower)) {
      return operations;
    }

    return operations.filter((operation) => {
      const values = [
        operation.type_operation,
        operation.statut,
        operation.beneficiaire_nom,
        operation.beneficiaire_type,
        operation.date_operation,
        operation.montant_total,
        operation.montant_rembourse,
        operation.reste_a_charge,
        operation.numero_dossier,
      ];
      return values.some(
        (v) => v && v.toString().toLowerCase().includes(searchLower)
      );
    });
  }, [operations, normalizedSearch, selectedEmployee]);

  const tableColumns = OPERATION_COLUMNS;

  const handleColumnsChange = (key) => {
    setColumnVisibility((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem("operationsColumnVisibility", JSON.stringify(updated));
      return updated;
    });
  };

  const visibleColumns = tableColumns.filter((col) => columnVisibility[col.key]);

  const operationStats = useMemo(() => {
    if (!operations || operations.length === 0) {
      return {
        totals: { frais: 0, rembourse: 0, reste: 0 },
        statusDistribution: {},
        typeDistribution: {}
      };
    }

    const totals = { frais: 0, rembourse: 0, reste: 0 };
    const statusDistribution = {};
    const typeDistribution = {};

    operations.forEach(op => {
      // Totals
      totals.frais += parseFloat(op.montant_total || 0);
      totals.rembourse += parseFloat(op.montant_rembourse || 0);
      totals.reste += parseFloat(op.reste_a_charge || 0);

      // Status
      const status = op.statut || "INCONNU";
      statusDistribution[status] = (statusDistribution[status] || 0) + 1;

      // Type
      const type = op.type_operation || "AUTRE";
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    return { totals, statusDistribution, typeDistribution };
  }, [operations]);

  // Helper functions - defined before useMemo that uses them
  const formatDate = (dateString) => {
    if (!dateString || dateString === "-") return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("fr-FR");
  };

  const getStatutBadge = (statut) => {
    const badges = {
      EN_COURS: { bg: "#fff7ed", color: "#ea580c", border: "#fdba7480", label: "EN_COURS" },
      TERMINEE: { bg: "#f0fdf4", color: "#16a34a", border: "#86efac80", label: "TERMINEE" },
      REMBOURSEE: { bg: "#eff6ff", color: "#2563eb", border: "#93c5fd80", label: "REMBOURSEE" },
      ANNULEE: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca80", label: "ANNULEE" },
    };
    const config = badges[statut] || { bg: "#f8fafc", color: "#64748b", border: "#cbd5e180", label: statut };

    return (
      <span style={{
        backgroundColor: config.bg,
        color: config.color,
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '700',
        textTransform: 'uppercase',
        display: 'inline-block',
        minWidth: '85px',
        textAlign: 'center',
        border: `1px solid ${config.border}`
      }}>
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    return (
      <span style={{
        fontSize: '12px',
        fontWeight: '600',
        color: '#4b5563',
        textTransform: 'uppercase'
      }}>
        {type ? type.replace(/_/g, ' ') : '-'}
      </span>
    );
  };

  const renderExpandedRow = (row) => {
    const op = operations.find(o => o.id === row.id);
    if (!op || !op.documents || op.documents.length === 0) return null;

    return (
      <div style={{ padding: '0px 20px 15px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#475569', fontSize: '0.95rem', fontWeight: 600 }}>
          <FontAwesomeIcon icon={faFileAlt} style={{ fontSize: '20px' }} />
          DOCUMENTS DE L'OPÉRATION
        </div>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Fichier</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', color: '#6b7280', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {op.documents.map((doc) => (
                <tr key={doc.id}>
                  <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '600' }}>{doc.nom || doc.file_name}</td>
                  <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '600' }}>{doc.created_at ? new Date(doc.created_at).toLocaleString() : '-'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                      <a href={`http://localhost:8000/storage/${doc.file_path}`} target="_blank" rel="noopener noreferrer" style={{ color: '#007580' }}>
                        <FaEye size={16} />
                      </a>
                      <a href={`http://localhost:8000/api/mutuelles/documents/${doc.id}/download`} style={{ color: '#64748b' }}>
                        <FontAwesomeIcon icon={faDownload} size="lg" />
                      </a>
                      <button onClick={async (e) => {
                        e.stopPropagation();
                        const result = await showConfirmDialog(
                          'Confirmer la suppression',
                          'Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.'
                        );
                        if (result.isConfirmed) {
                          try {
                            await api.delete(`/mutuelles/documents/${doc.id}`);
                            showSuccessMessage('Supprimé', 'Document supprimé avec succès.');
                            if (selectedEmployee) fetchEmployeeOperations(selectedEmployee.id, filters, false, true);
                          } catch (err) {
                            showErrorMessage('Erreur', 'Impossible de supprimer le document.');
                          }
                        }
                      }} style={{ border: 'none', background: 'transparent', color: '#dc3545', padding: 0, cursor: 'pointer' }}>
                        <FontAwesomeIcon icon={faTrash} size="lg" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const mappedOperations = useMemo(() => {
    const mapped = filteredOperations.map((op) => ({
      id: op.id,
      date_operation: formatDate(op.date_operation),
      type_operation: getTypeBadge(op.type_operation),
      statut: getStatutBadge(op.statut),
      beneficiaire:
        op.beneficiaire_nom ||
        (op.beneficiaire_type === "EMPLOYE"
          ? `${selectedEmployee?.nom || ""} ${selectedEmployee?.prenom || ""}`
          : op.beneficiaire_type),
      montant_total: <span style={{ whiteSpace: 'nowrap' }}>{parseFloat(op.montant_total || 0).toFixed(2)} DH</span>,
      montant_rembourse: <span style={{ whiteSpace: 'nowrap' }}>{parseFloat(op.montant_rembourse || 0).toFixed(2)} DH</span>,
      reste_a_charge: <span style={{ whiteSpace: 'nowrap' }}>{parseFloat(op.reste_a_charge || 0).toFixed(2)} DH</span>,
      date_remboursement: formatDate(op.date_remboursement),
      cout_documents: (
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (op.documents && op.documents.length > 0) {
              toggleRowExpansion(op.id);
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#3a8a90',
            cursor: op.documents?.length > 0 ? 'pointer' : 'default',
            fontSize: '13px',
            fontWeight: '600'
          }}
        >
          <FontAwesomeIcon icon={faFileAlt} style={{ fontSize: '14px', opacity: 0.8 }} />
          <span>{op.documents ? op.documents.length : 0} Doc(s)</span>
          <FontAwesomeIcon icon={expandedRows[op.id] ? faChevronUp : faChevronDown} style={{ fontSize: '10px', opacity: 0.6 }} />
        </div>
      ),
      commentaire: op.commentaire ? (
        <span title={op.commentaire}>
          {op.commentaire.length > 20 ? op.commentaire.substring(0, 20) + '...' : op.commentaire}
        </span>
      ) : "-",
    }));
    return mapped;
  }, [filteredOperations, selectedEmployee]);

  const operationsSelectAll =
    mappedOperations.length > 0 && selectedOperations.length === mappedOperations.length;

  const handleOperationsSelectAll = () => {
    if (operationsSelectAll) {
      setSelectedOperations([]);
    } else {
      setSelectedOperations(mappedOperations.map((op) => op.id));
    }
  };

  const handleOperationCheckbox = (id) => {
    setSelectedOperations((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleDeleteSelectedOperations = async () => {
    if (selectedOperations.length === 0) return;
    const result = await showConfirmDialog(
      `Supprimer ${selectedOperations.length} opération(s)`,
      STANDARD_MESSAGES.DELETE_MULTIPLE_CONFIRM_TEXT
    );
    if (result.isConfirmed) {
      try {
        await Promise.all(
          selectedOperations.map((id) => api.delete(`/mutuelles/operations/${id}`))
        );
        showSuccessMessage("Suppression réussie", "Les opérations ont été supprimées avec succès.");
        setSelectedOperations([]);
        if (selectedEmployee) fetchEmployeeOperations(selectedEmployee.id, filters, false, true);
      } catch (err) {
        console.error("Erreur lors de la suppression groupée:", err);
        showErrorFromResponse(err, "Erreur de suppression");
      }
    }
  };

  const handleChangePage = (newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const highlightText = (text, searchTerm) => {
    if (!text || !searchTerm) return text;
    const textStr = String(text);
    const searchLower = searchTerm.toLowerCase();
    if (!textStr.toLowerCase().includes(searchLower)) return textStr;
    const parts = textStr.split(new RegExp(`(${searchTerm})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === searchLower ? (
        <mark key={i} style={{ backgroundColor: "yellow" }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const CustomMenu = React.forwardRef(
    ({ className, "aria-labelledby": labeledBy }, menuRef) => (
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
        onClick={(e) => e.stopPropagation()}
      >
        <Form>
          {OPERATION_COLUMNS.map((column) => (
            <Form.Check
              key={column.key}
              type="checkbox"
              id={`col-${column.key}`}
              label={column.label}
              checked={!!columnVisibility[column.key]}
              onChange={() => handleColumnsChange(column.key)}
            />
          ))}
        </Form>
      </div>
    )
  );

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
    flex: "0 0 auto",
  };

  const handleDeleteOperation = async (operationId) => {
    const result = await showConfirmDialog(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir supprimer cette opération ? Cette action est irréversible."
    );

    if (result.isConfirmed) {
      try {
        await api.delete(`/mutuelles/operations/${operationId}`);
        showSuccessMessage("Suppression réussie", "L'opération a été supprimée avec succès.");
        if (selectedEmployee) {
          fetchEmployeeOperations(selectedEmployee.id, filters, false, true);
        }
      } catch (err) {
        console.error("Erreur lors de la suppression:", err);
        showErrorFromResponse(err, "Erreur de suppression");
      }
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "row",
      gap: "15px",
      padding: "20px 20px 20px 5px",
      marginTop: "72px",
      height: "calc(100vh - 80px)",
      boxSizing: "border-box",
      backgroundColor: "#ffffff"
    }}>

      <div style={{ width: "35%", height: "100%", flexShrink: 0, margin: 0, padding: 0 }}>
        <DepartmentPanel
          onSelectDepartment={handleDepartmentSelect}
          selectedDepartmentId={selectedDepartmentId}
          includeSubDepartments={includeSubDeps}
          onIncludeSubDepartmentsChange={setIncludeSubDeps}
          employees={filteredEmployees}
          selectedEmployee={selectedEmployee}
          selectedEmployees={selectedEmployeesSet}
          processedEmployees={processedEmployeesSet}
          onSelectEmployee={handleEmployeeSelect}
          onCheckEmployee={handleCheckEmployee}
          findDepartmentName={findDepartmentName}
          filtersVisible={false}
          style={{ height: '100%' }}
        />
      </div>

      {/* Main content area: Table section + Form sidebar */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        height: '100%',
        gap: '15px',
        transition: 'all 0.3s'
      }}>
        {/* Table container */}
        <div className="container3" style={{
          flex: (showAddOperation || showStats) ? '1 1 auto' : '1 1 100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all 0.3s ease-in-out',
          height: '100%',
          margin: 0
        }}>
          <style>
            {`
              .operations-header {
                border-bottom: none !important;
                padding-bottom: 15px;
                margin-bottom: 25px;
              }
              .operations-title {
                color: #3a8a90;
                font-weight: 700;
                font-size: 1.25rem;
                display: flex;
                align-items: center;
              }
              .title-dot {
                width: 10px;
                height: 10px;
                background-color: #3a8a90;
                border-radius: 50%;
                margin-right: 12px;
                display: inline-block;
              }
              .operations-desc {
                color: #6c757d;
                font-size: 0.9rem;
                margin-bottom: 0;
              }
            `}
          </style>

          {/* Header section */}
          <div className="mt-0 px-3">
            <div className="operations-header mb-3">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  alignItems: "center",
                  columnGap: "16px",
                  rowGap: "10px",
                }}
              >
                {/* Bloc titre */}
                <div style={{ minWidth: 0 }}>
                  <span className="operations-title mb-1">
                    <span className="title-dot"></span>
                    Opérations Assurance
                  </span>

                  <p className="operations-desc mb-0">
                    {selectedEmployee
                      ? (
                        <>
                          <span className="fw-bold text-dark">{selectedEmployee.nom} {selectedEmployee.prenom}</span>
                          <span className="ms-2 text-muted" style={{ fontSize: '0.9rem' }}>
                            {`(${operations.length} opération${operations.length > 1 ? 's' : ''} trouvée${operations.length > 1 ? 's' : ''})`}
                          </span>
                        </>
                      )
                      : "- Sélectionnez un employé pour afficher ses opérations"}
                  </p>
                </div>

                {/* Bloc actions */}
                <div style={{ display: "flex", gap: "10px", alignItems: "center", justifySelf: "end", flexWrap: "wrap" }}>
                  <Button
                    onClick={() => {
                      handleAddOperation();
                      setShowStats(false);
                    }}
                    className="btn btn-outline-primary d-flex align-items-center"
                    size="sm"
                    disabled={!canAddOperation}
                    style={{
                      width: "210px",
                      flex: "0 0 auto",
                      whiteSpace: "nowrap",
                      color: "white",
                      opacity: 1,
                      backgroundColor: canAddOperation ? "#2c767c" : "#8cb8bc",
                      borderColor: canAddOperation ? "#2c767c" : "#8cb8bc",
                      cursor: canAddOperation ? "pointer" : "not-allowed",
                      transition: "all 0.2s ease",
                    }}
                    onMouseOver={(e) => {
                      if (!canAddOperation) return;
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
                      e.currentTarget.style.backgroundColor = "#2c767c";
                    }}
                    onMouseOut={(e) => {
                      if (!canAddOperation) return;
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    title={!canAddOperation ? "Sélectionnez un employé pour ajouter une opération." : ""}
                  >
                    <FaPlusCircle className="me-2" />
                    Ajouter une opération
                  </Button>

                  <FontAwesomeIcon
                    onClick={() => setFiltersVisible((v) => !v)}
                    icon={filtersVisible ? faClose : faFilter}
                    style={{
                      cursor: "pointer",
                      fontSize: "1.9rem",
                      color: "#2c767c",
                      marginTop: "1.3%",
                      marginRight: "8px",
                    }}
                    title={filtersVisible ? "Masquer les filtres" : "Afficher les filtres"}
                  />
                  <div
                    onClick={() => {
                      setShowStats(!showStats);
                      if (!showStats) setShowAddOperation(false);
                    }}
                    style={{
                      cursor: "pointer",
                      backgroundColor: "#2c767c",
                      color: "white",
                      width: "42px",
                      height: "40px",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: "10px",
                      marginTop: "1.3%",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
                    }}
                    title={showStats ? "Masquer les statistiques" : "Afficher les statistiques"}
                  >
                    <BarChart2 size={24} strokeWidth={2.5} />
                  </div>

                  <Dropdown
                    show={showDropdown}
                    onToggle={(isOpen) => setShowDropdown(isOpen)}
                  >
                    <Dropdown.Toggle
                      as="button"
                      id="dropdown-ops-visibility"
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
                </div>
              </div>
            </div>
          </div>

          {/* Bloc filtres (même layout que Affiliations) */}
          <AnimatePresence>
            {filtersVisible && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="filters-container ops-filters"
              >
                <div className="filters-row">
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
                  {/* Date Opération */}
                  <div className="filter-group" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <label className="filter-label" style={{ width: "120px" }}>Date Op.</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="date"
                        className="filter-input"
                        style={{ width: 130, height: 30, fontSize: "0.85rem", padding: "2px" }}
                        value={filters.dateOperationFrom}
                        onChange={(e) => handleFilterChange({ dateOperationFrom: e.target.value })}
                      />
                      <span style={{ fontSize: "0.9rem", color: "#666" }}>-</span>
                      <input
                        type="date"
                        className="filter-input"
                        style={{ width: 130, height: 30, fontSize: "0.85rem", padding: "2px" }}
                        value={filters.dateOperationTo}
                        onChange={(e) => handleFilterChange({ dateOperationTo: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Type */}
                  <div className="filter-group" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <label className="filter-label" style={{ width: "80px" }}>Type</label>
                    <select
                      className="filter-input"
                      style={{ minWidth: 150, height: 30, fontSize: "0.9rem", padding: "2px 6px" }}
                      value={filters.type}
                      onChange={(e) => handleFilterChange({ type: e.target.value })}
                    >
                      {filterOperationTypes.map((o) => (
                        <option key={o.value || "all"} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Statut */}
                  <div className="filter-group" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <label className="filter-label" style={{ width: "80px" }}>Statut</label>
                    <select
                      className="filter-input"
                      style={{ minWidth: 140, height: 30, fontSize: "0.9rem", padding: "2px 6px" }}
                      value={filters.statut}
                      onChange={(e) => handleFilterChange({ statut: e.target.value })}
                    >
                      {STATUT_OPTIONS.map((o) => (
                        <option key={o.value || "all"} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Remboursement */}
                  <div className="filter-group" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <label className="filter-label" style={{ width: "145px" }}>Date Remb.</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="date"
                        className="filter-input"
                        style={{ width: 130, height: 30, fontSize: "0.85rem", padding: "2px" }}
                        value={filters.dateRemboursementFrom}
                        onChange={(e) => handleFilterChange({ dateRemboursementFrom: e.target.value })}
                      />
                      <span style={{ fontSize: "0.9rem", color: "#666" }}>-</span>
                      <input
                        type="date"
                        className="filter-input"
                        style={{ width: 130, height: 30, fontSize: "0.85rem", padding: "2px" }}
                        value={filters.dateRemboursementTo}
                        onChange={(e) => handleFilterChange({ dateRemboursementTo: e.target.value })}
                      />
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Table section */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            minHeight: 0
          }}>
            <ExpandRTable
              columns={visibleColumns}
              data={mappedOperations}
              filteredData={mappedOperations}
              searchTerm={normalizedSearch}
              highlightText={highlightText}
              selectAll={operationsSelectAll}
              selectedItems={selectedOperations}
              handleSelectAllChange={handleOperationsSelectAll}
              handleCheckboxChange={handleOperationCheckbox}
              handleDeleteSelected={handleDeleteSelectedOperations}
              rowsPerPage={rowsPerPage}
              page={page}
              handleChangePage={handleChangePage}
              handleChangeRowsPerPage={handleChangeRowsPerPage}
              loading={loadingOperations}
              expandedRows={expandedRows}
              toggleRowExpansion={toggleRowExpansion}
              renderExpandedRow={renderExpandedRow}
              // handleEdit passes the row object, so we extract id
              handleEdit={(row) => handleEditOperation(row.id)}
              // handleDelete passes the id directly, so we use it as is
              handleDelete={(id) => handleDeleteOperation(id)}
              renderCustomActions={(row) => (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(row.id);
                  }}
                  aria-label="Voir détails"
                  title="Voir détails"
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    padding: '0 5px'
                  }}
                >
                  <FaEye style={{ color: '#007580', fontSize: '16px' }} />
                </button>
              )}
            />
          </div>
        </div>

        {/* Form section - outside container3, at same level */}
        {showAddOperation && selectedEmployee && (
          <div style={{
            flex: '0 0 45%',
            minWidth: '450px',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: '#fff',
            boxShadow: '0 6px 20px rgba(8, 179, 173, 0.08), 0 2px 6px rgba(8, 179, 173, 0.04)',
            border: '1px solid rgba(8, 179, 173, 0.08)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <AddMutuelleOperation
              employe={selectedEmployee}
              operation={selectedOperation}
              affiliationIdProposed={null} // You can pass this if needed, similar to AddMutuelleOperation usage
              onClose={() => {
                setShowAddOperation(false);
                setSelectedOperation(null);
                setIsReadOnly(false);
              }}
              onSaved={handleOperationSaved}
              onTypesChanged={fetchFilterTypes}
              isSidebar={true}
              isReadOnly={isReadOnly}
            />
          </div>
        )}

        {/* Details section */}
        {showOperationDetails && selectedEmployee && selectedOperation && (
          <div style={{
            flex: '0 0 45%',
            minWidth: '450px',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: '#fff',
            boxShadow: '0 6px 20px rgba(8, 179, 173, 0.08), 0 2px 6px rgba(8, 179, 173, 0.04)',
            border: '1px solid rgba(8, 179, 173, 0.08)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <OperationDetails
              operation={selectedOperation}
              employe={selectedEmployee}
              onClose={() => {
                setShowOperationDetails(false);
                setSelectedOperation(null);
              }}
            />
          </div>
        )}

        {/* Global Statistics section */}
        {showStats && (
          <div style={{
            flex: '0 0 45%',
            minWidth: '450px',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: '#fff',
            boxShadow: '0 6px 20px rgba(8, 179, 173, 0.08), 0 2px 6px rgba(8, 179, 173, 0.04)',
            border: '1px solid rgba(8, 179, 173, 0.08)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <OperationStatsPanel
              stats={operationStats}
              onClose={() => setShowStats(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Export avec ErrorBoundary
function GestionOperationsEmployesWrapper() {
  return (
    <ErrorBoundary>
      <GestionOperationsEmployes />
    </ErrorBoundary>
  );
}

export default GestionOperationsEmployesWrapper;




