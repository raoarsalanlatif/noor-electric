import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import ServicesSection from './components/sections/ServicesSection';
import ProjectsSection from './components/sections/ProjectsSection';
import ContactSection from './components/sections/ContactSection';
import AboutSection from './components/sections/AboutSection';
import GlobalStyles from './styles/GlobalStyles';
import LoadingSpinner from './components/ui/LoadingSpinner';

const SolarPlanner = lazy(() => import('./features/planner/SolarPlanner'));

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <GlobalStyles />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutSection />} />
          <Route path="/services" element={<ServicesSection />} />
          <Route path="/projects" element={<ProjectsSection />} />
          <Route path="/contact" element={<ContactSection />} />
          <Route
            path="/planner"
            element={<Suspense fallback={<LoadingSpinner />}><SolarPlanner /></Suspense>}
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;