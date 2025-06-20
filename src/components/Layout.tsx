import { type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  FileText,
  MessageSquare,
  Network,
  History,
  Scale,
} from "lucide-react";
import { cn } from "../lib/utils";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { to: "/", icon: Home, label: "Dashboard" },
  { to: "/documents", icon: FileText, label: "Documents" },
  { to: "/legal-memory", icon: MessageSquare, label: "Legal Memory" },
  { to: "/relationships", icon: Network, label: "Relationships" },
  { to: "/changes", icon: History, label: "Changes" },
];

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="flex items-center gap-2">
              <Scale className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Legal Memory
              </h1>
            </div>
          </div>

          <nav className="px-4 pb-4">
            <ul className="space-y-1">
              {navItems.map(({ to, icon: Icon, label }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      )
                    }
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
