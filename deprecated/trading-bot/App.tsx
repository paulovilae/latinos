import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import ProductsPage from './components/ProductsPage';
import NewsPage from './components/NewsPage';
import ContactPage from './components/ContactPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import DashboardLayout from './components/DashboardLayout';
import DashboardOverviewPage from './components/DashboardOverviewPage';
import TechnicalAnalysisPage from './components/TechnicalAnalysisPage';
import PerformancePage from './components/PerformancePage';
import BotConfigurationPage from './components/BotConfigurationPage';
import TestimonialsPage from './components/TestimonialsPage';
import TrainingPage from './components/dashboard/TrainingPage';
import EditorDemo from './components/editor/EditorDemo'; // Import EditorDemo component
import { useAuth } from './hooks/useAuth';
import { EditorProvider } from './contexts/EditorContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <EditorProvider>
        <div className="flex flex-col min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/testimonials" element={<TestimonialsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardOverviewPage />} />
                <Route path="overview" element={<DashboardOverviewPage />} />
                <Route path="analysis" element={<TechnicalAnalysisPage />} />
                <Route path="performance" element={<PerformancePage />} />
                <Route path="configure" element={<BotConfigurationPage />} />
                <Route path="training" element={<TrainingPage />} />
                <Route path="editor-demo" element={<EditorDemo />} /> {/* Editor demonstration page */}
              </Route>
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </EditorProvider>
    </HashRouter>
  );
};

export default App;