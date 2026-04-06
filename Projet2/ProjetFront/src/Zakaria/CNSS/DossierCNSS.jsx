import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Box } from "@mui/material";
import Swal from "sweetalert2";
import { useHeader } from "../../Acceuil/HeaderContext";
import { useOpen } from "../../Acceuil/OpenProvider";
import DepartmentPanel from "../../ComponentHistorique/DepartementPanel";
import DossierCNSSDetails from "./DossierCNSSDetails";

const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:8000"
  : "http://127.0.0.1:8000";
const CNSS_DOSSIER_EMPLOYEES_CACHE_KEY = "cnssDossierEmployees";
const CNSS_DOSSIER_SHARED_EMPLOYEES_CACHE_KEY = "cnssEmployees";
const CNSS_DOSSIER_DECLARATION_EMPLOYEES_CACHE_KEY = "cnssDeclIndivAllEmployees";
const CNSS_DOSSIER_OPERATIONS_CACHE_PREFIX = "cnss_dossier_operations_";
const CNSS_DOSSIER_OPERATIONS_CACHE_TTL_MS = 20 * 1000;
const CNSS_DOSSIER_PREFETCH_EMPLOYEE_LIMIT = 40;
const CNSS_DOSSIER_PREFETCH_CONCURRENCY = 6;

const parseCachedEmployeesValue = (rawValue) => {
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (Array.isArray(parsed?.data)) {
      return parsed.data;
    }

    return [];
  } catch {
    return [];
  }
};

const readCachedEmployees = () => {
  const cacheKeys = [
    CNSS_DOSSIER_EMPLOYEES_CACHE_KEY,
    CNSS_DOSSIER_SHARED_EMPLOYEES_CACHE_KEY,
    CNSS_DOSSIER_DECLARATION_EMPLOYEES_CACHE_KEY,
  ];

  for (const key of cacheKeys) {
    const parsed = parseCachedEmployeesValue(localStorage.getItem(key));
    if (parsed.length > 0) {
      return parsed;
    }
  }

  return [];
};

const getOperationsCacheKey = (employeId) => `${CNSS_DOSSIER_OPERATIONS_CACHE_PREFIX}${String(employeId)}`;

const readCachedOperations = (employeId) => {
  if (!employeId) return null;

  try {
    const raw = localStorage.getItem(getOperationsCacheKey(employeId));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const data = Array.isArray(parsed) ? parsed : parsed?.data;
    if (!Array.isArray(data)) return null;

    return {
      data,
      updatedAt: Number(parsed?.updatedAt ?? 0) || 0,
    };
  } catch {
    return null;
  }
};

const writeCachedOperations = (employeId, data) => {
  if (!employeId) return;

  try {
    localStorage.setItem(
      getOperationsCacheKey(employeId),
      JSON.stringify({
        data: Array.isArray(data) ? data : [],
        updatedAt: Date.now(),
      })
    );
  } catch {
    // ignore storage errors
  }
};

function DossierCNSS() {
  const [departements, setDepartements] = useState([]);
  const [selectedDepartementId, setSelectedDepartementId] = useState(null);
  const [includeSubDepartments, setIncludeSubDepartments] = useState(false);
  const [allEmployees, setAllEmployees] = useState(() => readCachedEmployees());
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const processedEmployees = useMemo(() => new Set(), []);
  const prefetchingOperationIdsRef = useRef(new Set());

  const { dynamicStyles } = useOpen();
  const { setTitle, setOnPrint, setOnExportPDF, setOnExportExcel, searchQuery, setSearchQuery, clearActions } = useHeader();

  useEffect(() => {
    setTitle("Gestion des opérations CNSS");
    setSearchQuery("");
    setOnPrint(() => null);
    setOnExportPDF(() => null);
    setOnExportExcel(() => null);

    return () => {
      setSearchQuery("");
      clearActions();
    };
  }, [setTitle, setOnPrint, setOnExportPDF, setOnExportExcel, setSearchQuery, clearActions]);

  const fetchDepartmentHierarchy = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/departements/hierarchy`);
      setDepartements(response.data);
      localStorage.setItem("departmentHierarchy", JSON.stringify(response.data));
    } catch (error) {
      console.error("CNSS Dossier: Error fetching department hierarchy:", error);
      if (error.response && error.response.status === 403) {
        Swal.fire({
          icon: "error",
          title: "Accès refusé",
          text: "Vous n'avez pas l'autorisation de voir la hiérarchie des départements.",
        });
      }
    }
  }, []);

  useEffect(() => {
    const departmentsFromStorage = localStorage.getItem("departmentHierarchy");

    if (departmentsFromStorage) {
      setDepartements(JSON.parse(departmentsFromStorage));
    }

    fetchDepartmentHierarchy();
  }, []);

  const handleDepartementClick = (departementId) => {
    if (!departementId) return;
    setSelectedDepartementId((prev) => (String(prev) === String(departementId) ? null : departementId));
    setSelectedEmployee(null);
    setSelectedEmployees(new Set());
  };

  const findDepartmentName = useCallback((departmentId) => {
    const findDepartment = (depts, targetId) => {
      for (let dept of depts) {
        if (dept.id === targetId) {
          return dept;
        }
        if (dept.children && dept.children.length > 0) {
          const found = findDepartment(dept.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    const dept = findDepartment(departements || [], departmentId);
    return dept?.nom || "";
  }, [departements]);

  const getSubDepartmentIds = useCallback((departments, id) => {
    const ids = new Set([id]);

    const addIds = (dept) => {
      if (dept.children && dept.children.length > 0) {
        dept.children.forEach((child) => {
          ids.add(child.id);
          addIds(child);
        });
      }
    };

    const findDepartment = (depts, targetId) => {
      for (let dept of depts) {
        if (dept.id === targetId) {
          return dept;
        }
        if (dept.children && dept.children.length > 0) {
          const found = findDepartment(dept.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    const targetDept = findDepartment(departments, id);
    if (targetDept) {
      addIds(targetDept);
    }

    return Array.from(ids);
  }, []);

  const fetchEmployees = useCallback(async () => {
    const endpoints = [
      `${API_BASE}/api/employes/list`,
      `${API_BASE}/api/employes/light`,
      `${API_BASE}/api/departements/employes`,
      `${API_BASE}/api/employes`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint);
        const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
        setAllEmployees(list);
        localStorage.setItem(CNSS_DOSSIER_EMPLOYEES_CACHE_KEY, JSON.stringify(list));
        localStorage.setItem(CNSS_DOSSIER_SHARED_EMPLOYEES_CACHE_KEY, JSON.stringify(list));
        return;
      } catch {
        // try next endpoint
      }
    }

    setAllEmployees((prev) => (prev.length > 0 ? prev : readCachedEmployees()));
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const selectedDepartementIds = useMemo(() => {
    if (!selectedDepartementId) return [];
    if (includeSubDepartments) {
      return getSubDepartmentIds(departements || [], selectedDepartementId);
    }
    return [selectedDepartementId];
  }, [selectedDepartementId, includeSubDepartments, departements, getSubDepartmentIds]);

  const employeesForDepartment = useMemo(() => {
    if (!selectedDepartementId) return [];
    if (selectedDepartementIds.length === 0) return [];

    const targetIds = new Set(selectedDepartementIds.map(String));

    const byDepartment = allEmployees.filter((emp) => {
      const directMatch = targetIds.has(String(emp.departement_id));
      const linkedMatch = Array.isArray(emp.departements)
        ? emp.departements.some((dept) => targetIds.has(String(dept.id)))
        : false;
      return directMatch || linkedMatch;
    });

    const term = String(searchQuery || "").trim().toLowerCase();
    if (!term) return byDepartment;

    return byDepartment.filter((emp) => {
      const fullName = `${emp.nom || ""} ${emp.prenom || ""}`.toLowerCase();
      return (
        String(emp.matricule || "").toLowerCase().includes(term)
        || String(emp.nom || "").toLowerCase().includes(term)
        || String(emp.prenom || "").toLowerCase().includes(term)
        || fullName.includes(term)
      );
    });
  }, [allEmployees, selectedDepartementId, selectedDepartementIds, searchQuery]);

  const prefetchCandidateIds = useMemo(
    () => employeesForDepartment
      .slice(0, CNSS_DOSSIER_PREFETCH_EMPLOYEE_LIMIT)
      .map((emp) => emp?.id)
      .filter(Boolean),
    [employeesForDepartment]
  );

  const prefetchOperationsForEmployee = useCallback(async (employeId, { force = false } = {}) => {
    if (!employeId) return;

    const normalizedId = String(employeId);
    if (prefetchingOperationIdsRef.current.has(normalizedId)) {
      return;
    }

    const cached = readCachedOperations(employeId);
    const isCacheFresh = cached
      && cached.updatedAt > 0
      && (Date.now() - cached.updatedAt) < CNSS_DOSSIER_OPERATIONS_CACHE_TTL_MS;

    if (!force && isCacheFresh) {
      return;
    }

    prefetchingOperationIdsRef.current.add(normalizedId);

    try {
      const response = await axios.get(`${API_BASE}/api/cnss/dossiers/${employeId}/operations`);
      const payload = response.data?.data ?? response.data ?? [];
      writeCachedOperations(employeId, Array.isArray(payload) ? payload : []);
    } catch {
      // keep prefetch fully silent
    } finally {
      prefetchingOperationIdsRef.current.delete(normalizedId);
    }
  }, []);

  useEffect(() => {
    if (!selectedDepartementId || prefetchCandidateIds.length === 0) return;

    let isCancelled = false;

    const prefetchOperations = async () => {
      for (let i = 0; i < prefetchCandidateIds.length; i += CNSS_DOSSIER_PREFETCH_CONCURRENCY) {
        if (isCancelled) return;
        const batch = prefetchCandidateIds.slice(i, i + CNSS_DOSSIER_PREFETCH_CONCURRENCY);
        const jobs = batch.map((id) => prefetchOperationsForEmployee(id));
        await Promise.allSettled(jobs);
      }
    };

    prefetchOperations();

    return () => {
      isCancelled = true;
    };
  }, [selectedDepartementId, prefetchCandidateIds, prefetchOperationsForEmployee]);

  const handleEmployeeSelect = useCallback((employee) => {
    if (!employee) return;

    prefetchOperationsForEmployee(employee.id);

    setSelectedEmployee((prev) => {
      const isSame = prev && prev.id === employee.id;
      setSelectedEmployees(isSame ? new Set() : new Set([employee.id]));
      return isSame ? null : employee;
    });
  }, [prefetchOperationsForEmployee]);

  const handleEmployeeCheck = useCallback((event, employee, isSelectAll) => {
    if (!employee) return;
    if (employee.id === "all") {
      if (isSelectAll && employeesForDepartment.length > 0) {
        const firstEmployee = employeesForDepartment[0];
        setSelectedEmployee(firstEmployee);
        setSelectedEmployees(new Set([firstEmployee.id]));
      } else {
        setSelectedEmployee(null);
        setSelectedEmployees(new Set());
      }
      return;
    }
    handleEmployeeSelect(employee);
  }, [employeesForDepartment, handleEmployeeSelect]);

  const handleEmployeeSelectHistorique = useCallback((employee) => {
    if (!employee) return;
    setSelectedEmployee((prev) => {
      const isSame = prev && prev.id === employee.id;
      setSelectedEmployees(isSame ? new Set() : new Set([employee.id]));
      return isSame ? null : employee;
    });
  }, []);

  const handleEmployeeCheckHistorique = useCallback((event, employee, isSelectAll) => {
    if (!employee) return;
    if (employee.id === "all") {
      if (isSelectAll && employeesForDepartment.length > 0) {
        const firstEmployee = employeesForDepartment[0];
        setSelectedEmployee(firstEmployee);
        setSelectedEmployees(new Set([firstEmployee.id]));
      } else {
        setSelectedEmployee(null);
        setSelectedEmployees(new Set());
      }
      return;
    }
    handleEmployeeSelectHistorique(employee);
  }, [employeesForDepartment, handleEmployeeSelectHistorique]);

  const selectedEmployeePayload = useMemo(() => {
    if (!selectedEmployee) return null;
    const fullName = `${selectedEmployee.nom || ""} ${selectedEmployee.prenom || ""}`.trim();
    return {
      ...selectedEmployee,
      employe_label: fullName || selectedEmployee.matricule || "Employé",
    };
  }, [selectedEmployee]);

  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{ ...dynamicStyles, minHeight: "100vh", backgroundColor: "#ffffff" }}>
        <Box component="main" sx={{ flexGrow: 1, p: "8px", mt: 12, minHeight: "calc(100vh - 160px)", backgroundColor: "#ffffff" }}>
          <div
            style={{
              display: "flex",
              flex: 1,
              position: "relative",
              gap: "15px",
              margin: 0,
              padding: 0,
              minHeight: "calc(100vh - 160px)",
              height: "calc(100vh - 160px)",
            }}
          >
            <div
              style={{
                width: "32%",
                height: "100%",
                margin: 0,
                padding: 0,
              }}
            >
              <DepartmentPanel
                onSelectDepartment={handleDepartementClick}
                selectedDepartmentId={selectedDepartementId}
                includeSubDepartments={includeSubDepartments}
                onIncludeSubDepartmentsChange={setIncludeSubDepartments}
                employees={employeesForDepartment}
                selectedEmployee={selectedEmployee}
                selectedEmployees={selectedEmployees}
                processedEmployees={processedEmployees}
                onSelectEmployee={handleEmployeeSelect}
                onCheckEmployee={handleEmployeeCheck}
                onEmployeeHover={(employee) => prefetchOperationsForEmployee(employee?.id)}
                findDepartmentName={findDepartmentName}
                filtersVisible={false}
              />
            </div>

            <div style={{ flex: "1 1 0%", minWidth: 0, height: "100%", overflow: "hidden", boxSizing: "border-box" }}>
              <div style={{ width: "100%", height: "100%" }}>
                <DossierCNSSDetails
                  dossier={selectedEmployeePayload}
                  globalSearch={searchQuery}
                  onDocumentsUpdated={fetchDepartmentHierarchy}
                />
              </div>
            </div>
          </div>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default DossierCNSS;
