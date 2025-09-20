import { createBrowserRouter } from "react-router-dom";
import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import ChatPage from "../pages/ChatPage";
import App from "../App";

export const router = createBrowserRouter([
  { path: "/", element: <SignIn /> },
  { path: "/signup", element: <SignUp /> },
  { path: "/app", element: <App />, children: [
    { path: "", element: <ChatPage /> },
  ]},
]);
