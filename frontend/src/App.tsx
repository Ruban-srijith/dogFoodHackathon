import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

// Public & General Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { GalleryPage } from './pages/GalleryPage';
import { SubmissionDetailPage } from './pages/SubmissionDetailPage';
import { TeamPage } from './pages/TeamPage';
import { TeamCreatePage } from './pages/TeamCreatePage';
import { TeamJoinPage } from './pages/TeamJoinPage';
import { SubmissionCreatePage } from './pages/SubmissionCreatePage';
import { NotFoundPage } from './pages/NotFoundPage';

// Judge Portal Pages
import { JudgeDashboardPage } from './pages/JudgeDashboardPage';
import { JudgeSubmissionPage } from './pages/JudgeSubmissionPage';

// Organizer Portal Pages
import { OrganizerDashboardPage } from './pages/OrganizerDashboardPage';
import { OrganizerEventsPage } from './pages/OrganizerEventsPage';
import { OrganizerJudgesPage } from './pages/OrganizerJudgesPage';
import { OrganizerResultsPage } from './pages/OrganizerResultsPage';

// Admin Portal Pages
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminAuditPage } from './pages/AdminAuditPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public and Participant Routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/submissions/:id" element={<SubmissionDetailPage />} />
              <Route path="/teams/new" element={<TeamCreatePage />} />
              <Route path="/teams/join" element={<TeamJoinPage />} />
              <Route path="/teams/:id" element={<TeamPage />} />
              <Route path="/submissions/new" element={<SubmissionCreatePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Judge Portal */}
            <Route path="/judge" element={<DashboardLayout portal="judge" />}>
              <Route index element={<Navigate to="/judge/dashboard" replace />} />
              <Route path="dashboard" element={<JudgeDashboardPage />} />
              <Route path="submissions" element={<JudgeDashboardPage />} />
              <Route path="submissions/:id" element={<JudgeSubmissionPage />} />
            </Route>

            {/* Organizer Portal */}
            <Route path="/organizer" element={<DashboardLayout portal="organizer" />}>
              <Route index element={<Navigate to="/organizer/dashboard" replace />} />
              <Route path="dashboard" element={<OrganizerDashboardPage />} />
              <Route path="events" element={<OrganizerEventsPage />} />
              <Route path="judges" element={<OrganizerJudgesPage />} />
              <Route path="results" element={<OrganizerResultsPage />} />
            </Route>

            {/* Admin Console */}
            <Route path="/admin" element={<DashboardLayout portal="admin" />}>
              <Route index element={<Navigate to="/admin/audit" replace />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="events" element={<OrganizerEventsPage />} />
              <Route path="audit" element={<AdminAuditPage />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
