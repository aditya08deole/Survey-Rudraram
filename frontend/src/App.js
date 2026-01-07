/**
 * Rudraram Survey - Main App Component
 * 
 * Root component that sets up routing and global state.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import TableView from './pages/TableView';
import AdminUpload from './pages/AdminUpload';

function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/table" element={<TableView />} />
            <Route path="/admin" element={<AdminUpload />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}

export default App;
