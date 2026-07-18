import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { EducationalSystemProvider } from "./app/core/context/EducationalSystemContext";
import { Toaster } from "react-hot-toast";
import LoadingFallback from "./app/components/ui/LoadingFallback";
import ProtectedRoute from "./app/core/guards/ProtectedRoute";
import AcademicYearGuard from "./app/core/guards/AcademicYearGuard";
import RoleRoute from "./app/core/guards/RoleRoute";
import AdminLayout from "./app/layout/AdminLayout";
import { useAuth } from "./app/core/hooks/useAuth";

// ── Lazy-loaded page components (code-split at route level) ──
const LandingPage = lazy(() => import("./app/features/landing/LandingPage"));
const LoginPage = lazy(() => import("./app/features/auth/pages/LoginPage"));
const RegisterPage = lazy(() => import("./app/features/auth/pages/RegisterPage"));
const EducationalSystemSelectionPage = lazy(() => import("./app/features/auth/pages/EducationalSystemSelectionPage"));
const ForgotPasswordPage = lazy(() => import("./app/features/auth/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./app/features/auth/pages/ResetPasswordPage"));
const VerifyEmailPage = lazy(() => import("./app/features/auth/pages/VerifyEmailPage"));
const OnboardingPage = lazy(() => import("./app/features/onboarding/pages/OnboardingPage"));
const AcademicYearSetup = lazy(() => import("./app/features/onboarding/components/AcademicYearSetup"));
const DashboardPage = lazy(() => import("./app/features/dashboard/pages/DashboardPage"));
const LevelsListPage = lazy(() => import("./app/features/levels/pages/LevelsListPage"));
const SeriesManagementPage = lazy(() => import("./app/features/series/pages/SeriesManagementPage"));
const PeriodsPage = lazy(() => import("./app/features/academic/pages/PeriodsPage"));
const SequencesPage = lazy(() => import("./app/features/academic/pages/SequencesPage"));
const SubjectsListPage = lazy(() => import("./app/features/subjects/pages/SubjectsListPage"));
const ClassSubjectsPage = lazy(() => import("./app/features/subjects/pages/ClassSubjectsPage"));
const GradesPage = lazy(() => import("./app/features/grades/pages/GradesPage"));
const ReportCardsPage = lazy(() => import("./app/features/grades/pages/ReportCardsPage"));
const AttendancePage = lazy(() => import("./app/features/attendance/pages/AttendancePage"));
const FinancePage = lazy(() => import("./app/features/finance/pages/FinancePage"));
const SettingsPage = lazy(() => import("./app/features/settings/pages/SettingsPage"));
const WebsiteSettingsPage = lazy(() => import("./app/features/settings/pages/WebsiteSettingsPage"));
const AcademicYearsPage = lazy(() => import("./app/features/settings/pages/AcademicYearsPage"));
const SystemConfigurationPage = lazy(() => import("./app/core/pages/SystemConfigurationPage"));
const CreateUserPage = lazy(() => import("./app/features/users/pages/CreateUserPage"));
const UsersListPage = lazy(() => import("./app/features/users/pages/UsersListPage"));
const ExamsSection = lazy(() => import("./app/features/exams/pages/ExamsSection"));
const SeriesSection = lazy(() => import("./app/features/series/pages/SeriesSection"));
const ClassesChildrenSection = lazy(() => import("./app/features/classes/pages/ClassesChildrenSection"));
const CreateClassPage = lazy(() => import("./app/features/classes/pages/CreateClassPage"));
const ClassDetailPage = lazy(() => import("./app/features/classes/pages/ClassDetailPage"));
const ProgramsSection = lazy(() => import("./app/features/programs/pages/ProgramsSection"));
const AdmissionsSection = lazy(() => import("./app/features/admissions/pages/AdmissionsSection"));
const StudentsListPage = lazy(() => import("./app/features/students/pages/StudentsListPage"));
const StudentProfilePage = lazy(() => import("./app/features/students/pages/StudentProfilePage"));
const FacultiesPage = lazy(() => import("./app/features/faculties/pages/FacultiesPage"));
const DepartmentsPage = lazy(() => import("./app/features/faculties/pages/DepartmentsPage"));
const ResearchPage = lazy(() => import("./app/features/research/pages/ResearchPage"));
const PublicationsPage = lazy(() => import("./app/features/research/pages/PublicationsPage"));
const PublicWebsitePage = lazy(() => import("./app/features/website/pages/PublicWebsitePage"));
const AnnouncementsAdminPage = lazy(() => import("./app/features/announcements/pages/AnnouncementsAdminPage"));
const TeacherDashboardPage = lazy(() => import("./app/features/teachers/pages/TeacherDashboardPage"));
const AccountantDashboardPage = lazy(() => import("./app/features/accountant/pages/AccountantDashboardPage"));
const StudentDashboardPage = lazy(() => import("./app/features/students/pages/StudentDashboardPage"));

// ── Lazy helpers ──
const page = (Component) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
);

const dashboardPage = (Component) => (
  <Suspense fallback={<LoadingFallback message="Loading page..." />}>
    <Component />
  </Suspense>
);

// ── Role-based dashboard router ──
function RoleDashboardRouter() {
  const { user } = useAuth();
  const role = user?.roles?.[0] || "ADMIN";

  const roleDashboards = {
    ADMIN: DashboardPage,
    TEACHER: TeacherDashboardPage,
    STUDENT: StudentDashboardPage,
    ACCOUNTANT: AccountantDashboardPage,
  };

  const Component = roleDashboards[role] || DashboardPage;

  return dashboardPage(Component);
}

function App() {
  return (
    <EducationalSystemProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: "10px", fontSize: "14px" },
          success: { iconTheme: { primary: "#059669", secondary: "#fff" } },
          error: { iconTheme: { primary: "#dc2626", secondary: "#fff" } },
        }}
      />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={page(LandingPage)} />
          <Route path="/login" element={page(LoginPage)} />
          <Route path="/register" element={page(RegisterPage)} />
          <Route path="/forgot-password" element={page(ForgotPasswordPage)} />
          <Route path="/reset-password" element={page(ResetPasswordPage)} />
          <Route path="/verify-email" element={page(VerifyEmailPage)} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                {page(OnboardingPage)}
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding/academic-year"
            element={
              <ProtectedRoute>
                {page(AcademicYearSetup)}
              </ProtectedRoute>
            }
          />
          <Route
            path="/educational-system-selection"
            element={
              <ProtectedRoute>
                {page(EducationalSystemSelectionPage)}
              </ProtectedRoute>
            }
          />

          {/* Vitrin website accessible without login */}
          <Route path="/site" element={page(PublicWebsitePage)} />

          {/* Protected dashboard routes — wrapped by AdminLayout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AcademicYearGuard>
                  <AdminLayout />
                </AcademicYearGuard>
              </ProtectedRoute>
            }
          >
            {/* Dashboard home — role-aware */}
            <Route index element={<RoleDashboardRouter />} />

            {/* Users management (unified creation) */}
            <Route path="users" element={dashboardPage(UsersListPage)} />
            <Route path="users/new" element={dashboardPage(CreateUserPage)} />
            <Route path="users/create" element={dashboardPage(CreateUserPage)} />

            {/* Academic base sections */}
            <Route path="levels" element={dashboardPage(LevelsListPage)} />
            <Route path="series" element={dashboardPage(SeriesManagementPage)} />
            <Route path="periods" element={dashboardPage(PeriodsPage)} />
            <Route path="sequences" element={dashboardPage(SequencesPage)} />
            <Route path="classes" element={dashboardPage(ClassesChildrenSection)} />
            <Route path="subjects" element={dashboardPage(SubjectsListPage)} />
            <Route path="subject-classes" element={dashboardPage(ClassSubjectsPage)} />

            {/* Exam routes (system-specific) */}
            <Route path="exams/gce-o-level" element={dashboardPage(ExamsSection)} />
            <Route path="exams/gce-a-level" element={dashboardPage(ExamsSection)} />
            <Route path="exams/gce-results" element={dashboardPage(ExamsSection)} />
            <Route path="exams/bepc" element={dashboardPage(ExamsSection)} />
            <Route path="exams/probatoire" element={dashboardPage(ExamsSection)} />
            <Route path="exams/baccalaureat" element={dashboardPage(ExamsSection)} />
            <Route path="exams/francophone-results" element={dashboardPage(ExamsSection)} />
            <Route path="exams/tvee-il" element={dashboardPage(ExamsSection)} />
            <Route path="exams/tvee-al" element={dashboardPage(ExamsSection)} />
            <Route path="exams/tvee-results" element={dashboardPage(ExamsSection)} />
            <Route path="exams/cap" element={dashboardPage(ExamsSection)} />
            <Route path="exams/probatoire-technique" element={dashboardPage(ExamsSection)} />
            <Route path="exams/bac-technique" element={dashboardPage(ExamsSection)} />
            <Route path="exams/tech-results" element={dashboardPage(ExamsSection)} />

            {/* Series routes (system-specific) */}
            <Route path="series/arts" element={dashboardPage(SeriesSection)} />
            <Route path="series/science" element={dashboardPage(SeriesSection)} />
            <Route path="series/literary" element={dashboardPage(SeriesSection)} />
            <Route path="series/scientific" element={dashboardPage(SeriesSection)} />
            <Route path="series/economic" element={dashboardPage(SeriesSection)} />
            <Route path="series/technical" element={dashboardPage(SeriesSection)} />
            <Route path="series/industrial" element={dashboardPage(SeriesSection)} />
            <Route path="series/commercial" element={dashboardPage(SeriesSection)} />
            <Route path="series/industriel" element={dashboardPage(SeriesSection)} />
            <Route path="series/tertiaire" element={dashboardPage(SeriesSection)} />

            {/* Class level routes (system-specific) */}
            <Route path="classes/lower-secondary" element={dashboardPage(ClassesChildrenSection)} />
            <Route path="classes/upper-secondary" element={dashboardPage(ClassesChildrenSection)} />
            <Route path="classes/college" element={dashboardPage(ClassesChildrenSection)} />
            <Route path="classes/lycee" element={dashboardPage(ClassesChildrenSection)} />
            <Route path="classes/tech-lower" element={dashboardPage(ClassesChildrenSection)} />
            <Route path="classes/tech-upper" element={dashboardPage(ClassesChildrenSection)} />
            <Route path="classes/tech-college" element={dashboardPage(ClassesChildrenSection)} />
            <Route path="classes/tech-lycee" element={dashboardPage(ClassesChildrenSection)} />
            {/* Class CRUD routes */}
            <Route path="classes/new" element={dashboardPage(CreateClassPage)} />
            <Route path="classes/:id/edit" element={dashboardPage(CreateClassPage)} />
            <Route path="classes/:id" element={dashboardPage(ClassDetailPage)} />

            {/* Grade routes */}
            <Route path="grades" element={dashboardPage(GradesPage)} />
            <Route path="grades/anglophone" element={dashboardPage(GradesPage)} />
            <Route path="grades/francophone" element={dashboardPage(GradesPage)} />
            <Route path="report-cards" element={dashboardPage(ReportCardsPage)} />
            <Route path="attendance" element={dashboardPage(AttendancePage)} />

            {/* Finance */}
            <Route path="finance" element={dashboardPage(FinancePage)} />

            {/* University-specific routes */}
            <Route path="programs/licence" element={dashboardPage(ProgramsSection)} />
            <Route path="programs/master" element={dashboardPage(ProgramsSection)} />
            <Route path="programs/doctorate" element={dashboardPage(ProgramsSection)} />
            <Route path="faculties" element={dashboardPage(FacultiesPage)} />
            <Route path="departments" element={dashboardPage(DepartmentsPage)} />
            <Route path="research" element={dashboardPage(ResearchPage)} />
            <Route path="publications" element={dashboardPage(PublicationsPage)} />

            {/* Students */}
            <Route path="students" element={dashboardPage(StudentsListPage)} />
            <Route path="students/:id" element={dashboardPage(StudentProfilePage)} />

            {/* Admissions */}
            <Route path="admissions/applications" element={dashboardPage(AdmissionsSection)} />
            <Route path="admissions/enrollment" element={dashboardPage(AdmissionsSection)} />

            {/* Settings */}
            <Route path="settings" element={dashboardPage(SettingsPage)} />
            <Route path="website" element={dashboardPage(WebsiteSettingsPage)} />
            <Route path="announcements" element={dashboardPage(AnnouncementsAdminPage)} />
            <Route path="academic-years" element={dashboardPage(AcademicYearsPage)} />
            {/* Role-specific home dashboards */}
            <Route
              path="teacher-home"
              element={
                <RoleRoute allowedRoles={["TEACHER"]}>
                  {dashboardPage(TeacherDashboardPage)}
                </RoleRoute>
              }
            />
            <Route
              path="accountant-home"
              element={
                <RoleRoute allowedRoles={["ACCOUNTANT"]}>
                  {dashboardPage(AccountantDashboardPage)}
                </RoleRoute>
              }
            />
            <Route
              path="student-home"
              element={
                <RoleRoute allowedRoles={["STUDENT"]}>
                  {dashboardPage(StudentDashboardPage)}
                </RoleRoute>
              }
            />
            <Route
              path="parent-home"
              element={
                <RoleRoute allowedRoles={["PARENT"]}>
                  {dashboardPage(StudentDashboardPage)}
                </RoleRoute>
              }
            />

            {/* Teacher-specific routes */}
            <Route path="my-classes" element={<div className="p-6">My Classes — coming soon</div>} />
            <Route path="grade-entry" element={<div className="p-6">Grade Entry — coming soon</div>} />

            {/* Student-specific routes */}
            <Route path="my-grades" element={<div className="p-6">My Grades — coming soon</div>} />
            <Route path="my-attendance" element={<div className="p-6">My Attendance — coming soon</div>} />
            <Route path="my-fees" element={<div className="p-6">My Fees — coming soon</div>} />
          </Route>

          {/* Academic year selection standalone */}
          <Route
            path="/academic-years"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback fullScreen />}>
                  <AcademicYearsPage />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </EducationalSystemProvider>
  );
}

export default App;
