import React from 'react';
import { FOOTER_TEXT } from '../constants';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-100 dark:bg-slate-900 text-center py-1 sm:py-2 md:py-3 border-t border-slate-200 dark:border-slate-700">
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-500 px-2">{FOOTER_TEXT}</p>
    </footer>
  );
};