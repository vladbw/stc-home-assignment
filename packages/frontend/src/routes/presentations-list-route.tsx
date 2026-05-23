import { PageContent, PageShell } from '../components/ui/page-shell';
import {
  CreatePresentationForm,
  PresentationsGrid,
  WorkspaceHeader,
} from '../features/presentations-list';

export function PresentationsListRoute() {
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
