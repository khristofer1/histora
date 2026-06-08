import React, { useState } from 'react';
import { GameEngine } from './game/engine';
import { GameUI } from './components/GameUI';
import type { CardPair } from './game/types';

export default function App() {
  const [gameData, setGameData] = useState<CardPair[] | null>(null);
  const [difficulty, setDifficulty] = useState<number>(5);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ text: string, type: 'default' | 'success' | 'error' }>({ text: 'Unggah Berkas Game (JSON)', type: 'default' });
  const [uploadFileName, setUploadFileName] = useState<string>('Seret file JSON ke sini atau klik untuk memilih');
  const [isDragOver, setIsDragOver] = useState(false);

  const validateGameData = (data: any): boolean => {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(item => (
      item?.event_card?.id &&
      item?.event_card?.question &&
      item?.event_card?.displayDate &&
      typeof item?.event_card?.sortDate === 'number' &&
      item?.event_card?.title &&
      item?.event_card?.description &&
      item?.character_card?.id &&
      item?.character_card?.name &&
      item?.character_card?.description
    ));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (validateGameData(json)) {
            setGameData(json);
            setUploadStatus({ text: '✅ Berkas Berhasil Dimuat', type: 'success' });
            setUploadFileName(`${file.name} (${json.length} Pasang Kartu)`);
          } else {
            throw new Error("Format data JSON tidak valid. Pastikan berisi event_card dan character_card.");
          }
        } catch (error: any) {
          alert(`Gagal memuat JSON: ${error.message}`);
          setUploadStatus({ text: '❌ Gagal Memuat Berkas', type: 'error' });
          setUploadFileName('Silakan coba file JSON lain');
          setGameData(null);
        }
      };
      reader.readAsText(file);
    }
  };

  const loadDefaultData = async () => {
    try {
      const response = await fetch('/data.json');
      if (!response.ok) throw new Error("Gagal mengunduh file default");
      const defaultData = await response.json();
      if (validateGameData(defaultData)) {
        setGameData(defaultData);
        setUploadStatus({ text: '✅ Menggunakan Data Bawaan', type: 'success' });
        setUploadFileName(`data.json (${defaultData.length} Pasang Kartu)`);
      }
    } catch (err: any) {
      alert(`Gagal memuat data bawaan: ${err.message}`);
    }
  };

  const startGame = () => {
    if (gameData) {
      const newEngine = new GameEngine(gameData, difficulty, () => {});
      setEngine(newEngine);
    }
  };

  if (engine) {
    return <GameUI engine={engine} onQuit={() => setEngine(null)} />;
  }

  return (
    <div className="home-screen">
      <h1 className="home-title">Histora</h1>
      <p className="home-subtitle">Game Urutan Waktu & Sejarah Interaktif</p>
      
      <div className="setup-panel glass">
        <h3 style={{ marginBottom: '0.5rem', color: 'var(--accent-cyan)' }}>Persiapan Permainan</h3>
        
        <div 
          className={`upload-area ${isDragOver ? 'dragover' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragOver(false); }}
        >
          <div className="upload-icon">📥</div>
          <div 
            style={{ 
              fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem',
              color: uploadStatus.type === 'success' ? 'var(--correct-color)' : uploadStatus.type === 'error' ? 'var(--wrong-color)' : 'inherit'
            }}
          >
            {uploadStatus.text}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{uploadFileName}</p>
          <input type="file" className="file-input" accept=".json" onChange={handleFileUpload} />
        </div>
        
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '-0.5rem 0' }}>- ATAU -</div>
        
        <button className="dialog-btn secondary" style={{ padding: '0.8rem' }} onClick={loadDefaultData}>
          Gunakan Data Bawaan (Default)
        </button>
        
        <div className="difficulty-container">
          <div className="difficulty-label">Jumlah Kartu Tokoh Awal (Tingkat Kesulitan):</div>
          <div className="difficulty-options">
            {[5, 6, 7, 8].map(diff => (
              <button 
                key={diff}
                className={`difficulty-btn ${difficulty === diff ? 'active' : ''}`}
                onClick={() => setDifficulty(diff)}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
        
        <button className="start-btn" disabled={!gameData} onClick={startGame}>
          Mulai Bermain
        </button>
      </div>
    </div>
  );
}
