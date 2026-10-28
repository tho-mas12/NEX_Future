import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudyPlayerPage } from './pages/StudyPlayerPage';
import { MockArenaPage } from './pages/MockArenaPage';
import { RevisionGatewayPage } from './pages/RevisionGatewayPage';
import { TopicAnalysisPage } from './pages/TopicAnalysisPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminSubjectsPage } from './pages/admin/AdminSubjectsPage';
import { AdminCurriculumPage } from './pages/admin/AdminCurriculumPage';
import { AdminMCQHubPage } from './pages/admin/AdminMCQHubPage';
import { AdminMockStudioPage } from './pages/admin/AdminMockStudioPage';
import { AdminPYQPage } from './pages/admin/AdminPYQPage';
import { AdminCurrentAffairsPage } from './pages/admin/AdminCurrentAffairsPage';
import { AdminTopicsPage } from './pages/admin/AdminTopicsPage';
import { AdminRoadmapPage } from './pages/admin/AdminRoadmapPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { UserPYQPage } from './pages/UserPYQPage';
import { UserCurrentAffairsPage } from './pages/UserCurrentAffairsPage';
import { UserRevisionSchedulePage } from './pages/UserRevisionSchedulePage';
import { UserCompletedLessonsPage } from './pages/UserCompletedLessonsPage';
import { useAuthStore } from './store/useAuthStore';

// Protected route wrapper
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-muted-foreground text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { fetchCurrentUser } = useAuthStore();

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Student Routes */}
        <Route
          path="/onboard"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/study/:lesson_id"
          element={
            <ProtectedRoute>
              <StudyPlayerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analysis"
          element={
            <ProtectedRoute>
              <TopicAnalysisPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/syllabus"
          element={
            <ProtectedRoute>
              <TopicAnalysisPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mock-arena"
          element={
            <ProtectedRoute>
              <MockArenaPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mock-tests"
          element={
            <ProtectedRoute>
              <MockArenaPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/revision/:revision_id"
          element={
            <ProtectedRoute>
              <RevisionGatewayPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/revision-schedule"
          element={
            <ProtectedRoute>
              <UserRevisionSchedulePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pyq"
          element={
            <ProtectedRoute>
              <UserPYQPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/current-affairs"
          element={
            <ProtectedRoute>
              <UserCurrentAffairsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/completed-lessons"
          element={
            <ProtectedRoute>
              <UserCompletedLessonsPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverviewPage />} />
          <Route path="analytics" element={<AdminOverviewPage />} />
          <Route path="subjects" element={<AdminSubjectsPage />} />
          <Route path="curriculum" element={<AdminCurriculumPage />} />
          <Route path="schedule" element={<AdminCurriculumPage />} />
          <Route path="mcqs" element={<AdminMCQHubPage />} />
          <Route path="mocks" element={<AdminMockStudioPage />} />
          <Route path="pyqs" element={<AdminPYQPage />} />
          <Route path="current-affairs" element={<AdminCurrentAffairsPage />} />
          <Route path="ca-pyq" element={<AdminCurrentAffairsPage />} />
          <Route path="topics" element={<AdminTopicsPage />} />
          <Route path="roadmap" element={<AdminRoadmapPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        {/* Wildcard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
