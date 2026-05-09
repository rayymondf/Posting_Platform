export default function EmptyState({ title, text }) {
  return (
    <section className="empty-state">
      <h2>{title}</h2>
      {text ? <p>{text}</p> : null}
    </section>
  );
}
