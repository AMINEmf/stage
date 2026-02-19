import {useHeader} from "../../Acceuil/HeaderContext"
import { useEffect } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useOpen } from "../../Acceuil/OpenProvider";
import { Box } from "@mui/material";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { IoFolderOpenOutline } from "react-icons/io5";
import "./AffichageDeclaration.css";
import axios from "axios";
import DeclarationTable from "./AffichageDeclarationTable";

function AffichageDeclaration(){
    const [mois,setMois] = useState("");
    const [declarations, setDeclarations] = useState([]);
    const [departements,setDepartements] = useState([]);
    const [Newdepartement,setNewDepartement] = useState(0);
    const [departementSelected,setDepartementSelected] = useState(null);
    const [employes,setEmployes] = useState([]);
    const [loading,setLoading] = useState(false);
    const [loadingDepartementSelected,setLoadingDepartementSelected] = useState(false);
    const [error,setError] = useState(null);
    const { setTitle, clearActions } = useHeader();
    const location = useLocation();
    const {primary} = location.state || {};

    useEffect(() => {
        console.log("Primary value from location state:", primary);
    },[])

    useEffect(() => {
        setTitle("Affichage des déclarations");
        return () => {
            clearActions();
        };
    }, [setTitle, clearActions]);
    
    useEffect(() => {
        setLoading(true);
        const RecupererDepartements = async () => {
            try{
                const request = await axios.get("http://localhost:8000/api/Departement");
                setDepartements(request?.data);
            }
            catch(error){
                setError("Erreur lors de la récupération des départements");
            }
        };
        RecupererDepartements();
    },[])


    useEffect(() => {
        const RecupererEmployees = async () => {
            try{
                const res = await axios.get(`http://localhost:8000/api/Departement/${departementSelected}/employes`);
                setEmployes(res.data);
            }catch(error){
                setError("Erreur lors de la récupération des employés du département sélectionné");
            }
        }

        RecupererEmployees();
    },[departementSelected])


    useEffect(() => {
        if (!departementSelected || !mois) return;
        const fetchData = async () => {
            try {
                const res = await axios.get(
                    "http://localhost:8000/api/declarations",
                    {
                        params: {
                            departement_id: departementSelected,
                            mois: mois
                        }
                    }
                );
                setDeclarations(res.data);
            } catch (error) {
                setError("Erreur lors de récupération des déclarations");
            }
        };
        fetchData();
    }, [departementSelected, mois]);


    const { dynamicStyles } = useOpen();

    return(
        <ThemeProvider theme={createTheme()}>
            <Box sx={{ ...dynamicStyles }}>
                <Box
                    sx={{
                    display: "flex",       
                    mt: 12,
                    width: "100%",
                    gap: 4,                
                    alignItems: "flex-start"
                    }}
                >

                    {/* ===== Colonne gauche: liste des départements ===== */}
                    <Box sx={{ 
                        width: "300px",
                        height: "810px",
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: 1,
                        backgroundColor: "white",
                        overflowY: "auto",
                    }}>
                    <ul className="departement_list" style={{flexGrow:1}}>
                        <li style={{ listStyleType: "none" }}>
                        <div
                            className="checkbox-container"
                            style={{
                            marginTop: "5%",
                            width: "90%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginLeft: "5%"
                            }}
                        >
                            <input type="checkbox" id="include-sub-deps" />
                            <label htmlFor="include-sub-deps">Inclure les sous-départements</label>
                        </div>
                        </li>
                        <div className="separator" style={{ marginTop: "-1%" }}></div>
                        {departements.map((departement) => (
                        <li key={departement.id} style={{ listStyleType: "none" }}>
                            <button
                            style={{ 
                                background:'transparent',
                                border:'none',
                                fontSize: "1rem",
                                fontFamily:"inherit",
                                fontWeight: "500",
                                marginBottom: "8px",
                                padding: "10px",
                                width: "100%",
                                alignItems: "center",
                                display: "flex",
                                color: "#2c767c",
                                lineHeight: "1.5",
                                textOverflow: "ellipsis",
                            }}
                            onClick={() => setDepartementSelected(departement.id)}
                            >
                            <IoFolderOpenOutline size={18} style={{marginRight:"8px"}}/>
                            {departement.nom}
                            </button>
                        </li>
                        ))}
                    </ul>
                    </Box>

                    {/* ===== Colonne centre: affichage département sélectionné ===== */}
                    {departementSelected !== null && (
                    <Box
                        sx={{
                        width: "300px",
                        p: 2,
                        border: '1px solid white',
                        borderRadius: 4,
                        boxShadow:"0 4px 12px rgba(0, 0, 0, 0.08)",
                        backgroundColor: "white",
                        height: "800px"
                        }}

                        className="departement_details"
                    >
                        <input type="text" className="SearchInput" placeholder="Saisi un mois" onChange={(e) => setMois(e.target.value)}/>
                        <p className="Notification-utilisateur">Veuillez saisir le mois pour consulter les données des employés.</p>
                    </Box>
                    )}


                    {/* ============================ Colonne droite: affichage des déclarations ==============*/}

                    {declarations.length === 0 && (
                        <DeclarationTable primary={primary} />
                    )}


                    {declarations.length > 0 && (
                        <table style={{border: '1px solid #ddd', borderRadius: '4px', width: '100%', backgroundColor:'white', boxShadow:"0 4px 12px rgba(0, 0, 0, 0.08)"}}>
                            <thead>
                                <tr>
                                    <th>Matricule</th>
                                    <th>Nom</th>
                                    <th>Prénom</th>
                                    <th>Département</th>
                                    <th>Salaire Brut</th>
                                    <th>Jours Travaillés</th>
                                </tr>
                            </thead>
                            <tbody>
                                {declarations.map(dec => (
                                    <tr key={dec.id}>
                                        <td>{dec.employe.matricule}</td>
                                        <td>{dec.employe.nom}</td>
                                        <td>{dec.employe.prenom}</td>
                                        <td>
                                            {dec.employe.departements.map(dep => dep.nom).join(", ")}
                                        </td>
                                        <td>{dec.salaire_brut} DH</td>
                                        <td>{dec.jours_travailles}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Box>
            </Box>  

        </ThemeProvider>
        
    );
}
export default AffichageDeclaration;