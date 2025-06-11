import React, { useState, useEffect, useRef, useCallback } from 'react';
import RichTextEditor from './RichTextEditor';
import { Header } from './Header';
import { Footer } from './Footer';
// Removed LoadingSpinner import as full-page overlay is used for loading
import { Document, Packer, Paragraph, TextRun, HeadingLevel as DocxHeadingLevel, AlignmentType as DocxAlignmentType, UnderlineType, Numbering, Indent as DocxIndentClass, IRunOptions, ShadingType, PageOrientation, IIndentAttributesProperties } from 'docx';
import saveAsFile from 'file-saver';
import { marked } from 'marked';
import { generateDocumentDraftFromInstruction, transcribeAudioWithGemini } from '../services/geminiService'; 
import { AIResponse, SavedDraft } from '../types'; 
import { DRAFTING_SUGGESTED_PROMPTS } from '../services/draftingPrompts';
import { getAllSavedDrafts, saveDraft, deleteSavedDraft } from '../services/documentDraftingStorageService';

const generateUUID = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

interface DocumentDraftingViewProps {
  onBackToChat: () => void;
  currentInstructions: string;
  onInstructionsChange: React.Dispatch<React.SetStateAction<string>>; // Updated type
  currentTitle: string;
  onTitleChange: (title: string) => void;
  currentContent: string;
  onContentChange: (content: string) => void;
}

// Export this function so it can be used by ResearchView
export const processNodeForDocx = (node: Node, currentListFormat?: { level: number; type: 'bullet' | 'number' }): (Paragraph | null)[] => {
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
    let currentHeadingLevel: typeof DocxHeadingLevel[keyof typeof DocxHeadingLevel] | undefined = undefined;
    let currentAlignmentType: typeof DocxAlignmentType[keyof typeof DocxAlignmentType] | undefined = undefined;
    let indentAttributes: IIndentAttributesProperties | undefined = undefined;


    if(element.classList.contains('ql-align-center')) currentAlignmentType = DocxAlignmentType.CENTER;
    if(element.classList.contains('ql-align-right')) currentAlignmentType = DocxAlignmentType.RIGHT;
    if(element.classList.contains('ql-align-justify')) currentAlignmentType = DocxAlignmentType.JUSTIFIED;

    const indentMatch = Array.from(element.classList).find(cls => cls.startsWith('ql-indent-'));
    if (indentMatch) {
      const indentLevel = parseInt(indentMatch.split('-')[2]);
      if (!isNaN(indentLevel) && indentLevel > 0) {
          indentAttributes = { left: indentLevel * 720 }; 
      }
    }


    switch (element.tagName) {
      case 'H1': currentHeadingLevel = DocxHeadingLevel.HEADING_1; paragraphChildren = getRunsForElement(element); break;
      case 'H2': currentHeadingLevel = DocxHeadingLevel.HEADING_2; paragraphChildren = getRunsForElement(element); break;
      case 'H3': currentHeadingLevel = DocxHeadingLevel.HEADING_3; paragraphChildren = getRunsForElement(element); break;
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
          indentAttributes = { left: 720, ...(indentAttributes || {}) }; 
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
      if (indentAttributes && !currentListFormat) paraProps.indent = indentAttributes;

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

export const DocumentDraftingView: React.FC<DocumentDraftingViewProps> = ({ 
    onBackToChat,
    currentInstructions,
    onInstructionsChange,
    currentTitle,
    onTitleChange,
    currentContent,
    onContentChange
}) => {
  // Local state for UI interactions, not core data
  const [isLoading, setIsLoading] = useState<boolean>(false); 
  const [error, setError] = useState<string | null>(null); 
  const [showSuggestedPrompts, setShowSuggestedPrompts] = useState<boolean>(false);

  // Saved drafts state
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([]);
  const [showSavedDrafts, setShowSavedDrafts] = useState<boolean>(false);

  // Dictation specific state (remains local as it's transient to this view's action)
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [dictationError, setDictationError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordedMimeTypeRef = useRef<string | null>(null);

  const editorContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const quillEditorNode = document.querySelector('.ql-editor');
    if (quillEditorNode) {
      editorContentRef.current = quillEditorNode as HTMLDivElement;
    }
  }, [currentContent]); 

  useEffect(() => {
    loadSavedDrafts();
  }, []);

  const loadSavedDrafts = () => {
    const drafts = getAllSavedDrafts();
    setSavedDrafts(drafts);
  };

  const handleGenerateDocument = async () => {
    if (!currentInstructions.trim()) {
      setError("Please provide instructions for the document.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setDictationError(null);
    onContentChange(''); // Clear previous content from shared state

    try {
      console.log("Requesting document draft with instructions:", currentInstructions);
      const aiResponse: AIResponse = await generateDocumentDraftFromInstruction(currentInstructions);
      
      if (aiResponse.text.startsWith("Error:")) {
          console.error("AI generation error:", aiResponse.text);
          setError(aiResponse.text);
          onContentChange(''); 
      } else {
          console.log("AI Response (Markdown):", aiResponse.text);
          marked.setOptions({ gfm: true, breaks: true }); 
          const htmlContent = marked.parse(aiResponse.text) as string;
          console.log("Converted HTML for editor:", htmlContent);
          onContentChange(htmlContent);
          
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = htmlContent;
          const h1Element = tempDiv.querySelector('h1');
          if (h1Element && h1Element.textContent) {
            onTitleChange(h1Element.textContent.trim() || "Generated Document");
          } else if (!currentTitle || currentTitle === "Untitled Document") {
            onTitleChange("Generated Document");
          }
      }
    } catch (e) {
      console.error("Failed to generate document:", e);
      const message = e instanceof Error ? e.message : "An unknown error occurred during document generation.";
      setError(message);
      onContentChange('');
    } finally {
      setIsLoading(false);
    }
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
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
        
        mediaRecorderRef.current.onstart = () => {
            if (mediaRecorderRef.current) {
                 recordedMimeTypeRef.current = mediaRecorderRef.current.mimeType;
                 console.log("Recording started with MIME type:", recordedMimeTypeRef.current);
            }
        };

        mediaRecorderRef.current.onstop = async () => {
          setIsRecording(false);
          setIsTranscribing(true);
          stream.getTracks().forEach(track => track.stop()); 

          if (audioChunksRef.current.length === 0 || !recordedMimeTypeRef.current) {
            setDictationError("No audio recorded or MIME type not captured.");
            setIsTranscribing(false);
            return;
          }

          const audioBlob = new Blob(audioChunksRef.current, { type: recordedMimeTypeRef.current });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64AudioData = (reader.result as string).split(',')[1];
            if (!base64AudioData) {
              setDictationError("Failed to convert audio to base64.");
              setIsTranscribing(false);
              return;
            }
            try {
              const transcriptionResponse = await transcribeAudioWithGemini(base64AudioData, recordedMimeTypeRef.current!);
              if (transcriptionResponse.text.startsWith("Error:")) {
                setDictationError(transcriptionResponse.text);
              } else {
                onInstructionsChange((prev: string) => (prev ? prev + " " : "") + transcriptionResponse.text);
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
        setIsRecording(true);

      } catch (err) {
        console.error("Error accessing microphone:", err);
        setDictationError("Microphone access denied or microphone not found. Please check permissions.");
        setIsRecording(false);
      }
    }
  };

  const handleSaveDraft = () => {
    if (!currentInstructions.trim() && !currentContent.trim()) {
      setError("Cannot save empty draft. Please add instructions or content.");
      return;
    }

    const draft: SavedDraft = {
      id: generateUUID(),
      title: currentTitle || 'Untitled Draft',
      instructions: currentInstructions,
      content: currentContent,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveDraft(draft);
    loadSavedDrafts();
    setError(null);
    alert("Draft saved successfully!");
  };

  const handleLoadDraft = (draft: SavedDraft) => {
    if (isLoading || isRecording || isTranscribing) return;
    
    if ((currentInstructions.trim() || currentContent.trim()) && 
        !window.confirm('Loading a draft will replace your current work. Continue?')) {
      return;
    }

    onInstructionsChange(draft.instructions);
    onTitleChange(draft.title);
    onContentChange(draft.content);
    setError(null);
    setDictationError(null);
  };

  const handleDeleteDraft = (draftId: string, draftTitle: string) => {
    if (window.confirm(`Are you sure you want to delete the draft "${draftTitle}"? This action cannot be undone.`)) {
      deleteSavedDraft(draftId);
      loadSavedDrafts();
    }
  };

  const handleExportDOCX = useCallback(async () => {
    if (!editorContentRef.current || !editorContentRef.current.innerHTML.trim()) {
      alert("Editor content is empty for DOCX export.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setDictationError(null);

    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = editorContentRef.current.innerHTML;
      
      const docxElements: Paragraph[] = [];
      Array.from(tempDiv.childNodes).forEach(node => {
        const processed = processNodeForDocx(node);
        docxElements.push(...processed.filter(p => p !== null) as Paragraph[]);
      });

      if (docxElements.length === 0) {
        docxElements.push(new Paragraph({text: ""})); 
      }

      const doc = new Document({
        numbering: {
          config: [
            {
              reference: 'default-numbering',
              levels: [
                { level: 0, format: 'decimal', text: '%1.', alignment: DocxAlignmentType.START, style: { paragraph: { indent: { left: 720, hanging: 360 }}}},
                { level: 1, format: 'lowerLetter', text: '%2.', alignment: DocxAlignmentType.START, style: { paragraph: { indent: { left: 1440, hanging: 360 }}}},
                { level: 2, format: 'lowerRoman', text: '%3.', alignment: DocxAlignmentType.START, style: { paragraph: { indent: { left: 2160, hanging: 360 }}}},
              ],
            },
          ],
        },
        styles: { 
          default: {
            document: {
              run: {
                size: 32, // 16pt font size (16 * 2 = 32 half-points)
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
                size: 48, // 24pt for H1 (24 * 2 = 48 half-points)
                bold: true,
                font: "Times New Roman"
              },
              paragraph: {
                spacing: {
                  before: 480, // Space before heading
                  after: 240   // Space after heading
                }
              }
            },
            {
              id: "Heading2", 
              name: "Heading 2",
              basedOn: "Normal",
              next: "Normal",
              run: {
                size: 40, // 20pt for H2 (20 * 2 = 40 half-points)
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
                size: 36, // 18pt for H3 (18 * 2 = 36 half-points)
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
                size: 24, // 12pt for code blocks (12 * 2 = 24 half-points)
              },
              paragraph: {
                shading: { type: ShadingType.SOLID, color: "auto", fill: "F1F1F1" },
                indent: { left: 720 },
                spacing: {
                  after: 240
                }
              }
            }
          ]
        },
        sections: [{ 
          properties: {
            page: {
              margin: { top: 720, right: 720, bottom: 720, left: 720 }, 
            },
          },
          children: docxElements 
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAsFile(blob, `${currentTitle.replace(/[^a-zA-Z0-9]/g, '_') || 'document'}.docx`);

    } catch (e) {
      console.error("Error exporting DOCX:", e);
      setError(e instanceof Error ? `DOCX Export Error: ${e.message}` : "Failed to export DOCX.");
    } finally {
      setIsLoading(false);
    }
  }, [currentTitle]);


  const handleExportTXT = useCallback(async () => {
    if (!editorContentRef.current) {
      alert("Editor content not found for export (TXT).");
      return;
    }
    setIsLoading(true);
    setError(null);
    setDictationError(null);
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = editorContentRef.current.innerHTML;
      
      Array.from(tempDiv.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, br, div.ql-clipboard, pre')).forEach(el => {
        if (el.previousSibling && el.previousSibling.nodeName !== 'BR' && el.innerHTML.trim() !== "") {
             const br = document.createElement('br');
             el.parentNode?.insertBefore(br, el);
        }
        if(el.tagName === 'LI'){
            const prefix = document.createTextNode("- ");
            el.insertBefore(prefix, el.firstChild);
        }
      });
      
      let plainText = tempDiv.innerText || "";
      plainText = plainText.replace(/\\n\\s*\\n/g, '\\n').trim();


      const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
      saveAsFile(blob, `${currentTitle.replace(/[^a-zA-Z0-9]/g, '_') || 'document'}.txt`);
    } catch (e) {
      console.error("Error exporting TXT:", e);
      setError(e instanceof Error ? e.message : "Failed to export TXT.");
    } finally {
      setIsLoading(false);
    }
  }, [currentTitle]);

  const handleSuggestedPromptClick = (prompt: string) => {
    onInstructionsChange(prompt);
    setShowSuggestedPrompts(false);
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

  const isProcessing = isLoading || isRecording || isTranscribing;

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-gray-100">
      <Header />
      <main className="flex-grow p-3 sm:p-4 md:p-6 overflow-y-auto custom-scrollbar flex flex-col space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-y-2">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-gray-100">
            Legal Document Drafting
          </h2>
          <button
            onClick={onBackToChat}
            className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-md text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            &larr; Back to Chat
          </button>
        </div>
        
        {error && <div className="my-2 p-3 bg-red-100 dark:bg-red-700/20 border border-red-300 dark:border-red-600/50 text-red-700 dark:text-red-300 rounded-md text-sm animate-fade-in">{error}</div>}
        {dictationError && <div className="my-2 p-3 bg-yellow-100 dark:bg-yellow-700/20 border border-yellow-300 dark:border-yellow-600/50 text-yellow-700 dark:text-yellow-300 rounded-md text-sm animate-fade-in">{dictationError}</div>}

        {/* Saved Drafts Section */}
        <div className="space-y-3 p-3 sm:p-4 bg-white dark:bg-slate-800 shadow-lg rounded-lg animate-fade-in-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-semibold text-slate-700 dark:text-slate-200">Saved Drafts</h3>
            <button
              onClick={() => setShowSavedDrafts(!showSavedDrafts)}
              className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              {showSavedDrafts ? 'Hide Drafts' : `Show Drafts (${savedDrafts.length})`}
            </button>
          </div>
          
          {showSavedDrafts && (
            <div className="mt-3">
              {savedDrafts.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No saved drafts yet.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto custom-scrollbar-thin">
                  <div className="space-y-2">
                    {savedDrafts.map((draft) => (
                      <div
                        key={draft.id}
                        className="p-3 bg-slate-50 dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-grow">
                            <h4 className="font-medium text-sm text-slate-800 dark:text-white truncate" title={draft.title}>
                              {draft.title}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                              {draft.instructions.substring(0, 100)}
                              {draft.instructions.length > 100 ? '...' : ''}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                              {new Date(draft.updatedAt).toLocaleDateString()} at {new Date(draft.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-3">
                            <button
                              onClick={() => handleLoadDraft(draft)}
                              disabled={isProcessing}
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              Load
                            </button>
                            <button
                              onClick={() => handleDeleteDraft(draft.id, draft.title)}
                              disabled={isProcessing}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 1: Generate Legal Document */}
        <div className="space-y-3 p-3 sm:p-4 bg-white dark:bg-slate-800 shadow-lg rounded-lg animate-fade-in-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-semibold text-slate-700 dark:text-slate-200">1. Describe your Document</h3>
            <button
              onClick={() => setShowSuggestedPrompts(!showSuggestedPrompts)}
              className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              {showSuggestedPrompts ? 'Hide Suggestions' : 'Show Suggestions'}
            </button>
          </div>
          <div>
            <label htmlFor="userInstructions" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Provide detailed instructions for the legal document you want to generate (e.g., type of document, key parties, specific clauses, governing law, etc.):
            </label>
            <textarea
              id="userInstructions"
              rows={6}
              value={currentInstructions}
              onChange={(e) => onInstructionsChange(e.target.value)}
              placeholder="Example: Draft a Non-Disclosure Agreement between [Party A] and [Party B] for the purpose of discussing a potential business venture. Include clauses for definition of confidential information, obligations, term (2 years), and jurisdiction (Mumbai, India)."
              className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-gray-100 focus:ring-red-500 focus:border-red-500 text-sm custom-scrollbar-thin"
              disabled={isProcessing}
            />
          </div>

          {/* Suggested Prompts Section */}
          {showSuggestedPrompts && (
            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Suggested Document Types:</h4>
              <div className="max-h-48 overflow-y-auto custom-scrollbar-thin">
                <div className="grid grid-cols-1 gap-1">
                  {DRAFTING_SUGGESTED_PROMPTS.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedPromptClick(prompt)}
                      className="text-left p-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-colors duration-150"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={handleGenerateDocument}
              disabled={isProcessing || !currentInstructions.trim()}
              className="flex-grow sm:flex-grow-0 px-4 py-2 text-sm sm:text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-red-400 dark:disabled:bg-red-700 disabled:cursor-not-allowed flex items-center justify-center sm:min-w-[160px]"
            >
              {isLoading && !error && !dictationError ? (
                <>
                  <SpinnerIcon className="-ml-1 mr-2 h-5 w-5 text-white" />
                  Generating...
                </>
              ) : (
                'Generate Document'
              )}
            </button>
            <button
              onClick={handleDictateClick}
              disabled={isLoading || isTranscribing}
              className={`flex-grow sm:flex-grow-0 px-4 py-2 text-sm sm:text-base font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-opacity-50 flex items-center justify-center sm:min-w-[160px]
                ${isRecording ? 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'}
                ${isTranscribing ? 'bg-gray-400 cursor-not-allowed' : ''}
              `}
            >
              {isTranscribing ? (
                <>
                  <SpinnerIcon className="-ml-1 mr-2 h-5 w-5 text-white" />
                  Transcribing...
                </>
              ) : isRecording ? (
                <>
                  <StopIcon className="-ml-1 mr-2 w-5 h-5" /> Stop Recording
                </>
              ) : (
                <>
                  <MicIcon className="-ml-1 mr-2 w-5 h-5" /> Dictate
                </>
              )}
            </button>
          </div>
        </div>

        {/* Section 2: Document Editor */}
        <div className="space-y-3 p-3 sm:p-4 bg-white dark:bg-slate-800 shadow-lg rounded-lg flex-grow flex flex-col min-h-0 animate-fade-in-slide-up"> 
          <h3 className="text-lg sm:text-xl font-semibold text-slate-700 dark:text-slate-200">2. Edit & Export Document</h3>
          
          <div>
            <label htmlFor="documentTitle" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Document Title:
            </label>
            <input
              type="text"
              id="documentTitle"
              value={currentTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-gray-100 focus:ring-red-500 focus:border-red-500 text-sm"
              placeholder="Enter document title"
            />
          </div>
          
          <div className="mb-3 space-y-2"> 
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-md font-medium text-slate-700 dark:text-slate-300">Actions:</h4>
                <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={handleSaveDraft} 
                      disabled={isProcessing || (!currentInstructions.trim() && !currentContent.trim())} 
                      className="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      {isProcessing ? 'Processing...' : 'Save Draft'}
                    </button>
                    <button onClick={handleExportDOCX} disabled={isLoading || !currentContent.trim()} className="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                        {isLoading && 'Processing...' || 'Export DOCX'}
                    </button>
                    <button onClick={handleExportTXT} disabled={isLoading || !currentContent.trim()} className="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                         {isLoading && 'Processing...' || 'Export TXT'}
                    </button>
                </div>
            </div>
          </div>

          <div className="flex-grow border border-slate-300 dark:border-slate-700 rounded-md"> 
            <RichTextEditor value={currentContent} onChange={onContentChange} placeholder="AI generated document will appear here. You can also start typing..." />
          </div>
        </div>
        
        {(isLoading || isTranscribing) && !error && !dictationError && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" aria-live="assertive" aria-atomic="true">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-2xl flex items-center space-x-4">
                <SpinnerIcon className="h-8 w-8 text-red-500" />
                <span className="text-slate-700 dark:text-slate-300 text-lg">
                    {isLoading ? 'Generating document...' : 'Processing audio...'}
                </span>
            </div>
        </div>}

      </main>
      <Footer />
    </div>
  );
};