import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Box } from "@mui/material";
import { DepartmentPanel } from "../../ComponentHistorique/DepartementPanel";
import { useHeader } from "../../Acceuil/HeaderContext";
import { useOpen } from "../../Acceuil/OpenProvider";
import AccidentTable from "../Accidents/AccidentTable";
import "./DepartementManager.css";
import "../Style.css";

const theme = createTheme();

const API_BASE = globalThis.location.hostname === "localhost"
	? "http://localhost:8000"
	: "http://127.0.0.1:8000";

const DEPARTMENT_CACHE_KEY = "departmentHierarchy";
const DEPARTMENT_PANEL_CACHE_KEY = "departmentPanelData";

const findDepartmentById = (departments, departmentId) => {
	if (!Array.isArray(departments) || !departmentId) return null;

	const targetId = String(departmentId);
	const stack = [...departments];

	while (stack.length > 0) {
		const current = stack.pop();
		if (!current) continue;
		if (String(current.id) === targetId) return current;
		if (Array.isArray(current.children) && current.children.length > 0) {
			stack.push(...current.children);
		}
	}

	return null;
};

const collectChildDepartmentIds = (department, ids) => {
	if (!department || !Array.isArray(department.children)) return;

	department.children.forEach((child) => {
		if (child?.id != null) {
			ids.add(String(child.id));
		}
		collectChildDepartmentIds(child, ids);
	});
};

function DepartementManager2() {
	const { setTitle, setOnPrint, setOnExportPDF, setOnExportExcel, searchQuery, clearActions } = useHeader();
	const { dynamicStyles } = useOpen();

	const accidentTableRef = useRef(null);

	const [departements, setDepartements] = useState([]);
	const [selectedDepartementId, setSelectedDepartementId] = useState(null);
	const [includeSubDepartments, setIncludeSubDepartments] = useState(false);
	const [isAddingEmploye, setIsAddingEmploye] = useState(false);
	const [filtersVisible, setFiltersVisible] = useState(false);

	const getSubDepartmentIds = useCallback((departmentsTree, parentDepartmentId) => {
		if (!parentDepartmentId) return [];

		const ids = new Set([String(parentDepartmentId)]);
		const rootDepartment = findDepartmentById(departmentsTree, parentDepartmentId);
		if (rootDepartment) {
			collectChildDepartmentIds(rootDepartment, ids);
		}

		return Array.from(ids);
	}, []);

	const selectedDepartmentName = useMemo(() => {
		const department = findDepartmentById(departements, selectedDepartementId);
		return department?.nom || "Tous";
	}, [departements, selectedDepartementId]);


	const fetchDepartments = useCallback(async () => {
		const cacheKeys = [DEPARTMENT_PANEL_CACHE_KEY, DEPARTMENT_CACHE_KEY];

		for (const key of cacheKeys) {
			try {
				const raw = localStorage.getItem(key);
				if (!raw) continue;
				const parsed = JSON.parse(raw);
				if (Array.isArray(parsed) && parsed.length > 0) {
					setDepartements(parsed);
					break;
				}
			} catch {
				// ignore malformed cache
			}
		}

		try {
			const response = await axios.get(`${API_BASE}/api/departements/hierarchy`, { withCredentials: true });
			const data = Array.isArray(response.data) ? response.data : [];
			setDepartements(data);
			localStorage.setItem(DEPARTMENT_PANEL_CACHE_KEY, JSON.stringify(data));
			localStorage.setItem(DEPARTMENT_CACHE_KEY, JSON.stringify(data));
		} catch (error) {
			console.error("Error fetching departments hierarchy:", error);
		}
	}, []);

	useEffect(() => {
		fetchDepartments();
	}, [fetchDepartments]);

	useEffect(() => {
		setTitle("Accidents de travail");
		setOnPrint(() => () => accidentTableRef.current?.handlePrint?.());
		setOnExportPDF(() => () => accidentTableRef.current?.exportToPDF?.());
		setOnExportExcel(() => () => accidentTableRef.current?.exportToExcel?.());

		return () => {
			clearActions();
			setTitle("");
		};
	}, [clearActions, setOnExportExcel, setOnExportPDF, setOnPrint, setTitle]);

	const handleSelectDepartment = useCallback((departmentId) => {
		setSelectedDepartementId(departmentId);
	}, []);

	return (
		<ThemeProvider theme={theme}>
			<Box sx={{ ...dynamicStyles }}>
				<Box component="main" sx={{ flexGrow: 1, p: 0, mt: 12 }}>
					<div className="departement_home1">
						<div className="accidents-department-only" style={{ width: "280px", minWidth: "280px", height: "100%", margin: 0, padding: 0, overflow: "hidden" }}>
							<DepartmentPanel
								onSelectDepartment={handleSelectDepartment}
								selectedDepartmentId={selectedDepartementId}
								includeSubDepartments={includeSubDepartments}
								onIncludeSubDepartmentsChange={setIncludeSubDepartments}
								showEmployees={false}
								filtersVisible={filtersVisible}
							/>
						</div>

						<div className="container3" style={{ display: "flex", overflow: "hidden", flex: 1 }}>
							<AccidentTable
								ref={accidentTableRef}
								departementId={selectedDepartementId}
								departementName={selectedDepartmentName}
								includeSubDepartments={includeSubDepartments}
								getSubDepartmentIds={getSubDepartmentIds}
								departements={departements}
								globalSearch={searchQuery || ""}
								isAddingEmploye={isAddingEmploye}
								setIsAddingEmploye={setIsAddingEmploye}
								filtersVisible={filtersVisible}
								handleFiltersToggle={setFiltersVisible}
							/>
						</div>
					</div>
				</Box>
			</Box>
		</ThemeProvider>
	);
}

export default DepartementManager2;
