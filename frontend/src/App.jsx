import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PasswordResetSuccess from './pages/PasswordResetSuccess';
import Dashboard from './pages/Dashboard';
import Persona from './pages/Persona';
import Generate from './pages/Generate';
import History from './pages/History';
import Settings from './pages/Settings';
import FounderPage from './pages/FounderPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/password-reset-success" element={<PasswordResetSuccess />} />
          
          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/persona" 
            element={
              <ProtectedRoute>
                <Persona />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/generate" 
            element={
              <ProtectedRoute>
                <Generate />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/history" 
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />

          <Route
            path="/founder-page"
            element={
            <ProtectedRoute>
              <FounderPage />
            </ProtectedRoute>
            }
           /> 

          {/* Redirect onboarding to persona */}
          <Route path="/onboarding" element={<Navigate to="/persona" replace />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;