import React, { useState, useEffect } from 'react';
// FIX: Add BriefcaseIcon for the new Investments link.
import { HomeIcon, ChartIcon, CardIcon, LogoutIcon, LoanIcon, TargetIcon, WarningIcon, TrendingUpIcon, BriefcaseIcon } from './icon/Icon';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { icon: <HomeIcon />, name: 'Overview', href: '#overview' },
  { icon: <TrendingUpIcon />, name: 'Forecast', href: '#spending-forecast' },
  { icon: <WarningIcon />, name: 'Alerts', href: '#alerts' },
  { icon: <TargetIcon />, name: 'Financial Plan', href: '#financial-plan' },
  // FIX: Added 'Investments' link to match new dashboard section.
  { icon: <BriefcaseIcon />, name: 'Investments', href: '#investment-advisor' },
  { icon: <LoanIcon />, name: 'Borrowing Power', href: '#borrowing-power' },
  { icon: <CardIcon />, name: 'Accounts', href: '#accounts-overview' },
  { icon: <ChartIcon />, name: 'Transactions', href: '#transactions' },
];

const Sidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState('#overview');
  const { logout } = useAuth();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = `#${entry.target.id}`;
            if(navItems.some(item => item.href === id)){
                setActiveTab(id);
                window.history.replaceState(null, '', id);
            }
          }
        });
      },
      { rootMargin: '-30% 0px -70% 0px', threshold: 0 }
    );

    const sections = Array.from(document.querySelectorAll(navItems.map(item => item.href).join(', ')));
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const id = href.substring(1);
    const element = document.getElementById(id);
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', href);
      setActiveTab(href);
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-sidebar-bg border-r border-border-color flex flex-col">
      <div className="h-20 flex items-center px-6">
        <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a8 8 0 00-8 8c0 4.418 3.582 8 8 8s8-3.582 8-8-3.582-8-8-8zm-1.5 6a1.5 1.5 0 00-3 0v2a1.5 1.5 0 003 0v-2zm3-1.5a1.5 1.5 0 011.5 1.5v4.5a1.5 1.5 0 01-3 0V9a1.5 1.5 0 011.5-1.5z" clipRule="evenodd" />
            </svg>
            <span className="font-extrabold text-2xl text-text-primary">Financly</span>
        </div>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => (
          <a
            key={item.name}
            href={item.href}
            onClick={(e) => handleNavClick(e, item.href)}
            className={`flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors duration-200 ${
              activeTab === item.href
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <div className="w-6 h-6 mr-3">{item.icon}</div>
            {item.name}
          </a>
        ))}
      </nav>
      <div className="px-4 py-4">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-2.5 text-sm font-semibold text-text-secondary rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <LogoutIcon className="w-6 h-6 mr-3" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;