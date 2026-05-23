import { useCallback, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { cardVariants } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { cn } from '../../lib/cn';
import { useCreatePresentation } from '../../queries/presentations';
import { useShortcut } from '../../shortcuts/use-shortcut';

/**
 * Title input + submit button for creating a new presentation. Owns the
 * `home.newPresentation` shortcut binding so the chord is wired wherever
 * this form mounts.
 */
export function CreatePresentationForm() {
  const [title, setTitle] = useState('');
  const { isPending, mutate: createPresentation } = useCreatePresentation();

  const createFromTitle = useCallback(() => {
    if (isPending) return;
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error('The new presentation needs a title!');
      return;
    }
    createPresentation({ title: trimmed }, { onSuccess: () => setTitle('') });
  }, [createPresentation, isPending, title]);

  useShortcut('home.newPresentation', createFromTitle);

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
      <Button
        type="submit"
        disabled={isPending}
        variant="primary"
        shortcut="home.newPresentation"
      >
        {isPending ? 'Creating…' : 'Create'}
      </Button>
    </form>
  );
}
