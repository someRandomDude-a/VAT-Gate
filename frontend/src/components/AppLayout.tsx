import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { LayoutDashboard, BarChart3, Package, Route, Info, LogOut, Shield, Menu, X, Sun, Moon, Settings, Flag, Check } from "lucide-react";
import { useEffect, useState } from "react";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout, updateName } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || "");
  const [nameSaved, setNameSaved] = useState(false);

  // Keep the editable name field in sync when auth state changes
  // (e.g. immediately after login) to avoid stale/empty state.
  useEffect(() => {
    setNameInput(user?.name || "");
  }, [user?.name]);

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/tracking", label: "Package Tracking", icon: Package },
    { to: "/route-planner", label: "Route Planner", icon: Route },
    { to: "/vat-analysis", label: "VAT Analysis", icon: BarChart3 },
    { to: "/india", label: "India", icon: Flag },
    { to: "/about", label: "About", icon: Info },
  ];

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === user?.name) return;
    updateName(trimmed);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  // Guard against runtime crashes if `user` exists but `name` is
  // temporarily undefined during hydration.
  const initials = user?.name?.split(" ").map((n) => n[0]).join("") || "?";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-sidebar-border">
          <Shield className="h-7 w-7 text-sidebar-primary" />
          <span className="text-lg font-bold tracking-tight text-sidebar-primary-foreground">VATGuard</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
                {link.to === "/india" && (
                  <span className="ml-auto text-[10px] font-semibold bg-sidebar-primary/20 text-sidebar-primary px-1.5 py-0.5 rounded-full">Soon</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-sidebar-border space-y-2">
          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>

          {/* Account */}
          <button
            onClick={() => { setShowAccount(true); setNameInput(user?.name || ""); setNameSaved(false); }}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold text-sidebar-primary shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium truncate text-sidebar-foreground">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{user?.role}</p>
            </div>
            <Settings className="h-3.5 w-3.5 text-sidebar-foreground/50" />
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-accent" />
            <span className="font-bold text-foreground">VATGuard</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-foreground">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </header>

        {mobileOpen && (
          <div className="lg:hidden bg-card border-b border-border px-4 py-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                  location.pathname === link.to ? "bg-accent/10 text-accent font-medium" : "text-muted-foreground"
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
                {link.to === "/india" && <span className="ml-auto text-[10px] font-semibold bg-accent/10 text-accent px-1.5 py-0.5 rounded-full">Soon</span>}
              </Link>
            ))}
            <button
              onClick={() => { setShowAccount(true); setMobileOpen(false); setNameInput(user?.name || ""); }}
              className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground w-full"
            >
              <Settings className="h-4 w-4" />
              Account Settings
            </button>
            <button
              onClick={() => { logout(); setMobileOpen(false); }}
              className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground w-full"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        )}

        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>

      {/* Account Settings Modal */}
      {showAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm shadow-xl animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-foreground">Account Settings</h2>
              <button onClick={() => setShowAccount(false)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Avatar */}
            <div className="flex justify-center mb-5">
              <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center text-2xl font-bold text-accent">
                {nameInput.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Display Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => { setNameInput(e.target.value); setNameSaved(false); }}
                  maxLength={60}
                  placeholder="Your name"
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-muted/50 text-sm text-muted-foreground cursor-not-allowed"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Email cannot be changed in demo mode</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Role</label>
                <div className="px-3 py-2.5 rounded-lg border border-input bg-muted/50 text-sm text-muted-foreground capitalize">
                  {user?.role}
                </div>
              </div>

              {nameSaved && (
                <div className="flex items-center gap-2 text-xs text-risk-low bg-risk-low-bg rounded-lg px-3 py-2">
                  <Check className="h-3.5 w-3.5" />
                  Name updated successfully!
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowAccount(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveName}
                  disabled={!nameInput.trim() || nameInput.trim() === user?.name}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppLayout;
