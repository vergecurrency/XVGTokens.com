const updates = [
  {
    date: "May 10th",
    description: "Updates section created on site.",
  },
  {
    date: "May 9th",
    description: "Worldplorer link added to XVGWorld page.",
  },
  {
    date: "May 9th",
    description: "More token options added to swaps on Ethereum. (PEPE, DOT, LINK)",
  },
  {
    date: "May 7th",
    description: "Farms balance/rewards API changed to display amounts faster.",
  },
  {
    date: "May 6th",
    description: "Swap section added (more to come!).",
  },
  {
    date: "April 16th",
    description: "XVGBASE added to WallOfFame.finance",
  },
];

export function UpdatesPage() {
  return (
    <main className="updates-page">
      <section className="updates-hero">
        <header className="updates-hero__header">
          <h1 className="updates-hero__title">Latest Updates</h1>
        </header>

        <div className="updates-list" role="list">
          {updates.map((update) => (
            <div key={`${update.date}-${update.description}`} className="updates-item" role="listitem">
              <span className="updates-item__bullet" aria-hidden="true">
                •
              </span>
              <span className="updates-item__content">
                <strong className="updates-item__date">{update.date}:</strong>{" "}
                <span>{update.description}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
