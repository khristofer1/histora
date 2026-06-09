import React, { useRef, useEffect, useState } from 'react';
import type { TimelineCard, EventCard, CharacterCard } from '../game/types';

interface TimelineProps {
  timeline: TimelineCard[];
  charactersOnTimeline: Record<string, CharacterCard>;
  playMode: string;
  currentTurnEventCard: EventCard | null;
  onPlaceEvent: (index: number) => void;
  onPlaceCharacter: (eventId: string) => void;
  highlightedCardId?: string | null;
  highlightedCardIsCorrect?: boolean;
  zoomedCardId: string | null;
  zoomedType: 'event' | 'character' | null;
  onToggleZoom: (id: string | null, type: 'event' | 'character' | null) => void;
}

export default function Timeline({ 
  timeline, 
  charactersOnTimeline, 
  playMode, 
  currentTurnEventCard,
  onPlaceEvent,
  onPlaceCharacter,
  highlightedCardId,
  highlightedCardIsCorrect,
  zoomedCardId,
  zoomedType,
  onToggleZoom
}: TimelineProps) {
  const areaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to end on new items (only if no card is zoomed)
  useEffect(() => {
    if (areaRef.current && !zoomedCardId) {
      setTimeout(() => {
        if (areaRef.current) {
          areaRef.current.scrollLeft = areaRef.current.scrollWidth;
        }
      }, 100);
    }
  }, [timeline.length, zoomedCardId]);

  // Scroll zoomed card into view
  useEffect(() => {
    if (zoomedCardId && areaRef.current) {
      setTimeout(() => {
        const zoomedEl = areaRef.current?.querySelector('.event-card.zoomed');
        if (zoomedEl) {
          zoomedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }, 50);
    }
  }, [zoomedCardId]);

  const hasZoomed = !!zoomedCardId;

  return (
    <div className="timeline-container" onClick={() => onToggleZoom(null, null)}>
      <div className={`timeline-area ${hasZoomed ? 'has-zoomed' : ''}`} id="timeline-area" ref={areaRef}>
        <div className="timeline-line"></div>
        
        {Array.from({ length: timeline.length + 1 }).map((_, i) => (
          <React.Fragment key={i}>
            <DropZone 
              index={i} 
              playMode={playMode} 
              currentTurnEventCard={currentTurnEventCard} 
              onPlaceEvent={onPlaceEvent} 
            />
            
            {i < timeline.length && (
              <TimelineCardElement
                tCard={timeline[i]}
                placedChar={charactersOnTimeline[timeline[i].event.id]}
                playMode={playMode}
                onPlaceCharacter={() => onPlaceCharacter(timeline[i].event.id)}
                isHighlighted={highlightedCardId === timeline[i].event.id}
                highlightedIsCorrect={highlightedCardIsCorrect}
                isZoomed={zoomedCardId === timeline[i].event.id}
                zoomedType={zoomedType}
                onToggleZoom={onToggleZoom}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function DropZone({ index, playMode, currentTurnEventCard, onPlaceEvent }: any) {
  const [isDragOver, setIsDragOver] = useState(false);
  const isActive = playMode === 'PLACE_EVENT' && currentTurnEventCard;

  return (
    <div 
      className={`drop-zone ${isActive ? 'active-target' : ''}`}
      style={{ width: isDragOver ? '85px' : '45px' }}
      onDragOver={(e) => {
        e.preventDefault();
        if (isActive) setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (isActive) onPlaceEvent(index);
      }}
      onClick={() => {
        if (isActive) onPlaceEvent(index);
      }}
    >
      {isActive ? '+' : ''}
    </div>
  );
}

function TimelineCardElement({ 
  tCard, 
  placedChar, 
  playMode, 
  onPlaceCharacter, 
  isHighlighted, 
  highlightedIsCorrect,
  isZoomed,
  zoomedType,
  onToggleZoom
}: any) {
  const isEventZoomed = isZoomed && zoomedType === 'event';
  const isCharZoomed = isZoomed && zoomedType === 'character';

  let cardClass = `card event-card answer-side glass ${!tCard.isCorrect ? 'wrong-placement' : ''}`;
  if (isHighlighted) {
    cardClass += highlightedIsCorrect ? ' newly-placed-glow' : ' newly-placed-wrong-glow';
  }
  if (isEventZoomed) {
    cardClass += ' zoomed';
  }

  let wrapperClass = 'timeline-card-wrapper';
  if (isEventZoomed) wrapperClass += ' zoomed-wrapper-event';
  if (isCharZoomed) wrapperClass += ' zoomed-wrapper-char';

  return (
    <div className={wrapperClass} onClick={(e) => e.stopPropagation()}>
      <div 
        className={cardClass}
        onClick={(e) => {
          e.stopPropagation();
          onToggleZoom(tCard.event.id, 'event');
        }}
      >
        <div className="date">{tCard.event.displayDate}</div>
        <div className="title">{tCard.event.title}</div>
        <div className="desc">{tCard.event.description}</div>
        {(!tCard.isCorrect && !isEventZoomed && !(playMode === 'PLACEMENT_FEEDBACK' && isHighlighted)) && (
          <div className="red-cross">❌</div>
        )}
      </div>

      {(placedChar || playMode === 'PUT_SELECT_EVENT') && (
        <div className="placed-char-container">
          {placedChar ? (
            <div 
              className="card character-card glass"
              onClick={(e) => {
                e.stopPropagation();
                onToggleZoom(tCard.event.id, 'character');
              }}
            >
              <div className="related" style={{ color: 'var(--correct-color)' }}>Terpasang</div>
              <div className="name">{placedChar.name}</div>
              <div className="desc">{placedChar.description}</div>
            </div>
          ) : (
            <div className="placed-char-slot active-put-target" onClick={onPlaceCharacter}>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>Pasang Tokoh</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
