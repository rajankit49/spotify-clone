import React from 'react';
import { Bell, Zap, Volume2, Users, Video, Check } from 'lucide-react';
import '../styles/layout.css';

const Premium = () => {
  const plans = [
    {
      name: 'Mini',
      price: '₹7',
      duration: 'for 1 day',
      features: [
        '1 mobile-only account',
        '30 songs download on 1 device',
        'Ad-free music on mobile'
      ],
      buttonText: 'Get Premium Mini',
      color: '#ffd23f'
    },
    {
      name: 'Individual',
      price: '₹119',
      duration: 'for 1 month',
      popular: true,
      features: [
        '1 Premium account',
        'Ad-free music listening',
        'Download 10,000 songs/device on 5 devices',
        'Group Session (listen with friends)'
      ],
      buttonText: 'Get Premium Individual',
      color: 'var(--spotify-green)'
    },
    {
      name: 'Duo',
      price: '₹149',
      duration: 'for 1 month',
      features: [
        '2 Premium accounts',
        'For couples under one roof',
        'Ad-free music listening',
        'Download 10,000 songs/device'
      ],
      buttonText: 'Get Premium Duo',
      color: '#3f8efd'
    },
    {
      name: 'Family',
      price: '₹179',
      duration: 'for 1 month',
      features: [
        'Up to 6 Premium accounts',
        'For family members under one roof',
        'Block explicit music',
        'Ad-free music listening'
      ],
      buttonText: 'Get Premium Family',
      color: '#b53ffd'
    }
  ];

  return (
    <div className="premium-page-container">
      {/* Ambient background glow */}
      <div className="premium-glow" />

      {/* Header / Hero */}
      <div className="premium-hero">
        {/* Spotify Custom SVG Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.892-.982-.336.076-.67-.135-.746-.472-.076-.336.136-.67.472-.746 3.856-.88 7.15-.502 9.814 1.13.295.18.387.563.212.863zm1.223-2.723c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.082-1.182-.413.125-.85-.107-.975-.52-.125-.413.107-.85.52-.975 3.678-1.116 8.243-.574 11.35 1.337.368.226.488.707.26 1.08zm.105-2.835C14.59 8.87 9.1 8.686 5.918 9.652c-.49.148-1.008-.13-1.157-.62-.148-.49.13-1.008.62-1.157 3.66-1.11 9.7-8.9 13.567-2.61.442.263.585.836.322 1.28-.263.442-.836.585-1.28.322z" />
          </svg>
          <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Premium</span>
        </div>

        <h1 className="premium-hero-title">
          Get more out of your music with Premium Standard.
        </h1>

        {/* Bell Notice */}
        <div className="premium-bell-notice">
          <Bell size={16} className="shake-animation" />
          <span>Offer ends in 7 days</span>
        </div>

        <button className="premium-hero-btn">
          Get started
        </button>
      </div>

      {/* Features List */}
      <section className="premium-section">
        <h2 className="premium-section-title">Why join Premium Standard?</h2>
        <div className="premium-features-list">
          <div className="premium-feature-item">
            <Zap size={22} style={{ color: 'var(--spotify-green)' }} />
            <div className="feature-text-group">
              <span className="feature-title">Ad-free music listening</span>
              <span className="feature-desc">Enjoy uninterrupted music without any commercial breaks.</span>
            </div>
          </div>
          <div className="premium-feature-item">
            <Volume2 size={22} style={{ color: 'var(--spotify-green)' }} />
            <div className="feature-text-group">
              <span className="feature-title">Very high audio quality</span>
              <span className="feature-desc">Listen to lossless 320kbps music for crystal clear acoustics.</span>
            </div>
          </div>
          <div className="premium-feature-item">
            <Users size={22} style={{ color: 'var(--spotify-green)' }} />
            <div className="feature-text-group">
              <span className="feature-title">Listen with friends in real time</span>
              <span className="feature-desc">Start a Jam session to sync audio streams together.</span>
            </div>
          </div>
          <div className="premium-feature-item">
            <Video size={22} style={{ color: 'var(--spotify-green)' }} />
            <div className="feature-text-group">
              <span className="feature-title">Watch uninterrupted music videos</span>
              <span className="feature-desc">Stream matching high-definition videos with zero buffer.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="premium-section">
        <h2 className="premium-section-title">Available plans</h2>
        <div className="premium-plans-grid">
          {plans.map((plan, idx) => (
            <div key={idx} className={`premium-plan-card ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && <span className="popular-badge">Most Popular</span>}
              <h3 className="plan-name">{plan.name}</h3>
              <div className="plan-price-row">
                <span className="plan-price">{plan.price}</span>
                <span className="plan-duration"> / {plan.duration}</span>
              </div>
              <ul className="plan-features-list">
                {plan.features.map((feat, fIdx) => (
                  <li key={fIdx}>
                    <Check size={14} className="check-icon" style={{ color: plan.color }} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <button 
                className="plan-btn" 
                style={{ backgroundColor: plan.color, color: plan.color === '#ffd23f' || plan.color === 'var(--spotify-green)' ? '#000' : '#fff' }}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Premium;
