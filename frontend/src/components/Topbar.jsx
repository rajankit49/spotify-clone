import React, { useContext, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, User, Home, Search } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/layout.css';

const Topbar = ({ isScrolled }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [searchVal, setSearchVal] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Sync input value with URL search parameter
  useEffect(() => {
    if (location.pathname === '/search') {
      const q = new URLSearchParams(location.search).get('q') || '';
      setSearchVal(q);
    } else {
      setSearchVal('');
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchVal(val);
    navigate(`/search?q=${encodeURIComponent(val)}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isSearchPage = location.pathname === '/search';

  return (
    <div className={`topbar ${isScrolled ? 'scrolled' : ''}`}>
      {/* Click-outside backdrop to close dropdown */}
      {showDropdown && (
        <div 
          onClick={() => setShowDropdown(false)} 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} 
        />
      )}

      {/* LEFT — Navigation Arrows */}
      <div className="topbar-nav" style={{ flex: '0 0 auto' }}>
        <button className="nav-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <button className="nav-btn" onClick={() => navigate(1)}>
          <ChevronRight size={24} />
        </button>
      </div>

      {/* CENTER — Home & Search Controls */}
      {!isMobile && (
        <div className={`topbar-center ${isSearchPage ? 'on-search' : ''}`} style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          flex: '0 1 auto', 
          justifyContent: 'center', 
          maxWidth: '480px', 
          margin: '0 16px' 
        }}>
          <button 
            className="nav-btn" 
            onClick={() => navigate('/')} 
            title="Home"
            style={{
              backgroundColor: location.pathname === '/' ? '#242424' : 'rgba(0,0,0,0.7)',
              color: location.pathname === '/' ? 'var(--spotify-green)' : '#fff',
              flexShrink: 0
            }}
          >
            <Home size={20} />
          </button>
          
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            width: '100%'
          }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-subdued)', pointerEvents: 'none' }} />
            <input 
              type="text" 
              placeholder="What do you want to play?"
              value={searchVal}
              onChange={handleSearchChange}
              onFocus={() => {
                if (location.pathname !== '/search') {
                  navigate(`/search?q=${encodeURIComponent(searchVal)}`);
                }
              }}
              style={{
                width: '100%',
                backgroundColor: '#242424',
                border: 'none',
                borderRadius: '500px',
                padding: '10px 16px 10px 44px',
                color: 'var(--text-base)',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'background-color 0.2s'
              }}
              className="topbar-search-input"
            />
          </div>
        </div>
      )}

      {/* RIGHT — Profile & Dashboard Controls */}
      <div className="topbar-profile" style={{ flex: '0 0 auto', position: 'relative', zIndex: 999 }}>
        {/* Clickable profile icon */}
        <div 
          className="profile-icon" 
          onClick={() => setShowDropdown(prev => !prev)}
          style={{ cursor: 'pointer', userSelect: 'none' }}
          title={user?.username || "Account"}
        >
          {user?.username ? user.username.charAt(0).toUpperCase() : <User size={20} />}
        </div>

        {/* Profile Dropdown Menu */}
        {showDropdown && (
          <div className="profile-dropdown">
            <div className="dropdown-info-item">
              Logged in as <strong style={{ color: '#fff' }}>{user?.username}</strong>
            </div>
            
            {user?.role === 'artist' && (
              <div 
                className="dropdown-item" 
                onClick={() => { navigate('/artist/dashboard'); setShowDropdown(false); }}
                style={{ color: 'var(--spotify-green)', fontWeight: '700' }}
              >
                Artist Dashboard
              </div>
            )}
            
            {user?.role === 'admin' && (
              <div 
                className="dropdown-item" 
                onClick={() => { navigate('/admin/dashboard'); setShowDropdown(false); }}
                style={{ color: '#e2b13c', fontWeight: '700' }}
              >
                Admin Panel
              </div>
            )}
            
            <div className="dropdown-item logout" onClick={handleLogout} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              Log out
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Topbar;
