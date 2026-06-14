import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Disc } from 'lucide-react';
import '../styles/auth.css';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    const result = await register(username, email, password, 'user');
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <Disc size={32} color="var(--spotify-green)" />
          Spotify Clone
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label htmlFor="username">What should we call you?</label>
            <input 
              type="text" 
              id="username" 
              className="auth-input" 
              placeholder="Enter a profile name."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="email">What's your email?</label>
            <input 
              type="email" 
              id="email" 
              className="auth-input" 
              placeholder="Enter your email."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="auth-form-group">
            <label htmlFor="password">Create a password</label>
            <input 
              type="password" 
              id="password" 
              className="auth-input" 
              placeholder="Create a password."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button type="submit" className="auth-btn">Sign Up</button>
        </form>
        
        <div className="auth-link">
          Have an account? <Link to="/login">Log in.</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
