import { Routes, Route, Navigate } from "react-router-dom";
import SignIn from "@/pages/auth/SignIn";
import SignUp from "@/pages/auth/SignUp";
import Forgot from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";

import AppLayout from "@/components/layout/AppLayout"; 
import ChatPage from "@/pages/ChatPage";
import Profile from "@/pages/Profile";
import SettingsPage from "@/pages/Settings";

export default function App() {
  return (
    <Routes>
      {/* ===== Auth (KHÔNG sidebar) ===== */}
      <Route path="/" element={<Navigate to="/signin" replace />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot" element={<Forgot />} />
      <Route path="/reset" element={<ResetPassword />} />

      {/* ===== App (CÓ sidebar) – dùng AppLayout bọc các trang nội bộ ===== */}
      <Route element={<AppLayout />}>
        {/* dùng đường dẫn TƯƠNG ĐỐI để đảm bảo chạy trong layout */}
        <Route path="app" element={<ChatPage />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  );
}
