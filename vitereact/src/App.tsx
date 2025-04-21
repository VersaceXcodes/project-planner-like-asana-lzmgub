import React, { FC } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from '@/store/main';

/* Import shared global views */
import GV_TopNav from '@/components/views/GV_TopNav.tsx';
import GV_Sidebar from '@/components/views/GV_Sidebar.tsx';
import GV_NotificationsPanel from '@/components/views/GV_NotificationsPanel.tsx';
import GV_HamburgerMenu from '@/components/views/GV_HamburgerMenu.tsx';
import GV_Footer from '@/components/views/GV_Footer.tsx';

/* Import unique views */
import UV_Login from '@/components/views/UV_Login.tsx';
import UV_Onboarding from '@/components/views/UV_Onboarding.tsx';
import UV_Dashboard from '@/components/views/UV_Dashboard.tsx';
import UV_ProjectCreation from '@/components/views/UV_ProjectCreation.tsx';
import UV_ProjectDetail from '@/components/views/UV_ProjectDetail.tsx';
import UV_TaskDetail from '@/components/views/UV_TaskDetail.tsx';
import UV_TaskCreation from '@/components/views/UV_TaskCreation.tsx';
import UV_Calendar from '@/components/views/UV_Calendar.tsx';
import UV_UserProfile from '@/components/views/UV_UserProfile.tsx';
import UV_TeamManagement from '@/components/views/UV_TeamManagement.tsx';

const App: FC = () => {
  // Access the auth state from the store
  const isAuthenticated = useSelector((state: RootState) => state.global.is_authenticated);
  
  // Use react-router's useLocation (if needed for further custom logic)
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Global Top Navigation Bar always visible */}
      <GV_TopNav />

      {/* Conditionally render authenticated global shared components */}
      {isAuthenticated && (
        <>
          <GV_Sidebar />
          <GV_NotificationsPanel />
          <GV_HamburgerMenu />
        </>
      )}

      {/* Main content area */}
      {/* 
          When authenticated, add left margin for the fixed sidebar (assuming a sidebar width of 16rem on large screens),
          and a top margin to account for the fixed top nav.
          For unauthenticated pages, only top margin is needed.
      */}
      <div className={`flex-1 pt-16 ${isAuthenticated ? "lg:ml-64" : ""}`}>
        <Routes>
          <Route path="/" element={<UV_Login />} />
          <Route path="/onboarding" element={<UV_Onboarding />} />
          <Route path="/dashboard" element={<UV_Dashboard />} />
          <Route path="/project/create" element={<UV_ProjectCreation />} />
          <Route path="/project/:project_uid" element={<UV_ProjectDetail />} />
          <Route path="/task/:task_uid" element={<UV_TaskDetail />} />
          <Route path="/task/create" element={<UV_TaskCreation />} />
          <Route path="/calendar" element={<UV_Calendar />} />
          <Route path="/profile" element={<UV_UserProfile />} />
          <Route path="/team" element={<UV_TeamManagement />} />
        </Routes>
      </div>

      {/* Global Footer always visible */}
      <GV_Footer />
    </div>
  );
};

export default App;