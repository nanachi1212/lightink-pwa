import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Plus, Users, X } from 'lucide-react';
import { db, type Character } from '../db';

export default function Characters() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const characters = useLiveQuery(() => 
    db.characters.where('projectId').equals(projectId as string).toArray()
  , [projectId]);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingChar, setEditingChar] = useState<Partial<Character> | null>(null);

  const handleSave = async () => {
    if (!editingChar?.name?.trim() || !projectId) return;
    
    const now = Date.now();
    if (editingChar.id) {
      await db.characters.update(editingChar.id, {
        name: editingChar.name.trim(),
        role: editingChar.role?.trim() || '',
        description: editingChar.description?.trim() || '',
        updatedAt: now
      });
    } else {
      await db.characters.add({
        id: uuidv4(),
        projectId,
        name: editingChar.name.trim(),
        role: editingChar.role?.trim() || '',
        description: editingChar.description?.trim() || '',
        createdAt: now,
        updatedAt: now
      });
    }
    
    setEditingChar(null);
    setShowEditDialog(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('確定要刪除這位角色嗎？')) {
      await db.characters.delete(id);
      if (editingChar?.id === id) {
        setShowEditDialog(false);
      }
    }
  };

  const openEdit = (char?: Character) => {
    if (char) {
      setEditingChar(char);
    } else {
      setEditingChar({ name: '', role: '', description: '' });
    }
    setShowEditDialog(true);
  };

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <button 
          onClick={() => navigate(`/project/${projectId}`)} 
          style={{ marginRight: '16px', padding: '8px' }}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>角色卡</h1>
      </header>

      {characters?.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '64px', color: 'var(--border-color)' }}>
          <Users size={48} style={{ margin: '0 auto 16px' }} />
          <p>尚未建立角色，新增第一位角色吧！</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
          {characters?.map((char) => (
            <div 
              key={char.id} 
              className="card"
              onClick={() => openEdit(char)}
              style={{ cursor: 'pointer', margin: 0, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '32px', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', fontSize: '24px', color: 'white' }}>
                {char.name.charAt(0)}
              </div>
              <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>{char.name}</h3>
              <div style={{ fontSize: '12px', color: 'var(--accent-color)' }}>
                {char.role || '未設定身份'}
              </div>
            </div>
          ))}
        </div>
      )}

      {showEditDialog && editingChar && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px' }}>{editingChar.id ? '編輯角色' : '新增角色'}</h2>
              <button onClick={() => setShowEditDialog(false)}><X size={24} /></button>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>角色名稱</label>
              <input 
                type="text" 
                value={editingChar.name}
                onChange={e => setEditingChar({...editingChar, name: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>身份 / 稱號</label>
              <input 
                type="text" 
                value={editingChar.role}
                onChange={e => setEditingChar({...editingChar, role: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}
                placeholder="例如：主角、反派、劍士"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>外貌與背景設定</label>
              <textarea 
                value={editingChar.description}
                onChange={e => setEditingChar({...editingChar, description: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', minHeight: '120px', resize: 'vertical' }}
                placeholder="記錄角色的外觀、性格、背景故事..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {editingChar.id ? (
                <button onClick={() => handleDelete(editingChar.id as string)} style={{ color: '#ff4d4f', padding: '8px' }}>刪除</button>
              ) : <div></div>}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setShowEditDialog(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>取消</button>
                <button onClick={handleSave} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'var(--accent-color)', color: 'white' }}>儲存</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button className="fab" onClick={() => openEdit()}>
        <Plus size={24} />
      </button>
    </div>
  );
}
