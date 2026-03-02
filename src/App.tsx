import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import AgentDashboardPage from "./pages/AgentDashboardPage";
import AgentLinkedLocationPage from "./pages/AgentLinkedLocationPage";
import AgentAssignmentsPage from "./pages/AgentAssignmentsPage";
import AgentRegisterFarmPage from "./pages/AgentRegisterFarmPage";
import LocationDashboardPage from "./pages/LocationDashboardPage"; // ✅ add
import LocationMyLocationPage from "./pages/LocationMyLocationPage";
import LocationCapturedFarmsPage from "./pages/LocationCapturedFarmsPage";
import LocationMyAgentsPage from "./pages/LocationMyAgentsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* ✅ Agent routes */}
        <Route path="/agent" element={<Navigate to="/agent/linked-location" replace />} />
        <Route path="/agent/linked-location" element={<AgentLinkedLocationPage />} />
        <Route path="/agent/assignments" element={<AgentAssignmentsPage />} />
        <Route path="/agent/register-farm" element={<AgentRegisterFarmPage />} />
        <Route path="/agent/dashboard" element={<AgentDashboardPage />} />
        <Route path="/location/my-location" element={<LocationMyLocationPage />} />
        <Route path="/location/captured-farms" element={<LocationCapturedFarmsPage />} />
        <Route path="/location/my-agents" element={<LocationMyAgentsPage />} />
        
        {/* ✅ Location manager routes */}
        <Route path="/location" element={<Navigate to="/location/dashboard" replace />} />
        <Route path="/location/dashboard" element={<LocationDashboardPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}