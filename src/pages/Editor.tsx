import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, X } from 'lucide-react';
import { db } from '../db';

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Editor() {
  const { projectId, chapterId } = useParams();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('editorFontSize');
    return saved ? parseInt(saved, 10) : 18;
  });
  const [autoIndent, setAutoIndent] = useState(() => {
    const saved = localStorage.getItem('editorAutoIndent');
    return saved ? JSON.parse(saved) : false;
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Save settings
  useEffect(() => {
    localStorage.setItem('editorFontSize', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('editorAutoIndent', JSON.stringify(autoIndent));
  }, [autoIndent]);

  // Load initial data
  useEffect(() => {
    const loadChapter = async () => {
      if (!chapterId) return;
      const chapter = await db.chapters.get(chapterId);
      if (chapter) {
        setTitle(chapter.title);
        setContent(chapter.content);
        setWordCount(chapter.wordCount);
      }
      setIsLoaded(true);
    };
    loadChapter();
  }, [chapterId]);

  const debouncedContent = useDebounce(content, 1000);
  const debouncedTitle = useDebounce(title, 1000);

  // Auto save
  useEffect(() => {
    if (!isLoaded || !chapterId) return;
    
    const saveToDb = async () => {
      const currentWordCount = debouncedContent.trim() ? debouncedContent.trim().replace(/\\s+/g, '').length : 0;
      await db.chapters.update(chapterId, {
        title: debouncedTitle,
        content: debouncedContent,
        wordCount: currentWordCount,
        updatedAt: Date.now()
      });
      setWordCount(currentWordCount);
    };
    
    saveToDb();
  }, [debouncedContent, debouncedTitle, chapterId, isLoaded]);

  // Handle auto-indent on Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && autoIndent) {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newContent = content.substring(0, start) + '\n　　' + content.substring(end);
      setContent(newContent);
      
      // Update cursor position after React re-renders
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 3; // \n + two full-width spaces
      }, 0);
    }
  };

  if (!isLoaded) return <div style={{ padding: '24px' }}>載入中...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--editor-bg)' }}>
      {/* Top Bar */}
      <header style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--card-bg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <button onClick={() => navigate(`/project/${projectId}`)} style={{ marginRight: '16px', padding: '4px' }}>
            <ArrowLeft size={24} />
          </button>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ 
              fontSize: '18px', fontWeight: 'bold', border: 'none', 
              background: 'transparent', outline: 'none', width: '100%',
              color: 'var(--text-color)'
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '12px', color: 'var(--border-color)' }}>{wordCount} 字</span>
          <button onClick={() => setShowSettings(true)} style={{ padding: '4px' }}>
            <Settings size={20} color="var(--text-color)" />
          </button>
        </div>
      </header>

      {/* Editor Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0', position: 'relative' }}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="開始寫作..."
          style={{
            flex: 1,
            width: '100%',
            maxWidth: '800px',
            margin: '0 auto',
            padding: '24px',
            fontSize: `${fontSize}px`,
            lineHeight: '1.8',
            border: 'none',
            background: 'transparent',
            outline: 'none',
            resize: 'none',
            color: 'var(--editor-text)'
          }}
        />
      </main>

      {/* Settings Dialog */}
      {showSettings && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'flex-end', zIndex: 1000
        }}>
          <div className="card" style={{ 
            width: '100%', margin: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px' }}>編輯器設定</h2>
              <button onClick={() => setShowSettings(false)}><X size={24} /></button>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label>字體大小</label>
                <span>{fontSize}px</span>
              </div>
              <input 
                type="range" 
                min="12" max="32" 
                value={fontSize} 
                onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block' }}>首行自動縮排</label>
                <span style={{ fontSize: '12px', color: 'var(--border-color)' }}>換行時自動插入兩個全形空白</span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={autoIndent}
                  onChange={(e) => setAutoIndent(e.target.checked)}
                  style={{ width: '20px', height: '20px' }}
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
