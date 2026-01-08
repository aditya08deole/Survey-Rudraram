/**
 * Rudraram Survey - Main App Component
 * 
 * Root component that sets up routing and global state.
 * Data is loaded from FastAPI backend.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import TableView from './pages/TableView';

function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<MapView />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/table" element={<TableView />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}

export default App;
