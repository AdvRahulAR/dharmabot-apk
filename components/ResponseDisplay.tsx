import React, { useEffect, useState, useRef, useCallback } from 'react';
import { marked } from 'marked';
import { ChatMessage, UserQueryMessage, AIResponseMessage, SystemMessage, GroundingChunk, FeedbackCategory, ProcessedFileInfoForChat, User, UserProfileType } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface ChatDisplayProps {
  messages: ChatMessage[];
  currentUser: Omit<User, 'password'> | null;
  onNavigateToFindLawyer: () => void;
}

const SourceItem: React.FC<{ source: GroundingChunk, index: number }> = ({ source, index }) => (
  <li key={source.web.uri || index} className="mb-1 last:mb-0">
    <a
      href={source.web.uri}
      target="_blank"
      rel="noopener noreferrer"
      className="text-red-700 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200 hover:underline break-all text-[0.7rem] sm:text-xs"
      title={source.web.title || source.web.uri}
    >
      {index + 1}. {source.web.title || source.web.uri}
    </a>
  </li>
);

const UserMessageCard: React.FC<{ message: UserQueryMessage }> = ({ message }) => {
  const [parsedHtml, setParsedHtml] = useState('');
  useEffect(() => {
    marked.setOptions({ gfm: true, breaks: true });
    setParsedHtml(marked.parse(message.queryText) as string);
  }, [message.queryText]);

  return (
    <div className="flex justify-end mb-3 sm:mb-4 group animate-fade-in-slide-up">
      <div className="bg-red-600 text-white p-2 sm:p-3 rounded-l-xl rounded-tr-xl shadow-md max-w-[85%] sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
        <div className="prose prose-sm md:prose-base prose-invert max-w-none text-white" dangerouslySetInnerHTML={{ __html: parsedHtml }} />
        {message.filesInfo && message.filesInfo.length > 0 && (
          <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-red-400/50">
            <p className="text-[0.7rem] sm:text-xs font-medium text-red-200 mb-0.5 sm:mb-1">Attached:</p>
            <ul className="list-none pl-0 space-y-0.5">
              {message.filesInfo.map(file => (
                <li key={file.name} className="text-[0.7rem] sm:text-xs text-red-100 break-all">
                  📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-[0.65rem] sm:text-xs text-red-200/80 mt-1.5 sm:mt-2 text-right">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
  );
};

const AIMessageCard: React.FC<{ 
  message: AIResponseMessage; 
  currentUser: Omit<User, 'password'> | null;
  onNavigateToFindLawyer: () => void;
}> = ({ message, currentUser, onNavigateToFindLawyer }) => {
  const { theme } = useTheme();
  const [parsedHtml, setParsedHtml] = useState('');
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategory>(FeedbackCategory.ACCURACY);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState('Copy');
  const copyTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (message.text) {
      marked.setOptions({ gfm: true, breaks: true });
      const html = marked.parse(message.text) as string;
      setParsedHtml(html);
    } else {
      setParsedHtml('');
    }
  }, [message.text]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const toggleSourcesExpansion = () => setIsSourcesExpanded(!isSourcesExpanded);

  const handleRating = (rating: 'helpful' | 'unhelpful') => {
    console.log(`Feedback for AI message ID ${message.id}: ${rating}`);
    alert(`Thank you for your feedback!`); 
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({
      messageId: message.id,
      category: feedbackCategory,
      comment: feedbackComment,
    });
    setFeedbackSubmitted(true);
    setShowFeedbackForm(false);
    setTimeout(() => setFeedbackSubmitted(false), 3000); 
  };

  const handleCopyText = useCallback(async () => {
    if (!message.text || typeof message.text !== 'string') {
      console.warn("No text to copy or text is not a string.");
      setCopyButtonText("Error");
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = window.setTimeout(() => setCopyButtonText("Copy"), 2000);
      return;
    }
    try {
      await navigator.clipboard.writeText(message.text);
      setCopyButtonText("Copied!");
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setCopyButtonText("Failed!");
    }
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = window.setTimeout(() => setCopyButtonText("Copy"), 2000);
  }, [message.text]);

  const proseClasses = `prose prose-sm md:prose-base ai-message-enhanced-spacing max-w-none leading-relaxed ${
    theme === 'dark' ? 'prose-invert' : ''
  }`;

  // Check if user is a citizen to show Find a Lawyer button
  const showFindLawyerButton = currentUser && currentUser.profileType === UserProfileType.CITIZEN;

  return (
    <div className="flex justify-start mb-3 sm:mb-4 group animate-fade-in-slide-up">
      <div className="bg-slate-100 dark:bg-slate-700 p-2 sm:p-3 rounded-r-xl rounded-tl-xl shadow-md max-w-[85%] sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
        {parsedHtml ? (
          <div
            className={proseClasses}
            dangerouslySetInnerHTML={{ __html: parsedHtml }}
          />
        ) : (
          <p className="text-slate-500 dark:text-slate-400">AI response processing...</p>
        )}

        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 sm:mt-3 pt-1.5 sm:pt-2 border-t border-slate-300 dark:border-slate-600">
            <button
              onClick={toggleSourcesExpansion}
              aria-expanded={isSourcesExpanded}
              aria-controls={`web-search-sources-${message.id}`}
              className="w-full flex items-center justify-between text-left text-[0.7rem] sm:text-xs font-semibold mb-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 focus:outline-none"
            >
              <span>Web Search Sources ({message.sources.length})</span>
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-200 ${isSourcesExpanded ? 'transform rotate-180' : ''}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {isSourcesExpanded && (
              <div id={`web-search-sources-${message.id}`} className="mt-1">
                <ul className="list-none pl-0 space-y-0.5">
                  {message.sources.map((source, index) => (
                    source.web && source.web.uri ? <SourceItem key={index} source={source} index={index} /> : null
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-300/50 dark:border-slate-600/50 flex items-center justify-between">
          <p className="text-[0.65rem] sm:text-xs text-slate-500/80 dark:text-slate-400/80">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          {!message.text.startsWith("Error:") && (
            <div className="flex space-x-1 sm:space-x-1.5 items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button 
                onClick={handleCopyText} 
                className="p-0.5 sm:p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-[0.65rem] sm:text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all duration-150 hover:scale-110 active:scale-95" 
                aria-label="Copy text"
                title="Copy text"
              >
                {copyButtonText === 'Copy' && (
                  <img 
                    src="/copy.png" 
                    alt="Copy" 
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain"
                  />
                )}
                {copyButtonText !== 'Copy' && <span className="text-[0.65rem] sm:text-xs">{copyButtonText}</span>}
              </button>
              {feedbackSubmitted ? (
                <span className="text-[0.7rem] sm:text-xs text-green-600 dark:text-green-400">Thanks!</span>
              ) : (
                <>
                  <button onClick={() => handleRating('helpful')} className="p-0.5 sm:p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-150 hover:scale-110 active:scale-95" aria-label="Helpful"><span className="text-xs sm:text-sm">👍</span></button>
                  <button onClick={() => handleRating('unhelpful')} className="p-0.5 sm:p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-150 hover:scale-110 active:scale-95" aria-label="Not helpful"><span className="text-xs sm:text-sm">👎</span></button>
                  <button onClick={() => setShowFeedbackForm(!showFeedbackForm)} className="p-0.5 sm:p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-[0.65rem] sm:text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all duration-150 hover:scale-110 active:scale-95" aria-label="Detailed feedback">{showFeedbackForm ? 'Cancel' : 'More'}</button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Find a Lawyer button for citizens */}
        {showFindLawyerButton && !message.text.startsWith("Error:") && (
          <div className="mt-2 pt-2 border-t border-slate-300/50 dark:border-slate-600/50">
            <button
              onClick={onNavigateToFindLawyer}
              className="w-full px-3 py-2 text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-700 transition-all duration-150 hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-3.741-5.197m0 5.676a3.375 3.375 0 01-3.375-3.375h.007v-.008h-.007a3.375 3.375 0 01-3.375-3.375H6.75V5.25A2.25 2.25 0 019 3h6a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 0115 21H9a2.25 2.25 0 01-2.25-2.25V18.72z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197M15 8.25a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
              <span>Find a Lawyer</span>
            </button>
          </div>
        )}

        {showFeedbackForm && !feedbackSubmitted && (
            <form onSubmit={handleFeedbackSubmit} className="space-y-1.5 sm:space-y-2 mt-1.5 sm:mt-2 p-1.5 sm:p-2 bg-slate-200/70 dark:bg-slate-600/70 rounded-md text-[0.7rem] sm:text-xs" id={`detailed-feedback-form-${message.id}`}>
              <select
                id={`feedbackCategory-${message.id}`}
                value={feedbackCategory}
                onChange={(e) => setFeedbackCategory(e.target.value as FeedbackCategory)}
                className="w-full p-1 sm:p-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded-md focus:ring-red-500 focus:border-red-500 text-slate-900 dark:text-gray-100 text-[0.7rem] sm:text-xs"
              >
                {Object.values(FeedbackCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <textarea
                id={`feedbackComment-${message.id}`}
                rows={2}
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Optional comments..."
                className="w-full p-1 sm:p-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded-md focus:ring-red-500 focus:border-red-500 text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-slate-400 resize-y text-[0.7rem] sm:text-xs"
              />
              <button type="submit" className="px-1.5 py-0.5 sm:px-2 sm:py-1 font-medium rounded-md bg-red-600 hover:bg-red-700 text-white focus:outline-none text-[0.7rem] sm:text-xs transition-colors">Submit</button>
            </form>
        )}
      </div>
    </div>
  );
};

const SystemMessageCard: React.FC<{ message: SystemMessage }> = ({ message }) => {
  return (
    <div className="my-2 sm:my-3 text-center animate-fade-in-slide-up">
      <span className="inline-block bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[0.65rem] sm:text-xs px-2 py-0.5 sm:px-3 sm:py-1 rounded-full shadow">
        {message.text} – <span className="text-slate-500 dark:text-slate-400">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </span>
    </div>
  );
};


export const ChatDisplay: React.FC<ChatDisplayProps> = ({ messages, currentUser, onNavigateToFindLawyer }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!messages || messages.length === 0) {
    return (
      <div className="text-center text-slate-600 dark:text-slate-500 py-6 sm:py-10 animate-fade-in">
        <p className="text-sm">No messages in this chat yet. Send one to start!</p>
      </div>
    );
  }

  return (
    <div className="px-1 sm:px-2 md:px-4"> 
      {messages.map((msg) => {
        if (msg.role === 'user') {
          return <UserMessageCard key={msg.id} message={msg as UserQueryMessage} />;
        } else if (msg.role === 'ai') {
          return <AIMessageCard key={msg.id} message={msg as AIResponseMessage} currentUser={currentUser} onNavigateToFindLawyer={onNavigateToFindLawyer} />;
        } else if (msg.role === 'system') {
          return <SystemMessageCard key={msg.id} message={msg as SystemMessage} />;
        }
        return null;
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};