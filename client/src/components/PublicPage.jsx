import { LogIn, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import Button from './Button.jsx';

export default function PublicPage({ mode, onModeChange, onSubmit, onGuest, error, busy }) {
  const isSignup = mode === 'signup';
  const showForm = mode === 'signin' || mode === 'signup';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit({ username: username.trim(), password, mode });
  }

  return (
    <main className="public-page">
      <section className="public-panel">
        <h1>Instigator</h1>
        <p>Start the thought. Post the update. Keep the timeline moving.</p>

        {!showForm ? (
          <div className="public-actions">
            <Button icon={LogIn} onClick={() => onModeChange('signin')}>
              Sign in
            </Button>
            <Button icon={UserPlus} variant="secondary" onClick={() => onModeChange('signup')}>
              Create account
            </Button>
            <Button icon={Users} variant="soft" onClick={onGuest} disabled={busy}>
              Continue as guest
            </Button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-heading">
              <h2>{isSignup ? 'Create account' : 'Welcome back'}</h2>
              <button type="button" onClick={() => onModeChange('landing')}>
                Back
              </button>
            </div>
            <label>
              <span>Username</span>
              <input
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                maxLength="50"
                required
              />
            </label>
            <label>
              <span>Password</span>
              <input
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <Button type="submit" disabled={busy}>
              {isSignup ? 'Sign up' : 'Sign in'}
            </Button>
            <button
              className="switch-auth"
              type="button"
              onClick={() => onModeChange(isSignup ? 'signin' : 'signup')}
            >
              {isSignup ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
            <Button icon={Users} variant="soft" onClick={onGuest} disabled={busy}>
              Continue as guest
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
