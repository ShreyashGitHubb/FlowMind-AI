import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../components/AuthProvider';

jest.mock('../lib/firebase', () => ({
  auth: { currentUser: null },
  signInWithGoogle: jest.fn().mockResolvedValue({ user: { email: 'test@example.com' } }),
  signOut: jest.fn().mockResolvedValue(true),
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn((auth, cb) => {
    // Simulate loading completion immediately
    setTimeout(() => cb(null), 10);
    return jest.fn(); // unsubscribe mock
  }),
}));

const TestComponent = () => {
  const { user, loading, isOrganizer } = useAuth();
  
  if (loading) return <div data-testid="loading">Loading...</div>;
  if (!user) return <div data-testid="unauth">Unauthenticated</div>;
  
  return (
    <div>
      <div data-testid="auth">Authenticated</div>
      {isOrganizer && <div data-testid="organizer">Organizer Access Granted</div>}
    </div>
  );
};

describe('AuthProvider Flow Controls', () => {
  it('should initialize in a loading state before resolving unauthenticated', async () => {
    jest.useFakeTimers();
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initial render should be loading
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    
    // Advance timers so onAuthStateChanged cb fires
    await act(async () => {
      jest.runAllTimers();
    });

    expect(screen.getByTestId('unauth')).toBeInTheDocument();
  });
});
