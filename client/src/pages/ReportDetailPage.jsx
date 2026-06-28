import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchReport } from "../services/api.js";
import { requestComplaint } from "../services/api.js";
import ReportDetail from "../components/ReportDetail.jsx";

export default function ReportDetailPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draftingId, setDraftingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchReport(reportId)
      .then((r) => {
        if (!cancelled) {
          setReport(r);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reportId]);

  async function handleGenerateComplaint(id) {
    setDraftingId(id);
    try {
      await requestComplaint(id);
      const updated = await fetchReport(id);
      setReport(updated);
    } catch {
      // complaint generation errors are surfaced in the child component
    } finally {
      setDraftingId(null);
    }
  }

  return (
    <div className="rdp-shell">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="rdp-topbar">
        <button className="rdp-topbar-back" onClick={() => navigate(-1)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M10 3L5 8l5 5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </button>

        <div className="rdp-brand">
          <svg width="28" height="32" viewBox="0 0 40 46" fill="none" aria-hidden>
            <path
              d="M20 1L2 9v14c0 10.5 7.7 20.3 18 22.4C30.3 43.3 38 33.5 38 23V9L20 1z"
              fill="url(#rdp-shield-grad)"
            />
            <text
              x="20"
              y="30"
              textAnchor="middle"
              fill="white"
              fontSize="14"
              fontWeight="800"
              fontFamily="system-ui, sans-serif"
            >
              CH
            </text>
            <defs>
              <linearGradient id="rdp-shield-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>
          </svg>
          <span className="rdp-brand-name">Community Hero</span>
        </div>

        <div className="rdp-topbar-crumb">
          <span className="rdp-crumb-link" onClick={() => navigate("/")}>
            All Reports
          </span>
          <span className="rdp-crumb-sep">›</span>
          <span className="rdp-crumb-current">Report Details</span>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────── */}
      <main className="rdp-content">
        {loading && (
          <div className="rdp-loading">
            <div className="rdp-spinner" />
            <p>Loading report…</p>
          </div>
        )}

        {!loading && error && (
          <div className="rdp-error">
            <div className="rdp-error-icon">⚠️</div>
            <h2 className="rdp-error-title">
              {error === "Report not found" ? "Report not found" : "Could not load report"}
            </h2>
            <p className="rdp-error-body">
              {error === "Report not found"
                ? "This report may have been removed or the link is incorrect."
                : "Something went wrong while fetching the report. Please try again."}
            </p>
            <button className="rdp-error-btn" onClick={() => navigate("/")}>
              ← Back to all reports
            </button>
          </div>
        )}

        {!loading && !error && report && (
          <ReportDetail
            report={report}
            onClose={() => navigate("/")}
            onGenerateComplaint={handleGenerateComplaint}
            draftingId={draftingId}
          />
        )}
      </main>
    </div>
  );
}
