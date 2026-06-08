import { GameEngine } from '../game/engine';
import type { GameState } from '../game/types';

type PlayMode = 
  | 'PLACE_EVENT' 
  | 'ACTION_CHOOSE' 
  | 'PUT_SELECT_CHAR' 
  | 'PUT_SELECT_EVENT' 
  | 'REFRESH_SELECT';

export class GameUI {
  private engine: GameEngine;
  private container: HTMLElement;
  
  // UI Interaction States
  private playMode: PlayMode = 'PLACE_EVENT';
  private eventCardSelected: boolean = false;
  private selectedCharId: string | null = null;
  private refreshList: string[] = []; // Array of character IDs to discard

  constructor(engine: GameEngine, containerId: string) {
    this.engine = engine;
    this.container = document.getElementById(containerId)!;
  }

  public render(state: GameState) {
    if (state.isGameOver) {
      this.renderGameOver(state);
      return;
    }

    // Determine state/mode automatically if event card is null (events finished but characters remain)
    if (!state.currentTurnEventCard && this.playMode === 'PLACE_EVENT') {
      this.playMode = 'ACTION_CHOOSE';
    }

    this.container.innerHTML = `
      <div class="top-bar">
        <h2>Histora</h2>
        <div class="lives">${'❤️'.repeat(state.lives)}</div>
      </div>
      
      <div class="timeline-container">
        <div class="timeline-area" id="timeline-area">
          <div class="timeline-line"></div>
        </div>
      </div>

      <!-- Action Banners / Overlays depending on mode -->
      ${this.renderModeHeader(state)}

      <div class="hand-area" id="hand-area"></div>
      
      <!-- Modal Overlay for Action Selection -->
      ${this.playMode === 'ACTION_CHOOSE' ? this.renderActionModal() : ''}
      
      <!-- Toast Container -->
      <div id="toast" class="toast"></div>
    `;

    this.renderTimeline(state);
    this.renderHand(state);
    this.setupInteractions(state);
  }

  private renderModeHeader(state: GameState): string {
    if (this.playMode === 'PLACE_EVENT' && state.currentTurnEventCard) {
      return `
        <div style="position: absolute; top: 18%; left: 50%; transform: translateX(-50%); z-index: 20; text-align: center; width: 90%; max-width: 320px;">
          <h4 style="margin-bottom: 0.6rem; color: var(--accent-cyan);">Ketuk kartu lalu ketuk slot di timeline:</h4>
          <div class="card event-card question-side glass ${this.eventCardSelected ? 'selected' : ''}" id="current-event">
            <div style="font-size: 2.8rem; color: var(--accent-blue); font-weight: 800;">???</div>
            <p style="margin-top: 0.8rem; font-size: 0.82rem; line-height: 1.4; color: var(--text-primary); font-weight: 500;">
              ${state.currentTurnEventCard.question}
            </p>
          </div>
        </div>
      `;
    }

    if (this.playMode === 'PUT_SELECT_CHAR') {
      return `
        <div class="glass" style="position: absolute; top: 15%; left: 50%; transform: translateX(-50%); z-index: 20; padding: 0.8rem 1.5rem; border-radius: 30px; border: 1px solid var(--accent-cyan); display: flex; align-items: center; gap: 1rem;">
          <span style="font-size: 0.9rem; font-weight: 600; color: var(--accent-cyan);">👈 Pilih 1 tokoh dari tangan Anda</span>
          <button id="btn-cancel-action" class="dialog-btn danger" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; border-radius: 15px;">Batal</button>
        </div>
      `;
    }

    if (this.playMode === 'PUT_SELECT_EVENT') {
      return `
        <div class="glass" style="position: absolute; top: 15%; left: 50%; transform: translateX(-50%); z-index: 20; padding: 0.8rem 1.5rem; border-radius: 30px; border: 1px solid var(--accent-cyan); display: flex; align-items: center; gap: 1rem;">
          <span style="font-size: 0.9rem; font-weight: 600; color: var(--accent-cyan);">👇 Ketuk slot di bawah peristiwa yang cocok</span>
          <button id="btn-cancel-action" class="dialog-btn danger" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; border-radius: 15px;">Batal</button>
        </div>
      `;
    }

    if (this.playMode === 'REFRESH_SELECT') {
      return `
        <div class="glass" style="position: absolute; top: 15%; left: 50%; transform: translateX(-50%); z-index: 20; padding: 0.8rem 1.5rem; border-radius: 20px; border: 1px solid var(--accent-cyan); text-align: center; width: 90%; max-width: 350px;">
          <p style="font-size: 0.9rem; font-weight: 600; color: var(--accent-cyan); margin-bottom: 0.8rem;">Pilih kartu-kartu tokoh yang ingin ditukar:</p>
          <div style="display: flex; gap: 0.5rem; justify-content: center;">
            <button id="btn-confirm-refresh" class="dialog-btn primary" style="padding: 0.5rem 1rem; font-size: 0.85rem;" ${this.refreshList.length === 0 ? 'disabled' : ''}>
              Tukar (${this.refreshList.length} Kartu)
            </button>
            <button id="btn-cancel-action" class="dialog-btn secondary" style="padding: 0.5rem 1rem; font-size: 0.85rem;">Batal</button>
          </div>
        </div>
      `;
    }

    return '';
  }

  private renderActionModal(): string {
    return `
      <div class="dialog-overlay">
        <div class="dialog-box glass" style="border: 1px solid var(--accent-cyan);">
          <h3>Urutan Benar!</h3>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">Peristiwa berhasil diurutkan. Pilih langkah Anda selanjutnya:</p>
          <div class="dialog-buttons">
            <button id="modal-btn-put" class="dialog-btn primary">Put Character (Pasang Tokoh)</button>
            <button id="modal-btn-refresh" class="dialog-btn secondary">Refresh (Tukar Tokoh)</button>
            <button id="modal-btn-pass" class="dialog-btn secondary" style="background: rgba(255,255,255,0.02);">Pass (Lewati)</button>
          </div>
        </div>
      </div>
    `;
  }

  private renderTimeline(state: GameState) {
    const area = document.getElementById('timeline-area')!;
    area.innerHTML = '<div class="timeline-line"></div>';

    for (let i = 0; i <= state.timeline.length; i++) {
      // 1. Render Drop Zone
      const dropZone = document.createElement('div');
      dropZone.className = 'drop-zone';
      
      // If we are in placing event mode AND event card is selected, highlight drop zones
      if (this.playMode === 'PLACE_EVENT' && this.eventCardSelected) {
        dropZone.classList.add('active-target');
        dropZone.innerText = '+';
      }

      // Drag and Drop listeners
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (this.playMode === 'PLACE_EVENT') {
          dropZone.classList.add('active-target');
          dropZone.style.width = '85px';
        }
      });
      dropZone.addEventListener('dragleave', () => {
        if (!this.eventCardSelected) {
          dropZone.classList.remove('active-target');
          dropZone.style.width = '45px';
        }
      });
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        if (this.playMode === 'PLACE_EVENT') {
          this.handleEventPlacement(i);
        }
      });

      // Tap-to-Place listener
      dropZone.addEventListener('click', () => {
        if (this.playMode === 'PLACE_EVENT' && this.eventCardSelected) {
          this.handleEventPlacement(i);
        }
      });

      area.appendChild(dropZone);

      // 2. Render Card & Character Slot
      if (i < state.timeline.length) {
        const tCard = state.timeline[i];
        
        const wrapper = document.createElement('div');
        wrapper.className = 'timeline-card-wrapper';

        // Event Card
        const cardEl = document.createElement('div');
        cardEl.className = `card event-card answer-side glass ${!tCard.isCorrect ? 'wrong-placement' : ''}`;
        cardEl.innerHTML = `
          <div class="date">${tCard.event.displayDate}</div>
          <div class="title">${tCard.event.title}</div>
          <div class="desc">${tCard.event.description}</div>
          ${!tCard.isCorrect ? '<div class="red-cross">❌</div>' : ''}
        `;
        wrapper.appendChild(cardEl);

        // Character Card Placed Under It
        const charContainer = document.createElement('div');
        charContainer.className = 'placed-char-container';

        const placedChar = state.charactersOnTimeline[tCard.event.id];
        if (placedChar) {
          // Render the placed character card
          const charCard = document.createElement('div');
          charCard.className = 'card character-card glass';
          charCard.style.transform = 'scale(0.85)';
          charCard.style.marginTop = '-1rem';
          charCard.innerHTML = `
            <div class="related" style="color: var(--correct-color);">Terpasang</div>
            <div class="name">${placedChar.name}</div>
            <div class="desc">${placedChar.description}</div>
          `;
          charContainer.appendChild(charCard);
        } else {
          // Empty slot (can be a target in PUT_SELECT_EVENT mode)
          const slot = document.createElement('div');
          slot.className = 'placed-char-slot';
          slot.innerHTML = `<span>Kosong</span>`;
          
          if (this.playMode === 'PUT_SELECT_EVENT') {
            slot.classList.add('active-put-target');
            slot.innerHTML = `<span style="color: var(--accent-cyan); font-weight: bold;">Pasang Tokoh</span>`;
            slot.addEventListener('click', () => {
              this.handleCharacterPlacement(tCard.event.id);
            });
          }
          charContainer.appendChild(slot);
        }

        wrapper.appendChild(charContainer);
        area.appendChild(wrapper);
      }
    }
    
    // Auto-scroll timeline to the right to see new cards
    setTimeout(() => {
      area.scrollLeft = area.scrollWidth;
    }, 100);
  }

  private renderHand(state: GameState) {
    const area = document.getElementById('hand-area')!;
    area.innerHTML = '';

    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'hand-scroll';

    state.playerHand.forEach((char, idx) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'card character-card glass in-hand';
      
      // Highlight/Interactions based on mode
      if (this.playMode === 'PUT_SELECT_CHAR') {
        cardEl.classList.add('selectable');
        if (this.selectedCharId === char.id) {
          cardEl.classList.add('selected-char-pulse');
        }
        cardEl.addEventListener('click', () => {
          this.selectedCharId = char.id;
          this.playMode = 'PUT_SELECT_EVENT';
          this.render(this.engine.getState());
        });
      } else if (this.playMode === 'REFRESH_SELECT') {
        const isSelected = this.refreshList.includes(char.id);
        if (isSelected) {
          cardEl.classList.add('to-discard');
        }
        cardEl.addEventListener('click', () => {
          if (isSelected) {
            this.refreshList = this.refreshList.filter(id => id !== char.id);
          } else {
            this.refreshList.push(char.id);
          }
          this.render(this.engine.getState());
        });
      }

      // Card Fan effect
      const rotation = (idx - (state.playerHand.length - 1) / 2) * 4;
      cardEl.style.transform = `rotate(${rotation}deg) translateY(${Math.abs(rotation) * 1.5}px)`;
      cardEl.style.zIndex = idx.toString();

      cardEl.innerHTML = `
        <div class="related">Tokoh Histora</div>
        <div class="name">${char.name}</div>
        <div class="desc">${char.description}</div>
      `;
      
      scrollContainer.appendChild(cardEl);
    });

    area.appendChild(scrollContainer);
  }

  private setupInteractions(state: GameState) {
    // 1. Drag & Drop for current event
    const currentEvent = document.getElementById('current-event');
    if (currentEvent && this.playMode === 'PLACE_EVENT') {
      currentEvent.draggable = true;
      currentEvent.addEventListener('dragstart', (e) => {
        e.dataTransfer?.setData('text/plain', 'event-card');
      });

      // Tap to Select
      currentEvent.addEventListener('click', () => {
        this.eventCardSelected = !this.eventCardSelected;
        this.render(state);
      });
    }

    // 2. Cancel Action Button
    const btnCancel = document.getElementById('btn-cancel-action');
    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        this.resetModes();
        this.render(this.engine.getState());
      });
    }

    // 3. Modal Buttons (Action Choose)
    const modalPut = document.getElementById('modal-btn-put');
    const modalRefresh = document.getElementById('modal-btn-refresh');
    const modalPass = document.getElementById('modal-btn-pass');

    if (modalPut) {
      modalPut.addEventListener('click', () => {
        this.playMode = 'PUT_SELECT_CHAR';
        this.render(state);
      });
    }

    if (modalRefresh) {
      modalRefresh.addEventListener('click', () => {
        this.playMode = 'REFRESH_SELECT';
        this.refreshList = [];
        this.render(state);
      });
    }

    if (modalPass) {
      modalPass.addEventListener('click', () => {
        this.playMode = 'PLACE_EVENT';
        this.engine.passTurn();
      });
    }

    // 4. Confirm Refresh Action
    const btnConfirmRefresh = document.getElementById('btn-confirm-refresh');
    if (btnConfirmRefresh) {
      btnConfirmRefresh.addEventListener('click', () => {
        this.engine.refreshCharacters(this.refreshList);
        this.resetModes();
        this.showToast('✅ Dek tokoh berhasil ditukar!', 'success');
      });
    }
  }

  private handleEventPlacement(index: number) {
    this.eventCardSelected = false;
    const isCorrect = this.engine.placeEvent(index);
    
    if (isCorrect) {
      this.playMode = 'ACTION_CHOOSE';
      this.showToast('✅ Benar! Silakan pilih aksi giliran.', 'success');
    } else {
      this.playMode = 'PLACE_EVENT';
      this.showToast('❌ Salah urutan! Sistem membetulkannya, nyawa -1, & ambil 1 tokoh.', 'error');
    }
  }

  private handleCharacterPlacement(eventId: string) {
    if (this.selectedCharId) {
      const success = this.engine.putCharacter(this.selectedCharId, eventId);
      if (success) {
        this.showToast('✅ Tokoh berhasil ditempatkan!', 'success');
        this.resetModes();
      } else {
        this.showToast('❌ Tokoh tidak cocok dengan peristiwa ini!', 'error');
        // Stay in PUT_SELECT_CHAR to let them try another
        this.playMode = 'PUT_SELECT_CHAR';
        this.selectedCharId = null;
        this.render(this.engine.getState());
      }
    }
  }

  private resetModes() {
    this.playMode = 'PLACE_EVENT';
    this.eventCardSelected = false;
    this.selectedCharId = null;
    this.refreshList = [];
  }

  private showToast(message: string, type: 'success' | 'error') {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.className = `toast show ${type}`;
      toast.innerText = message;
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }
  }

  private renderGameOver(state: GameState) {
    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; text-align: center; padding: 2rem;" class="glass">
        <h1 style="font-size: 3.5rem; margin-bottom: 1rem; color: ${state.isWin ? 'var(--correct-color)' : 'var(--wrong-color)'};">
          ${state.isWin ? 'KAMU MENANG! 🏆' : 'GAME OVER 💀'}
        </h1>
        <p style="font-size: 1.2rem; color: var(--text-secondary); max-width: 400px; line-height: 1.5; margin-bottom: 2rem;">
          ${state.isWin 
            ? 'Luar biasa! Kamu berhasil menyusun kronologi waktu sejarah dan mencocokkan semua tokoh dengan tepat!' 
            : 'Sayang sekali, nyawa sejarahmu habis karena terlalu banyak salah urutan peristiwa.'}
        </p>
        <button onclick="location.reload()" class="start-btn" style="padding: 1rem 3rem;">Main Lagi</button>
      </div>
    `;
  }
}
