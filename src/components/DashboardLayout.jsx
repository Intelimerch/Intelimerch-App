import { useState } from "react";
import {
  Outlet,
  NavLink,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  LayoutDashboard,
  Megaphone,
  Package,
  Gift,
  Tag,
  BarChart2,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";
import ScreenGuard from "./ScreenGuard";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/dashboard/products", label: "Products", icon: Package },
  { to: "/dashboard/perks", label: "Perks Library", icon: Gift },
  // { to: '/dashboard/tag-groups', label: 'Tag Groups', icon: Tag },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
  { to: "/dashboard/profile", label: "Profile", icon: User },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const adminAs = searchParams.get("adminAs");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ScreenGuard minWidth={768}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
          fixed lg:relative z-40 lg:z-auto h-full bg-white border-r border-gray-100 flex flex-col
          transition-all duration-300 shrink-0
          ${collapsed ? "w-16" : "w-52"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        >
          <div className="p-4 flex items-center justify-between border-b border-gray-50 min-h-[64px]">
            {!collapsed && <Logo />}
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="p-1.5 hover:bg-gray-100 rounded-lg hidden lg:flex items-center justify-center ml-auto"
            >
              <ChevronLeft
                size={16}
                className={`text-gray-400 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
              />
            </button>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg ml-auto"
            >
              <X size={16} className="text-gray-400" />
            </button>
          </div>

          <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium cursor-pointer
                  ${isActive ? "text-primary bg-primary-light" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}
                  ${collapsed ? "justify-center" : ""}`
                }
                title={collapsed ? label : undefined}
              >
                <Icon size={16} className="shrink-0" />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </nav>

          <div className="p-2 border-t border-gray-100">
            <button
              onClick={() => navigate("/signin")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all text-sm font-medium w-full ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? "Log out" : undefined}
            >
              <LogOut size={16} className="shrink-0" />
              {!collapsed && <span>Log out</span>}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top bar (mobile) */}
          <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-xl"
            >
              <Menu size={20} className="text-gray-600" />
            </button>
            <Logo />
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => navigate("/dashboard/notifications")}
                className="relative p-2 hover:bg-gray-100 rounded-xl"
              >
                <Bell size={18} className="text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
              </button>
            </div>
          </div>

          {adminAs && (
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between">
              <p className="text-sm text-amber-800 font-medium">
                🔒 <span className="font-bold">Admin View</span> — Viewing
                dashboard as{" "}
                <span className="text-primary font-bold">
                  {decodeURIComponent(adminAs)}
                </span>
              </p>
              <button
                onClick={() => navigate("/admin/creators")}
                className="text-xs text-amber-700 hover:text-amber-900 font-semibold border border-amber-300 rounded-lg px-3 py-1 hover:bg-amber-100 transition-all"
              >
                Exit Admin View
              </button>
            </div>
          )}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </ScreenGuard>
  );
}

function Logo() {
  return (
    <img
      src="/logo.png"
      alt="Intelimerch"
      className="h-14 w-auto object-contain"
    />
  );
}
