import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import LandingPage from "./app/features/landing/LandingPage";
import LoginPage from "./app/features/auth/pages/LoginPage";
import RegisterPage from "./app/features/auth/pages/RegisterPage";
import EducationalSystemSelectionPage from "./app/features/auth/pages/EducationalSystemSelectionPage";
import ForgotPasswordPage from "./app/features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "./app/features/auth/pages/ResetPasswordPage";
import VerifyEmailPage from "./app/features/auth/pages/VerifyEmailPage";
import OnboardingPage from "./app/features/onboarding/pages/OnboardingPage";
import AdminLayout from "./app/layout/AdminLayout";
import ProtectedRoute from "./app/core/guards/ProtectedRoute";
import DashboardPage from "./app/features/dashboard/pages/DashboardPage";
import StudentsListPage from "./app/features/students/pages/StudentsListPage";
import StudentProfilePage from "./app/features/students/pages/StudentProfilePage";
import TeachersListPage from "./app/features/teachers/pages/TeachersListPage";
import GradesPage from "./app/features/grades/pages/GradesPage";
import ReportCardsPage from "./app/features/grades/pages/ReportCardsPage";
import AttendancePage from "./app/features/attendance/pages/AttendancePage";
import FinancePage from "./app/features/finance/pages/FinancePage";
import SettingsPage from "./app/features/settings/pages/SettingsPage";
import WebsiteSettingsPage from "./app/features/settings/pages/WebsiteSettingsPage";

// Educational system pages
import ExamsSection from "./app/features/exams/pages/ExamsSection";
import SeriesSection from "./app/features/series/pages/SeriesSection";
import ClassesChildrenSection from "./app/features/classes/pages/ClassesChildrenSection";
import ProgramsSection from "./app/features/programs/pages/ProgramsSection";
import AdmissionsSection from "./app/features/admissions/pages/AdmissionsSection";
import FacultiesPage from "./app/features/faculties/pages/FacultiesPage";
import DepartmentsPage from "./app/features/faculties/pages/DepartmentsPage";
import ResearchPage from "./app/features/research/pages/ResearchPage";
import PublicationsPage from "./app/features/research/pages/PublicationsPage";

import PublicWebsitePage from "./app/features/website/pages/PublicWebsitePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        {/* Educational system selection (first login after onboarding) */}
        <Route path="/educational-system-selection" element={<ProtectedRoute><EducationalSystemSelectionPage /></ProtectedRoute>} />

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
          {/* Dashboard home */}
          <Route index element={<DashboardPage />} />

          {/* Students */}
          <Route path="students" element={<StudentsListPage />} />
          <Route path="students/:id" element={<StudentProfilePage />} />

          {/* Academic base sections */}
          <Route path="classes" element={<ClassesChildrenSection />} />
          <Route path="subjects" element={<div className="p-6">Subjects — coming soon</div>} />
          <Route path="teachers" element={<TeachersListPage />} />

          {/* Exam routes (system-specific) */}
          <Route path="exams/gce-o-level" element={<ExamsSection />} />
          <Route path="exams/gce-a-level" element={<ExamsSection />} />
          <Route path="exams/gce-results" element={<ExamsSection />} />
          <Route path="exams/bepc" element={<ExamsSection />} />
          <Route path="exams/probatoire" element={<ExamsSection />} />
          <Route path="exams/baccalaureat" element={<ExamsSection />} />
          <Route path="exams/francophone-results" element={<ExamsSection />} />
          <Route path="exams/tvee-il" element={<ExamsSection />} />
          <Route path="exams/tvee-al" element={<ExamsSection />} />
          <Route path="exams/tvee-results" element={<ExamsSection />} />
          <Route path="exams/cap" element={<ExamsSection />} />
          <Route path="exams/probatoire-technique" element={<ExamsSection />} />
          <Route path="exams/bac-technique" element={<ExamsSection />} />
          <Route path="exams/tech-results" element={<ExamsSection />} />

          {/* Series routes (system-specific) */}
          <Route path="series/arts" element={<SeriesSection />} />
          <Route path="series/science" element={<SeriesSection />} />
          <Route path="series/literary" element={<SeriesSection />} />
          <Route path="series/scientific" element={<SeriesSection />} />
          <Route path="series/economic" element={<SeriesSection />} />
          <Route path="series/technical" element={<SeriesSection />} />
          <Route path="series/industrial" element={<SeriesSection />} />
          <Route path="series/commercial" element={<SeriesSection />} />
          <Route path="series/industriel" element={<SeriesSection />} />
          <Route path="series/tertiaire" element={<SeriesSection />} />

          {/* Class level routes (system-specific) */}
          <Route path="classes/lower-secondary" element={<ClassesChildrenSection />} />
          <Route path="classes/upper-secondary" element={<ClassesChildrenSection />} />
          <Route path="classes/college" element={<ClassesChildrenSection />} />
          <Route path="classes/lycee" element={<ClassesChildrenSection />} />
          <Route path="classes/tech-lower" element={<ClassesChildrenSection />} />
          <Route path="classes/tech-upper" element={<ClassesChildrenSection />} />
          <Route path="classes/tech-college" element={<ClassesChildrenSection />} />
          <Route path="classes/tech-lycee" element={<ClassesChildrenSection />} />

          {/* Grade routes */}
          <Route path="grades" element={<GradesPage />} />
          <Route path="grades/anglophone" element={<GradesPage />} />
          <Route path="grades/francophone" element={<GradesPage />} />
          <Route path="report-cards" element={<ReportCardsPage />} />
          <Route path="attendance" element={<AttendancePage />} />

          {/* Finance */}
          <Route path="finance" element={<FinancePage />} />

          {/* University-specific routes */}
          <Route path="programs/licence" element={<ProgramsSection />} />
          <Route path="programs/master" element={<ProgramsSection />} />
          <Route path="programs/doctorate" element={<ProgramsSection />} />
          <Route path="faculties" element={<FacultiesPage />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="research" element={<ResearchPage />} />
          <Route path="publications" element={<PublicationsPage />} />

          {/* Admissions */}
          <Route path="admissions/applications" element={<AdmissionsSection />} />
          <Route path="admissions/enrollment" element={<AdmissionsSection />} />

          {/* Settings */}
          <Route path="settings" element={<SettingsPage />} />
          <Route path="website" element={<WebsiteSettingsPage />} />

          {/* Teacher-specific routes */}
          <Route path="my-classes" element={<div className="p-6">My Classes — coming soon</div>} />
          <Route path="grade-entry" element={<div className="p-6">Grade Entry — coming soon</div>} />

          {/* Student-specific routes */}
          <Route path="my-grades" element={<div className="p-6">My Grades — coming soon</div>} />
          <Route path="my-attendance" element={<div className="p-6">My Attendance — coming soon</div>} />
          <Route path="my-fees" element={<div className="p-6">My Fees — coming soon</div>} />
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
