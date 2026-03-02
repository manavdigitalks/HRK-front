"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Button } from "./ui/button";

const navigation = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Products", path: "/products", icon: Package },
  { name: "Size Master", path: "/size-master", icon: Ruler },
  { name: "Customers", path: "/customers", icon: UserCircle },
  { name: "Users & Roles", path: "/users", icon: Users },
  { name: "Stock Entry", path: "/stock-entry", icon: PackagePlus },
  { name: "Billing", path: "/billing", icon: ShoppingCart },
  { name: "Returns", path: "/returns", icon: RefreshCw },
  { name: "Sales Orders", path: "/sales-orders", icon: FileText },
  { name: "Purchase Orders", path: "/purchase-orders", icon: ShoppingBag },
  { name: "Reports", path: "/reports", icon: BarChart3 },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    router.push("/login");
  };

  const isActive = (path: string) => pathname === path;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-gradient-to-b from-indigo-900 to-indigo-800 text-white">
        <div className="flex items-center justify-center h-16 px-4 bg-indigo-950">
          <h1 className="text-xl font-bold">RetailPro POS</h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center px-3 py-2.5 text-sm rounded-lg transition-colors ${
                isActive(item.path)
                  ? "bg-white/20 text-white font-medium"
                  : "text-indigo-100 hover:bg-white/10"
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-indigo-700">
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

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-indigo-900 to-indigo-800 text-white">
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
            <nav className="px-3 py-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-3 py-2.5 text-sm rounded-lg transition-colors ${
                    isActive(item.path)
                      ? "bg-white/20 text-white font-medium"
                      : "text-indigo-100 hover:bg-white/10"
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
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
        <header className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>
          <div className="flex items-center space-x-4 ml-auto">
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
              <span>Welcome, Admin</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
