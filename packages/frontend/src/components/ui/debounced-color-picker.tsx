import { useEffect, useRef, useState } from 'react';
import { useDebouncedCommit } from '../../lib/use-debounced-commit';

type Props = {
  value: string;
  /** Called with the picked hex (upper-cased) after the debounce window. */
  onCommit: (color: string) => void;
  label?: string;
  title?: string;
  /** Debounce window in milliseconds before `onCommit` fires. Default 150. */
  delay?: number;
};

const DEFAULT_DELAY_MS = 150;

/**
 * The native picker emits `onChange` continuously while the user drags
 * inside the OS color dialog. Here we keep a local `draft` that drives the swatch
 * live, and only fire `onCommit` `delay` ms after the last pick.
 *
 * `onCommit` is read via a ref, so the closure captured at fire time is
 * always the consumer's latest: concurrent edits to the item
 * (bold being toggled mid-pick) compose on top of the freshest state.
 */
export function DebouncedColorPicker({
  value,
  onCommit,
  label,
  title,
  delay = DEFAULT_DELAY_MS,
}: Props) {
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  const [draft, setDraft] = useState(value);

  // Resync the draft when the underlying value changes from elsewhere
  // (item swap, undo, external mutation) so the swatch never goes stale.
  useEffect(() => {
    setDraft(value);
  }, [value]);

  const { schedule } = useDebouncedCommit(delay);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value.toUpperCase();
    setDraft(newColor);
    schedule(() => {
      if (newColor === value) return; // skip no-op commits
      onCommitRef.current(newColor);
    });
  };

  return (
    <label
      className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted"
      title={title}
    >
      {label && <span>{label}</span>}
      <input
        type="color"
        value={draft.toLowerCase()}
        onChange={onChange}
        className="h-8 w-10 cursor-pointer border border-border bg-transparent p-0"
      />
    </label>
  );
}
