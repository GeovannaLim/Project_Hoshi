import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import SpaceBackground from "./SpaceBackground";

export default function HoshiLayout() {
  return (
    <div className="min-h-screen bg-background relative">
      <SpaceBackground />
      <Sidebar />
      <div className="ml-[64px] sm:ml-[240px] relative z-10 min-h-screen flex flex-col transition-all duration-300">
        <TopBar />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}