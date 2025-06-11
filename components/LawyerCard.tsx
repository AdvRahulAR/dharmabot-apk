import React from 'react';
import { LawyerProfile } from '../types';

interface LawyerCardProps {
  lawyer: LawyerProfile;
}

const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5 text-slate-500 dark:text-slate-400">
    <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001zm.612-1.426a5.873 5.873 0 00-.306 0 5.873 5.873 0 00-3.015.787l-.002.001C6.72 17.983 6 17.646 6 17.273V15A7 7 0 0110 8c0-3.866 2.594-7 6-7 .79 0 1.54.134 2.228.385A3.979 3.979 0 0115 3c-2.21 0-4 1.79-4 4v5a2 2 0 104 0V9.527a5.947 5.947 0 00-1.497-.234 4.487 4.487 0 00-3.028 1.039l-.001.001c-.644.599-1.074 1.424-1.074 2.335v1.034a5.83 5.83 0 00.284.11S9.89 19.02 10 19c.11 0 .308-.065.308-.065l.003-.001a5.87 5.87 0 00.305-.001zM10 7a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    <path d="M15 9a1 1 0 100-2 1 1 0 000 2z" />
  </svg>
);

const EmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-2">
    <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
    <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
  </svg>
);

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-2">
    <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.076a1.5 1.5 0 01-.43 1.583l-1.295.972a11.036 11.036 0 006.058 6.058l.972-1.295a1.5 1.5 0 011.583-.43l3.076.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5h-1.5A11.5 11.5 0 013.5 6H2V3.5z" clipRule="evenodd" />
  </svg>
);

export const LawyerCard: React.FC<LawyerCardProps> = ({ lawyer }) => {
  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-4 border border-slate-200 dark:border-slate-700 flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:scale-[1.015]">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-red-400">Advocate {lawyer.name}</h3>
        <div className="flex items-center mt-1">
          <LocationIcon />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {lawyer.city}, {lawyer.state}
          </p>
        </div>
      </div>

      {lawyer.practiceAreas && lawyer.practiceAreas.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1.5">
            {lawyer.practiceAreas.slice(0, 3).map((area) => ( // Show up to 3 areas for brevity
              <span
                key={area}
                className="px-2 py-0.5 text-[0.65rem] sm:text-xs bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-full"
              >
                {area}
              </span>
            ))}
            {lawyer.practiceAreas.length > 3 && (
                 <span className="px-2 py-0.5 text-[0.65rem] sm:text-xs bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-full">
                +{lawyer.practiceAreas.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Removed Bio and Experience from card view */}

      <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-600 flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
        <a
          href={`mailto:${lawyer.email}`}
          className="flex-1 w-full sm:w-auto flex items-center justify-center px-3 py-2 text-xs sm:text-sm font-medium rounded-md text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-700/30 hover:bg-red-200 dark:hover:bg-red-600/40 border border-red-200 dark:border-red-600/50 transition-colors"
        >
          <EmailIcon /> Email
        </a>
        <a
          href={`tel:${lawyer.phone.replace(/\s|-/g, '')}`}
          className="flex-1 w-full sm:w-auto flex items-center justify-center px-3 py-2 text-xs sm:text-sm font-medium rounded-md text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-700/30 hover:bg-sky-200 dark:hover:bg-sky-600/40 border border-sky-200 dark:border-sky-600/50 transition-colors"
        >
          <PhoneIcon /> Call Now
        </a>
      </div>
    </div>
  );
};