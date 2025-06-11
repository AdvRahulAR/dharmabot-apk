import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, FlatList, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Header } from '../components/mobile/Header';
import { Footer } from '../components/mobile/Footer';
import { useTheme } from '../contexts/ThemeContext';
import { LawyerProfile, ServiceArea } from '../types';
import { getLawyers, getUniqueCities } from '../services/lawyerDirectoryService';

export default function FindLawyerScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [allLawyers, setAllLawyers] = useState<LawyerProfile[]>([]);
  const [filteredLawyers, setFilteredLawyers] = useState<LawyerProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const uniqueDistricts = getUniqueCities();

  useEffect(() => {
    loadLawyers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedDistrict, allLawyers]);

  const loadLawyers = () => {
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
  };

  const applyFilters = () => {
    let lawyers = [...allLawyers];

    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      lawyers = lawyers.filter(lawyer => {
        const nameMatch = lawyer.name.toLowerCase().includes(lowerSearchTerm);
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
  };

  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handlePhonePress = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s|-/g, '')}`);
  };

  const renderLawyerCard = ({ item: lawyer }: { item: LawyerProfile }) => (
    <View style={[styles.lawyerCard, isDark && styles.lawyerCardDark]}>
      <View style={styles.lawyerHeader}>
        <Text style={[styles.lawyerName, isDark && styles.lawyerNameDark]}>
          Advocate {lawyer.name}
        </Text>
        <View style={styles.locationContainer}>
          <Ionicons name="location" size={14} color={isDark ? '#94a3b8' : '#64748b'} />
          <Text style={[styles.location, isDark && styles.locationDark]}>
            {lawyer.city}, {lawyer.state}
          </Text>
        </View>
      </View>

      {lawyer.practiceAreas && lawyer.practiceAreas.length > 0 && (
        <View style={styles.practiceAreasContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.practiceAreas}>
              {lawyer.practiceAreas.slice(0, 3).map((area, index) => (
                <View key={index} style={[styles.practiceAreaTag, isDark && styles.practiceAreaTagDark]}>
                  <Text style={[styles.practiceAreaText, isDark && styles.practiceAreaTextDark]}>
                    {area}
                  </Text>
                </View>
              ))}
              {lawyer.practiceAreas.length > 3 && (
                <View style={[styles.practiceAreaTag, isDark && styles.practiceAreaTagDark]}>
                  <Text style={[styles.practiceAreaText, isDark && styles.practiceAreaTextDark]}>
                    +{lawyer.practiceAreas.length - 3} more
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      )}

      <View style={styles.contactButtons}>
        <TouchableOpacity
          onPress={() => handleEmailPress(lawyer.email)}
          style={[styles.contactButton, styles.emailButton]}
        >
          <Ionicons name="mail" size={16} color="#dc2626" />
          <Text style={styles.emailButtonText}>Email</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => handlePhonePress(lawyer.phone)}
          style={[styles.contactButton, styles.phoneButton]}
        >
          <Ionicons name="call" size={16} color="#0891b2" />
          <Text style={styles.phoneButtonText}>Call Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <Header />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.titleDark]}>
            Find a Lawyer Near You
          </Text>
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
            Connect with qualified legal professionals in your area who can provide personalized assistance with your legal matters.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, isDark && styles.backButtonDark]}
          >
            <Text style={styles.backButtonText}>← Back to Chat Menu</Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={[styles.filtersContainer, isDark && styles.filtersContainerDark]}>
          <View style={styles.filterRow}>
            <View style={[styles.pickerContainer, isDark && styles.pickerContainerDark]}>
              <Ionicons name="filter" size={16} color="white" style={styles.pickerIcon} />
              <Picker
                selectedValue={selectedDistrict}
                onValueChange={(value) => setSelectedDistrict(value)}
                style={[styles.picker, isDark && styles.pickerDark]}
              >
                <Picker.Item label="All Districts" value="" />
                {uniqueDistricts.map(district => (
                  <Picker.Item key={district} label={district} value={district} />
                ))}
              </Picker>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={16} color={isDark ? '#64748b' : '#94a3b8'} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, isDark && styles.searchInputDark]}
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Search by name or expertise"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              />
            </View>
          </View>

          <View style={styles.resultsCount}>
            <Ionicons name="people" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text style={[styles.resultsCountText, isDark && styles.resultsCountTextDark]}>
              {filteredLawyers.length} lawyers
            </Text>
          </View>
        </View>

        {/* Results */}
        <View style={styles.resultsContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
                Loading lawyers...
              </Text>
            </View>
          ) : filteredLawyers.length > 0 ? (
            <FlatList
              data={filteredLawyers}
              renderItem={renderLawyerCard}
              keyExtractor={(item) => item.id}
              numColumns={1}
              scrollEnabled={false}
              contentContainerStyle={styles.lawyersList}
            />
          ) : (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search" size={48} color={isDark ? '#64748b' : '#94a3b8'} />
              <Text style={[styles.noResultsTitle, isDark && styles.noResultsTitleDark]}>
                No lawyers found matching your criteria.
              </Text>
              <Text style={[styles.noResultsSubtitle, isDark && styles.noResultsSubtitleDark]}>
                Try adjusting your filters.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  titleDark: {
    color: '#f1f5f9',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  subtitleDark: {
    color: '#94a3b8',
  },
  backButton: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonDark: {
    backgroundColor: '#334155',
  },
  backButtonText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  filtersContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filtersContainerDark: {
    backgroundColor: '#1e293b',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
  },
  pickerContainerDark: {
    backgroundColor: '#3b82f6',
  },
  pickerIcon: {
    marginRight: 8,
  },
  picker: {
    flex: 1,
    color: 'white',
  },
  pickerDark: {
    color: 'white',
  },
  searchContainer: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1e293b',
  },
  searchInputDark: {
    color: '#f1f5f9',
  },
  resultsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
    gap: 6,
  },
  resultsCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  resultsCountTextDark: {
    color: '#94a3b8',
  },
  resultsContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  loadingTextDark: {
    color: '#94a3b8',
  },
  lawyersList: {
    gap: 16,
  },
  lawyerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  lawyerCardDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  lawyerHeader: {
    marginBottom: 12,
  },
  lawyerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  lawyerNameDark: {
    color: '#ef4444',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 14,
    color: '#64748b',
  },
  locationDark: {
    color: '#94a3b8',
  },
  practiceAreasContainer: {
    marginBottom: 16,
  },
  practiceAreas: {
    flexDirection: 'row',
    gap: 8,
  },
  practiceAreaTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  practiceAreaTagDark: {
    backgroundColor: '#334155',
  },
  practiceAreaText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '500',
  },
  practiceAreaTextDark: {
    color: '#d1d5db',
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  emailButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  emailButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  phoneButton: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  phoneButtonText: {
    color: '#0891b2',
    fontSize: 14,
    fontWeight: '600',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsTitle: {
    fontSize: 18,
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsTitleDark: {
    color: '#94a3b8',
  },
  noResultsSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  noResultsSubtitleDark: {
    color: '#64748b',
  },
});