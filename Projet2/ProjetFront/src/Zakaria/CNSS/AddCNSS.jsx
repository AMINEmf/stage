import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Button, Form } from 'react-bootstrap';
import { ToastContainer } from 'react-toastify';
import Swal from 'sweetalert2';
import Select from "react-dropdown-select";
import { Activity, User, Calendar, Save, X, Hash, ShieldCheck } from "lucide-react";
import './CnssForm.css';

function AddCNSS({
  selectedDepartementId,
  toggleCnssForm,
  onCnssAdded = () => { },
  selectedCnss,
  onCnssUpdated,
  fetchCnss,
  employeesList = [],
  cnssAffiliationsList = [],
}) {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('Actif');
  const [loading, setLoading] = useState(false);
  const [cnssNumber, setCnssNumber] = useState('');
  const [employeeDetails, setEmployeeDetails] = useState(null);

  const normalizeId = useCallback((value) => (value == null ? '' : String(value)), []);

  const employees = useMemo(
    () => (Array.isArray(employeesList) ? employeesList : []),
    [employeesList]
  );

  const cnssAffiliations = useMemo(
    () => (Array.isArray(cnssAffiliationsList) ? cnssAffiliationsList : []),
    [cnssAffiliationsList]
  );

  useEffect(() => {
    if (selectedCnss) {
      const resolvedEmployeeId =
        selectedCnss.employe_id ??
        selectedCnss.employe?.id ??
        selectedCnss.employe ??
        null;
      const parsedId = resolvedEmployeeId != null && String(resolvedEmployeeId).trim() !== ""
        ? Number(resolvedEmployeeId)
        : null;
      setSelectedEmployee(Number.isNaN(parsedId) ? resolvedEmployeeId : parsedId);
      setStartDate(selectedCnss.date_debut || '');
      setEndDate(selectedCnss.date_fin || '');
      setStatus(selectedCnss.statut || 'Actif');
      setCnssNumber(selectedCnss.numero_cnss || '');
      return;
    }

    setSelectedEmployee(null);
    setStartDate('');
    setEndDate('');
    setStatus('Actif');
    setCnssNumber('');
  }, [selectedCnss]);

  const affiliatedEmployeeIds = useMemo(
    () => new Set(cnssAffiliations.map((cnss) => normalizeId(cnss.employe_id))),
    [cnssAffiliations, normalizeId]
  );

  const employeesInDepartment = useMemo(() => {
    if (!selectedDepartementId) return [];
    const departmentId = normalizeId(selectedDepartementId);
    return employees.filter((emp) => {
      const inLinkedDepartments =
        Array.isArray(emp.departements) &&
        emp.departements.some((dept) => normalizeId(dept.id) === departmentId);
      return inLinkedDepartments || normalizeId(emp.departement_id) === departmentId;
    });
  }, [employees, selectedDepartementId, normalizeId]);

  const currentEditedEmployeeId = normalizeId(selectedCnss?.employe_id);

  const availableEmployees = useMemo(
    () =>
      employeesInDepartment.filter((emp) => {
        const employeeId = normalizeId(emp.id);
        if (selectedCnss && employeeId === currentEditedEmployeeId) return true;
        return !affiliatedEmployeeIds.has(employeeId);
      }),
    [employeesInDepartment, affiliatedEmployeeIds, selectedCnss, currentEditedEmployeeId, normalizeId]
  );

  const employeeOptions = useMemo(
    () =>
      availableEmployees.map((emp) => ({
        value: emp.id,
        label: `${emp.matricule} - ${emp.nom} ${emp.prenom}`,
      })),
    [availableEmployees]
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
      label: `${matchedEmployee.matricule} - ${matchedEmployee.nom} ${matchedEmployee.prenom}`,
    }];
  }, [selectedEmployee, employeeOptions, employees, normalizeId]);

  const selectedEmployeeSalary = useMemo(() => {
    if (!selectedEmployee) return null;
    const selectedId = normalizeId(selectedEmployee);
    const matchedEmployee = employees.find((emp) => normalizeId(emp.id) === selectedId);
    if (!matchedEmployee) return null;
    return matchedEmployee.salaire_base ?? matchedEmployee.salary ?? matchedEmployee.salaire ?? null;
  }, [selectedEmployee, employees, normalizeId]);

  const formatAddress = useCallback((address) => {
    if (!address) return "";
    if (typeof address === "string") return address;
    if (typeof address === "object") {
      const parts = [address.adress, address.adresse, address.rue, address.commune, address.ville, address.pays, address.code_postal, address.codePostal];
      return parts.filter(Boolean).join(", ");
    }
    return "";
  }, []);

  const employeeInfo = useMemo(() => {
    if (!employeeDetails) return { cin: "", dateNaissance: "", situationFamiliale: "", adresse: "", dateEmbauche: "" };
    return {
      cin: employeeDetails.cin || "",
      dateNaissance: employeeDetails.date_naissance || "",
      situationFamiliale: employeeDetails.situation_familiale || "",
      adresse: formatAddress(employeeDetails.adresse),
      dateEmbauche: employeeDetails.date_embauche || "",
    };
  }, [employeeDetails, formatAddress]);

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
      numero_cnss: raw.numero_cnss || raw.cnss || raw.cnss_numero || "",
    };
  }, []);

  const normalizeAffiliationPayload = useCallback((rawPayload, fallbackPayload = {}) => {
    if (!rawPayload || typeof rawPayload !== "object") {
      return {
        ...fallbackPayload,
        departement_id: fallbackPayload.departement_id ?? selectedDepartementId,
      };
    }

    const rawData = rawPayload.data && typeof rawPayload.data === "object"
      ? rawPayload.data
      : null;

    const candidate =
      (rawPayload.affiliation && typeof rawPayload.affiliation === "object" && rawPayload.affiliation) ||
      (rawPayload.cnssAffiliation && typeof rawPayload.cnssAffiliation === "object" && rawPayload.cnssAffiliation) ||
      (rawData?.affiliation && typeof rawData.affiliation === "object" && rawData.affiliation) ||
      (rawData?.cnssAffiliation && typeof rawData.cnssAffiliation === "object" && rawData.cnssAffiliation) ||
      rawData ||
      rawPayload;

    return {
      ...candidate,
      ...fallbackPayload,
      id: candidate?.id ?? fallbackPayload.id,
      employe_id: candidate?.employe_id ?? fallbackPayload.employe_id,
      departement_id: candidate?.departement_id ?? fallbackPayload.departement_id ?? selectedDepartementId,
      numero_cnss: candidate?.numero_cnss ?? fallbackPayload.numero_cnss,
      salaire: candidate?.salaire ?? fallbackPayload.salaire,
      date_debut: candidate?.date_debut ?? candidate?.date_affiliation ?? fallbackPayload.date_debut,
      date_fin: candidate?.date_fin ?? fallbackPayload.date_fin ?? null,
      statut: candidate?.statut ?? fallbackPayload.statut,
      employe: candidate?.employe ?? fallbackPayload.employe,
    };
  }, [selectedDepartementId]);

  useEffect(() => {
    let isActive = true;
    if (!selectedEmployee) { setEmployeeDetails(null); return undefined; }
    const fetchEmployeeDetails = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/employes/${selectedEmployee}`, {
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
    return () => { isActive = false; };
  }, [selectedEmployee, normalizeEmployeeResponse, mapEmployeeDetails]);

  useEffect(() => {
    if (!employeeDetails || selectedCnss) return;
    const existingCnss = employeeDetails.numero_cnss || employeeDetails.cnss || employeeDetails.cnss_numero || "";
    if (!cnssNumber && existingCnss) setCnssNumber(existingCnss);
  }, [employeeDetails, selectedCnss, cnssNumber]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDepartementId || !selectedEmployee) {
      Swal.fire('Erreur', 'Veuillez sélectionner un employé.', 'warning');
      return;
    }
    // Validation côté client: date_fin doit être après date_debut
    if (endDate && startDate && new Date(endDate) <= new Date(startDate)) {
      Swal.fire('Erreur', 'La date de fin doit être postérieure à la date d\'affiliation.', 'warning');
      return;
    }
    setLoading(true);
    const payload = {
      employe_id: selectedEmployee,
      numero_cnss: cnssNumber,
      salaire: selectedEmployeeSalary ?? 0,
      date_debut: startDate,
      date_fin: endDate || null,
      statut: status,
      departement_id: selectedDepartementId,
    };
    try {
      if (selectedCnss) {
        const response = await axios.put(`http://127.0.0.1:8000/api/cnss/affiliations/${selectedCnss.id}`, payload, {
          withCredentials: true,
        });
        const updatedData = normalizeAffiliationPayload(response.data, {
          ...payload,
          id: selectedCnss.id,
        });
        if (onCnssUpdated) onCnssUpdated(updatedData);
        Swal.fire('Succès', 'Affiliation CNSS mise à jour', 'success');
      } else {
        const response = await axios.post('http://127.0.0.1:8000/api/cnss/affiliations', payload, {
          withCredentials: true,
        });
        const newData = normalizeAffiliationPayload(response.data, payload);
        onCnssAdded(newData);
        Swal.fire('Succès', 'Affiliation CNSS ajoutée', 'success');
      }
      handleClose();
      if (fetchCnss) {
        Promise.resolve(fetchCnss(true)).catch(() => {
          // Silent refresh failure should not block form close.
        });
      }
    } catch (error) {
      let errorMessage = 'Une erreur est survenue';
      if (error.response?.data?.errors) {
        // Format validation errors from Laravel
        const errors = error.response.data.errors;
        errorMessage = Object.values(errors).flat().join('<br>');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      Swal.fire({ title: 'Erreur', html: errorMessage, icon: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = useCallback(() => {
    setSelectedEmployee(null);
    setStartDate('');
    setEndDate('');
    setStatus('Actif');
    setCnssNumber('');
    setEmployeeDetails(null);
    toggleCnssForm();
  }, [toggleCnssForm]);

  const handleGenerateImmatriculation = useCallback(() => {
    const stamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    setCnssNumber(`CNSS-${stamp}${random}`);
  }, []);

  return (
    <>
      <ToastContainer position="bottom-right" autoClose={3000} />

      <div className="cnss-side-panel" onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className="cnss-form-header">
          <div style={{ width: "24px" }}></div> {/* Pour équilibrer le bouton Fermer et centrer le titre */}
          <h5>
            {selectedCnss ? 'Modifier Affiliation' : 'Nouvelle Affiliation'}
          </h5>
          <button className="cnss-close-btn" onClick={handleClose} type="button" aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="cnss-form-body">
          <Form onSubmit={handleSubmit} id="affiliationForm">

            {/* SECTION : EMPLOYÉ */}
            <div className="cnss-section-title">
              <User size={14} />
              <span>Employé concerné</span>
            </div>

            <div className="cnss-field-group">
              <label className="cnss-form-label">
                Employé <span className="text-danger">*</span>
              </label>
              <Select
                options={employeeOptions}
                values={selectedEmployeeOption}
                onChange={(values) => {
                  const next = values && values.length > 0 ? values[0] : null;
                  const nextId = next ? (next.value ?? next.id ?? null) : null;
                  const parsedId = nextId != null && String(nextId).trim() !== "" ? Number(nextId) : null;
                  setSelectedEmployee(Number.isNaN(parsedId) ? nextId : parsedId);
                }}
                placeholder="Rechercher par Matricule, Nom ou Prénom..."
                disabled={!!selectedCnss}
                searchable={true}
                searchBy="label"
                labelField="label"
                valueField="value"
                dropdownPosition="bottom"
                className="react-dropdown-select"
              />
              {availableEmployees.length === 0 && !selectedCnss && (
                <span className="cnss-error-message" style={{ color: '#6b7280' }}>
                  Tous les employés de ce département sont déjà affiliés.
                </span>
              )}
            </div>

            <div className="row g-3 mb-1">
              <div className="col-md-6">
                <div className="cnss-field-group">
                  <label className="cnss-form-label">CIN</label>
                  <Form.Control className="form-control-enhanced cnss-form-control" type="text" value={employeeInfo.cin} readOnly />
                </div>
              </div>
              <div className="col-md-6">
                <div className="cnss-field-group">
                  <label className="cnss-form-label">Date de naissance</label>
                  <Form.Control className="cnss-form-control" type="text" value={employeeInfo.dateNaissance} readOnly />
                </div>
              </div>
              <div className="col-md-6">
                <div className="cnss-field-group">
                  <label className="cnss-form-label">Situation familiale</label>
                  <Form.Control className="cnss-form-control" type="text" value={employeeInfo.situationFamiliale} readOnly />
                </div>
              </div>
              <div className="col-md-6">
                <div className="cnss-field-group">
                  <label className="cnss-form-label">Date d'embauche</label>
                  <Form.Control className="cnss-form-control" type="text" value={employeeInfo.dateEmbauche} readOnly />
                </div>
              </div>
              <div className="col-md-12">
                <div className="cnss-field-group">
                  <label className="cnss-form-label">Adresse</label>
                  <Form.Control className="cnss-form-control" type="text" value={employeeInfo.adresse} readOnly />
                </div>
              </div>
            </div>

            {/* SECTION : DÉTAILS AFFILIATION */}
            <div className="cnss-section-title">
              <ShieldCheck size={14} />
              <span>Détails Affiliation</span>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <div className="cnss-field-group">
                  <label className="cnss-form-label">
                    Numéro CNSS <span className="text-danger">*</span>
                  </label>
                  <Form.Control
                    className="cnss-form-control"
                    type="text"
                    value={cnssNumber}
                    onChange={(e) => setCnssNumber(e.target.value)}
                    required
                    placeholder="Ex: 123456789"
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="cnss-field-group">
                  <label className="cnss-form-label">
                    Date d'affiliation <span className="text-danger">*</span>
                  </label>
                  <Form.Control
                    className="cnss-form-control"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="cnss-field-group">
                  <label className="cnss-form-label">Date de fin</label>
                  <Form.Control
                    className="cnss-form-control"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="Optionnel"
                  />
                </div>
              </div>

              <div className="col-md-12 mt-2">
                <div className="cnss-field-group">
                  <label className="cnss-form-label">Statut</label>
                  <div className="d-flex gap-4 mt-1">
                    <Form.Check type="radio" label="Actif" name="statut" id="statutA" value="Actif"
                      checked={status === 'Actif'} onChange={(e) => setStatus(e.target.value)} />
                    <Form.Check type="radio" label="Inactif" name="statut" id="statutI" value="Inactif"
                      checked={status === 'Inactif'} onChange={(e) => setStatus(e.target.value)} />
                    <Form.Check type="radio" label="Suspendu" name="statut" id="statutS" value="Suspendu"
                      checked={status === 'Suspendu'} onChange={(e) => setStatus(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </Form>
        </div>

        {/* FOOTER */}
        <div className="cnss-form-footer">
          <button
            type="button"
            className="cnss-btn-secondary"
            onClick={handleClose}
          >
            Annuler
          </button>
          <button
            type="button"
            className="cnss-btn-secondary"
            onClick={handleGenerateImmatriculation}
            disabled={!selectedEmployee}
          >
            Générer immatriculation
          </button>
          <button
            type="submit"
            form="affiliationForm"
            className="cnss-btn-primary"
            disabled={loading || !selectedEmployee || (!selectedCnss && availableEmployees.length === 0)}
          >
            {loading ? 'Enregistrement...' : 'Affilier'}
          </button>
        </div>
      </div>
    </>
  );
}

export default AddCNSS;
