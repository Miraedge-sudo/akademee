import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import LoginPage from "./app/features/auth/pages/LoginPage";
import RegisterPage from "./app/features/auth/pages/RegisterPage";
import OnboardingPage from "./app/features/onboarding/pages/OnboardingPage";
import AdminLayout from "./app/layout/AdminLayout";
import ProtectedRoute from "./app/core/guards/ProtectedRoute";
import DashboardPage from "./app/features/dashboard/pages/DashboardPage";
import WebsiteSettingsPage from "./app/features/settings/pages/WebsiteSettingsPage";
import PublicWebsitePage from "./app/features/website/pages/PublicWebsitePage";
import LandingPage from "./app/features/landing/LandingPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        {/* Vitrin website accessible without login */}
        <Route path="/site" element={<PublicWebsitePage />} />

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
          <Route path="website" element={<WebsiteSettingsPage />} />
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
