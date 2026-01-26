import React, { useState, useEffect, useCallback, memo } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { IoFolderOpenOutline } from "react-icons/io5";
import { FaMinus, FaPlus } from "react-icons/fa6";
import "./DepartementPanel.css";


export const DepartmentPanel = memo(({
  onSelectDepartment,
  selectedDepartmentId,
  includeSubDepartments,
  onIncludeSubDepartmentsChange,
  employees = [],
  selectedEmployee = null,
  selectedEmployees = new Set(),
  processedEmployees = new Set(),
  onSelectEmployee,
  onCheckEmployee,
  findDepartmentName,
  filtersVisible = false
}) => {
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false); 
  const [error, setError] = useState(null);
  const [expandedDepartments, setExpandedDepartments] = useState({});
  const [checkedEmployeesData, setCheckedEmployeesData] = useState([]);
  const [searchTerms, setSearchTerms] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const fetchDepartments = useCallback(async () => {
    setError(null);
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/departements/hierarchy");
      console.log('Departments data:', response.data);

      const initialExpandedState = {};
      response.data.forEach(dept => {
        if (dept.children && dept.children.length > 0) {
          initialExpandedState[dept.id] = false;
        }
      });
      setExpandedDepartments(initialExpandedState);
      setDepartments(response.data);
      localStorage.setItem('departmentPanelData', JSON.stringify(response.data));
    } catch (error) {
      console.error("Error fetching departments:", error);
      setError("An error occurred while fetching departments. Please try again.");
      setDepartments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);


  
  useEffect(() => {
    // Charger d'abord depuis le cache localStorage (instantané)
    const departmentsFromStorage = localStorage.getItem('departmentPanelData');
    
    if (departmentsFromStorage) {
      const cachedDepartments = JSON.parse(departmentsFromStorage);
      setDepartments(cachedDepartments);
      setIsLoading(false); // Immédiatement masquer le loading
      
      // Initialiser l'état d'expansion pour les départements en cache
      const initialExpandedState = {};
      cachedDepartments.forEach(dept => {
        if (dept.children && dept.children.length > 0) {
          initialExpandedState[dept.id] = false;
        }
      });
      setExpandedDepartments(initialExpandedState);
    } else {
      // Si pas de cache, alors on affiche le loading
      setIsLoading(true);
    }

    // Puis charger les données fraîches depuis l'API
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    const checked = employees.filter(emp => selectedEmployees.has(emp.id));
    setCheckedEmployeesData(checked);

    if (employees.length > 0) {
      const allSelected = employees.every(emp =>
        selectedEmployees.has(emp.id) || processedEmployees.has(emp.id)
      );
      setSelectAll(allSelected);
    } else {
      setSelectAll(false);
    }
  }, [selectedEmployees, employees, processedEmployees]);

  const handleSearchChange = (e) => {
    const terms = e.target.value.toLowerCase().split(',').map(term => term.trim()).filter(term => term);
    setSearchTerms(terms);
  };

  const handleSelectAllChange = (e) => {
    const isChecked = e.target.checked;
    setSelectAll(isChecked);

    if (isChecked) {
      employees.forEach(emp => {
        if (!processedEmployees.has(emp.id)) {
          selectedEmployees.add(emp.id);
        }
      });
    } else {
      employees.forEach(emp => {
        selectedEmployees.delete(emp.id);
      });
    }

    onCheckEmployee(e, { id: 'all' }, isChecked);
  };

  const filteredEmployees = searchTerms.length === 0
    ? employees
    : employees.filter(emp =>
      searchTerms.some(term =>
        emp.nom?.toLowerCase().includes(term) ||
        emp.prenom?.toLowerCase().includes(term) ||
        emp.matricule?.toLowerCase().includes(term)
      )
    );

  const toggleExpand = useCallback((departmentId, e) => {
    e.stopPropagation();
    setExpandedDepartments((prev) => ({
      ...prev,
      [departmentId]: !prev[departmentId]
    }));
  }, []);

  const renderDepartment = useCallback((department) => {
    const hasChildren = department.children && department.children.length > 0;

    return (
      
      <li key={department.id} style={{ listStyleType: "none" }}>
        <div className={`department-item ${selectedDepartmentId === department.id ? 'selected' : ''}`}>
          <div className="department-item-content">
            {hasChildren && (
              <button
                className="expand-button"
                onClick={(e) => toggleExpand(department.id, e)}
                aria-label={expandedDepartments[department.id] ? "Collapse department" : "Expand department"}
              >
                {expandedDepartments[department.id] ? (
                  <FaMinus />
                ) : (
                  <FaPlus />
                )}
              </button>
            )}
            {!hasChildren && <div style={{ width: "24px", marginRight: "8px" }}></div>}
            <span
              className={`common-text ${selectedDepartmentId === department.id ? 'selected' : ''}`}
              onClick={() => onSelectDepartment(department.id)}
            >
              <IoFolderOpenOutline />
              {department.nom}
            </span>
          </div>
        </div>

        {expandedDepartments[department.id] && hasChildren && (
          <ul className="sub-departments">
            {department.children.map((child) => renderDepartment(child))}
          </ul>
        )}
      </li>
    );
  }, [expandedDepartments, selectedDepartmentId, onSelectDepartment, toggleExpand]);

  return (
    <div className={`departement_historique ${filtersVisible ? '' : ''}`}>
      <div className="departement_list" style={{width: "47%"}}>
        <div className="checkbox-container">
          <input
            type="checkbox"
            checked={includeSubDepartments}
            onChange={(e) => onIncludeSubDepartmentsChange(e.target.checked)}
            id="include-sub-deps"
          />
          <label htmlFor="include-sub-deps">Inclure les sous-départements</label>
        </div>
        <div className="separator" />

        {isLoading && departments.length === 0 ? (
          <p>Chargement des départements...</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : departments.length === 0 ? (
          <p>Aucun département trouvé</p>
        ) : (
          <ul style={{ paddingLeft: 0 }}>
            {departments.map((department) => renderDepartment(department))}
          </ul>
        )}
      </div>

      <div className="employee-panel">
        <input
          type="text"
          placeholder="Rechercher"
          onChange={handleSearchChange}
          className="search-input"
        />

        {employees.length > 0 && (
          <div className="checkbox-container">
            <input
              type="checkbox"
              id="selectAllEmployees"
              checked={selectAll}
              onChange={handleSelectAllChange}
            />
            <label htmlFor="selectAllEmployees">
              Sélectionner tous les employés
            </label>
          </div>
        )}

        {employees.length === 0 ? (
          <p style={{ textAlign: "center", marginTop: "20px" }}>
            Veuillez sélectionner un département pour voir ses employés.
          </p>
        ) : (
          <ul className="employee-list">
            {filteredEmployees.map((employee) => {
              const isProcessed = processedEmployees.has(employee.id);
              const isSelected = selectedEmployees.has(employee.id);
              const isCurrentlySelectedEmployee = selectedEmployee && selectedEmployee.id === employee.id;

              return (
                <li
                  key={employee.id}
                  className={`employee-item ${isCurrentlySelectedEmployee ? 'selected' : ''}`}
                  onClick={() => onSelectEmployee(employee)}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                      style={{
                        marginRight: "15px",
                        fontSize: "20px",
                        color: "#3a8a90",
                        pointerEvents: isProcessed ? "none" : "auto"
                      }}
                    >
                      <button
                        style={{
                          border: "none",
                          backgroundColor: "transparent",
                          cursor: isProcessed ? "not-allowed" : "pointer",
                          opacity: isProcessed ? 0.5 : 1
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isProcessed) {
                            onCheckEmployee(e, employee);
                          }
                        }}
                        disabled={isProcessed}
                      >
                        {isSelected ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3a8a90" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <path d="M9 12l2 2 4-4"></path>
                          </svg>
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          </svg>
                        )}
                      </button>
                    </div>

                    <div className="employee-avatar">
                      {employee.url_img ? (
                        <img
                          src={`http://127.0.0.1:8000/storage/${employee.url_img}`}
                          alt="Employee"
                          style={{
                            width: "50px",
                            height: "50px",
                            borderRadius: "50%",
                            border: "2px solid #eee",
                          }}
                        />
                      ) : (
                        <>
                          {employee.nom?.charAt(0).toUpperCase() || ""}
                          {employee.prenom?.charAt(0).toUpperCase() || ""}
                        </>
                      )}
                    </div>

                    <div className="employee-info">
                      <div className="employee-name">
                        {employee.nom} {employee.prenom}
                      </div>
                      <div className="employee-details">
                        {employee.matricule}
                        <span style={{ marginLeft: '10px' }}></span>
                        {findDepartmentName(employee.departement_id)}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
    
  );
});

DepartmentPanel.propTypes = {
  onSelectDepartment: PropTypes.func.isRequired,
  selectedDepartmentId: PropTypes.number,
  includeSubDepartments: PropTypes.bool,
  onIncludeSubDepartmentsChange: PropTypes.func,
  employees: PropTypes.array,
  selectedEmployee: PropTypes.object,
  selectedEmployees: PropTypes.instanceOf(Set),
  processedEmployees: PropTypes.instanceOf(Set),
  onSelectEmployee: PropTypes.func,
  onCheckEmployee: PropTypes.func,
  findDepartmentName: PropTypes.func,
  filtersVisible: PropTypes.bool
};

export default DepartmentPanel;