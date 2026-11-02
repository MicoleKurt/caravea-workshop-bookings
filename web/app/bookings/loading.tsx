export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <h1 className="skeleton-line" />
      <ul className="cards">
        {[1, 2, 3].map((n) => (
          <li key={n} className="card skeleton-card" />
        ))}
      </ul>
    </div>
  );
}
