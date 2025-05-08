import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import HomePage from './pages/HomePage';
import SitePage from './pages/SitePage';
import ItemDetailPage from './pages/ItemDetailPage';
import ErrorBoundary from './components/ErrorBoundary';
import MCPProvider from './components/MCPProvider';

function App() {
  return (
    <ErrorBoundary>
      <MCPProvider>
        <Router>
          <AppProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/site/:siteId" element={<SitePage />} />
              <Route path="/item/:itemId" element={<ItemDetailPage />} />
            </Routes>
          </AppProvider>
        </Router>
      </MCPProvider>
    </ErrorBoundary>
  );
}

export default App;
