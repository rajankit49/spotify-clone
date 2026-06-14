import React from 'react';
import { Play, Plus } from 'lucide-react';
import '../styles/home.css';

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
              e.stopPropagation(); // prevent triggering the card's onClick
              onAddClick();
            }}
            title="Add to Playlist"
          >
            <Plus size={20} fill="currentColor" />
          </button>
        )}
        <button className="item-play-btn" onClick={(e) => {
          // If we click play specifically, we don't need to stop propagation 
          // because it will bubble to the card and trigger onClick anyway, 
          // but we can stop it and call onClick explicitly if preferred.
        }}>
          <Play size={24} fill="currentColor" />
        </button>
      </div>
      <div className="item-details">
        <h3 className="item-title">{title}</h3>
        <p className="item-subtitle">{subtitle}</p>
      </div>
    </div>
  );
};

export default ItemCard;
