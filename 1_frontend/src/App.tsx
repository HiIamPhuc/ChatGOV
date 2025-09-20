import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";


export default function App() {
  return (
    <div className="h-screen grid md:grid-cols-[280px_1fr] grid-cols-1">
      <aside className="hidden md:block border-r">
        <Sidebar />
      </aside>
      <main className="flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
