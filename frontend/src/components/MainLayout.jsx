import React, { useRef, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Library, Plus } from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Player from './Player';
import RightSidebar from './RightSidebar';
import CreateMenuModal from './CreateMenuModal';

const MainLayout = ({ children }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const mainContentRef = useRef(null);

  useEffect(() => {
    const mainEl = mainContentRef.current;
    if (!mainEl) return;

    const handleScroll = () => {
      setIsScrolled(mainEl.scrollTop > 30);
    };

    mainEl.addEventListener('scroll', handleScroll);
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <Sidebar />
      {/* The main-content area receives the actual page components (Home, Search, etc.) */}
      <main ref={mainContentRef} className="main-content">
        <Topbar isScrolled={isScrolled} />
        {children}
      </main>
      <RightSidebar />
      <Player />
      
      {/* Mobile Bottom Navigation Bar (Hidden on desktop via CSS) */}
      <div className="mobile-nav">
        <NavLink to="/" end className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
          <Home size={22} />
          <span>Home</span>
        </NavLink>
        
        <NavLink to="/search" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
          <Search size={22} />
          <span>Search</span>
        </NavLink>
        
        <NavLink to="/liked" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
          <Library size={22} />
          <span>Your Library</span>
        </NavLink>

        <NavLink to="/premium" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.892-.982-.336.076-.67-.135-.746-.472-.076-.336.136-.67.472-.746 3.856-.88 7.15-.502 9.814 1.13.295.18.387.563.212.863zm1.223-2.723c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.082-1.182-.413.125-.85-.107-.975-.52-.125-.413.107-.85.52-.975 3.678-1.116 8.243-.574 11.35 1.337.368.226.488.707.26 1.08zm.105-2.835C14.59 8.87 9.1 8.686 5.918 9.652c-.49.148-1.008-.13-1.157-.62-.148-.49.13-1.008.62-1.157 3.66-1.11 9.7-8.9 13.567-2.61.442.263.585.836.322 1.28-.263.442-.836.585-1.28.322z" />
          </svg>
          <span>Premium</span>
        </NavLink>

        <button 
          onClick={() => setShowCreateMenu(true)} 
          className="mobile-nav-link"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none' }}
        >
          <Plus size={22} />
          <span>Create</span>
        </button>
      </div>

      {/* Slide-up bottom sheet modal */}
      <CreateMenuModal 
        isOpen={showCreateMenu} 
        onClose={() => setShowCreateMenu(false)} 
      />
    </>
  );
};

export default MainLayout;
