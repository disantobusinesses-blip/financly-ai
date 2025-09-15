

import React, { useState, useEffect } from 'react';
import { HomeIcon, ChartIcon, CardIcon, LogoutIcon, LoanIcon, TargetIcon, WarningIcon, TrendingUpIcon, BriefcaseIcon } from './icon/Icon';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { icon: <HomeIcon />, name: 'Overview', href: '#overview' },
  { icon: <TrendingUpIcon />, name: 'Forecast', href: '#spending-forecast' },
  { icon: <WarningIcon />, name: 'Alerts', href: '#alerts' },
  { icon: <TargetIcon />, name: 'Financial Plan', href: '#financial-plan' },
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
    <aside className="hidden md:flex w-64 flex-shrink-0 bg-sidebar-bg border-r border-border-color flex-col">
      <div className="h-20 flex items-center px-6">
        <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path