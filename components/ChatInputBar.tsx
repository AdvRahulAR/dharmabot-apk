import React, { useState, useRef, useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { ProcessedFile } from '../types'; 
import * as pdfjsLib from 'pdfjs-dist'; 
import { SUGGESTED_PROMPTS_BY_AREA } from '../services/suggestedPrompts'; 

interface ChatInputBarProps {
  onSubmit: () => void;
  isLoading: boolean;
  inputValue: string;
  onInputChange: (value: string) => void;
  files: ProcessedFile[];
  onFilesChange: React.Dispatch<React.SetStateAction<ProcessedFile[]>>;
  webSearchEnabled: boolean;
  onWebSearchToggle: (enabled: boolean) => void;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const PDF_TEXT_EXTRACTION_MIN_CHARS_PER_PAGE_HEURISTIC = 50;
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSubmit,
  isLoading,
  inputValue,
  onInputChange,
  files: processedFiles,
  onFilesChange,
  webSearchEnabled,
  onWebSearchToggle,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const allSuggestedPrompts = useMemo(() => 
    Object.values(SUGGESTED_PROMPTS_BY_AREA).flat(),
    []
  );

  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; 
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = parseInt(getComputedStyle(textareaRef.current).maxHeight, 10);
      if (scrollHeight > maxHeight && maxHeight > 0) {
        textareaRef.current.style.height = `${maxHeight}px`;
      } else {
        textareaRef.current.style.height = `${scrollHeight}px`;
      }
    }
  }, [inputValue]);

  useEffect(() => {
    if (inputValue.trim()) {
      const filteredSuggestions = allSuggestedPrompts.filter(prompt =>
        prompt.toLowerCase().includes(inputValue.toLowerCase())
      );
      setSuggestions(filteredSuggestions.slice(0, 10)); 
      setShowSuggestions(filteredSuggestions.length > 0);
      setActiveSuggestionIndex(-1); 
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, allSuggestedPrompts]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [suggestionsRef, textareaRef]);

  const handleFileProcessing = useCallback(async (file: File): Promise<Omit<ProcessedFile, 'id' | 'originalFile'>> => {
    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`);
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { name: file.name, type: file.type, status: 'error', errorMessage: `File too large (max ${MAX_FILE_SIZE_MB}MB)` };
    }

    if (file.type === 'application/pdf') {
      try {
        console.log(`Starting PDF processing for ${file.name}`);
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        console.log(`PDF ${file.name} has ${pdfDoc.numPages} pages.`);
        let totalChars = 0;
        let textContent = '';

        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const pageTextContent = await page.getTextContent();
          const pageText = pageTextContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
          textContent += pageText + '\n\n'; 
          totalChars += pageText.length;
          console.log(`PDF ${file.name}, Page ${i}: ${pageText.length} chars extracted.`);
        }
        
        console.log(`PDF ${file.name}: Total chars extracted: ${totalChars}, Avg chars/page: ${pdfDoc.numPages > 0 ? totalChars / pdfDoc.numPages : 0}`);
        if (pdfDoc.numPages > 0 && (totalChars / pdfDoc.numPages) < PDF_TEXT_EXTRACTION_MIN_CHARS_PER_PAGE_HEURISTIC && pdfDoc.numPages <=5 ) {
          console.log(`Low text content for ${file.name}. Attempting OCR via image conversion (max 5 pages).`);
          const imagePageDataUrls: string[] = [];
          for (let i = 1; i <= Math.min(pdfDoc.numPages, 5); i++) { 
            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 }); 
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            if (context) {
              await page.render({ canvasContext: context, viewport: viewport }).promise;
              imagePageDataUrls.push(canvas.toDataURL('image/png')); 
              console.log(`PDF ${file.name}, Page ${i}: Converted to image for OCR.`);
            } else {
              console.error(`Could not get canvas context for PDF page ${i} of ${file.name}.`);
            }
          }
           if (imagePageDataUrls.length > 0) {
            return { name: file.name, type: file.type, imagePageDataUrls, status: 'processed' };
          } else {
            if (textContent.trim()) {
                 console.log(`PDF ${file.name}: Image conversion failed, but some text was extracted. Using text content.`);
                 return { name: file.name, type: file.type, textContent: textContent.trim(), status: 'processed'};
            }
            return { name: file.name, type: file.type, status: 'error', errorMessage: 'PDF has low text content, and image conversion for OCR failed.' };
          }
        }
         console.log(`PDF ${file.name}: Processed with text extraction.`);
        return { name: file.name, type: file.type, textContent: textContent.trim(), status: 'processed' };
      } catch (e: unknown) {
        console.error(`Error processing PDF ${file.name}:`, e);
        let specificErrorMessage = "Error processing PDF.";
        if (e instanceof Error) {
            if (e.name === 'PasswordException') { 
                specificErrorMessage = 'PDF is password protected and cannot be processed.';
            } else if (e.name === 'InvalidPDFException') {
                specificErrorMessage = 'Invalid or corrupted PDF file.';
            } else {
                specificErrorMessage = `PDF Error (${e.name}): ${e.message}`;
            }
        } else {
            specificErrorMessage = String(e);
        }
        return { name: file.name, type: file.type, status: 'error', errorMessage: specificErrorMessage };
      }
    } else if (IMAGE_MIME_TYPES.includes(file.type)) {
      console.log(`Processing image file: ${file.name}`);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageDataUrl = e.target?.result as string;
          console.log(`Image ${file.name} read as data URL, length: ${imageDataUrl.length}`);
          resolve({ name: file.name, type: file.type, imagePageDataUrls: [imageDataUrl], status: 'processed' });
        };
        reader.onerror = (e) => {
          console.error(`Error reading image file ${file.name}:`, e);
          resolve({ name: file.name, type: file.type, status: 'error', errorMessage: 'Error reading image file.' });
        };
        reader.readAsDataURL(file);
      });
    } else if (file.type === 'text/plain' || file.type === 'text/markdown') {
      console.log(`Processing text file: ${file.name}`);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const textContent = e.target?.result as string;
            console.log(`Text file ${file.name} read, length: ${textContent.length}`);
            resolve({ name: file.name, type: file.type, textContent, status: 'processed' });
        };
        reader.onerror = (e) => {
            console.error(`Error reading text file ${file.name}:`, e);
            resolve({ name: file.name, type: file.type, status: 'error', errorMessage: 'Error reading text file.' });
        };
        reader.readAsText(file);
      });
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.type === 'application/msword') {
       console.log(`Processing Word document: ${file.name}`);
       return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            console.log(`Word document ${file.name} read as data URL, length: ${dataUrl.length}`);
            resolve({ name: file.name, type: file.type, textContent: dataUrl, status: 'processed' });
        };
        reader.onerror = (e) => {
            console.error(`Error reading Word document ${file.name}:`, e);
            resolve({ name: file.name, type: file.type, status: 'error', errorMessage: 'Error reading document file.' });
        };
        reader.readAsDataURL(file); 
      });
    }
    console.warn(`File type ${file.type} for ${file.name} is not explicitly handled for direct content extraction. Attempting to read as data URL for potential generic upload.`);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        console.log(`Generic file ${file.name} read as data URL, length: ${dataUrl.length}`);
        resolve({ name: file.name, type: file.type, textContent: dataUrl, status: 'processed' });
      };
      reader.onerror = (e) => {
        console.error(`Error reading generic file ${file.name}:`, e);
        resolve({ name: file.name, type: file.type, status: 'error', errorMessage: 'Error reading file data.'});
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFilesChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = event.target.files;
    if (newFiles) {
      const currentFileCount = processedFiles.length;
      const newFilesToAdd = Array.from(newFiles).slice(0, 5 - currentFileCount); 
      
      const newPlaceholders: ProcessedFile[] = newFilesToAdd.map(file => ({
        id: `${file.name}-${file.lastModified}-${file.size}-${crypto.randomUUID()}`,
        name: file.name,
        type: file.type,
        originalFile: file,
        status: 'processing' as 'processing',
      }));

      if (newPlaceholders.length > 0) {
        onFilesChange(prev => [...prev, ...newPlaceholders]);
      }
      
      for (const placeholder of newPlaceholders) {
        const file = placeholder.originalFile;
        handleFileProcessing(file).then(result => {
          onFilesChange(prev => prev.map(pf => 
            pf.id === placeholder.id ? { ...pf, ...result, status: result.status || (result.errorMessage ? 'error' : 'processed') } : pf
          ));
        }).catch(error => {
            console.error("Error in handleFileProcessing promise chain:", error);
            onFilesChange(prev => prev.map(pf => 
              pf.id === placeholder.id ? {...pf, status: 'error', errorMessage: "Unexpected processing error."} : pf
            ));
        });
      }
      if (fileInputRef.current) fileInputRef.current.value = ""; 
    }
  }, [processedFiles.length, handleFileProcessing, onFilesChange]);

  const removeFile = (fileIdToRemove: string) => {
    onFilesChange(prevFiles => prevFiles.filter(pf => pf.id !== fileIdToRemove));
  };

  const handleSubmitForm = (e?: React.FormEvent) => {
    e?.preventDefault();
    const filesForSubmission = processedFiles.filter(pf => pf.status === 'processed');
    
    if (!inputValue.trim() && filesForSubmission.length === 0) {
      return;
    }
    if (processedFiles.some(pf => pf.status === 'processing')) {
      alert("Some files are still processing. Please wait.");
      return;
    }
    const filesWithErrors = processedFiles.filter(pf => pf.status === 'error');
    if (filesWithErrors.length > 0) {
        if (!confirm(`${filesWithErrors.length} file(s) had processing errors. Do you want to proceed with the successfully processed files and your query? Errors: ${filesWithErrors.map(f => `${f.name}: ${f.errorMessage}`).join(', ')}`)) {
            return;
        }
    }
    onSubmit();
    setShowSuggestions(false); 
    if (textareaRef.current) { 
        textareaRef.current.style.height = 'auto';
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onInputChange(suggestion);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter' && activeSuggestionIndex > -1) {
        e.preventDefault();
        handleSuggestionClick(suggestions[activeSuggestionIndex]);
        setActiveSuggestionIndex(-1); 
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
      }
    }
    if (e.key === 'Enter' && !e.shiftKey && !(showSuggestions && activeSuggestionIndex > -1) ) {
      e.preventDefault();
      handleSubmitForm();
    }
  };
  
  const toggleWebSearch = () => {
    onWebSearchToggle(!webSearchEnabled);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-100 dark:bg-slate-800 p-2 sm:p-3 md:p-4 border-t border-slate-200 dark:border-slate-700 shadow-lg transition-all duration-300 ease-in-out" style={{ marginLeft: 'inherit' }}>
      {processedFiles.length > 0 && (
        <div className="mb-1.5 sm:mb-2 flex flex-wrap gap-1 sm:gap-2 items-center">
          {processedFiles.map((pf) => (
            <div
              key={pf.id}
              className={`flex items-center text-[0.7rem] sm:text-xs rounded-full py-0.5 px-2 sm:py-1 sm:px-3 space-x-1 animate-fade-in transition-transform duration-150 hover:scale-105 hover:shadow-md
                ${pf.status === 'processed' ? 'bg-green-100 text-green-700 dark:bg-green-600/30 dark:text-green-300' : ''}
                ${pf.status === 'processing' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-600/30 dark:text-yellow-300 animate-pulse' : ''}
                ${pf.status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-600/30 dark:text-red-300' : ''}
              `}
              title={pf.status === 'error' ? pf.errorMessage : pf.name}
            >
              {pf.status === 'processing' && <div className="animate-spin h-3 w-3 mr-1 border-t-2 border-b-2 border-current rounded-full" />}
              {pf.status === 'processed' && <div className="h-3 w-3 mr-1 text-current">✓</div>}
              {pf.status === 'error' && <div className="h-3 w-3 mr-1 text-current">!</div>}
              
              <span>{pf.name.length > 15 ? pf.name.substring(0,13) + '...' : pf.name}</span>
              
              <button
                type="button"
                onClick={() => removeFile(pf.id)}
                disabled={isLoading}
                className="ml-0.5 sm:ml-1 text-current hover:text-black dark:hover:text-white font-bold leading-none disabled:opacity-50"
                aria-label={`Remove ${pf.name}`}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center bg-white dark:bg-slate-700 rounded-lg sm:rounded-xl p-0.5 sm:p-1 shadow-md">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || processedFiles.length >= 5} 
          className="p-2 sm:p-2.5 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed focus:outline-none rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-600/50 transition-all duration-200 hover:scale-110 active:scale-100"
          aria-label="Upload documents"
          title="Upload documents (max 5 files)"
        >
          <div className="w-5 h-5 sm:w-6 sm:h-6">+</div>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          multiple
          onChange={handleFilesChange}
          className="hidden"
          accept=".txt,.md,.pdf,.doc,.docx,application/pdf,text/plain,text/markdown,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
          disabled={isLoading || processedFiles.length >= 5}
        />

        <button
          type="button"
          onClick={toggleWebSearch}
          disabled={isLoading}
          className={`p-2 sm:p-2.5 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed focus:outline-none rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-600/50 transition-all duration-200 hover:scale-110 active:scale-100 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center`}
          aria-label="Toggle Web Search"
          title={webSearchEnabled ? "Disable Web Search" : "Enable Web Search"}
          aria-pressed={webSearchEnabled}
        >
          <div className="w-4 h-4 sm:w-5 sm:h-5">🌐</div>
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleTextareaKeyDown}
          onFocus={() => inputValue.trim() && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Type your legal query..."
          className="flex-grow p-2 sm:p-2.5 bg-transparent border-none focus:ring-0 text-sm sm:text-base text-slate-900 dark:text-gray-100 placeholder-slate-500 dark:placeholder-slate-400 resize-none overflow-y-auto min-h-9 sm:min-h-11 max-h-32 sm:max-h-40 custom-scrollbar-thin"
          disabled={isLoading}
          aria-autocomplete="list"
          aria-controls="suggestions-listbox"
          aria-activedescendant={activeSuggestionIndex > -1 ? `suggestion-${activeSuggestionIndex}` : undefined}
        />
        <button
          type="button"
          onClick={() => handleSubmitForm()}
          disabled={isLoading || (!inputValue.trim() && processedFiles.filter(f=>f.status === 'processed').length === 0) || processedFiles.some(f => f.status === 'processing')}
          className="p-2 sm:p-2.5 bg-red-600 text-white rounded-md sm:rounded-lg hover:bg-red-700 disabled:bg-red-800/50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-700 transition-all duration-200 hover:scale-105 active:scale-95 ml-0.5 sm:ml-1"
          aria-label="Send message"
        >
          {isLoading ? (
            <div className="animate-spin h-5 w-5 sm:h-6 sm:w-6 border-2 border-white rounded-full" />
          ) : (
            <div className="w-5 h-5 sm:w-6 sm:h-6">➤</div>
          )}
        </button>
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          id="suggestions-listbox"
          className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg max-h-48 overflow-y-auto z-50 custom-scrollbar-thin animate-fade-in-scale-up"
          role="listbox"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              id={`suggestion-${index}`}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setActiveSuggestionIndex(index)}
              className={`p-2 sm:p-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer ${activeSuggestionIndex === index ? 'bg-slate-100 dark:bg-slate-600' : ''}`}
              role="option"
              aria-selected={activeSuggestionIndex === index} 
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};