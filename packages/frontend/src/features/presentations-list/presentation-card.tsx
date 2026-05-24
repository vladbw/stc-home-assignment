import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { PresentationListItem } from '@sts/shared';
import { Button } from '../../components/ui/button';
import { cardVariants } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { cn } from '../../lib/cn';
import {
  useDeletePresentation,
  useRenamePresentation,
} from '../../queries/presentations';

const presentationCardClass = cn(
  cardVariants({ variant: 'interactive', padding: 'md' }),
  // Two-column grid at every size so the actions column sits to the right
  // of the card content (filling the otherwise-empty space on mobile).
  // Vertical centering kicks in only at sm+ where the action row stays flat.
  'grid grid-cols-[1fr_auto] items-start gap-4 sm:items-center ',
);

type Props = {
  presentation: PresentationListItem;
};

export function PresentationCard({ presentation }: Props) {
  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(presentation.title);
  const cardRef = useRef<HTMLFormElement>(null);
  const rename = useRenamePresentation();
  const remove = useDeletePresentation();

  const cancelRename = () => {
    setRenaming(false);
    setDraftTitle(presentation.title);
  };

  useEffect(() => {
    if (!renaming) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!(e.target instanceof Node)) return;
      if (cardRef.current?.contains(e.target)) return;
      cancelRename();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [renaming, presentation.title]);

  const onRenameSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = draftTitle.trim();
    if (!trimmed || trimmed === presentation.title) {
      cancelRename();
      return;
    }
    rename.mutate(
      { id: presentation.id, title: trimmed },
      { onSuccess: () => setRenaming(false) },
    );
  };

  const onDelete = () => {
    if (!confirm(`Delete "${presentation.title}"?`)) return;
    remove.mutate(presentation.id);
  };

  if (renaming) {
    return (
      <form ref={cardRef} onSubmit={onRenameSubmit} className={presentationCardClass}>
        <Input
          autoFocus
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          maxLength={200}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="submit" disabled={rename.isPending} variant="primary">
            Save
          </Button>
          <Button type="button" onClick={cancelRename}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <article className={presentationCardClass}>
      <div className="grid gap-2">
        <Link
          to={`/presentations/${presentation.id}`}
          className="text-lg font-semibold text-foreground no-underline transition hover:text-accent"
        >
          {presentation.title}
        </Link>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <p className='text-foreground'>
            {presentation.pageCount} {presentation.pageCount === 1 ? 'page' : 'pages'}
          </p>
          <p>Created at {new Date(presentation.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 flex-col">
        <Button type="button" onClick={() => setRenaming(true)}>
          Rename
        </Button>
        <Button
          type="button"
          onClick={onDelete}
          disabled={remove.isPending}
          variant="destructive"
        >
          Delete
        </Button>
      </div>
    </article>
  );
}
