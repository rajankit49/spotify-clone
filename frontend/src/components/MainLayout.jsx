import React, { useRef, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Heart } from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Player from './Player';
import RightSidebar from './RightSidebar';

const MainLayout = ({ children }) => {
  const [isScrolled, setIsScrolled] = useState(false);
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
          <Heart size={22} />
          <span>Library</span>
        </NavLink>
      </div>
    </>
  );
};

export default MainLayout;
