import { useState, useRef } from "react";
import { Routes, Route } from "react-router-dom";
import { useReports } from "./hooks/useReports.js";
import { useDemo }    from "./hooks/useDemo.js";
import Navbar           from "./components/Navbar.jsx";
import ReportButton     from "./components/ReportButton.jsx";
import DemoToggle       from "./components/DemoToggle.jsx";
import MapView          from "./components/MapView.jsx";
import ReportList       from "./components/ReportList.jsx";
import PipelineProgress from "./components/PipelineProgress.jsx";
import DashboardShell   from "./components/Dashboard/DashboardShell.jsx";
import DemoPanel        from "./components/Demo/DemoPanel.jsx";
import ReportDetailPage from "./pages/ReportDetailPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/reports/:reportId" element={<ReportDetailPage />} />
      <Route path="/*" element={<MainView />} />
    </Routes>
  );
}

function MainView() {
  const [view, setView] = useState("app");

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

  return (
    <div className="app-shell">
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
          </div>
        </div>

        {error && <div className="error" role="alert">{error}</div>}

        {/* ── Content area ── */}
        <div className="content-body">
          <div className="center-col">
            {showPipeline && (
              <PipelineProgress steps={pipelineSteps} busy={busy} onDismiss={dismissPipeline} />
            )}

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
            />
          </div>
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
