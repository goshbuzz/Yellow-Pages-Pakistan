import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Categories from './pages/Categories';
import Browse from './pages/Browse';
import BusinessDetail from './pages/BusinessDetail';
import Leads from './pages/Leads';
import Nearby from './pages/Nearby';
import AddListing from './pages/AddListing';
import Faq from './pages/Faq';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/b/:id" element={<BusinessDetail />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/nearby" element={<Nearby />} />
          <Route path="/add" element={<AddListing />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
