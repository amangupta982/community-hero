export default function DemoToggle({ demoMode, nextSpotLabel, onToggle }) {
  if (demoMode) {
    // When demo mode is on the DemoPanel floating panel handles the full UX.
    // Show a minimal hint here so the user knows GPS is being simulated.
    return (
      <div className="demo-active-hint">
        <span className="demo-dot" aria-hidden />
        Demo mode · next GPS → <strong>{nextSpotLabel}</strong>
        <button className="demo-exit-link" onClick={() => onToggle(false)}>
          exit
        </button>
      </div>
    );
  }

  return (
    <button className="demo-enable-btn" onClick={() => onToggle(true)}>
      🎭 Enable Demo Mode
    </button>
  );
}
