import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { performDeepResearch } from '../services/geminiService';
import { transcribeAudioWithGemini } from '../services/geminiService';
import { marked } from 'marked';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, UnderlineType, ShadingType, AlignmentType, ExternalHyperlink, IRunOptions } from 'docx';
import saveAs from 'file-saver';
import { GroundingChunk } from '../types';

interface ResearchViewProps {
  onBackToChat: () => void;
}

interface SavedResearch {
  id: string;
  title: string;
  query: string;
  results: string;
  citations: GroundingChunk[];
  timestamp: number;
}

const SAVED_RESEARCH_KEY = 'dharmabotSavedResearch';

const getSavedResearch = (): SavedResearch[] => {
  try {
    const saved = localStorage.getItem(SAVED_RESEARCH_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading saved research:', error);
    return [];
  }
};

// Helper function to process HTML nodes for DOCX conversion
const processNodeForDocx = (node: Node, currentListFormat?: { level: number; type: 'bullet' | 'number' }): (Paragraph | null)[] => {
  const paragraphs: Paragraph[] = [];

  const getRunsForElement = (elementNode: HTMLElement, inheritedStyle: IRunOptions = {}): TextRun[] => {
    const runs: TextRun[] = [];

    const newElementStyle: IRunOptions = {
      ...( (elementNode.tagName === 'STRONG' || elementNode.tagName === 'B' || elementNode.style.fontWeight === 'bold' || parseInt(elementNode.style.fontWeight) >= 700) && { bold: true } ),
      ...( (elementNode.tagName === 'EM' || elementNode.tagName === 'I' || elementNode.style.fontStyle === 'italic') && { italics: true } ),
      ...( (elementNode.tagName === 'U' || elementNode.style.textDecorationLine?.includes('underline')) && { underline: { type: UnderlineType.SINGLE } } ),
      ...( (elementNode.tagName === 'S' || elementNode.tagName === 'STRIKE' || elementNode.style.textDecorationLine?.includes('line-through')) && { strike: true } ),
    };
    
    const effectiveStyleForContent = { ...inheritedStyle, ...newElementStyle };

    Array.from(elementNode.childNodes).forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        if (child.textContent) {
          runs.push(new TextRun({ text: child.textContent, ...effectiveStyleForContent }));
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        if (el.tagName === 'BR') {
          runs.push(new TextRun({ text: "", break: 1, ...effectiveStyleForContent }));
        } else {
          runs.push(...getRunsForElement(el, effectiveStyleForContent));
        }
      }
    });
    return runs;
  };

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement;
    let paragraphChildren: TextRun[] = [];
    let currentHeadingLevel: typeof HeadingLevel[keyof typeof HeadingLevel] | undefined = undefined;
    let currentAlignmentType: typeof AlignmentType[keyof typeof AlignmentType] | undefined = undefined;

    switch (element.tagName) {
      case 'H1': currentHeadingLevel = HeadingLevel.HEADING_1; paragraphChildren = getRunsForElement(element); break;
      case 'H2': currentHeadingLevel = HeadingLevel.HEADING_2; paragraphChildren = getRunsForElement(element); break;
      case 'H3': currentHeadingLevel = HeadingLevel.HEADING_3; paragraphChildren = getRunsForElement(element); break;
      case 'P': paragraphChildren = getRunsForElement(element); break;
      case 'UL':
      case 'OL':
        Array.from(element.children).forEach(li => {
          if (li.tagName === 'LI') {
            const nestedParagraphs = processNodeForDocx(li, {
              level: currentListFormat ? currentListFormat.level + 1 : 0,
              type: element.tagName === 'UL' ? 'bullet' : 'number'
            });
            paragraphs.push(...nestedParagraphs.filter(p => p !== null) as Paragraph[]);
          }
        });
        return paragraphs; 
      case 'LI':
        paragraphChildren = getRunsForElement(element);
        break;
      case 'BLOCKQUOTE':
        paragraphChildren = getRunsForElement(element);
        break;
      case 'PRE': 
        paragraphChildren = getRunsForElement(element);
        paragraphs.push(new Paragraph({ 
          children: paragraphChildren, 
          shading: { type: ShadingType.SOLID, color: "auto", fill: "F1F1F1" },
          style: "CodeBlock" 
        }));
        return paragraphs; 
      default: 
        if (element.textContent?.trim()) {
          paragraphChildren = getRunsForElement(element);
        } else {
          return [null]; 
        }
    }

    if (paragraphChildren.length > 0 || currentHeadingLevel || (element.textContent || "").trim() === "" && (element.tagName === 'P' || element.tagName === 'LI')) {
      const paraProps: any = { children: paragraphChildren };
      if (currentHeadingLevel) paraProps.heading = currentHeadingLevel;
      if (currentAlignmentType) paraProps.alignment = currentAlignmentType;

      if (currentListFormat) {
        if (currentListFormat.type === 'bullet') {
          paraProps.bullet = { level: currentListFormat.level };
        } else {
          paraProps.numbering = { reference: 'default-numbering', level: currentListFormat.level };
        }
      }
      paragraphs.push(new Paragraph(paraProps));
    }
  } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
    paragraphs.push(new Paragraph({ children: [new TextRun(node.textContent)] }));
  }
  return paragraphs.length > 0 ? paragraphs : [null];
};

const MicIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
  </svg>
);

const StopIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
  </svg>
);

const SpinnerIcon = ({ className }: { className?: string }) => (
  <svg className={`animate-spin ${className || "h-5 w-5 text-white"}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export const ResearchView: React.FC<ResearchViewProps> = ({ onBackToChat }) => {
  const [query, setQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [researchResults, setResearchResults] = useState<string>('');
  const [citations, setCitations] = useState<GroundingChunk[]>([]);
  const [savedResearch, setSavedResearch] = useState<SavedResearch[]>(getSavedResearch);
  const [researchTitle, setResearchTitle] = useState<string>('');

  // Dictation state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [dictationError, setDictationError] = useState<string | null>(null);
  const [displayDuration, setDisplayDuration] = useState<number>(0);

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordedMimeTypeRef = useRef<string | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  // Audio visualization refs (removed canvas-related refs)
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    return () => {
      stopRecordingCleanup();
    };
  }, []);

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
  };

  const handleDictateClick = async () => {
    setError(null);
    setDictationError(null);

    if (isTranscribing) return;

    if (isRecording) {
      mediaRecorderRef.current?.stop();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsRecording(true);
        setDisplayDuration(0);
        
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(stream);
        sourceNodeRef.current.connect(analyserRef.current);
        analyserRef.current.fftSize = 2048;
        dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);

        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
        let tempRecordedMimeType: string | null = null;

        mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
        
        mediaRecorderRef.current.onstart = () => {
          if (mediaRecorderRef.current) {
            tempRecordedMimeType = mediaRecorderRef.current.mimeType;
            console.log("Recording started with MIME type:", tempRecordedMimeType);
          }
          recordingStartTimeRef.current = Date.now();
          timerIntervalRef.current = window.setInterval(() => {
            if (recordingStartTimeRef.current) {
              const currentDuration = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
              setDisplayDuration(currentDuration);
            }
          }, 1000);
        };

        mediaRecorderRef.current.onstop = async () => {
          const finalDuration = Math.floor((Date.now() - (recordingStartTimeRef.current || Date.now())) / 1000);
          stopRecordingCleanup();
          setIsRecording(false);
          setIsTranscribing(true);
          setDisplayDuration(finalDuration);
          
          if (audioChunksRef.current.length === 0 || !tempRecordedMimeType) {
            setDictationError("No audio recorded.");
            setIsTranscribing(false);
            return;
          }

          const audioBlob = new Blob(audioChunksRef.current, { type: tempRecordedMimeType });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64AudioData = (reader.result as string)?.split(',')[1];
            if (!base64AudioData) {
              setDictationError("Failed to convert audio to base64.");
              setIsTranscribing(false);
              return;
            }
            try {
              const transcriptionResponse = await transcribeAudioWithGemini(base64AudioData, tempRecordedMimeType!);
              if (transcriptionResponse.text.startsWith("Error:")) {
                setDictationError(transcriptionResponse.text);
              } else {
                setQuery((prev: string) => (prev ? prev + " " : "") + transcriptionResponse.text);
              }
            } catch (e) {
              const message = e instanceof Error ? e.message : "Transcription failed.";
              setDictationError(`Transcription error: ${message}`);
            } finally {
              setIsTranscribing(false);
              audioChunksRef.current = [];
              recordedMimeTypeRef.current = null;
            }
          };
          reader.onerror = () => {
            setDictationError("Failed to read audio blob.");
            setIsTranscribing(false);
            audioChunksRef.current = [];
            recordedMimeTypeRef.current = null;
          };
        };
        
        mediaRecorderRef.current.onerror = (event) => {
          console.error("MediaRecorder error:", event);
          setDictationError(`Recording error: ${(event as any).error?.name || 'Unknown recording error'}`);
          setIsRecording(false);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        recordedMimeTypeRef.current = tempRecordedMimeType;

      } catch (err) {
        console.error("Error accessing microphone:", err);
        setDictationError("Microphone access denied or microphone not found. Please check permissions.");
        setIsRecording(false);
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartNewResearch = () => {
    if (isLoading || isRecording || isTranscribing) return;
    
    if (researchResults && !window.confirm('Starting a new research will clear your current results. Continue?')) {
      return;
    }
    
    setQuery('');
    setResearchResults('');
    setCitations([]);
    setResearchTitle('');
    setError(null);
    setDictationError(null);
  };

  const handleSubmit = async () => {
    if (!query.trim()) {
      setError('Please enter a research query');
      return;
    }

    setIsLoading(true);
    setError(null);
    setDictationError(null);

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

  const handleSave = () => {
    if (!researchResults || !query) return;

    const newResearch: SavedResearch = {
      id: crypto.randomUUID(),
      title: researchTitle || 'Untitled Research',
      query,
      results: researchResults,
      citations,
      timestamp: Date.now(),
    };

    const updatedResearch = [newResearch, ...savedResearch];
    localStorage.setItem(SAVED_RESEARCH_KEY, JSON.stringify(updatedResearch));
    setSavedResearch(updatedResearch);
    alert('Research saved successfully!');
  };

  const handleLoad = (saved: SavedResearch) => {
    setQuery(saved.query);
    setResearchResults(saved.results);
    setCitations(saved.citations);
    setResearchTitle(saved.title);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this research?')) {
      const updatedResearch = savedResearch.filter(r => r.id !== id);
      localStorage.setItem(SAVED_RESEARCH_KEY, JSON.stringify(updatedResearch));
      setSavedResearch(updatedResearch);
    }
  };

  const exportToDocx = async () => {
    if (!researchResults) return;

    setIsLoading(true);

    try {
      // Parse the Markdown content to HTML
      marked.setOptions({ gfm: true, breaks: true });
      const htmlContent = marked.parse(researchResults) as string;
      
      // Create a temporary div to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      
      // Convert HTML nodes to DOCX paragraphs
      const docxElements: Paragraph[] = [];
      Array.from(tempDiv.childNodes).forEach(node => {
        const processed = processNodeForDocx(node);
        docxElements.push(...processed.filter(p => p !== null) as Paragraph[]);
      });

      // Add citations section with clickable hyperlinks
      if (citations.length > 0) {
        docxElements.push(
          new Paragraph({
            children: [new TextRun({ text: '\n\nSources & Citations:\n', bold: true, size: 36 })],
            spacing: { before: 480, after: 240 }
          })
        );
        
        citations.forEach((citation, index) => {
          const linkText = citation.web.title || citation.web.uri;
          const linkNumber = `${index + 1}. `;
          
          docxElements.push(
            new Paragraph({
              children: [
                new TextRun({ text: linkNumber, size: 32 }),
                new ExternalHyperlink({
                  children: [
                    new TextRun({
                      text: linkText,
                      style: "Hyperlink",
                      color: "0563C1",
                      underline: {
                        type: UnderlineType.SINGLE,
                        color: "0563C1"
                      },
                      size: 32
                    })
                  ],
                  link: citation.web.uri
                })
              ],
              spacing: {
                after: 120
              }
            })
          );
        });
      }

      // Ensure we have at least one paragraph
      if (docxElements.length === 0) {
        docxElements.push(new Paragraph({ text: "" }));
      }

      const doc = new Document({
        numbering: {
          config: [
            {
              reference: 'default-numbering',
              levels: [
                { level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.START, style: { paragraph: { indent: { left: 720, hanging: 360 }}}},
                { level: 1, format: 'lowerLetter', text: '%2.', alignment: AlignmentType.START, style: { paragraph: { indent: { left: 1440, hanging: 360 }}}},
                { level: 2, format: 'lowerRoman', text: '%3.', alignment: AlignmentType.START, style: { paragraph: { indent: { left: 2160, hanging: 360 }}}},
              ],
            },
          ],
        },
        styles: { 
          default: {
            document: {
              run: {
                size: 36, // 18pt font size (18 * 2 = 36 half-points) - Above 16pt requirement
                font: "Times New Roman"
              },
              paragraph: {
                spacing: {
                  after: 240 // Add spacing after paragraphs for better readability
                }
              }
            }
          },
          paragraphStyles: [
            {
              id: "Heading1",
              name: "Heading 1",
              basedOn: "Normal",
              next: "Normal",
              run: {
                size: 56, // 28pt for H1 (28 * 2 = 56 half-points)
                bold: true,
                font: "Times New Roman"
              },
              paragraph: {
                spacing: {
                  before: 480, // Space before heading
                  after: 360   // Space after heading
                }
              }
            },
            {
              id: "Heading2", 
              name: "Heading 2",
              basedOn: "Normal",
              next: "Normal",
              run: {
                size: 48, // 24pt for H2 (24 * 2 = 48 half-points)
                bold: true,
                font: "Times New Roman"
              },
              paragraph: {
                spacing: {
                  before: 360,
                  after: 240
                }
              }
            },
            {
              id: "Heading3",
              name: "Heading 3", 
              basedOn: "Normal",
              next: "Normal",
              run: {
                size: 40, // 20pt for H3 (20 * 2 = 40 half-points)
                bold: true,
                font: "Times New Roman"
              },
              paragraph: {
                spacing: {
                  before: 240,
                  after: 120
                }
              }
            },
            {
              id: "CodeBlock",
              name: "Code Block",
              basedOn: "Normal",
              next: "Normal",
              run: {
                font: "Courier New",
                size: 28, // 14pt for code blocks (14 * 2 = 28 half-points)
              },
              paragraph: {
                shading: { type: ShadingType.SOLID, color: "auto", fill: "F1F1F1" },
                indent: { left: 720 },
                spacing: {
                  after: 240
                }
              }
            }
          ],
          characterStyles: [
            {
              id: "Hyperlink",
              name: "Hyperlink",
              basedOn: "DefaultParagraphFont",
              run: {
                color: "0563C1",
                underline: {
                  type: UnderlineType.SINGLE,
                  color: "0563C1"
                },
                size: 32 // 16pt for hyperlinks
              }
            }
          ]
        },
        sections: [{
          properties: {
            page: {
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }, // 1 inch margins
            },
          },
          children: [
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [new TextRun({ text: researchTitle || 'Legal Research Results', size: 56, bold: true })],
              spacing: {
                after: 360
              }
            }),
            new Paragraph({
              children: [new TextRun({ text: 'Research Query: ' + query, bold: true, size: 36 })],
              spacing: {
                after: 360
              }
            }),
            new Paragraph({
              children: [new TextRun({ text: `Generated on: ${new Date().toLocaleDateString('en-IN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}`, italics: true, size: 32 })],
              spacing: {
                after: 480
              }
            }),
            ...docxElements
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const sanitizedTitle = (researchTitle || 'research').replace(/[^a-zA-Z0-9]/g, '_');
      saveAs(blob, `${sanitizedTitle}.docx`);
    } catch (error) {
      console.error('Error exporting to DOCX:', error);
      setError('Failed to export to DOCX. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isProcessing = isLoading || isRecording || isTranscribing;

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
      <Header />
      <main className="flex-grow p-3 sm:p-4 md:p-6 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-gray-100">
            Deep Research
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleStartNewResearch}
              disabled={isProcessing}
              className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              New Research
            </button>
            <button
              onClick={onBackToChat}
              className="px-3 py-1.5 text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"
            >
              ← Back to Chat
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Saved Research Sidebar */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg h-fit">
            <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-3">Saved Research</h3>
            {savedResearch.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm">No saved research yet</p>
            ) : (
              <div className="space-y-2">
                {savedResearch.map(research => (
                  <div key={research.id} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-md">
                    <h4 className="font-medium text-sm text-slate-800 dark:text-white">{research.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {new Date(research.timestamp).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleLoad(research)}
                        className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDelete(research.id)}
                        className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-slate-800 p-4 rounded-lg shadow-lg">
              <h3 className="text-lg font-medium text-white mb-2">Enter Your Research Query</h3>
              
              {/* Error Messages */}
              {error && (
                <div className="mb-3 p-3 bg-red-100 dark:bg-red-700/20 border border-red-300 dark:border-red-600/50 text-red-700 dark:text-red-300 rounded-md text-sm">
                  {error}
                </div>
              )}
              {dictationError && (
                <div className="mb-3 p-3 bg-yellow-100 dark:bg-yellow-700/20 border border-yellow-300 dark:border-yellow-600/50 text-yellow-700 dark:text-yellow-300 rounded-md text-sm">
                  {dictationError}
                </div>
              )}

              {/* Recording status */}
              {(isRecording || isTranscribing) && (
                <div className="mb-3 text-center">
                  <p className="text-sm text-white">
                    {isRecording ? `Recording: ${formatTime(displayDuration)}` : 
                     isTranscribing ? 'Transcribing audio...' : ''}
                  </p>
                </div>
              )}

              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Example: Provide a comprehensive analysis of recent Supreme Court of India judgments on the interpretation of 'force majeure' clauses in commercial contracts during the COVID-19 pandemic, including key legal principles and dissenting opinions."
                className="w-full h-32 p-3 bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                disabled={isProcessing}
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
                >
                  {isLoading ? (
                    <>
                      <SpinnerIcon className="mr-2 h-4 w-4" />
                      Researching...
                    </>
                  ) : (
                    'Submit Research Query'
                  )}
                </button>
                
                <button
                  onClick={handleDictateClick}
                  disabled={isLoading || isTranscribing}
                  className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 flex items-center
                    ${isRecording ? 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'}
                    ${isTranscribing ? 'bg-gray-400 cursor-not-allowed' : ''}
                  `}
                >
                  {isTranscribing ? (
                    <>
                      <SpinnerIcon className="mr-2 h-4 w-4" />
                      Transcribing...
                    </>
                  ) : isRecording ? (
                    <>
                      <StopIcon className="mr-2 w-4 h-4" /> Stop Recording
                    </>
                  ) : (
                    <>
                      <MicIcon className="mr-2 w-4 h-4" /> Dictate
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-slate-800 dark:text-white">Research Results</h3>
                {researchResults && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={researchTitle}
                      onChange={(e) => setResearchTitle(e.target.value)}
                      placeholder="Research Title"
                      className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                    <button
                      onClick={handleSave}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={exportToDocx}
                      disabled={isLoading}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    >
                      {isLoading ? (
                        <>
                          <SpinnerIcon className="mr-1 h-3 w-3" />
                          Exporting...
                        </>
                      ) : (
                        'Export DOCX'
                      )}
                    </button>
                  </div>
                )}
              </div>

              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
                  <span className="ml-3 text-slate-600 dark:text-slate-300">Performing deep research...</span>
                </div>
              )}

              {!isLoading && !researchResults && !error && (
                <p className="text-slate-600 dark:text-slate-400 italic text-center py-8">
                  Enter your research query above and submit to begin. Results will appear here.
                </p>
              )}

              {researchResults && (
                <div className="space-y-4">
                  <div 
                    className="prose prose-sm md:prose-base dark:prose-invert max-w-none ai-message-enhanced-spacing"
                    dangerouslySetInnerHTML={{ __html: marked.parse(researchResults) }}
                  />
                  
                  {citations.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <h4 className="text-md font-medium text-slate-800 dark:text-white mb-2">Sources & Citations</h4>
                      <ul className="space-y-1">
                        {citations.map((citation, index) => (
                          <li key={index} className="text-sm">
                            <span className="font-medium text-slate-700 dark:text-slate-300">{index + 1}. </span>
                            <a
                              href={citation.web.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-red-600 dark:text-red-400 hover:underline"
                            >
                              {citation.web.title || citation.web.uri}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};