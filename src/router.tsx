import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { NotionPage } from '@/pages/NotionPage'
import { SettingsPage } from '@/pages/SettingsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'stories', element: <NotionPage /> },
      { path: 'notion', element: <Navigate to="/stories" replace /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])
