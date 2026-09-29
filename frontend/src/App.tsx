import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { SmoothScroll } from './components/SmoothScroll';
import { Loading } from './components/Loading';
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Delay-Loaded (Code-Split) Public & General Pages
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const EventsPage = lazy(() => import('./pages/EventsPage').then((m) => ({ default: m.EventsPage })));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage').then((m) => ({ default: m.EventDetailPage })));
const GalleryPage = lazy(() => import('./pages/GalleryPage').then((m) => ({ default: m.GalleryPage })));
const SubmissionDetailPage = lazy(() => import('./pages/SubmissionDetailPage').then((m) => ({ default: m.SubmissionDetailPage })));
const TeamPage = lazy(() => import('./pages/TeamPage').then((m) => ({ default: m.TeamPage })));
const TeamCreatePage = lazy(() => import('./pages/TeamCreatePage').then((m) => ({ default: m.TeamCreatePage })));
const TeamJoinPage = lazy(() => import('./pages/TeamJoinPage').then((m) => ({ default: m.TeamJoinPage })));
const SubmissionCreatePage = lazy(() => import('./pages/SubmissionCreatePage').then((m) => ({ default: m.SubmissionCreatePage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

// Delay-Loaded Judge Portal Pages
const JudgeDashboardPage = lazy(() => import('./pages/JudgeDashboardPage').then((m) => ({ default: m.JudgeDashboardPage })));
const JudgeSubmissionPage = lazy(() => import('./pages/JudgeSubmissionPage').then((m) => ({ default: m.JudgeSubmissionPage })));

// Delay-Loaded Organizer Portal Pages
const OrganizerDashboardPage = lazy(() => import('./pages/OrganizerDashboardPage').then((m) => ({ default: m.OrganizerDashboardPage })));
const OrganizerEventsPage = lazy(() => import('./pages/OrganizerEventsPage').then((m) => ({ default: m.OrganizerEventsPage })));
const OrganizerJudgesPage = lazy(() => import('./pages/OrganizerJudgesPage').then((m) => ({ default: m.OrganizerJudgesPage })));
const OrganizerResultsPage = lazy(() => import('./pages/OrganizerResultsPage').then((m) => ({ default: m.OrganizerResultsPage })));

// Delay-Loaded Admin Portal Pages
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })));
const AdminAuditPage = lazy(() => import('./pages/AdminAuditPage').then((m) => ({ default: m.AdminAuditPage })));

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <ToastProvider>
            <NavigationProvider>
              <SmoothScroll>
                <Suspense fallback={<Loading message="Accessing Dogfood Platform..." fullScreen delayMs={100} />}>
                  <Routes>
                    {/* Public and Participant Routes */}
                    <Route element={<MainLayout />}>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/events" element={<EventsPage />} />
                      <Route path="/events/:id" element={<EventDetailPage />} />
                      <Route path="/gallery" element={<GalleryPage />} />
                      <Route path="/submissions/:id" element={<SubmissionDetailPage />} />
                      <Route path="/teams/new" element={<ProtectedRoute><TeamCreatePage /></ProtectedRoute>} />
                      <Route path="/teams/join" element={<ProtectedRoute><TeamJoinPage /></ProtectedRoute>} />
                      <Route path="/teams/:id" element={<TeamPage />} />
                      <Route path="/submissions/new" element={<ProtectedRoute allowedRoles={['PARTICIPANT', 'ADMIN']}><SubmissionCreatePage /></ProtectedRoute>} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Route>

                    {/* Auth Routes */}
                    <Route element={<AuthLayout />}>
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                    </Route>

                    {/* Judge Portal – requires JUDGE, ORGANIZER, or ADMIN */}
                    <Route path="/judge" element={<ProtectedRoute allowedRoles={['JUDGE', 'ORGANIZER', 'ADMIN']}><DashboardLayout portal="judge" /></ProtectedRoute>}>
                      <Route index element={<Navigate to="/judge/dashboard" replace />} />
                      <Route path="dashboard" element={<JudgeDashboardPage />} />
                      <Route path="submissions" element={<JudgeDashboardPage />} />
                      <Route path="submissions/:id" element={<JudgeSubmissionPage />} />
                    </Route>

                    {/* Organizer Portal – requires ORGANIZER or ADMIN */}
                    <Route path="/organizer" element={<ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}><DashboardLayout portal="organizer" /></ProtectedRoute>}>
                      <Route index element={<Navigate to="/organizer/dashboard" replace />} />
                      <Route path="dashboard" element={<OrganizerDashboardPage />} />
                      <Route path="events" element={<OrganizerEventsPage />} />
                      <Route path="judges" element={<OrganizerJudgesPage />} />
                      <Route path="results" element={<OrganizerResultsPage />} />
                    </Route>

                    {/* Admin Console – requires ADMIN only */}
                    <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout portal="admin" /></ProtectedRoute>}>
                      <Route index element={<Navigate to="/admin/audit" replace />} />
                      <Route path="users" element={<AdminUsersPage />} />
                      <Route path="events" element={<OrganizerEventsPage />} />
                      <Route path="audit" element={<AdminAuditPage />} />
                    </Route>
                  </Routes>
                </Suspense>
              </SmoothScroll>
            </NavigationProvider>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};
