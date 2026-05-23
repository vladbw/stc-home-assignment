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
import { usePresentationsListKeybindings } from './use-presentations-list-keybindings';

const cardClass =
  'grid gap-4 rounded-lg border border-stone-100/12 bg-[#1b2321] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.24)] transition-colors hover:border-lime-200/35 sm:grid-cols-[1fr_auto] sm:items-center';
const buttonClass =
  'rounded-lg border border-stone-100/14 bg-[#151b1a] px-3 py-2 text-sm font-medium text-stone-100 transition hover:border-lime-200/45 hover:bg-[#202a27] disabled:cursor-not-allowed disabled:opacity-45';
const primaryButtonClass =
  'rounded-lg bg-lime-200 px-4 py-2 text-sm font-semibold text-[#17201e] transition hover:bg-lime-100 disabled:cursor-not-allowed disabled:opacity-60';
const inputClass =
  'min-w-0 rounded-lg border border-stone-100/14 bg-[#151b1a] px-4 py-3 text-stone-100 outline-none transition placeholder:text-stone-100/40 focus:border-lime-200/60 focus:ring-4 focus:ring-lime-200/10';

export function PresentationsListRoute() {
  return (
    <main className="min-h-screen bg-[#18201e] bg-[linear-gradient(rgba(242,240,234,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(242,240,234,0.045)_1px,transparent_1px)] bg-[size:34px_34px] px-5 py-10 text-stone-100 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-col gap-3 border-b border-stone-100/12 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime-200/80">
              Workspace
            </p>
            <h1 className="text-4xl font-semibold tracking-normal text-stone-100">
              Presentations
            </h1>
          </div>
          <p className="max-w-sm text-sm leading-6 text-stone-300">
            Create and manage decks before opening the editor workbench.
          </p>
        </header>
        <CreateForm />
        <ListView />
      </div>
    </main>
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
      className="mb-7 grid gap-3 rounded-lg border border-stone-100/12 bg-[#222b28] p-3 shadow-[0_28px_70px_rgba(0,0,0,0.28)] sm:grid-cols-[1fr_auto]"
    >
      <input
        type="text"
        placeholder="New presentation title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
        className={inputClass}
      />
      <button type="submit" disabled={isPending} className={primaryButtonClass}>
        {isPending ? 'Creating…' : 'Create'}
      </button>
    </form>
  );
}

function ListView() {
  const { data, isLoading, error } = usePresentations();

  if (isLoading) return <p className="text-stone-300">Loading…</p>;
  if (error) return <p className="text-red-300">{error.message}</p>;
  if (!data || data.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-stone-100/16 bg-[#1b2321] p-5 text-sm text-stone-300">
        No presentations yet.
      </p>
    );
  }

  return (
    <ul className="grid list-none gap-3 p-0">
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
      <form ref={cardRef} onSubmit={onRenameSubmit} className={cardClass}>
        <input
          autoFocus
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          maxLength={200}
          className={inputClass}
        />
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={rename.isPending} className={primaryButtonClass}>
            Save
          </button>
          <button type="button" onClick={cancelRename} className={buttonClass}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <article className={cardClass}>
      <div className="grid gap-2">
        <Link
          to={`/presentations/${presentation.id}`}
          className="text-lg font-semibold text-stone-100 no-underline transition hover:text-lime-200"
        >
          {presentation.title}
        </Link>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-400">
          <span>
            {presentation.pageCount} {presentation.pageCount === 1 ? 'page' : 'pages'}
          </span>
          <span>{new Date(presentation.updatedAt).toLocaleString()}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setRenaming(true)} className={buttonClass}>
          Rename
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={remove.isPending}
          className={buttonClass}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
