
import type { CharacterCard } from '../game/types';

interface HandProps {
  playerHand: CharacterCard[];
  playMode: string;
  selectedCharId: string | null;
  refreshList: string[];
  onSelectChar: (id: string) => void;
  onToggleRefresh: (id: string) => void;
  puttableCharIds: string[];
}

export default function Hand({ 
  playerHand, 
  playMode, 
  selectedCharId, 
  refreshList, 
  onSelectChar, 
  onToggleRefresh,
  puttableCharIds
}: HandProps) {
  
  return (
    <div className="hand-area" id="hand-area">
      <div className="hand-scroll">
        {playerHand.map((char, idx) => {
          const isPuttable = puttableCharIds.includes(char.id) && playMode !== 'REFRESH_SELECT';
          const isSelectable = playMode === 'PUT_SELECT_CHAR' && isPuttable;
          const isSelected = selectedCharId === char.id;
          const isToDiscard = refreshList.includes(char.id);
          
          let classNames = 'card character-card glass in-hand';
          if (isSelectable) classNames += ' selectable';
          if (isSelected) classNames += ' selected-char-pulse';
          if (playMode === 'REFRESH_SELECT' && isToDiscard) classNames += ' to-discard';
          if (isPuttable) classNames += ' puttable-hint';

          const rotation = (idx - (playerHand.length - 1) / 2) * 4;
          const transformStyle = `rotate(${rotation}deg) translateY(${Math.abs(rotation) * 1.5}px)`;

          return (
            <div 
              key={char.id}
              className={classNames}
              style={{ transform: transformStyle, zIndex: idx }}
              onClick={() => {
                if (isSelectable) onSelectChar(char.id);
                if (playMode === 'REFRESH_SELECT') onToggleRefresh(char.id);
              }}
            >
              <div className="related">Tokoh Histora</div>
              <div className="name">{char.name}</div>
              <div className="desc">{char.description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
