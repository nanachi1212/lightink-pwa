import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Plus, FileText, Users, Menu, Trash2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
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
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');

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

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !chapters) return;
    
    const items = Array.from(chapters);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update the 'order' field for all affected chapters
    const updates = items.map((item, index) => ({
      key: item.id,
      changes: { order: index }
    }));
    
    // Perform a bulk update
    await db.chapters.bulkUpdate(updates);
  };

  const handleDeleteChapter = async (e: React.MouseEvent, chapterId: string, title: string) => {
    e.stopPropagation();
    if (window.confirm(`確定要刪除章節「${title}」嗎？此操作無法復原。`)) {
      await db.chapters.delete(chapterId);
    }
  };

  const handleEditTitleSave = async () => {
    if (editTitle.trim() && id) {
      await db.projects.update(id, { title: editTitle.trim(), updatedAt: Date.now() });
    }
    setIsEditingTitle(false);
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
        {isEditingTitle ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleEditTitleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleEditTitleSave()}
            style={{ fontSize: '20px', fontWeight: 'bold', border: '1px solid var(--accent-color)', borderRadius: '4px', padding: '4px 8px', background: 'var(--bg-color)', color: 'var(--text-color)', width: '100%' }}
            autoFocus
          />
        ) : (
          <h1 
            onClick={() => { setEditTitle(project.title); setIsEditingTitle(true); }}
            style={{ fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', margin: 0, padding: '4px 8px' }}
            title="點擊修改書名"
          >
            {project.title}
          </h1>
        )}
      </header>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <h2 style={{ fontSize: '16px', color: 'var(--border-color)' }}>章節目錄</h2>
        <button 
          onClick={() => navigate(`/project/${id}/characters`)}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: 'var(--accent-color)' }}
        >
          <Users size={16} />
          角色設定
        </button>
      </div>

      {chapters?.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '64px', color: 'var(--border-color)' }}>
          <FileText size={48} style={{ margin: '0 auto 16px' }} />
          <p>尚未建立章節，開始寫作吧！</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="chapters-list">
            {(provided) => (
              <div 
                {...provided.droppableProps} 
                ref={provided.innerRef}
                style={{ display: 'grid', gap: '12px' }}
              >
                {chapters?.map((chapter, index) => (
                  <Draggable key={chapter.id} draggableId={chapter.id} index={index}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="card"
                        onClick={() => navigate(`/project/${id}/editor/${chapter.id}`)}
                        style={{ 
                          ...provided.draggableProps.style,
                          cursor: 'pointer', margin: 0, padding: '12px 16px',
                          display: 'flex', alignItems: 'center', gap: '12px',
                          opacity: snapshot.isDragging ? 0.8 : 1,
                          boxShadow: snapshot.isDragging ? '0 8px 16px rgba(0,0,0,0.1)' : undefined
                        }}
                      >
                        <div 
                          {...provided.dragHandleProps} 
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: 'var(--border-color)', cursor: 'grab', display: 'flex', alignItems: 'center' }}
                        >
                          <Menu size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '16px' }}>{chapter.title}</h3>
                          <div style={{ fontSize: '12px', color: 'var(--border-color)', marginTop: '4px' }}>
                            字數: {chapter.wordCount} | {new Date(chapter.updatedAt).toLocaleDateString()}
                          </div>
                          {chapter.tags && chapter.tags.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                              {chapter.tags.map(tag => (
                                <span key={tag} style={{ 
                                  backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-color)', 
                                  padding: '2px 8px', borderRadius: '12px', fontSize: '10px' 
                                }}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={(e) => handleDeleteChapter(e, chapter.id, chapter.title)}
                          style={{ padding: '8px', color: '#ef4444', opacity: 0.8, background: 'none', border: 'none' }}
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
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
