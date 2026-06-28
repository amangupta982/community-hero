const EXAMPLES = [
  "Potholes",
  "Broken streetlights",
  "Garbage overflow",
  "Water leakage",
  "Damaged roads",
  "Fallen trees",
  "Traffic signal issues",
  "Illegal dumping",
  "Sewage problems",
];

export default function InvalidImageState({ onUploadAnother, onDashboard }) {
  return (
    <div className="invalid-img-card" role="alert" aria-live="polite">
      <div className="invalid-img-icon-wrap" aria-hidden>
        <svg
          className="invalid-img-icon"
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="20" cy="20" r="20" fill="rgba(217,119,6,0.10)" />
          <path
            d="M20 12v10M20 26.5v1"
            stroke="#d97706"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle
            cx="20"
            cy="20"
            r="11"
            stroke="#d97706"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>

      <h2 className="invalid-img-title">This doesn&rsquo;t appear to be a civic issue.</h2>

      <p className="invalid-img-sub">
        Community Hero only accepts reports related to public infrastructure or community problems.
      </p>

      <div className="invalid-img-examples">
        <p className="invalid-img-examples-label">Supported report types</p>
        <ul className="invalid-img-list">
          {EXAMPLES.map((ex) => (
            <li key={ex} className="invalid-img-list-item">
              <span className="invalid-img-check" aria-hidden>
                ✓
              </span>
              {ex}
            </li>
          ))}
        </ul>
      </div>

      <div className="invalid-img-actions">
        <button className="invalid-img-btn-primary" onClick={onUploadAnother}>
          Upload Another Photo
        </button>
        <button className="invalid-img-btn-secondary" onClick={onDashboard}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
