import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion, AnimatePresence, color } from 'framer-motion';
import TablePagination from '@mui/material/TablePagination';
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import {
    TextField, FormControl, Autocomplete, Fab
} from '@mui/material';
import RubriqueFormulaire from './RubriqueFormulaire';
import "./Style.css";
import ExpandRTable from "./Employe/ExpandRTable";
import PageHeader from '../ComponentHistorique/PageHeader';
import { FaPlusCircle } from "react-icons/fa";
import { IoFolderOpenOutline } from "react-icons/io5";
import {  FaMinus, FaPlus , FaRegCircle
} from "react-icons/fa";
import { useHeader } from "../Acceuil/HeaderContext";
import { ThemeProvider, createTheme, Box  } from "@mui/material";
import { useOpen } from "../Acceuil/OpenProvider";







const Rubrique = () => {
    // États principaux
    const [rubriques, setRubriques] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingRubrique, setEditingRubrique] = useState(null);
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [globalSearch, setGlobalSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        code: "",
        type: "",
    });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(7);
    const [activeTab, setActiveTab] = useState('tous');
    const [uniqueMemos, setUniqueMemos] = useState(new Set());
    const [selectedRubriques, setSelectedRubriques] = useState([]);
    const [expandedRows, setExpandedRows] = useState({});

    // États pour la gestion des groupes
    const [showAddGroupe, setShowAddGroupe] = useState(false);
    const [newCategory, setNewCategory] = useState({ categorie: "" });
    const [editingGroupId, setEditingGroupId] = useState(null);
    const [editingGroupName, setEditingGroupName] = useState('');

    // États pour la gestion des zones
    const [zones, setZones] = useState([]);
    const [selectedZones, setSelectedZones] = useState([]);
    const [editingZoneId, setEditingZoneId] = useState(null);
    const [editingZoneName, setEditingZoneName] = useState('');
    const { setTitle, setOnPrint, setOnExportPDF, setOnExportExcel, searchQuery, setSearchQuery, clearActions } = useHeader();
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

    const canCreateGroupRubrique = permissions.includes('create_group_rubriques');
    const { dynamicStyles } = useOpen();











    // Effet pour charger les données initiales
    useEffect(() => {
        const initializeData = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/group-rubriques');
                setGroups(response.data);
                console.log("groups:", response.data)
                setRubriques([]); // Initialiser avec un tableau vide
                setSelectedGroup(null); // Pas de groupe sélectionné par défaut
            } catch (error) {
                console.error('Erreur lors de l\'initialisation:', error);
                setError('Erreur lors du chargement des données');
            } finally {
                setIsLoading(false);
            }
        };

        initializeData();
    }, []); // Exécuter uniquement au montage du composant

    // Effet pour mettre à jour les mémos uniques quand les rubriques changent
    useEffect(() => {
        const memos = new Set(rubriques.map(rubrique => rubrique.memo).filter(Boolean));
        setUniqueMemos(memos);
    }, [rubriques]);

    // Effet pour charger les rubriques quand le groupe sélectionné change
    useEffect(() => {
        const loadRubriques = async () => {
            if (!selectedGroup) return;
            
            setIsLoading(true);
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/rubriques?group=${selectedGroup.id}`);
                setRubriques(response.data);
            } catch (error) {
                console.error('Erreur lors du chargement des rubriques:', error);
                setError('Erreur lors du chargement des rubriques');
                setRubriques([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadRubriques();
    }, [selectedGroup]);

    const normalizeValue = (value) => String(value).toLowerCase().trim();

    const applyFilters = useCallback((rubriques) => {
        return rubriques.filter(rubrique => {
            const codeValue = rubrique.code ? rubrique.code.toString().toLowerCase() : "";
            const typeValue = rubrique.type_rubrique ? rubrique.type_rubrique.toString().toLowerCase() : "";
            const matchesCode = !filters.code || codeValue.includes(filters.code.toLowerCase());
            const matchesType = !filters.type || typeValue.includes(filters.type.toLowerCase());
            return matchesCode && matchesType;
        });
    }, [filters]);

    const filteredRubriques = useMemo(() => {
        return applyFilters(rubriques);
    }, [rubriques, applyFilters]);

    const getRubriquesByMemo = useCallback((memo) => {
        if (memo === 'tous') return rubriques;
        return rubriques.filter(rubrique => rubrique.memo === memo);
    }, [rubriques]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 7));
        setPage(0);
    };

    // Fonction optimisée pour le clic sur un groupe
    const handleGroupClick = useCallback(async (group) => {
        setSelectedGroup(group);
        setIsLoading(true);
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/rubriques?group=${group.id}`);
            setRubriques(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des rubriques:', error);
            setError('Erreur lors du chargement des rubriques');
            setRubriques([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleEditGroup = async (groupId) => {
        try {
            if (!editingGroupName) {
                Swal.fire({
                    icon: "warning",
                    title: "Attention!",
                    text: "Veuillez entrer un nom de groupe.",
                });
                return;
            }
    
    
            Swal.fire({
                icon: "success",
                title: "Succès!",
                text: "Groupe modifié avec succès.",
            });
        } catch (error) {
            console.error("Erreur lors de la modification du groupe:", error);
    
            Swal.fire({
                icon: "error",
                title: "Erreur!",
                text: error.response?.data?.message || "Échec de la modification du groupe.",
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
        if (groups.length === 0) return;

        Swal.fire({
            title: `Êtes-vous sûr de vouloir supprimer ${groups.length} groupe(s)?`,
            showDenyButton: true,
            confirmButtonText: "Oui",
            denyButtonText: "Non",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await Promise.all(
                        groups.map((id) =>
                            axios.delete(`http://127.0.0.1:8000/api/group-motifs/${id}`)
                        )
                    );

                    setGroups((prevGroups) =>
                        prevGroups.filter((group) => !groups.includes(group.id))
                    );

                    setSelectedGroup(null);

                    Swal.fire({
                        icon: "success",
                        title: "Succès!",
                        text: `${groups.length} groupe(s) supprimé(s) avec succès.`,
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

    const toggleGroupSelection = (id) => {
        setGroups(prev =>
            prev.includes(id)
                ? prev.filter(selectedId => selectedId !== id)
                : [...prev, id]
        );
    };

    const handleSubmit = async (formData) => {
        try {
            let response;
            if (editingRubrique) {
                response = await axios.put(
                    `http://127.0.0.1:8000/api/rubriques/${editingRubrique.id}`,
                    formData
                );

                Swal.fire({
                    icon: 'success',
                    title: 'Succès!',
                    text: 'Rubrique mise à jour avec succès.',
                });
            } else {
                response = await axios.post('http://127.0.0.1:8000/api/rubriques', formData);

                Swal.fire({
                    icon: 'success',
                    title: 'Succès!',
                    text: 'Rubrique créée avec succès.',
                });
            }
            if (selectedGroup) {
                await handleGroupClick(selectedGroup);
            }
    
            setShowForm(false);
            setEditingRubrique(null);
        } catch (error) {
            console.error('Error saving rubrique:', error);
    
            Swal.fire({
                icon: 'error',
                title: 'Erreur!',
                text: 'Une erreur est survenue lors de l\'enregistrement de la rubrique.',
            });
        }
    };




    
    const handleCancel = () => {
        setShowForm(false);
        setEditingRubrique(null);
    };

    const handleEdit = (rubrique) => {
        setEditingRubrique(rubrique);
        setShowForm(true);
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Êtes-vous sûr de vouloir supprimer cette rubrique?',
            showDenyButton: true,
            confirmButtonText: 'Oui',
            denyButtonText: 'Non',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`http://127.0.0.1:8000/api/rubriques/${id}`);
    
                    setRubriques((prevRubriques) =>
                        prevRubriques.filter((rubrique) => rubrique.id !== id)
                    );
    
                    Swal.fire({
                        icon: 'success',
                        title: 'Succès!',
                        text: 'Rubrique supprimée avec succès.',
                    });
                } catch (error) {
                    console.error('Erreur lors de la suppression de la rubrique:', error);
    
                    Swal.fire({
                        icon: 'error',
                        title: 'Erreur!',
                        text: 'Échec de la suppression de la rubrique.',
                    });
                }
            }
        });
    };

    const exportToPDF = useCallback(() => {
        const doc = new jsPDF();
        const tableColumn = [
            'Code',
            'Désignation',
            'Type',
            'Mémo',
            'Valeur',
            'Visibilité'
        ];
        const tableRows = rubriques.map(rubrique => [
            rubrique.code,
            rubrique.designation,
            rubrique.type_rubrique,
            rubrique.memo,
            rubrique.valeur,
            rubrique.visibilite ? 'Oui' : 'Non'
        ]);

        const pageWidth = doc.internal.pageSize.width;
        const title = 'Rapport des Rubriques';
        const dateStr = `Date: ${new Date().toLocaleDateString()}`;

        doc.setFontSize(18);
        doc.text(title, pageWidth / 2, 22, { align: 'center' });

        doc.setFontSize(11);
        doc.text(dateStr, pageWidth / 2, 30, { align: 'center' });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            styles: {
                border: 0.5,
                cellPadding: 2,
            },
            headStyles: {
                fillColor: [8, 179, 173],
                textColor: [0, 0, 0],
                fontSize: 10,
            },
            bodyStyles: {
                fontSize: 9,
            },
            alternateRowStyles: {
                fillColor: [250, 250, 250],
            },
        });

        doc.save(`rubriques_${new Date().toISOString()}.pdf`);
    }, [rubriques]);

    const exportToExcel = useCallback(() => {
        const ws = XLSX.utils.json_to_sheet(filteredRubriques);

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Rubriques");

        ws['!cols'] = [
            { wch: 20 },
            { wch: 15 },
            { wch: 10 },
            { wch: 15 },
            { wch: 25 }
        ];

        XLSX.writeFile(wb, `rubriques_${new Date().toISOString()}.xlsx`);
    }, [filteredRubriques]);

    const handlePrint = useCallback(() => {
        const printWindow = window.open("", "_blank");
        const tableColumn = [
            'Désignation',
            'Code',
            'Type',
            'Mémo',
            'Valeur'
        ];
        const tableRows = rubriques.map(rubrique => [
            rubrique.designation,
            rubrique.code,
            rubrique.type_rubrique,
            rubrique.memo,
            rubrique.valeur
        ]);

        printWindow.document.write(`
          <html>
            <head>
              <title>Rapport des Rubriques</title>
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
                  font-weight: bold;
                }
                tbody tr:nth-child(even) {
                  background-color: #f9f9f9;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Rapport des Rubriques</h1>
                <p>Date: ${new Date().toLocaleDateString()}</p>
              </div>
              <table>
                <thead>
                  <tr>${tableColumn.map(col => `<th>${col}</th>`).join("")}</tr>
                </thead>
                <tbody>
                  ${tableRows.map(row => `
                    <tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>
                  `).join("")}
                </tbody>
              </table>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }, [rubriques]);
    const toggleFilters = () => {
        setShowFilters((prev) => !prev);
    };

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
    
            const response = await axios.post("http://127.0.0.1:8000/api/group-rubriques", {
                designation: newCategory.categorie,
            });
    
            setGroups((prevGroups) => [...prevGroups, response.data.data]);
    
            setNewCategory({ categorie: "" });
    
            Swal.fire({
                icon: "success",
                title: "Succès!",
                text: "Groupe ajouté avec succès.",
            });
    
            setShowAddGroupe(false);
    
            await handleGroupClick(selectedGroup);
        } catch (error) {
            console.error("Erreur lors de l'ajout:", error);
    
            Swal.fire({
                icon: "error",
                title: "Erreur!",
                text: error.response?.data?.message || "Échec de l'ajout du groupe.",
            });
        }
    };

    const handleDeleteGroupe = async (groupId) => {
        console.log("Tentative de suppression du groupe avec ID :", groupId);
        const result = await Swal.fire({
            title: "Êtes-vous sûr de vouloir supprimer cette groupe ?",
            showDenyButton: true,
            confirmButtonText: "Oui",
            denyButtonText: "Non",
            customClass: {
                actions: "my-actions",
                confirmButton: "order-2",
                denyButton: "order-3",
            },
        });
    
        if (result.isConfirmed) {
            try {
                const response = await axios.delete(`http://127.0.0.1:8000/api/group-rubriques/${groupId}`);
                console.log("Réponse de l'API :", response.data);
                setGroups(prevGroups => prevGroups.filter(group => group.id !== groupId));
            } catch (error) {
                console.error("Erreur lors de la suppression du groupe :", error);
            }
        }
    };

    // Fonction pour gérer la sélection de toutes les rubriques
    const handleSelectAllChange = useCallback((event) => {
        if (event.target.checked) {
            setSelectedRubriques(filteredRubriques.map(n => n.id));
        } else {
            setSelectedRubriques([]);
        }
    }, [filteredRubriques]);

    // Fonction pour gérer la sélection d'une rubrique individuelle
    const handleCheckboxChange = useCallback((id) => {
        setSelectedRubriques(prev => 
            prev.includes(id) 
                ? prev.filter(itemId => itemId !== id)
                : [...prev, id]
        );
    }, []);

    // Fonction pour gérer la suppression des rubriques sélectionnées
    const handleDeleteSelected = useCallback(async () => {
        if (selectedRubriques.length === 0) return;

        const result = await Swal.fire({
            title: "Êtes-vous sûr?",
            text: `Vous allez supprimer ${selectedRubriques.length} rubrique(s)!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Oui, supprimer!",
            cancelButtonText: "Annuler",
        });

        if (result.isConfirmed) {
            try {
                await Promise.all(
                    selectedRubriques.map(id => axios.delete(`http://127.0.0.1:8000/api/rubriques/${id}`))
                );
                
                setRubriques(prev => prev.filter(rubrique => !selectedRubriques.includes(rubrique.id)));
                setSelectedRubriques([]);
                
                Swal.fire("Supprimés!", "Les rubriques ont été supprimées.", "success");
            } catch (error) {
                console.error("Error deleting selected rubriques:", error);
                Swal.fire("Erreur!", "Une erreur est survenue lors de la suppression.", "error");
            }
        }
    }, [selectedRubriques]);

    // Fonction pour gérer l'expansion des lignes
    const toggleRowExpansion = useCallback((id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    }, []);

    // Fonction pour rendre le contenu de la ligne expandue
    const renderExpandedRow = useCallback((rubrique) => (
        <div className="p-4">
            <h4>Détails de la rubrique</h4>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p><strong>Code:</strong> {rubrique.code}</p>
                    <p><strong>Intitulé:</strong> {rubrique.intitule}</p>
                    <p><strong>Type:</strong> {rubrique.type_rubrique}</p>
                </div>
                <div>
                    <p><strong>Formule:</strong> {rubrique.formule}</p>
                    <p><strong>Mémo:</strong> {rubrique.memo}</p>
                </div>
            </div>
        </div>
    ), []);


    useEffect(() => {
        setTitle("Gestion des rubriques");
      
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


      const handleFiltersToggle = (isVisible) => {
        if (isVisible) {
          setShowFilters(true);
        } else {
          setTimeout(() => {
            setShowFilters(false);
          }, 300); 
        }
      };


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

            {/* <PageHeader
                title="Gestion des Rubriques"
                onExportPDF={exportToPDF}
                onExportExcel={exportToExcel}
                onPrint={handlePrint}
                globalSearch={globalSearch}
                onGlobalSearchChange={e => setGlobalSearch(e.target.value)}
                onFiltersToggle={toggleFilters}
            /> */}



                {/* Section des groupes */}
                <div style={{ 
          width: "18%", 
          height: "100%",
          margin: 0,
          padding: 0
        }}>
                    <div className="groups-section">
                        <div className="groups-header">
                            <span>
                                Groupes Rubriques
                                <FontAwesomeIcon
                                    icon={faGear}
                                    className={`text-primary ${!canCreateGroupRubrique ? 'disabled-btn' : ''}`}
                                    style={{ cursor: canCreateGroupRubrique ? "pointer" : "not-allowed", marginTop: '2%', marginLeft: '57%', opacity: canCreateGroupRubrique ? 1 : 0.5 }}
                                    onClick={() => { if (!canCreateGroupRubrique) return; setShowAddGroupe(true); }}
                                />
                            </span>
                        </div>
                        <ul style={{ padding: 0, marginTop: '20px' }}>
                            {groups.map(group => (
                                <li
                                    key={group.id}
                                    onClick={() => handleGroupClick(group)}
                                    className={`department-item ${selectedGroup?.id === group.id ? 'selected' : ''}`}
                                    style={{ listStyleType: "none" }}
                                >
                                    <div className="department-item-content">
                                        <button
                                            className="expand-button"
                                            onClick={() => handleGroupClick(group)}
                                        >
                                            {selectedGroup?.id === group.id ? (


<FaRegCircle
size={14} />
) : (
<FaRegCircle
size={14} />



                                            )}
                                        </button>
                                        <span className={`common-text ${selectedGroup?.id === group.id ? 'selected' : ''}`}>
                                        <IoFolderOpenOutline size={18} />


                                            {group.designation}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>




                {/* Section de la table */}


                <div className="container3" style={{ 
              width: showForm ? '33.3%' : '81%' }}>

                <AnimatePresence>
                    {showFilters && (
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
                            <div className="filter-group">
                                <label className="filter-label"
                                    style={{
                                        fontSize: '0.9rem',
                                        margin: 0,
                                        marginRight: '-50px',
                                        marginLeft: '50px',
                                        whiteSpace: 'nowrap',
                                        minWidth: 'auto',
                                        fontWeight: 600,
                                        color: '#2c3e50'
                                    }}>
                                    Code
                                </label>
                                <div className="filter-input-wrapper">
                                    <input
                                        type="text"
                                        value={filters.code}
                                        onChange={e => setFilters({ ...filters, code: e.target.value })}
                                        className="filter-input"
                                        placeholder="Code"
                                    />
                                </div>
                                <label className="filter-label"
                                    style={{
                                        fontSize: '0.9rem',
                                        margin: 0,
                                        marginRight: '-50px',
                                        marginLeft: '50px',
                                        whiteSpace: 'nowrap',
                                        minWidth: 'auto',
                                        fontWeight: 600,
                                        color: '#2c3e50'
                                    }}>
                                    Type
                                </label>
                                <div className="filter-input-wrapper">
                                    <select
                                        value={filters.type}
                                        onChange={e => setFilters({ ...filters, type: e.target.value })}
                                        className="filter-input"
                                    >
                                        <option value="">Sélectionner un type</option>
                                        {[...new Set(rubriques.map(item => item.type_rubrique))].map((type, idx) => (
                                            <option key={idx} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>


                <div className="mt-4">
                    <div className="section-header mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <span className="section-title mb-1">
                                    <i className="fas fa-cogs me-2"></i>
                                    Détails Rubriques
                                </span>
                                <p className="section-description text-muted mb-0">
                                    {selectedGroup ? selectedGroup.designation : 'Aucun'} - Groupe sélectionné
                                </p>
                            </div>

                            <div className="d-flex align-items-center">

<FontAwesomeIcon
onClick={() => handleFiltersToggle && handleFiltersToggle(!showFilters)}
icon={showFilters ? faClose : faFilter}
color={showFilters ? "green" : ""}
style={{
cursor: "pointer",
fontSize: "1.9rem",
color: "#2c767c",
marginRight: "15px",
}}
/>

                            
                            <Button
                                onClick={() => {
                                    if (!selectedGroup) {
                                        return;
                                    }
                                    setShowForm(true);
                                    setEditingRubrique(null);
                                }}
                                className={`btn btn-outline-primary d-flex align-items-center ${!selectedGroup ? "disabled-btn" : ""}`}
                                size="sm"
                                style={{ height:'45px' }}

                            >
              <FaPlusCircle className="me-2" />


                                Ajouter une rubrique
                            </Button>
                            </div>
                        </div>
                    </div>
                    <Tabs
                        id="memo-tabs"
                        activeKey={activeTab}
                        onSelect={k => setActiveTab(k)}
                        className="mb-3 onglet"
                    >
                        <Tab eventKey="tous" title="Tous">
                            <ExpandRTable
                                columns={[
                                    { key: "code", label: "Code" },
                                    { key: "intitule", label: "Intitule" },
                                    { key: "type_rubrique", label: "Type" },
                                    { key: "formule", label: "Formule" },
                                    { key: "memo", label: "Mémo" }
                                ]}
                                data={filteredRubriques}
                                searchTerm={globalSearch.toLowerCase()}
                                highlightText={(text, searchTerm) => {
                                    if (!text || !searchTerm) return text;
                                    const textStr = String(text);
                                    const searchTermLower = searchTerm.toLowerCase();
                                    if (!textStr.toLowerCase().includes(searchTermLower)) return textStr;
                                    const parts = textStr.split(new RegExp(`(${searchTerm})`, 'gi'));
                                    return parts.map((part, i) =>
                                        part.toLowerCase() === searchTermLower
                                            ? <mark key={i} style={{ backgroundColor: 'yellow' }}>{part}</mark>
                                            : part
                                    );
                                }}
                                selectAll={selectedRubriques.length === filteredRubriques.length && filteredRubriques.length > 0}
                                selectedItems={selectedRubriques}
                                handleSelectAllChange={handleSelectAllChange}
                                handleCheckboxChange={handleCheckboxChange}
                                handleEdit={handleEdit}
                                handleDelete={handleDelete}
                                handleDeleteSelected={handleDeleteSelected}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                handleChangePage={handleChangePage}
                                handleChangeRowsPerPage={handleChangeRowsPerPage}
                                expandedRows={expandedRows}
                                toggleRowExpansion={toggleRowExpansion}
                                renderExpandedRow={renderExpandedRow}
                            />
                        </Tab>
                        {selectedGroup && Array.from(uniqueMemos).map(memo => (
                            <Tab key={memo} eventKey={memo} title={memo} className="tabiden">
                                <ExpandRTable
                                    columns={[
                                        { key: "code", label: "Code" },
                                        { key: "intitule", label: "Intitule" },
                                        { key: "type_rubrique", label: "Type" },
                                        { key: "formule", label: "Formule" },
                                        { key: "memo", label: "Mémo" }
                                    ]}
                                    data={getRubriquesByMemo(memo).filter(rubrique => {
                                        const codeValue = rubrique.code ? rubrique.code.toString().toLowerCase() : "";
                                        const typeValue = rubrique.type_rubrique ? rubrique.type_rubrique.toString().toLowerCase() : "";
                                        const matchesCode = !filters.code || codeValue.includes(filters.code.toLowerCase());
                                        const matchesType = !filters.type || typeValue.includes(filters.type.toLowerCase());
                                        return matchesCode && matchesType;
                                    })}
                                    searchTerm={globalSearch.toLowerCase()}
                                    highlightText={(text, searchTerm) => {
                                        if (!text || !searchTerm) return text;
                                        const textStr = String(text);
                                        const searchTermLower = searchTerm.toLowerCase();
                                        if (!textStr.toLowerCase().includes(searchTermLower)) return textStr;
                                        const parts = textStr.split(new RegExp(`(${searchTerm})`, 'gi'));
                                        return parts.map((part, i) =>
                                            part.toLowerCase() === searchTermLower
                                                ? <mark key={i} style={{ backgroundColor: 'yellow' }}>{part}</mark>
                                                : part
                                        );
                                    }}
                                    selectAll={selectedRubriques.length === filteredRubriques.length && filteredRubriques.length > 0}
                                    selectedItems={selectedRubriques}
                                    handleSelectAllChange={handleSelectAllChange}
                                    handleCheckboxChange={handleCheckboxChange}
                                    handleEdit={handleEdit}
                                    handleDelete={handleDelete}
                                    handleDeleteSelected={handleDeleteSelected}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    handleChangePage={handleChangePage}
                                    handleChangeRowsPerPage={handleChangeRowsPerPage}
                                    expandedRows={expandedRows}
                                    toggleRowExpansion={toggleRowExpansion}
                                    renderExpandedRow={renderExpandedRow}
                                />
                            </Tab>
                        ))}
                    </Tabs>
                </div>
            </div>
            </div>


            {showForm && (
                <div
                    style={{
                        position: 'fixed',
                        right: '0',
                        zIndex: 1000,
                        overflowY: 'auto',
                        top: '-8.2%',
                        width: '40%',
                        height: '84%',
                        marginTop: '8.7%',
                        marginRight: '1%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        borderRadius: '8px',
                        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                        backgroundColor: '#fff',
                    }}
                >
                    <RubriqueFormulaire
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        initialData={editingRubrique}
                        selectedGroup={selectedGroup}
                    />
                </div>
            )}

            <Modal
                show={showAddGroupe}
                onHide={() => setShowAddGroupe(false)}
                dialogClassName="custom-modal2"
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
                            Gestion des Groupes
                        </div>
                        <div
                            style={{
                                border: '1px solid #e0e0e0',
                                borderRadius: '12px',
                                padding: '30px 25px 10px',
                                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
                                backgroundColor: 'white',
                                maxHeight: '400px',
                                overflowY: 'auto',
                            }}
                        >
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Control
                                        type="text"
                                        placeholder="Nom du groupe"
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
                                            <th style={{ color: '#4b5563', backgroundColor: '#f9fafb', fontWeight: '600' }}>Groupe</th>
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
                                                            value={editingGroupName}
                                                            onChange={(e) => setEditingGroupName(e.target.value)}
                                                            style={{
                                                                height: 35,
                                                                border: '1px solid #e0e0e0',
                                                                borderRadius: '6px',
                                                                fontSize: '0.85rem'
                                                            }}
                                                        />
                                                    ) : (
                                                        group.designation
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
                                                                    setEditingGroupName('');
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
                                                                    setEditingGroupName(group.designation);
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
            <style jsx>{`
            /* Styles identiques à AbsenceTable */
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
                background: #3a8a90;
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
                background-color: #3a8a90;
                border-color: #3a8a90;
                color: white;
                border-radius: 0.375rem;
                font-weight: 500;
                padding: 0.5rem 1rem;
                transition: background-color 0.15s ease-in-out;
            }
            .content-title {
                font-size: 1.2rem;
                font-weight: 600;
                color: #4b5563;
                margin-bottom: 5px;
            }
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
            }
            .groups-header .text-primary:hover {
                color: #3a8a90 !important;
                background-color: rgba(8, 179, 173, 0.1);
                transform: scale(1.1);
            }
            .groups-section .separator {
                height: 1px;
                background-color: #e9ecef;
                margin: 0 -15px 15px -15px;
                width: calc(100% + 30px);
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
            .department-item:nth-child(2n) .department-item-content::before {
                background-color: #3a8a90;
            }
            .department-item:nth-child(3n) .department-item-content::before {
                background-color: #3a8a90;
            }
            .department-item-content {
                display: flex;
                align-items: center;
                padding: 16px 18px;
                cursor: pointer;
                border-radius: 10px;
                font-size: 15px;
                font-weight: 500;
                color: #2c767c;
                transition: all 0.2s ease;
            }
            .common-text svg {
                margin-right: 10px;
                color: #3a8a90;
                font-size: 16px;
                transition: color 0.2s, transform 0.2s;
                opacity: 0.7;
            }
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
            .common-text {
                display: flex;
                align-items: center;
                flex-grow: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                font-size: 16px;
                font-weight: 500;
                color: #4b5563;
                transition: color 0.2s;
            }
            .department-item.selected .common-text,
            .department-item:hover .common-text {
                color: #3a8a90;
                font-weight: 600;
            }
            .department-item {
                border-radius: 10px;
                margin-bottom: 6px;
                transition: all 0.2s ease;
                border-left: 3px solid transparent;
                box-shadow: none;
                background: rgba(255, 255, 255, 0.8);
            }
            .department-item:hover {
                background: #f0fdfc;
                box-shadow: 0 2px 8px rgba(8, 179, 173, 0.06);
                border-left: 3px solid #3a8a90;
            }
            .department-item.selected {
                background: rgba(8, 179, 173, 0.03);
                border-left: 3px solid #3a8a90;
                box-shadow: 0 6px 20px rgba(8, 179, 173, 0.15);
            }
                .disabled-btn {
  pointer-events: none;
  opacity: 0.7;
  cursor: not-allowed;
}

            `}</style>
                        </Box>
      </Box>
    </ThemeProvider>


        </>
    );
};

export default Rubrique;
