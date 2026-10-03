import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import WebsiteHome from './pages/WebsiteHome';
import Home from './pages/Home';
import Categories from './pages/Categories';
import Browse from './pages/Browse';
import BusinessDetail from './pages/BusinessDetail';
import Leads from './pages/Leads';
import Nearby from './pages/Nearby';
import AddListing from './pages/AddListing';
import Faq from './pages/Faq';

function LegacyHashRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    // If incoming link has a hash route (e.g. /#/browse or /#/categories), smoothly redirect to clean URL
    if (window.location.hash && window.location.hash.startsWith('#/')) {
      const cleanPath = window.location.hash.slice(1); // removes '#'
      navigate(cleanPath, { replace: true });
    }
  }, [navigate]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <LegacyHashRedirect />
      <Routes>
        <Route element={<Layout />}>
          {/* Pure Website Home page */}
          <Route path="/" element={<WebsiteHome />} />

          {/* Directory Web App dashboard */}
          <Route path="/app" element={<Home />} />

          {/* Core Directory Routes */}
          <Route path="/categories" element={<Categories />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/b/:id" element={<BusinessDetail />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/nearby" element={<Nearby />} />
          <Route path="/add" element={<AddListing />} />
          <Route path="/faq" element={<Faq />} />

          {/* Catch-all fallback */}
          <Route path="*" element={<WebsiteHome />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
