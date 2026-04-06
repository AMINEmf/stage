import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { Button, Form, InputGroup, Table } from "react-bootstrap";
import Select from "react-dropdown-select";
import Swal from "sweetalert2";
import { Activity, Calendar, Save, X, ClipboardList, FileText, Upload, User, CircleDollarSign, Wallet, Coins, Download, Tag, CreditCard, Heart, LogIn, MapPin, DollarSign, MessageSquare } from "lucide-react";
import ManageResourceModal from "./ManageResourceModal";
import './CnssForm.css';

const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:8000"
  : "http://127.0.0.1:8000";
const OPERATION_TYPES_ENDPOINT = `${API_BASE}/api/cnss/operation-types`;
const OPERATION_TYPES_ENDPOINT_STATUS_KEY = "cnss_operation_types_endpoint_status";

const DEFAULT_TYPE_OPTIONS = [
  { label: "DEPOT_DOSSIER", value: "DEPOT_DOSSIER" },
  { label: "DECLARATION", value: "DECLARATION" },
  { label: "PAIEMENT", value: "PAIEMENT" },
  { label: "REMBOURSEMENT", value: "REMBOURSEMENT" },
  { label: "REGULARISATION", value: "REGULARISATION" },
  { label: "ATTESTATION", value: "ATTESTATION" },
  { label: "AUTRE", value: "AUTRE" },
];

const TYPES_AVEC_MONTANTS = ["PAIEMENT", "REGULARISATION", "REMBOURSEMENT", "MUTUELLE"];
const BENEFICIARY_OPTIONS = [
  { label: "EMPLOYE", value: "EMPLOYE" },
  { label: "CONJOINT", value: "CONJOINT" },
  { label: "ENFANT", value: "ENFANT" },
];
const DEFAULT_DOCUMENT_TYPE_OPTIONS = [
  { label: "Certificat médical", value: "Certificat médical" },
  { label: "Reçu", value: "Reçu" },
  { label: "Facture", value: "Facture" },
  { label: "Ordonnance", value: "Ordonnance" },
  { label: "Attestation", value: "Attestation" },
];

const EMPTY_TYPE_OPTIONS = [];

function AddCnssOperation({ employeId, operation, mode = "add", typeOptions = EMPTY_TYPE_OPTIONS, onClose, onSaved, inline = false }) {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [typeValue, setTypeValue] = useState([]);
  const [dateOperation, setDateOperation] = useState("");
  const [statut, setStatut] = useState("");
  const [reference, setReference] = useState("");
  const [beneficiaryType, setBeneficiaryType] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [relation, setRelation] = useState("");
  const [montantTotal, setMontantTotal] = useState("");
  const [montantRembourse, setMontantRembourse] = useState("");
  const [montantResteACharge, setMontantResteACharge] = useState("");
  const [notes, setNotes] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [localTypeOptions, setLocalTypeOptions] = useState([]);
  const [manageTypeModal, setManageTypeModal] = useState(false);
  const [localDocumentTypeOptions, setLocalDocumentTypeOptions] = useState([]);
  const [manageDocumentTypeModal, setManageDocumentTypeModal] = useState(false);
  const [documentType, setDocumentType] = useState("");
  const [files, setFiles] = useState([]);
  const [operationDocuments, setOperationDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
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

  const sanitizeTypeValue = useCallback((value) => {
    return String(value || "")
      .trim()
      .replace(/\s+/g, "_")
      .toUpperCase();
  }, []);

  const mapToTypeOption = useCallback((item) => {
    const rawName = typeof item === "string"
      ? item
      : (item?.label || item?.value || item?.name || item?.type_operation || "");
    const normalized = sanitizeTypeValue(rawName);
    if (!normalized) return null;
    return { label: normalized, value: normalized };
  }, [sanitizeTypeValue]);

  const hydrateTypeOptions = useCallback((items) => {
    const mapped = (Array.isArray(items) ? items : [])
      .map(mapToTypeOption)
      .filter(Boolean);

    const uniqueByValue = mapped.reduce((acc, option) => {
      if (!acc.find((entry) => entry.value === option.value)) {
        acc.push(option);
      }
      return acc;
    }, []);

    return uniqueByValue;
  }, [mapToTypeOption]);

  const persistTypeOptions = useCallback((options) => {
    try {
      localStorage.setItem("cnss_operation_types", JSON.stringify(options));
    } catch (error) {
      console.warn("Impossible de persister les types d'opération:", error);
    }
  }, []);

  const fetchOperationTypes = useCallback(async () => {
    if (operationTypesEndpointAvailable === false) return false;
    try {
      const response = await axios.get(OPERATION_TYPES_ENDPOINT);
      const payload = response?.data?.data ?? response?.data ?? [];
      const hydrated = hydrateTypeOptions(payload);
      if (hydrated.length > 0) {
        setLocalTypeOptions(hydrated);
        persistTypeOptions(hydrated);
        setOperationTypesEndpointAvailable(true);
        persistOperationTypesEndpointStatus(true);
        return true;
      }
      return false;
    } catch (error) {
      if (error?.response?.status === 404) {
        setOperationTypesEndpointAvailable(false);
        persistOperationTypesEndpointStatus(false);
      }
      return false;
    }
  }, [
    hydrateTypeOptions,
    persistTypeOptions,
    operationTypesEndpointAvailable,
    persistOperationTypesEndpointStatus,
  ]);

  const sanitizeDocumentTypeValue = useCallback((value) => {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ");
  }, []);

  const mapToDocumentTypeOption = useCallback((item) => {
    const rawName = typeof item === "string"
      ? item
      : (item?.label || item?.value || item?.name || item?.document_type || "");
    const normalized = sanitizeDocumentTypeValue(rawName);
    if (!normalized) return null;
    return { label: normalized, value: normalized };
  }, [sanitizeDocumentTypeValue]);

  const hydrateDocumentTypeOptions = useCallback((items) => {
    const mapped = (Array.isArray(items) ? items : [])
      .map(mapToDocumentTypeOption)
      .filter(Boolean);

    const uniqueByValue = mapped.reduce((acc, option) => {
      if (!acc.find((entry) => entry.value === option.value)) {
        acc.push(option);
      }
      return acc;
    }, []);

    return uniqueByValue;
  }, [mapToDocumentTypeOption]);

  const persistDocumentTypeOptions = useCallback((options) => {
    try {
      localStorage.setItem("cnss_document_types", JSON.stringify(options));
    } catch (error) {
      console.warn("Impossible de persister les types de document:", error);
    }
  }, []);

  const fetchDocumentTypes = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/cnss/document-types`);
      const payload = response?.data?.data ?? response?.data ?? [];
      const hydrated = hydrateDocumentTypeOptions(payload);
      if (hydrated.length > 0) {
        setLocalDocumentTypeOptions(hydrated);
        persistDocumentTypeOptions(hydrated);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, [hydrateDocumentTypeOptions, persistDocumentTypeOptions]);

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isEmployeeLocked = Boolean(employeId);
  const selectedType = typeValue.length > 0 ? typeValue[0].value : "";
  const normalizeType = useCallback((value) => {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim();
  }, []);

  const typeRequiresMontants = useMemo(() => {
    const normalized = normalizeType(selectedType);
    if (!normalized) return false;
    return TYPES_AVEC_MONTANTS.some((type) => normalized.includes(normalizeType(type)));
  }, [selectedType, normalizeType]);
  const isBeneficiaryEmploye = beneficiaryType === "EMPLOYE";
  const shouldShowBeneficiaryDetails = Boolean(beneficiaryType) && !isBeneficiaryEmploye;

  const normalizeFamilyStatus = useCallback((value) => {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim();
  }, []);

  const isEmployeeCelibataire = useMemo(() => {
    const status = normalizeFamilyStatus(employeeDetails?.situation_familiale);
    return status.includes("CELIBATAIRE") || status === "SINGLE";
  }, [employeeDetails, normalizeFamilyStatus]);

  const beneficiaryOptions = useMemo(() => {
    return BENEFICIARY_OPTIONS.map((option) => {
      const blockedByFamilyStatus = isEmployeeCelibataire && option.value !== "EMPLOYE";
      return {
        ...option,
        disabled: blockedByFamilyStatus,
      };
    });
  }, [isEmployeeCelibataire]);

  const parseNumber = useCallback((value) => {
    if (value === "" || value == null) return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return NaN;
    return parsed;
  }, []);

  const round2 = useCallback((value) => Math.round((value + Number.EPSILON) * 100) / 100, []);

  const formatMad = useCallback((value) => {
    if (value === "" || value == null) return "-";
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return "-";
    return `${parsed.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
  }, []);

  const formatDate = useCallback((value) => {
    if (!value) return "-";
    return value;
  }, []);

  const extractApiErrorMessage = useCallback((error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;

    if ((status === 400 || status === 422) && data?.errors && typeof data.errors === "object") {
      const validationLines = Object.values(data.errors)
        .flat()
        .map((message) => String(message))
        .filter(Boolean);

      if (validationLines.length > 0) {
        return validationLines.join("\n");
      }
    }

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }

    if (status >= 500) {
      return "Erreur serveur interne. Veuillez réessayer ou contacter l'administrateur.";
    }

    if (typeof error?.message === "string" && error.message.trim()) {
      return error.message;
    }

    return "Impossible d'enregistrer l'opération.";
  }, []);

  const normalizeId = useCallback((value) => (value == null ? "" : String(value)), []);

  const buildEmployeeLabel = useCallback((emp) => {
    if (!emp || typeof emp !== "object") return "";
    return `${emp.matricule || ""} - ${emp.nom || ""} ${emp.prenom || ""}`.trim();
  }, []);

  const employeeOptions = useMemo(
    () =>
      (Array.isArray(employees) ? employees : []).map((emp) => ({
        value: emp.id,
        label: buildEmployeeLabel(emp),
      })),
    [employees, buildEmployeeLabel]
  );

  const selectedEmployeeOption = useMemo(() => {
    if (!selectedEmployee) return [];
    const selectedId = normalizeId(selectedEmployee);
    const fromOptions = employeeOptions.find((option) => normalizeId(option.value) === selectedId);
    if (fromOptions) return [fromOptions];

    const matchedEmployee = employees.find((emp) => normalizeId(emp.id) === selectedId);
    if (!matchedEmployee) return [];
    return [{
      value: matchedEmployee.id,
      label: buildEmployeeLabel(matchedEmployee),
    }];
  }, [selectedEmployee, employeeOptions, employees, normalizeId, buildEmployeeLabel]);

  const operationEmployeeLabel = useMemo(() => {
    if (!operation) return "";
    if (typeof operation.employe_label === "string" && operation.employe_label.trim()) {
      return operation.employe_label.trim();
    }
    if (operation.employe && typeof operation.employe === "object") {
      return buildEmployeeLabel(operation.employe);
    }
    return "";
  }, [operation, buildEmployeeLabel]);

  const formatAddress = useCallback((address) => {
    if (!address) return "";
    if (typeof address === "string") return address;
    if (typeof address === "object") {
      const parts = [
        address.adress,
        address.adresse,
        address.rue,
        address.commune,
        address.ville,
        address.pays,
        address.code_postal,
        address.codePostal,
      ];
      return parts.filter(Boolean).join(", ");
    }
    return "";
  }, []);

  const normalizeEmployeeResponse = useCallback((payload) => {
    if (!payload) return null;
    if (Array.isArray(payload)) return payload[0] || null;
    if (payload.data && typeof payload.data === "object") return payload.data;
    if (payload.employe && typeof payload.employe === "object") return payload.employe;
    if (payload.employee && typeof payload.employee === "object") return payload.employee;
    return payload;
  }, []);

  const mapEmployeeDetails = useCallback((raw) => {
    if (!raw || typeof raw !== "object") return null;
    const rawAddress = raw.adresse ?? raw.address ?? raw.adress ?? null;
    return {
      cin: raw.cin || "",
      date_naissance: raw.date_naissance || raw.date_naiss || "",
      situation_familiale: raw.situation_familiale || raw.situation_fm || "",
      adresse: rawAddress,
      date_embauche: raw.date_embauche || raw.date_entree || "",
    };
  }, []);

  const employeeInfo = useMemo(() => {
    if (!employeeDetails) {
      return {
        cin: "",
        dateNaissance: "",
        situationFamiliale: "",
        adresse: "",
        dateEmbauche: "",
      };
    }

    return {
      cin: employeeDetails.cin || "",
      dateNaissance: employeeDetails.date_naissance || "",
      situationFamiliale: employeeDetails.situation_familiale || "",
      adresse: formatAddress(employeeDetails.adresse),
      dateEmbauche: employeeDetails.date_embauche || "",
    };
  }, [employeeDetails, formatAddress]);

  const employeeDisplayLabel = useMemo(() => {
    return selectedEmployeeOption[0]?.label || operationEmployeeLabel || "-";
  }, [selectedEmployeeOption, operationEmployeeLabel]);

  const hydrateFormFromOperation = useCallback((sourceOperation) => {
    if (!sourceOperation) return;

    const option = sourceOperation.type_operation
      ? { label: sourceOperation.type_operation, value: sourceOperation.type_operation }
      : null;

    setTypeValue(option ? [option] : []);
    setDateOperation(sourceOperation.date_operation || "");
    setStatut(sourceOperation.statut || "");
    setReference(sourceOperation.reference || "");
    setBeneficiaryType(sourceOperation.beneficiary_type || "");
    setBeneficiaryName(sourceOperation.beneficiary_name || "");
    setRelation(sourceOperation.beneficiary_relation || sourceOperation.relation || "");

    const dbMontantTotal = parseNumber(sourceOperation.montant_total);
    const dbMontantLegacy = parseNumber(sourceOperation.montant);
    const dbMontantRembourse = parseNumber(sourceOperation.montant_rembourse);
    const dbMontantReste = parseNumber(sourceOperation.montant_reste_a_charge);

    const resolvedMontantTotal =
      dbMontantTotal != null && !Number.isNaN(dbMontantTotal) && dbMontantTotal > 0
        ? dbMontantTotal
        : (dbMontantLegacy != null && !Number.isNaN(dbMontantLegacy) && dbMontantLegacy > 0 ? dbMontantLegacy : "");

    const resolvedMontantRembourse =
      dbMontantRembourse != null && !Number.isNaN(dbMontantRembourse) && dbMontantRembourse >= 0
        ? dbMontantRembourse
        : "";

    let resolvedMontantReste =
      dbMontantReste != null && !Number.isNaN(dbMontantReste) && dbMontantReste >= 0
        ? dbMontantReste
        : "";

    if (
      resolvedMontantReste === "" &&
      resolvedMontantTotal !== "" &&
      resolvedMontantRembourse !== ""
    ) {
      resolvedMontantReste = round2(Math.max(0, Number(resolvedMontantTotal) - Number(resolvedMontantRembourse)));
    }

    setMontantTotal(resolvedMontantTotal === "" ? "" : String(resolvedMontantTotal));
    setMontantRembourse(resolvedMontantRembourse === "" ? "" : String(resolvedMontantRembourse));
    setMontantResteACharge(resolvedMontantReste === "" ? "" : String(resolvedMontantReste));
    setNotes(sourceOperation.notes || "");
    setFormErrors({});
    setDocumentType("");
    setFiles([]);

    const resolvedEmployeeId =
      sourceOperation.employe_id ?? sourceOperation.employe?.id ?? sourceOperation.employe ?? employeId ?? null;
    const parsedId = resolvedEmployeeId != null && String(resolvedEmployeeId).trim() !== ""
      ? Number(resolvedEmployeeId)
      : null;
    setSelectedEmployee(Number.isNaN(parsedId) ? resolvedEmployeeId : parsedId);

    if (sourceOperation.employe && typeof sourceOperation.employe === "object") {
      const mappedEmployee = mapEmployeeDetails(sourceOperation.employe);
      setEmployeeDetails(mappedEmployee || null);
    }
  }, [employeId, parseNumber, round2, mapEmployeeDetails]);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (isViewMode || isEmployeeLocked) {
        setEmployees([]);
        return;
      }

      try {
        const response = await axios.get(`${API_BASE}/api/departements/employes`);
        const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
        setEmployees(list);
      } catch (error) {
        setEmployees([]);
      }
    };

    fetchEmployees();
  }, [isViewMode, isEmployeeLocked]);

  useEffect(() => {
    let isMounted = true;

    const initializeTypeOptions = async () => {
      const fromApi = await fetchOperationTypes();
      if (!isMounted || fromApi) return;

      const provided = hydrateTypeOptions(typeOptions);
      if (provided.length > 0) {
        setLocalTypeOptions(provided);
        persistTypeOptions(provided);
        return;
      }

      try {
        const fromStorage = JSON.parse(localStorage.getItem("cnss_operation_types") || "[]");
        const hydratedStorage = hydrateTypeOptions(fromStorage);
        if (hydratedStorage.length > 0) {
          setLocalTypeOptions(hydratedStorage);
          return;
        }
      } catch (error) {
        console.warn("Lecture localStorage types impossible:", error);
      }

      setLocalTypeOptions(DEFAULT_TYPE_OPTIONS);
    };

    initializeTypeOptions();

    return () => {
      isMounted = false;
    };
  }, [typeOptions, hydrateTypeOptions, persistTypeOptions, fetchOperationTypes]);

  useEffect(() => {
    let isMounted = true;

    const initializeDocumentTypeOptions = async () => {
      const fromApi = await fetchDocumentTypes();
      if (!isMounted || fromApi) return;

      try {
        const fromStorage = JSON.parse(localStorage.getItem("cnss_document_types") || "[]");
        const hydratedStorage = hydrateDocumentTypeOptions(fromStorage);
        if (hydratedStorage.length > 0) {
          setLocalDocumentTypeOptions(hydratedStorage);
          return;
        }
      } catch (error) {
        console.warn("Lecture localStorage types de document impossible:", error);
      }

      setLocalDocumentTypeOptions(DEFAULT_DOCUMENT_TYPE_OPTIONS);
    };

    initializeDocumentTypeOptions();

    return () => {
      isMounted = false;
    };
  }, [fetchDocumentTypes, hydrateDocumentTypeOptions]);

  useEffect(() => {
    if (operation) {
      hydrateFormFromOperation(operation);
      return;
    }

    const parsedEmployeId = employeId != null && String(employeId).trim() !== "" ? Number(employeId) : null;
    setSelectedEmployee(Number.isNaN(parsedEmployeId) ? employeId : parsedEmployeId);
    setTypeValue([]);
    setDateOperation("");
    setStatut("");
    setReference("");
    setBeneficiaryType("");
    setBeneficiaryName("");
    setRelation("");
    setMontantTotal("");
    setMontantRembourse("");
    setMontantResteACharge("");
    setNotes("");
    setFormErrors({});
    setDocumentType("");
    setFiles([]);
  }, [operation, employeId, hydrateFormFromOperation]);

  useEffect(() => {
    const shouldRefreshFromApi = Boolean(operation?.id) && (isEditMode || isViewMode);
    if (!shouldRefreshFromApi) return;

    let isActive = true;

    const refreshOperation = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/cnss/operations/${operation.id}`);
        const payload = response.data?.data ?? response.data;
        if (isActive && payload) {
          hydrateFormFromOperation(payload);
        }
      } catch (error) {
      }
    };

    refreshOperation();

    return () => {
      isActive = false;
    };
  }, [operation, isEditMode, isViewMode, hydrateFormFromOperation]);

  useEffect(() => {
    if (isBeneficiaryEmploye) {
      setBeneficiaryName("");
      setRelation("");
    }
  }, [isBeneficiaryEmploye]);

  useEffect(() => {
    if (!isEmployeeCelibataire) return;
    if (beneficiaryType === "CONJOINT" || beneficiaryType === "ENFANT") {
      setBeneficiaryType("EMPLOYE");
      setBeneficiaryName("");
      setRelation("");
    }
  }, [isEmployeeCelibataire, beneficiaryType]);

  useEffect(() => {
    if (!typeRequiresMontants) {
      setMontantTotal("");
      setMontantRembourse("");
      setMontantResteACharge("");
      return;
    }

    const total = parseNumber(montantTotal);
    const rembourse = parseNumber(montantRembourse);

    if (
      total == null || Number.isNaN(total) || total <= 0 ||
      rembourse == null || Number.isNaN(rembourse) || rembourse < 0 ||
      rembourse > total
    ) {
      setMontantResteACharge("");
      return;
    }

    const reste = round2(Math.max(0, total - rembourse));
    setMontantResteACharge(String(reste));
  }, [typeRequiresMontants, montantTotal, montantRembourse, parseNumber, round2]);

  useEffect(() => {
    let isActive = true;

    if (!selectedEmployee) {
      setEmployeeDetails(null);
      return undefined;
    }

    const fetchEmployeeDetails = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/employes/${selectedEmployee}`, {
          withCredentials: true,
        });
        const normalized = normalizeEmployeeResponse(response.data);
        const mapped = mapEmployeeDetails(normalized);
        if (isActive) setEmployeeDetails(mapped || null);
      } catch (error) {
        if (isActive) setEmployeeDetails(null);
      }
    };

    fetchEmployeeDetails();

    return () => {
      isActive = false;
    };
  }, [selectedEmployee, normalizeEmployeeResponse, mapEmployeeDetails]);

  const typeOptionsWithCurrent = useMemo(() => {
    const baseOptions = localTypeOptions.length > 0 ? localTypeOptions : DEFAULT_TYPE_OPTIONS;
    const options = [...baseOptions];
    if (typeValue.length > 0) {
      const existing = options.find((opt) => opt.value === typeValue[0].value);
      if (!existing) {
        options.unshift(typeValue[0]);
      }
    }
    return options;
  }, [localTypeOptions, typeValue]);

  const typeResources = useMemo(() => {
    return typeOptionsWithCurrent.map((option) => ({
      id: option.value,
      name: option.label || option.value,
    }));
  }, [typeOptionsWithCurrent]);

  const saveTypeOptions = useCallback((updater) => {
    setLocalTypeOptions((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const hydrated = hydrateTypeOptions(next);
      persistTypeOptions(hydrated);
      return hydrated;
    });
  }, [hydrateTypeOptions, persistTypeOptions]);

  const handleAddType = useCallback(async (name) => {
    const normalized = sanitizeTypeValue(name);
    if (!normalized) return;

    if (operationTypesEndpointAvailable !== false) {
      try {
        await axios.post(OPERATION_TYPES_ENDPOINT, { name: normalized });
      } catch (error) { }
    }

    const newOption = { label: normalized, value: normalized };
    saveTypeOptions((prev) => {
      if (prev.some((item) => item.value === newOption.value)) {
        return prev;
      }
      return [newOption, ...prev];
    });
    setTypeValue([newOption]);
  }, [sanitizeTypeValue, saveTypeOptions, operationTypesEndpointAvailable]);

  const handleEditType = useCallback(async (id, name) => {
    const oldValue = sanitizeTypeValue(id);
    const normalized = sanitizeTypeValue(name);
    if (!oldValue || !normalized) return;

    const editedOption = { label: normalized, value: normalized };

    if (operationTypesEndpointAvailable !== false) {
      try {
        await axios.put(`${OPERATION_TYPES_ENDPOINT}/${encodeURIComponent(oldValue)}`, { name: normalized });
      } catch (error) { }
    }

    saveTypeOptions((prev) => {
      const withoutOld = prev.filter((item) => item.value !== oldValue);
      if (withoutOld.some((item) => item.value === editedOption.value)) {
        return withoutOld;
      }
      return [editedOption, ...withoutOld];
    });

    if (typeValue[0]?.value === oldValue) {
      setTypeValue([editedOption]);
    }
  }, [sanitizeTypeValue, saveTypeOptions, typeValue, operationTypesEndpointAvailable]);

  const handleDeleteType = useCallback(async (id) => {
    const toDelete = sanitizeTypeValue(id);
    if (!toDelete) return;

    if (operationTypesEndpointAvailable !== false) {
      try {
        await axios.delete(`${OPERATION_TYPES_ENDPOINT}/${encodeURIComponent(toDelete)}`);
      } catch (error) { }
    }

    saveTypeOptions((prev) => prev.filter((item) => item.value !== toDelete));

    if (typeValue[0]?.value === toDelete) {
      setTypeValue([]);
    }
  }, [sanitizeTypeValue, saveTypeOptions, typeValue, operationTypesEndpointAvailable]);

  const documentTypeOptionsWithCurrent = useMemo(() => {
    const baseOptions = localDocumentTypeOptions.length > 0 ? localDocumentTypeOptions : DEFAULT_DOCUMENT_TYPE_OPTIONS;
    const options = [...baseOptions];
    if (documentType) {
      const normalizedCurrent = sanitizeDocumentTypeValue(documentType);
      const existing = options.find((opt) => sanitizeDocumentTypeValue(opt.value) === normalizedCurrent);
      if (!existing && normalizedCurrent) {
        options.unshift({ label: normalizedCurrent, value: normalizedCurrent });
      }
    }
    return options;
  }, [localDocumentTypeOptions, documentType, sanitizeDocumentTypeValue]);

  const documentTypeResources = useMemo(() => {
    return documentTypeOptionsWithCurrent.map((option) => ({
      id: option.value,
      name: option.label || option.value,
    }));
  }, [documentTypeOptionsWithCurrent]);

  const saveDocumentTypeOptions = useCallback((updater) => {
    setLocalDocumentTypeOptions((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const hydrated = hydrateDocumentTypeOptions(next);
      persistDocumentTypeOptions(hydrated);
      return hydrated;
    });
  }, [hydrateDocumentTypeOptions, persistDocumentTypeOptions]);

  const handleAddDocumentType = useCallback(async (name) => {
    const normalized = sanitizeDocumentTypeValue(name);
    if (!normalized) return;

    try {
      await axios.post(`${API_BASE}/api/cnss/document-types`, { name: normalized });
    } catch (error) { }

    const newOption = { label: normalized, value: normalized };
    saveDocumentTypeOptions((prev) => {
      if (prev.some((item) => item.value === newOption.value)) {
        return prev;
      }
      return [newOption, ...prev];
    });
    setDocumentType(normalized);
  }, [sanitizeDocumentTypeValue, saveDocumentTypeOptions]);

  const handleEditDocumentType = useCallback(async (id, name) => {
    const oldValue = sanitizeDocumentTypeValue(id);
    const normalized = sanitizeDocumentTypeValue(name);
    if (!oldValue || !normalized) return;

    const editedOption = { label: normalized, value: normalized };

    try {
      await axios.put(`${API_BASE}/api/cnss/document-types/${encodeURIComponent(oldValue)}`, { name: normalized });
    } catch (error) { }

    saveDocumentTypeOptions((prev) => {
      const withoutOld = prev.filter((item) => sanitizeDocumentTypeValue(item.value) !== oldValue);
      if (withoutOld.some((item) => sanitizeDocumentTypeValue(item.value) === normalized)) {
        return withoutOld;
      }
      return [editedOption, ...withoutOld];
    });

    if (sanitizeDocumentTypeValue(documentType) === oldValue) {
      setDocumentType(normalized);
    }
  }, [sanitizeDocumentTypeValue, saveDocumentTypeOptions, documentType]);

  const handleDeleteDocumentType = useCallback(async (id) => {
    const toDelete = sanitizeDocumentTypeValue(id);
    if (!toDelete) return;

    try {
      await axios.delete(`${API_BASE}/api/cnss/document-types/${encodeURIComponent(toDelete)}`);
    } catch (error) { }

    saveDocumentTypeOptions((prev) => prev.filter((item) => sanitizeDocumentTypeValue(item.value) !== toDelete));

    if (sanitizeDocumentTypeValue(documentType) === toDelete) {
      setDocumentType("");
    }
  }, [sanitizeDocumentTypeValue, saveDocumentTypeOptions, documentType]);

  const fetchOperationDocuments = useCallback(async (operationId) => {
    if (!operationId) {
      setOperationDocuments([]);
      return;
    }

    setDocumentsLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/cnss/operations/${operationId}`);
      const payload = response.data?.data ?? response.data;
      const docsPayload = payload?.documents?.data ?? payload?.documents ?? [];
      setOperationDocuments(Array.isArray(docsPayload) ? docsPayload : []);
    } catch (error) {
      console.error("Erreur lors du chargement des documents de l'operation:", error);
      setOperationDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (operation?.id) {
      fetchOperationDocuments(operation.id);
      return;
    }
    setOperationDocuments([]);
  }, [fetchOperationDocuments, operation]);

  useEffect(() => {
    if (!Array.isArray(operationDocuments) || operationDocuments.length === 0) return;

    const extractedTypes = operationDocuments
      .map((doc) => sanitizeDocumentTypeValue(doc?.document_type))
      .filter(Boolean)
      .map((name) => ({ label: name, value: name }));

    if (extractedTypes.length === 0) return;

    saveDocumentTypeOptions((prev) => {
      const hydratedPrev = hydrateDocumentTypeOptions(prev);
      const merged = [...hydratedPrev];
      extractedTypes.forEach((option) => {
        if (!merged.some((item) => sanitizeDocumentTypeValue(item.value) === sanitizeDocumentTypeValue(option.value))) {
          merged.push(option);
        }
      });
      return merged;
    });
  }, [operationDocuments, sanitizeDocumentTypeValue, saveDocumentTypeOptions, hydrateDocumentTypeOptions]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const targetEmployeId = selectedEmployee || employeId;
    if (!targetEmployeId) {
      Swal.fire("Erreur", "Veuillez sélectionner un employé.", "warning");
      return;
    }

    const normalizedEmployeId = Number(targetEmployeId);
    if (!Number.isInteger(normalizedEmployeId) || normalizedEmployeId <= 0) {
      Swal.fire("Erreur", "Identifiant employé invalide.", "warning");
      return;
    }

    if (typeValue.length === 0) {
      Swal.fire("Erreur", "Veuillez sélectionner un type d'opération.", "warning");
      return;
    }

    const errors = {};

    if (isEmployeeCelibataire && (beneficiaryType === "CONJOINT" || beneficiaryType === "ENFANT")) {
      errors.beneficiaryType = "Employé célibataire: le bénéficiaire doit être EMPLOYE.";
    }

    if (!isBeneficiaryEmploye) {
      if (!beneficiaryName || !beneficiaryName.trim()) {
        errors.beneficiaryName = "Nom du bénéficiaire requis.";
      }
      if (!relation || !relation.trim()) {
        errors.relation = "Lien de parenté requis.";
      }
    }

    if (typeRequiresMontants) {
      const total = parseNumber(montantTotal);
      const rembourse = parseNumber(montantRembourse);

      if (total == null || Number.isNaN(total) || total <= 0) {
        errors.montantTotal = "Montant total invalide (strictement > 0).";
      }

      if (rembourse == null || Number.isNaN(rembourse) || rembourse < 0) {
        errors.montantRembourse = "Montant remboursé invalide (>= 0).";
      }

      if (
        total != null && !Number.isNaN(total) &&
        rembourse != null && !Number.isNaN(rembourse) &&
        rembourse > total
      ) {
        errors.montantRembourse = "Le montant remboursé ne peut pas dépasser le montant total.";
      }
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      Swal.fire("Erreur", "Veuillez corriger les champs du formulaire.", "warning");
      return;
    }

    setLoading(true);
    const payload = {
      type_operation: typeValue[0].value,
      date_operation: dateOperation,
      statut,
      beneficiary_type: beneficiaryType,
      beneficiary_name: isBeneficiaryEmploye ? null : beneficiaryName,
      beneficiary_relation: isBeneficiaryEmploye ? null : relation,
      reference: reference || null,
      notes: notes || null,
      montant: null,
      montant_total: null,
      taux_remboursement: null,
      montant_rembourse: null,
      montant_reste_a_charge: null,
    };

    if (typeRequiresMontants) {
      const total = parseNumber(montantTotal);
      const rembourse = parseNumber(montantRembourse);
      const reste = round2(Math.max(0, total - rembourse));

      payload.montant_total = Number(total);
      payload.taux_remboursement = null;
      payload.montant_rembourse = Number(rembourse);
      payload.montant_reste_a_charge = Number(reste);
      payload.montant = Number(total);
    }

    try {
      let savedOperationId = operation?.id || null;

      if (isEditMode && operation) {
        const response = await axios.put(`${API_BASE}/api/cnss/operations/${operation.id}`, payload);
        const payloadData = response.data?.data ?? response.data;
        savedOperationId = payloadData?.id ?? operation.id;
        Swal.fire("Succès", "Opération CNSS mise à jour.", "success");
      } else {
        const response = await axios.post(`${API_BASE}/api/cnss/dossiers/${normalizedEmployeId}/operations`, payload);
        const payloadData = response.data?.data ?? response.data;
        savedOperationId = payloadData?.id ?? savedOperationId;
        Swal.fire("Succès", "Opération CNSS ajoutée.", "success");
      }

      if (savedOperationId && files.length > 0) {
        const validFiles = files.filter((file) => file instanceof File);

        const uploadPromises = validFiles.map((file) => {
          const formData = new FormData();
          formData.append("document", file);
          if (documentType) {
            formData.append("document_type", documentType);
          }

          return axios.post(`${API_BASE}/api/cnss/operations/${savedOperationId}/documents`, formData);
        });

        const uploadResults = await Promise.allSettled(uploadPromises);
        const failedUploads = uploadResults.filter((result) => result.status === "rejected");

        if (failedUploads.length > 0) {
          const firstError = failedUploads[0].reason;
          const uploadErrorMessage = extractApiErrorMessage(firstError);
          await Swal.fire(
            "Attention",
            `${failedUploads.length} document(s) non uploadé(s). ${uploadErrorMessage}`,
            "warning"
          );
        }

        await fetchOperationDocuments(savedOperationId);
      }

      if (onSaved) onSaved();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'opération:", error);
      const errorMessage = extractApiErrorMessage(error);
      Swal.fire("Erreur", errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = useCallback(async (doc) => {
    try {
      const response = await axios.get(`${API_BASE}/api/cnss/documents/${doc.id}/download`, {
        responseType: "blob",
      });

      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: doc.mime_type }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", doc.original_name || "document");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      Swal.fire("Erreur", "Impossible de télécharger le document.", "error");
    }
  }, []);

  const handleDeleteDocument = useCallback(
    async (doc) => {
      const result = await Swal.fire({
        title: "Êtes-vous sûr ?",
        text: "Ce document sera supprimé.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Oui, supprimer",
        cancelButtonText: "Annuler",
      });

      if (!result.isConfirmed) return;

      try {
        await axios.delete(`${API_BASE}/api/cnss/documents/${doc.id}`);
        Swal.fire("Supprimé", "Le document a été supprimé.", "success");
        if (operation?.id) {
          await fetchOperationDocuments(operation.id);
        }
      } catch (error) {
        console.error("Erreur lors de la suppression du document:", error);
        Swal.fire("Erreur", "Impossible de supprimer le document.", "error");
      }
    },
    [fetchOperationDocuments, operation]
  );

  const handleClose = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  const handleFileChange = useCallback((event) => {
    const newFiles = Array.from(event.target.files || []);
    if (newFiles.length === 0) return;
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  }, []);

  const removeFile = useCallback((indexToRemove) => {
    setFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
  }, []);

  return (
    <>
      <div className={`cnss-side-panel${isViewMode ? " cnss-view-mode" : ""}`} onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className="cnss-form-header">
          <div style={{ width: "24px" }}></div> {/* Pour équilibrer le bouton Fermer et centrer le titre */}
          <h5>
            {isViewMode ? "Détails de l'opération" : isEditMode ? "Modifier opération" : "Nouvelle opération"}
          </h5>
          <button className="cnss-close-btn" onClick={handleClose} type="button" aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <div className="cnss-form-body">
          {isViewMode ? (
            <>
              {/* Chips montants */}
              <div className="cnss-amount-row">
                <div className="cnss-amount-chip total">
                  <div className="cnss-amount-chip-meta">
                    <span className="cnss-amount-chip-label">Montant total</span>
                    <span className="cnss-amount-chip-value">{formatMad(montantTotal)}</span>
                  </div>
                </div>
                <div className="cnss-amount-chip rembourse">
                  <div className="cnss-amount-chip-meta">
                    <span className="cnss-amount-chip-label">Remboursé</span>
                    <span className="cnss-amount-chip-value">{formatMad(montantRembourse)}</span>
                  </div>
                </div>
                <div className="cnss-amount-chip reste">
                  <div className="cnss-amount-chip-meta">
                    <span className="cnss-amount-chip-label">Reste à charge</span>
                    <span className="cnss-amount-chip-value">{formatMad(montantResteACharge)}</span>
                  </div>
                </div>
              </div>

              {/* Employé (vue seule) */}
              <div className="cnss-section-title">
                <User size={14} />
                <span>Employé concerné</span>
              </div>
              <div className="cnss-detail-grid">
                <div className="cnss-detail-item">
                  <div className="cnss-detail-label">Employé</div>
                  <div className="cnss-detail-value">{employeeDisplayLabel}</div>
                </div>
                <div className="cnss-detail-item">
                  <div className="cnss-detail-label">CIN</div>
                  <div className="cnss-detail-value">{employeeInfo.cin || "-"}</div>
                </div>
                <div className="cnss-detail-item">
                  <div className="cnss-detail-label">Date de naissance</div>
                  <div className="cnss-detail-value">{employeeInfo.dateNaissance || "-"}</div>
                </div>
                <div className="cnss-detail-item">
                  <div className="cnss-detail-label">Situation familiale</div>
                  <div className="cnss-detail-value">{employeeInfo.situationFamiliale || "-"}</div>
                </div>
                <div className="cnss-detail-item">
                  <div className="cnss-detail-label">Date d'embauche</div>
                  <div className="cnss-detail-value">{employeeInfo.dateEmbauche || "-"}</div>
                </div>
                <div className="cnss-detail-item">
                  <div className="cnss-detail-label">Adresse</div>
                  <div className="cnss-detail-value">{employeeInfo.adresse || "-"}</div>
                </div>
              </div>

              {/* Détails opération (vue) */}
              <div className="cnss-section-title">
                <Activity size={14} />
                <span>Détails de l'opération</span>
              </div>
              <div className="cnss-detail-grid">
                <div className="cnss-detail-item">
                  <div className="cnss-detail-label">Type d'opération</div>
                  <div className="cnss-detail-value">{selectedType || "-"}</div>
                </div>
                <div className="cnss-detail-item">
                  <div className="cnss-detail-label">Date d'opération</div>
                  <div className="cnss-detail-value">{formatDate(dateOperation)}</div>
                </div>
                <div className="cnss-detail-item">
                  <div className="cnss-detail-label">Statut</div>
                  <div className="cnss-detail-value">
                    <span
                      className="cnss-status-badge"
                      style={{
                        backgroundColor:
                          statut === "TERMINEE" ? "rgba(76,175,80,0.15)" :
                            statut === "ANNULEE" ? "rgba(244,67,54,0.15)" :
                              "rgba(255,152,0,0.15)",
                        color:
                          statut === "TERMINEE" ? "#2e7d32" :
                            statut === "ANNULEE" ? "#c62828" :
                              "#ef6c00",
                      }}
                    >
                      {statut || "-"}
                    </span>
                  </div>
                </div>
                <div className="cnss-detail-item">
                  <div className="cnss-detail-label">Bénéficiaire</div>
                  <div className="cnss-detail-value">{beneficiaryType || "-"}</div>
                </div>
                {beneficiaryType !== "EMPLOYE" && (
                  <>
                    <div className="cnss-detail-item">
                      <div className="cnss-detail-label">Nom du bénéficiaire</div>
                      <div className="cnss-detail-value">{beneficiaryName || "-"}</div>
                    </div>
                    <div className="cnss-detail-item">
                      <div className="cnss-detail-label">Lien de parenté</div>
                      <div className="cnss-detail-value">{relation || "-"}</div>
                    </div>
                  </>
                )}
              </div>

              {/* Référence & Montant (vue) */}
              <div className="cnss-section-title">
                <Tag size={14} />
                <span>Référence &amp; Montant</span>
              </div>
              <div className="cnss-detail-grid">
                <div className="cnss-detail-item">
                  <div className="cnss-detail-label">Référence</div>
                  <div className="cnss-detail-value">{reference || "-"}</div>
                </div>
                <div className="cnss-detail-item" style={{ gridColumn: "1 / -1" }}>
                  <div className="cnss-detail-label">Notes</div>
                  <div className="cnss-detail-value">{notes || "-"}</div>
                </div>
              </div>

              {/* Documents (vue) */}
              {operation?.id && (
                <div className="mb-3">
                  <div className="cnss-section-title">
                    <FileText size={14} />
                    <span>Documents de l'opération</span>
                  </div>
                  <div className="cnss-documents-list">
                    {documentsLoading ? (
                      <div className="text-muted">Chargement des documents...</div>
                    ) : operationDocuments.length > 0 ? (
                      operationDocuments.map((doc) => (
                        <div key={doc.id} className="cnss-document-row">
                          <div className="cnss-document-left">
                            <div className="cnss-document-meta">
                              <div className="cnss-document-name">{doc.original_name || "-"}</div>
                              <div className="cnss-document-type">{doc.document_type || "-"}</div>
                            </div>
                          </div>
                          <button type="button" className="cnss-document-download" onClick={() => handleDownload(doc)} title="Télécharger">
                            <Download size={16} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted">Aucun document pour cette opération.</div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <Form onSubmit={handleSubmit} id="operationForm">

              {/* SECTION : EMPLOYÉ CONCERNÉ (lecture seule, sans sélecteur)
                  employeId est injecté automatiquement depuis le contexte (route/state/param).
                  Il sera toujours transmis au backend via la variable `selectedEmployee || employeId`. */}

              <div className="cnss-section-title">
                <User size={14} />
                <span>Employé concerné</span>
              </div>
              <div className="row g-2 mb-3">
                <div className="col-md-6">
                  <div className="cnss-field-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="cnss-form-label">Nom complet</label>
                    <Form.Control
                      className="cnss-form-control"
                      type="text"
                      value={employeeDisplayLabel}
                      readOnly
                      disabled
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="cnss-field-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="cnss-form-label">CIN</label>
                    <Form.Control
                      className="cnss-form-control"
                      type="text"
                      value={employeeInfo.cin || ""}
                      readOnly
                      disabled
                      placeholder="—"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="cnss-field-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="cnss-form-label">Date de naissance</label>
                    <Form.Control
                      className="cnss-form-control"
                      type="text"
                      value={employeeInfo.dateNaissance || ""}
                      readOnly
                      disabled
                      placeholder="—"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="cnss-field-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="cnss-form-label">Situation familiale</label>
                    <Form.Control
                      className="cnss-form-control"
                      type="text"
                      value={employeeInfo.situationFamiliale || ""}
                      readOnly
                      disabled
                      placeholder="—"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="cnss-field-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="cnss-form-label">Date d'embauche</label>
                    <Form.Control
                      className="cnss-form-control"
                      type="text"
                      value={employeeInfo.dateEmbauche || ""}
                      readOnly
                      disabled
                      placeholder="—"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="cnss-field-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="cnss-form-label">Adresse</label>
                    <Form.Control
                      className="cnss-form-control"
                      type="text"
                      value={employeeInfo.adresse || ""}
                      readOnly
                      disabled
                      placeholder="—"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION : DÉTAILS DE L'OPÉRATION */}
              <div className="cnss-section-title">
                <Activity size={14} />
                <span>Détails de l'opération</span>
              </div>


              <div className="row g-3 mb-3">
                <div className="col-md-12">
                  <div className="cnss-field-group">
                    <label className="cnss-form-label">
                      Type d'opération <span className="text-danger">*</span>
                    </label>
                    <div className="unified-input-group">
                      <div style={{ flex: 1 }}>
                        <Select
                          options={typeOptionsWithCurrent}
                          values={typeValue}
                          onChange={(values) => { setTypeValue(values.length > 0 ? [values[0]] : []); }}
                          placeholder="Choisir un type..."
                          searchable={true}
                          clearable={false}
                          create={false}
                          disabled={isViewMode}
                          dropdownPosition="bottom"
                          className="react-dropdown-select"
                        />
                      </div>
                      <button
                        type="button"
                        className="cnss-btn-add"
                        onClick={() => {
                          if (isViewMode) return;
                          setManageTypeModal(true);
                        }}
                        disabled={isViewMode}
                      >
                        +
                      </button>
                    </div>
                    <input
                      tabIndex={-1}
                      autoComplete="off"
                      style={{ opacity: 0, height: 0, position: "absolute" }}
                      value={typeValue.length > 0 ? typeValue[0].value : ""}
                      onChange={() => { }}
                      required
                    />
                    {!typeRequiresMontants && !isViewMode && (
                      <span className="cnss-error-message" style={{ color: '#6b7280' }}>
                        Les montants s'affichent pour les types remboursables (PAIEMENT, REGULARISATION, REMBOURSEMENT).
                      </span>
                    )}
                    {operationTypesEndpointAvailable === false && (
                      <span className="cnss-error-message" style={{ color: '#9ca3af' }}>
                        Aucun type disponible via l'API. Vous pouvez gérer la liste localement avec le bouton +.
                      </span>
                    )}
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="cnss-field-group">
                    <label className="cnss-form-label">
                      Date d'opération <span className="text-danger">*</span>
                    </label>
                    <Form.Control
                      className="cnss-form-control"
                      type="date"
                      value={dateOperation}
                      onChange={(event) => setDateOperation(event.target.value)}
                      required
                      disabled={isViewMode}
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="cnss-field-group">
                    <label className="cnss-form-label">
                      Statut <span className="text-danger">*</span>
                    </label>
                    <Form.Select
                      className="cnss-form-control"
                      value={statut}
                      onChange={(event) => setStatut(event.target.value)}
                      required
                      disabled={isViewMode}
                    >
                      <option value="">Choisir un statut...</option>
                      <option value="EN_COURS">EN_COURS</option>
                      <option value="TERMINEE">TERMINEE</option>
                      <option value="ANNULEE">ANNULEE</option>
                    </Form.Select>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="cnss-field-group">
                    <label className="cnss-form-label">
                      Bénéficiaire <span className="text-danger">*</span>
                    </label>
                    <Form.Select
                      className="cnss-form-control"
                      value={beneficiaryType}
                      onChange={(event) => setBeneficiaryType(event.target.value)}
                      required
                      disabled={isViewMode}
                    >
                      <option value="">Choisir un bénéficiaire...</option>
                      {beneficiaryOptions.map((option) => (
                        <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>
                      ))}
                    </Form.Select>
                    {isEmployeeCelibataire && (
                      <span className="cnss-error-message" style={{ color: '#6b7280' }}>
                        Employé célibataire : seul le bénéficiaire EMPLOYE est autorisé.
                      </span>
                    )}
                    {formErrors.beneficiaryType && <span className="cnss-error-message">{formErrors.beneficiaryType}</span>}
                  </div>
                </div>

                {shouldShowBeneficiaryDetails && (
                  <>
                    <div className="col-md-6">
                      <div className="cnss-field-group">
                        <label className="cnss-form-label">
                          Nom du bénéficiaire <span className="text-danger">*</span>
                        </label>
                        <Form.Control
                          className="cnss-form-control"
                          type="text"
                          value={beneficiaryName}
                          onChange={(event) => setBeneficiaryName(event.target.value)}
                          disabled={isViewMode}
                          placeholder="Nom complet"
                        />
                        {formErrors.beneficiaryName && <span className="cnss-error-message">{formErrors.beneficiaryName}</span>}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="cnss-field-group">
                        <label className="cnss-form-label">
                          Lien de parenté <span className="text-danger">*</span>
                        </label>
                        <Form.Control
                          className="cnss-form-control"
                          type="text"
                          value={relation}
                          onChange={(event) => setRelation(event.target.value)}
                          disabled={isViewMode}
                          placeholder="Ex: Époux/Épouse, Fils, Fille..."
                        />
                        {formErrors.relation && <span className="cnss-error-message">{formErrors.relation}</span>}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* SECTION : RÉFÉRENCE & MONTANT */}
              <div className="cnss-section-title">
                <Tag size={14} />
                <span>Référence &amp; Montant</span>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <div className="cnss-field-group">
                    <label className="cnss-form-label">Référence</label>
                    <Form.Control
                      className="cnss-form-control"
                      type="text"
                      value={reference}
                      onChange={(event) => setReference(event.target.value)}
                      disabled={isViewMode}
                      placeholder="Ex: REF-2024"
                    />
                  </div>
                </div>

                {typeRequiresMontants && (
                  <>
                    <div className="col-md-6">
                      <div className="cnss-field-group">
                        <label className="cnss-form-label">
                          Montant total des frais <span className="text-danger">*</span>
                        </label>
                        <Form.Control
                          className="cnss-form-control"
                          type="number" min="0" step="0.01"
                          value={montantTotal}
                          onChange={(event) => setMontantTotal(event.target.value)}
                          disabled={isViewMode}
                          placeholder="0.00 MAD"
                        />
                        {formErrors.montantTotal && <span className="cnss-error-message">{formErrors.montantTotal}</span>}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="cnss-field-group">
                        <label className="cnss-form-label">
                          Montant remboursé <span className="text-danger">*</span>
                        </label>
                        <Form.Control
                          className="cnss-form-control"
                          type="number" min="0" step="0.01"
                          value={montantRembourse}
                          onChange={(event) => setMontantRembourse(event.target.value)}
                          disabled={isViewMode}
                          placeholder="0.00 MAD"
                        />
                        {formErrors.montantRembourse && <span className="cnss-error-message">{formErrors.montantRembourse}</span>}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="cnss-field-group">
                        <label className="cnss-form-label">Montant reste à charge</label>
                        <Form.Control
                          className="cnss-form-control"
                          type="number"
                          value={montantResteACharge}
                          readOnly
                          placeholder="Calcul automatique"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="col-md-12 mt-1">
                  <div className="cnss-field-group">
                    <label className="cnss-form-label">Notes</label>
                    <Form.Control
                      className="cnss-form-control"
                      as="textarea"
                      rows={3}
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      disabled={isViewMode}
                      placeholder="Observations éventuelles..."
                    />
                  </div>
                </div>
              </div>

              {/* SECTION : DOCUMENTS */}
              <div className="cnss-section-title">
                <Upload size={14} />
                <span>Documents liés</span>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-12">
                  <div className="cnss-field-group">
                    <label className="cnss-form-label">Choisir des fichiers</label>
                    <Form.Control
                      className="cnss-form-control"
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      disabled={isViewMode}
                    />
                    {!files.length && (
                      <span className="cnss-error-message" style={{ color: '#9ca3af' }}>Aucun fichier sélectionné</span>
                    )}
                    {files.length > 0 && (
                      <div className="mt-2">
                        {files.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="d-flex align-items-center justify-content-between border rounded px-2 py-1 mb-1"
                            style={{ fontSize: '0.85rem', background: '#f9fafb' }}
                          >
                            <span className="text-truncate" title={file.name}>{file.name}</span>
                            {!isViewMode && (
                              <button
                                type="button"
                                className="cnss-document-download"
                                style={{ color: '#ef4444' }}
                                onClick={() => removeFile(index)}
                              >
                                X
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <span className="cnss-error-message" style={{ color: '#9ca3af' }}>Format PDF ou image recommandé.</span>
                  </div>
                </div>

                <div className="col-md-12">
                  <div className="cnss-field-group">
                    <label className="cnss-form-label">Type de document</label>
                    <div className="unified-input-group">
                      <Form.Select
                        className="cnss-form-control"
                        value={documentType}
                        onChange={(event) => setDocumentType(event.target.value)}
                        disabled={isViewMode}
                      >
                        <option value="">Choisir un type de document...</option>
                        {documentTypeOptionsWithCurrent.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </Form.Select>
                      <button
                        type="button"
                        className="cnss-btn-add"
                        onClick={() => setManageDocumentTypeModal(true)}
                        disabled={isViewMode}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents existants (mode edit) */}
              {operation?.id && (
                <div className="mb-3">
                  <div className="cnss-section-title">
                    <FileText size={14} />
                    <span>Documents de l'opération</span>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered">
                      <thead style={{ backgroundColor: '#f9fafb' }}>
                        <tr>
                          <th style={{ color: '#4b5563', fontWeight: 700, fontSize: '0.8rem' }}>Fichier</th>
                          <th style={{ color: '#4b5563', fontWeight: 700, fontSize: '0.8rem' }}>Type</th>
                          <th style={{ color: '#4b5563', fontWeight: 700, fontSize: '0.8rem' }}>Date</th>
                          <th style={{ color: '#4b5563', fontWeight: 700, fontSize: '0.8rem' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documentsLoading ? (
                          <tr><td colSpan={4} className="text-center text-muted">Chargement...</td></tr>
                        ) : operationDocuments.length > 0 ? (
                          operationDocuments.map((doc) => (
                            <tr key={doc.id}>
                              <td style={{ fontSize: '0.85rem' }}>{doc.original_name || "-"}</td>
                              <td style={{ fontSize: '0.85rem' }}>{doc.document_type || "-"}</td>
                              <td style={{ fontSize: '0.85rem' }}>{doc.created_at || "-"}</td>
                              <td>
                                <div className="d-flex gap-2">
                                  <button type="button" className="cnss-btn-secondary" style={{ padding: '4px 10px', minWidth: 'auto', fontSize: '0.8rem' }} onClick={() => handleDownload(doc)}>Télécharger</button>
                                  {!isViewMode && (
                                    <button type="button" className="cnss-btn-secondary" style={{ padding: '4px 10px', minWidth: 'auto', fontSize: '0.8rem', color: '#ef4444', borderColor: '#fecaca' }} onClick={() => handleDeleteDocument(doc)}>Supprimer</button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={4} className="text-center text-muted" style={{ fontSize: '0.85rem' }}>Aucun document pour cette opération.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Form>
          )}
        </div>

        {/* Modales gestion types */}
        {!isViewMode && (
          <ManageResourceModal
            show={manageTypeModal}
            onHide={() => setManageTypeModal(false)}
            title="Gérer les Types d'opération"
            items={typeResources}
            onAdd={handleAddType}
            onEdit={handleEditType}
            onDelete={handleDeleteType}
            placeholder="Nouveau..."
            addButtonLabel="+"
          />
        )}

        {!isViewMode && (
          <ManageResourceModal
            show={manageDocumentTypeModal}
            onHide={() => setManageDocumentTypeModal(false)}
            title="Gérer les Types de document"
            items={documentTypeResources}
            onAdd={handleAddDocumentType}
            onEdit={handleEditDocumentType}
            onDelete={handleDeleteDocumentType}
            placeholder="Nouveau..."
            addButtonLabel="+"
          />
        )}

        {/* FOOTER */}
        <div className="cnss-form-footer">
          <button type="button" className="cnss-btn-secondary" onClick={handleClose}>
            {isViewMode ? "Fermer" : "Annuler"}
          </button>
          {!isViewMode && (
            <button
              type="submit"
              form="operationForm"
              className="cnss-btn-primary"
              disabled={loading || !(selectedEmployee || employeId)}
            >
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
          )}
        </div>
      </div>

    </>
  );
}

export default AddCnssOperation;
