import { LogIn, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import Button from './Button.jsx';

export default function PublicPage({ mode, onModeChange, onSubmit, onGuest, error, busy }) {
  const isSignup = mode === 'signup';
  const showForm = mode === 'signin' || mode === 'signup';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    await onSubmit({ username: username.trim(), password, mode });
  }

  return (
    <main className="public-page">
      <div className="public-left">
        <div className="public-left-inner">
          <div className="public-logo">✦</div>
          <h1 className="public-tagline">What's on<br />your mind?</h1>
          <p className="public-sub">Share thoughts. Follow timelines.<br />Connect with people.</p>
        </div>
      </div>

      <div className="public-right">
        <section className="public-panel">
          {!showForm ? (
            <>
              <div className="public-welcome">
                <h2>Get started</h2>
                <p>Sign in to your account or join as a guest.</p>
              </div>
              <div className="public-actions">
                <Button onClick={() => onModeChange('signin')}>Sign in</Button>
                <Button variant="secondary" onClick={() => onModeChange('signup')}>Create account</Button>
                <div className="public-divider"><span>or</span></div>
                <Button variant="soft" icon={Users} onClick={onGuest} disabled={busy}>
                  Continue as guest
                </Button>
                <p className="guest-note">Guest is a shared account — anyone can post as Guest.</p>
              </div>
            </>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-heading">
                <h2>{isSignup ? 'Create account' : 'Welcome back'}</h2>
                <button type="button" onClick={() => onModeChange('landing')}>← Back</button>
              </div>
              <label>
                <span>Username</span>
                <input
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength="50"
                  placeholder="Enter your username"
                  required
                />
              </label>
              <label>
                <span>Password</span>
                <input
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </label>
              {error ? <p className="form-error">{error}</p> : null}
              <Button type="submit" disabled={busy}>
                {isSignup ? 'Sign up' : 'Sign in'}
              </Button>
              <button className="switch-auth" type="button" onClick={() => onModeChange(isSignup ? 'signin' : 'signup')}>
                {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
              <div className="public-divider"><span>or</span></div>
              <Button variant="soft" icon={Users} onClick={onGuest} disabled={busy}>
                Continue as guest
              </Button>
              <p className="guest-note">Guest is a shared account — anyone can post as Guest.</p>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
