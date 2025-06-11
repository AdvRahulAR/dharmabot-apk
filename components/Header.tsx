import React from 'react';
import { ThemeToggle } from './ThemeToggle';

export const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-slate-900 shadow-lg border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="text-slate-800 dark:text-gray-100">Dharma</span>
            <span className="text-red-600 dark:text-red-500">bot</span>
          </h1>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <ThemeToggle />
          <a
            href="https://dharmabot.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all duration-150 hover:scale-105 active:scale-95 inline-block text-center"
          >
            Ask Neeti
          </a>
        </div>
      </div>
    </header>
  );
};