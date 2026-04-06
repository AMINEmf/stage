import React, { useState, useEffect, useCallback, useMemo } from "react";
import apiClient from "../../services/apiClient";
import { Form } from "react-bootstrap";
import { ToastContainer } from "react-toastify";
import Select from "react-dropdown-select";
import Swal from "sweetalert2";
import { User, ShieldCheck, X, Clock } from "lucide-react";
import ManageResourceModal from "../CNSS/ManageResourceModal";
import "../CNSS/CnssForm.css";

function AddCarriere({
  departementId,
  selectedDepartementName,
  toggleCarriereForm,
  onCarriereAdded = () => { },
  selectedCarriere = null,
  onCarriereUpdated,
  preSelectedEmployee = null,
}) {
  const [matricule, setMatricule] = useState("");
  const [fullName, setFullName] = useState("");
  const [posteActuel, setPosteActuel] = useState("");
  const [grade, setGrade] = useState("");
  const [posteId, setPosteId] = useState(null);
  const [promotionDate, setPromotionDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeOption, setSelectedEmployeeOption] = useState([]);
  const [selectedManagerOption, setSelectedManagerOption] = useState([]);
  const [managerId, setManagerId] = useState(null);
  const [postes, setPostes] = useState([]);
  const [selectedPosteOption, setSelectedPosteOption] = useState([]);
  const [loadingPostes, setLoadingPostes] = useState(false);

  // Type d'évolution
  const [typeEvolutionOptions, setTypeEvolutionOptions] = useState([]);
  const [typeEvolutionValue, setTypeEvolutionValue] = useState([]);
  const [manageTypeModal, setManageTypeModal] = useState(false);
  const [typeEvolutionResources, setTypeEvolutionResources] = useState([]);

  // Grades chargés depuis l'API (remplace mockData)
  const [gradesAPI, setGradesAPI] = useState([]);

  // Période (auto-calculée)
  const [periode, setPeriode] = useState("");

  const extractEmployees = useCallback((payload) => {
    if (Array.isArray(payload)) {
      if (payload.length > 0 && payload[0]?.employes) {
        const map = new Map();
        payload.forEach((dept) => {
          (dept.employes || []).forEach((emp) => {
            if (!map.has(emp.id)) map.set(emp.id, emp);
          });
        });
        return Array.from(map.values());
      }
      return payload;
    }
    return Array.isArray(payload?.data) ? payload.data : [];
  }, []);

  const employeeHasDepartement = useCallback((emp, deptId) => {
    if (!deptId || !emp) return false;
    if (emp?.departement_id != null && String(emp.departement_id) === String(deptId)) return true;
    if (emp?.departement?.id != null && String(emp.departement.id) === String(deptId)) return true;
    if (Array.isArray(emp?.departements)) {
      return emp.departements.some((d) => String(d.id) === String(deptId));
    }
    return false;
  }, []);

  const formatManagerLabel = useCallback((emp) => {
    if (!emp) return "";
    const nomComplet = `${emp.nom || ""} ${emp.prenom || ""}`.trim();
    const dept = emp?.departements?.[0]?.nom || "";
    const poste = emp?.poste?.nom || "";
    const suffix = [poste, dept].filter(Boolean).join(" • ");
    if (suffix) {
      return `${nomComplet} (${emp.matricule || "—"}) — ${suffix}`;
    }
    return `${nomComplet} (${emp.matricule || "—"})`;
  }, []);

  const resolvedDepartementId = useMemo(() => {
    if (departementId && typeof departementId === "object") {
      return departementId.id ?? departementId.value ?? departementId.departement_id ?? null;
    }
    return departementId ?? null;
  }, [departementId]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await apiClient.get("/employes/list");
        const list = extractEmployees(response.data);
        setEmployees(list);
      } catch (error) {
        console.log("STATUS:", error.response?.status);
        console.log("DATA:", error.response?.data);
        console.log("FULL ERROR:", error);
        setEmployees([]);
      }
    };
    fetchEmployees();
  }, [extractEmployees, resolvedDepartementId]);

  useEffect(() => {
    const fetchPostes = async () => {
      setLoadingPostes(true);
      try {
        const response = await apiClient.get("/postes");
        const payload = response.data;
        const list = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
        // Deduplicate postes by id
        const uniqueMap = new Map();
        list.forEach((p) => {
          if (p.id && !uniqueMap.has(p.id)) uniqueMap.set(p.id, p);
        });
        setPostes(Array.from(uniqueMap.values()));
      } catch (error) {
        console.error("Erreur lors du chargement des postes:", error);
        setPostes([]);
      } finally {
        setLoadingPostes(false);
      }
    };
    fetchPostes();
  }, []);

  // Fetch types d'évolution from API
  const fetchTypesEvolution = useCallback(async () => {
    try {
      const response = await apiClient.get("/types-evolution");
      const list = Array.isArray(response.data) ? response.data : [];
      const options = list.map((t) => ({ label: t.name, value: t.name }));
      setTypeEvolutionOptions(options);
      setTypeEvolutionResources(list.map((t) => ({ id: t.id, name: t.name })));
    } catch (error) {
      console.error("Erreur chargement types évolution:", error);
      setTypeEvolutionOptions([]);
      setTypeEvolutionResources([]);
    }
  }, []);

  useEffect(() => {
    fetchTypesEvolution();
  }, [fetchTypesEvolution]);

  // Charger les grades depuis l'API
  useEffect(() => {
    apiClient.get("/grades")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setGradesAPI(list.map((g) => ({ id: String(g.id), label: g.nom || g.name || g.label || `Grade ${g.id}` })));
      })
      .catch(() => setGradesAPI([]));
  }, []);

  // Calcul de la période depuis date_embauche
  const computePeriode = useCallback((dateEmbauche) => {
    if (!dateEmbauche) return "";
    const start = new Date(dateEmbauche);
    if (isNaN(start.getTime())) return "";
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years > 0 && months > 0) return `${years} an${years > 1 ? "s" : ""} et ${months} mois`;
    if (years > 0) return `${years} an${years > 1 ? "s" : ""}`;
    if (months > 0) return `${months} mois`;
    return "Moins d'un mois";
  }, []);

  const filteredEmployees = useMemo(() => {
    if (!resolvedDepartementId) return [];
    return employees.filter((emp) => employeeHasDepartement(emp, resolvedDepartementId));
  }, [employees, resolvedDepartementId, employeeHasDepartement]);

  const employeeOptions = useMemo(() =>
    filteredEmployees.map(emp => ({
      value: emp.id,
      label: `${emp.matricule} - ${emp.nom} ${emp.prenom}`,
      emp: emp
    })), [filteredEmployees]
  );

  const selectedEmployeId = useMemo(() => {
    return preSelectedEmployee?.id || selectedEmployeeOption[0]?.value || selectedCarriere?.employe_id || null;
  }, [preSelectedEmployee, selectedEmployeeOption, selectedCarriere]);

  const managerOptions = useMemo(() => {
    const selectedEmp = selectedEmployeeOption[0]?.emp || preSelectedEmployee || null;

    const getDeptIds = (emp) => {
      const ids = [];
      if (emp?.departement_id) ids.push(String(emp.departement_id));
      if (Array.isArray(emp?.departements)) {
        emp.departements.forEach((d) => {
          if (d?.id) ids.push(String(d.id));
        });
      }
      return Array.from(new Set(ids));
    };

    const selectedDeptIds = getDeptIds(selectedEmp);
    const selectedGradeId = selectedEmp?.poste?.grade_id != null
      ? Number(selectedEmp.poste.grade_id)
      : null;

    return employees
      .filter((emp) => {
        if (String(emp.id) === String(selectedEmployeId || "")) return false;

        if (Number(emp?.active || 0) !== 1) return false;

        if (selectedDeptIds.length > 0) {
          const empDeptIds = getDeptIds(emp);
          const sameDept = empDeptIds.some((id) => selectedDeptIds.includes(id));
          if (!sameDept) return false;
        }

        if (selectedGradeId != null) {
          const managerGradeId = emp?.poste?.grade_id != null ? Number(emp.poste.grade_id) : null;
          if (managerGradeId != null && managerGradeId <= selectedGradeId) return false;
        }

        return true;
      })
      .map((emp) => ({
        value: emp.id,
        label: formatManagerLabel(emp),
        emp,
      }))
      .sort((a, b) => {
        const aName = `${a.emp?.nom || ""} ${a.emp?.prenom || ""}`.trim();
        const bName = `${b.emp?.nom || ""} ${b.emp?.prenom || ""}`.trim();
        return aName.localeCompare(bName, "fr", { sensitivity: "base" });
      });
  }, [employees, selectedEmployeId, formatManagerLabel]);

  useEffect(() => {
    if (!selectedManagerOption.length) return;
    const selected = selectedManagerOption[0];
    const stillValid = managerOptions.some((opt) => String(opt.value) === String(selected.value));
    if (!stillValid) {
      setSelectedManagerOption([]);
      setManagerId(null);
    }
  }, [managerOptions, selectedManagerOption]);

  // Auto-select the pre-selected employee when provided
  useEffect(() => {
    if (!preSelectedEmployee || selectedCarriere) return;
    const emp = preSelectedEmployee;
    setFullName(`${emp.nom ?? ""} ${emp.prenom ?? ""}`.trim());
    setMatricule(emp.matricule ?? "");
    setSelectedEmployeeOption([{
      value: emp.id,
      label: `${emp.matricule} - ${emp.nom} ${emp.prenom}`,
      emp: emp,
    }]);
    setPosteActuel(emp.fonction || emp.poste?.nom || "");
    setPosteId(emp.poste_id || null);
    const empGrade = emp.poste?.grade_id || "";
    if (empGrade) setGrade(String(empGrade));
    setPeriode(computePeriode(emp.date_embauche));

    const currentManagerId = emp.manager_id || null;
    setManagerId(currentManagerId);
    if (currentManagerId && employees.length > 0) {
      const managerEmp = employees.find((item) => String(item.id) === String(currentManagerId));
      if (managerEmp) {
        setSelectedManagerOption([{
          value: managerEmp.id,
          label: formatManagerLabel(managerEmp),
          emp: managerEmp,
        }]);
      }
    }
  }, [preSelectedEmployee, selectedCarriere, computePeriode, employees, formatManagerLabel]);

  useEffect(() => {
    if (selectedCarriere) {
      setMatricule(selectedCarriere.matricule || "");
      setFullName(selectedCarriere.full_name || "");
      
      // Préparer l'option employé - essayer de trouver l'employé complet dans la liste
      if (selectedCarriere.employe_id) {
        const employeeInList = employees.find(e => String(e.id) === String(selectedCarriere.employe_id));
        if (employeeInList) {
          setSelectedEmployeeOption([{
            value: employeeInList.id,
            label: `${employeeInList.matricule} - ${employeeInList.nom} ${employeeInList.prenom}`,
            emp: employeeInList
          }]);
        } else {
          // Si l'employé n'est pas dans la liste, créer une option basique
          setSelectedEmployeeOption([{
            label: selectedCarriere.full_name,
            value: selectedCarriere.employe_id
          }]);
        }
      } else {
        setSelectedEmployeeOption([]);
      }
      
      setPosteActuel(selectedCarriere.poste_actuel || "");
      setGrade(selectedCarriere.grade || "");
      setPromotionDate(selectedCarriere.derniere_promotion || "");
      setPosteId(selectedCarriere.poste_id || null);
      const managerIdValue = selectedCarriere.manager_id || selectedCarriere.manager?.id || null;
      setManagerId(managerIdValue);
      if (managerIdValue) {
        const managerEmp = employees.find((item) => String(item.id) === String(managerIdValue));
        if (managerEmp) {
          setSelectedManagerOption([{
            value: managerEmp.id,
            label: formatManagerLabel(managerEmp),
            emp: managerEmp,
          }]);
        } else if (selectedCarriere.manager?.nom_complet) {
          setSelectedManagerOption([{
            value: managerIdValue,
            label: selectedCarriere.manager.nom_complet,
          }]);
        } else {
          setSelectedManagerOption([]);
        }
      } else {
        setSelectedManagerOption([]);
      }
      if (selectedCarriere.type_evolution) {
        setTypeEvolutionValue([{ label: selectedCarriere.type_evolution, value: selectedCarriere.type_evolution }]);
      } else {
        setTypeEvolutionValue([]);
      }
      setPeriode(selectedCarriere.periode || "");
      if (selectedCarriere.poste_actuel && postes.length > 0) {
        const found = postes.find(
          (p) => (p.nom || p.label || "") === selectedCarriere.poste_actuel
        );
        if (found) {
          setSelectedPosteOption([{ value: found.id, label: found.nom || found.label || "", poste: found }]);
          if (found.grade_id) setGrade(String(found.grade_id));
          setPosteId(found.id);
        }
      }
      return;
    }
    // Don't reset if preSelectedEmployee is provided — its own useEffect handles the fill
    if (preSelectedEmployee) return;
    setMatricule("");
    setFullName("");
    setSelectedEmployeeOption([]);
    setPosteActuel("");
    setGrade("");
    setPosteId(null);
    setPromotionDate("");
    setSelectedPosteOption([]);
    setTypeEvolutionValue([]);
    setPeriode("");
    setManagerId(null);
    setSelectedManagerOption([]);
  }, [selectedCarriere, preSelectedEmployee, postes, employees, formatManagerLabel]);

  const handleEmployeeChange = (selected) => {
    setSelectedEmployeeOption(selected);
    if (selected.length > 0) {
      const emp = selected[0].emp;
      
      // Si emp n'existe pas (cas de modification où on a seulement label/value), ne rien faire
      // Les données sont déjà chargées par le useEffect de selectedCarriere
      if (!emp) {
        return;
      }
      
      setFullName(`${emp.nom} ${emp.prenom}`);
      setMatricule(emp.matricule);
      setPeriode(computePeriode(emp.date_embauche));
      // Automatically set current post and grade if they exist in employee data
      setPosteActuel(emp.fonction || emp.poste_actuel || emp.poste?.nom || emp.poste || "");
      setPosteId(emp.poste_id || null);
      const empGrade = emp.grade_id || emp.poste?.grade_id || emp.grade?.id || emp.grade || "";
      if (empGrade) {
        setGrade(String(empGrade));
      }
      if (emp.poste_id && postes.length > 0) {
        const found = postes.find((p) => String(p.id) === String(emp.poste_id));
        if (found) {
          setSelectedPosteOption([{ value: found.id, label: found.nom || found.label || "", poste: found }]);
          if (found.grade_id) setGrade(String(found.grade_id));
          setPosteId(found.id);
        }
      } else {
        setSelectedPosteOption([]);
      }

      const currentManagerId = emp.manager_id || null;
      setManagerId(currentManagerId);
      if (currentManagerId) {
        const managerEmp = employees.find((item) => String(item.id) === String(currentManagerId));
        if (managerEmp) {
          setSelectedManagerOption([{
            value: managerEmp.id,
            label: formatManagerLabel(managerEmp),
            emp: managerEmp,
          }]);
        } else {
          setSelectedManagerOption([]);
        }
      } else {
        setSelectedManagerOption([]);
      }
    } else {
      setFullName("");
      setMatricule("");
      setPosteActuel("");
      setGrade("");
      setSelectedPosteOption([]);
      setPosteId(null);
      setPeriode("");
      setManagerId(null);
      setSelectedManagerOption([]);
    }
  };

  useEffect(() => {
    const selectedEmp = selectedEmployeeOption[0]?.emp;
    if (!selectedEmp?.poste_id || postes.length === 0) return;
    const found = postes.find((p) => String(p.id) === String(selectedEmp.poste_id));
    if (found) {
      setSelectedPosteOption([{ value: found.id, label: found.nom || found.label || "", poste: found }]);
      setPosteActuel(found.nom || found.label || "");
      setPosteId(found.id);
      if (found.grade_id) {
        setGrade(String(found.grade_id));
      }
    }
  }, [postes, selectedEmployeeOption]);

  const handlePosteChange = (selected) => {
    setSelectedPosteOption(selected);
    if (selected.length > 0) {
      const poste = selected[0].poste || {};
      const label = poste.nom || poste.label || selected[0].label || "";
      setPosteActuel(label);
      setPosteId(poste.id ?? selected[0].value ?? null);
      const gradeId = poste.grade_id ?? poste.grade?.id ?? null;
      if (gradeId != null) {
        setGrade(String(gradeId));
      } else {
        setGrade("");
      }
    } else {
      setPosteActuel("");
      setGrade("");
      setPosteId(null);
    }
  };

  const handleClose = useCallback(() => {
    setMatricule("");
    setFullName("");
    setSelectedEmployeeOption([]);
    setPosteActuel("");
    setGrade("");
    setPromotionDate("");
    setSelectedPosteOption([]);
    setPosteId(null);
    setTypeEvolutionValue([]);
    setPeriode("");
    setManagerId(null);
    setSelectedManagerOption([]);
    toggleCarriereForm();
  }, [toggleCarriereForm]);

  const selectedPoste = selectedPosteOption[0]?.poste;
  const gradeLocked = Boolean(selectedPoste && (selectedPoste.grade_id ?? selectedPoste.grade?.id));
  const canSubmit = useMemo(
    () => !loading && Boolean(matricule.trim() && fullName.trim() && posteActuel.trim() && posteId && grade),
    [loading, matricule, fullName, posteActuel, posteId, grade]
  );



  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedDepartementName) {
      Swal.fire("Erreur", "Veuillez sélectionner un département.", "warning");
      return;
    }

    if (!matricule.trim() || !fullName.trim() || !posteActuel.trim() || !posteId || !grade) {
      Swal.fire("Erreur", "Veuillez sélectionner un poste et renseigner les champs obligatoires.", "warning");
      return;
    }

    // Get the employee id
    const employeId = preSelectedEmployee?.id || selectedEmployeeOption[0]?.value;
    if (!employeId) {
      Swal.fire("Erreur", "Aucun employé sélectionné.", "warning");
      return;
    }

    if (managerId && String(managerId) === String(employeId)) {
      Swal.fire("Erreur", "Un employé ne peut pas être son propre manager.", "warning");
      return;
    }

    setLoading(true);

    try {
      // Call the real API to create/update career evolution
      const apiPayload = {
        employe_id: employeId,
        poste_id: posteId,
        grade_id: grade ? Number(grade) : null,
        manager_id: managerId ? Number(managerId) : null,
      };

      await apiClient.post("/carrieres", apiPayload);

      Swal.fire("Succès", "Évolution de carrière enregistrée", "success");
      if (selectedCarriere) {
        onCarriereUpdated?.();
      } else {
        onCarriereAdded?.();
      }
      handleClose();
    } catch (error) {
      console.error("Erreur carrière:", error);
      const msg = error.response?.data?.message || error.response?.data?.error || "Une erreur est survenue";
      Swal.fire("Erreur", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="bottom-right" autoClose={3000} />

      <div className="cnss-side-panel" onClick={(event) => event.stopPropagation()}>
        <div className="cnss-form-header">
          <div style={{ width: "24px" }}></div>
          <h5>{selectedCarriere ? "Modifier Carrière" : "Ajouter à la carrière"}</h5>
          <button className="cnss-close-btn" onClick={handleClose} type="button" aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <div
          className="cnss-form-body"
          style={{
            overflowX: "hidden",
          }}
        >
          <Form onSubmit={handleSubmit} id="carriereForm">
            <div className="cnss-section-title">
              <User size={14} />
              <span>Employé concerné</span>
            </div>

            <div className="row g-3 mb-1">
              <div className="col-md-6">
                <div className="cnss-field-group">
                  <label className="cnss-form-label">
                    Matricule <span className="text-danger">*</span>
                  </label>
                  <Form.Control
                    className="cnss-form-control"
                    type="text"
                    value={matricule}
                    readOnly
                    style={{ backgroundColor: "#f8f9fa", cursor: "not-allowed" }}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="cnss-field-group">
                  <label className="cnss-form-label">
                    Employé <span className="text-danger">*</span>
                  </label>
                  {preSelectedEmployee ? (
                    <Form.Control
                      className="cnss-form-control"
                      type="text"
                      value={fullName}
                      readOnly
                      style={{ backgroundColor: "#f8f9fa", cursor: "not-allowed" }}
                    />
                  ) : (
                    <>
                      <Select
                        options={employeeOptions}
                        values={selectedEmployeeOption}
                        onChange={handleEmployeeChange}
                        placeholder="Rechercher un employé..."
                        searchable
                        className="cnss-form-control custom-select-carriere"
                        noDataRenderer={() => (
                          <div style={{ padding: '10px', textAlign: 'center', color: '#666' }}>
                            Aucun employé trouvé dans ce département
                          </div>
                        )}
                      />
                      <style>{`
                        .custom-select-carriere {
                          border: 1px solid #e2e8f0 !important;
                          border-radius: 8px !important;
                          padding: 5px 10px !important;
                          min-height: 42px !important;
                          background: white !important;
                        }
                        .custom-select-carriere .react-dropdown-select-content {
                          font-size: 14px !important;
                        }
                        .custom-select-carriere .react-dropdown-select-input {
                          font-size: 14px !important;
                        }
                      `}</style>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="cnss-section-title">
              <ShieldCheck size={14} />
              <span>Détails carrière</span>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <div className="cnss-field-group">
                  <label className="cnss-form-label">
                    Poste actuel <span className="text-danger">*</span>
                  </label>
                  <Select
                    options={postes.map((p) => ({ value: p.id, label: p.nom || p.label || "", poste: p }))}
                    values={selectedPosteOption}
                    onChange={handlePosteChange}
                    placeholder={
                      loadingPostes
                        ? "Chargement des postes..."
                        : "Rechercher et sélectionner un poste"
                    }
                    searchable
                    className="cnss-form-control custom-select-carriere"
                    noDataRenderer={() => (
                      <div style={{ padding: "10px", textAlign: "center", color: "#666" }}>
                        {loadingPostes ? "Chargement..." : "Aucun poste disponible"}
                      </div>
                    )}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="cnss-field-group">
                  <label className="cnss-form-label">
                    Grade <span className="text-danger">*</span>
                  </label>
                  <Form.Select
                    className="cnss-form-control"
                    value={grade}
                    onChange={(event) => setGrade(event.target.value)}
                    required
                    disabled={gradeLocked}
                  >
                    <option value="">Sélectionner</option>
                    {gradesAPI.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </Form.Select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="cnss-field-group">
                  <label className="cnss-form-label">
                    Type d'évolution <span className="text-danger">*</span>
                  </label>
                  <div className="unified-input-group">
                    <div style={{ flex: 1 }}>
                      <Select
                        options={typeEvolutionOptions}
                        values={typeEvolutionValue}
                        onChange={(values) => setTypeEvolutionValue(values.length > 0 ? [values[0]] : [])}
                        placeholder="Choisir un type..."
                        searchable
                        clearable={false}
                        create={false}
                        dropdownPosition="auto"
                        dropdownHeight="300px"
                        className="react-dropdown-select"
                        labelField="label"
                        valueField="value"
                        keepSelectedInList={true}
                      />
                    </div>
                    <button
                      type="button"
                      className="cnss-btn-add"
                      onClick={() => setManageTypeModal(true)}
                      title="Gérer les types d'évolution"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="cnss-field-group">
                  <label className="cnss-form-label">Manager direct</label>
                  <Select
                    options={managerOptions}
                    values={selectedManagerOption}
                    onChange={(values) => {
                      const next = values.length > 0 ? [values[0]] : [];
                      setSelectedManagerOption(next);
                      setManagerId(next[0]?.value ?? null);
                    }}
                    placeholder="Sélectionner un manager..."
                    searchable
                    clearable
                    className="cnss-form-control custom-select-carriere"
                    noDataRenderer={() => (
                      <div style={{ padding: '10px', textAlign: 'center', color: '#666' }}>
                        Aucun manager disponible
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="cnss-section-title">
              <Clock size={14} />
              <span>Ancienneté & Promotion</span>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <div className="cnss-field-group">
                  <label className="cnss-form-label">Période (ancienneté)</label>
                  <Form.Control
                    className="cnss-form-control"
                    type="text"
                    value={periode}
                    readOnly
                    style={{ backgroundColor: "#f8f9fa", cursor: "not-allowed" }}
                    placeholder="Calculée automatiquement"
                  />
                  <small className="text-muted">Calculée depuis la date d'embauche jusqu'à aujourd'hui</small>
                </div>
              </div>
              <div className="col-md-6">
                <div className="cnss-field-group">
                  <label className="cnss-form-label">Dernière promotion</label>
                  <Form.Control
                    className="cnss-form-control"
                    type="date"
                    value={promotionDate}
                    onChange={(event) => setPromotionDate(event.target.value)}
                  />
                </div>
              </div>
            </div>

          </Form>

          <ManageResourceModal
            show={manageTypeModal}
            onHide={() => setManageTypeModal(false)}
            title="Gérer les Types d'évolution"
            items={typeEvolutionResources}
            onAdd={async (name) => {
              try {
                await apiClient.post("/types-evolution", { name });
                await fetchTypesEvolution();
              } catch (err) {
                Swal.fire("Erreur", err.response?.data?.message || "Erreur lors de l'ajout", "error");
              }
            }}
            onEdit={async (id, name) => {
              try {
                await apiClient.put(`/types-evolution/${id}`, { name });
                await fetchTypesEvolution();
              } catch (err) {
                Swal.fire("Erreur", err.response?.data?.message || "Erreur lors de la modification", "error");
              }
            }}
            onDelete={async (id) => {
              try {
                await apiClient.delete(`/types-evolution/${id}`);
                await fetchTypesEvolution();
                setTypeEvolutionValue((prev) => prev.filter((v) => v.value !== id));
              } catch (err) {
                Swal.fire("Erreur", err.response?.data?.message || "Erreur lors de la suppression", "error");
              }
            }}
            placeholder="Nouveau type..."
          />
        </div>

        <div className="cnss-form-footer">
          <button
            type="button"
            className="cnss-btn-secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="submit"
            form="carriereForm"
            className="cnss-btn-primary"
            disabled={!canSubmit}
          >
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </>
  );
}

export default AddCarriere;


