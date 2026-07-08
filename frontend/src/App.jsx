import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Catalog from './pages/Catalog';
import CollectionImages from './pages/CollectionImages';
import InteractiveView from './pages/InteractiveView';

// Components
import Assistant from './components/Assistant';

function App() {
  const location = useLocation();

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/collection/:id" element={<CollectionImages />} />
          <Route path="/interactive/:id" element={<InteractiveView />} />
        </Routes>
      </AnimatePresence>
      <Assistant />
    </>
  );
}

export default App;
