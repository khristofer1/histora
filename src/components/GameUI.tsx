import React, { useState, useEffect } from 'react';
import { GameEngine } from '../game/engine';
import type { GameState } from '../game/types';
import Timeline from './Timeline';
import Hand from './Hand';
import ActionModal from './ActionModal';

type PlayMode = 
  | 'PLACE_EVENT' 
  | 'PLACEMENT_FEEDBACK'
  | 'ACTION_CHOOSE' 
  | 'PUT_SELECT_CHAR' 
  | 'PUT_SELECT_EVENT' 
  | 'REFRESH_SELECT';

interface GameUIProps {
  engine: GameEngine;
  onQuit: () => void;
}

export const GameUI: React.FC<GameUIProps> = ({ engine, onQuit }) => {
  const [gameState, setGameState] = useState<GameState>(engine.getState());
  const [playMode, setPlayMode] = useState<PlayMode>('PLACE_EVENT');
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [refreshList, setRefreshList] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [feedbackData, setFeedbackData] = useState<{ isCorrect: boolean, placedCard: any } | null>(null);
  const [zoomedItem, setZoomedItem] = useState<{ id: string; type: 'event' | 'character' } | null>(null);

  const handleToggleZoom = (id: string | null, type: 'event' | 'character' | null) => {
    if (!id || !type) {
      setZoomedItem(null);
    } else {
      setZoomedItem(prev => {
        if (prev && prev.id === id && prev.type === type) {
          return null;
        }
        return { id, type };
      });
    }
  };

  useEffect(() => {
    // Monkey patch the engine's onStateChange callback for Reactivity
    const originalCb = (engine as any).onStateChange;
    (engine as any).onStateChange = (state: GameState) => {
      setGameState({ ...state });
      if (originalCb) originalCb(state);
    };
  }, [engine]);

  useEffect(() => {
    if (!gameState.currentTurnEventCard && playMode === 'PLACE_EVENT') {
      setPlayMode('ACTION_CHOOSE');
    }
  }, [gameState.currentTurnEventCard, playMode]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleEventPlacement = (index: number) => {
    const placedCard = gameState.currentTurnEventCard;
    if (!placedCard) return;

    const isCorrect = engine.placeEvent(index);
    setFeedbackData({ isCorrect, placedCard });
    setPlayMode('PLACEMENT_FEEDBACK');
    
    if (isCorrect) {
      showToast('✅ Benar! Silakan pilih aksi giliran.', 'success');
    } else {
      showToast('❌ Salah urutan! Sistem membetulkannya, nyawa -1, & ambil 1 tokoh.', 'error');
    }
    setGameState(engine.getState());
  };

  const handleCloseFeedback = () => {
    if (feedbackData?.isCorrect) {
      setPlayMode('ACTION_CHOOSE');
    } else {
      setPlayMode('PLACE_EVENT');
    }
    setFeedbackData(null);
  };

  const handleCharacterPlacement = (eventId: string) => {
    if (selectedCharId) {
      const success = engine.putCharacter(selectedCharId, eventId);
      if (success) {
        showToast('✅ Tokoh berhasil ditempatkan!', 'success');
        resetModes();
      } else {
        showToast('❌ Tokoh tidak cocok dengan peristiwa ini!', 'error');
        setPlayMode('PUT_SELECT_CHAR');
        setSelectedCharId(null);
      }
      setGameState(engine.getState());
    }
  };

  const confirmRefresh = () => {
    engine.refreshCharacters(refreshList);
    resetModes();
    showToast('✅ Dek tokoh berhasil ditukar!', 'success');
    setGameState(engine.getState());
  };

  const resetModes = () => {
    setPlayMode('PLACE_EVENT');
    setSelectedCharId(null);
    setRefreshList([]);
  };

  if (gameState.isGameOver && playMode !== 'PLACEMENT_FEEDBACK') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', textAlign: 'center', padding: '2rem' }} className="glass">
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', color: gameState.isWin ? 'var(--correct-color)' : 'var(--wrong-color)' }}>
          {gameState.isWin ? 'KAMU MENANG! 🏆' : 'GAME OVER 💀'}
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.5, marginBottom: '2rem' }}>
          {gameState.isWin 
            ? 'Luar biasa! Kamu berhasil menyusun kronologi waktu sejarah dan mencocokkan semua tokoh dengan tepat!' 
            : 'Sayang sekali, nyawa sejarahmu habis karena terlalu banyak salah urutan peristiwa.'}
        </p>
        <button onClick={onQuit} className="start-btn" style={{ padding: '1rem 3rem' }}>Main Lagi</button>
      </div>
    );
  }

  const puttableCharIds = gameState.playerHand
    .filter(char => {
      const matchingEventId = gameState.relatedEventCards[char.id];
      const isOnTimeline = gameState.timeline.some(t => t.event.id === matchingEventId);
      const isAlreadyPlaced = !!gameState.charactersOnTimeline[matchingEventId];
      return isOnTimeline && !isAlreadyPlaced;
    })
    .map(char => char.id);

  const canPutAnyCharacter = puttableCharIds.length > 0;

  return (
    <>
      <div className="top-bar">
        <h2>Histora</h2>
        <div className="lives">{'❤️'.repeat(gameState.lives)}</div>
      </div>
      
      {playMode === 'PLACE_EVENT' && gameState.currentTurnEventCard && (
        <div className="question-banner glass">
          <div className="question-icon">❓</div>
          <div className="question-content">
            <div className="question-label">Pertanyaan saat ini (ketuk slot + untuk menjawab):</div>
            <div className="question-text">{gameState.currentTurnEventCard.question}</div>
          </div>
        </div>
      )}

      {playMode === 'PLACEMENT_FEEDBACK' && feedbackData && (
        <div className={`question-banner glass ${feedbackData.isCorrect ? 'correct-banner' : 'wrong-banner'}`}>
          <div className="question-icon">{feedbackData.isCorrect ? '✅' : '❌'}</div>
          <div className="question-content">
            <div className="question-label" style={{ color: feedbackData.isCorrect ? 'var(--correct-color)' : 'var(--wrong-color)' }}>
              {feedbackData.isCorrect ? 'Urutan Benar!' : 'Urutan Salah!'}
            </div>
            <div className="question-text">
              {feedbackData.isCorrect 
                ? `Peristiwa "${feedbackData.placedCard.title}" berhasil diurutkan.` 
                : `Peristiwa "${feedbackData.placedCard.title}" dimasukkan ke posisi yang tepat oleh sistem.`}
            </div>
          </div>
        </div>
      )}

      {playMode === 'PUT_SELECT_CHAR' && (
        <div className="glass" style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', zIndex: 20, padding: '0.8rem 1.5rem', borderRadius: '30px', border: '1px solid var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>👈 Pilih 1 tokoh dari tangan Anda</span>
          <button onClick={resetModes} className="dialog-btn danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '15px' }}>Batal</button>
        </div>
      )}

      {playMode === 'PUT_SELECT_EVENT' && (
        <div className="glass" style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', zIndex: 20, padding: '0.8rem 1.5rem', borderRadius: '30px', border: '1px solid var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>👇 Ketuk slot di bawah peristiwa yang cocok</span>
          <button onClick={resetModes} className="dialog-btn danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '15px' }}>Batal</button>
        </div>
      )}

      {playMode === 'REFRESH_SELECT' && (
        <div className="glass" style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', zIndex: 20, padding: '0.8rem 1.5rem', borderRadius: '20px', border: '1px solid var(--accent-cyan)', textAlign: 'center', width: '90%', maxWidth: '350px' }}>
          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.8rem' }}>Pilih kartu-kartu tokoh yang ingin ditukar:</p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button onClick={confirmRefresh} className="dialog-btn primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} disabled={refreshList.length === 0}>
              Tukar ({refreshList.length} Kartu)
            </button>
            <button onClick={resetModes} className="dialog-btn secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Batal</button>
          </div>
        </div>
      )}

      <Timeline 
        timeline={gameState.timeline} 
        charactersOnTimeline={gameState.charactersOnTimeline}
        playMode={playMode}
        currentTurnEventCard={gameState.currentTurnEventCard}
        onPlaceEvent={handleEventPlacement}
        onPlaceCharacter={handleCharacterPlacement}
        highlightedCardId={feedbackData?.placedCard?.id}
        highlightedCardIsCorrect={feedbackData?.isCorrect}
        zoomedCardId={zoomedItem?.id || null}
        zoomedType={zoomedItem?.type || null}
        onToggleZoom={handleToggleZoom}
      />

      {playMode !== 'PLACEMENT_FEEDBACK' ? (
        <Hand 
          playerHand={gameState.playerHand}
          playMode={playMode}
          selectedCharId={selectedCharId}
          refreshList={refreshList}
          onSelectChar={(id) => {
            setSelectedCharId(id);
            setPlayMode('PUT_SELECT_EVENT');
          }}
          onToggleRefresh={(id) => {
            if (refreshList.includes(id)) {
              setRefreshList(refreshList.filter(rid => rid !== id));
            } else {
              setRefreshList([...refreshList, id]);
            }
          }}
          puttableCharIds={puttableCharIds}
        />
      ) : (
        feedbackData && (
          <div className="hand-area" style={{ zIndex: 30 }}>
            <div className="glass" style={{ padding: '1.2rem 2rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', maxWidth: '400px', width: '90%', margin: '0 auto 2.5rem auto', border: `1px solid ${feedbackData.isCorrect ? 'var(--correct-color)' : 'var(--wrong-color)'}` }}>
              <h4 style={{ color: feedbackData.isCorrect ? 'var(--correct-color)' : 'var(--wrong-color)', fontSize: '1.1rem' }}>
                {feedbackData.isCorrect ? 'Urutan Tepat!' : 'Urutan Kurang Tepat!'}
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'center', margin: '0 0 0.4rem 0', lineHeight: 1.4 }}>
                {feedbackData.isCorrect 
                  ? 'Luar biasa! Perhatikan peristiwa tersebut di linimasa sebelum menentukan aksi giliran berikutnya.'
                  : 'Sistem telah mengoreksi posisinya pada linimasa. Nyawa berkurang 1 dan kamu mendapat kartu tokoh penalti.'}
              </p>
              <button 
                onClick={handleCloseFeedback} 
                className="dialog-btn primary" 
                style={{ padding: '0.6rem 2rem', fontSize: '0.9rem', background: feedbackData.isCorrect ? 'var(--correct-color)' : 'var(--wrong-color)', color: '#fff' }}
              >
                {feedbackData.isCorrect ? 'Pilih Aksi Giliran' : 'Lanjutkan'}
              </button>
            </div>
          </div>
        )
      )}

      {playMode === 'ACTION_CHOOSE' && (
        <ActionModal 
          onPut={() => setPlayMode('PUT_SELECT_CHAR')}
          onRefresh={() => {
            setPlayMode('REFRESH_SELECT');
            setRefreshList([]);
          }}
          onPass={() => {
            setPlayMode('PLACE_EVENT');
            engine.passTurn();
            setGameState(engine.getState());
          }}
          canPut={canPutAnyCharacter}
        />
      )}

      <div id="toast" className={`toast ${toast ? `show ${toast.type}` : ''}`}>
        {toast?.message}
      </div>
    </>
  );
};
