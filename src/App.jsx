import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import { AboutPage, ServicesPage, ProjectsPage, ContactPage } from './pages/InnerPages';
import GlobalStyles from './styles/GlobalStyles';
import LoadingSpinner from './components/ui/LoadingSpinner';
import WhatsAppButton from './components/ui/WhatsAppButton';

const SolarPlanner = lazy(() => import('./features/planner/SolarPlanner'));

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <GlobalStyles />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route
            path="/planner"
            element={<Suspense fallback={<LoadingSpinner />}><SolarPlanner /></Suspense>}
          />
          <Route path="*" element={<Home />} />
        </Routes>
      </Layout>
      <WhatsAppButton />
    </Router>
  );
}

export default App;
