import { Routes, Route, Navigate } from "react-router-dom";
import SignIn from "@/pages/auth/SignIn";
import SignUp from "@/pages/auth/SignUp";
import Forgot from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import AppLayout from "@/components/layout/AppLayout";
import ChatPage from "@/pages/ChatPage";
import Profile from "@/pages/Profile";
import SettingsPage from "@/pages/Settings";
import useSupabaseRedirect from "@/hooks/useSupabaseRedirect";
import { isBypassAuthEnabled } from "@/dev/bypass";

export default function App() {
  useSupabaseRedirect();

  const defaultAppRoute = isBypassAuthEnabled ? "/app" : "/signin";

  return (
    <Routes>
      <Route path="/" element={<Navigate to={defaultAppRoute} replace />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot" element={<Forgot />} />
      <Route path="/reset" element={<ResetPassword />} />

      <Route element={<AppLayout />}>
        <Route path="app" element={<ChatPage />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to={defaultAppRoute} replace />} />
    </Routes>
  );
}
