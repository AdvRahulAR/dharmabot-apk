import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { LawyerCard } from './LawyerCard';
import { LawyerProfile, ServiceArea } from '../types';
import { getLawyers, getUniqueCities } from '../services/lawyerDirectoryService';
import { PRACTICE_AREA_KEYWORDS } from '../services/practiceAreaKeywords';

interface FindLawyerViewProps {
  onBackToChat: () => void;
}

const FilterIcon = () => (
  <div className="w-4 h-4 text-white">🔍</div>
);

const SearchIcon = () => (
  <div className="w-5 h-5">🔍</div>
);

const PeopleIcon = () => (
  <div className="w-4 h-4 mr-1 text-slate-600 dark:text-slate-400">👥</div>
);

export const FindLawyerView: React.FC<FindLawyerViewProps> = ({ onBackToChat }) => {
  const [allLawyers, setAllLawyers] = useState<LawyerProfile[]>([]);
  const [filteredLawyers, setFilteredLawyers] = useState<LawyerProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const uniqueDistricts = useMemo(() => getUniqueCities(), []);

  useEffect(() => {
    setIsLoading(true);
    const lawyersData = getLawyers();
    setAllLawyers(lawyersData);
    const sortedInitialLawyers = [...lawyersData].sort((a, b) => {
      if (b.experienceYears !== a.experienceYears) {
        return b.experienceYears - a.experienceYears;
      }
      return a.name.localeCompare(b.name);
    });
    setFilteredLawyers(sortedInitialLawyers);
    setIsLoading(false);
  }, []);

  const applyFilters = useCallback(() => {
    let lawyers = [...allLawyers];

    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      lawyers = lawyers.filter(lawyer => {
        // Search in name
        const nameMatch = lawyer.name.toLowerCase().includes(lowerSearchTerm);
        
        // Check for keyword matches first
        const keywordMatch = Object.keys(PRACTICE_AREA_KEYWORDS).some(keyword => {
          if (lowerSearchTerm.includes(keyword)) {
            const associatedAreas = PRACTICE_AREA_KEYWORDS[keyword];
            return lawyer.practiceAreas.some(area => associatedAreas.includes(area));
          }
          return false;
        });

        // If keyword match found, prioritize it
        if (keywordMatch) {
          return true;
        }
        
        // Fallback to general practice area string matching
        const practiceAreaMatch = lawyer.practiceAreas.some(area => {
          const areaString = area.toLowerCase();
          return areaString.includes(lowerSearchTerm);
        });
        
        return nameMatch || practiceAreaMatch;
      });
    }

    if (selectedDistrict) {
      lawyers = lawyers.filter(lawyer => lawyer.city === selectedDistrict);
    }

    lawyers.sort((a, b) => {
      if (b.experienceYears !== a.experienceYears) {
        return b.experienceYears - a.experienceYears;
      }
      return a.name.localeCompare(b.name);
    });

    setFilteredLawyers(lawyers);
  }, [allLawyers, searchTerm, selectedDistrict]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedDistrict, applyFilters]);

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-gray-100">
      <Header />
      <main className="flex-grow p-3 sm:p-4 md:p-6 overflow-y-auto custom-scrollbar flex flex-col">
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-gray-100 text-center">
            Find a Lawyer Near You
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 text-center mt-1 mb-3">
            Connect with qualified legal professionals in your area who can provide personalized assistance with your legal matters.
          </p>
          <button
            onClick={onBackToChat}
            className="block mx-auto mb-4 px-3 py-1.5 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"
          >
            &larr; Back to Chat Menu
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-lg shadow-md mb-4 animate-fade-in sticky top-0 z-10">
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="relative w-full sm:w-auto">
              <label htmlFor="districtFilter" className="sr-only">Filter by District</label>
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-white">
                <FilterIcon />
              </div>
              <select
                id="districtFilter"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full appearance-none pl-10 pr-8 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 border border-blue-600 dark:border-blue-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer hover:bg-blue-700 dark:hover:bg-blue-800"
              >
                <option value="" className="bg-white dark:bg-slate-700 text-slate-900 dark:text-gray-100">All Districts</option>
                {uniqueDistricts.map(district => (
                  <option key={district} value={district} className="bg-white dark:bg-slate-700 text-slate-900 dark:text-gray-100">{district}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                <div className="w-4 h-4">▼</div>
              </div>
            </div>

            <div className="relative flex-grow w-full sm:w-auto">
              <label htmlFor="searchTerm" className="sr-only">Search lawyers by name or expertise</label>
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 dark:text-slate-500">
                <SearchIcon />
              </div>
              <input
                type="text"
                id="searchTerm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search lawyers by name or expertise (e.g. Accident, Divorce, Criminal)"
                className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="flex items-center px-3 py-1.5 bg-slate-200 dark:bg-slate-700 rounded-full text-xs font-medium text-slate-700 dark:text-slate-300 w-full sm:w-auto justify-center">
              <PeopleIcon />
              <span>{filteredLawyers.length} lawyers</span>
            </div>
          </div>
        </div>

        <div className="flex-grow">
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
              <p className="ml-3 text-slate-600 dark:text-slate-400">Loading lawyers...</p>
            </div>
          ) : filteredLawyers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
              {filteredLawyers.map(lawyer => (
                <LawyerCard key={lawyer.id} lawyer={lawyer} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 animate-fade-in">
              <div className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500 mb-3">🔍</div>
              <p className="text-lg text-slate-600 dark:text-slate-400">No lawyers found matching your criteria.</p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};