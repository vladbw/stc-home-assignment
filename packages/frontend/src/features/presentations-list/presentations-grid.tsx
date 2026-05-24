import { Card } from '../../generic-components/card';
import { usePresentations } from '../../queries/presentations';
import { PresentationCard } from './presentation-card';

// The actual container for the list of presentation cards
export function PresentationsGrid() {
  const { data, isLoading, error } = usePresentations();

  if (isLoading) return <p className="text-muted">Loading…</p>;
  if (error) return <p className="text-red-300">{error.message}</p>;
  if (!data || data.length === 0) {
    return (
      <Card variant="dashed" padding="lg" className="text-sm text-muted">
        No presentations yet.
      </Card>
    );
  }

  return (
    <ul className="m-0 grid list-none gap-3 p-0">
      {data.map((p) => (
        <li key={p.id}>
          <PresentationCard presentation={p} />
        </li>
      ))}
    </ul>
  );
}
