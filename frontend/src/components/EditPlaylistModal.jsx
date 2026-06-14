import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { updatePlaylist } from '../services/playlistService';
import { toast } from 'react-hot-toast';

const EditPlaylistModal = ({ isOpen, onClose, playlist, onUpdate }) => {
  const [title, setTitle] = useState(playlist?.title || '');
  const [description, setDescription] = useState(playlist?.description || '');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(playlist?.coverImage || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setLoading(false);
    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    if (imageFile) {
      formData.append('coverImage', imageFile);
    }

    setLoading(true);
    try {
      const updated = await updatePlaylist(playlist._id, formData);
      if (updated) {
        toast.success('Playlist updated successfully!');
        onUpdate(updated);
        onClose();
      } else {
        toast.error('Failed to update playlist details.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while saving.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: '#282828',
        borderRadius: '8px',
        width: '500px',
        maxWidth: '90%',
        padding: '24px',
        position: 'relative',
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        border: '1px solid #3e3e3e'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff', margin: 0 }}>Edit details</h2>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#a7a7a7', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = '#a7a7a7'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '20px' }}>
          {/* Image Upload Area */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <label style={{
              width: '160px',
              height: '160px',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer',
              backgroundColor: '#181818',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #333'
            }}>
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#a7a7a7', gap: '8px' }}>
                  <Upload size={24} />
                  <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Choose image</span>
                </div>
              )}
              {/* Overlay on hover */}
              <div 
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  opacity: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  transition: 'opacity 0.2s',
                  flexDirection: 'column',
                  gap: '8px'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}
              >
                <Upload size={20} />
                <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Change photo</span>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                style={{ display: 'none' }} 
              />
            </label>
            <span style={{ fontSize: '0.65rem', color: '#a7a7a7', textAlign: 'center', maxWidth: '160px' }}>
              We support JPEG and PNG images.
            </span>
          </div>

          {/* Text Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#fff' }}>Name</label>
              <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Add a name"
                style={{
                  backgroundColor: '#3e3e3e',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '10px',
                  color: '#fff',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#fff' }}>Description</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add an optional description"
                style={{
                  backgroundColor: '#3e3e3e',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '10px',
                  color: '#fff',
                  fontSize: '0.875rem',
                  outline: 'none',
                  resize: 'none',
                  flex: 1,
                  minHeight: '80px'
                }}
              />
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button 
                type="submit" 
                disabled={loading}
                style={{
                  backgroundColor: '#fff',
                  color: '#000',
                  border: 'none',
                  borderRadius: '500px',
                  padding: '10px 24px',
                  fontWeight: '700',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'transform 0.1s',
                  opacity: loading ? 0.7 : 1
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1.0)'}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPlaylistModal;
