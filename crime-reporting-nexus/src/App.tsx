import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from 'react';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Layout from "./components/layout/Layout";
import UserDashboard from "./pages/user/Dashboard";
import MyFIRs from "./pages/user/MyFIRs";
import UserFIRDetails from "./pages/user/FIRDetails";
import FileFIR from "./pages/user/FileFIR";
import PoliceDashboard from "./pages/police/Dashboard";
import AllFIRs from "./pages/police/AllFIRs";
import PoliceFIRDetails from "./pages/police/FIRDetails";
import PoliceFileFIR from "./pages/police/FileFIR";
import Interrogation from "./pages/police/Interrogation";
import NewInterrogation from "./pages/police/NewInterrogation";
import InterrogationDetails from "./pages/police/InterrogationDetails";
import Profile from "./pages/Profile"; // Import the Profile component
import AadharVerification from "./pages/AadharVerification";
import { useAuthStore } from "./utils/auth";

const queryClient = new QueryClient();

const App = () => {
  // We need to access authentication state within the component body, not at the module level
  const { isAuthenticated } = useAuthStore();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* User routes */}
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/my-firs" element={<MyFIRs />} />
              <Route path="/fir/:id" element={<UserFIRDetails />} />
              <Route path="/file-fir" element={<FileFIR />} />
              <Route path="/profile" element={<Profile />} /> {/* Add the Profile route */}
              <Route path="/aadhar-verification" element={<AadharVerification />} />
              
              {/* Police routes */}
              <Route path="/police/dashboard" element={<PoliceDashboard />} />
              <Route path="/police/all-firs" element={<AllFIRs />} />
              <Route path="/police/fir/:id" element={<PoliceFIRDetails />} />
              <Route path="/police/file-fir" element={<PoliceFileFIR />} />
              <Route path="/police/interrogation" element={<Interrogation />} />
              <Route path="/police/interrogation/new" element={<NewInterrogation />} />
              <Route path="/police/interrogation/:id" element={<InterrogationDetails />} />
              
              {/* Admin routes will be added in the future */}
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
