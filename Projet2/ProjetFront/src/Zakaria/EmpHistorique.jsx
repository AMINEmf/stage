import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { IoFolderOpenOutline } from "react-icons/io5";
import { FaMinus, FaPlus, FaSquare } from "react-icons/fa6";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { ThemeProvider, createTheme, Box, TextField } from "@mui/material";
import { motion, AnimatePresence } from 'framer-motion';
import { useOpen } from "../Acceuil/OpenProvider";
import PageHeader from "../ComponentHistorique/PageHeader";
import DepartmentPanel from "../ComponentHistorique/DepartementPanel";
import ExpandRTable from "./Shared/ExpandRTable";
import Swal from "sweetalert2";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';



import { useHeader } from "../Acceuil/HeaderContext";






function EmpHistorique() {
  const [departements, setDepartements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDepartementId, setSelectedDepartementId] = useState(null);
  const [expandedDepartements, setExpandedDepartements] = useState({});
  const [employeeHistories, setEmployeeHistories] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedDepartmentEmployees, setSelectedDepartmentEmployees] = useState([]);
  const [includeSubDepartments, setIncludeSubDepartments] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [processedEmployees, setProcessedEmployees] = useState(new Set());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(7);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const { dynamicStyles } = useOpen();
  const requestQueue = useRef(new Map());

  // États pour ExpandRTable
  const [selectAll, setSelectAll] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filtersVisible, setFiltersVisible] = useState(false);


  const { setTitle, setOnPrint, setOnExportPDF, setOnExportExcel, searchQuery, setSearchQuery, clearActions } = useHeader();



  // Filter options state
  const [filterOptions, setFilterOptions] = useState({
    filters: [
      {
        key: 'date_debut',
        label: 'Date debut',
        value: '',
        placeholder: 'JJ/MM/AAAA',
        // labelMarginRight: '-35%'
      },
      {
        key: 'date_fin',
        label: 'Date fin',
        value: '',
        placeholder: 'JJ/MM/AAAA',
        // labelMarginRight: '-10%'
      }
    ]
  });

  // Configuration des colonnes pour ExpandRTable
  const historyColumns = [
    { key: 'matricule', label: 'Matricule' },
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prénom' },
    { key: 'departement_nom', label: 'Département' },
    { key: 'date_debut', label: 'Date début' },
    { key: 'date_fin', label: 'Date fin' }
  ];

  // Apply filtering whenever data or filters change
  useEffect(() => {
    if (!employeeHistories || employeeHistories.length === 0) {
      setFilteredData([]);
      return;
    }

    let filtered = [...employeeHistories];

    filterOptions.filters.forEach(filter => {
      if (filter.value && filter.value.trim() !== '') {
        if (filter.key === 'date_debut' || filter.key === 'date_fin') {
          const filterDateParts = filter.value.split('/');
          if (filterDateParts.length === 3) {
            const filterDate = new Date(
              parseInt(filterDateParts[2], 10),
              parseInt(filterDateParts[1], 10) - 1,
              parseInt(filterDateParts[0], 10)
            );

            filtered = filtered.filter(row => {
              const dateValue = row[filter.key];
              if (!dateValue) return false;

              const rowDateParts = dateValue.split('/');
              if (rowDateParts.length !== 3) return false;

              const rowDate = new Date(
                parseInt(rowDateParts[2], 10),
                parseInt(rowDateParts[1], 10) - 1,
                parseInt(rowDateParts[0], 10)
              );

              if (isNaN(rowDate)) return false;

              if (filter.key === 'date_debut') {
                return rowDate >= filterDate;
              } else if (filter.key === 'date_fin') {
                return rowDate <= filterDate;
              }
              return true;
            });
          }
        } else {
          const filterValue = String(filter.value).toLowerCase();
          filtered = filtered.filter(row => {
            const cellValue = row[filter.key];
            if (!cellValue) return false;
            return String(cellValue).toLowerCase().includes(filterValue);
          });
        }
      }
    });

    if (globalSearch.trim()) {
      const searchTerm = globalSearch.toLowerCase();
      filtered = filtered.filter(row => {
        return historyColumns.some(col => {
          const value = row[col.key];
          if (!value) return false;
          return String(value).toLowerCase().includes(searchTerm);
        });
      });
    }

    setFilteredData(filtered);
    setPage(0);
  }, [employeeHistories, globalSearch, filterOptions]);

  const handleFilterChange = (key, value) => {
    setFilterOptions(prev => {
      const newFilters = prev.filters.map(filter => {
        if (filter.key === key) {
          return { ...filter, value };
        }
        return filter;
      });
      return { ...prev, filters: newFilters };
    });
  };






  // Handle global search change
  const handleGlobalSearchChange = (e) => {
    setGlobalSearch(e.target.value);
    setPage(0);
  };

  // Handle filters toggle
  const handleFiltersToggle = (isVisible) => {
    if (isVisible) {
      // Quand les filtres s'affichent, on met à jour immédiatement
      setFiltersVisible(true);
    } else {
      // Quand les filtres se ferment, on attend que l'animation de disparition se termine
      setTimeout(() => {
        setFiltersVisible(false);
      }, 300); // 300ms = durée de l'animation de disparition des filtres
    }
  };

  // Handlers for ExpandRTable
  const handleSelectAllChange = (event) => {
    if (event.target.checked) {
      const allIds = filteredData.map(item => item.id || `${item.employeeId}-${item.date_debut}-${item.date_fin}`);
      setSelectedItems(allIds);
      setSelectAll(true);
    } else {
      setSelectedItems([]);
      setSelectAll(false);
    }
  };

  const handleCheckboxChange = (itemId) => {
    const newSelectedItems = selectedItems.includes(itemId)
      ? selectedItems.filter(id => id !== itemId)
      : [...selectedItems, itemId];

    setSelectedItems(newSelectedItems);
    setSelectAll(newSelectedItems.length === filteredData.length && filteredData.length > 0);
  };

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) return;

    Swal.fire({
      title: 'Êtes-vous sûr?',
      text: `Vous allez supprimer ${selectedItems.length} élément(s) sélectionné(s).`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        // Filtrer les données pour exclure les éléments sélectionnés
        const newFilteredData = filteredData.filter(item =>
          !selectedItems.includes(item.id || `${item.employeeId}-${item.date_debut}-${item.date_fin}`)
        );
        const newEmployeeHistories = employeeHistories.filter(item =>
          !selectedItems.includes(item.id || `${item.employeeId}-${item.date_debut}-${item.date_fin}`)
        );

        setFilteredData(newFilteredData);
        setEmployeeHistories(newEmployeeHistories);
        setSelectedItems([]);
        setSelectAll(false);

        Swal.fire(
          'Supprimé!',
          'Les éléments sélectionnés ont été supprimés.',
          'success'
        );
      }
    });
  };

  const handleChangePage = (newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Fonction pour highlight le texte
  const highlightText = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.toString().replace(regex, '<mark>$1</mark>');
  };

  // Export functions (à implémenter selon vos besoins)
  const handleExportPDF = () => {
    console.log('Export PDF');
  };

  const handleExportExcel = () => {
    console.log('Export Excel');
  };

  const handlePrint = () => {
    console.log('Print');
  };



  const isValidDate = (dateString) => {
    if (!dateString || dateString === '-' || dateString === 'null' || dateString === 'undefined') {
      return false;
    }
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && dateString.length > 3;
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === '-') return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return '-';
    }
  };

  // Department functions
  const findDepartmentName = useCallback((departmentId) => {
    const findDept = (depts) => {
      for (const dept of depts) {
        if (dept.id === departmentId) return dept.nom;
        if (dept.children && dept.children.length > 0) {
          const found = findDept(dept.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findDept(departements) || "N/A";
  }, [departements]);

  const findDepartmentById = useCallback((departmentId, departments) => {
    for (const dept of departments) {
      if (dept.id === departmentId) return dept;
      if (dept.children && dept.children.length > 0) {
        const found = findDepartmentById(departmentId, dept.children);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const getAllEmployeesFromDepartment = (department) => {
    const uniqueEmployees = new Map();
    const addEmployees = (dept) => {
      (dept.employes || []).forEach(emp => {
        if (!uniqueEmployees.has(emp.id)) {
          uniqueEmployees.set(emp.id, emp);
        }
      });
      if (dept.children && dept.children.length > 0) {
        dept.children.forEach(childDept => addEmployees(childDept));
      }
    };
    addEmployees(department);
    return Array.from(uniqueEmployees.values());
  };

  const buildDepartementTree = (flatDepartements) => {
    const departementMap = {};
    const tree = [];
    flatDepartements.forEach((dept) => {
      dept.children = [];
      departementMap[dept.id] = dept;
    });
    flatDepartements.forEach((dept) => {
      if (dept.parent_id && departementMap[dept.parent_id]) {
        departementMap[dept.parent_id].children.push(dept);
      } else {
        tree.push(dept);
      }
    });
    return tree;
  };

  const fetchDepartements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/departements");
      setDepartements(buildDepartementTree(response.data));
    } catch (error) {
      console.error("Error fetching departments:", error);
      setError("An error occurred while fetching departments. Please try again.");
      setDepartements([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartements();
  }, [fetchDepartements]);

  // Employee history functions
  const fetchEmployeeHistory = async (employeeId, currentEmployee) => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/employee-history?employeeId=${employeeId}`);
      return response.data
        .filter(record => record.matricule === currentEmployee.matricule)
        .map((record, index) => ({
          ...record,
          id: record.id || `${employeeId}-${record.date_debut}-${record.date_fin}-${index}`,
          date_debut: formatDate(record.date_debut),
          date_fin: record.date_fin ? formatDate(record.date_fin) : '-',
          photo: currentEmployee.photo,
          departement_nom: findDepartmentName(record.departement_id)
        }));
    } catch (error) {
      console.error(`Error fetching history for employee ${employeeId}:`, error);
      return [];
    }
  };


  const handleEmployeeClick = async (employee, isCheckbox = false) => {
    if (requestQueue.current.has(employee.id)) return;

    if (isCheckbox) {
      const newSelectedEmployees = new Set(selectedEmployees);
      if (newSelectedEmployees.has(employee.id)) {
        newSelectedEmployees.delete(employee.id);
        setEmployeeHistories(prev => prev.filter(history => history.employeeId !== employee.id));
      } else {
        requestQueue.current.set(employee.id, true);
        newSelectedEmployees.add(employee.id);
        try {
          const history = await fetchEmployeeHistory(employee.id, employee);
          if (newSelectedEmployees.has(employee.id)) {
            setEmployeeHistories(prev => {
              const filtered = prev.filter(h => h.employeeId !== employee.id);
              const newHistories = [...filtered, ...history.map(record => ({
                ...record,
                employeeId: employee.id,
                matricule: employee.matricule,
                nom: employee.nom,
                prenom: employee.prenom
              }))];
              return newHistories.filter((h, i, self) =>
                i === self.findIndex(item => (
                  item.employeeId === h.employeeId &&
                  item.date_debut === h.date_debut &&
                  item.date_fin === h.date_fin
                ))
              );
            });
          }
        } finally {
          requestQueue.current.delete(employee.id);
        }
      }
      setSelectedEmployees(newSelectedEmployees);
    } else {
      const newSelectedEmployees = new Set([employee.id]);
      setSelectedEmployees(newSelectedEmployees);
      requestQueue.current.set(employee.id, true);
      try {
        const history = await fetchEmployeeHistory(employee.id, employee);
        setEmployeeHistories(history.map(record => ({
          ...record,
          employeeId: employee.id,
          matricule: employee.matricule,
          nom: employee.nom,
          prenom: employee.prenom
        })));
      } finally {
        requestQueue.current.delete(employee.id);
      }
    }
  };

  const handleCheckboxClick = async (e, employee) => {
    e.stopPropagation();
    if (!requestQueue.current.has(employee.id)) {
      await handleEmployeeClick(employee, true);
    }
  };

  const handleDateSearch = async () => {
    if (!startDate || !endDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Avertissement',
        text: 'Veuillez sélectionner une date de début et une date de fin',
        confirmButtonText: 'OK'
      });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Format de date invalide',
        confirmButtonText: 'OK'
      });
      return;
    }
    if (start > end) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'La date de début doit être antérieure à la date de fin',
        confirmButtonText: 'OK'
      });
      return;
    }

    setIsLoading(true);
    try {
      const matchedEmployees = new Set();
      const allHistories = [];

      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      for (const employee of selectedDepartmentEmployees) {
        try {
          const history = await fetchEmployeeHistory(employee.id, employee);
          const filteredHistory = history.filter(record => {
            const recordStart = new Date(record.date_debut);
            if (!record.date_fin || record.date_fin === '-') {
              return recordStart >= start && recordStart <= end;
            } else {
              const recordEnd = new Date(record.date_fin);
              return recordStart >= start && recordEnd <= end;
            }
          });

          if (filteredHistory.length > 0) {
            matchedEmployees.add(employee.id);
            allHistories.push(
              ...filteredHistory.map(record => ({
                ...record,
                employeeId: employee.id,
                matricule: employee.matricule,
                nom: employee.nom,
                prenom: employee.prenom,
                date_debut: formatDate(record.date_debut),
                date_fin: record.date_fin ? formatDate(record.date_fin) : '-'
              }))
            );
          }
        } catch (error) {
          console.error(`Error processing employee ${employee.id}:`, error);
        }
      }

      const sortedHistories = allHistories.sort((a, b) => {
        const dateA = new Date(a.date_debut.split('/').reverse().join('-'));
        const dateB = new Date(b.date_debut.split('/').reverse().join('-'));
        return dateB - dateA;
      });

      setSelectedEmployees(matchedEmployees);
      setEmployeeHistories(sortedHistories);

      if (sortedHistories.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'Information',
          text: 'Aucun historique trouvé pour la période sélectionnée',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error("Error during date search:", error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: "Une erreur s'est produite lors de la recherche",
        confirmButtonText: 'OK'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDepartementClick = useCallback((departementId) => {
    setSelectedDepartementId(departementId);
    const selectedDept = findDepartmentById(departementId, departements);
    if (selectedDept) {
      const employees = includeSubDepartments
        ? getAllEmployeesFromDepartment(selectedDept)
        : [...new Map((selectedDept.employes || []).map(emp => [emp.id, emp])).values()];
      setSelectedDepartmentEmployees(employees);
    }
    setEmployeeHistories([]);
    setSelectedEmployees(new Set());
  }, [departements, includeSubDepartments, findDepartmentById]);



  // <----------------------------------- Filtre ------------------------------------------------->
  function convertToInputDate(value) {
    if (!value) return '';
    const parts = value.split('/');
    if (parts.length !== 3) return '';
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  function convertToDisplayDate(value) {
    if (!value) return '';
    const parts = value.split('-');
    if (parts.length !== 3) return '';
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }

  useEffect(() => {
    setTitle("Historique des employés");

    setOnPrint(() => handlePrint);
    setOnExportPDF(() => handleExportPDF);
    setOnExportExcel(() => handleExportExcel);

    return () => {
      clearActions();
      setTitle('');
    };
  }, [setTitle, setOnPrint, setOnExportPDF, setOnExportExcel, clearActions, handlePrint, handleExportPDF, handleExportExcel]);

  useEffect(() => {
    setGlobalSearch(searchQuery || '');
  }, [searchQuery]);



  return (

    <ThemeProvider theme={createTheme()}>
      <Box sx={{ ...dynamicStyles }}>
        <Box component="main"
          sx={{ flexGrow: 1, p: 0, mt: 12 }}
        >
          <div style={{
            display: "flex",
            flex: 1,
            position: "relative",
            margin: 0,
            padding: 0,
            height: "calc(100vh - 120px)",
            overflow: 'hidden'

          }}>

            <div style={{
              width: "300px",
              minWidth: "300px",
              height: "100%",
              margin: 0,
              padding: 0,
              borderRight: '1px solid #e5e7eb'
            }}>
              <DepartmentPanel
                onSelectDepartment={handleDepartementClick}
                selectedDepartmentId={selectedDepartementId}
                includeSubDepartments={includeSubDepartments}
                onIncludeSubDepartmentsChange={setIncludeSubDepartments}
                employees={selectedDepartmentEmployees}
                selectedEmployees={selectedEmployees}
                processedEmployees={processedEmployees}
                onSelectEmployee={(employee) => handleEmployeeClick(employee)}
                onCheckEmployee={handleCheckboxClick}
                findDepartmentName={findDepartmentName}
                filtersVisible={filtersVisible}
              />
            </div>

            {/* Section Table */}

            <div className="container3" style={{
              flex: 1,
              minWidth: 0,
              overflow: 'auto',
              padding: '20px'
            }}>

              <div style={{
                width: "100%",
                height: "100%",
                transition: "width 0.2s ease",
                marginTop: "3%",
                padding: 0,
              }}>
                <div className="mt-4">
                  <div className="section-header mb-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap" style={{ gap: '16px' }}>
                      <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                        <span className="section-title mb-1" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2c767c' }}>
                          <i className="fas fa-history me-2"></i>
                          Détails d'historique
                        </span>
                        <p className="section-description text-muted mb-0">
                          - Groupe sélectionné
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* <-------------- Filtre -----------------> */}
                <AnimatePresence>
                  {filtersVisible && (

                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="filters-container"
                    >
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
                        <span className="filters-title">
                          Filtres
                        </span>
                      </div>
                      <div className="filter-group" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>

                        {/* Date Début */}
                        <label className="filter-label" style={{ marginRight: '-4%' }}>
                          {filterOptions.filters[0].label}
                        </label>
                        <div className="filter-input-wrapper">
                          <input
                            type="date"
                            value={convertToInputDate(filterOptions.filters[0].value)}
                            onChange={e => {
                              const newFilters = [...filterOptions.filters];
                              newFilters[0].value = convertToDisplayDate(e.target.value);
                              setFilterOptions({ filters: newFilters });
                            }}
                            className="filter-input"
                          />
                        </div>
                        {/* Date Fin */}
                        <label className="filter-label" style={{ marginRight: '-7.5%', marginLeft: '30px', }}>
                          {filterOptions.filters[1].label}
                        </label>
                        <div className="filter-input-wrapper">
                          <input
                            type="date"
                            value={convertToInputDate(filterOptions.filters[1].value)}
                            onChange={e => {
                              const newFilters = [...filterOptions.filters];
                              newFilters[1].value = convertToDisplayDate(e.target.value);
                              setFilterOptions({ filters: newFilters });
                            }}
                            className="filter-input"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>




                <ExpandRTable
                  columns={historyColumns}
                  data={filteredData}
                  filteredData={filteredData}
                  searchTerm={globalSearch}
                  highlightText={highlightText}
                  selectAll={selectAll}
                  selectedItems={selectedItems}
                  handleSelectAllChange={handleSelectAllChange}
                  handleCheckboxChange={handleCheckboxChange}
                  handleDeleteSelected={handleDeleteSelected}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  handleChangePage={handleChangePage}
                  handleChangeRowsPerPage={handleChangeRowsPerPage}
                />
              </div>
            </div>


          </div>
        </Box>
      </Box>
    </ThemeProvider>

  );
}

export default EmpHistorique;