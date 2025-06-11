
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { marked } from 'marked';
import { Voicenote, VoicenoteInProgressData } from '../types';
import { transcribeAudioWithGemini, polishLegalNoteWithGemini } from '../services/geminiService';
import { getAllVoicenotes, saveVoicenote as saveVoicenoteToStorage, deleteVoicenote as deleteVoicenoteFromStorage } from '../services/voicenoteStorageService';
import { Header } from './Header';
import { Footer } from './Footer';

const generateUUID = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

interface VoicenoteViewProps {
  onBackToChat: () => void;
  currentNoteData: VoicenoteInProgressData; // State for the note being actively worked on
  onCurrentNoteDataChange: (data: VoicenoteInProgressData | null) => void;
  onRequestNewNote: () => void; // Signal App to create a new note structure
  onRequestLoadNote: (savedNote: Voicenote) => void; // Signal App to load a saved note into currentNoteData
}

export const VoicenoteView: React.FC<VoicenoteViewProps> = ({ 
    onBackToChat,
    currentNoteData,
    onCurrentNoteDataChange,
    onRequestNewNote,
    onRequestLoadNote
}) => {
  const [savedNotesList, setSavedNotesList] = useState<Voicenote[]>([]); // List of all saved notes
  // Local UI state for recording process
  const [recordingState, setRecordingState] = useState<'idle' | 'requestingPermission' | 'recording' | 'processingAudio' | 'transcribing' | 'polishing'>('idle');
  const [activeContentTab, setActiveContentTab] = useState<'polished' | 'raw'>('polished');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const localAudioBlobURLRef = useRef<string | null>(null); // To store URL for current recording before it's in currentNoteData

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const polishedNoteHtml = currentNoteData.polishedNoteMarkdown ? marked.parse(currentNoteData.polishedNoteMarkdown) as string : '';

  useEffect(() => {
    marked.setOptions({ gfm: true, breaks: true });
    loadSavedNotes();
    return () => { 
      stopRecordingCleanup();
      if (localAudioBlobURLRef.current) URL.revokeObjectURL(localAudioBlobURLRef.current);
    };
  }, []);

  const loadSavedNotes = () => {
    const notes = getAllVoicenotes();
    setSavedNotesList(notes);
  };
  
  const handleTitleChange = (newTitle: string) => {
    onCurrentNoteDataChange({ ...currentNoteData, title: newTitle });
  };

  const handleCreateNewNote = () => {
    if (isProcessing || recordingState === 'recording') return;
    onRequestNewNote(); // App.tsx will create a new default VoicenoteInProgressData
    setActiveContentTab('polished');
    setError(null);
    if (localAudioBlobURLRef.current) {
        URL.revokeObjectURL(localAudioBlobURLRef.current);
        localAudioBlobURLRef.current = null;
    }
  };
  
  const handleSelectNoteToLoad = (noteId: string) => {
    if (isProcessing || recordingState === 'recording') return;
    const noteToLoad = savedNotesList.find(n => n.id === noteId);
    if (noteToLoad) {
        onRequestLoadNote(noteToLoad); // App.tsx will set this as currentNoteData
        setActiveContentTab('polished');
        setError(null);
        if (localAudioBlobURLRef.current) {
            URL.revokeObjectURL(localAudioBlobURLRef.current);
            localAudioBlobURLRef.current = null;
        }
    }
  };


  const handleSaveNote = () => {
    if (!currentNoteData || !currentNoteData.id) { // id should be present if it's an existing or newly initialized note
      setError("No active note to save or note ID missing.");
      return;
    }
    const noteToSave: Voicenote = {
      id: currentNoteData.id, // Use the ID from currentNoteData
      title: currentNoteData.title || 'Untitled Note',
      rawTranscript: currentNoteData.rawTranscript,
      polishedNoteMarkdown: currentNoteData.polishedNoteMarkdown,
      audioBlobURL: currentNoteData.audioBlobURL, 
      audioMimeType: currentNoteData.audioMimeType,
      durationSeconds: currentNoteData.durationSeconds,
      createdAt: savedNotesList.find(n => n.id === currentNoteData.id)?.createdAt || Date.now(), // Preserve original creation if exists
      updatedAt: Date.now(),
    };
    saveVoicenoteToStorage(noteToSave);
    loadSavedNotes(); 
    // currentNoteData is already up-to-date via onCurrentNoteDataChange
    setError(null); 
    alert("Note saved successfully!");
  };

  const handleDeleteNote = (noteId: string) => {
    if (window.confirm("Are you sure you want to delete this note? This action cannot be undone.")) {
      deleteVoicenoteFromStorage(noteId);
      if (currentNoteData?.id === noteId) {
        onRequestNewNote(); // Request App to set a new blank note
      }
      loadSavedNotes(); 
    }
  };

  const visualize = () => {
    if (!analyserRef.current || !canvasRef.current || !dataArrayRef.current) return;
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
    
    canvasCtx.fillStyle = 'rgb(241 245 249)'; 
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(239 68 68)'; 

    canvasCtx.beginPath();
    const sliceWidth = canvas.width * 1.0 / analyserRef.current.frequencyBinCount;
    let x = 0;

    for (let i = 0; i < analyserRef.current.frequencyBinCount; i++) {
      const v = dataArrayRef.current[i] / 128.0;
      const y = v * canvas.height / 2;
      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }
      x += sliceWidth;
    }
    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
    animationFrameIdRef.current = requestAnimationFrame(visualize);
  };

  const stopRecordingCleanup = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current?.stream?.getTracks().forEach(track => track.stop());
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    mediaRecorderRef.current = null;
    audioContextRef.current = null;
    analyserRef.current = null;
    sourceNodeRef.current = null;
    animationFrameIdRef.current = null;
    timerIntervalRef.current = null;
    recordingStartTimeRef.current = null;
    
    if (canvasRef.current) {
        const canvasCtx = canvasRef.current.getContext('2d');
        if (canvasCtx) {
            canvasCtx.fillStyle = 'rgb(241 245 249)'; 
            canvasCtx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    }
  };


  const handleStartRecording = async () => {
    setError(null);
    setRecordingState('requestingPermission');
    
    // Ensure a fresh state for the new recording in currentNoteData
    const newRecordingData: VoicenoteInProgressData = {
        id: currentNoteData?.id || generateUUID(), // Retain ID if editing, else new temp ID
        title: currentNoteData?.title || 'New Recording', // Retain title if existing, else default
        rawTranscript: '',
        polishedNoteMarkdown: '',
        audioBlobURL: null,
        audioMimeType: null,
        durationSeconds: 0,
    };
    onCurrentNoteDataChange(newRecordingData);
    if (localAudioBlobURLRef.current) { // Clean up old local blob URL
        URL.revokeObjectURL(localAudioBlobURLRef.current);
        localAudioBlobURLRef.current = null;
    }
    setActiveContentTab('polished');


    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setRecordingState('recording');
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceNodeRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 2048;
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      visualize();

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      let tempRecordedMimeType: string | null = null; // Temporary holder for mime type

      mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorderRef.current.onstart = () => {
        tempRecordedMimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        recordingStartTimeRef.current = Date.now();
        timerIntervalRef.current = window.setInterval(() => {
          if (recordingStartTimeRef.current) {
            const currentDuration = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
            onCurrentNoteDataChange({ ...newRecordingData, durationSeconds: currentDuration }); // Update duration in shared state
          }
        }, 1000);
      };

      mediaRecorderRef.current.onstop = async () => {
        const finalDuration = Math.floor((Date.now() - (recordingStartTimeRef.current || Date.now())) / 1000);
        stopRecordingCleanup(); 
        setRecordingState('processingAudio');
        
        if (audioChunksRef.current.length === 0 || !tempRecordedMimeType) {
          setError("No audio recorded.");
          setRecordingState('idle');
          onCurrentNoteDataChange({ ...newRecordingData, durationSeconds: finalDuration });
          return;
        }
        const audioBlob = new Blob(audioChunksRef.current, { type: tempRecordedMimeType });
        const tempLocalAudioBlobURL = URL.createObjectURL(audioBlob);
        localAudioBlobURLRef.current = tempLocalAudioBlobURL; // Store locally first

        const updatedDataAfterRecording: VoicenoteInProgressData = {
            ...newRecordingData,
            audioBlobURL: tempLocalAudioBlobURL,
            audioMimeType: tempRecordedMimeType,
            durationSeconds: finalDuration,
        };
        onCurrentNoteDataChange(updatedDataAfterRecording);


        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64AudioData = (reader.result as string)?.split(',')[1];
          if (!base64AudioData) {
            setError("Failed to convert audio.");
            setRecordingState('idle');
            return;
          }

          setRecordingState('transcribing');
          const transcriptionResponse = await transcribeAudioWithGemini(base64AudioData, tempRecordedMimeType!);
          let newRawTranscript = '';
          if (transcriptionResponse.text.startsWith("Error:")) {
            setError(transcriptionResponse.text);
          } else {
            newRawTranscript = transcriptionResponse.text;
          }
          onCurrentNoteDataChange({ ...updatedDataAfterRecording, rawTranscript: newRawTranscript });


          setRecordingState('polishing');
          const polishingResponse = await polishLegalNoteWithGemini(newRawTranscript);
          let newPolishedNote = '';
          let finalTitle = updatedDataAfterRecording.title;

          if (polishingResponse.suggestedTitle) {
              finalTitle = polishingResponse.suggestedTitle;
          } else if (!finalTitle || finalTitle === 'New Recording' || finalTitle === 'Untitled Note') {
              finalTitle = newRawTranscript.substring(0,50) + (newRawTranscript.length > 50 ? "..." : "") || "Polished Note";
          }

          if (polishingResponse.text.startsWith("Error:")) {
            setError(polishingResponse.text);
          } else {
            newPolishedNote = polishingResponse.text;
          }
          
          onCurrentNoteDataChange({ 
            ...updatedDataAfterRecording, 
            rawTranscript: newRawTranscript,
            polishedNoteMarkdown: newPolishedNote,
            title: finalTitle
          });

          setRecordingState('idle');
          setActiveContentTab('polished');
        };
        reader.onerror = () => { setError("Failed to read audio blob."); setRecordingState('idle'); };
      };
      mediaRecorderRef.current.start();
    } catch (err) {
      console.error("Error starting recording:", err);
      setError("Microphone access denied or unavailable.");
      setRecordingState('idle');
      stopRecordingCleanup();
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop(); 
    }
  };

  const isProcessing = ['processingAudio', 'transcribing', 'polishing'].includes(recordingState);
  const displayDuration = recordingState === 'recording' ? currentNoteData.durationSeconds : (currentNoteData?.durationSeconds || 0);

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
      <Header />
      <main className="flex-grow flex flex-col lg:flex-row p-3 sm:p-4 md:p-6 gap-4 overflow-hidden">
        {/* Notes List Panel */}
        <div className="lg:w-1/3 xl:w-1/4 flex flex-col bg-white dark:bg-slate-800 shadow-lg rounded-lg p-3 sm:p-4 overflow-y-auto custom-scrollbar animate-fade-in-slide-up">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">My Voicenotes</h2>
            <button
              onClick={handleCreateNewNote}
              disabled={isProcessing || recordingState === 'recording'}
              className="px-3 py-1.5 text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Note
            </button>
          </div>
          {savedNotesList.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No voicenotes yet. Record one!</p>
          ) : (
            <ul className="space-y-2">
              {savedNotesList.map(note => (
                <li key={note.id} 
                    onClick={() => handleSelectNoteToLoad(note.id)}
                    className={`p-2.5 rounded-md cursor-pointer transition-colors duration-150 ${currentNoteData?.id === note.id ? 'bg-red-100 dark:bg-red-700/30 shadow-inner' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'} ${isProcessing || recordingState === 'recording' ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <h3 className={`font-medium truncate text-sm ${currentNoteData?.id === note.id ? 'text-red-700 dark:text-red-300' : 'text-slate-700 dark:text-slate-200'}`} title={note.title}>{note.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatTime(note.durationSeconds)} - {new Date(note.updatedAt).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Main Content Panel */}
        <div className="flex-grow flex flex-col bg-white dark:bg-slate-800 shadow-lg rounded-lg p-3 sm:p-4 overflow-y-auto custom-scrollbar space-y-4 animate-fade-in-slide-up">
          {error && <div className="p-3 bg-red-100 dark:bg-red-700/20 border border-red-300 dark:border-red-600/50 text-red-700 dark:text-red-300 rounded-md text-sm animate-fade-in">{error}</div>}
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={recordingState === 'recording' ? handleStopRecording : handleStartRecording}
              disabled={isProcessing}
              className={`px-6 py-3 text-base font-medium rounded-lg text-white flex items-center justify-center shadow-md hover:opacity-90 transition-opacity
                ${recordingState === 'recording' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {recordingState === 'recording' ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
              )}
              {recordingState === 'recording' ? 'Stop Recording' : 'Start Recording'}
            </button>
            <div className="flex flex-col items-center sm:items-end">
              <canvas ref={canvasRef} width="200" height="50" className="bg-slate-100 dark:bg-slate-700 rounded"></canvas>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {recordingState === 'recording' ? `Recording: ${formatTime(displayDuration)}` : 
                 isProcessing ? `Processing: ${recordingState}...` :
                 (currentNoteData && displayDuration > 0) ? `Duration: ${formatTime(displayDuration)}` : 'Awaiting recording...'}
              </p>
            </div>
          </div>

          {currentNoteData.audioBlobURL && !isProcessing && recordingState !== 'recording' && (
            <div className="my-2">
              <audio controls src={currentNoteData.audioBlobURL} className="w-full"></audio>
            </div>
          )}

          <div>
            <label htmlFor="noteTitle" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Note Title:</label>
            <input
              type="text"
              id="noteTitle"
              value={currentNoteData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              disabled={isProcessing || recordingState === 'recording'}
              className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-gray-100 focus:ring-red-500 focus:border-red-500 text-sm"
              placeholder="Enter note title..."
            />
          </div>
          
          <div className="mt-4">
            <div className="flex border-b border-slate-300 dark:border-slate-600 mb-3">
              <button
                onClick={() => setActiveContentTab('polished')}
                className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 ${activeContentTab === 'polished' ? 'border-red-500 text-red-600 dark:text-red-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
              >
                Polished Note
              </button>
              <button
                onClick={() => setActiveContentTab('raw')}
                className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 ${activeContentTab === 'raw' ? 'border-red-500 text-red-600 dark:text-red-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
              >
                Raw Transcript
              </button>
            </div>

            {activeContentTab === 'polished' && (
              <div
                className="prose prose-sm md:prose-base dark:prose-invert max-w-none p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 min-h-[150px] custom-scrollbar-thin"
                dangerouslySetInnerHTML={{ __html: polishedNoteHtml || '<p class="text-slate-400 italic">AI polished note will appear here...</p>' }}
              />
            )}

            {activeContentTab === 'raw' && (
              <textarea
                id="rawTranscriptDisplay"
                rows={10}
                value={currentNoteData.rawTranscript}
                readOnly
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-gray-100 focus:ring-0 focus:border-slate-300 dark:focus:border-slate-600 text-sm custom-scrollbar-thin"
                placeholder="Raw audio transcription."
              />
            )}
          </div>
          
          <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-200 dark:border-slate-700 mt-auto">
            <button
              onClick={handleSaveNote}
              disabled={isProcessing || recordingState === 'recording' || !currentNoteData?.id}
              className="px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              Save Note
            </button>
            {currentNoteData?.id && savedNotesList.some(note => note.id === currentNoteData.id) && ( // Show delete only if it's a saved note
              <button
                onClick={() => handleDeleteNote(currentNoteData.id!)}
                disabled={isProcessing || recordingState === 'recording'}
                className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                Delete Note
            </button>
            )}
             <button
                onClick={onBackToChat}
                className="px-4 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500"
              >
                &larr; Back to Chat Menu
            </button>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};