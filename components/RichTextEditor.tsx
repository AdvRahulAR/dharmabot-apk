
import React, { useEffect, useRef } from 'react';
import Quill from 'quill';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const isProgrammaticChangeRef = useRef(false); // Ref to track programmatic changes

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'align': [] }],
            ['link', 'blockquote', 'code-block'],
            ['clean'],
          ],
        },
        placeholder: placeholder || 'Start typing your document...',
      });

      // Apply styles for dynamic height
      const qlEditor = editorRef.current.querySelector('.ql-editor');
      const qlContainer = editorRef.current.querySelector('.ql-container');
      if (qlEditor instanceof HTMLElement) {
          qlEditor.style.height = 'auto';
          qlEditor.style.overflowY = 'visible';
          qlEditor.style.minHeight = '150px'; 
      }
      if (qlContainer instanceof HTMLElement) {
          qlContainer.style.height = 'auto';
          qlContainer.style.minHeight = '150px';
      }
    }
    
    // Apply dark theme class if necessary
    if (quillRef.current) {
        if (document.documentElement.classList.contains('dark')) {
            quillRef.current.root.parentElement?.classList.add('dark-theme');
        } else {
            quillRef.current.root.parentElement?.classList.remove('dark-theme');
        }
    }
  }, [placeholder]); // Effect for initialization and placeholder changes

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    const currentEditorHTML = quill.root.innerHTML;
    const valueIsEffectivelyEmpty = !value || value === '<p><br></p>';
    
    // Avoid unnecessary updates if content is already in sync
    if (value === currentEditorHTML || (valueIsEffectivelyEmpty && quill.getText().trim() === '')) {
        return;
    }

    isProgrammaticChangeRef.current = true; // Signal programmatic change
    if (valueIsEffectivelyEmpty) {
      quill.setContents([{ insert: '\n' }], 'api');
    } else {
      try {
        const delta = quill.clipboard.convert({ html: value }); // Convert HTML string to Delta object
        quill.setContents(delta, 'api'); // Set contents using the Delta
      } catch (e) {
        console.error("Error converting or setting HTML in Quill:", e, "HTML was:", value);
        // Fallback: Try to set as plain text if conversion fails, though this isn't ideal for HTML
        quill.setText(value, 'api'); 
      }
    }
    // RAF to ensure DOM updates before resetting the flag
    requestAnimationFrame(() => {
        isProgrammaticChangeRef.current = false;
    });

  }, [value]); // Effect reacts to changes in the `value` prop


  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    const textChangeHandler = (delta: any, oldDelta: any, source: string) => {
      if (source === 'user' && !isProgrammaticChangeRef.current) { // Check source and flag
        onChange(quill.root.innerHTML);
      }
    };

    quill.on('text-change', textChangeHandler);

    return () => {
      quill.off('text-change', textChangeHandler);
    };
  }, [onChange]); // Effect for managing the text-change listener

  return <div ref={editorRef} style={{ backgroundColor: 'var(--body-bg-color)' }} />;
};

export default RichTextEditor;