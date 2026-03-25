import 'bootstrap/dist/css/bootstrap.min.css';

import './App.css'
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Navigation from './Acceuil/Navigation';

import Dashboard from './Acceuil/Dashboard';
import DepartementManager from './Zakaria/Employe/DepartementManager';
import DepartementManager2 from './Zakaria/Employe/DepartementManager2';
import CimrManager from './Zakaria/CimrAffiliation/CimrManager';
import CimrDashboard from './Zakaria/CimrAffiliation/CimrDashboard';
import CimrDeclarationManager from './Zakaria/CimrDeclaration/CimrDeclarationManager';


import EmpHistorique from './Zakaria/EmpHistorique.jsx';

import AccueilCredit from './Zakaria/Credits/AccueilCredit.jsx';
import CreditManager from './Zakaria/Credits/CreditManager.jsx';
import CreditHistorique from './Zakaria/CreditsHistorique/CreditHistorique.jsx';
import DashboaredFinance from './Zakaria/Finance/FinanceDashboared.jsx';
import FinanceManager from './Zakaria/Finance/FinanceManager.jsx';


import { OpenProvider } from './Acceuil/OpenProvider.jsx';





// HeaderProvider import for global header state
import { HeaderProvider } from './Acceuil/HeaderContext';
import Societe from './Zakaria/Societe/Societe.jsx';
import Login from './Login/Login.jsx';

const App = () => {
  const location = useLocation();
  const showNavigation = location.pathname !== '/login';
  return (
    <AuthProvider>
      <OpenProvider>
        <HeaderProvider>
          {showNavigation && <Navigation />}
          <Routes>
            <Route path="/" element={<Dashboard />} />

            <Route path="/login" element={<Login />} />

            <Route path="/employes" element={<DepartementManager />} />

            <Route path="/employes2" element={<DepartementManager2 />} />

            <Route path='/credit-dashboared' element={<AccueilCredit />}/>
            <Route path='/credit-verification' element={<CreditManager />}/>
            <Route path='/credit-historique' element={<CreditHistorique />}/> 

            <Route path="/cimr-dashboard" element={<CimrDashboard />} />
            <Route path="/cimr-affiliations" element={<CimrManager />} />
            <Route path="/cimr-declarations" element={<CimrDeclarationManager />} />

            <Route path='/finance-dashboared' element={<DashboaredFinance />}/>
            <Route path='/finance-validation' element={<FinanceManager />}/>

            <Route path="/emphistorique" element={<EmpHistorique />} />






            <Route path="/societes" element={<Societe />} />




          </Routes>
        </HeaderProvider>
      </OpenProvider>
    </AuthProvider>
  );
};

export default App;
