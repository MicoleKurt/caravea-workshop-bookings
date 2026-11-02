export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <p className="eyebrow">&nbsp;</p>
      <div className="skeleton-line" />
      <ul className="rows" style={{ marginTop: "2.25rem" }}>
        {[1, 2, 3, 4].map((n) => (
          <li key={n} className="row-link skeleton-row" />
        ))}
      </ul>
    </div>
  );
}
