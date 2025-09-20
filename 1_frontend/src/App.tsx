import { Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ChatPage from "./pages/ChatPage";
import Forgot from "./pages/ForgotPassword";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signin" />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot" element={<Forgot />} />
      <Route path="/app" element={<ChatPage />} />
      <Route path="*" element={<Navigate to="/signin" />} />
    </Routes>
  );
}
