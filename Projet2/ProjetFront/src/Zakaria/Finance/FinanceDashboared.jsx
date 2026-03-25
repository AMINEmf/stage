import { useEffect, useState } from "react";
import { useHeader } from "../../Acceuil/HeaderContext";
import { createTheme,ThemeProvider } from "@mui/material/styles";
import { useOpen } from "../../Acceuil/OpenProvider";
import { Box, Typography,Grid,Card,CardContent, TextField, MenuItem } from "@mui/material";
import { BarChart3, ChartPie, ChartScatter, ChartSpline, DollarSignIcon, File, Folder, } from "lucide-react";
import { LineChart } from "@mui/x-charts/LineChart";
import { Radar,RadarChart,PolarGrid,PolarAngleAxis,PolarRadiusAxis } from "recharts";
import axios from "axios";
import { PieChart } from "@mui/x-charts/PieChart";

const Months = [
        "janvier","fevrier","mars","avril","mai","juin",
        "juillet","aout","septembre","octobre","novembre","decembre"
    ]

function DashboaredFinance(){
    const [Credits,setCredits] = useState([]);
    const [Budget,setBudget] = useState([]);

    // Credit Validé Financement && Credit En attente de validation (Validé par R.H)
    const [CreditValide,setCreditValide] = useState(0);
    const [CreditAttente,setCreditAttente] = useState(0);

    // des états qui contient les 5 mois precedent
    const [MonthSelected,setMonthSelected] = useState([]);
    const [thisMonth,setThisMonth] = useState('');
    const [dataMonth,setDataMonth] = useState([]);
    const [valuesLineChart,setValuesLineChart] = useState('')

    console.log(thisMonth)
    console.log(MonthSelected)

    // Données pour le chart de pieData
    const [pieData,setPieData] = useState([]);

    const [departements,setDepartements] = useState([])
    const [departementsNames,setDepartementsNames] = useState([]);

    useEffect(() => {
        const cred = localStorage.getItem('employesCreditBackup');
        setCredits(JSON.parse(cred))
    },[])

    const PieD = [
        {id:1,value:0,label:"Avance de salaire"},
        {id:2,value:0,label:"Prêt personnel"},
        {id:3,value:0,label:"Prêt immobilier"},
        {id:4,value:0,label:"Crédit voiture"}
    ]

    const Data = Credits.reduce((initialState,credit) => {
        switch(credit.type_credit){
            case 'Avance de salaire':
                initialState[0].value += 1;
                break;
            case 'Prêt personnel':
                initialState[1].value += 1;
                break;
            case 'Prêt immobilier':
                initialState[2].value += 1;
                break;
            case 'Crédit voiture':
                initialState[3].value += 1;
                break;
            default:
                break;
        }
        return initialState;
    },PieD)

    console.log(Data)
    

    const filtered = () => {
        const names = departements.map(dep => dep.nom);
        setDepartementsNames(names)
    }

    const Departements = () => {
        const dep = localStorage.getItem('departmentHierarchy');
        setDepartements(JSON.parse(dep))
    }

    const {setTitle,clearActions} = useHeader();
    const {dynamicStyles} = useOpen()

    useEffect(() => {
        setTitle("Tableau de bord Finance")
        return () => {
            clearActions();
        }
    },[setTitle,clearActions]);

    const FiveMonths = () => {
        const date = new Date();
        const result = [];
        for (let i = 4; i >= 0; i--) {
            let index = (date.getMonth() - i + 12) % 12;
            const month = {id:index,month:Months[index]};
            result.push(month);
        }
        setMonthSelected(result)
    }

    const data = [
        { departement: "production", value: 0 },
        { departement: "technique", value: 0 },
        { departement: "administration", value: 0 },
        { departement: "support", value: 0 },
        { departement: "commercial", value: 0 }
    ];

    const MensualiteDepartement = () => {
        const result = data.map(d => ({...d}));

        const credit = Credits.filter(cr => cr.mensualite_credit !== null)
        
        credit.forEach(cre => {
            if(cre.departement === 'production'){
                result[0].value += cre.mensualite_credit;
            }
            if(cre.departement === 'technique'){
                result[1].value += cre.mensualite_credit;
            }
            if(cre.departement === 'administration'){
                result[2].value += cre.mensualite_credit;
            }
            if(cre.departement === 'support'){
                result[3].value += cre.mensualite_credit;
            }
            if(cre.departement === 'commercial'){
                result[4].value += cre.mensualite_credit;
            }
        })
        return result;
    }
    const MensualiteData = MensualiteDepartement()

    console.log(MensualiteDepartement())

    
    useEffect(() => {
        const budget = axios.get('http://127.0.0.1:8000/api/budget');
        budget.then(res => {
            setBudget(res.data)
        })
    },[])

    
    useEffect(() => {
        const CurrentYear = new Date().getFullYear();
        const data = Credits.filter(credit => {
            const date = new Date(credit.date_credit);
            const isMonth = MonthSelected.some(month => month.id === date.getMonth())
            return (
                CurrentYear === date.getFullYear() && isMonth
            )
        })
        setDataMonth(data)
    },[MonthSelected,Credits])

    console.log(dataMonth)

    useEffect(() => {
        const counts = MonthSelected.map(m => {
            return dataMonth.filter(credit => {
                const month = new Date(credit.date_credit).getMonth();
                return month === Number(m.id);
            }).length;
        });

        setValuesLineChart(counts);
        
    },[dataMonth,MonthSelected])

    useEffect(() => {
        const data = Credits.reduce(
            (count,credit) => {
                switch(credit.statut_credit){
                    case 'Validé (Finance)':
                        count.valid +=1;
                        break;
                    case 'Validé (R.H)':
                        count.attente += 1;
                        break;
                    default:
                        break;
                }
                return count
            },{valid:0,attente:0}
        )
        setCreditValide(data.valid);
        setCreditAttente(data.attente)
    },[Credits])

    

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
        FiveMonths();
        filtered();
        Departements();
        MensualiteDepartement();
    },[])

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
                <Icon sx={{ fontSize: 32, color: colors.cardBg }} />
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

    return(
    <ThemeProvider theme={createTheme()}>
        <Box sx={{...dynamicStyles,backgroundColor:'#fff',minHeight:'100vh'}}>
            <Box component="main" sx={{
                flexGrow:1,
                p: {xs:2,sm:3,md:4},
                mt: 10,
                overflowY:'auto',
                maxHeight:'calc(100vh - 64px)'
            }}>
                <Box sx={{mb:4}}>
                    <Typography sx={{
                        fontWeight:800,
                        fontSize:'1.5rem',
                        mb:0.5
                    }}>
                        Tableau de bord Finance
                    </Typography>
                </Box>

                <Grid container spacing={3} sx={{mb:4}}>
                    <Grid item xs={12} sm={6} lg={3}>
                        <StatCard
                            title="Budget Total"
                            value={Budget?.[0]?.budget_creditInterne || 0}
                            subtitle="Employés"
                            icon={DollarSignIcon}
                            bgGradient="linear-gradient(135deg, #2c767c 0%, #4db6ac 100%)"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} lg={3}>
                        <StatCard
                            title="Demande Validé (Financement)"
                            value={CreditValide}
                            subtitle="Employés"
                            icon={File}
                            bgGradient="linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} lg={3}>
                        <StatCard
                            title="Demande En Attente (Validé (R.H))"
                            value={CreditAttente}
                            subtitle="Employés"
                            icon={File}
                            bgGradient="linear-gradient(135deg, #26a69a 0%, #00897b 100%)"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} lg={3}>
                        <StatCard
                            title="Montant disponible"
                            value={Budget?.[0]?.montant_disponible}
                            subtitle="Employés"
                            icon={File}
                            bgGradient="linear-gradient(135deg, #66bb6a 0%, #f4f475 100%)"
                        />
                    </Grid>
                </Grid>

                <Grid container spacing={3} sx={{mb:4}}>
                    <Grid item xs={12} lg={8}>
                        <Card sx={{
                            borderRadius:'20px',
                            boxShadow:'0 4px 24px rgba(0,0,0,0.06)',
                            border:'0 4px 24px rgba(0,0,0,0.05)',
                            height:'100%'
                        }}>
                            <CardContent sx={{p:3}}>
                                <Box sx={{display:'flex',alignItems:'center',justifyContent:'space-between',mb:3}}>
                                    <Box sx={{display:'flex',alignItems:'center'}}>
                                        <Box sx={{
                                            backgroundColor: `${colors.primary}15`,
                                            borderRadius:'12px',
                                            p:1.5,
                                            mr:2
                                        }}>
                                            <ChartSpline size={24} color={colors.primary}/>
                                        </Box>

                                        <Typography sx={{
                                            fontWeight:700,
                                            color:colors.textPrimary,
                                            fontSize:'1.1rem'
                                        }}>
                                            Statistiques des crédits accordés
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{height:600,width:'100%'}}>
                                    {MonthSelected.length > 0 && (
                                        <LineChart 
                                            xAxis={[
                                                { 
                                                    scaleType:'point',
                                                    data: MonthSelected.map(m => m.month) 
                                                }
                                            ]}
                                            series={[
                                                {   
                                                    data:valuesLineChart, 
                                                    label:'Crédits' 
                                                }
                                            ]}
                                            height={600}
                                            width={1050}
                                        />
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} lg={4}>
                        <Card sx={{
                            borderRadius:'20px',
                            boxShadow:'0 4px 24px rgba(0,0,0,0.06)',
                            border:'1px solid rgba(0,0,0,0.05)',
                            height:'49%'
                        }}>
                            <CardContent sx={{p:3}}>
                                <Box sx={{display:'flex',alignItems:'center',justifyContent:'space-between',mb:3}}>
                                    <Box sx={{display:'flex',alignItems:'center'}}>
                                        <Box sx={{
                                            backgroundColor: `${colors.primary}15`,
                                            borderRadius:'12px',
                                            p:1.5,
                                            mr:2
                                        }}>
                                            <ChartScatter size={24} color={colors.primary}/>
                                        </Box>

                                        <Typography sx={{
                                            fontWeight:700,
                                            color:colors.textPrimary,
                                            fontSize:'1.1rem'
                                        }}>
                                            Statistiques des menusalités
                                        </Typography>
                                    </Box>

                                    
                                </Box>

                                <Box sx={{height:'100%',width:'100%'}}>
                                    <RadarChart width={500} height={250} data={MensualiteData}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="departement" />
                                        <PolarRadiusAxis />
                                        <Radar 
                                            dataKey="value"
                                            stroke="#8884d8"
                                            fill="#8884d8"
                                            fillOpacity={0.6} />
                                    </RadarChart>
                                </Box>
                            </CardContent>

                            
                        </Card>

                        <Card sx={{
                            borderRadius:'20px',
                            boxShadow:'0 4px 24px rgba(0,0,0,0.06)',
                            border:'1px solid rgba(0,0,0,0.05)',
                            height:'49%',
                            mt:1
                        }}>
                            <CardContent sx={{p:3}}>
                                <Box sx={{display:'flex',alignItems:'center',mb:3}}>
                                    <Box sx={{
                                        backgroundColor:`${colors.primary}15`,
                                        borderRadius:'12px',
                                        p:1.5,
                                        mr:2
                                    }}>
                                        <ChartPie size={24} color={colors.primary}/>
                                    </Box>
                                    <Typography sx={{
                                        fontWeight:700,
                                        fontSize:'1.1rem'
                                    }}>
                                        Statistiques des crédits par type
                                    </Typography>
                                </Box>
                                
                                <Box sx={{height:450,display:'flex',justifyContent:'center'}}>
                                        <PieChart 
                                            series={[
                                                {
                                                    data:Data,
                                                    arcLabel: (item) => item.value,
                                                    arcLabelRadius: 130,
                                                }
                                            ]}

                                            slotProps={{
                                                legend:{
                                                    position: { vertical: 'middle', horizontal: 'right' },
                                                }
                                            }}

                                        

                                            width={700}
                                            height={400}
                                        />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    </ThemeProvider>
    )
}
export default DashboaredFinance;