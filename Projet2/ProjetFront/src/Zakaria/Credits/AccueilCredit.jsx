import { useEffect,useState } from "react";
import { useHeader } from "../../Acceuil/HeaderContext";
import { createTheme,ThemeProvider} from "@mui/material/styles";
import { useOpen } from "../../Acceuil/OpenProvider";
import {
    Card,
    CardContent,
    Box,
    Typography,
    Grid,
    TableContainer,
    Table,
    TableHead, 
    TableRow,
    TableCell,
    TableBody,
    Chip,
    MenuItem,
    FormControl,
    TextField
} from "@mui/material"
import { Activity, BarChart3, File, Folder,  Users } from "lucide-react";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";


function AccueilCredit(){
    const {dynamicStyles} = useOpen();
    const {setTitle,clearActions} = useHeader();

    const [credit,setCredit] = useState([]);
    const [pieData,setPieData] = useState([])
    const [dernierCredit,setDernierCredit] = useState([]);

    const [crediEnAttente,setCreditEnAttente] = useState(0);
    const [crediValide,setCreditValide] = useState(0);
    const [crediRefuse,setCreditRefuse] = useState(0);

    const [MonthsSelected,setMonthsSelected] = useState([]);

    const [statutSelected,setStatutSelected] = useState('Validé (R.H)');

    // les 5 mois precedents
    const Months = [
        "janvier","fevrier","mars","avril","mai","juin",
        "juillet","aout","septembre","octobre","novembre","decembre"
    ]
    
    const AddMonths = () => {
        const date = new Date();
        const result = [];
        for (let i = 4; i >= 0; i--) {
            let index = (date.getMonth() - i + 12) % 12;
            result.push(Months[index]);
        }
        setMonthsSelected(result)
    }

    const PieValue = [0,0,0,0,0]
    console.log(MonthsSelected)

    // Recuperer le nombre des demandes des credits
    const MonthsDataValue = credit.reduce(
        (initialstate,data) => {
            if(data.statut_credit === statutSelected){
                const CreditDate = new Date(data.date_credit);
                const CreditMonthName = Months[CreditDate.getMonth()];

                const index = MonthsSelected.indexOf(CreditMonthName);
                if(index !== -1){
                    initialstate[index] += 1;
                }
            }
            
            return initialstate;
        }
    ,PieValue)

    console.log(MonthsDataValue)

    // Recuperer les crédits validé de cette mois 
    const thisMonth = credit.filter(cred => {
        const CurrentDate = new Date();
        const CurrentYear = CurrentDate.getFullYear();
        const CurrentMonth = CurrentDate.getMonth() + 1;

        const date = new Date(cred.date_credit);
        const thisyear = date.getFullYear();
        const thismonth = date.getMonth() + 1;

        return(
            (thisyear === CurrentYear && thismonth === CurrentMonth)
        )
    })

    console.log(thisMonth)

    useEffect(() => {
        const data = thisMonth.reduce(
            (acc,dep) => {
                switch(dep.departement){
                    case 'production':
                        acc[0].value += 1;
                        break;
                    case 'technique':
                        acc[1].value +=1;
                        break;
                    case 'administration':
                        acc[2].value += 1;
                        break;
                    case 'support':
                        acc[3].value +=1;
                        break;
                    case 'commercial':
                        acc[4].value +=1;
                    default:
                        break;
                }
                return acc
            },
            [
                {id:0,value:0,label:'production'},
                {id:1,value:0,label:'technique'},
                {id:2,value:0,label:'administration'},
                {id:3,value:0,label:'support'},
                {id:4,value:0,label:'commercial'}
            ]
        )
        setPieData(data)
    },[thisMonth])
    console.log(pieData);

    useEffect(() => {
        AddMonths()
    },[])

    // Recuperer les crédit validé de 5 mois precedent
    console.log(credit)
    const filteredCredits = credit.filter(cred => {
        const date = new Date(cred.date_credit)
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        return(
            (year === 2026 && cred.statut_credit === "Validé (R.H)" && [1,2,3].includes(month)) ||
            (year === 2025 && cred.statut_credit === "Validé (R.H)" && [11,12].includes(month))
        );
    })
    
    console.log(filteredCredits)


    useEffect(() => {
        const cred = localStorage.getItem('employesCreditBackup');
        setCredit(JSON.parse(cred))
    },[])

    // les 5 dernier crédits
    useEffect(() => {
        const cred = credit.slice(-5);
        setDernierCredit(cred)
    },[credit])


    useEffect(() => {
        const count = credit.reduce(
        (acc,credit) => {
            switch(credit.statut_credit){
                case "Validé (R.H)":
                    acc.valide += 1;
                    break;
                case "en_attente":
                    acc.attente += 1;
                    break;
                case "Refusé":
                    acc.refuse += 1;
                    break;
            }
            return acc;
        },
        {valide:0,attente:0,refuse:0}
    )
    setCreditEnAttente(count.valide)
    setCreditValide(count.attente)
    setCreditRefuse(count.refuse)
    },[credit])

    console.log("les demande accepte :",crediValide)

    const colors = {
        primary: '#2c767c',
        primaryLight: '#4db6ac',
        primaryDark: '#004d40',
        secondary: '#26a69a',
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336',
        info: '#2196f3',
        purple: '#9c27b0',
        pink: '#e91e63',
        textPrimary: '#1e293b',
        textSecondary: '#64748b',
        hoverBg: '#f8fafc',
        progressBg: '#e2e8f0',
        cardBg: '#ffffff',
    };

    useEffect(() => {
        setTitle("Tableau de bord crédit")
        return () => {
            clearActions()
        }
    },[setTitle,clearActions])

    const StatCard = ({ title, value, icon: Icon,bgGradient}) => (
        <Card sx={{ 
          background: bgGradient,
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          position: 'relative',
          cursor:'pointer',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': { 
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)' 
          }
        }}>
          <CardContent sx={{ p: 3,position:'relative',zIndex:1}}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Box>
                <Typography sx={{ 
                  color: 'rgba(255,255,255,0.85)', 
                  mb: 1,
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  textTransform:'uppercase',
                  letterSpacing:'0.5px'
                }}>
                  {title}
                </Typography>
                
                <Typography sx={{ 
                    fontWeight: 700, 
                    color: '#fff',
                    fontSize: '2.5rem',
                    lineHeight: 1.1,
                    mb:0.5
                }}>
                    {value}
                </Typography>
                
              </Box>
              <Box sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '16px',
                p: 2,
                backdropFilter:'blur(10px)'
              }}>
                <Icon sx={{ fontSize: 32, color: '#fff' }} />
              </Box>
            </Box>
          </CardContent>

          <Box sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }} />
            <Box sx={{
                position: 'absolute',
                bottom: -30,
                right: 30,
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
            }} />
        </Card>
      );

    const StatusLabel = (statut) => {
        switch(statut?.toLowerCase()){
            case 'en_attente': return 'En Attente';
            case 'Validé (R.H)': return 'Validé(R.H)';
            case 'Refusé': return 'Refusé';
            default: return statut;
        }
        
    };

    return(
        <ThemeProvider theme={createTheme()}>
            <Box sx={{...dynamicStyles,backgroundColor: '#ffffff', minHeight: '100vh'}}>
                <Box component="main" sx={{
                    flexGrow:1,
                    p: {xs:2, sm: 3,md: 4},
                    mt: 10,
                    overflowY:'auto',
                    maxHeight: 'calc(100vh - 64px)'
                }}>
                    <Box sx={{mb:4}}>
                        <Typography sx={{
                            fontWeight: 800,
                            color: colors.textPrimary,
                            fontSize: '1.75rem',
                            mb: 0.5
                        }}>
                            Tableau de bord Credits
                        </Typography>
                        <Typography sx={{
                            color: colors.textSecondary,
                            fontSize: '0.95rem',
                        }}>
                            Vue d'ensemble des crédits
                        </Typography>
                    </Box>

                    <Grid container spacing={3} sx={{ mb: 4}}>
                        <Grid item xs={12} sm={6} lg={3}>
                            <StatCard
                                title="Demande Total"
                                value={credit.length}
                                subtitle="Employés"
                                icon={Folder}
                                bgGradient="linear-gradient(135deg, #2c767c 0%, #4db6ac 100%)"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <StatCard
                                title="Demande En Attente"
                                value={crediEnAttente}
                                subtitle="Employés"
                                icon={File}
                                bgGradient="linear-gradient(135deg, #26a69a 0%, #00897b 100%)"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <StatCard
                                title="Demande Accepté (R.H)"
                                value={crediValide}
                                subtitle="Employés"
                                icon={File}
                                bgGradient="linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <StatCard
                                title="Demande Refusé"
                                value={crediRefuse}
                                subtitle="Employés"
                                icon={File}
                                bgGradient="linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)"
                            />
                        </Grid>
                    </Grid>

                    <Grid container spacing={3} sx={{mb:4}}>
                        <Grid item xs={12} lg={8}>
                            <Card sx={{
                                borderRadius:'20px',
                                boxShadow:'0 4px 24px rgba(0,0,0,0.06)',
                                border: '1px solid rgba(0,0,0,0.05)',
                                height:'100%'
                            }}>
                                <CardContent sx={{p:3}}>
                                    <Box sx={{display:'flex',alignItems:'center',justifyContent:"space-between",mb:3}}>
                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                            <Box sx={{
                                                backgroundColor:`${colors.primary}15`,
                                                borderRadius:'12px',
                                                p: 1.5,
                                                mr:2,
                                            }}>
                                                <BarChart3 size={24} color={colors.primary}/>
                                            </Box>
                                            
                                            <Typography sx={{
                                                fontWeight:700,
                                                color:colors.textPrimary,
                                                fontSize:'1.1rem'
                                            }}>
                                                Statistiques des demandes
                                            </Typography>
                                        </Box>
                                        <TextField
                                            select
                                            size="small"
                                            onChange={(e) => setStatutSelected(e.target.value)}
                                            defaultValue="Validé (R.H)"
                                        >
                                            <MenuItem value="Validé (R.H)">Validé (R.H)</MenuItem>
                                            <MenuItem value="Refusé">Refusé</MenuItem>
                                        </TextField>
                                    </Box>

                                    <Box sx={{height:400,width:'100%'}}>
                                        <BarChart 
                                            xAxis={[
                                                {
                                                    scaleType: 'band',
                                                    data: MonthsSelected
                                                }
                                            ]}
                                            series={[
                                                {
                                                    data:MonthsDataValue
                                                }
                                            ]}
                                            width={1000}
                                            height={400}
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} lg={4}>
                            <Card sx={{
                                borderRadius:'20px',
                                boxShadow:'0 4px 24px rgba(0,0,0,0.06)',
                                border:'1px solid rgba(0,0,0,0.05)',
                                height:'100%'
                            }}>
                                <CardContent sx={{p:3}}>
                                    <Box sx={{display:'flex',alignItems:'center',mb:3}}>
                                        <Box sx={{
                                            backgroundColor: `${colors.info}15`,
                                            borderRadius: '12px',
                                            p: 1.5,
                                            mr:2
                                        }}>
                                            <Activity size={24} color={colors.info }/>
                                        </Box>
                                        <Box>
                                            <Typography sx={{
                                                fontWeight:700,
                                                color: colors.textPrimary,
                                                fontSize: '1.1rem'
                                            }}>
                                                Statistiques des commandes (Département)
                                            </Typography>
                                            <Typography sx={{
                                                color:colors.textSecondary,
                                                fontSize:'0.8rem'
                                            }}>
                                                Ce mois-ci
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{height:500,display:'flex',justifyContent:'center'}}>
                                        <PieChart 
                                            series={[
                                                {
                                                    data:pieData,
                                                    arcLabel: (item) => item.value,
                                                    arcLabelRadius: 130
                                                }
                                            ]}

                                            slotProps={{
                                                legend:{
                                                    position: { vertical: 'middle', horizontal: 'right' },
                                                }
                                            }}

                                        

                                            width={700}
                                            height={450}
                                        />
                                    </Box>
                                    
                                </CardContent>
                            </Card>
                        </Grid>

                    </Grid>
                    
                    {/* Tableaux */}
                    <Grid container spacing={3} sx={{mb:4}}>
                        {/* Dernieres demandes */}
                        <Grid item xs={12} lg={12}>
                            <Card sx={{
                                borderRadius:'20px',
                                boxShadow:'0 4px 24px rgba(0,0,0,0.06)',
                                border:'0 4px 24px rgba(0,0,0,0.05)',
                                height:'100%'
                            }}>
                                <CardContent sx={{p:3}}>
                                    <Box sx={{display:'flex',alignItems:'center',mb:3}}>
                                        <Box sx={{
                                            backgroundColor:`${colors.primary}15`,
                                            borderRadius:'12px',
                                            p:1.5,
                                            mr:2,
                                        }}>
                                            <Users size={24} color={colors.primary}/>
                                        </Box>
                                        <Typography sx={{
                                            fontWeight: 700,
                                            color: colors.textPrimary,
                                            fontSize: '1.1rem'
                                        }}>
                                            Dernières Demandes
                                        </Typography>
                                    </Box>
                                

                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, color: colors.textSecondary, border: 'none', pb: 2, fontSize: '0.8rem' }}>
                                                        Employé
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: colors.textSecondary, border: 'none', pb: 2, fontSize: '0.8rem' }}>
                                                        Type de crédit
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: colors.textSecondary, border: 'none', pb: 2, fontSize: '0.8rem' }}>
                                                        Statut
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>

                                            <TableBody>
                                                {dernierCredit && dernierCredit.map(credit => {
                                                    return (<TableRow 
                                                        key={credit.id}
                                                        sx={{
                                                            '&:hover':{backgroundColor: colors.hoverBg},
                                                            '& td': {border: 'none', py:1.5}
                                                        }}
                                                    >
                                                        <TableCell>
                                                            <Typography sx={{ color: colors.textPrimary, fontWeight: 600, fontSize: '0.875rem' }}>
                                                                {credit.employe}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography sx={{ color: colors.textPrimary, fontWeight: 600, fontSize: '0.875rem' }}>
                                                                {credit.type_credit}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip 
                                                                label={StatusLabel(credit.statut_credit)}
                                                                size="small"
                                                                sx={{
                                                                    backgroundColor: (credit.statut_credit === "Validé (R.H)") ? `${colors.success}20` : ((credit.statut_credit === "en_attente") ? `${colors.warning}20` : `${colors.error}20`),
                                                                    color: (credit.statut_credit === "Validé (R.H)") ? colors.success : ((credit.statut_credit === "en_attente") ? colors.warning : colors.error),
                                                                    fontWeight: 600,
                                                                    fontSize: '0.7rem',
                                                                    borderRadius:'6px',
                                                                    height:24
                                                                }}
                                                            />
                                                        </TableCell>
                                                    </TableRow>)
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </ThemeProvider>
    )
}
export default AccueilCredit