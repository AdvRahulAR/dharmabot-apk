# Dharmabot: AI-Powered Legal Assistant

Dharmabot is a sophisticated web application designed to provide AI-powered legal support for the Indian legal community. It serves as an intelligent assistant for legal professionals, law students, and citizens seeking information on various legal domains, leveraging the power of Google Gemini AI. The application offers a personalized experience based on user roles with advanced features for legal research, document drafting, and professional networking.

## 🌟 Key Features

### 🤖 **AI Chat Interface**
- **Natural Language Conversations:** Engage with a specialized legal AI trained on Indian law
- **Contextual Understanding:** AI infers legal service areas and tasks from conversation history
- **Multi-turn Conversations:** Maintains context across extended legal discussions
- **Suggested Prompts:** 300+ curated legal prompts across multiple practice areas
- **Smart Auto-complete:** Intelligent suggestions based on user input
- **Find a Lawyer Integration:** Citizens get direct access to lawyer directory from AI responses

### 📄 **Document Upload & Analysis**
- **Multi-format Support:** PDF, DOCX, TXT, and images (JPEG, PNG, WebP, GIF, HEIC, HEIF)
- **Advanced PDF Processing:** Text extraction with OCR fallback for image-based PDFs
- **Intelligent Analysis:** AI analyzes documents for legal relevance and key insights
- **Batch Processing:** Upload and analyze up to 5 documents simultaneously
- **Visual Feedback:** Real-time processing status with detailed error handling

### 🔍 **Google Search Integration**
- **Real-time Legal Updates:** Optional web search for current legal information
- **Smart Keyword Detection:** Automatic search activation for queries about recent laws
- **Source Citations:** Properly cited web sources with clickable links
- **Grounding Verification:** AI responses backed by authoritative legal sources

### 💬 **Chat History Management**
- **Local Storage:** Sessions saved securely in browser storage
- **Session Management:** Load, rename, and delete previous conversations
- **Search & Filter:** Find specific conversations quickly
- **Export Options:** Save important conversations for future reference

### 👥 **User Authentication & Role-Based Access**
- **Mock Authentication System:** Secure login/signup using localStorage
- **Four User Roles:** Citizen, Judge, Lawyer, and Law Student
- **Personalized Experience:** Features and access tailored to user role
- **Role-specific Welcome Messages:** Customized guidance based on user type

#### **User Role Access Matrix:**
| Feature | Citizen | Law Student | Judge | Lawyer |
|---------|---------|-------------|-------|--------|
| AI Chat | ✅ | ✅ | ✅ | ✅ |
| Document Upload | ✅ | ✅ | ✅ | ✅ |
| Find a Lawyer | ✅ | ✅ | ❌ | ✅ |
| Document Drafting | ❌ | ✅ | ✅ | ✅ |
| Deep Research | ❌ | ✅ | ✅ | ✅ |
| Voicenotes | ❌ | ❌ | ✅ | ✅ |

### ⚖️ **Legal Document Drafting**
*Available to: Lawyers, Judges, Law Students*
- **AI-Powered Generation:** Create legal documents from natural language instructions
- **300+ Document Templates:** Comprehensive library of Indian legal document types
- **Voice Dictation:** Speak instructions for hands-free document creation
- **Rich Text Editor:** Professional Quill.js editor with legal formatting
- **Draft Management:** Save, load, and manage multiple document drafts
- **Export Options:** Professional DOCX and TXT export with proper formatting
- **Suggested Prompts:** Curated list of common legal document types
- **Enhanced DOCX Export:** Professional formatting with proper headings and spacing

### 🎤 **Voicenotes**
*Available to: Judges, Lawyers*
- **Audio Recording:** High-quality voice recording with visual feedback
- **AI Transcription:** Accurate speech-to-text using Google Gemini
- **Legal Note Polishing:** Transform raw transcripts into structured legal notes
- **Note Management:** Save, organize, and manage voicenotes locally
- **Audio Playback:** Review original recordings alongside transcripts
- **Smart Titles:** AI-generated titles based on content analysis

### 🔬 **Deep Research Portal**
*Available to: Lawyers, Judges, Law Students*
- **Comprehensive Legal Research:** AI-powered research with web search integration
- **Voice Query Input:** Dictate research queries for hands-free operation
- **Research Session Management:** Save and organize research sessions
- **Professional Export:** Export research to DOCX with clickable citations
- **Source Verification:** Properly cited sources with direct links
- **Research History:** Track and revisit previous research sessions

### 👨‍⚖️ **Find a Lawyer Directory**
*Available to: Citizens, Law Students, Lawyers*
- **Comprehensive Database:** 40+ verified lawyer profiles across Kerala and Karnataka
- **Smart Search:** Keyword-based search with practice area matching
- **Advanced Filtering:** Filter by location, expertise, and experience
- **Practice Area Keywords:** Intelligent matching for terms like "accident," "divorce," "criminal"
- **Direct Contact:** Email and phone contact options
- **Experience-based Sorting:** Lawyers sorted by experience and expertise

### 🎨 **Modern UI/UX Design**
- **Responsive Design:** Optimized for desktop, tablet, and mobile devices
- **Dark/Light Theme:** Automatic theme switching with user preference storage
- **Smooth Animations:** Micro-interactions and transitions for enhanced UX
- **Accessibility:** WCAG-compliant design with proper ARIA labels
- **Professional Aesthetics:** Clean, modern interface inspired by leading legal tech platforms

### 🔒 **Security & Privacy**
- **Local Data Storage:** All user data stored locally in browser
- **No Server Dependencies:** Client-side processing for enhanced privacy
- **Secure Authentication:** Mock authentication system for demonstration
- **Data Encryption:** Sensitive data handled securely
- **Privacy-First Design:** No external data transmission except AI API calls

## 🛠 Technology Stack

### **Frontend Framework**
- **React 19** with TypeScript for type-safe development
- **Tailwind CSS** for responsive, utility-first styling
- **Custom CSS** for advanced animations and micro-interactions

### **AI Integration**
- **Google Gemini API** (`gemini-2.5-flash-preview-04-17`)
- **@google/genai** library for seamless AI integration
- **Multi-modal Support** for text, image, and audio processing

### **Document Processing**
- **PDF.js** for client-side PDF text extraction and rendering
- **Quill.js** for rich text editing with legal document formatting
- **docx** library for professional DOCX export with styling
- **marked** for Markdown parsing and HTML conversion

### **Audio Processing**
- **MediaRecorder API** for high-quality audio recording
- **Web Audio API** for real-time audio visualization
- **Canvas API** for waveform visualization during recording

### **State Management**
- **React Hooks** (useState, useEffect, useContext) for local state
- **Context API** for theme management and global state
- **localStorage** for persistent data storage

### **Build System**
- **Vite** for fast development and optimized builds
- **ES Modules** with import maps for modern JavaScript
- **TypeScript** for enhanced developer experience and type safety

## 📁 Project Structure

```
dharmabot/
├── components/                 # React UI components
│   ├── AuthView.tsx           # User authentication interface
│   ├── ChatHistoryPanel.tsx   # Sidebar for chat management
│   ├── ChatInputBar.tsx       # Message input with file upload
│   ├── ResponseDisplay.tsx    # Chat message rendering
│   ├── DocumentDraftingView.tsx # Document creation interface
│   ├── VoicenoteView.tsx      # Voice recording and management
│   ├── FindLawyerView.tsx     # Lawyer directory interface
│   ├── ResearchView.tsx       # Deep research portal
│   ├── RichTextEditor.tsx     # Quill.js wrapper component
│   └── ...                    # Additional UI components
├── services/                   # Business logic and API services
│   ├── geminiService.ts       # Google Gemini AI integration
│   ├── localStorageService.ts # Chat session persistence
│   ├── authService.ts         # Mock authentication system
│   ├── lawyerDirectoryService.ts # Lawyer database management
│   ├── voicenoteStorageService.ts # Voicenote persistence
│   ├── documentDraftingStorageService.ts # Draft management
│   ├── suggestedPrompts.ts    # Curated prompt library
│   ├── draftingPrompts.ts     # Document drafting templates
│   └── practiceAreaKeywords.ts # Search keyword mapping
├── contexts/                   # React Context providers
│   └── ThemeContext.tsx       # Theme management
├── types.ts                   # TypeScript type definitions
├── constants.ts               # Application constants
├── App.tsx                    # Main application component
├── index.tsx                  # Application entry point
└── public/                    # Static assets and data
    ├── Logos.png              # Application logo
    └── Lawyer Directory Details.csv # Lawyer database
```

## 🚀 Setup and Installation

### **Prerequisites**
- **Google Gemini API Key** - Required for AI functionality
- **Modern Web Browser** - Chrome, Firefox, Safari, or Edge
- **HTTP Server** - For serving the application (cannot run via file://)

### **Environment Configuration**
1. **Obtain Gemini API Key:**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key for Gemini
   - Copy the API key for configuration

2. **Set Environment Variable:**
   ```bash
   # Create .env.local file in project root
   echo "GEMINI_API_KEY=your_api_key_here" > .env.local
   ```

### **Development Setup**
1. **Clone or Download** the project files
2. **Install Dependencies** (if using npm):
   ```bash
   npm install
   ```
3. **Start Development Server:**
   ```bash
   npm run dev
   # or using serve
   npx serve .
   # or using Python
   python -m http.server
   ```
4. **Access Application:** Navigate to `http://localhost:3000` (or provided URL)

### **Production Deployment**
1. **Build Application:**
   ```bash
   npm run build
   ```
2. **Deploy to Static Hosting:**
   - Netlify, Vercel, GitHub Pages, or any static host
   - Ensure environment variables are configured in hosting platform
   - Set up proper redirects for single-page application

## 🎯 User Guide

### **Getting Started**
1. **Access the Application** via web browser
2. **Create Account** or continue as guest
3. **Select User Role** during registration (affects available features)
4. **Start Chatting** with the AI or explore specialized features

### **For Citizens**
- **Ask Legal Questions:** Get guidance on rights, procedures, and legal concepts
- **Upload Documents:** Analyze contracts, notices, or legal documents
- **Find Lawyers:** Search for qualified legal professionals in your area
- **Get Referrals:** AI suggests when professional legal help is needed

### **For Law Students**
- **Study Assistance:** Get explanations of complex legal concepts
- **Document Practice:** Learn to draft legal documents with AI guidance
- **Research Skills:** Conduct comprehensive legal research with AI assistance
- **Case Analysis:** Upload and analyze legal cases and judgments

### **For Judges**
- **Case Research:** Deep research on legal precedents and current law
- **Document Review:** Analyze case documents and legal submissions
- **Note Taking:** Voice-to-text for court proceedings and case notes
- **Legal Writing:** Draft orders, judgments, and legal opinions

### **For Lawyers**
- **Client Consultation:** AI-assisted legal advice and case analysis
- **Document Drafting:** Generate contracts, notices, and legal documents
- **Legal Research:** Comprehensive research with current legal updates
- **Practice Management:** Organize cases, documents, and client communications

## 🔧 Advanced Features

### **Voice Integration**
- **Speech Recognition:** Accurate transcription in multiple Indian languages
- **Voice Commands:** Navigate and control the application via voice
- **Audio Analysis:** AI analysis of recorded legal discussions
- **Hands-free Operation:** Complete workflows without typing

### **Document Intelligence**
- **Smart Extraction:** Automatically identify key clauses and terms
- **Risk Analysis:** Highlight potential legal risks in contracts
- **Compliance Checking:** Verify documents against legal requirements
- **Version Comparison:** Compare different versions of legal documents

### **Research Capabilities**
- **Case Law Search:** Find relevant precedents and judgments
- **Statutory Analysis:** Research current laws and regulations
- **Legal Updates:** Stay informed about recent legal developments
- **Citation Management:** Proper legal citation formatting

### **Export & Integration**
- **Professional Formatting:** Export documents with proper legal formatting
- **Multiple Formats:** DOCX, PDF, and plain text export options
- **Citation Links:** Clickable references in exported documents
- **Template Library:** Pre-formatted templates for common documents

## 🌐 Browser Compatibility

### **Supported Browsers**
- **Chrome/Chromium** 90+ (Recommended)
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+

### **Required Features**
- **ES Modules** support
- **Web Audio API** for voice features
- **File API** for document upload
- **localStorage** for data persistence
- **Fetch API** for network requests

## 🔮 Future Roadmap

### **Planned Features**
- **Multi-language Support:** Hindi, Tamil, Telugu, and other Indian languages
- **Advanced AI Models:** Integration with specialized legal AI models
- **Collaboration Tools:** Multi-user document editing and review
- **Case Management:** Complete case lifecycle management system
- **Mobile Applications:** Native iOS and Android applications
- **API Integration:** Connect with legal databases and court systems

### **Technical Improvements**
- **Offline Capability:** Progressive Web App with offline functionality
- **Enhanced Security:** End-to-end encryption for sensitive documents
- **Performance Optimization:** Faster loading and processing times
- **Accessibility Enhancements:** Full WCAG 2.1 AA compliance

## 📞 Support & Contact

### **Technical Support**
- **Documentation:** Comprehensive guides and tutorials
- **Community Forum:** User community for questions and discussions
- **Bug Reports:** GitHub issues for technical problems
- **Feature Requests:** Feedback portal for new feature suggestions

### **Legal Disclaimer**
Dharmabot is an AI-powered legal assistant designed to provide general legal information and assistance. It is not a substitute for professional legal advice. Users should consult with qualified legal professionals for specific legal matters and important decisions.

---

**© 2024 UB Intelligence. All rights reserved.**

*Dharmabot - Empowering the Indian Legal Community with AI Technology*