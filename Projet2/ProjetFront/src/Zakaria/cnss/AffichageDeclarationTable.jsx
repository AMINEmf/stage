import { ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/system";
import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import "./DeclarationTable.css";
import { Activity,X,Calendar,Users } from "lucide-react";

function DeclarationTable({primary}) {
    const [charged,setCharged] = useState(false);
    const [matricule,setMatricule] = useState('');
    const [data,setData] = useState(null);
    const [error,setError] = useState(null);

    const Months = [
        "Janvier",
        "Février",
        "Mars",
        "Avril",
        "Mai",
        "Juin",
        "Juillet",
        "Août",
        "Septembre",
        "Octobre",
        "Novembre",
        "Décembre"
    ]

    useEffect(() => {
        if (!matricule) return;
        
        const RecupererData = async () => {
            try{
                const request = await axios.get(`http://localhost:8000/api/employe/${matricule}`);
                setData(request.data);
            }
            catch(error){
                setError('Erreur lors de la récupération des données de l\'employé');
            }
        }

        RecupererData();
    },[matricule])

    return(
        <ThemeProvider theme={createTheme()}>
            <Box sx={{display:'flex',width:'1400px',height:'800px'}}>
                <Box sx={{display:'flex',height:'80px',width:'100%'}}>
                    <div style={{display:'flex',gap:'780px',alignItems:'center'}}>
                    <p>{primary}</p>
                        <button style={{width:'180px',height:'50px',borderRadius:'4px',alignSelf:'center',justifySelf:'end',backgroundColor:'#3a8a90',color:'white',overflow:'none',border:'none',textAlign:'center'}} onClick={() => setCharged(true)}>
                            Ajouter une déclaration
                        </button>
                    </div>

                    {/* lancement de formulaire */}
                    {charged && (
                        <Box className="form-container">
                            <Box className="form-header">
                                <Activity size={20} style={{color: "#00afaa"}}/>
                                <p style={{color: "#00afaa"}}>Formulaire d'ajout de déclaration</p>
                                <X size={24} onClick={() => setCharged(false)} style={{cursor:'pointer'}}/>
                            </Box>
                            <hr />
                            <Box className="form-general-info" style={{display:'flex',gap:'8px'}}>
                                <Calendar size={20} style={{color: "#00afaa"}}/>
                                <p style={{color: "#00afaa"}}>Informations générales</p>
                            </Box>
                            <Box className="form-body">
                                <Box className="form-matricule">
                                    <label htmlFor="matricule">Matricule</label>
                                    <input id="matricule" type="text" onChange={(e) => setMatricule(e.target.value)}/>
                                </Box>
                                <Box className="form-nom">
                                    <label htmlFor="Nom">Nom</label>
                                    <input id="Nom" value={data?.nom} type="text" disabled/>
                                </Box>
                                <Box className="form-cin">
                                    <label htmlFor="CIN">CIN</label>
                                    <input id="CIN" value={data?.cin} type="text" disabled/>
                                </Box>
                                <Box className="form-departement">
                                    <label htmlFor="departement">Département</label>
                                    <input id="departement" value={data?.departements?.map(dep => dep.nom).join(", ")} type="text" disabled/>
                                </Box>
                                <Box className="form-mois">
                                    <label htmlFor="Month">Mois</label>
                                    <select id="Month">
                                        {Months.map((month,index) => (
                                            <option key={index} value={month}>{month}</option>
                                        ))}
                                    </select>
                                </Box>
                            </Box>
                            <Box className="form-Users">
                                <div class="form-Users-header" style={{display:'flex',gap:'8px'}}>
                                    <Users size={22} style={{ color: "#00afaa" }} />
                                    <p style={{ color: "#00afaa" }}>Employés & Cotisations</p>
                                </div>
                                <Box>
                                    <Box className="form-Users-salaireCNSS">
                                        <label>Salaire CNSS</label>
                                        <input type="text" value={data?.salaire_base}/>
                                    </Box>
                                    <Box className="form-Users-salaireBRUT">
                                        <label>Salaire BRUT</label>
                                        <input type="text" />
                                    </Box>
                                </Box>
                            </Box>

                        </Box>
                    )}
                </Box>
                
            </Box>
        </ThemeProvider>
    )
}
export default DeclarationTable;