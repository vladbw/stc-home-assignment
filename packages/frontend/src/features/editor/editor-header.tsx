import { Link } from 'react-router-dom';
import type { PresentationDetail } from '@sts/shared';
import { buttonVariants } from '../../generic-components/button';

type Props = {
  presentation: PresentationDetail;
};

/** Editor route header: back link, mobile pages toggle, title, Present button. */
export function EditorHeader({ presentation }: Props) {
  return (
    <header className="flex items-center gap-3 border-b border-border bg-panel-raised px-4 py-3">
      <Link
        to="/"
        className={buttonVariants({ size: 'icon', variant: 'secondary' })}
        aria-label="Back to presentations"
      >
        ←
      </Link>
      <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-foreground">
        {presentation.title}
      </h1>
      <Link
        to={`/presentations/${presentation.id}/present`}
        className={buttonVariants({ variant: 'ghost' })}
      >
        ▶ Present
      </Link>
    </header>
  );
}
