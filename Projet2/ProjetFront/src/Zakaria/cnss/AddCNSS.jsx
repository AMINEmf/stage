import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Form, Tabs, Tab } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import Swal from 'sweetalert2';
import Select from "react-dropdown-select";
import '../Employe/AddEmp.css'; 


function AddCNSS({
  selectedDepartementId,
  toggleCnssForm,
  onCnssAdded = () => {},
  selectedCnss,
  onCnssUpdated,
  fetchCnss,
  employeesList = [], // Reçu depuis CNSSTable
  cnssAffiliationsList = [], // Reçu depuis CNSSTable
}) {
  const [employees, setEmployees] = useState(employeesList.length > 0 ? employeesList : []);
  const [cnssAffiliations, setCnssAffiliations] = useState(cnssAffiliationsList.length > 0 ? cnssAffiliationsList : []);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [salary, setSalary] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('Actif');
  const [loading, setLoading] = useState(false);
  const [cnssNumber, setCnssNumber] = useState('');

  useEffect(() => {
    if (selectedCnss) {
      setSelectedEmployee(selectedCnss.employe_id);
      setSalary(selectedCnss.salaire || '');
      setStartDate(selectedCnss.date_debut || '');
      setEndDate(selectedCnss.date_fin || '');
      setStatus(selectedCnss.statut || 'Actif');
      setCnssNumber(selectedCnss.numero_cnss || '');
    }
  }, [selectedCnss]);

  // Si les données sont passées en props, pas besoin de fetch
  useEffect(() => {
    if (employeesList && employeesList.length > 0) {
      setEmployees(employeesList);
    } else {
       fetchEmployees();
    }

    if (cnssAffiliationsList && cnssAffiliationsList.length > 0) {
      setCnssAffiliations(cnssAffiliationsList);
    } else {
       fetchCnssAffiliations();
    }
  }, [selectedDepartementId, employeesList, cnssAffiliationsList]);

  const fetchEmployees = async () => {
    // Évite de fetch si déjà reçu via props
    if (employeesList && employeesList.length > 0) return; 
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/departements/employes');
      setEmployees(response.data);
      console.log('AddCNSS: Employees fetched manually, count:', response.data.length);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchCnssAffiliations = async () => {
    // Évite de fetch si déjà reçu via props
    if (cnssAffiliationsList && cnssAffiliationsList.length > 0) return;
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/cnss/affiliations');
      setCnssAffiliations(response.data);
      console.log('AddCNSS: Affiliations fetched manually, count:', response.data.length);
    } catch (error) {
      console.error('Error fetching affiliations:', error);
    }
  };

  // ÉTAPE 1 : Filtrer les employés du département sélectionné
  const employeesInDepartment = selectedDepartementId 
    ? employees.filter(emp => {
        if (!emp.departements || !Array.isArray(emp.departements)) return false;
        return emp.departements.some(dept => dept.id === selectedDepartementId);
      })
    : [];
  
  console.log('AddCNSS: Employees in department:', employeesInDepartment.length);

  // ÉTAPE 2 : Récupérer les IDs des employés déjà affiliés
  const affiliatedEmployeeIds = cnssAffiliations.map(cnss => cnss.employe_id);
  
  // ÉTAPE 3 : EXCLUSION - Garder uniquement les employés du département NON affiliés
  const availableEmployees = employeesInDepartment.filter(emp => !affiliatedEmployeeIds.includes(emp.id));
  
  console.log('AddCNSS: Available (non-affiliated) employees in department:', availableEmployees.length);

  // Prepare options for Select
  const employeeOptions = availableEmployees.map(emp => ({
    value: emp.id,
    label: `${emp.matricule} - ${emp.nom} ${emp.prenom}`
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedEmployee) {
      Swal.fire('Erreur', 'Veuillez sélectionner un employé.', 'warning');
      return;
    }

    setLoading(true);

    const data = {
      employe_id: selectedEmployee,
      numero_cnss: cnssNumber,
      salaire: salary,
      date_debut: startDate,
      date_fin: endDate || null,
      statut: status,
      departement_id: selectedDepartementId,
    };

    try {
      if (selectedCnss) {
        // Update
        await axios.put(`http://127.0.0.1:8000/api/cnss/affiliations/${selectedCnss.id}`, data);
        onCnssUpdated(data);
        Swal.fire('Succès', 'Affiliation CNSS mise à jour', 'success');
      } else {
        // Create
        const response = await axios.post('http://127.0.0.1:8000/api/cnss/affiliations', data);
        onCnssAdded(response.data);
        Swal.fire('Succès', 'Affiliation CNSS ajoutée', 'success');
      }
      handleClose();
      if (fetchCnss) fetchCnss();
    } catch (error) {
      console.error('Error saving affiliation:', error);
      Swal.fire('Erreur', error.response?.data?.message || 'Une erreur est survenue', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedEmployee(null);
    setSalary('');
    setStartDate('');
    setEndDate('');
    setStatus('Actif');
    setCnssNumber('');
    toggleCnssForm();
  };

  console.log('AddCNSS rendered, departementId:', selectedDepartementId);

  return (
    <div className="addemp-overlay">
      <ToastContainer position="bottom-right" autoClose={3000} />
      
      <div className="addper">
        <div className="employee-body" style={{ margin: 0, padding: 0, overflowX: "hidden" }}>
          <Form onSubmit={handleSubmit}>
            <div style={{ position: "relative" }}>
              
              <button
                type="button"
                onClick={handleClose}
                style={{
                  position: 'fixed',
                  top: '10%',
                  right: '25px',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '2rem',
                  color: '#4b5563',
                  cursor: 'pointer',
                  zIndex: 9999
                }}
                aria-label="Fermer le formulaire"
              >
                &times;
              </button>

              <div style={{ padding: '20px' }}>
                <h3 className="mb-4" style={{ 
                  borderBottom: '2px solid #e9ecef', 
                  paddingBottom: '10px',
                  color: '#2c3e50',
                  fontWeight: '600'
                }}>
                  {selectedCnss ? 'Modifier Affiliation CNSS' : 'Ajouter Affiliation CNSS'}
                </h3>

                <Tabs
                  defaultActiveKey="general"
                  id="cnss-tabs"
                  className="mb-4 custom-tabs"
                  fill
                >
                  <Tab eventKey="general" title="Informations Générales">
                    <div className="row g-3">
                      
                      <div className="col-md-12 mb-3">
                        <Form.Group>
                          <Form.Label className="fw-bold">Employé <span className="text-danger">*</span></Form.Label>
                          <Select
                            options={employeeOptions}
                            values={
                                selectedEmployee 
                                ? employeeOptions.filter(opt => String(opt.value) === String(selectedEmployee))
                                : []
                            }
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
                                fontSize: '1rem',
                                color: '#212529',
                                backgroundColor: '#fff',
                            }}
                          />
                          {/* Hidden input for form validation */}
                          <input 
                            tabIndex={-1}
                            autoComplete="off"
                            style={{ opacity: 0, height: 0, position: 'absolute' }}
                            value={selectedEmployee || ''}
                            onChange={()=>{}}
                            required={!selectedCnss} 
                          />
                          
                          {availableEmployees.length === 0 && !selectedCnss && (
                            <Form.Text className="text-muted d-block mt-1">
                              Tous les employés de ce département sont déjà affiliés.
                            </Form.Text>
                          )}
                        </Form.Group>
                      </div>

                      <div className="col-md-6 mb-3">
                        <Form.Group>
                          <Form.Label className="fw-bold">Numéro CNSS <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            value={cnssNumber}
                            onChange={(e) => setCnssNumber(e.target.value)}
                            required
                            placeholder="Ex: 123456789"
                          />
                        </Form.Group>
                      </div>

                      <div className="col-md-6 mb-3">
                        <Form.Group>
                          <Form.Label className="fw-bold">Salaire Déclaré (MAD) <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="number"
                            value={salary}
                            onChange={(e) => setSalary(e.target.value)}
                            min="0"
                            step="0.01"
                            required
                            placeholder="0.00"
                          />
                        </Form.Group>
                      </div>

                      <div className="col-md-6 mb-3">
                        <Form.Group>
                          <Form.Label className="fw-bold">Date d'affiliation <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                          />
                        </Form.Group>
                      </div>

                      <div className="col-md-6 mb-3">
                        <Form.Group>
                          <Form.Label className="fw-bold">Date de fin</Form.Label>
                          <Form.Control
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            placeholder="Optionnel"
                          />
                        </Form.Group>
                      </div>

                      <div className="col-md-12 mb-3">
                        <Form.Group>
                          <Form.Label className="fw-bold">Statut</Form.Label>
                          <div className="d-flex gap-4 mt-2">
                             <Form.Check 
                                type="radio"
                                label="Actif"
                                name="statut"
                                id="statutA"
                                value="Actif"
                                checked={status === 'Actif'}
                                onChange={(e) => setStatus(e.target.value)}
                             />
                             <Form.Check 
                                type="radio"
                                label="Inactif"
                                name="statut"
                                id="statutI"
                                value="Inactif"
                                checked={status === 'Inactif'}
                                onChange={(e) => setStatus(e.target.value)}
                             />
                              <Form.Check 
                                type="radio"
                                label="Suspendu"
                                name="statut"
                                id="statutS"
                                value="Suspendu"
                                checked={status === 'Suspendu'}
                                onChange={(e) => setStatus(e.target.value)}
                             />
                          </div>
                        </Form.Group>
                      </div>

                    </div>
                  </Tab>
                </Tabs>

                <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                  <Button 
                    variant="outline-secondary" 
                    onClick={handleClose}
                    className="me-2"
                  >
                    Annuler
                  </Button>
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={loading}
                    style={{ backgroundColor: '#00afaa', borderColor: '#00afaa' }}
                  >
                    {loading ? 'Enregistrement...' : (selectedCnss ? 'Mettre à jour' : 'Enregistrer')}
                  </Button>
                </div>

              </div>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default AddCNSS;
