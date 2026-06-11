import React, { useState } from 'react';
import { GameEngine } from './game/engine';
import { GameUI } from './components/GameUI';
import type { CardPair } from './game/types';

import prasejarah from '../deck/sejarah-indonesia/1-prasejarah.json';
import hinduBuddha from '../deck/sejarah-indonesia/2-hindu-buddha.json';
import islam from '../deck/sejarah-indonesia/3-islam.json';
import penjajahan from '../deck/sejarah-indonesia/4-penjajahan.json';
import kemerdekaan from '../deck/sejarah-indonesia/5-kemerdekaan-reformasi.json';

const PREDEFINED_DECKS = [
  { id: '1-prasejarah', title: 'Prasejarah', desc: 'Zaman sebelum mengenal tulisan', data: prasejarah, icon: '🦕' },
  { id: '2-hindu-buddha', title: 'Hindu-Buddha', desc: 'Masa kejayaan kerajaan nusantara', data: hinduBuddha, icon: '🛕' },
  { id: '3-islam', title: 'Kesultanan Islam', desc: 'Penyebaran dan kejayaan Islam', data: islam, icon: '🕌' },
  { id: '4-penjajahan', title: 'Masa Penjajahan', desc: 'Kolonialisme dan perjuangan awal', data: penjajahan, icon: '⚓' },
  { id: '5-kemerdekaan-reformasi', title: 'Kemerdekaan Hingga Reformasi', desc: 'Proklamasi dan dinamika republik', data: kemerdekaan, icon: '🇮🇩' },
];

export default function App() {
  const [gameData, setGameData] = useState<CardPair[] | null>(null);
  const [difficulty, setDifficulty] = useState<number>(5);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ text: string, type: 'default' | 'success' | 'error' }>({ text: 'Pilih era atau unggah deck (JSON)', type: 'default' });
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [gameCount, setGameCount] = useState<number>(0);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');

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
            setSelectedDeckId('custom');
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
          setSelectedDeckId('');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSelectDeck = (deck: typeof PREDEFINED_DECKS[0]) => {
    if (validateGameData(deck.data)) {
      setGameData(deck.data);
      setSelectedDeckId(deck.id);
      setUploadStatus({ text: `✅ Memilih Era: ${deck.title}`, type: 'success' });
      setUploadFileName(`${deck.data.length} Pasang Kartu`);
    } else {
      alert("Format data deck tidak valid.");
    }
  };

  const startGame = () => {
    if (gameData) {
      const newEngine = new GameEngine(gameData, difficulty, () => {});
      setEngine(newEngine);
      setGameCount(prev => prev + 1);
    }
  };

  if (engine) {
    return <GameUI key={gameCount} engine={engine} onQuit={() => setEngine(null)} onRestart={startGame} />;
  }

  return (
    <div className="home-screen">
      <h1 className="home-title">Histora</h1>
      <p className="home-subtitle">Game Urutan Waktu & Sejarah Interaktif</p>
      
      <div className="setup-panel glass">
        <h3 style={{ marginBottom: '0.2rem', color: 'var(--accent-cyan)' }}>Pilih Era Sejarah</h3>
        
        <div className="era-grid">
          {PREDEFINED_DECKS.map(deck => (
            <button
              key={deck.id}
              className={`era-btn ${selectedDeckId === deck.id ? 'active' : ''}`}
              onClick={() => handleSelectDeck(deck)}
            >
              <div className="era-icon">{deck.icon}</div>
              <div className="era-info">
                <div className="era-title">{deck.title}</div>
                <div className="era-desc">{deck.desc}</div>
              </div>
            </button>
          ))}
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.5rem 0', textAlign: 'center' }}>- ATAU -</div>
        
        <div 
          className={`upload-area ${isDragOver ? 'dragover' : ''} ${selectedDeckId === 'custom' ? 'active-custom' : ''}`}
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
            {selectedDeckId === 'custom' ? uploadStatus.text : 'Unggah Deck Sendiri (JSON)'}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {selectedDeckId === 'custom' ? uploadFileName : 'Seret file JSON ke sini atau klik'}
          </p>
          <input type="file" className="file-input" accept=".json" onChange={handleFileUpload} />
        </div>
        
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
