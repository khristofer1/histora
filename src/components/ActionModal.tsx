

interface ActionModalProps {
  onPut: () => void;
  onRefresh: () => void;
  onPass: () => void;
  canPut: boolean;
}

export default function ActionModal({ onPut, onRefresh, onPass, canPut }: ActionModalProps) {
  return (
    <div className="dialog-overlay">
      <div className="dialog-box glass" style={{ border: '1px solid var(--accent-cyan)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Pilih langkah Anda selanjutnya:</p>
        <div className="dialog-buttons">
          <button onClick={onPut} className="dialog-btn primary" disabled={!canPut}>Pasang Tokoh</button>
          <button onClick={onRefresh} className="dialog-btn secondary">Tukar Tokoh</button>
          <button onClick={onPass} className="dialog-btn secondary" style={{ background: 'rgba(255,255,255,0.02)' }}>Lewati</button>
        </div>
      </div>
    </div>
  );
}
