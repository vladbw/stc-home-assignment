import { PageContent, PageShell } from '../components/ui/page-shell';
import {
  CreatePresentationForm,
  PresentationsGrid,
  WorkspaceHeader,
} from '../features/presentations-list';

// The landing page, where the list of presentations is shown
export function PresentationsListPage() {
  return (
    <PageShell>
      <PageContent>
        <WorkspaceHeader />
        <CreatePresentationForm />
        <PresentationsGrid />
      </PageContent>
    </PageShell>
  );
}
