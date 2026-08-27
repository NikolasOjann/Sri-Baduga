import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Pages
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import CollectionImages from './pages/CollectionImages';
import InteractiveView from './pages/InteractiveView';
import TokohSejarah from './pages/TokohSejarah';

// Components
import Assistant from './components/Assistant';
import ProtectedRoute from './components/ProtectedRoute';

// Admin Pages
import AdminLogin from './pages/Admin/AdminLogin';
import AdminLayout from './pages/Admin/AdminLayout';
import Dashboard from './pages/Admin/Dashboard';
import Datasets from './pages/Admin/Datasets';
import EditDataset from './pages/Admin/EditDataset';

function App() {
  const location = useLocation();
  
  // Sembunyikan Assistant di halaman admin
  const hideAssistantRoute = location.pathname.startsWith('/1974-SriBaduga');

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/collection/:id" element={<CollectionImages />} />
          <Route path="/interactive/:id" element={<InteractiveView />} />
          <Route path="/tokoh-sejarah" element={<TokohSejarah />} />
          <Route path="/tokoh-sejarah/:id" element={<TokohSejarah />} />
          
          {/* Admin Routes */}
          <Route path="/1974-SriBaduga" element={<AdminLogin />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/1974-SriBaduga/dashboard" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="datasets" element={<Datasets />} />
              <Route path="datasets/create" element={<EditDataset />} />
              <Route path="datasets/edit/:id" element={<EditDataset />} />
            </Route>
          </Route>
          
          {/* Fallback 404 Asli */}
          <Route path="*" element={<div style={{ textAlign: 'center', padding: '50px' }}><h1>404 Not Found</h1></div>} />
        </Routes>
      </AnimatePresence>
      {!hideAssistantRoute && <Assistant />}
    </>
  );
}

export default App;
