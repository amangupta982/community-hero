export default function SkeletonCard() {
  return (
    <article className="card skeleton-card" aria-hidden>
      <div className="card-photo-wrap">
        <div className="skeleton sk-photo" />
      </div>
      <div className="card-body">
        <div className="skeleton sk-chip" />
        <div className="skeleton sk-desc" />
        <div className="skeleton sk-desc sk-desc-short" />
        <div className="skeleton sk-meta" />
      </div>
    </article>
  );
}
