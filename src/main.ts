import './style.css';
import { GameEngine } from './game/engine';
import { GameUI } from './ui/gameUI';
import type { CardPair } from './game/types';

let gameData: CardPair[] | null = null;
let difficulty: number = 5;

function init() {
  const app = document.getElementById('app')!;
  renderHomeScreen(app);
}

function renderHomeScreen(container: HTMLElement) {
  container.innerHTML = `
    <div class="home-screen">
      <h1 class="home-title">Histora</h1>
      <p class="home-subtitle">Game Urutan Waktu & Sejarah Interaktif</p>
      
      <div class="setup-panel glass">
        <h3 style="margin-bottom: 0.5rem; color: var(--accent-cyan);">Persiapan Permainan</h3>
        
        <!-- Upload JSON Area -->
        <div class="upload-area" id="upload-area">
          <div class="upload-icon">📥</div>
          <div id="upload-status" style="font-weight: 600; font-size: 0.95rem; margin-bottom: 0.2rem;">Unggah Berkas Game (JSON)</div>
          <p id="upload-file-name" style="font-size: 0.8rem; color: var(--text-secondary);">Seret file JSON ke sini atau klik untuk memilih</p>
          <input type="file" id="file-uploader" class="file-input" accept=".json" />
        </div>
        
        <div style="font-size: 0.9rem; color: var(--text-secondary); margin: -0.5rem 0;">- ATAU -</div>
        
        <button id="btn-use-default" class="dialog-btn secondary" style="padding: 0.8rem;">Gunakan Data Bawaan (Default)</button>
        
        <!-- Difficulty Selector -->
        <div class="difficulty-container">
          <div class="difficulty-label">Jumlah Kartu Tokoh Awal (Tingkat Kesulitan):</div>
          <div class="difficulty-options">
            <button class="difficulty-btn ${difficulty === 5 ? 'active' : ''}" data-value="5">5</button>
            <button class="difficulty-btn ${difficulty === 6 ? 'active' : ''}" data-value="6">6</button>
            <button class="difficulty-btn ${difficulty === 7 ? 'active' : ''}" data-value="7">7</button>
            <button class="difficulty-btn ${difficulty === 8 ? 'active' : ''}" data-value="8">8</button>
          </div>
        </div>
        
        <button id="btn-start-game" class="start-btn" disabled>Mulai Bermain</button>
      </div>
    </div>
  `;

  const fileUploader = document.getElementById('file-uploader') as HTMLInputElement;
  const uploadArea = document.getElementById('upload-area')!;
  const btnUseDefault = document.getElementById('btn-use-default')!;
  const btnStartGame = document.getElementById('btn-start-game') as HTMLButtonElement;
  const uploadStatus = document.getElementById('upload-status')!;
  const uploadFileName = document.getElementById('upload-file-name')!;
  const difficultyButtons = document.querySelectorAll('.difficulty-btn');

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });
  uploadArea.addEventListener('drop', () => {
    uploadArea.classList.remove('dragover');
  });

  fileUploader.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (validateGameData(json)) {
            gameData = json;
            uploadStatus.innerHTML = '✅ Berkas Berhasil Dimuat';
            uploadStatus.style.color = 'var(--correct-color)';
            uploadFileName.innerHTML = `${file.name} (${json.length} Pasang Kartu)`;
            btnStartGame.disabled = false;
          } else {
            throw new Error("Format data JSON tidak valid. Pastikan berisi event_card dan character_card.");
          }
        } catch (error: any) {
          alert(`Gagal memuat JSON: ${error.message}`);
          uploadStatus.innerHTML = '❌ Gagal Memuat Berkas';
          uploadStatus.style.color = 'var(--wrong-color)';
          uploadFileName.innerHTML = 'Silakan coba file JSON lain';
          btnStartGame.disabled = true;
          gameData = null;
        }
      };
      reader.readAsText(file);
    }
  });

  btnUseDefault.addEventListener('click', async () => {
    try {
      const response = await fetch('/data.json');
      if (!response.ok) throw new Error("Gagal mengunduh file default");
      const defaultData = await response.json();
      if (validateGameData(defaultData)) {
        gameData = defaultData;
        uploadStatus.innerHTML = '✅ Menggunakan Data Bawaan';
        uploadStatus.style.color = 'var(--correct-color)';
        uploadFileName.innerHTML = `data.json (${defaultData.length} Pasang Kartu)`;
        btnStartGame.disabled = false;
      }
    } catch (err: any) {
      alert(`Gagal memuat data bawaan: ${err.message}`);
    }
  });

  difficultyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      difficultyButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      difficulty = parseInt(btn.getAttribute('data-value') || '5');
    });
  });

  btnStartGame.addEventListener('click', () => {
    if (gameData) {
      let ui: GameUI;
      const engine = new GameEngine(gameData, difficulty, (state) => {
        if (ui) ui.render(state);
      });
      ui = new GameUI(engine, 'app');
      ui.render(engine.getState());
    }
  });
}

function validateGameData(data: any): boolean {
  if (!Array.isArray(data)) return false;
  if (data.length === 0) return false;
  
  return data.every(item => {
    return (
      item &&
      typeof item === 'object' &&
      item.event_card &&
      item.event_card.id &&
      item.event_card.question &&
      item.event_card.displayDate &&
      typeof item.event_card.sortDate === 'number' &&
      item.event_card.title &&
      item.event_card.description &&
      item.character_card &&
      item.character_card.id &&
      item.character_card.name &&
      item.character_card.description
    );
  });
}

init();
