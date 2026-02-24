import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Button, Form, Tabs, Tab } from 'react-bootstrap';
import { ToastContainer } from 'react-toastify';
import Swal from 'sweetalert2';
import Select from "react-dropdown-select";
import { Activity, User, Calendar, Save, X } from "lucide-react";
import '../Employe/AddEmp.css';


function AddCNSS({
  selectedDepartementId,
  toggleCnssForm,
  onCnssAdded = () => { },
  selectedCnss,
  onCnssUpdated,
  fetchCnss,
  employeesList = [], // Reçu depuis CNSSTable
  cnssAffiliationsList = [], // Reçu depuis CNSSTable
}) {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('Actif');
  const [loading, setLoading] = useState(false);
  const [cnssNumber, setCnssNumber] = useState('');

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
      setSelectedEmployee(selectedCnss.employe_id ?? null);
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
    if (!selectedDepartementId) {
      return [];
    }

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

        if (selectedCnss && employeeId === currentEditedEmployeeId) {
          return true;
        }

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
    if (!selectedEmployee) {
      return [];
    }

    const selectedId = normalizeId(selectedEmployee);
    const fromOptions = employeeOptions.find(
      (option) => normalizeId(option.value) === selectedId
    );

    if (fromOptions) {
      return [fromOptions];
    }

    const matchedEmployee = employees.find((emp) => normalizeId(emp.id) === selectedId);
    if (!matchedEmployee) {
      return [];
    }

    return [
      {
        value: matchedEmployee.id,
        label: `${matchedEmployee.matricule} - ${matchedEmployee.nom} ${matchedEmployee.prenom}`,
      },
    ];
  }, [selectedEmployee, employeeOptions, employees, normalizeId]);

  const selectedEmployeeSalary = useMemo(() => {
    if (!selectedEmployee) {
      return null;
    }

    const selectedId = normalizeId(selectedEmployee);
    const matchedEmployee = employees.find((emp) => normalizeId(emp.id) === selectedId);
    if (!matchedEmployee) {
      return null;
    }

    return (
      matchedEmployee.salaire_base ??
      matchedEmployee.salary ??
      matchedEmployee.salaire ??
      null
    );
  }, [selectedEmployee, employees, normalizeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDepartementId || !selectedEmployee) {
      Swal.fire('Erreur', 'Veuillez sélectionner un employé.', 'warning');
      return;
    }

    setLoading(true);

    const payload = {
      employe_id: selectedEmployee,
      numero_cnss: cnssNumber,
      salaire: selectedEmployeeSalary ?? undefined,
      date_debut: startDate,
      date_fin: endDate || null,
      statut: status,
      departement_id: selectedDepartementId,
    };

    try {
      if (selectedCnss) {
        const response = await axios.put(
          `http://127.0.0.1:8000/api/cnss/affiliations/${selectedCnss.id}`,
          payload
        );
        if (onCnssUpdated) {
          onCnssUpdated(response.data || { ...payload, id: selectedCnss.id });
        }
        Swal.fire('Succès', 'Affiliation CNSS mise à jour', 'success');
      } else {
        const response = await axios.post('http://127.0.0.1:8000/api/cnss/affiliations', payload);
        onCnssAdded(response.data);
        Swal.fire('Succès', 'Affiliation CNSS ajoutée', 'success');
      }
      handleClose();
      if (fetchCnss) {
        await fetchCnss();
      }
    } catch (error) {
      console.error('Error saving affiliation:', error);
      Swal.fire('Erreur', error.response?.data?.message || 'Une erreur est survenue', 'error');
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
    toggleCnssForm();
  }, [toggleCnssForm]);

  return (
    <>
      <style>
        {`
          .side-panel-container {
            position: fixed !important;
            top: 9.4%; 
            left: 60%; 
            width: 41%;
            height: calc(100vh - 160px) !important;
            animation: slideInAccident 0.3s ease-out;
            background: white;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            box-shadow: -5px 0 15px rgba(0,0,0,0.1);
            border-radius: 8px 0 0 8px;
          }
          @keyframes slideInAccident {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          .form-header {
            padding: 16px 24px;
            background-color: #f9fafb;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
          }
          .form-header h3 {
            margin: 0;
            font-size: 1.15rem;
            color: #4b5563;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
            justify-content: center;
          }
          .form-body {
            flex-grow: 1;
            overflow-y: auto;
            padding: 24px;
          }
          .form-body::-webkit-scrollbar { width: 6px; }
          .form-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
          .form-footer {
            padding: 16px 24px;
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
          }
          .form-control, .form-select, .form-control-select {
             font-size: 14px;
             color: #334155;
             border-color: #cbd5e1;
          }
          .form-control:focus, .form-select:focus {
            border-color: #2c767c;
            box-shadow: 0 0 0 0.2rem rgba(44, 118, 124, 0.25);
          }
          .form-label {
            font-size: 13px;
            font-weight: 700;
            color: #475569;
            margin-bottom: 6px;
          }
          .section-title {
            color: #64748b;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 20px;
            margin-top: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 8px;
          }
        `}
      </style>

      <ToastContainer position="bottom-right" autoClose={3000} />

      <div className="side-panel-container" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="form-header">
          <h3>
            <Activity size={20} />
            {selectedCnss ? 'Modifier Affiliation' : 'Nouvelle Affiliation'}
          </h3>
          <button
            onClick={handleClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              position: "absolute",
              right: "16px",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* BODY */}
        <div className="form-body">
          <Form onSubmit={handleSubmit} id="affiliationForm">

            {/* SECTION 1: EMPLOYE */}
            <div className="section-title">
              <User size={16} />
              <span>Employé concerné</span>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-12">
                <Form.Group>
                  <Form.Label>Employé <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={employeeOptions}
                    values={selectedEmployeeOption}
                    onChange={(values) => setSelectedEmployee(values.length > 0 ? values[0].value : null)}
                    placeholder="Rechercher par Matricule, Nom ou Prénom..."
                    disabled={!!selectedCnss}
                    searchable={true}
                    searchBy="label"
                    labelField="label"
                    valueField="value"
                    dropdownPosition="bottom"
                    className="form-control-select"
                    style={{
                      padding: '6px 10px',
                      borderRadius: '0.375rem',
                      border: '1px solid #dee2e6',
                      minHeight: '38px',
                      fontSize: '14px',
                    }}
                  />
                  {availableEmployees.length === 0 && !selectedCnss && (
                    <Form.Text className="text-muted d-block mt-1">
                      Tous les employés de ce département sont déjà affiliés.
                    </Form.Text>
                  )}
                </Form.Group>
              </div>
            </div>

            {/* SECTION 2: INFORMATIONS AFFILIATION */}
            <div className="section-title">
              <Calendar size={16} />
              <span>Détails Affiliation</span>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Numéro CNSS <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={cnssNumber}
                    onChange={(e) => setCnssNumber(e.target.value)}
                    required
                    placeholder="Ex: 123456789"
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Date d'affiliation <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Date de fin</Form.Label>
                  <Form.Control
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="Optionnel"
                  />
                </Form.Group>
              </div>

              <div className="col-md-12 mt-3">
                <Form.Group>
                  <Form.Label>Statut</Form.Label>
                  <div className="d-flex gap-4 mt-1">
                    <Form.Check
                      type="radio"
                      label="Actif"
                      name="statut"
                      id="statutA"
                      value="Actif"
                      checked={status === 'Actif'}
                      onChange={(e) => setStatus(e.target.value)}
                      className="custom-radio"
                    />
                    <Form.Check
                      type="radio"
                      label="Inactif"
                      name="statut"
                      id="statutI"
                      value="Inactif"
                      checked={status === 'Inactif'}
                      onChange={(e) => setStatus(e.target.value)}
                      className="custom-radio"
                    />
                    <Form.Check
                      type="radio"
                      label="Suspendu"
                      name="statut"
                      id="statutS"
                      value="Suspendu"
                      checked={status === 'Suspendu'}
                      onChange={(e) => setStatus(e.target.value)}
                      className="custom-radio"
                    />
                  </div>
                </Form.Group>
              </div>
            </div>

          </Form>
        </div>

        {/* FOOTER */}
        <div className="form-footer">
          <Button
            variant="outline-secondary"
            onClick={handleClose}
            className="px-4"
            style={{ borderColor: "#cbd5e1" }}
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="affiliationForm"
            disabled={loading || (!selectedCnss && availableEmployees.length === 0)}
            className="px-4 d-flex align-items-center"
            style={{ backgroundColor: "#2c767c", borderColor: "#2c767c" }}
          >
            {loading ? 'Enregistrement...' : (selectedCnss ? 'Mettre à jour' : 'Enregistrer')}
          </Button>
        </div>
      </div>
    </>
  );
}

export default AddCNSS;
