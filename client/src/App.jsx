import { useState, useRef } from "react";
import { useReports } from "./hooks/useReports.js";
import { useDemo }    from "./hooks/useDemo.js";
import Navbar           from "./components/Navbar.jsx";
import ReportButton     from "./components/ReportButton.jsx";
import DemoToggle       from "./components/DemoToggle.jsx";
import MapView          from "./components/MapView.jsx";
import ReportList       from "./components/ReportList.jsx";
import PipelineProgress from "./components/PipelineProgress.jsx";
import WorkflowProgress from "./components/WorkflowProgress.jsx";
import ReportDetail     from "./components/ReportDetail.jsx";
import DashboardShell   from "./components/Dashboard/DashboardShell.jsx";
import DemoPanel        from "./components/Demo/DemoPanel.jsx";

export default function App() {
  const [view, setView] = useState("app");
  const [selectedReportId, setSelectedReportId] = useState(null);

  const {
    reports,
    loading,
    busy,
    error,
    draftingId,
    pipelineSteps,
    showPipeline,
    hasMore,
    loadingMore,
    mergedClusterId,
    loadReports,
    onPhotoChosen,
    onGenerateComplaint,
    loadMore,
    dismissPipeline,
  } = useReports();

  const {
    demoMode,
    getDemoCoords,
    toggleDemoMode,
    seedStatus,
    resetStatus,
    seedDemoData,
    resetDemoData,
    prepareScenario,
    nextSpotLabel,
  } = useDemo();

  const reportTriggerRef = useRef(null);

  function handleFileChosen(file) {
    onPhotoChosen(file, { demoMode, getDemoCoords });
  }

  function handleDemoPipeline(spot) {
    prepareScenario(spot);
    reportTriggerRef.current?.();
  }

  function handleDemoDuplicate(spot) {
    prepareScenario(spot);
    reportTriggerRef.current?.();
  }

  if (view === "dashboard") {
    return <DashboardShell onBack={() => setView("app")} />;
  }

  const today      = new Date().toDateString();
  const todayCount = reports.filter(r => r.createdAt && new Date(r.createdAt).toDateString() === today).length;

  const selectedReport = selectedReportId ? reports.find(r => r.id === selectedReportId) ?? null : null;
  const workflowReport = selectedReport ?? reports[0] ?? null;

  return (
    <div className={`app-shell${selectedReport ? " has-detail" : ""}`}>
      <Navbar reports={reports} onDashboard={() => setView("dashboard")} />

      <main className="main-content">
        {/* ── Top header bar ── */}
        <div className="top-header">
          <ReportButton busy={busy} onFileChosen={handleFileChosen} triggerRef={reportTriggerRef} />

          <DemoToggle demoMode={demoMode} nextSpotLabel={nextSpotLabel} onToggle={toggleDemoMode} />

          {reports.length > 0 && (
            <div className="top-header-stats">
              <div className="top-header-stat">
                <span className="top-header-stat-n">{reports.length}</span>
                <span className="top-header-stat-l">Issue{reports.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="top-header-stat">
                <span className="top-header-stat-n">{todayCount}</span>
                <span className="top-header-stat-l">Today</span>
              </div>
            </div>
          )}

          <div className="top-header-actions">
            <button className="nav-dashboard-btn" onClick={() => setView("dashboard")} aria-label="Open city intelligence dashboard">
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden>
                <rect x="1" y="10" width="5" height="9" rx="1" fill="currentColor"/>
                <rect x="7.5" y="5" width="5" height="14" rx="1" fill="currentColor"/>
                <rect x="14" y="1" width="5" height="18" rx="1" fill="currentColor"/>
              </svg>
              Dashboard
            </button>
            <button className="top-header-icon-btn" aria-label="Notifications">
              <svg width="16" height="16" viewBox="0 0 20 22" fill="none">
                <path d="M10 1a6 6 0 0 1 6 6v4l2 4H2l2-4V7a6 6 0 0 1 6-6z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </button>
            <button className="top-header-icon-btn" aria-label="Toggle theme">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {error && <div className="error" role="alert">{error}</div>}

        {/* ── Content area (center + optional detail panel) ── */}
        <div className="content-body">
          <div className="center-col">
            {/* Workflow Progress OR Live Pipeline */}
            {showPipeline ? (
              <PipelineProgress steps={pipelineSteps} busy={busy} onDismiss={dismissPipeline} />
            ) : workflowReport ? (
              <WorkflowProgress report={workflowReport} />
            ) : null}

            {/* Map */}
            <section className="map-wrap" aria-label="Issue map">
              <MapView reports={reports} />
            </section>

            {/* Report list */}
            <ReportList
              reports={reports}
              loading={loading}
              draftingId={draftingId}
              onGenerateComplaint={onGenerateComplaint}
              hasMore={hasMore}
              loadingMore={loadingMore}
              onLoadMore={loadMore}
              mergedClusterId={mergedClusterId}
              onSelect={setSelectedReportId}
            />
          </div>

          {/* Detail panel */}
          {selectedReport && (
            <ReportDetail
              report={selectedReport}
              onClose={() => setSelectedReportId(null)}
              onGenerateComplaint={onGenerateComplaint}
              draftingId={draftingId}
            />
          )}
        </div>
      </main>

      {demoMode && (
        <DemoPanel
          seedStatus={seedStatus}
          resetStatus={resetStatus}
          onSeed={() => seedDemoData(() => loadReports({ replace: true }))}
          onReset={() => resetDemoData(() => loadReports({ replace: true }))}
          onPipeline={handleDemoPipeline}
          onDuplicate={handleDemoDuplicate}
          onDashboard={() => setView("dashboard")}
          onClose={() => toggleDemoMode(false)}
        />
      )}
    </div>
  );
}
