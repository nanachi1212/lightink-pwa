import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Upload, Save } from 'lucide-react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { db } from '../db';

export default function Settings() {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Collect all data
      const projects = await db.projects.toArray();
      const chapters = await db.chapters.toArray();
      const inspirations = await db.inspirations.toArray();
      const characters = await db.characters.toArray();

      const backupData = {
        version: 1,
        timestamp: Date.now(),
        data: { projects, chapters, inspirations, characters }
      };

      const jsonStr = JSON.stringify(backupData);
      const fileName = `InkNovel_Backup_${new Date().toISOString().split('T')[0]}.json`;

      // Save to temporary file in cache directory
      const fileResult = await Filesystem.writeFile({
        path: fileName,
        data: jsonStr,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
      });

      // Share the file
      await Share.share({
        title: '匯出 InkNovel 備份',
        text: '這是一份 InkNovel 備份檔案，您可以儲存到 Google 雲端硬碟或其他地方。',
        url: fileResult.uri,
        dialogTitle: '分享或儲存備份檔案'
      });

      alert('備份檔已生成並開啟分享選單！');
    } catch (error) {
      console.error('Export failed:', error);
      alert('匯出失敗，可能不支援此功能或發生錯誤。');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm('匯入備份將會覆寫或合併現有資料，強烈建議匯入前先「匯出」目前的備份，請問確定要匯入嗎？')) {
      event.target.value = '';
      return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      if (!backupData || !backupData.data) {
        throw new Error('無效的備份檔案格式');
      }

      const { projects, chapters, inspirations, characters } = backupData.data;

      // Start a transaction to import all data
      await db.transaction('rw', db.projects, db.chapters, db.inspirations, db.characters, async () => {
        if (projects?.length) await db.projects.bulkPut(projects);
        if (chapters?.length) await db.chapters.bulkPut(chapters);
        if (inspirations?.length) await db.inspirations.bulkPut(inspirations);
        if (characters?.length) await db.characters.bulkPut(characters);
      });

      alert('資料匯入成功！');
      navigate('/');
    } catch (error) {
      console.error('Import failed:', error);
      alert('匯入失敗，請確認檔案格式是否正確。');
    } finally {
      setIsImporting(false);
      event.target.value = ''; // Reset input
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ marginRight: '16px', padding: '8px' }}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>設定與備份</h1>
      </header>

      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '16px', color: 'var(--border-color)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>資料同步與備份</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-color)', marginBottom: '16px', lineHeight: '1.6' }}>
          您可以將所有寫作資料匯出成單一的 JSON 檔案，並且透過分享選單直接**儲存到 Google 雲端硬碟**。更換設備或需要還原時，將該檔案下載到手機並選擇匯入即可。
        </p>

        <div style={{ display: 'grid', gap: '16px' }}>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', 
              padding: '16px', borderRadius: '12px', border: 'none', 
              backgroundColor: 'var(--accent-color)', color: 'white', fontSize: '16px',
              opacity: isExporting ? 0.7 : 1
            }}
          >
            <Download size={20} />
            {isExporting ? '處理中...' : '匯出備份 (分享至 Google Drive)'}
          </button>

          <label style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', 
            padding: '16px', borderRadius: '12px', border: '1px solid var(--accent-color)', 
            backgroundColor: 'transparent', color: 'var(--accent-color)', fontSize: '16px',
            cursor: 'pointer', opacity: isImporting ? 0.7 : 1
          }}>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImport} 
              disabled={isImporting}
              style={{ display: 'none' }} 
            />
            <Upload size={20} />
            {isImporting ? '匯入中...' : '從檔案匯入備份'}
          </label>
        </div>
      </div>
      
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '16px', color: 'var(--border-color)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>關於 InkNovel</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Save size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', margin: '0 0 4px 0' }}>InkNovel</h3>
            <p style={{ fontSize: '14px', color: 'var(--border-color)', margin: 0 }}>版本 1.1.0 (離線優先的長篇寫作工具)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
