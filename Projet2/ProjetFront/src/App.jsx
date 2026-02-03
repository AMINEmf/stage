import 'bootstrap/dist/css/bootstrap.min.css';

import './App.css'
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Navigation from './Acceuil/Navigation';

import Dashboard from './Acceuil/Dashboard';
import DepartementManager from './Zakaria/Employe/DepartementManager';
import CNSS from './Zakaria/cnss';
import EmpHistorique from './Zakaria/EmpHistorique.jsx';


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
            <Route path="/cnss" element={<CNSS />} />

            <Route path="/emphistorique" element={<EmpHistorique />} />





       
            <Route path="/societes" element={<Societe/>}/>




          </Routes>
        </HeaderProvider>
      </OpenProvider>
    </AuthProvider>
  );
};

export default App;
