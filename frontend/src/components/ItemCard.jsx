import React from 'react';
import { Play, Plus } from 'lucide-react';
import '../styles/home.css';

const cleanHTML = (str) => {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
};

const ItemCard = ({ image, title, subtitle, onClick, onAddClick, showAddButton = false }) => {
  const getCoverImage = () => {
    if (image) return image;
    const titleLower = (title || "").toLowerCase();
    if (titleLower.includes("shiv") || titleLower.includes("guru") || titleLower.includes("mahadev")) {
      return "/shiva.png";
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=random&color=fff&size=400&font-size=0.3`;
  };

  return (
    <div className="item-card" onClick={onClick}>
      <div className="item-image-container">
        <div className="item-image" style={{ 
          backgroundImage: `url(${getCoverImage()})` 
        }}></div>
        {showAddButton && onAddClick && (
          <button 
            className="item-add-btn" 
            onClick={(e) => {
              e.stopPropagation();
              onAddClick();
            }}
            title="Add to Playlist"
          >
            <Plus size={20} fill="currentColor" />
          </button>
        )}
        <button className="item-play-btn" onClick={(e) => {
        }}>
          <Play size={24} fill="currentColor" />
        </button>
      </div>
      <div className="item-details">
        <h3 className="item-title" title={cleanHTML(title)}>
          {cleanHTML(title)}
        </h3>
        {subtitle && (
          <p className="item-subtitle" title={cleanHTML(subtitle)}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: 'var(--text-subdued)',
              fontSize: '0.75rem',
              fontWeight: '500',
            }}>
              {/* Music note prefix so it reads as: "♪ Pawan Singh" */}
              <span style={{ color: 'var(--spotify-green)', fontSize: '0.7rem' }}>♪</span>
              {cleanHTML(subtitle)}
            </span>
          </p>
        )}
      </div>
    </div>
  );
};

export default ItemCard;

