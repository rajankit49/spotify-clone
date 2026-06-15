import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Users, Sparkles, X } from 'lucide-react';
import { createPlaylist } from '../services/playlistService';
import toast from 'react-hot-toast';
import '../styles/layout.css';

const CreateMenuModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCreateStandardPlaylist = async () => {
    const name = window.prompt("Enter playlist name:", "My Playlist");
    if (name && name.trim()) {
      try {
        const created = await createPlaylist(name.trim());
        if (created) {
          toast.success(`Playlist "${name}" created!`);
          navigate(`/playlist/${created._id}`);
          onClose();
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to create playlist");
      }
    }
  };

  const handleCreateCollaborativePlaylist = async () => {
    const name = window.prompt("Enter collaborative playlist name:", "Our Playlist");
    if (name && name.trim()) {
      try {
        const created = await createPlaylist(name.trim());
        if (created) {
          toast.success(`Collaborative playlist "${name}" created!`);
          // Navigate to the playlist detail page where collaborators can be added
          navigate(`/playlist/${created._id}`);
          onClose();
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to create collaborative playlist");
      }
    }
  };

  const handleCreateBlend = () => {
    toast.success("Blend session started! Share your library to blend tastes.");
    onClose();
  };

  return (
    <div className="create-modal-overlay" onClick={onClose}>
      <div 
        className="create-bottom-sheet" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Options List */}
        <div className="create-options-list">
          <div className="create-option-item" onClick={handleCreateStandardPlaylist}>
            <div className="option-icon-container">
              <Music size={24} />
            </div>
            <div className="option-text-container">
              <span className="option-title">Playlist</span>
              <span className="option-desc">Create a playlist with songs or episodes</span>
            </div>
          </div>

          <div className="create-option-item" onClick={handleCreateCollaborativePlaylist}>
            <div className="option-icon-container">
              <Users size={24} />
            </div>
            <div className="option-text-container">
              <span className="option-title">Collaborative playlist</span>
              <span className="option-desc">Create a playlist together with friends</span>
            </div>
          </div>

          <div className="create-option-item" onClick={handleCreateBlend}>
            <div className="option-icon-container">
              {/* Custom Blend Circles */}
              <div className="blend-icon-circles">
                <div className="circle-left" />
                <div className="circle-right" />
              </div>
            </div>
            <div className="option-text-container">
              <span className="option-title">Blend</span>
              <span className="option-desc">Combine your friends' tastes into a playlist</span>
            </div>
          </div>
        </div>

        {/* Circular close button on the bottom right as shown in original Spotify */}
        <div className="create-modal-close-wrapper">
          <button className="create-modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateMenuModal;
