import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header } from '../../components/mobile/Header';
import { LoadingSpinner } from '../../components/mobile/LoadingSpinner';
import { performDeepResearch, transcribeAudioWithGemini } from '../../services/geminiService';
import { useTheme } from '../../contexts/ThemeContext';
import { Platform } from 'react-native';

interface SavedResearch {
  id: string;
  title: string;
  query: string;
  results: string;
  citations: any[];
  timestamp: number;
}

const SAVED_RESEARCH_KEY = 'dharmabotSavedResearch';

export default function ResearchScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [query, setQuery] = useState('');
  const [researchResults, setResearchResults] = useState('');
  const [citations, setCitations] = useState<any[]>([]);
  const [researchTitle, setResearchTitle] = useState('');
  const [savedResearch, setSavedResearch] = useState<SavedResearch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Voice recording state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  useEffect(() => {
    loadSavedResearch();
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  const loadSavedResearch = async () => {
    try {
      const researchJson = await AsyncStorage.getItem(SAVED_RESEARCH_KEY);
      if (researchJson) {
        const research = JSON.parse(researchJson) as SavedResearch[];
        setSavedResearch(research.sort((a, b) => b.timestamp - a.timestamp));
      }
    } catch (error) {
      console.error('Error loading saved research:', error);
    }
  };

  const handleSubmit = async () => {
    if (!query.trim()) {
      setError('Please enter a research query');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await performDeepResearch(query);
      setResearchResults(result.text);
      setCitations(result.sources || []);
      setResearchTitle(query.substring(0, 50) + (query.length > 50 ? '...' : ''));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while performing research');
      setResearchResults('');
      setCitations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!researchResults || !query) return;

    try {
      const newResearch: SavedResearch = {
        id: Date.now().toString(),
        title: researchTitle || 'Untitled Research',
        query,
        results: researchResults,
        citations,
        timestamp: Date.now(),
      };

      const research = await AsyncStorage.getItem(SAVED_RESEARCH_KEY);
      const existingResearch = research ? JSON.parse(research) : [];
      const updatedResearch = [newResearch, ...existingResearch];
      
      await AsyncStorage.setItem(SAVED_RESEARCH_KEY, JSON.stringify(updatedResearch));
      setSavedResearch(updatedResearch);
      Alert.alert('Success', 'Research saved successfully!');
    } catch (error) {
      console.error('Error saving research:', error);
      Alert.alert('Error', 'Failed to save research.');
    }
  };

  const startRecording = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Please grant microphone permission to use voice recording.');
          return;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    setIsTranscribing(true);
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        const base64Audio = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        const transcriptionResponse = await transcribeAudioWithGemini(base64Audio, 'audio/m4a');
        
        if (transcriptionResponse.text.startsWith("Error:")) {
          setError(transcriptionResponse.text);
        } else {
          setQuery(prev => (prev ? prev + " " : "") + transcriptionResponse.text);
        }
      }
    } catch (err) {
      console.error('Failed to process recording', err);
      setError('Failed to process audio recording.');
    } finally {
      setIsTranscribing(false);
      setRecording(null);
    }
  };

  const handleVoiceRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const exportResults = async () => {
    if (!researchResults) return;

    try {
      const fileName = `${(researchTitle || 'research').replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      let content = `Research Query: ${query}\n\n`;
      content += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
      content += `Results:\n${researchResults}\n\n`;
      
      if (citations.length > 0) {
        content += `Sources & Citations:\n`;
        citations.forEach((citation, index) => {
          content += `${index + 1}. ${citation.web.title || citation.web.uri} (${citation.web.uri})\n`;
        });
      }

      await FileSystem.writeAsStringAsync(fileUri, content);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Success', `Research saved to ${fileName}`);
      }
    } catch (error) {
      console.error('Error exporting research:', error);
      Alert.alert('Error', 'Failed to export research.');
    }
  };

  const handleSourcePress = (uri: string) => {
    Linking.openURL(uri);
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <Header />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.titleDark]}>Deep Research</Text>
        </View>

        {error && (
          <View style={[styles.errorContainer, isDark && styles.errorContainerDark]}>
            <Text style={[styles.errorText, isDark && styles.errorTextDark]}>{error}</Text>
          </View>
        )}

        {/* Query Input Section */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            Enter Your Research Query
          </Text>
          
          <TextInput
            style={[styles.queryInput, isDark && styles.queryInputDark]}
            value={query}
            onChangeText={setQuery}
            placeholder="Example: Provide a comprehensive analysis of recent Supreme Court of India judgments on the interpretation of 'force majeure' clauses..."
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            multiline
            numberOfLines={4}
            editable={!isLoading && !isRecording && !isTranscribing}
          />

          <View style={styles.queryActions}>
            <TouchableOpacity
              onPress={handleSubmit}
              style={[
                styles.submitButton,
                (isLoading || isRecording || isTranscribing || !query.trim()) && styles.submitButtonDisabled
              ]}
              disabled={isLoading || isRecording || isTranscribing || !query.trim()}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Researching...' : 'Submit Research Query'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleVoiceRecording}
              style={[
                styles.voiceButton,
                isRecording && styles.voiceButtonActive,
                (isLoading || isTranscribing) && styles.voiceButtonDisabled
              ]}
              disabled={isLoading || isTranscribing}
            >
              <Ionicons 
                name={isRecording ? 'stop' : 'mic'} 
                size={20} 
                color="white" 
              />
              <Text style={styles.voiceButtonText}>
                {isTranscribing ? 'Transcribing...' : (isRecording ? 'Stop Recording' : 'Dictate')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results Section */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <View style={styles.resultsHeader}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              Research Results
            </Text>
            
            {researchResults && (
              <View style={styles.resultsActions}>
                <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={exportResults} style={styles.exportButton}>
                  <Text style={styles.exportButtonText}>Export</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {isLoading ? (
            <LoadingSpinner />
          ) : !researchResults && !error ? (
            <Text style={[styles.placeholderText, isDark && styles.placeholderTextDark]}>
              Enter your research query above and submit to begin. Results will appear here.
            </Text>
          ) : (
            <View style={styles.resultsContent}>
              <ScrollView style={styles.resultsScroll} nestedScrollEnabled>
                <Text style={[styles.resultsText, isDark && styles.resultsTextDark]}>
                  {researchResults}
                </Text>
              </ScrollView>
              
              {citations.length > 0 && (
                <View style={[styles.citationsSection, isDark && styles.citationsSectionDark]}>
                  <Text style={[styles.citationsTitle, isDark && styles.citationsTitleDark]}>
                    Sources & Citations
                  </Text>
                  {citations.map((citation, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleSourcePress(citation.web.uri)}
                      style={styles.citationItem}
                    >
                      <Text style={[styles.citationText, isDark && styles.citationTextDark]}>
                        {index + 1}. {citation.web.title || citation.web.uri}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  titleDark: {
    color: '#f1f5f9',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorContainerDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
  },
  errorTextDark: {
    color: '#ef4444',
  },
  section: {
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
  sectionDark: {
    backgroundColor: '#1e293b',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  sectionTitleDark: {
    color: '#f1f5f9',
  },
  queryInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: 'white',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  queryInputDark: {
    borderColor: '#4b5563',
    backgroundColor: '#374151',
    color: '#f9fafb',
  },
  queryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  voiceButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voiceButtonActive: {
    backgroundColor: '#dc2626',
  },
  voiceButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  voiceButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  resultsActions: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  exportButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 40,
  },
  placeholderTextDark: {
    color: '#94a3b8',
  },
  resultsContent: {
    flex: 1,
  },
  resultsScroll: {
    maxHeight: 300,
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  resultsTextDark: {
    color: '#d1d5db',
  },
  citationsSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  citationsSectionDark: {
    borderTopColor: '#4b5563',
  },
  citationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  citationsTitleDark: {
    color: '#f1f5f9',
  },
  citationItem: {
    marginBottom: 8,
  },
  citationText: {
    fontSize: 12,
    color: '#dc2626',
    textDecorationLine: 'underline',
  },
  citationTextDark: {
    color: '#ef4444',
  },
});