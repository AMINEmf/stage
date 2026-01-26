import React, { useState, useEffect, useCallback } from 'react';
import AbsenceForm from './AbsenceForm';
import axios from 'axios';
import Swal from "sweetalert2";
import { Button, Card, Tab, Tabs, Table, Modal, Form } from 'react-bootstrap';
import { Trash2, Edit2, Plus, Check, X } from 'lucide-react';
import {
    faEdit, faTrash, faFilePdf, faFileExcel, faPrint, faEye, faChevronDown, faChevronUp, faSearch, faFilter, faClose, faPlus,
    faCheck,
    faXmark,
    faGear,
} from "@fortawesome/free-solid-svg-icons";
import TablePagination from '@mui/material/TablePagination';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion, AnimatePresence, color } from 'framer-motion';
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import './GroupsManager.css';
import Dropdown from "react-bootstrap/Dropdown";
import PageHeader2 from '../ComponentHistorique/PageHeader2';

import {
    TextField, FormControl, Autocomplete, Fab
} from '@mui/material';
import CalendrieForm from './CalendrieForm';
import DetailsPeriodiqueTable from "./HorairePeriodique";
import ExpandRTable from './Employe/ExpandRTable';
import "./Employe/DepartementManager.css";
import { FaPlusCircle,  } from "react-icons/fa";
import { IoFolderOpenOutline } from "react-icons/io5";
import {  FaRegCircle} from "react-icons/fa";
import { useQuery } from '@tanstack/react-query';
import { useHeader } from "../Acceuil/HeaderContext";
import { ThemeProvider, createTheme, Box  } from "@mui/material";
import { useOpen } from "../Acceuil/OpenProvider";







const Calendrie = () => {
    
    const [absences, setAbsences] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingAbsence, setEditingAbsence] = useState(null);
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [isAddingGroup, setIsAddingGroup] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [globalSearch, setGlobalSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [processedData, setProcessedData] = useState([]);
    const [selectedHoraireName, setSelectedHoraireName] = useState(null);
    const [zones, setZones] = useState([]);
    const [selectedZones, setSelectedZones] = useState([]);
    const [editingZoneId, setEditingZoneId] = useState(null);
    const [editingZoneName, setEditingZoneName] = useState('');
    const normalizeValue = (value) =>
        String(value).toLowerCase().trim();
    const [showAddGroupe, setShowAddGroupe] = useState(false);
    const [newCategory, setNewCategory] = useState({ categorie: "" });
    const [horaires, setHoraires] = useState([]);
    const [formData, setFormData] = useState();
    const [editingGroupId, setEditingGroupId] = useState(null);
    const [periode, setPeriode] = useState('');
    // const [groups, setGroups] = useState([]);


    const { setTitle, setOnPrint, setOnExportPDF, setOnExportExcel, searchQuery, setSearchQuery, clearActions } = useHeader();
    const { dynamicStyles } = useOpen();

    const [permissions, setPermissions] = useState([]);
    useEffect(() => {
        const fetchPerms = async () => {
            try {
                const resp = await axios.get("http://localhost:8000/api/user", { withCredentials: true });
                const roles = Array.isArray(resp.data) ? resp.data[0]?.roles : resp.data?.roles;
                const perms = roles && roles[0]?.permissions ? roles[0].permissions.map(p => p.name) : [];
                setPermissions(perms);
            } catch (e) {
                setPermissions([]);
            }
        };
        fetchPerms();
    }, []);

    const canCreate = permissions.includes('create_calendrie');
    const canUpdate = permissions.includes('update_calendrie');
    const canDelete = permissions.includes('delete_calendrie');






    const [newHoraire, setNewHoraire] = useState({
        numero_jour: '',
        libele: '',
        horaire: ''
    });
    const [expandedRows, setExpandedRows] = useState({});
    const toggleRowExpansion = (horaire) => {
        setExpandedRows(prev => ({
            ...prev,
            [horaire.id]: !prev[horaire.id]
        }));
    };
    const fetchDetailsForHoraire = (groupe_horaire_id) => {
        return detaiCalendrie?.filter(detail => detail.groupe_horaire_id === groupe_horaire_id) || [];
    };
    const [selectedChildHoraire, setSelectedChildHoraire] = useState(null);
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(7);
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 7));
        setPage(0);
    };
    const [selectedRows, setSelectedRows] = useState([]);
    const [editingGroupData, setEditingGroupData] = useState({
        id: null,
        nom: '',
        periode: ''
    });
    const [filters, setFilters] = useState({
        typePlageHoraire: "",
        tauxPlageHoraire: "",
        typeTrancheRepos: "",
        debut: "",
        fin: "",
        jourDebut: ""
    });




    const [editingHoraire, setEditingHoraire] = useState(null);
    const [selectedType, setSelectedType] = useState(null);
    const getDayName = (dateString) => {
        const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
        const date = new Date(dateString);
        return days[date.getDay()];
    };

    const iconButtonStyle = {
        backgroundColor: "#f9fafb",
        border: "1px solid #ccc",
        borderRadius: "5px",
        padding: "13px 16px",
        margin: "0 0px",
        cursor: "pointer",
        transition: "background-color 0.3s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      };
    



      const fetchGroups = async () => {
        const { data } = await axios.get('http://127.0.0.1:8000/api/calendrie');
        console.log("GGGGGGGGGGGGGGGGGGGGGGET data:", data)
        return data;
    };

    
    const {
        data,
        isLoading: isGroupsLoading,
        error: groupsError,
        refetch: refetchGroups
    } = useQuery({
        queryKey: ['calendrie'],
        queryFn: fetchGroups,
        staleTime: 1000 * 60 * 5,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    
    });

    const groups = data?.calendrie || [];
    const tableData = data?.horaire || [];
    const detaiCalendrie = data?.detail || [];













    useEffect(() => {
        if (filters.debut) {
            setFilters(prevFilters => ({ ...prevFilters, jourDebut: getDayName(filters.debut) }));
        }
    }, [filters.debut]);

    const handleFiltersToggle = (isVisible) => {
        if (isVisible) {
            setFiltersVisible(true);
        } else {
            setTimeout(() => {
                setFiltersVisible(false);
            }, 300);
        }
    };






    const applyFilters = (absences) => {
        return absences.filter(absence => {
            const matchesDesignation = !filters.designation || absence.designation.toLowerCase().includes(filters.designation.toLowerCase());
            const matchesCause = !filters.cause || absence.cause.toLowerCase().includes(filters.cause.toLowerCase());
            const matchesType = !filters.type || absence.type.toLowerCase().includes(filters.type.toLowerCase());

            const filterDebut = filters.debut ? new Date(filters.debut) : null;
            const filterFin = filters.fin ? new Date(filters.fin) : null;

            const absenceDebut = absence.debut ? new Date(absence.debut) : null;
            const absenceFin = absence.fin ? new Date(absence.fin) : null;

            const matchesDebut = !filterDebut || (absenceDebut && absenceDebut >= filterDebut);
            const matchesFin = !filterFin || (absenceFin && absenceFin <= filterFin);

            const matchesJourDebut = !filters.jourDebut || absence.jourDebut?.toString() === filters.jourDebut.toString();

            return matchesDesignation && matchesCause && matchesType && matchesDebut && matchesFin && matchesJourDebut;
        });
    };
    const formatTimeDisplay = (time) => {
        if (!time) return '';
        return time.substring(11, 16);
    };



    const filteredHoraires = horaires.filter(horaire => {
        if (horaire.groupe_id !== selectedGroup?.id) {
            return false;
        }

        if (globalSearch) {
            const searchTerms = globalSearch.toLowerCase().split(/\s+/);
            const searchableFields = [
                horaire.horaire_periodique?.nom,
                horaire.debut,
                horaire.fin,
                horaire.jourDebut
            ].filter(Boolean);

            return searchTerms.every(term =>
                searchableFields.some(field =>
                    field && field.toLowerCase().includes(term)
                )
            );
        }
        const matchesDebut = !filters.debut ||
            (horaire.debut && horaire.debut >= filters.debut);
        const matchesFin = !filters.fin ||
            (horaire.fin && horaire.fin <= filters.fin);

        const matchesHoraire = !filters.typeTrancheRepos ||
            (horaire.horaire_periodique?.nom &&
                horaire.horaire_periodique.nom.toLowerCase().includes(filters.typeTrancheRepos.toLowerCase()));

        const matchesJourDebut = !filters.jourDebut ||
            (horaire.jourDebut && horaire.jourDebut.includes(filters.jourDebut));

        return matchesDebut && matchesFin && matchesHoraire && matchesJourDebut;
    });

    const getUniqueHoraires = () => {
        if (!horaires || !selectedGroup) return [];

        const uniqueHoraires = Array.from(new Set(
            horaires
                .filter(h => h.groupe_id === selectedGroup.id)
                .map(h => h.horaire_periodique?.nom)
                .filter(Boolean)
        ));

        return uniqueHoraires;
    };

    // Function to get all unique days for the jourDebut dropdown
    const getUniqueDays = () => {
        if (!horaires || !selectedGroup) return [];

        // Get all unique days from the horaires
        const uniqueDays = Array.from(new Set(
            horaires
                .filter(h => h.groupe_id === selectedGroup.id)
                .map(h => h.jourDebut)
                .filter(Boolean)
        ));

        return uniqueDays;
    };

    const fetchHoraires = async (groupId = null) => {
        try {
            if (!groupId) return;
            const response = await axios.get(`http://127.0.0.1:8000/api/details-calendrie?groupe_horaire_id=${groupId}`);
            setHoraires(response.data);
        } catch (error) {
            console.error('Error fetching horaires:', error);
            setHoraires([]);
        }
    };
    console.log('dataaaaaa', selectedHoraireName)
    useEffect(() => {
        if (selectedGroup) {
            fetchHoraires(selectedGroup.id);
        }
    }, [selectedGroup]);


    // useEffect(() => {
    //     const refetchData = async () => {
    //         if (selectedGroup) {
    //             await fetchGroups();
    //             await fetchHoraires(selectedGroup.id);
    //         }
    //     };
    //     refetchData();
    // }, [detaiCalendrie]);


    useEffect(() => {
        fetchGroups();
    }, []);


    useEffect(() => {
        console.log("selectedHoraireName changed:", selectedHoraireName);
    }, [selectedHoraireName]);







    const handleEditGroup = async (groupId) => {
        try {
            if (!editingGroupData.nom.trim()) {
                Swal.fire({
                    icon: "warning",
                    title: "Attention!",
                    text: "Le nom du groupe ne peut pas être vide.",
                });
                return;
            }
            const response = await axios.put(`http://127.0.0.1:8000/api/calendrie/${groupId}`, {
                nom: editingGroupData.nom,
            });
            // Update the state with the edited group
            // setGroups(prevGroups =>
            //     prevGroups.map(group =>
            //         group.id === groupId
            //             ? { ...group, nom: editingGroupData.nom }
            //             : group
            //     )
            // );
            setEditingGroupId(null);
            setEditingGroupData({ id: null, nom: '', periode: '' });
            await refetchGroups(); 
            Swal.fire({
                icon: "success",
                title: "Succès!",
                text: "Groupe modifié avec succès.",
            });
        } catch (error) {
            console.error("Error editing group:", error);
            Swal.fire({
                icon: "error",
                title: "Erreur!",
                text: "Échec de la modification du groupe.",
            });
        }
    };
    const handleDeleteSelectedZones = async () => {
        if (selectedZones.length === 0) return;
        Swal.fire({
            title: `Êtes-vous sûr de vouloir supprimer ${selectedZones.length} zone(s)?`,
            showDenyButton: true,
            confirmButtonText: "Oui",
            denyButtonText: "Non",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await Promise.all(
                        selectedZones.map((id) =>
                            axios.delete(`http://localhost:8000/api/zones/${id}`)
                        )
                    );
                    setZones((prevZones) =>
                        prevZones.filter((zone) => !selectedZones.includes(zone.id))
                    );
                    setSelectedZones([]);
                    Swal.fire({
                        icon: "success",
                        title: "Succès!",
                        text: `${selectedZones.length} zone(s) supprimée(s) avec succès.`,
                    });
                } catch (error) {
                    if (error.response && error.response.status === 500) {
                        Swal.fire({
                            icon: "error",
                            title: "Erreur!",
                            text: "Impossible de supprimer ces zones car elles sont utilisées dans d'autres interfaces.",
                        });
                    } else {
                        console.error("Erreur lors de la suppression des zones:", error);
                        Swal.fire({
                            icon: "error",
                            title: "Erreur!",
                            text: "Échec de la suppression des zones.",
                        });
                    }
                }
            } else {
                console.log("Suppression annulée");
            }
        });
    };
    const handleDeleteSelectedGroups = async () => {
        if (selectedGroups.length === 0) return;
        Swal.fire({
            title: `Êtes-vous sûr de vouloir supprimer ${selectedGroups.length} groupe(s)?`,
            showDenyButton: true,
            confirmButtonText: "Oui",
            denyButtonText: "Non",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await Promise.all(
                        selectedGroups.map((id) =>
                            axios.delete(`http://127.0.0.1:8000/api/group-motifs/${id}`)
                        )
                    );

                    setGroups((prevGroups) =>
                        prevGroups.filter((group) => !selectedGroups.includes(group.id))
                    );

                    setSelectedGroups([]);

                    Swal.fire({
                        icon: "success",
                        title: "Succès!",
                        text: `${selectedGroups.length} groupe(s) supprimé(s) avec succès.`,
                    });
                } catch (error) {
                    if (error.response && error.response.status === 500) {
                        Swal.fire({
                            icon: "error",
                            title: "Erreur!",
                            text: "Impossible de supprimer ces groupes car ils sont utilisés dans d'autres interfaces.",
                        });
                    } else {
                        console.error("Erreur lors de la suppression des groupes:", error);
                        Swal.fire({
                            icon: "error",
                            title: "Erreur!",
                            text: "Échec de la suppression des groupes.",
                        });
                    }
                }
            }
        });
    };
    console.log("selectedGroup", selectedGroup, horaires)
    // const toggleGroupSelection = (id) => {
    //     setSelectedGroups(prev =>
    //         prev.includes(id)
    //             ? prev.filter(selectedId => selectedId !== id)
    //             : [...prev, id]
    //     );
    // };

    const handleSubmit = async (formData) => {
        console.log('dqtqaza', formData)
        try {
            if (selectedRows.length > 0) {
                const selectedHoraires = horaires.filter(h => selectedRows.includes(h.id));
                const changedFields = {};
                if (formData.debut !== selectedHoraires[0].debut) changedFields.debut = formData.debut;
                if (formData.fin !== selectedHoraires[0].fin) changedFields.fin = formData.fin;
                if (formData.groupe_id !== selectedHoraires[0].groupe_id) changedFields.groupe_id = formData.groupe_id;
                if (formData.jourDebut !== selectedHoraires[0].jourDebut) changedFields.jourDebut = formData.jourDebut;
                await Promise.all(selectedRows.map(async (id) => {
                    const originalHoraire = horaires.find(h => h.id === id);
                    const horaireData = {
                        debut: formData.debut || null,
                        fin: formData.fin || null,
                        groupe_id: selectedGroup.id,
                        groupe_horaire_id: formData.groupe_horaire_id,
                        jourDebut: formData.jourDebut || null
                    };
                    await axios.put(
                        `http://127.0.0.1:8000/api/details-calendrie/${id}`,
                        horaireData
                    );
                }));
                Swal.fire("Succès!", `${selectedRows.length} horaires ont été mis à jour avec succès!`, "success");
            } else {
                if (!formData.groupe_id) {
                    Swal.fire("Erreur!", "Veuillez sélectionner un horaire valide.", "error");
                    return;
                }
                console.log("Submitting data:", {
                    debut: formData.debut,
                    fin: formData.fin,
                    groupe_id: formData.groupe_id,
                    groupe_horaire_id: selectedGroup.id,
                    jourDebut: formData.jourDebut
                });
                const horaireData = {
                    debut: formData.debut || null,
                    fin: formData.fin || null,
                    groupe_id: formData.groupe_id,
                    groupe_horaire_id: Number(formData.groupe_horaire_id),
                    jourDebut: formData.jourDebut || null
                };
                Object.keys(horaireData).forEach(key =>
                    (horaireData[key] === null || horaireData[key] === '') && delete horaireData[key]
                );
                if (editingHoraire) {
                    await axios.put(
                        `http://127.0.0.1:8000/api/details-calendrie/${editingHoraire.id}`,
                        horaireData
                    );
                } else {
                    console.log("Sending to API:", horaireData);
                    await axios.post(
                        'http://127.0.0.1:8000/api/details-calendrie',
                        horaireData
                    );      

    
                }
                Swal.fire("Succès!", "Calendrie ajouté avec succès!", "success");
            }
            refetchGroups();
            fetchHoraires();
            // setShowForm(false);
            setEditingHoraire(null);
            setSelectedRows([]);
            setNewHoraire({
                debut: '',
                fin: '',
                groupe_id: '',
                groupe_horaire_id: '',
                jourDebut: ''
            });
        } catch (error) {
            console.error("Error details:", error.response?.data || error);
            const errorMessage = error.response?.data?.errors?.groupe_id?.[0] ||
                error.response?.data?.message ||
                "Échec de l'enregistrement!";
            Swal.fire("Erreur!", errorMessage, "error");
        }
    };




    console.log("Filtered Horairessssssssssssssssssssssssssssssssssss:", horaires);
    console.log('hhzzhhhhh', formData)

    const handleEdit = (horaire) => {
        console.log('dataedit', horaire)
        setEditingHoraire(horaire);
        setShowForm(true);
    };


    const handleEditHoraire = async (horaire) => {
        setEditingHoraire(horaire);  // Set the horaire data to edit
        setShowForm(true);  // Show the form
    };
    const exportToPDF = useCallback(() => {
        const doc = new jsPDF();
        const title = 'Rapport des Détails Calendrie';
        const dateStr = `Date: ${new Date().toLocaleDateString()}`;
        const pageWidth = doc.internal.pageSize.width;
        doc.setFontSize(18);
        doc.text(title, pageWidth / 2, 15, { align: 'center' });
        doc.setFontSize(11);
        doc.text(dateStr, pageWidth / 2, 25, { align: 'center' });

        const tableColumn = ['Début', 'Fin', 'Horaire', 'Jour Début'];
        const tableRows = filteredHoraires
            .filter(h => h.groupe_id === selectedGroup?.id)
            .map(item => [
                item.debut ? new Date(item.debut).toLocaleDateString('fr-FR') : '',
                item.fin ? new Date(item.fin).toLocaleDateString('fr-FR') : '',
                item.horaire_periodique?.nom || '',
                item.jourDebut || ''
            ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            styles: {
                fontSize: 9,
                cellPadding: 3,
                lineWidth: 0.1,
                lineColor: [80, 80, 80]
            },
            headStyles: {
                fillColor: [8, 179, 173],
                textColor: [255, 255, 255],
                fontSize: 9,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            }
        });

        doc.save(`details_calendrie_${new Date().toISOString()}.pdf`);
    }, [filteredHoraires, selectedGroup]);
    const exportToExcel = useCallback(() => {
        const wb = XLSX.utils.book_new();
        const title = [['Rapport des Détails Calendrie']];
        const date = [[`Date: ${new Date().toLocaleDateString()}`]];
        const emptyRow = [[]];
        const headers = [['Début', 'Fin', 'Horaire', 'Jour Début']];
        const data = filteredHoraires
            .filter(h => h.groupe_id === selectedGroup?.id)
            .map(item => [
                item.debut ? new Date(item.debut).toLocaleDateString('fr-FR') : '',
                item.fin ? new Date(item.fin).toLocaleDateString('fr-FR') : '',
                item.horaire_periodique?.nom || '',
                item.jourDebut || ''
            ]);

        const allRows = [...title, ...date, emptyRow, ...headers, ...data];
        const ws = XLSX.utils.aoa_to_sheet(allRows);
        XLSX.utils.book_append_sheet(wb, ws, "Details_Calendrie");
        XLSX.writeFile(wb, `details_calendrie_${new Date().toISOString()}.xlsx`);
    }, [filteredHoraires, selectedGroup]);
    const handlePrint = useCallback(() => {
        const printWindow = window.open("", "_blank");
        const tableColumn = ['Début', 'Fin', 'Horaire', 'Jour Début'];
        const tableRows = filteredHoraires
            .filter(h => h.groupe_id === selectedGroup?.id)
            .map(item => ({
                values: [
                    item.debut ? new Date(item.debut).toLocaleDateString('fr-FR') : '',
                    item.fin ? new Date(item.fin).toLocaleDateString('fr-FR') : '',
                    item.horaire_periodique?.nom || '',
                    item.jourDebut || ''
                ]
            }));

        printWindow.document.write(`
            <html>
                <head>
                    <title>Rapport des Détails Calendrie</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                        }
                        .header { 
                            text-align: center; 
                            margin-bottom: 20px; 
                        }
                        table { 
                            border-collapse: collapse; 
                            width: 100%; 
                            max-width: 900px; 
                        }
                        th, td { 
                            border: 1px solid #ccc; 
                            padding: 8px; 
                            text-align: left; 
                        }
                        th { 
                            background-color: #3a8a90; 
                            color: white;
                            font-weight: bold;
                        }
                        tbody tr:nth-child(even) {
                            background-color: #f9f9f9;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Rapport des Détails Calendrie</h1>
                        <p>Date: ${new Date().toLocaleDateString()}</p>
                        ${selectedGroup ? `<p>Groupe: ${selectedGroup.nom}</p>` : ''}
                    </div>
                    <table>
                        <thead>
                            <tr>${tableColumn.map(col => `<th>${col}</th>`).join("")}</tr>
                        </thead>
                        <tbody>
                            ${tableRows.map(row => `
                                <tr>
                                    ${row.values.map(cell => `<td>${cell}</td>`).join("")}
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }, [filteredHoraires, selectedGroup]);

    
    const handleDelete = async (id) => {
        try {
            const result = await Swal.fire({
                title: "Êtes-vous sûr?",
                text: "Cette action est irréversible!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Oui, supprimer!",
                cancelButtonText: "Annuler"
            });
            if (result.isConfirmed) {
                await axios.delete(`http://127.0.0.1:8000/api/details-calendrie/${id}`);
                setHoraires(horaires.filter(horaire => horaire.id !== id));
                Swal.fire({
                    icon: "success",
                    title: "Supprimé!",
                    text: "L'horaire a été supprimé avec succès.",
                });
            }
        } catch (error) {
            console.error("Error deleting horaire:", error);
            Swal.fire({
                icon: "error",
                title: "Erreur!",
                text: "Une erreur est survenue lors de la suppression.",
            });
        }
        await fetchHoraires(selectedGroup?.id);
    };



    const handleGroupClick = async (group) => {
        setExpandedRows({});
        setSelectedChildHoraire(null);
        setSelectedGroup(group);
    };
    const toggleFilters = () => {
        setShowFilters((prev) => !prev);
    };
    console.log("newCategory", newCategory)


    const handleAddGroupe = async () => {
        try {
            if (!newCategory.categorie) {
                Swal.fire({
                    icon: "warning",
                    title: "Attention!",
                    text: "Veuillez entrer un nom de groupe.",
                });
                return;
            }
            const response = await axios.post("http://127.0.0.1:8000/api/calendrie", {
                nom: newCategory.categorie,
            });
            // setGroups(prevGroups => [...prevGroups, response.data]);
            setNewCategory({ categorie: "", period: "" });
            Swal.fire({
                icon: "success",
                title: "Succès!",
                text: "Groupe ajouté avec succès.",
            });
            setShowAddGroupe(false);
            await refetchGroups();
        } catch (error) {
            console.error("Erreur lors de l'ajout:", error);
            Swal.fire({
                icon: "error",
                title: "Erreur!",
                text: "Échec de l'ajout du groupe.",
            });
        }
    };

    const handleDeleteGroupe = async (id) => {
        try {
            const result = await Swal.fire({
                title: "Êtes-vous sûr?",
                text: "Cette action est irréversible!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Oui, supprimer!",
                cancelButtonText: "Annuler"
            });
            if (result.isConfirmed) {
                const gdhhhs = await axios.delete(`http://127.0.0.1:8000/api/calendrie/${id}`);
                console.log('fds', gdhhhs)

                // setGroups(prevGroups => prevGroups.filter(group => group.id !== id));

                if (selectedGroup?.id === id) {
                    setSelectedGroup(null);
                }
                await refetchGroups(); // Refresh the groups list
                Swal.fire({
                    icon: "success",
                    title: "Succès!",
                    text: "Groupe supprimé avec succès.",
                });
            }
        } catch (error) {
            console.error("Error deleting group:", error);
            Swal.fire({
                icon: "error",
                title: "Erreur!",
                text: "Une erreur est survenue lors de la suppression.",
            });
        }
    };




    const handleRowSelection = (horaireId) => {
        setSelectedRows(prev => {
            if (prev.includes(horaireId)) {
                return prev.filter(id => id !== horaireId);
            } else {
                return [...prev, horaireId];
            }
        });
    };
    const handleMultipleDelete = async () => {
        try {
            const result = await Swal.fire({
                title: "Êtes-vous sûr?",
                text: `Voulez-vous supprimer ${selectedRows.length} horaires?`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Oui, supprimer!",
                cancelButtonText: "Annuler"
            });
            if (result.isConfirmed) {
                await Promise.all(selectedRows.map(id =>
                    axios.delete(`http://127.0.0.1:8000/api/details-calendrie/${id}`)
                ));
                setHoraires(prev => prev.filter(horaire => !selectedRows.includes(horaire.id)));
                setSelectedRows([]);
                Swal.fire({
                    icon: "success",
                    title: "Supprimés!",
                    text: "Les horaires ont été supprimés avec succès.",
                });
                await fetchHoraires(selectedGroup?.id);
            }
        } catch (error) {
            console.error("Error deleting horaires:", error);
            Swal.fire({
                icon: "error",
                title: "Erreur!",
                text: "Une erreur est survenue lors de la suppression.",
            });
        }
    };
    const handleMultipleModify = () => {
        if (selectedRows.length > 0) {
            const selectedHoraires = horaires.filter(h => selectedRows.includes(h.id));
            setEditingHoraire(selectedHoraires[0]); // Use first selected item as template
            setShowForm(true);
        }
    };

    // Ajouter après les déclarations d'états existantes
    const columns = [
        { key: 'debut', label: 'Debut', render: (item) => item.debut ? new Date(item.debut).toLocaleDateString('fr-FR') : '' },
        { key: 'fin', label: 'Fin', render: (item) => item.fin ? new Date(item.fin).toLocaleDateString('fr-FR') : '' },
        { 
            key: 'horaire_periodique', 
            label: 'Horaire', 
            render: (item) => (
                <div 
                    className="text-primary cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleRowExpansion(item);
                    }}
                >
                    {item.horaire_periodique?.nom || ''}
                </div>
            )
        },
        { key: 'jourDebut', label: 'Jour Debut' }
    ];

    const handleSelectAllChange = (event) => {
        if (event.target.checked) {
            const allIds = filteredHoraires
                .filter(h => h.groupe_id === selectedGroup?.id)
                .map(h => h.id);
            setSelectedRows(allIds);
        } else {
            setSelectedRows([]);
        }
    };

    // Ajout de l'état et du handler pour les filtres comme dans Absence.jsx
    const [filtersVisible, setFiltersVisible] = useState(false);

    const fetchHoraireForDetail = async (groupe_horaire_id) => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/details-calendrie?groupe_horaire_id=${groupe_horaire_id}`);
            setTableData(prev => {
                const newItems = response.data.filter(item =>
                    !prev.some(existing => existing.id === item.id)
                );
                return [...prev, ...newItems];
            });
        } catch (error) {
            console.error('Erreur lors du chargement des horaires du détail:', error);
        }
    };

    const renderTableContent = (type, detaiCalendrie, selectedChildHoraire, formatTimeDisplay) => {
        const groupId = selectedChildHoraire?.groupe_horaire_id || selectedChildHoraire?.detail?.groupe_horaire_id;
        switch (type) {
            case 'fixe':
            case 'flexible ouvrable':
                return (
                    <>
                                <div style={{ borderRadius: '8px', overflow: 'hidden' }}>

                        <thead>
                            <tr className="bg-gray-200" style={{ backgroundColor:' #5B6C7D'  }}   >
                                <th className="p-2 border text-left back"  >Plage Type</th>
                                <th className="p-2 border text-left back">Taux</th>
                                <th className="p-2 border text-center back">Entree de</th>
                                <th className="p-2 border text-center back">Entree à</th>
                                <th className="p-2 border text-left back">Tranche de ropos de</th>
                                <th className="p-2 border text-center back">Tranche de ropos deduire</th>
                                <th className="p-2 border text-center back">Tranche de ropos durée</th>
                                <th className="p-2 border text-center back">Tranche de ropos à</th>
                                <th className="p-2 border text-center back">sortie de</th>
                                <th className="p-2 border text-center back">sortie à</th>
                                <th className="p-2 border text-center back">Cumul</th>
                                <th className="p-2 border text-center back">Jour travail</th>
                                <th className="p-2 border text-center back">Pénalite Entree</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData
                                .filter(item => item.groupe_horaire_id === selectedChildHoraire.horaire.id)
                                .map(item => {
                                    console.log('item sous-sous-table', item);
                                    return (
                                        <tr key={item.id}>
                                            <td className="p-2 border">{item.typePlageHoraire}</td>
                                            <td className="p-2 border">{item.tauxPlageHoraire}</td>
                                            <td className="p-2 border text-center">{formatTimeDisplay(item.entreeDe)}</td>
                                            <td className="p-2 border text-center">{formatTimeDisplay(item.entreeA)}</td>
                                            <td className="p-2 border">{formatTimeDisplay(item.reposDe)}</td>
                                            <td className="p-2 border text-center">
                                                {item.deduireRepos === 'NonDeduit' ? 'Non Deduit' : item.deduireRepos}
                                            </td>
                                            <td className="p-2 border text-center">{formatTimeDisplay(item.dureeRepos)}</td>
                                            <td className="p-2 border text-center">{formatTimeDisplay(item.reposA)}</td>
                                            <td className="p-2 border text-center">{formatTimeDisplay(item.sortieDe)}</td>
                                            <td className="p-2 border text-center">{formatTimeDisplay(item.sortieA)}</td>
                                            <td className="p-2 border text-center">{item.cumul}</td>
                                            <td className="p-2 border text-center">{item.jourTravaille}</td>
                                            <td className="p-2 border text-center">{item.penaliteEntree}</td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                        </div>
                    </>
                );
            case 'automatique':
                return (
                    <>
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="p-2 border text-center back">Heure Début</th>
                                <th className="p-2 border text-center back">Heure Fin</th>
                                <th className="p-2 border text-center back">Horaire Journalier</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData
                                .filter(item => item.groupe_horaire_id === groupId)
                                .map(item => (
                                    <tr key={item.id}>
                                        <td className="p-2 border text-center">{item.heureDebut}</td>
                                        <td className="p-2 border text-center">{item.heureFin}</td>
                                        <td className="p-2 border text-center">{item.detail?.designation}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </>
                );
            default:
                return null;
        }
    };


const renderExpandedRow = (horaire) => {
    return (
        <div className="expanded-row-container">
            <div className="sub-table-header">
                <div className="sub-table-title">
                    <i className="fas fa-calendar-week text-primary"></i>
                    <span>Détails du calendrier - {horaire.designation || 'Horaire'}</span>
                </div>
                <div className="sub-table-badge">
                    {fetchDetailsForHoraire(horaire.groupe_horaire_id).length} éléments
                </div>
            </div>
            <div style={{ borderRadius: '8px', overflow: 'hidden' }}>

            <table className="w-full border-collapse"    >
                    <thead    >
                        <tr className="bg-gray-200"         style={{ backgroundColor:' #5B6C7D'  }}       >
                            <th className="p-2 border backe">ID</th>
                            <th className="p-2 border backe">Numero Jour</th>
                            <th className="p-2 border backe">Libele</th>
                            <th className="p-2 border backe">Horaire</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fetchDetailsForHoraire(horaire.groupe_horaire_id).map(detail => (
                            <React.Fragment key={detail.id}>
                                <tr>
                                    <td className="p-2 border">{detail.id}</td>
                                    <td className="p-2 border">{detail.numero_jour}</td>
                                    <td className="p-2 border">{detail.libele}</td>
                                    <td className="p-2 border text-primary">
                                        <div
                                            className="flex justify-center gap-2 cursor-pointer"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                await fetchHoraireForDetail(detail.groupe_horaire_id);
                                                setSelectedChildHoraire(prev =>
                                                    prev && prev.detailId === detail.id && prev.horaireId === horaire.id
                                                        ? null
                                                        : { detailId: detail.id, horaireId: horaire.id, detail: detail }
                                                );
                                            }}
                                        >
                                            {detail.horaire?.designation}
                                        </div>
                                    </td>
                                </tr>
                                {selectedChildHoraire &&
                                    selectedChildHoraire.detailId === detail.id &&
                                    selectedChildHoraire.horaireId === horaire.id && (
                                        <tr>
                                            <td colSpan="4" className="p-2 border">
                                                <table className="w-full border-collapse">
                                                    {renderTableContent(
                                                        detail.horaire?.type,
                                                        detaiCalendrie,
                                                        selectedChildHoraire.detail,
                                                        formatTimeDisplay
                                                    )}
                                                </table>
                                            </td>
                                        </tr>
                                    )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>

                </div>


        </div>
    );
};


useEffect(() => {
    setTitle("Gestion des calendriers");
  
    setOnPrint(() => handlePrint);
    setOnExportPDF(() => exportToPDF);
    setOnExportExcel(() => exportToExcel);
  
    return () => {
      clearActions();
      setTitle('');
    };
  }, [setTitle, setOnPrint, setOnExportPDF, setOnExportExcel, clearActions, handlePrint, exportToPDF, exportToExcel]);


  useEffect(() => {
    setGlobalSearch(searchQuery || '');
  }, [searchQuery]);


    return (
        <>
        <ThemeProvider theme={createTheme()}>
    <Box sx={{ ...dynamicStyles }}>
      <Box component="main" sx={{ flexGrow: 1, p: 0, mt: 12 }}>


      <div style={{ 
        display: "flex", 
        flex: 1, 
        position: "relative",
        margin: 0,
        padding: 0,
        height: "calc(100vh - 80px)"}}
      >


        
            {/* <PageHeader2
                title="Gestion des calendriers"
                onExportPDF={exportToPDF}
                onExportExcel={exportToExcel}
                onPrint={handlePrint}
                globalSearch={globalSearch}
                onGlobalSearchChange={(e) => setGlobalSearch(e.target.value)}
                onFiltersToggle={handleFiltersToggle}
            /> */}



                {/*  Section Goupe Calendries */}
                {/*   le style de la liste des groupes est integrer dans cette interface*/}


                <div style={{ 
          width: "18%", 
          height: "100%",
          margin: 0,
          padding: 0
        }}>
    <div className="groups-section">                         
        <div className="groups-header">                             
                        <span>                                 
                        Calendriers                                 
            <FontAwesomeIcon                                     
                    icon={faGear}                                     
                    className="text-primary"                                     
                    style={{ cursor: "pointer", marginTop: '2%' ,marginLeft: '130%' }}                                     
                    onClick={() => setShowAddGroupe(true)}                                 
                />                             
            </span>                         
                       
        </div>                         
        <ul style={{ padding: 0 , marginTop: '20px'}}>                             
            {groups.map(group => (                                 
                <li                                     
                    key={group.id}                                     
                    onClick={() => handleGroupClick(group)}                                     
                    className={`department-item ${selectedGroup?.id === group.id ? 'selected' : ''}`}                                     
                    style={{ listStyleType: "none" }}                                 
                >                                     
        <div className="department-item-content">
          
          <div style={{ width: "24px", marginRight: "8px", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaRegCircle  size={14} style={{color:'#3a8a90'}} />
          </div>

          <span
            onClick={() => handleGroupClick(group)}
            className={`common-text ${selectedGroup?.id === group.id ? 'selected' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <IoFolderOpenOutline size={18} />
            {group.nom}
          </span>
          
        </div>
                </li>                             
            ))}                         
        </ul>                     
    </div>                 
</div>







<div className="container3" style={{ 
              width: showForm ? '56.5%' : '81%' }}>




                <div className="mt-4">
                    <div className="section-header mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <span className="section-title mb-1">
                                    <i className="fas fa-calendar-times me-2"></i>
                                    Détails du Calendrier
                                </span>
                                <p className="section-description text-muted mb-0">
                                {selectedGroup ? selectedGroup.nom : 'Aucun '} - Calendrier sélectionné
                                </p>
                            </div>
                            <div className="d-flex align-items-center">

                            <FontAwesomeIcon
          onClick={() => handleFiltersToggle && handleFiltersToggle(!filtersVisible)}
          icon={filtersVisible ? faClose : faFilter}
          color={filtersVisible ? "green" : ""}
          style={{
            cursor: "pointer",
            fontSize: "1.9rem",
            color: "#2c767c",
            marginRight: "15px",
          }}
        />

                            
                            <Button
                            onClick={() => {
                                if (!selectedGroup || !canCreate) return;
                                setShowForm(true);
                                setEditingAbsence(null);
                            }}
                            className={`btn btn-outline-primary d-flex align-items-center ${(!selectedGroup || !canCreate) ? "disabled-btn" : ""}`}
                            size="sm"
                            style={{ height:'45px', cursor: (selectedGroup && canCreate) ? 'pointer' : 'not-allowed', opacity: (selectedGroup && canCreate) ? 1 : 0.5 }}
                        >
            <FaPlusCircle className="me-2" />
            Ajouter  un Détail
            </Button>
                        </div>
                        </div>
                    </div>
                </div>

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
                            <span className="filters-title" style={{ display:'flex', textAlign:'center'

                            }}
                            >
                                Filtres
                            </span>
                        </div>
                        <div className="filter-group">
                            {/* Date Début */}
                            <label className="filter-label" style={{ fontSize: '0.9rem', margin: 0, marginRight: '-25px'
                                , marginLeft:'50px', whiteSpace: 'nowrap', minWidth: 'auto', fontWeight: 600, color: '#2c3e50' }}>
                                Date Début
                            </label>
                            <div className="filter-input-wrapper">
                                <input
                                    type="date"
                                    className="filter-input"
                                    value={filters.debut}
                                    onChange={e => setFilters({ ...filters, debut: e.target.value })}
                                />
                            </div>
                            {/* Date Fin */}
                            <label className="filter-label" style={{ fontSize: '0.9rem', margin: 0, marginRight: '-45px'
                                , marginLeft:'20px', whiteSpace: 'nowrap', minWidth: 'auto', fontWeight: 600, color: '#2c3e50' }}>
                                Date Fin
                            </label>
                            <div className="filter-input-wrapper">
                                <input
                                    type="date"
                                    className="filter-input"
                                    value={filters.fin}
                                    onChange={e => setFilters({ ...filters, fin: e.target.value })}
                                />
                            </div>
                            {/* Jour Début */}
                            <label className="filter-label" style={{ fontSize: '0.9rem', margin: 0, marginRight: '-25px'
                                , marginLeft:'20px', whiteSpace: 'nowrap', minWidth: 'auto', fontWeight: 600, color: '#2c3e50' }}>
                                Jour Début
                            </label>
                            <div className="filter-input-wrapper">
                                <select
                                    className="filter-input"
                                    value={filters.jourDebut}
                                    onChange={e => setFilters({ ...filters, jourDebut: e.target.value })}
                                >
                                    <option value="">Sélectionner un jour</option>
                                    {getUniqueDays().map((day, idx) => (
                                        <option key={idx} value={day}>{day}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Horaire */}
                            <label className="filter-label" style={{ fontSize: '0.9rem', margin: 0, marginRight: '-50px', marginLeft:'20px', whiteSpace: 'nowrap', minWidth: 'auto', fontWeight: 600, color: '#2c3e50' }}>
                                Horaire
                            </label>
                            <div className="filter-input-wrapper">
                                <select
                                    className="filter-input"
                                    value={filters.typeTrancheRepos}
                                    onChange={e => setFilters({ ...filters, typeTrancheRepos: e.target.value })}
                                >
                                    <option value="">Sélectionner un horaire</option>
                                    {getUniqueHoraires().map((horaire, idx) => (
                                        <option key={idx} value={horaire}>{horaire}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>




                
                <Modal
                    show={showAddGroupe}
                    onHide={() => setShowAddGroupe(false)}
                    dialogClassName="custom-modal"
                    centered
                >
                    <Modal.Body className="d-flex flex-column align-items-center justify-content-center pt-0">
                        <div className="position-relative w-100" style={{ marginTop: '30px' }}>
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '-12px',
                                    left: '20px',
                                    backgroundColor: 'white',
                                    padding: '0 12px',
                                    color: '#00afaa',
                                    fontWeight: 'bold',
                                    fontSize: '1.1rem',
                                    zIndex: 1,
                                }}
                            >
                                Gestion des Calendriers
                            </div>
                            <div
                                style={{
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '12px',
                                    padding: '30px 25px 10px',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                                    backgroundColor: 'white',
                                    maxHeight: '400px',
                                    overflowY: 'auto',
                                }}
                            >
                                <Form>
                                    <Form.Group className="mb-3">
                                        <Form.Control
                                            type="text"
                                            placeholder="Nom Calendrier"
                                            value={newCategory.categorie}
                                            onChange={(e) => setNewCategory({ ...newCategory, categorie: e.target.value })}
                                            style={{
                                                height: 40,
                                                border: '1px solid #e0e0e0',
                                                borderRadius: '8px',
                                                fontSize: '0.9rem'
                                            }}
                                        />
                                    </Form.Group>
                                    <Table className="custom-header" style={{ marginBottom: 0 }}>
                                        <thead>
                                            <tr style={{ textAlign: 'center' }}>
                                                <th style={{ color: '#4b5563', backgroundColor: '#f9fafb', fontWeight: '600' }}>Id</th>
                                                <th style={{ color: '#4b5563', backgroundColor: '#f9fafb', fontWeight: '600' }}>Calendrier</th>
                                                <th style={{ color: '#4b5563', backgroundColor: '#f9fafb', fontWeight: '600' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groups.map(group => (
                                                <tr key={group.id}>
                                                    <td>{group.id}</td>
                                                    <td>
                                                        {editingGroupId === group.id ? (
                                                            <Form.Control
                                                                type="text"
                                                                value={editingGroupData.nom}
                                                                onChange={(e) => setEditingGroupData({
                                                                    ...editingGroupData,
                                                                    nom: e.target.value
                                                                })}
                                                                style={{
                                                                    height: 35,
                                                                    border: '1px solid #e0e0e0',
                                                                    borderRadius: '6px',
                                                                    fontSize: '0.85rem'
                                                                }}
                                                            />
                                                        ) : (
                                                            group.nom
                                                        )}
                                                    </td>
                                                    <td>
                                                        {editingGroupId === group.id ? (
                                                            <>
                                                                <FontAwesomeIcon
                                                                    icon={faCheck}
                                                                    style={{
                                                                        color: "#00afaa",
                                                                        cursor: "pointer",
                                                                        fontSize: '1rem',
                                                                        marginRight: '10px'
                                                                    }}
                                                                    onClick={() => handleEditGroup(group.id)}
                                                                />
                                                                <FontAwesomeIcon
                                                                    icon={faXmark}
                                                                    style={{
                                                                        color: "#ff4757",
                                                                        cursor: "pointer",
                                                                        fontSize: '1rem'
                                                                    }}
                                                                    onClick={() => {
                                                                        setEditingGroupId(null);
                                                                        setEditingGroupData({ id: null, nom: '', periode: '' });
                                                                    }}
                                                                />
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FontAwesomeIcon
                                                                    icon={faEdit}
                                                                    style={{
                                                                        color: "#4b5563",
                                                                        cursor: "pointer",
                                                                        fontSize: '1rem',
                                                                        marginRight: '10px'
                                                                    }}
                                                                    onClick={() => {
                                                                        setEditingGroupId(group.id);
                                                                        setEditingGroupData({
                                                                            id: group.id,
                                                                            nom: group.nom,
                                                                            periode: group.periode
                                                                        });
                                                                    }}
                                                                />
                                                                <FontAwesomeIcon
                                                                    icon={faTrash}
                                                                    style={{
                                                                        color: "#ff4757",
                                                                        cursor: "pointer",
                                                                        fontSize: '1rem'
                                                                    }}
                                                                    onClick={() => handleDeleteGroupe(group.id)}
                                                                />
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Form>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer className="border-0 pt-0 d-flex justify-content-center">
                        <button
                            className="btn px-4 py-2"
                            style={{
                                backgroundColor: '#00afaa',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '500',
                                transition: 'all 0.2s ease'
                            }}
                            onClick={handleAddGroupe}
                        >
                            <i className="fas fa-check me-2"></i>
                            Valider
                        </button>
                        <button
                            className="btn px-4 py-2 me-3"
                            style={{
                                backgroundColor: 'white',
                                color: '#00afaa',
                                border: '1px solid #00afaa',
                                borderRadius: '8px',
                                fontWeight: '500',
                                transition: 'all 0.2s ease'
                            }}
                            onClick={() => setShowAddGroupe(false)}
                        >
                            Annuler
                        </button>
                    </Modal.Footer>
                </Modal>




                




                <ExpandRTable
                    columns={columns}
                    data={filteredHoraires.filter(h => h.groupe_id === selectedGroup?.id)}
                    searchTerm=""
                    highlightText=""
                    selectAll={selectedRows.length > 0 && selectedRows.length === filteredHoraires.filter(h => h.groupe_id === selectedGroup?.id).length}
                    selectedItems={selectedRows}
                    handleSelectAllChange={handleSelectAllChange}
                    handleCheckboxChange={handleRowSelection}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                    handleDeleteSelected={handleMultipleDelete}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    handleChangePage={handleChangePage}
                    handleChangeRowsPerPage={handleChangeRowsPerPage}
                    expandedRows={expandedRows}
                    toggleRowExpansion={toggleRowExpansion}
                    renderExpandedRow={renderExpandedRow}
                    canEdit={canUpdate}
                    canDelete={canDelete}
                    canBulkDelete={canDelete}
                />
                {selectedRows.length > 0 && (
                    <div className="mt-4 flex gap-4">
                        <button
                            className="add-employee-button"
                            onClick={handleMultipleModify}
                        >
                            <FontAwesomeIcon icon={faEdit} />
                            <span className="add-employee-button-text">
                                Modifier ({selectedRows.length})
                            </span>
                        </button>
                        <button
                            className="add-employee-button"
                            style={{ backgroundColor: 'rgba(229, 62, 62, 0.1)', color: '#e53e3e', borderColor: 'rgba(229, 62, 62, 0.2)' }}
                            onClick={handleMultipleDelete}
                        >
                            <FontAwesomeIcon icon={faTrash} />
                            <span className="add-employee-button-text">
                                Supprimer ({selectedRows.length})
                            </span>
                        </button>
                    </div>
                )}



                {showForm && (
              <div
                style={{
                  position: 'fixed',
                  right: '0',
                  zIndex: 1000,
                  overflowY: 'auto',
                  top: '-8.2%',
                  width: '20%',
                  height: '84%',
                  marginTop: '8.7%',
                  marginRight: '1%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  borderRadius: '8px',
                  boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                  backgroundColor: '#fff'
                }}>

                    <CalendrieForm
                        onSubmit={handleSubmit}
                        onCancel={() => {
                            setShowForm(false);
                            setEditingHoraire(null);
                        }}
                        initialData={editingHoraire}
                        selectedGroup={selectedGroup}
                        selectedType={selectedType}
                    />
              </div>
            )}

            </div>
            </div>





            <style jsx>{`     
            
            /* Styles pour les boutons d'expansion */
            .expand-button {
                background: transparent;
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                padding: 0;
                margin-right: 8px;
                cursor: pointer;
                border-radius: 4px;
                transition: all 0.2s ease;
            }
            
            .expand-button:hover {
                background-color: rgba(8, 179, 173, 0.1);
            }
            
            .expand-button svg {
                color: #3a8a90;
                font-size: 14px
                font-weight: 300;
            }

            /* Styles pour la nouvelle section header */
            .section-header {
                border-bottom: none;
                padding-bottom: 15px;
                margin-bottom: 25px;
                margin-top: showFilters ? 0% : -1%;
            }

            .section-title {
                color: #2c3e50;
                font-weight: 600;
                margin-bottom: 5px;
                display: flex;
                align-items: center;
                font-size: 17px;
            }

            .section-title i {
                color: rgba(8, 179, 173, 0.02);
                background: linear-gradient(135deg, #2c767c 0%, #3a8a90 100%);
                padding: 6px;
                border-radius: 60%;
                margin-right: 10px;
            }

            .section-description {
                color: #6c757d;
                font-size: 16px;
                margin-bottom: 0;
            }
                
                .btn-primary {
    background: linear-gradient(135deg, #2c767c 0%, #3a8a90 100%);
    border: none;   
    color: white;
    border-radius: 0.375rem;
    font-weight: 500;
    padding: 0.5rem 1rem;
    transition: background-color 0.15s ease-in-out;
    box-shadow : 0 2px 4px rgba(0, 175, 170, 0.2);
}



            .content-title {
font-size: 1.2rem;
    font-weight: 600;
    color: #4b5563;
    margin-bottom: 5px;            }
    
    
        .custom-checkbox .form-check-input:checked {                     
            background-color: #00afaa;                     
            border-color: #00afaa;                 
        }                                  
        
        .custom-checkbox .form-check-input:focus {                     
            border-color: #00afaa;                     
            box-shadow: 0 0 0 0.25rem rgba(0, 175, 170, 0.25);                 
        }                                  
        
        .custom-modal2 .modal-content {  
            width:100%;
            animation: fadeIn 0.3s;                     
            border-radius: 12px;                     
            border: none;                     
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);    
        }                                  
        
        @keyframes fadeIn {                     
            from { opacity: 0; transform: translateY(-20px); }                     
            to { opacity: 1; transform: translateY(0); }                 
        }                                  
        
        button:hover {                     
            transform: translateY(-2px);                     
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);                 
        }
        
        .fa-trash:hover {                     
            color: #ff3742 !important;                     
            transform: scale(1.1);                 
        }
        
        .custom-header th {                     
            background-color: rgba(0, 175, 170, 0.05);                     
            border-color: #e0e0e0;                 
        }
        
        .custom-header td {                     
            vertical-align: middle;                     
            border-color: #e0e0e0;                 
        }
    







        /* Style de la section calendriers */
        .groups-section {
            display: flex;
            flex-direction: column;
            height: calc(100vh - 160px);
            overflow-y: hidden;
            overflow-x: hidden;
            background-color: #fff;
            border-radius: 10px;
            padding: 15px;
            transition: all 0.3s ease;
            border: 1px solid #e9ecef;
            scrollbar-width: thin;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
    
        .groups-section::-webkit-scrollbar {
            width: 5px;
        }
    
        .groups-section::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
        }
    
        .groups-section::-webkit-scrollbar-thumb {
            background: #3a8a90;
            border-radius: 10px;
        }
    
        /* En-tête simple et propre */
        .groups-header {
            padding: 10px 20px;
            border-radius: 10px 10px 0 0;
            margin: -15px -15px 0 -15px;
            background:#f9fafb;
            border-bottom: 1px solid #e9ecef;
        }
    
        .groups-header span {
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            letter-spacing: 0.2px;
    
            font-size: 16.5px;
            font-weight: 600;
            color: #2c3e50;
     white-space: nowrap; 
    
        }
    
        /* Bouton paramètres simple - reste à l'extrémité */
        .groups-header .text-primary {
            color: #2c3e50 !important;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.2s ease;
            padding: 8px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            // margin: 0 !important;
        }
    
        .groups-header .text-primary:hover {
            color: #3a8a90 !important;
            background-color: rgba(8, 179, 173, 0.1);
            transform: scale(1.1);
        }
    
        /* Séparateur simple */
        .groups-section .separator {
            height: 1px;
            background-color: #e9ecef;
            margin: 0 -15px 15px -15px;
            width: calc(100% + 30px);
        }       
            
        }
        .department-item {
        border-radius: 10px;
        margin-bottom: 8px;
        transition: box-shadow 0.2s, background 0.2s, border 0.2s;
        border-left: 4px solid transparent;
        box-shadow: none;
    }

    .department-item:hover {
        background: #f2fefd;
        box-shadow: 0 2px 8px rgba(8, 179, 173, 0.08);
        border-left: 4px solid #3a8a90;
    }

    .department-item-content {
        display: flex;
        align-items: center;
        padding: 14px 18px;
        cursor: pointer;
        border-radius: 10px;
        font-size: 17px;
        font-weight: 600;
        color: #2c767c;
        transition: color 0.2s;
    }

    .common-text {
        display: flex;
        align-items: center;
        flex-grow: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 17px;
        font-weight: 600;
        color: #2c767c;
        transition: color 0.2s;
    }

    .department-item.selected .common-text,
    .department-item:hover .common-text {
        color: #3a8a90;
    }

    .common-text svg {
        margin-right: 12px;
        color: #3a8a90;
        font-size: 20px;
        transition: color 0.2s, transform 0.2s;
    }

    .department-item.selected .common-text svg,
    .department-item:hover .common-text svg {
        color: #2c767c;
        transform: scale(1.1);
    }


/* Variante de couleur pour différencier les calendriers */
.department-item:nth-child(2n) .department-item-content::before {
    background-color: #3a8a90;
}

.department-item:nth-child(3n) .department-item-content::before {
    background-color: #3a8a90;
}

/* Amélioration de l'espacement et alignement */
.department-item-content {
    display: flex;
    align-items: center;
    padding: 16px 18px; /* Légèrement plus d'espace vertical */
    cursor: pointer;
    border-radius: 10px;
    font-size: 15px; /* Taille plus cohérente */
    font-weight: 500; /* Moins gras pour plus d'élégance */
    color: #2c767c;
    transition: all 0.2s ease;
}

/* Ajustement de l'icône calendrier */
.common-text svg {
    margin-right: 10px; /* Réduction de l'espace */
    color: #3a8a90; /* Couleur plus neutre */
    font-size: 16px; /* Taille cohérente */
    transition: color 0.2s, transform 0.2s;
    opacity: 0.7;
}

/* États hover et selected améliorés */
.department-item:hover .department-item-content::before {
    transform: scale(1.2);
    box-shadow: 0 0 0 3px rgba(8, 179, 173, 0.2);
}

.department-item.selected .department-item-content::before {
    transform: scale(1.1);
    box-shadow: 0 0 0 2px rgba(8, 179, 173, 0.3);
}

.department-item.selected .common-text svg,
.department-item:hover .common-text svg {
    color: #3a8a90;
    opacity: 1;
    transform: scale(1.05);
}

/* Amélioration du texte */
.common-text {
    display: flex;
    align-items: center;
    flex-grow: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 16px;
    font-weight: 500;
    color: #4b5563; /* Couleur plus neutre */
    transition: color 0.2s;
}

.department-item.selected .common-text,
.department-item:hover .common-text {
    color: #3a8a90;
    font-weight: 600;
}

/* Amélioration subtile des bordures */
.department-item {
    border-radius: 10px;
    margin-bottom: 6px; /* Légèrement moins d'espace */
    transition: all 0.2s ease;
    border-left: 3px solid transparent; /* Bordure plus fine */
    box-shadow: none;
    background: rgba(255, 255, 255, 0.8);
}

.department-item:hover {
    background: #f0fdfc; /* Couleur de fond plus subtile */
    box-shadow: 0 2px 8px rgba(8, 179, 173, 0.06);
    border-left: 3px solid #3a8a90;
}

.department-item.selected {
  background: rgba(8, 179, 173, 0.03);
    border-left: 3px solid #3a8a90;
    box-shadow: 0 6px 20px rgba(8, 179, 173, 0.15);
}

<------------------- Sous Table --------------------->

/* Styles pour les sous-tables et sous-sous-tables */

/* Container principal des sous-tables */
.sub-table-container {
    background: #f8fafc;
    border-radius: 12px;
    padding: 20px;
    margin: 15px 0;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.3s ease;
}

/* Styles spécifiques pour les sous-tables de votre application */
.expanded-row-container {
    background: #f8fafc;
    border-radius: 8px;
    padding: 16px;
    margin: 8px 0;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.main-sub-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.main-sub-table thead {
    background: #5B6C7D;
}

.main-sub-table th.backe {
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    font-size: 0.9rem;
    color: white;
    border: 1px solid #4a5568;
    position: relative;
}

.main-sub-table td {
    padding: 12px 16px;
    border: 1px solid #e2e8f0;
    font-size: 0.9rem;
    color: #334155;
    transition: background-color 0.2s ease;
}

.main-sub-table tr:hover td {
    background-color: #f8fafc;
}

.main-sub-table .text-primary {
    color: #00afaa !important;
}

.main-sub-table .cursor-pointer {
    cursor: pointer;
    transition: all 0.2s ease;
}

.main-sub-table .cursor-pointer:hover {
    background-color: rgba(0, 175, 170, 0.1);
    border-radius: 4px;
}

/* Styles pour la table de détails (sous-sous-table) */
.detail-sub-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    background: white;
    border-radius: 6px;
    overflow: hidden;
    margin-top: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.detail-sub-table thead {
    background: #3A8B8C;
}

.detail-sub-table th.back {
    padding: 10px 12px;
    text-align: left;
    font-weight: 600;
    font-size: 0.85rem;
    color: white;
    border: 1px solid #2d6a6b;
    position: relative;
}

.detail-sub-table td {
    padding: 10px 12px;
    border: 1px solid #f1f5f9;
    font-size: 0.85rem;
    color: #475569;
    transition: background-color 0.2s ease;
}

.detail-sub-table tr:hover td {
    background-color: #f8fafc;
}

.detail-sub-table .text-center {
    text-align: center;
}

.detail-sub-table .text-left {
    text-align: left;
}

/* Styles pour les en-têtes des tables */
.sub-table-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid #e2e8f0;
}

.sub-table-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1e293b;
    display: flex;
    align-items: center;
    gap: 8px;
}

.sub-table-title i {
    color: #00afaa;
    font-size: 1rem;
}

.sub-table-badge {
    background: linear-gradient(135deg, #2c767c 0%, #3a8a90 100%);
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
    box-shadow: 0 2px 4px rgba(0, 175, 170, 0.2);
}


@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Responsive design */
@media (max-width: 768px) {
    .expanded-row-container {
        padding: 8px;
    }
    
    .main-sub-table th.backe,
    .main-sub-table td {
        padding: 8px 10px;
        font-size: 0.8rem;
    }
    
    .detail-sub-table th.back,
    .detail-sub-table td {
        padding: 6px 8px;
        font-size: 0.75rem;
    }
    
    .schedule-clickable {
        padding: 6px 8px;
        font-size: 0.8rem;
    }
}

.sub-table-container:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}



`}</style>

</Box>
      </Box>
    </ThemeProvider>


      </>
    );



};
export default Calendrie;