import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { PresentationListItem } from '@sts/shared';
import {
  useCreatePresentation,
  useDeletePresentation,
  usePresentations,
  useRenamePresentation,
} from '../queries/presentations';
import styles from './presentations-list-route.module.css';

export function PresentationsListRoute() {
  return (
    <main className={styles.main}>
      <header>
        <h1>Presentations</h1>
      </header>
      <CreateForm />
      <ListView />
    </main>
  );
}

function CreateForm() {
  const [title, setTitle] = useState('');
  const create = useCreatePresentation();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    create.mutate(
      { title: trimmed },
      { onSuccess: () => setTitle('') },
    );
  };

  return (
    <form onSubmit={onSubmit} className={styles.createForm}>
      <input
        type="text"
        placeholder="New presentation title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
      />
      <button type="submit" disabled={create.isPending || !title.trim()}>
        {create.isPending ? 'Creating…' : 'Create'}
      </button>
    </form>
  );
}

function ListView() {
  const { data, isLoading, error } = usePresentations();

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p className={styles.error}>{error.message}</p>;
  if (!data || data.length === 0) return <p className={styles.empty}>No presentations yet.</p>;

  return (
    <ul className={styles.list}>
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
  const rename = useRenamePresentation();
  const remove = useDeletePresentation();

  const cancelRename = () => {
    setRenaming(false);
    setDraftTitle(presentation.title);
  };

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
      <form onSubmit={onRenameSubmit} className={styles.card}>
        <input
          autoFocus
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          maxLength={200}
          style={{ flex: 1 }}
        />
        <div className={styles.cardActions}>
          <button type="submit" disabled={rename.isPending}>
            Save
          </button>
          <button type="button" onClick={cancelRename}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <article className={styles.card}>
      <Link to={`/presentations/${presentation.id}`} className={styles.cardTitle}>
        {presentation.title}
      </Link>
      <span className={styles.cardMeta}>
        {presentation.pageCount} {presentation.pageCount === 1 ? 'page' : 'pages'}
      </span>
      <span className={styles.cardMeta}>
        {new Date(presentation.updatedAt).toLocaleString()}
      </span>
      <div className={styles.cardActions}>
        <button type="button" onClick={() => setRenaming(true)}>
          Rename
        </button>
        <button type="button" onClick={onDelete} disabled={remove.isPending}>
          Delete
        </button>
      </div>
    </article>
  );
}
