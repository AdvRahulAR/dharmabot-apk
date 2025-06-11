import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Audio } from 'expo-av';
import { Header } from '../../components/mobile/Header';
import { LoadingSpinner } from '../../components/mobile/LoadingSpinner';
import { generateDocumentDraftFromInstruction, transcribeAudioWithGemini } from '../../services/geminiService';
import { useTheme } from '../../contexts/ThemeContext';
import { Platform } from 'react-native';

export default function DocumentDraftingScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [instructions, setInstructions] = useState('');
  const [documentTitle, setDocumentTitle] = useState('Untitled Document');
  const [documentContent, setDocumentContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Voice recording state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

  const handleGenerateDocument = async () => {
    if (!instructions.trim()) {
      setError("Please provide instructions for the document.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setDocumentContent('');

    try {
      const response = await generateDocumentDraftFromInstruction(instructions);
      
      if (response.text.startsWith("Error:")) {
        setError(response.text);
        setDocumentContent('');
      } else {
        setDocumentContent(response.text);
        if (!documentTitle || documentTitle === "Untitled Document") {
          setDocumentTitle("Generated Document");
        }
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "An unknown error occurred during document generation.";
      setError(message);
      setDocumentContent('');
    } finally {
      setIsLoading(false);
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
        // Read the audio file and convert to base64
        const base64Audio = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Transcribe the audio
        const transcriptionResponse = await transcribeAudioWithGemini(base64Audio, 'audio/m4a');
        
        if (transcriptionResponse.text.startsWith("Error:")) {
          setError(transcriptionResponse.text);
        } else {
          setInstructions(prev => (prev ? prev + " " : "") + transcriptionResponse.text);
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

  const exportToTXT = async () => {
    if (!documentContent.trim()) {
      Alert.alert('Error', 'No content to export.');
      return;
    }

    try {
      const fileName = `${documentTitle.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      // Convert HTML/Markdown to plain text (basic conversion)
      const plainText = documentContent
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/#{1,6}\s/g, '') // Remove markdown headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
        .trim();

      await FileSystem.writeAsStringAsync(fileUri, plainText);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Success', `Document saved to ${fileName}`);
      }
    } catch (error) {
      console.error('Error exporting TXT:', error);
      Alert.alert('Error', 'Failed to export document.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <Header />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.titleDark]}>
            Legal Document Drafting
          </Text>
        </View>

        {error && (
          <View style={[styles.errorContainer, isDark && styles.errorContainerDark]}>
            <Text style={[styles.errorText, isDark && styles.errorTextDark]}>{error}</Text>
          </View>
        )}

        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            1. Describe your Document
          </Text>
          
          <Text style={[styles.label, isDark && styles.labelDark]}>
            Provide detailed instructions for the legal document you want to generate:
          </Text>
          
          <TextInput
            style={[styles.textArea, isDark && styles.textAreaDark]}
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Example: Draft a Non-Disclosure Agreement between [Party A] and [Party B] for the purpose of discussing a potential business venture..."
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            multiline
            numberOfLines={6}
            editable={!isLoading && !isRecording && !isTranscribing}
          />

          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={handleGenerateDocument}
              style={[
                styles.primaryButton,
                (isLoading || !instructions.trim()) && styles.primaryButtonDisabled
              ]}
              disabled={isLoading || !instructions.trim()}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Generating...' : 'Generate Document'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleVoiceRecording}
              style={[
                styles.voiceButton,
                isRecording && styles.voiceButtonActive,
                isTranscribing && styles.voiceButtonDisabled
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

        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            2. Edit & Export Document
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDark && styles.labelDark]}>Document Title:</Text>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              value={documentTitle}
              onChangeText={setDocumentTitle}
              placeholder="Enter document title"
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            />
          </View>

          <View style={styles.exportButtons}>
            <TouchableOpacity
              onPress={exportToTXT}
              style={[styles.exportButton, !documentContent.trim() && styles.exportButtonDisabled]}
              disabled={!documentContent.trim()}
            >
              <Text style={styles.exportButtonText}>Export TXT</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.documentEditor, isDark && styles.documentEditorDark]}>
            <Text style={[styles.label, isDark && styles.labelDark]}>Generated Document:</Text>
            <ScrollView style={styles.documentContent} nestedScrollEnabled>
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <TextInput
                  style={[styles.documentTextArea, isDark && styles.documentTextAreaDark]}
                  value={documentContent}
                  onChangeText={setDocumentContent}
                  placeholder="AI generated document will appear here. You can also start typing..."
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  multiline
                  numberOfLines={20}
                />
              )}
            </ScrollView>
          </View>
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  labelDark: {
    color: '#d1d5db',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: 'white',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  textAreaDark: {
    borderColor: '#4b5563',
    backgroundColor: '#374151',
    color: '#f9fafb',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
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
  inputGroup: {
    marginBottom: 16,
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
  exportButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  exportButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  exportButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  exportButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  documentEditor: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    minHeight: 300,
  },
  documentEditorDark: {
    borderColor: '#4b5563',
  },
  documentContent: {
    flex: 1,
  },
  documentTextArea: {
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    minHeight: 280,
    textAlignVertical: 'top',
  },
  documentTextAreaDark: {
    color: '#f9fafb',
  },
});