import { type PageResponse } from '@sts/shared';
import { useEditorActions } from '../use-editor-actions';

type Props = {
  presentationId: string;
  page: PageResponse;
};

/** Color picker for the active page's background. Visible when nothing is selected. */
export function ToolbarPageBgControl({ presentationId, page }: Props) {
  const actions = useEditorActions(presentationId);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    actions.patchPage(page, { backgroundColor: e.target.value.toUpperCase() });
  };

  return (
    <label
      className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted"
      title="Page background color"
    >
      <span>Page background</span>
      <input
        type="color"
        value={page.backgroundColor.toLowerCase()}
        onChange={onChange}
        className="h-8 w-10 cursor-pointer border border-border bg-transparent p-0"
      />
    </label>
  );
}
