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

  // Sync input value with URL search parameter
  useEffect(() => {
    if (location.pathname === '/search') {
      const q = new URLSearchParams(location.search).get('q') || '';
      setSearchVal(q);
    } else {
      setSearchVal('');
    }
  }, [location.pathname, location.search]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchVal(val);
    navigate(`/search?q=${encodeURIComponent(val)}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`topbar ${isScrolled ? 'scrolled' : ''}`}>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 auto', justifyContent: 'center', maxWidth: '480px', margin: '0 16px' }}>
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
          flex: 1
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

      {/* RIGHT — Profile & Dashboard Controls */}
      <div className="topbar-profile" style={{ flex: '0 0 auto' }}>
        {user?.role === 'artist' && (
          <button 
            className="logout-btn" 
            style={{ marginRight: '8px', backgroundColor: 'var(--spotify-green)', color: '#000', border: 'none' }} 
            onClick={() => navigate('/artist/dashboard')}
          >
            Artist Dashboard
          </button>
        )}
        <button className="logout-btn" onClick={handleLogout}>Log out</button>
        <div className="profile-icon">
          {user?.username ? user.username.charAt(0).toUpperCase() : <User size={20} />}
        </div>
      </div>
    </div>
  );
};

export default Topbar;
