import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import { AboutPage, ServicesPage, ProjectsPage, ContactPage } from './pages/InnerPages';
import GlobalStyles from './styles/GlobalStyles';
import LoadingSpinner from './components/ui/LoadingSpinner';
import WhatsAppButton from './components/ui/WhatsAppButton';

const SolarPlanner = lazy(() => import('./features/planner/SolarPlanner'));
const SolarRush = lazy(() => import('./features/game/SolarRush'));
const AdminApp = lazy(() => import('./features/admin/AdminApp'));
const BlogList = lazy(() => import('./pages/BlogPages').then((m) => ({ default: m.BlogList })));
const BlogPost = lazy(() => import('./pages/BlogPages').then((m) => ({ default: m.BlogPost })));

const lazyEl = (C) => <Suspense fallback={<LoadingSpinner />}><C /></Suspense>;

function SiteLayout() {
  return (
    <>
      <Layout><Outlet /></Layout>
      <WhatsAppButton />
    </>
  );
}

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <GlobalStyles />
      <Routes>
        <Route path="/admin/*" element={lazyEl(AdminApp)} />
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/blog" element={lazyEl(BlogList)} />
          <Route path="/blog/:slug" element={lazyEl(BlogPost)} />
          <Route path="/planner" element={lazyEl(SolarPlanner)} />
          <Route path="/play" element={lazyEl(SolarRush)} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
