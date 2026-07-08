import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Plus, Users, Maximize2 } from 'lucide-react';
import { db, type Character } from '../db';

export default function Characters() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const characters = useLiveQuery(() => 
    db.characters.where('projectId').equals(projectId as string).toArray()
  , [projectId]);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingChar, setEditingChar] = useState<Partial<Character> | null>(null);
  const [isFullscreenDesc, setIsFullscreenDesc] = useState(false);

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
          position: 'fixed', inset: 0, backgroundColor: 'var(--bg-color)',
          display: 'flex', flexDirection: 'column', zIndex: 1000
        }}>
          {isFullscreenDesc ? (
            <>
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button onClick={() => setIsFullscreenDesc(false)}><ArrowLeft size={24} /></button>
                  <h2 style={{ fontSize: '18px', margin: 0 }}>編輯外貌與背景</h2>
                </div>
                <button onClick={() => setIsFullscreenDesc(false)} style={{ color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '16px' }}>完成</button>
              </header>
              <textarea 
                value={editingChar.description}
                onChange={e => setEditingChar({...editingChar, description: e.target.value})}
                style={{ flex: 1, width: '100%', padding: '16px', border: 'none', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', fontSize: '16px', resize: 'none', outline: 'none' }}
                placeholder="記錄角色的外觀、性格、背景故事..."
                autoFocus
              />
            </>
          ) : (
            <>
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button onClick={() => setShowEditDialog(false)}><ArrowLeft size={24} /></button>
                  <h2 style={{ fontSize: '18px', margin: 0 }}>{editingChar.id ? '編輯角色' : '新增角色'}</h2>
                </div>
                <button onClick={handleSave} style={{ color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '16px' }}>儲存</button>
              </header>
              
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--border-color)' }}>角色名稱</label>
                  <input 
                    type="text" 
                    value={editingChar.name}
                    onChange={e => setEditingChar({...editingChar, name: e.target.value})}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-color)', fontSize: '16px' }}
                    placeholder="輸入角色名稱"
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--border-color)' }}>身份 / 稱號</label>
                  <input 
                    type="text" 
                    value={editingChar.role}
                    onChange={e => setEditingChar({...editingChar, role: e.target.value})}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-color)', fontSize: '16px' }}
                    placeholder="例如：主角、反派、劍士"
                  />
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '14px', color: 'var(--border-color)' }}>外貌與背景設定</label>
                    <button 
                      onClick={() => setIsFullscreenDesc(true)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--accent-color)' }}
                    >
                      <Maximize2 size={14} />
                      全螢幕編輯
                    </button>
                  </div>
                  <textarea 
                    value={editingChar.description}
                    onChange={e => setEditingChar({...editingChar, description: e.target.value})}
                    onClick={() => setIsFullscreenDesc(true)}
                    style={{ flex: 1, width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-color)', fontSize: '16px', minHeight: '200px', resize: 'none' }}
                    placeholder="點擊進入全螢幕編輯..."
                    readOnly
                  />
                </div>

                {editingChar.id && (
                  <button 
                    onClick={() => handleDelete(editingChar.id as string)} 
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ef4444', color: '#ef4444', width: '100%', backgroundColor: 'transparent', fontSize: '16px' }}
                  >
                    刪除角色
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <button className="fab" onClick={() => openEdit()}>
        <Plus size={24} />
      </button>
    </div>
  );
}
