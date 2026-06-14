import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Search from './pages/Search';
import PlaylistDetail from './pages/PlaylistDetail';
import AlbumDetail from './pages/AlbumDetail';
import LikedSongs from './pages/LikedSongs';
import ArtistDetail from './pages/ArtistDetail';
import ArtistDashboard from './pages/ArtistDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Home />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/search" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Search />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/playlist/:id" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PlaylistDetail />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/album/:id" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AlbumDetail />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/liked" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <LikedSongs />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/artist/:id" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ArtistDetail />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/artist/dashboard" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ArtistDashboard />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
