import React, { useRef, useState, useEffect } from 'react';
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
    </>
  );
};

export default MainLayout;
