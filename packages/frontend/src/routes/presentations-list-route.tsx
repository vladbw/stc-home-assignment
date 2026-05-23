import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { PresentationListItem } from '@sts/shared';
import toast from 'react-hot-toast';
import {
  useCreatePresentation,
  useDeletePresentation,
  usePresentations,
  useRenamePresentation,
} from '../queries/presentations';
import { Button } from '../components/ui/button';
import { Card, cardVariants } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { PageContent, PageShell } from '../components/ui/page-shell';
import { cn } from '../lib/cn';
import { usePresentationsListKeybindings } from './use-presentations-list-keybindings';

const presentationCardClass = cn(
  cardVariants({ variant: 'interactive', padding: 'md' }),
  'grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center',
);

export function PresentationsListRoute() {
  return (
    <PageShell>
      <PageContent>
        <header className="mb-8 flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent/80">
              Workspace
            </p>
            <h1 className="text-4xl font-semibold tracking-normal text-foreground">
              Presentations
            </h1>
          </div>
          <p className="max-w-sm text-sm leading-6 text-muted">
            Create and manage decks before opening the editor workbench.
          </p>
        </header>
        <CreateForm />
        <ListView />
      </PageContent>
    </PageShell>
  );
}

function CreateForm() {
  const [title, setTitle] = useState('');
  const { isPending, mutate: createPresentation } = useCreatePresentation();

  const createFromTitle = useCallback(() => {
    if (isPending) return;

    const trimmed = title.trim();
    if (!trimmed) {
      toast.error('The new presentation needs a title!');
      return;
    }

    createPresentation(
      { title: trimmed },
      { onSuccess: () => setTitle('') },
    );
  }, [createPresentation, isPending, title]);

  usePresentationsListKeybindings(createFromTitle);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    createFromTitle();
  };

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        cardVariants({ padding: 'sm' }),
        'mb-7 grid gap-3 bg-panel-raised shadow-panel-raised sm:grid-cols-[1fr_auto]',
      )}
    >
      <Input
        type="text"
        placeholder="New presentation title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
      />
      <Button type="submit" disabled={isPending} variant="primary">
        {isPending ? 'Creating…' : 'Create'}
      </Button>
    </form>
  );
}

function ListView() {
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

function PresentationCard({ presentation }: { presentation: PresentationListItem }) {
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
        <div className="flex flex-wrap gap-2">
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
          <span>
            {presentation.pageCount} {presentation.pageCount === 1 ? 'page' : 'pages'}
          </span>
          <span>{new Date(presentation.updatedAt).toLocaleString()}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
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
