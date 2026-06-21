import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import LoginPage from "./app/features/auth/pages/LoginPage";
import RegisterPage from "./app/features/auth/pages/RegisterPage";
import OnboardingPage from "./app/features/onboarding/pages/OnboardingPage";
import AdminLayout from "./app/layout/AdminLayout";
import ProtectedRoute from "./app/core/guards/ProtectedRoute";
import DashboardPage from "./app/features/dashboard/pages/DashboardPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Protected dashboard routes — wrapped by AdminLayout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
