import { NavLink, Outlet } from 'react-router-dom';
import { FlaskConical, CalendarCheck, Brain, TrendingUp, Snowflake } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Setup', icon: FlaskConical },
  { to: '/plan', label: 'Plan', icon: CalendarCheck },
  { to: '/quiz', label: 'Quiz', icon: Brain },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
] as const;

function NavLinkItem({ to, label, icon: Icon }: { to: string; label: string; icon: typeof FlaskConical }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-primary/15 text-primary-light shadow-sm'
            : 'text-muted hover:bg-hover hover:text-foreground'
        }`
      }
    >
      <Icon size={18} />
      <span className="hidden sm:inline">{label}</span>
    </NavLink>
  );
}

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-bg">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 inset-x-0 z-30 bg-bg/90 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Snowflake size={18} className="text-primary" />
              </div>
              <span className="text-base font-bold text-foreground tracking-tight">IceCold Sprint</span>
            </div>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <NavLinkItem key={item.to} {...item} />
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pt-14 pb-20 md:pb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-bg-card border-t border-border">
        <div className="flex items-center justify-around px-2 py-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md text-[10px] font-medium transition-all duration-150 min-w-0 ${
                  isActive
                    ? 'text-primary-light'
                    : 'text-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} className={isActive ? 'text-primary' : ''} />
                  <span className="truncate">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}