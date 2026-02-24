import React, { useState, useMemo, useCallback } from 'react';
import { Form, InputGroup, Button, Badge } from 'react-bootstrap';
import { FaSearch, FaCheckSquare, FaSquare } from 'react-icons/fa';

/**
 * EmployeeSelector Component
 * 
 * Allows selecting multiple employees with filtering and "wave" selection logic.
 * 
 * @param {Array} employees - List of all available employees objects.
 * @param {Array} selectedEmployees - List of currently selected employee objects.
 * @param {Function} onChange - Callback (newSelectedEmployees) => {}.
 * @param {Boolean} isLoading - Loading state.
 */
const EmployeeSelector = ({
    employees = [],
    selectedEmployees = [],
    onChange,
    isLoading = false
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    // 1. Filtrage intelligent
    const filteredEmployees = useMemo(() => {
        if (!searchTerm.trim()) return employees;
        const lowerTerm = searchTerm.toLowerCase();
        return employees.filter(emp => {
            const fullName = `${emp.nom || ''} ${emp.prenom || ''}`.toLowerCase();
            const matricule = (emp.matricule || '').toLowerCase();
            return fullName.includes(lowerTerm) || matricule.includes(lowerTerm);
        });
    }, [employees, searchTerm]);

    // Map of selected IDs for O(1) lookup
    const selectedIds = useMemo(() => {
        return new Set(selectedEmployees.map(e => e.id));
    }, [selectedEmployees]);

    // 2. Logique de sélection par "vagues"
    const handleSelectAll = useCallback(() => {
        // Add all filtered employees to selection (avoiding duplicates)
        const newSelection = [...selectedEmployees];
        filteredEmployees.forEach(emp => {
            if (!selectedIds.has(emp.id)) {
                newSelection.push(emp);
            }
        });
        onChange(newSelection);
    }, [filteredEmployees, selectedEmployees, selectedIds, onChange]);

    const handleDeselectAll = useCallback(() => {
        // Remove all filtered employees from selection
        // Keep employees that correspond to valid entries but are NOT in the current filter
        const filteredIds = new Set(filteredEmployees.map(e => e.id));
        const newSelection = selectedEmployees.filter(emp => !filteredIds.has(emp.id));
        onChange(newSelection);
    }, [filteredEmployees, selectedEmployees, onChange]);

    const toggleEmployee = useCallback((employee) => {
        if (selectedIds.has(employee.id)) {
            onChange(selectedEmployees.filter(e => e.id !== employee.id));
        } else {
            onChange([...selectedEmployees, employee]);
        }
    }, [selectedIds, selectedEmployees, onChange]);

    return (
        <div className="employee-selector border rounded p-3 bg-white">
            {/* Search Bar */}
            <InputGroup className="mb-2">
                <InputGroup.Text className="bg-light">
                    <FaSearch className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                    placeholder="Rechercher par nom, prenom ou matricule..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={isLoading}
                />
            </InputGroup>

            {/* Action Buttons */}
            <div className="d-flex gap-2 mb-2">
                <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={isLoading || filteredEmployees.length === 0}
                >
                    Tout cocher
                </Button>
                <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleDeselectAll}
                    disabled={isLoading || selectedEmployees.length === 0}
                >
                    Tout decocher
                </Button>
            </div>

            {/* Employee List */}
            <div
                className="employee-list border rounded"
                style={{ maxHeight: '250px', overflowY: 'auto' }}
            >
                {isLoading ? (
                    <div className="text-center p-3 text-muted">Chargement des employes...</div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="text-center p-3 text-muted">Aucun employe trouve.</div>
                ) : (
                    <div className="list-group list-group-flush">
                        {filteredEmployees.map(emp => {
                            const isSelected = selectedIds.has(emp.id);
                            return (
                                <div
                                    key={emp.id}
                                    className={`list-group-item list-group-item-action d-flex align-items-center cursor-pointer ${isSelected ? 'bg-light' : ''}`}
                                    onClick={() => toggleEmployee(emp)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="me-3 fs-5 text-primary">
                                        {isSelected ? <FaCheckSquare /> : <FaSquare className="text-secondary opacity-50" />}
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="fw-bold text-dark">
                                            {emp.nom} {emp.prenom}
                                        </div>
                                        <small className="text-muted">
                                            Matricule: {emp.matricule || '-'} | Salaire brut imp.: {Number(emp.salaire || 0).toLocaleString()} MAD
                                        </small>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Counter Footer */}
            <div className="mt-2 text-end text-muted small">
                <Badge bg="info" className="me-1">{selectedEmployees.length}</Badge>
                employe(s) selectionne(s)
            </div>
        </div>
    );
};

export default EmployeeSelector;
