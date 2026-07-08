import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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
        <div style={{ fontSize: '12px', color: 'var(--border-color)', minWidth: '60px', textAlign: 'right' }}>
          {wordCount} 字
        </div>
      </header>

      {/* Editor Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0' }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="開始寫作..."
          style={{
            flex: 1,
            width: '100%',
            maxWidth: '800px',
            margin: '0 auto',
            padding: '24px',
            fontSize: '18px',
            lineHeight: '1.8',
            border: 'none',
            background: 'transparent',
            outline: 'none',
            resize: 'none',
            color: 'var(--editor-text)'
          }}
        />
      </main>
    </div>
  );
}
