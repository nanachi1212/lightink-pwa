import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Plus, FileText } from 'lucide-react';
import { db } from '../db';

export default function ProjectDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const project = useLiveQuery(() => db.projects.get(id as string), [id]);
  const chapters = useLiveQuery(() => 
    db.chapters.where('projectId').equals(id as string).sortBy('order')
  , [id]);

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleCreateChapter = async () => {
    if (!newTitle.trim() || !id) return;
    const now = Date.now();
    const chapterId = uuidv4();
    const order = chapters ? chapters.length : 0;
    
    await db.chapters.add({
      id: chapterId,
      projectId: id,
      title: newTitle.trim(),
      content: '',
      summary: '',
      status: 'draft',
      tags: [],
      order,
      wordCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    
    setNewTitle('');
    setShowNewDialog(false);
    navigate(`/project/${id}/editor/${chapterId}`);
  };

  if (!project) return <div style={{ padding: '24px' }}>載入中...</div>;

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <button 
          onClick={() => navigate('/')} 
          style={{ marginRight: '16px', padding: '8px' }}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>{project.title}</h1>
      </header>

      <div style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <h2 style={{ fontSize: '16px', color: 'var(--border-color)' }}>章節目錄</h2>
      </div>

      {chapters?.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '64px', color: 'var(--border-color)' }}>
          <FileText size={48} style={{ margin: '0 auto 16px' }} />
          <p>尚未建立章節，開始寫作吧！</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {chapters?.map((chapter) => (
            <div 
              key={chapter.id} 
              className="card"
              onClick={() => navigate(`/project/${id}/editor/${chapter.id}`)}
              style={{ cursor: 'pointer', margin: 0, padding: '12px 16px' }}
            >
              <h3 style={{ fontSize: '16px' }}>{chapter.title}</h3>
              <div style={{ fontSize: '12px', color: 'var(--border-color)', marginTop: '4px' }}>
                字數: {chapter.wordCount} | {new Date(chapter.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {showNewDialog && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '90%', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '16px' }}>新增章節</h2>
            <input 
              type="text" 
              placeholder="章節名稱" 
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              style={{ 
                width: '100%', padding: '12px', marginBottom: '16px', 
                borderRadius: '8px', border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-color)'
              }}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                onClick={() => setShowNewDialog(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              >取消</button>
              <button 
                onClick={handleCreateChapter}
                style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'var(--accent-color)', color: 'white' }}
              >建立</button>
            </div>
          </div>
        </div>
      )}

      <button className="fab" onClick={() => setShowNewDialog(true)}>
        <Plus size={24} />
      </button>
    </div>
  );
}
