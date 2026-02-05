
import React from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  Trello, 
  BarChart3, 
  Settings, 
  Bell, 
  Search,
  Users2,
  Wallet,
  Compass,
  Target,
  Loader2,
  Building2
} from 'lucide-react';
import Dashboard from './views/Dashboard';
import ClientsView from './views/ClientsView';
import PipelineView from './views/PipelineView';
import EmployeesView from './views/EmployeesView';
import PaymentsView from './views/PaymentsView';
import OperationsView from './views/OperationsView';
import CampaignsView from './views/CampaignsView';
import SuppliersView from './views/SuppliersView';
import { AppProvider, useApp } from './AppContext';
import { AGENCY_PROFILE } from './constants';

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-64 bg-white border-r h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b flex items-center">
        <img
          src={AGENCY_PROFILE.logoUrl}
          alt={`${AGENCY_PROFILE.brandName} logo`}
          className="h-9 w-auto object-contain"
        />
        <span className="sr-only">{AGENCY_PROFILE.brandName}</span>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        <Link 
          to="/" 
          className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 font-medium ${isActive('/') ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <BarChart3 size={20} /> Dashboard
        </Link>
        <Link 
          to="/clients" 
          className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 font-medium ${isActive('/clients') ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Users size={20} /> Clientes
        </Link>
        <Link 
          to="/pipeline" 
          className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 font-medium ${isActive('/pipeline') ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Trello size={20} /> Pipeline
        </Link>
        <Link
          to="/oportunidades"
          className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 font-medium ${isActive('/oportunidades') ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Target size={20} /> Pacotes
        </Link>
        <Link 
          to="/operations" 
          className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 font-medium ${isActive('/operations') ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Compass size={20} /> Operação
        </Link>
        <Link 
          to="/suppliers" 
          className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 font-medium ${isActive('/suppliers') ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Building2 size={20} /> Fornecedores
        </Link>
        <Link 
          to="/payments" 
          className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 font-medium ${isActive('/payments') ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Wallet size={20} /> Pagamentos
        </Link>
        <Link 
          to="/employees" 
          className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 font-medium ${isActive('/employees') ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Users2 size={20} /> Equipa
        </Link>
      </nav>
      
      <div className="p-4 border-t">
        <button className="flex items-center gap-3 p-3 w-full text-gray-500 hover:bg-gray-50 rounded-xl transition-colors font-medium">
          <Settings size={20} /> Definições
        </button>
      </div>
    </div>
  );
};

const Header = () => (
  <header className="h-16 bg-white/80 backdrop-blur-md border-b fixed top-0 right-0 left-64 z-40 flex items-center justify-between px-8">
    <div className="relative w-96">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      <input 
        type="text" 
        placeholder="Pesquisar viagens, vouchers, ocorrências..." 
        className="w-full bg-gray-50 border border-gray-200 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
      />
    </div>
    <div className="flex items-center gap-4">
      <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors relative">
        <Bell size={20} />
        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
      </button>
      <div className="h-8 w-px bg-gray-200 mx-2"></div>
      <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 rounded-xl transition-colors">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold text-gray-900 leading-none">{AGENCY_PROFILE.brandName}</p>
          <p className="text-[10px] text-blue-600 font-bold uppercase mt-1">Operações</p>
        </div>
        <div className="w-12 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200 shadow-sm overflow-hidden">
          <img
            src={AGENCY_PROFILE.logoUrl}
            alt={`${AGENCY_PROFILE.brandName} logo`}
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  </header>
);

const PageLayout: React.FC = () => {
  const location = useLocation();
  const isPipeline = location.pathname === '/pipeline';

  return (
    <main className="pl-64 pt-16 min-h-screen">
      <div className={isPipeline ? 'p-6 w-full max-w-none' : 'p-8 max-w-[1600px] mx-auto'}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<ClientsView />} />
          <Route path="/pipeline" element={<PipelineView />} />
          <Route path="/oportunidades" element={<CampaignsView />} />
          <Route path="/operations" element={<OperationsView />} />
          <Route path="/suppliers" element={<SuppliersView />} />
          <Route path="/payments" element={<PaymentsView />} />
          <Route path="/employees" element={<EmployeesView />} />
        </Routes>
      </div>
    </main>
  );
};

const AppContent: React.FC = () => {
  const { isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[100]">
        <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
        <p className="text-sm font-black text-gray-900 uppercase tracking-widest animate-pulse">Sincronizando com a Base de Dados...</p>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-50/50">
        <Sidebar />
        <Header />
        <PageLayout />
      </div>
    </HashRouter>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
