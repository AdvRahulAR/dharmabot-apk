import React, { useState } from 'react';
import { UserProfileType, User } from '../types';
import { registerUser, loginUser } from '../services/authService';
import { Header } from './Header';
import { Footer } from './Footer';

interface AuthViewProps {
  onAuthSuccess: (user: Omit<User, 'password'>) => void;
  onNavigateBack: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess, onNavigateBack }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState(''); // New state for phone number
  const [profileType, setProfileType] = useState<UserProfileType>(UserProfileType.CITIZEN);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (isLoginMode) {
      const result = loginUser(email, password);
      if (result.success && result.user) {
        setSuccessMessage(result.message);
        setTimeout(() => onAuthSuccess(result.user!), 1000);
      } else {
        setError(result.message);
      }
    } else {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      const result = registerUser(profileType, email, phone, password, confirmPassword);
      if (result.success && result.user) {
        setSuccessMessage(result.message + " Logging you in...");
        setTimeout(() => onAuthSuccess(result.user!), 1500);
      } else {
        setError(result.message);
      }
    }
  };

  const commonInputClass = "w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-slate-400 dark:placeholder-slate-500 text-sm";
  const commonLabelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-900">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-xl p-6 sm:p-8 md:p-10 border border-slate-200 dark:border-slate-700 w-full max-w-md animate-fade-in-scale-up">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-slate-800 dark:text-gray-100">
            {isLoginMode ? 'Login' : 'Sign Up'}
          </h2>

          {error && <div className="mb-4 p-3 bg-red-100 dark:bg-red-700/20 text-red-700 dark:text-red-300 rounded-md text-sm animate-fade-in">{error}</div>}
          {successMessage && <div className="mb-4 p-3 bg-green-100 dark:bg-green-700/20 text-green-700 dark:text-green-300 rounded-md text-sm animate-fade-in">{successMessage}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginMode && (
              <div>
                <label htmlFor="profileType" className={commonLabelClass}>User Profile</label>
                <select
                  id="profileType"
                  value={profileType}
                  onChange={(e) => setProfileType(e.target.value as UserProfileType)}
                  className={commonInputClass}
                  required={!isLoginMode}
                >
                  {Object.values(UserProfileType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="email" className={commonLabelClass}>Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={commonInputClass}
                placeholder="you@example.com"
                required
              />
            </div>

            {!isLoginMode && (
              <div>
                <label htmlFor="phone" className={commonLabelClass}>Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className={commonInputClass}
                  placeholder="Enter 10-15 digit phone number"
                  required={!isLoginMode}
                  pattern="[0-9]{10,15}"
                  title="Phone number must be between 10 and 15 digits"
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className={commonLabelClass}>Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={commonInputClass}
                placeholder="••••••••"
                required
                minLength={isLoginMode ? undefined : 6}
              />
            </div>

            {!isLoginMode && (
              <div>
                <label htmlFor="confirmPassword" className={commonLabelClass}>Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={commonInputClass}
                  placeholder="••••••••"
                  required={!isLoginMode}
                  minLength={6}
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-colors duration-150"
            >
              {isLoginMode ? 'Login' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setError(null);
                setSuccessMessage(null);
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setPhone('');
              }}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 focus:outline-none"
            >
              {isLoginMode ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </button>
          </div>
          <div className="mt-4 text-center">
            <button
              onClick={onNavigateBack}
              className="text-sm text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 focus:outline-none"
            >
              &larr; Back to Main App
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
