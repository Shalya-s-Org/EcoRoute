import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Cpu, CalendarClock, BarChart3, Settings, ScrollText, Leaf,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/devices', icon: Cpu, label: 'Devices' },
  { to: '/schedule', icon: CalendarClock, label: 'Schedule' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/logs', icon: ScrollText, label: 'Agent Log' },
];

export default function Sidebar({ agentStatus, gridSource }) {
  const statusColor = agentStatus === 'idle' ? 'online' : agentStatus === 'running' ? 'warning' : 'offline';
  const gridColor = gridSource === 'live' ? 'online' : gridSource === 'cache' ? 'warning' : 'offline';

  return (
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Leaf size={20} color="#fff" />
        </div>
        <div className="sidebar-logo-text">
          <h1>EcoRoute</h1>
          <p>Energy Optimizer</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Navigation</span>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            id={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-status">
          <div className={`status-dot ${statusColor}`} />
          <div className="status-text">
            <strong>Agent {agentStatus === 'idle' ? 'Ready' : agentStatus === 'running' ? 'Running' : 'Starting'}</strong>
            Grid: {gridSource || 'connecting'}
          </div>
        </div>
      </div>
    </aside>
  );
}
