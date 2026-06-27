import { useRef, useEffect } from "react";

// triggerRef — optional ref that callers can use to programmatically open the
// file picker. Set inside a user-gesture handler to satisfy browser policy.
export default function ReportButton({ busy, onFileChosen, triggerRef }) {
  const fileRef = useRef(null);

  useEffect(() => {
    if (triggerRef) {
      triggerRef.current = () => fileRef.current?.click();
    }
  }, [triggerRef]);

  function handleChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    onFileChosen(file);
    e.target.value = "";
  }

  return (
    <>
      <button
        className={`report-btn${busy ? " agent-working" : ""}`}
        onClick={() => fileRef.current?.click()}
        disabled={busy}
      >
        {busy ? "⟳ Agent analyzing…" : "+ Report an Issue"}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handleChange}
      />
    </>
  );
}
