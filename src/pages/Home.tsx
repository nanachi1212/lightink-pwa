import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Book, PenTool, Settings } from 'lucide-react';
import { db } from '../db';

export default function Home() {
  const navigate = useNavigate();
  const projects = useLiveQuery(() => db.projects.orderBy('updatedAt').reverse().toArray());
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleCreateProject = async () => {
    if (!newTitle.trim()) return;
    const now = Date.now();
    const id = uuidv4();
    await db.projects.add({
      id,
      title: newTitle.trim(),
      createdAt: now,
      updatedAt: now,
    });
    setNewTitle('');
    setShowNewDialog(false);
    navigate(`/project/${id}`);
  };

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Book size={28} style={{ marginRight: '12px', color: 'var(--accent-color)' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>InkNovel</h1>
        </div>
        <button onClick={() => navigate('/settings')} style={{ color: 'var(--text-color)', padding: '8px' }}>
          <Settings size={24} />
        </button>
      </header>

      {projects?.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '64px', color: 'var(--border-color)' }}>
          <PenTool size={48} style={{ margin: '0 auto 16px' }} />
          <p>尚未建立任何作品，點擊右下角開始創作吧！</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {projects?.map((proj) => (
            <div 
              key={proj.id} 
              className="card"
              onClick={() => navigate(`/project/${proj.id}`)}
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>{proj.title}</h3>
                <span style={{ fontSize: '12px', color: 'var(--border-color)' }}>
                  最後更新：{new Date(proj.updatedAt).toLocaleDateString()}
                </span>
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
            <h2 style={{ marginBottom: '16px' }}>新增作品</h2>
            <input 
              type="text" 
              placeholder="作品名稱" 
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
                onClick={handleCreateProject}
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
