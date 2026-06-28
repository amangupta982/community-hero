import ReportCard from "./ReportCard.jsx";
import SkeletonCard from "./SkeletonCard.jsx";

export default function ReportList({
  reports,
  draftingId,
  onGenerateComplaint,
  loading,
  hasMore,
  loadingMore,
  onLoadMore,
  mergedClusterId,
}) {
  return (
    <section className="list">
      <div className="list-header">
        <h2 className="list-title">
          {loading ? "Loading…" : `${reports.length} Report${reports.length !== 1 ? "s" : ""}`}
        </h2>
        {!loading && reports.length > 0 && (
          <span className="list-sort-label">Sorted by: Latest ▾</span>
        )}
      </div>

      {loading && (
        <div className="cards-grid">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {!loading && reports.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon" aria-hidden>
            🏙️
          </span>
          <p className="empty-title">No reports yet</p>
          <p className="empty-sub">
            Photograph a civic issue — potholes, broken lights, garbage dumps. The AI agent pipeline
            handles classification, risk scoring, and complaint drafting automatically.
          </p>
          <div className="empty-steps">
            <div className="empty-step">
              <span>📷</span> Photo
            </div>
            <div className="empty-step-arrow">→</div>
            <div className="empty-step">
              <span>🤖</span> 7 Agents
            </div>
            <div className="empty-step-arrow">→</div>
            <div className="empty-step">
              <span>📨</span> Complaint
            </div>
          </div>
        </div>
      )}

      {!loading && reports.length > 0 && (
        <>
          <div className="cards-grid">
            {reports.map((r, i) => (
              <ReportCard
                key={r.id}
                report={r}
                index={i}
                draftingId={draftingId}
                onGenerateComplaint={onGenerateComplaint}
                isMerged={mergedClusterId === r.id}
              />
            ))}
          </div>

          {hasMore && (
            <div className="load-more-wrap">
              <button className="load-more-btn" onClick={onLoadMore} disabled={loadingMore}>
                {loadingMore ? "⟳ Loading…" : "Load more reports"}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
