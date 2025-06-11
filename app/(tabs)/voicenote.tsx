import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header } from '../../components/mobile/Header';
import { LoadingSpinner } from '../../components/mobile/LoadingSpinner';
import { transcribeAudioWithGemini, polishLegalNoteWithGemini } from '../../services/geminiService';
import { useTheme } from '../../contexts/ThemeContext';
import { Platform } from 'react-native';

interface VoicenoteData {
  id: string;
  title: string;
  rawTranscript: string;
  polishedNoteMarkdown: string;
  audioBlobURL: string | null;
  audioMimeType: string | null;
  durationSeconds: number;
  createdAt: number;
  updatedAt: number;
}

const VOICENOTES_KEY = 'dharmabotVoicenotes';

export default function VoicenoteScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [noteTitle, setNoteTitle] = useState('New Recording');
  const [rawTranscript, setRawTranscript] = useState('');
  const [polishedNote, setPolishedNote] = useState('');
  const [activeTab, setActiveTab] = useState<'polished' | 'raw'>('polished');
  const [savedNotes, setSavedNotes] = useState<VoicenoteData[]>([]);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  
  // Recording state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);

  useEffect(() => {
    loadSavedNotes();
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const loadSavedNotes = async () => {
    try {
      const notesJson = await AsyncStorage.getItem(VOICENOTES_KEY);
      if (notesJson) {
        const notes = JSON.parse(notesJson) as VoicenoteData[];
        setSavedNotes(notes.sort((a, b) => b.updatedAt - a.updatedAt));
      }
    } catch (error) {
      console.error('Error loading voicenotes:', error);
    }
  };

  const saveNote = async () => {
    if (!rawTranscript.trim() && !polishedNote.trim()) {
      Alert.alert('Error', 'Cannot save empty note.');
      return;
    }

    try {
      const noteData: VoicenoteData = {
        id: currentNoteId || Date.now().toString(),
        title: noteTitle || 'Untitled Note',
        rawTranscript,
        polishedNoteMarkdown: polishedNote,
        audioBlobURL: audioUri,
        audioMimeType: 'audio/m4a',
        durationSeconds: recordingDuration,
        createdAt: currentNoteId ? savedNotes.find(n => n.id === currentNoteId)?.createdAt || Date.now() : Date.now(),
        updatedAt: Date.now(),
      };

      const notes = await AsyncStorage.getItem(VOICENOTES_KEY);
      const existingNotes = notes ? JSON.parse(notes) : [];
      const existingIndex = existingNotes.findIndex((n: VoicenoteData) => n.id === noteData.id);
      
      if (existingIndex > -1) {
        existingNotes[existingIndex] = noteData;
      } else {
        existingNotes.push(noteData);
      }

      await AsyncStorage.setItem(VOICENOTES_KEY, JSON.stringify(existingNotes));
      setCurrentNoteId(noteData.id);
      loadSavedNotes();
      Alert.alert('Success', 'Note saved successfully!');
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note.');
    }
  };

  const loadNote = (note: VoicenoteData) => {
    setCurrentNoteId(note.id);
    setNoteTitle(note.title);
    setRawTranscript(note.rawTranscript);
    setPolishedNote(note.polishedNoteMarkdown);
    setAudioUri(note.audioBlobURL);
    setRecordingDuration(note.durationSeconds);
  };

  const deleteNote = async (noteId: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const notes = await AsyncStorage.getItem(VOICENOTES_KEY);
              const existingNotes = notes ? JSON.parse(notes) : [];
              const filteredNotes = existingNotes.filter((n: VoicenoteData) => n.id !== noteId);
              await AsyncStorage.setItem(VOICENOTES_KEY, JSON.stringify(filteredNotes));
              
              if (currentNoteId === noteId) {
                createNewNote();
              }
              loadSavedNotes();
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note.');
            }
          }
        }
      ]
    );
  };

  const createNewNote = () => {
    setCurrentNoteId(null);
    setNoteTitle('New Recording');
    setRawTranscript('');
    setPolishedNote('');
    setAudioUri(null);
    setRecordingDuration(0);
    setActiveTab('polished');
  };

  const startRecording = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Please grant microphone permission to record audio.');
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
      setRecordingDuration(0);
      
      // Start duration timer
      const startTime = Date.now();
      const timer = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isDoneRecording) {
          clearInterval(timer);
        }
      });

    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    setIsTranscribing(true);
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      
      if (uri) {
        // Read the audio file and convert to base64
        const base64Audio = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Transcribe the audio
        const transcriptionResponse = await transcribeAudioWithGemini(base64Audio, 'audio/m4a');
        
        if (transcriptionResponse.text.startsWith("Error:")) {
          Alert.alert('Error', transcriptionResponse.text);
        } else {
          setRawTranscript(transcriptionResponse.text);
          
          // Polish the note
          setIsPolishing(true);
          const polishingResponse = await polishLegalNoteWithGemini(transcriptionResponse.text);
          
          if (polishingResponse.suggestedTitle) {
            setNoteTitle(polishingResponse.suggestedTitle);
          }
          
          if (!polishingResponse.text.startsWith("Error:")) {
            setPolishedNote(polishingResponse.text);
          }
          setIsPolishing(false);
        }
      }
    } catch (err) {
      console.error('Failed to process recording', err);
      Alert.alert('Error', 'Failed to process audio recording.');
    } finally {
      setIsTranscribing(false);
      setIsPolishing(false);
      setRecording(null);
    }
  };

  const playAudio = async () => {
    if (!audioUri) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }
      
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUri });
      setSound(newSound);
      await newSound.playAsync();
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio.');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <Header />
      
      <View style={styles.content}>
        {/* Sidebar */}
        <View style={[styles.sidebar, isDark && styles.sidebarDark]}>
          <View style={styles.sidebarHeader}>
            <Text style={[styles.sidebarTitle, isDark && styles.sidebarTitleDark]}>
              My Voicenotes
            </Text>
            <TouchableOpacity
              onPress={createNewNote}
              style={styles.newNoteButton}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.notesList}>
            {savedNotes.length === 0 ? (
              <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
                No voicenotes yet
              </Text>
            ) : (
              savedNotes.map(note => (
                <TouchableOpacity
                  key={note.id}
                  onPress={() => loadNote(note)}
                  style={[
                    styles.noteItem,
                    isDark && styles.noteItemDark,
                    currentNoteId === note.id && styles.noteItemActive
                  ]}
                >
                  <Text style={[styles.noteTitle, isDark && styles.noteTitleDark]} numberOfLines={1}>
                    {note.title}
                  </Text>
                  <Text style={[styles.noteDate, isDark && styles.noteDateDark]}>
                    {formatTime(note.durationSeconds)} - {new Date(note.updatedAt).toLocaleDateString()}
                  </Text>
                  <TouchableOpacity
                    onPress={() => deleteNote(note.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash" size={14} color="#ef4444" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <ScrollView contentContainerStyle={styles.mainScrollContent}>
            <View style={styles.header}>
              <Text style={[styles.title, isDark && styles.titleDark]}>Voicenotes</Text>
            </View>

            {/* Recording Controls */}
            <View style={[styles.recordingSection, isDark && styles.recordingSectionDark]}>
              <TouchableOpacity
                onPress={isRecording ? stopRecording : startRecording}
                style={[
                  styles.recordButton,
                  isRecording && styles.recordButtonActive,
                  (isTranscribing || isPolishing) && styles.recordButtonDisabled
                ]}
                disabled={isTranscribing || isPolishing}
              >
                <Ionicons 
                  name={isRecording ? 'stop' : 'mic'} 
                  size={32} 
                  color="white" 
                />
              </TouchableOpacity>
              
              <View style={styles.recordingInfo}>
                <Text style={[styles.recordingStatus, isDark && styles.recordingStatusDark]}>
                  {isRecording ? `Recording: ${formatTime(recordingDuration)}` :
                   isTranscribing ? 'Transcribing audio...' :
                   isPolishing ? 'Polishing note...' :
                   recordingDuration > 0 ? `Duration: ${formatTime(recordingDuration)}` : 'Ready to record'}
                </Text>
                
                {audioUri && !isRecording && (
                  <TouchableOpacity onPress={playAudio} style={styles.playButton}>
                    <Ionicons name="play" size={20} color="#2563eb" />
                    <Text style={styles.playButtonText}>Play Recording</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Note Title */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.labelDark]}>Note Title:</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={noteTitle}
                onChangeText={setNoteTitle}
                placeholder="Enter note title..."
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              />
            </View>

            {/* Content Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                onPress={() => setActiveTab('polished')}
                style={[
                  styles.tab,
                  activeTab === 'polished' && styles.tabActive,
                  isDark && styles.tabDark,
                  activeTab === 'polished' && isDark && styles.tabActiveDark
                ]}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === 'polished' && styles.tabTextActive,
                  isDark && styles.tabTextDark
                ]}>
                  Polished Note
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setActiveTab('raw')}
                style={[
                  styles.tab,
                  activeTab === 'raw' && styles.tabActive,
                  isDark && styles.tabDark,
                  activeTab === 'raw' && isDark && styles.tabActiveDark
                ]}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === 'raw' && styles.tabTextActive,
                  isDark && styles.tabTextDark
                ]}>
                  Raw Transcript
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content Display */}
            <View style={[styles.contentArea, isDark && styles.contentAreaDark]}>
              {activeTab === 'polished' ? (
                isPolishing ? (
                  <LoadingSpinner />
                ) : (
                  <ScrollView style={styles.contentScroll} nestedScrollEnabled>
                    <Text style={[styles.contentText, isDark && styles.contentTextDark]}>
                      {polishedNote || 'AI polished note will appear here...'}
                    </Text>
                  </ScrollView>
                )
              ) : (
                <TextInput
                  style={[styles.transcriptInput, isDark && styles.transcriptInputDark]}
                  value={rawTranscript}
                  onChangeText={setRawTranscript}
                  placeholder="Raw audio transcription will appear here..."
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  multiline
                  editable={!isTranscribing}
                />
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={saveNote}
                style={[
                  styles.saveButton,
                  (!rawTranscript.trim() && !polishedNote.trim()) && styles.saveButtonDisabled
                ]}
                disabled={!rawTranscript.trim() && !polishedNote.trim()}
              >
                <Text style={styles.saveButtonText}>Save Note</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
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
    flexDirection: 'row',
  },
  sidebar: {
    width: 120,
    backgroundColor: 'white',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    padding: 8,
  },
  sidebarDark: {
    backgroundColor: '#1e293b',
    borderRightColor: '#334155',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sidebarTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  sidebarTitleDark: {
    color: '#f1f5f9',
  },
  newNoteButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 4,
  },
  notesList: {
    flex: 1,
  },
  emptyText: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyTextDark: {
    color: '#64748b',
  },
  noteItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    position: 'relative',
  },
  noteItemDark: {
    backgroundColor: '#334155',
  },
  noteItemActive: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  noteTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  noteTitleDark: {
    color: '#f1f5f9',
  },
  noteDate: {
    fontSize: 8,
    color: '#64748b',
  },
  noteDateDark: {
    color: '#94a3b8',
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    padding: 2,
  },
  mainContent: {
    flex: 1,
  },
  mainScrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  titleDark: {
    color: '#f1f5f9',
  },
  recordingSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recordingSectionDark: {
    backgroundColor: '#1e293b',
  },
  recordButton: {
    backgroundColor: '#2563eb',
    borderRadius: 40,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  recordButtonActive: {
    backgroundColor: '#dc2626',
  },
  recordButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  recordingInfo: {
    flex: 1,
  },
  recordingStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  recordingStatusDark: {
    color: '#f1f5f9',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  labelDark: {
    color: '#d1d5db',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: 'white',
  },
  inputDark: {
    borderColor: '#4b5563',
    backgroundColor: '#374151',
    color: '#f9fafb',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  tabDark: {
    backgroundColor: '#334155',
  },
  tabActive: {
    backgroundColor: 'white',
    borderBottomColor: '#dc2626',
  },
  tabActiveDark: {
    backgroundColor: '#1e293b',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextDark: {
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#dc2626',
  },
  contentArea: {
    backgroundColor: 'white',
    borderRadius: 8,
    minHeight: 200,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  contentAreaDark: {
    backgroundColor: '#1e293b',
    borderColor: '#4b5563',
  },
  contentScroll: {
    flex: 1,
    padding: 16,
  },
  contentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  contentTextDark: {
    color: '#d1d5db',
  },
  transcriptInput: {
    flex: 1,
    padding: 16,
    fontSize: 14,
    color: '#374151',
    textAlignVertical: 'top',
    minHeight: 200,
  },
  transcriptInputDark: {
    color: '#d1d5db',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});