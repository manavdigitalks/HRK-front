"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Ruler,
  Users,
  PackagePlus,
  ShoppingCart,
  RefreshCw,
  FileText,
  ShoppingBag,
  BarChart3,
  LogOut,
  Menu,
  X,
  UserCircle,
  Truck,
  Settings,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "./ui/button";

const navigation = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Products", path: "/products", icon: Package },
  { name: "Stock Entry", path: "/stock-entry", icon: PackagePlus },
  { name: "Customers", path: "/customers", icon: UserCircle },
  { name: "Billing", path: "/billing", icon: ShoppingCart },
  { name: "Returns", path: "/returns", icon: RefreshCw },
  { name: "Sales Orders", path: "/sales-orders", icon: FileText },
  { name: "Purchase Orders", path: "/purchase-orders", icon: ShoppingBag },
  { name: "Reports", path: "/reports", icon: BarChart3 },
  {
    name: "Settings",
    icon: Settings,
    children: [
      { name: "Size Master", path: "/size-master", icon: Ruler },
      { name: "Category Master", path: "/category-master", icon: Package },
      { name: "Transport Master", path: "/transport-master", icon: Truck },
      { name: "Users & Roles", path: "/users", icon: Users },
    ],
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Auto-expand settings if child is active
  useEffect(() => {
    const settingsItem = navigation.find((n) => n.name === "Settings");
    const isChildActive = settingsItem?.children?.some((c) => pathname === c.path);
    if (isChildActive) {
      setSettingsOpen(true);
    }
  }, [pathname]);

  const handleLogout = () => {
    router.push("/login");
  };

  const isActive = (path: string) => pathname === path;
  const isParentActive = (item: any) => {
    if (item.children) {
      return item.children.some((child: any) => pathname === child.path);
    }
    return pathname === item.path;
  };

  const NavLink = ({ item, isChild = false }: { item: any; isChild?: boolean }) => {
    if (item.children) {
      return (
        <div className="space-y-1">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-colors ${
              isParentActive(item)
                ? "bg-white/20 text-white font-medium"
                : "text-indigo-100 hover:bg-white/10"
            }`}
          >
            <div className="flex items-center">
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </div>
            {settingsOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {settingsOpen && (
            <div className="pl-4 space-y-1 mt-1 transition-all duration-300">
              {item.children.map((child: any) => (
                <NavLink key={child.path} item={child} isChild={true} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.path}
        href={item.path}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
          isActive(item.path)
            ? "bg-white/20 text-white font-medium"
            : "text-indigo-100 hover:bg-white/10"
        } ${isChild ? "py-2 text-[13px]" : "py-2.5"}`}
      >
        <item.icon className={`mr-3 ${isChild ? "w-4 h-4" : "w-5 h-5"}`} />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-gradient-to-b from-indigo-900 to-indigo-800 text-white shadow-xl">
        <div className="flex items-center justify-center h-16 px-4 bg-indigo-950/50 backdrop-blur-sm">
          <h1 className="text-xl font-bold tracking-tight">HRK </h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
          {navigation.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </nav>
        <div className="p-4 border-t border-indigo-700/50">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-indigo-100 hover:bg-white/10 hover:text-white transition-all group"
          >
            <LogOut className="w-5 h-5 mr-3 group-hover:translate-x-1 transition-transform" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-indigo-900 to-indigo-800 text-white shadow-2xl">
            <div className="flex items-center justify-between h-16 px-4 bg-indigo-950">
              <h1 className="text-xl font-bold">RetailPro POS</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <nav className="px-3 py-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => (
                <NavLink key={item.name} item={item} />
              ))}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-indigo-700">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start text-indigo-100 hover:bg-white/10 hover:text-white"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 lg:px-6 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </Button>
          <div className="flex items-center space-x-4 ml-auto">
            <div className="hidden sm:flex items-center space-x-3 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
              <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                AD
              </div>
              <span className="text-sm font-medium text-gray-700">Admin Panel</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 h-full">{children}</main>
      </div>
    </div>
  );
}

export default Layout;

