import { PageContent, PageShell } from '../../generic-components/page-shell';
import { CreatePresentationForm } from './create-presentation-form';
import { PresentationsGrid } from './presentations-grid';
import { PresentationsListHeader } from './presentations-list-header';

// The landing page, where the list of existing presentations is shown
export function PresentationsListPage() {
  return (
    <PageShell>
      <PageContent>
        <PresentationsListHeader />
        <CreatePresentationForm />
        <PresentationsGrid />
      </PageContent>
    </PageShell>
  );
}
