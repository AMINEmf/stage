import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {Form, Button, Table} from "react-bootstrap";
import "../style.css";
import Navigation from "../Acceuil/Navigation";
import Search from "../Acceuil/Search";
import TablePagination from '@mui/material/TablePagination';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faTrash, faFilePdf, faFileExcel, faPrint, faPlus, faMinus, faEdit,} from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { Toolbar } from "@mui/material";
import {IoIosPersonAdd} from "react-icons/io";
// import ExportPdfButton from "./ExportPdfButton";
// import PrintList from "./PrintList";
const EncaissementList = () => {
    const [expandedRows, setExpandedRows] = useState([]);
    const [comptes, setComptes] = useState([]);
    const [filteredBanques, setFilteredBanques] = useState([]);
    const [Banque, setBanque] = useState([]);
    const  [clients,setClients]=useState([]);
    const  [factures,setFactures]=useState([]);
    const [selectedProductsData, setSelectedProductsData] = useState([]);
    const [authId, setAuthId] = useState([]);
    const [encaissements, setEncaissements] = useState([]);
    const [ligneEncaissements,setLigneEncaissements]=useState([]);
    const [ligneEntrerComptes, setLigneEntrerComptes] = useState([]);
    const csrfTokenMeta = document.head.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfTokenMeta ? csrfTokenMeta.content : null;

    const [banques, setBanques] = useState([]);

    const getCompteById = (compteId) => {
        console.log("comptes", comptes);
        const compte = comptes.find((c) => c.id === compteId);
        return compte ? compte.designations : "";
    };

    const [searchTerm, setSearchTerm] = useState("");
    const [filtredEncaissements, setFiltredEncaissements] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [user, setUser] = useState({});
    // const [users, setUsers] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    //-------------------edit-----------------------//
    const [editingEncaissement, setEditingEncaissement] = useState(null); // State to hold the encaissement being edited
    const [editingEncaissementId, setEditingEncaissementId] = useState(null);

    //---------------form-------------------//
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        referencee: "",
        date_encaissement: "",
        montant_total: "",
        comptes_id: "",
        type_encaissement: "",
    });
    const [formContainerStyle, setFormContainerStyle] = useState({ right: "-500px", });
    const [tableContainerStyle, setTableContainerStyle] = useState({ marginRight: "0px", });
    const tableHeaderStyle = {
        background: "#ddd",
        padding: "10px",
        textAlign: "left",
        borderBottom: "1px solid #ddd",
    };

    const fetchEncaissements = async () => {
        try {
            const factureResponse = await axios.get("http://localhost:8000/api/factures");
            console.log("API Response for facture:", factureResponse.data.facture);
            setFactures(factureResponse.data.facture);
            localStorage.setItem('factures', JSON.stringify(factureResponse.data.facture));

            const clientResponse = await axios.get("http://localhost:8000/api/clients");
            console.log("API Response for clients:", clientResponse.data.client);
            setClients(clientResponse.data.client);
            localStorage.setItem('clients', JSON.stringify(clientResponse.data.client));

            const compteResponse = await axios.get("http://localhost:8000/api/comptes");
            console.log("API Response for Comptes:", compteResponse.data.comptes);
            setComptes(compteResponse.data.comptes);
            localStorage.setItem('comptes', JSON.stringify(compteResponse.data.comptes));

            const response = await axios.get("http://localhost:8000/api/encaissements");
            setEncaissements(response.data.encaissements);
            localStorage.setItem('encaissements', JSON.stringify(response.data.encaissements));
            console.log("API Response for encaissements:", response.data.encaissements);

            const responsebanques = await axios.get("http://localhost:8000/api/banques");
            setBanques(responsebanques.data.banques);
            localStorage.setItem('banques', JSON.stringify(responsebanques.data.banques));
            console.log("API Response for Banques:", responsebanques.data.banques);

            const responseLigneentrer = await axios.get("http://localhost:8000/api/ligneentrercompte");
            setLigneEntrerComptes(responseLigneentrer.data.ligneentrercomptes);
            localStorage.setItem('ligneEntrerComptes', JSON.stringify(responseLigneentrer.data.ligneentrercomptes));
            console.log("API Response for ligneentrercomptes:", responseLigneentrer.data.ligneentrercomptes);

            const ligneEncaissementResponse = await axios.get("http://localhost:8000/api/ligneencaissement");
            setLigneEncaissements(ligneEncaissementResponse.data.ligneencaissements);
            localStorage.setItem('ligneEncaissements', JSON.stringify(ligneEncaissementResponse.data.ligneencaissements));
            console.log("API Response for ligneencaissement:", ligneEncaissementResponse.data.ligneencaissements);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        const facturesFromStorage = localStorage.getItem('factures');
        const clientsFromStorage = localStorage.getItem('clients');
        const comptesFromStorage = localStorage.getItem('comptes');
        const encaissementsFromStorage = localStorage.getItem('encaissements');
        const banquesFromStorage = localStorage.getItem('banques');
        const ligneEntrerComptesFromStorage = localStorage.getItem('ligneEntrerComptes');
        const ligneEncaissementsFromStorage = localStorage.getItem('ligneEncaissements');

        if (facturesFromStorage) setFactures(JSON.parse(facturesFromStorage));
        if (clientsFromStorage) setClients(JSON.parse(clientsFromStorage));
        if (comptesFromStorage) setComptes(JSON.parse(comptesFromStorage));
        if (encaissementsFromStorage) setEncaissements(JSON.parse(encaissementsFromStorage));
        if (banquesFromStorage) setBanques(JSON.parse(banquesFromStorage));
        if (ligneEntrerComptesFromStorage) setLigneEntrerComptes(JSON.parse(ligneEntrerComptesFromStorage));
        if (ligneEncaissementsFromStorage) setLigneEncaissements(JSON.parse(ligneEncaissementsFromStorage));

        fetchEncaissements();
    }, []);

    useEffect(() => {
        const filtered =  encaissements&&encaissements.filter((encaissement) =>
            encaissement.referencee
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        );
        setFiltredEncaissements(filtered);
    }, [encaissements, searchTerm]);

    const handleBanqueSelection = (target) => {
        const banqueId = target.value;
        setFormData({ ...formData, [target.name]: banqueId });
        console.log("formData",formData);


    };

    const handlemodepaiementSelection = (target) => {
        const mode_de_paiement = target.value;
        console.log('target:',target)
        const banque = banques.filter((b) => b.mode_de_paiement === mode_de_paiement);
        console.log('banque : ',banque)
        setFormData({ ...formData, [target.name]: target.value });


        setBanque(banque);
        const banque_id = banque.id
         const facturesFormodePaimenent = banques.filter(facture => facture.banque_id === parseInt(banque_id) && facture.status != "reglee"  );
        setFilteredBanques(facturesFormodePaimenent);
        console.log("filtered Factures",filteredBanques);
    };
    // const handlemodepaiementSelection = (target) => {
    //     const selectedModePaiement = target.value;
    //     console.log('Mode de paiement sélectionné :', selectedModePaiement);
    //
    //     // Filtrer les lignes de banque par mode de paiement sélectionné
    //     const banquesFilteredByModePaiement = banques.filter(b => b.mode_de_paiement === selectedModePaiement);
    //     console.log(banquesFilteredByModePaiement);
    //
    //     // Mettre à jour l'état avec les lignes de banque filtrées
    //     setFilteredBanques(banquesFilteredByModePaiement);
    // };

    const handleSearch = (term) => {
        setSearchTerm(term);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleCheckboxChange = (itemId) => {
        if (selectedItems.includes(itemId)) {
            setSelectedItems(selectedItems.filter((id) => id !== itemId));
        } else {
            setSelectedItems([...selectedItems, itemId]);
        }
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    //------------------------- encaissement Delete Selected ---------------------//

    const handleDeleteSelected = () => {
        Swal.fire({
            title: 'Êtes-vous sûr de vouloir supprimer ?',
            showDenyButton: true,
            showCancelButton: false,
            confirmButtonText: 'Oui',
            denyButtonText: 'Non',
            customClass: {
                actions: 'my-actions',
                cancelButton: 'order-1 right-gap',
                confirmButton: 'order-2',
                denyButton: 'order-3',
            },
        }).then((result) => {
            if (result.isConfirmed) {
                selectedItems.forEach((id) => {
                    axios
                        .delete(`http://localhost:8000/api/encaissements/${id}`)
                        .then((response) => {
                            fetchEncaissements();
                            Swal.fire({
                                icon: "success",
                                title: "Succès!",
                                text: 'encaissement supprimé avec succès.',
                            });
                        })
                        .catch((error) => {
                            console.error(
                                "Erreur lors de la suppression du encaissement:", error);
                            Swal.fire({
                                icon: "error",
                                title: "Erreur!",
                                text: 'Échec de la suppression du encaissement.',
                            });
                        });
                });
            }
        });

        setSelectedItems([]);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSelectAllChange = () => {
        setSelectAll(!selectAll);
        if (selectAll) {
            setSelectedItems([]);
        } else {
            setSelectedItems(encaissements.map((encaissement) => encaissement.id));
        }
    };
    //------------------------- fournisseur print ---------------------//

    const printEncaissements = (encaissements, banques = [], factures = [], page = 0, rowsPerPage = 10) => {
        const printWindow = window.open("", "_blank", "");
        if (printWindow) {
            const newWindowDocument = printWindow.document;
            const title = "Reçu de Remise à l'Encaissement";

            newWindowDocument.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
            }
            h1 {
                text-align: center;
                margin-top: 30px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            th, td {
                border: 1px solid #000;
                padding: 8px;
                text-align: left;
            }
            th {
                background-color: #adb5bd;
            }
            .cheque {
                width: 100%;
                border: 2px solid #000;
                padding: 20px;
                margin-top: 20px;
                position: relative;
            }
            .cheque-line {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
            }
            .cheque-label {
                width: 30%;
            }
            .cheque-input {
                width: 65%;
                border-bottom: 1px solid #000;
            }
            .signature {
                margin-top: 30px;
                display: flex;
                justify-content: space-between;
            }
            .signature div {
                width: 45%;
                text-align: center;
                border-top: 1px solid #000;
            }
            .signature div:last-child {
                text-align: left;
            }
        </style>
    </head>
    <body>
        <h1>${title} : CHEQUE</h1>
        <p>Numéro de remise : ${encaissements.referencee}</p>
        <table>
            <tr>
                <td>Code agence du compte</td>
                <td></td>
                <td>Nom agence du compte</td>
               <td></td>
            </tr>
            <tr>
                <td>Code agence de remise</td>
                <td></td>
                <td>Nom agence de remise</td>
                <td></td>
            </tr>
            <tr>
                <td>N° de compte</td>
                <td>${encaissements.comptes_id}</td>
                <td>Client Remettant</td>
                <td>Amine</td>
            </tr>
            <tr>
                <td>Nombre de Valeurs</td>
                <td>1</td>
                <td>Montant total (DH)</td>
                <td>${encaissements.montant_total}</td>
            </tr>
            <tr>
                <td>Date et heure</td>
                <td>${encaissements.date_encaissement}</td>
            </tr>
        </table>

         <h3>Détail Remise</h3>
        <table>
            <thead>
                <tr>
                    <th>Client</th>
                    <th>N° de Facture</th>
                    <th>Total TTC</th>
                    <th>Date de Facture</th>
                    <th>N° de Chéque</th>
                    <th>Mode de Paiement</th>
                    <th>Date</th>
                    <th>Avance</th>
                    <th>Status</th>
                    <th>Remarque</th>
                </tr>
            </thead>
            <tbody>
                ${encaissements.ligne_encaissement.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(ligneEncaissement => {
                
                    const entreCompte = banques.find(entreCompt => entreCompt.id === ligneEncaissement.entrer_comptes_id);
                
                    const ligneEntreeCompte = entreCompte ? entreCompte.ligne_entrer_compte.find(ligne => ligne.client_id === entreCompte.client_id) : null;
               
                    const facture = ligneEntreeCompte ? factures.find(facture => facture.id === ligneEntreeCompte.id_facture) : null;

                return entreCompte ? `
                        <tr key="${entreCompte.id}">
                            <td>${facture ? facture.client.raison_sociale : 'N/A'}</td>
                            <td>${facture ? facture.reference : 'N/A'}</td>
                            <td>${facture ? facture.total_ttc : 'N/A'}</td>
                            <td>${facture ? facture.date : 'N/A'}</td>
                            <td>${entreCompte.numero_cheque}</td>
                            <td>${entreCompte.mode_de_paiement}</td>
                            <td>${entreCompte.datee}</td>
                            <td>${ligneEntreeCompte ? ligneEntreeCompte.avance : 'N/A'}</td>
                            <td>${entreCompte.Status}</td>
                            <td>${entreCompte.remarque}</td>
                        </tr>
                    ` : '';
            }).join('')}
            </tbody>
        </table>

        <div class="signature">
            <div>SIGNATURE CLIENT</div>
            <div>
                SIGNATURE AGENCE
                <br><br>
               
            </div>
        </div>
        
        <script>
            setTimeout(() => {
                window.print();
                window.onafterprint = function () {
                    window.close();
                };
            }, 1000);
        </script>
    </body>
    </html>
`);

            newWindowDocument.close();
        } else {
            console.error("Erreur lors de l'ouverture de la fenêtre d'impression.");
        }
    };
    //------------------------- fournisseur export to pdf ---------------------//

    const exportToPdf = () => {
        const pdf = new jsPDF();

        // Define the columns and rows for the table
        const columns = [

            "Sujet",
            "Date de Réclamation",
            "Status de Réclamation",
            "Traitement de Réclamation",
            "Date de Traitement",
        ];
        const selectedRecouvrements = encaissements.filter((encaissement) =>
            selectedItems.includes(encaissement.numero)
        );
        const rows = selectedRecouvrements.map((encaissement) => [
            encaissement.referencee,
            encaissement.date_encaissement,
            encaissement.montant_total,
            encaissement.comptes_id,
            encaissement.type_encaissement,

        ]);

        // Set the margin and padding
        const margin = 10;
        const padding = 5;

        // Calculate the width of the columns
        const columnWidths = columns.map(
            (col) => pdf.getStringUnitWidth(col) * 5 + padding * 2
        );
        const tableWidth = columnWidths.reduce((total, width) => total + width, 0);

        // Calculate the height of the rows
        const rowHeight = 10;
        const tableHeight = rows.length * rowHeight;

        // Set the table position
        const startX = (pdf.internal.pageSize.width - tableWidth) / 2;
        const startY = margin;

        // Add the table headers
        pdf.setFont("helvetica", "bold");
        pdf.setFillColor(200, 220, 255);
        pdf.rect(startX, startY, tableWidth, rowHeight, "F");
        pdf.autoTable({
            head: [columns],
            startY: startY + padding,
            styles: {
                fillColor: [200, 220, 255],
                textColor: [0, 0, 0],
                fontSize: 10,
            },
            columnStyles: {
                0: { cellWidth: columnWidths[0] },
                1: { cellWidth: columnWidths[1] },
                2: { cellWidth: columnWidths[2] },
                3: { cellWidth: columnWidths[3] },
                4: { cellWidth: columnWidths[4] },
                5: { cellWidth: columnWidths[5] },
                6: { cellWidth: columnWidths[6] },
                7: { cellWidth: columnWidths[7] },
            },
        });

        // Add the table rows
        pdf.setFont("helvetica", "");
        pdf.autoTable({
            body: rows,
            startY: startY + rowHeight + padding * 2,
            styles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: columnWidths[0] },
                1: { cellWidth: columnWidths[1] },
                2: { cellWidth: columnWidths[2] },
                3: { cellWidth: columnWidths[3] },
                4: { cellWidth: columnWidths[4] },
                5: { cellWidth: columnWidths[5] },
                6: { cellWidth: columnWidths[6] },
                7: { cellWidth: columnWidths[7] },
            },
        });

        // Save the PDF
        pdf.save("encaissements.pdf");
    };
    //------------------------- fournisseur export to excel ---------------------//

    const exportToExcel = () => {
        const selectedRecouvrements = encaissements.filter((encaissement) =>
            selectedItems.includes(encaissement.id)
        );
        const ws = XLSX.utils.json_to_sheet(selectedRecouvrements);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Recouvrements");
        XLSX.writeFile(wb, "recouvrements.xlsx");
    };

    //------------------------- encaissement Delete---------------------//
    const handleDelete = (id) => {
        Swal.fire({
            title: 'Êtes-vous sûr de vouloir supprimer ce encaissement ?',
            showDenyButton: true,
            showCancelButton: false,
            confirmButtonText: 'Oui',
            denyButtonText: 'Non',
            customClass: {
                actions: 'my-actions',
                cancelButton: 'order-1 right-gap',
                confirmButton: 'order-2',
                denyButton: 'order-3',
            },
        }).then((result) => {
            if (result.isConfirmed) {
                axios
                    .delete(`http://localhost:8000/api/encaissements/${id}`)
                    .then((response) => {
                        if (response.data) {
                            // Successful deletion
                            fetchEncaissements();
                            Swal.fire({
                                icon: 'success',
                                title: 'Succès!',
                                text: "encaissement supprimé avec succès",
                            });
                        } else if (response.data.error) {
                            // Error occurred
                            if (response.data.error.includes("Impossible de supprimer ou de mettre à jour une ligne parent : une contrainte de clé étrangère échoue")) {
                                // Violated integrity constraint error
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Erreur!',
                                    text: "Impossible de supprimer le encaissement car il a des produits associés.",
                                });
                            }
                        }
                    })
                    .catch((error) => {
                        // Request error
                        console.error("Erreur lors de la suppression du encaissement:", error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Erreur!',
                            text: `Échec de la suppression du encaissement. Veuillez consulter la console pour plus d'informations.`,
                        });
                    });
            } else {
                console.log("Suppression annulée");
            }
        });
    }
    //------------------------- encaissement EDIT---------------------//

    const handleEdit = (encaissements) => {
        setEditingEncaissement(encaissements);
        const banques_filtrees = banques.filter((banque)=>banque.mode_de_paiement === formData.type_encaissement);
        console.log("banques  filtrees: ",banques_filtrees)
        // Calculate the total montant from the filtered banques
        const montant_total = banques_filtrees.reduce((total, banque) => {
            const avances = banque.ligne_entrer_compte.map(item => parseFloat(item.avance));
            return total + avances.reduce((sum, avance) => sum + avance, 0);
        }, 0);

        console.log("montant_total: ", montant_total);// Set the recouvrements to be edited
        // Populate form data with recouvrements details
        setFormData({



            referencee: encaissements.referencee,
            date_encaissement: encaissements.date_encaissement,
            montant_total: montant_total,
            comptes_id: encaissements.comptes_id,
            type_encaissement: encaissements.type_encaissement,


        });
                if (formContainerStyle.right === '-500px') {
            setFormContainerStyle({ right: '0' });
            setTableContainerStyle({ marginRight: '500px' });
        } else {
            closeForm();
        }
        // Show form
        // setShowForm(true);
    };
    useEffect(() => {
        if (editingEncaissementId !== null) {
            setFormContainerStyle({ right: '0' });
            setTableContainerStyle({ marginRight: '500px' });
        }
    }, [editingEncaissementId]);

    //------------------------- encaissement SUBMIT---------------------//

    useEffect(() => {
        fetchEncaissements();
    }, []);

    // const handleSubmit =  (e) => {
    //     e.preventDefault();
    //
    //     const url = editingEncaissement ? `http://localhost:8000/api/encaissements/${editingEncaissement.id}` : 'http://localhost:8000/api/encaissements';
    //     const method = editingEncaissement ? 'put' : 'post';
    //     axios({
    //         method: method,
    //         url: url,
    //         data: formData,
    //     }).then(() => {
    //         fetchEncaissements();
    //         Swal.fire({
    //             icon: 'success',
    //             title: 'Succès!',
    //             text: `encaissement ${editingEncaissement ? 'modifié' : 'ajouté'} avec succès.`,
    //         });
    //         setFormData({
    //             referencee: '',
    //             date_encaissement: '',
    //             montant_total: '',
    //             comptes_id: '',
    //             type_encaissement: '',
    //
    //         });
    //         setEditingEncaissement(null); // Clear editing encaissement
    //         // closeForm();
    //     })
    //         .catch((error) => {
    //             console.error(`Erreur lors de ${editingEncaissement ? 'la modification' : "l'ajout"} du encaissement:`, error);
    //             Swal.fire({
    //                 icon: 'error',
    //                 title: 'Erreur!',
    //                 text: `Échec de ${editingEncaissement ? 'la modification' : "l'ajout"} du encaissement.`,
    //             });
    //         });
    //     if (formContainerStyle.right === "-500px") {
    //         setFormContainerStyle({ right: "0" });
    //         setTableContainerStyle({ marginRight: "500px" });
    //     } else {
    //         closeForm();
    //     }
    // };
    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("e",e)
        try {
            // const userResponse = await axios.get("http://localhost:8000/api/users", {
            //   withCredentials: true,
            //   headers: {
            //     "X-CSRF-TOKEN": csrfToken,
            //   },
            // });

            // const authenticatedUserId = userResponse.data[0].id;
            // console.log("auth user", authenticatedUserId);
            // Préparer les données du Encaissement
            console.log("authId",authId)
            console.log(banques)
            const banques_filtrees = banques.filter((banque)=>banque.mode_de_paiement === formData.type_encaissement);
            console.log("banques  filtrees: ",banques_filtrees)

            // Calculate the total montant from the filtered banques
            const montant_total = banques_filtrees.reduce((total, banque) => {
                const avances = banque.ligne_entrer_compte.map(item => parseFloat(item.avance));
                return total + avances.reduce((sum, avance) => sum + avance, 0);
            }, 0);

            console.log("montant_total: ", montant_total);



            const EncaissementData = {
                referencee: formData.referencee,
                date_encaissement: formData.date_encaissement,
                montant_total: montant_total,
                comptes_id: formData.comptes_id,
                type_encaissement: formData.type_encaissement,

                // user_id: authId,
            };
        console.log('encaissement data : ',EncaissementData)
            let response;
            if (editingEncaissement) {
                // Mettre à jour le Encaissement existant
                response = await axios.put(
                    `http://localhost:8000/api/encaissements/${editingEncaissement.id}`,
                    {
                        referencee: formData.referencee,
                        date_encaissement: formData.date_encaissement,

                        comptes_id: formData.comptes_id,
                        type_encaissement: formData.type_encaissement,

                       // user_id: authId,
                    }
                );
                const existingligneencaissementResponse = await axios.get(
                    `http://localhost:8000/api/ligneencaissement/${editingEncaissement.id}`
                );

                const existingligneencaissement =
                    existingligneencaissementResponse.data.ligneencaissement;
                console.log("existing ligneencaissement", existingligneencaissement);
                const selectedPrdsData = selectedProductsData.map(
                    (selectedProduct, index) => {
                        // const existingligneencaissement = existingligneencaissement.find(
                        //   (ligneencaissement) =>
                        //     ligneencaissement.produit_id === selectedProduct.produit_id
                        // );

                        return {
                            id: selectedProduct.id,
                            id_Encaissement: editingEncaissement.id,

                        };
                    }
                );
                console.log("selectedPrdsData:", selectedPrdsData);
                for (const ligneencaissementData of selectedPrdsData) {
                    // Check if ligneencaissement already exists for this produit_id and update accordingly

                    if (ligneencaissementData.id) {
                        // If exists, update the existing ligneencaissement
                        await axios.put(
                            `http://localhost:8000/api/ligneencaissement/${ligneencaissementData.id}`,
                            ligneencaissementData,
                            {
                                withCredentials: true,
                                headers: {
                                    "X-CSRF-TOKEN": csrfToken,
                                },
                            }
                        );
                    } else {
                        // If doesn't exist, create a new ligneencaissement
                        await axios.post(
                            "http://localhost:8000/api/ligneencaissement",
                            ligneencaissementData,
                            {
                                withCredentials: true,
                                headers: {
                                    "X-CSRF-TOKEN": csrfToken,
                                },
                            }
                        );
                    }
                }





            } else {
                // Créer un nouveau Encaissement
                response = await axios.post(
                    "http://localhost:8000/api/encaissements",
                    EncaissementData
                );
                //console.log(response.data.devi)
                const selectedData = banques_filtrees.map(
                    (item, index) => {
                        return {
                            encaissements_id: response.data.encaissement.id,
                            entrer_comptes_id: item.id,

                        };
                    }
                );
                console.log("selectedData", selectedData);
                for (const ligneencaissementData of selectedData) {
                    // Sinon, il s'agit d'une nouvelle ligne de Encaissement
                    await axios.post(
                        "http://localhost:8000/api/ligneencaissement",
                        ligneencaissementData
                    );
                }

            }
            console.log("response of postEncaissement: ", response.data);

            fetchEncaissements();



            setSelectedProductsData([]);
            //fetchExistingligneencaissement();
            closeForm();

            // Afficher un message de succès à l'utilisateur
            Swal.fire({
                icon: "success",
                title: "Encaissement ajoutée avec succès",
                text: "Encaissement a été ajoutée avec succès.",
            });
        } catch (error) {
            console.error("Erreur lors de la soumission des données :", error);

            // Afficher un message d'erreur à l'utilisateur
            Swal.fire({
                icon: "error",
                title: "Erreur !",
                text: "Erreur !",
            });
        }
        closeForm();
    };
    //------------------------- encaissement FORM---------------------//

    const handleShowFormButtonClick = () => {
        if (formContainerStyle.right === '-500px') {
            setFormContainerStyle({ right: '0' });
            setTableContainerStyle({ marginRight: '500px' });
        } else {
            closeForm();
        }
    };

    const closeForm = () => {
        setFormContainerStyle({ right: '-500px' });
        setTableContainerStyle({ marginRight: '0' });
        setShowForm(false); // Hide the form
        setFormData({ // Clear form data
            referencee: '',
            date_encaissement: '',

            comptes_id: '',
            type_encaissement: '',
        });
        setEditingEncaissement(null); // Clear editing encaissement
    };
    const handleShowLigneEncaissements = async (encaissementId) => {
        setExpandedRows((prevRows) =>
            prevRows.includes(encaissementId)
                ? prevRows.filter((row) => row !== encaissementId)
                : [...prevRows, encaissementId]
        );
    };
    return (
        <ThemeProvider theme={createTheme()}>
            <Box sx={{ position:'absolute',
        top:'-40px',
        left:'220px',
        width:'90%' }}>
                <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 4 }}>
                    <Toolbar />

                    <div>
                        <h3>Liste des Encaissements</h3>
                        <div className=""
                        style={{
                            width:"30%",
                            marginLeft:'1200px',
                            marginTop:'-40px'

                        }}>
                            <Search onSearch={handleSearch} />
                        </div>
                        <Button
                            id="showFormButton"
                            onClick={handleShowFormButtonClick}
                            style={{ backgroundColor: 'white', color: 'black',marginBottom:'20px' }}
                        >
                            <IoIosPersonAdd  style={{ fontSize: '24px' }} />
                        </Button>
                       
                        <div id="formContainer" className="mt-2" style={formContainerStyle}>
                            <Form className="col row" onSubmit={handleSubmit}>
                                <Form.Label className="text-center m-2"><h5>{editingEncaissement ? 'Modifier encaissement' : 'Ajouter un encaissement'}</h5></Form.Label>
                                <Form.Group className="col-sm-5 m-2" controlId="comptes_id">

                                    <Form.Label>Compte</Form.Label>

                                    <Form.Select
                                        name="comptes_id"
                                        value={formData.comptes_id}
                                        onChange={handleChange}
                                        className="form-select form-select-sm"
                                    >
                                        <option value="">Sélectionner un compte</option>
                                        {comptes.map((compte) => (
                                            <option key={compte.id} value={compte.id}>
                                                {compte.designations}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="col-sm-10 m-2">
                                    <Form.Label>Reference</Form.Label>
                                    <Form.Control type="text" placeholder="Reference" name="referencee" value={formData.referencee} onChange={handleChange} />
                                </Form.Group>
                                <Form.Group className="col-sm-5 m-2">
                                    <Form.Label>Date d'encaissement</Form.Label>
                                    <Form.Control type="date" placeholder="Date d'encaissement'" name="date_encaissement" value={formData.date_encaissement} onChange={handleChange} />
                                </Form.Group>
                                {/*<Form.Group className="col-sm-5 m-2">*/}
                                {/*    <Form.Label>Type d'encaissement</Form.Label>*/}
                                {/*    <Form.Control as="select" name="type_encaissement" value={formData.type_encaissement} onChange={handleChange}>*/}
                                {/*        <option value="">Sélectionner un type</option>*/}
                                {/*        <option value="Effet">Effet</option>*/}
                                {/*        <option value="Chéque">Chéque</option>*/}
                                {/*        <option value="Espèce">Espèce</option>*/}
                                {/*    </Form.Control>*/}
                                {/*</Form.Group>*/}
                                <Form.Group className="col-sm-5 m-2" controlId="type_encaissement">

                                    <Form.Label>Type d'encaissement</Form.Label>
                                    <Form.Select
                                        name="type_encaissement"
                                        value={formData.type_encaissement}
                                        onChange={(e) => handlemodepaiementSelection(e.target)}
                                        className="form-select form-select-sm"
                                    >
                                        <option value="">Sélectionner un encaissement</option>
                                        {banques.map((banque) => (
                                            <option key={banque.id} value={banque.mode_de_paiement}>
                                                {banque.mode_de_paiement}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                                <div className="col-md-12">
                                    <Form.Group controlId="selectedFactureTable">
                                        <Form.Label> </Form.Label>
                                        <Table striped bordered hover responsive>
                                            <thead>
                                            <tr>
                                                <th>Client</th>
                                                <th>N° de Facture</th>
                                                <th>Total TTC</th>
                                                <th>Date de Facture</th>
                                                <th>N° de Chéque</th>
                                                <th>Mode de Paiement</th>
                                                <th>date</th>
                                                <th>Avance</th>
                                                <th>Status</th>
                                                <th>Remarque</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {Banque && Banque.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((banque) => {

                                                const ligneEntrerCompte = ligneEntrerComptes.find(ligne => ligne.client_id === banque.client_id);


                                                const facture = factures.find(facture => facture.id === ligneEntrerCompte?.id_facture);

                                                // Afficher les données de Banque et client s'il existe
                                                return (
                                                    <tr key={banque.id}>
                                                        <td>{facture.client.raison_sociale}</td>
                                                        <td>{facture.reference}</td>
                                                        <td>{facture.total_ttc}</td>
                                                        <td>{facture.date}</td>
                                                        <td>{banque.numero_cheque}</td>
                                                        <td>{banque.mode_de_paiement}</td>
                                                        <td>{banque.datee}</td>
                                                        <td>{ligneEntrerCompte ? ligneEntrerCompte.avance : 'N/A'}</td>
                                                        <td>{banque.Status}</td>
                                                        <td>{banque.remarque}</td>
                                                    </tr>
                                                );
                                            })}
                                            </tbody>



                                        </Table>
                                    </Form.Group>
                                </div>
                                <Form.Group className="col m-3 text-center">
                                    <Button type="submit" className="btn btn-danger col-6">
                                        {editingEncaissement ? 'Modifier' : 'Ajouter'}
                                    </Button>
                                    <Button className="btn btn-secondary col-5 offset-1" onClick={closeForm}>Annuler</Button>
                                </Form.Group>
                            </Form>
                        </div>

                        <div id="tableContainer" className="table-responsive-sm" style={tableContainerStyle}>
                            <table className="table table-responsive " id="encaissementTable" style={{
                                marginTop:'-10px'
                            }}>
                                <thead >
                                <tr>
                                    <th></th>
                                    <th style={tableHeaderStyle}>
                                        <input type="checkbox" onChange={handleSelectAllChange} />
                                    </th>
                                    <th style={tableHeaderStyle}>Compte</th>
                                    <th style={tableHeaderStyle}>Reference</th>
                                    <th style={tableHeaderStyle}>Date d'encaissement</th>
                                    {/*<th style={tableHeaderStyle}>Type d'encaissement</th>*/}
                                    <th style={tableHeaderStyle}>Montant Total</th>
                                    <th style={tableHeaderStyle}>Action</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filtredEncaissements && filtredEncaissements.slice (page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((encaissements) => (
                                    <React.Fragment key={encaissements.id}>
                                    <tr key={encaissements.id}>
                                        <td>
                                            <div className="no-print ">
                                                <button
                                                    className="btn btn-sm btn-light"
                                                    onClick={() => handleShowLigneEncaissements(encaissements.id)}
                                                >
                                                    <FontAwesomeIcon
                                                        icon={
                                                            expandedRows.includes(encaissements.id)
                                                                ? faMinus
                                                                : faPlus
                                                        }
                                                    />
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <input type="checkbox" onChange={() => handleCheckboxChange(encaissements.id)} checked={selectedItems.includes(encaissements.id)} />
                                        </td>

                                        <td>
                                            {getCompteById(
                                                encaissements.comptes_id
                                            )}
                                        </td>
                                        <td>{encaissements.referencee}</td>
                                        <td>{encaissements.date_encaissement}</td>
                                        {/*<td>{encaissements.type_encaissement}</td>*/}
                                        <td>{encaissements.montant_total}</td>
                                        <td className="d-inline-flex">
                                            <Button className="btn btn-sm btn-info m-1" onClick={() => handleEdit(encaissements)}>
                                            <FontAwesomeIcon icon={faEdit} />

                                            </Button>
                                            <Button className="btn btn-danger btn-sm m-1" onClick={() => handleDelete(encaissements.id)}>
                                                <FontAwesomeIcon icon={faTrash} />
                                            </Button>
                                            <Button className="btn btn-primary" onClick={() => printEncaissements(encaissements)}>
                                                <FontAwesomeIcon icon={faPrint} />
                                            </Button>
                                        </td>
                                    </tr>
                                        {expandedRows.includes(encaissements.id) && encaissements.ligne_encaissement && (
                                            <tr>
                                                <td colSpan="8">
                                                    <div>
                                                        <table className="table table-responsive table-bordered" >
                                                            <thead>
                                                            <tr>
                                                                <th style={{ backgroundColor: "#adb5bd" }}>Client</th>
                                                                <th style={{ backgroundColor: "#adb5bd" }}>N° de Facture</th>
                                                                <th style={{ backgroundColor: "#adb5bd" }}>Total TTC</th>
                                                                <th style={{ backgroundColor: "#adb5bd" }}>Date de Facture</th>
                                                                <th style={{ backgroundColor: "#adb5bd" }}>N° de Chéque</th>
                                                                <th style={{ backgroundColor: "#adb5bd" }}>Mode de Paiement</th>
                                                                <th style={{ backgroundColor: "#adb5bd" }}>date</th>
                                                                <th style={{ backgroundColor: "#adb5bd" }}>Avance</th>
                                                                <th style={{ backgroundColor: "#adb5bd"}}>Status</th>
                                                                <th style={{ backgroundColor: "#adb5bd" }}>Remarque</th>
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {encaissements.ligne_encaissement.map((ligneEncaissement) =>  {

                                                                const entreCompte = banques.find(entreCompt => entreCompt.id === ligneEncaissement.entrer_comptes_id);
                                                                const ligneEntreeCompte = entreCompte.ligne_entrer_compte.find(ligne => ligne.client_id === entreCompte.client_id )

                                                                const facture = factures.find(facture => facture.id === ligneEntreeCompte?.id_facture);

                                                                // Afficher les données de Banque et client s'il existe
                                                                return (
                                                                    <tr key={entreCompte.id}>
                                                                        <td>{facture.client.raison_sociale}</td>
                                                                        <td>{facture.reference}</td>
                                                                        <td>{facture.total_ttc}</td>
                                                                        <td>{facture.date}</td>
                                                                        <td>{entreCompte.numero_cheque}</td>
                                                                        <td>{entreCompte.mode_de_paiement}</td>
                                                                        <td>{entreCompte.datee}</td>
                                                                        <td>{ligneEntreeCompte ? ligneEntreeCompte.avance : 'N/A'}</td>
                                                                        <td>{entreCompte.Status}</td>
                                                                        <td>{entreCompte.remarque}</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}

                                </tbody>
                            </table>



                            <Button className="btn btn-danger btn-sm" onClick={handleDeleteSelected}>
                                <FontAwesomeIcon icon={faTrash} /></Button>



                            <TablePagination
                                rowsPerPageOptions={[5, 10, 25]}
                                component="div"
                                count={filtredEncaissements.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                            />
                        </div>
                    </div>

                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default EncaissementList;