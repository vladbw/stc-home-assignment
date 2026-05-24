import { useState } from 'react';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEFAULT_TEXT_STYLE,
  type PageResponse,
} from '@sts/shared';
import { Button } from '../../../generic-components/button';
import { useEditorStore } from '../../../stores/editor-store';
import { fitDimensionsToBox } from '../media-dimensions';
import { MediaPicker, type PickedMedia } from '../media-picker';
import { useEditorActions } from '../use-editor-actions';

type Props = {
  presentationId: string;
  activePage: PageResponse | null;
};

/**
 * "+ Text" / "+ Image" / "+ Video" buttons. The media picker modal is local
 * state because it's only relevant to this group.
 */
export function ToolbarAddGroup({ presentationId, activePage }: Props) {
  const selectContent = useEditorStore((s) => s.selectContent);
  const actions = useEditorActions(presentationId);
  const [pickerKind, setPickerKind] = useState<'image' | 'video' | null>(null);

  const handleAddText = () => {
    if (!activePage) return;
    // width/height are legacy fields for text — the box auto-sizes to content.
    const id = actions.addContent(activePage.id, {
      type: 'text',
      x: 100,
      y: 100,
      width: 100,
      height: 40,
      text: 'Text',
      style: DEFAULT_TEXT_STYLE,
    });
    selectContent(id);
  };

  const handlePickMedia = (picked: PickedMedia) => {
    if (!activePage || !pickerKind) return;
    const fitted = fitDimensionsToBox(
      { width: picked.naturalWidth, height: picked.naturalHeight },
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
    );
    const x = Math.max(0, Math.min(CANVAS_WIDTH - fitted.width, 100));
    const y = Math.max(0, Math.min(CANVAS_HEIGHT - fitted.height, 100));
    const baseProps = {
      x,
      y,
      width: fitted.width,
      height: fitted.height,
      mediaId: picked.mediaId,
    };
    // Branch so `type` narrows to a literal (the discriminated union won't
    // accept `type: 'image' | 'video'` directly).
    const id =
      pickerKind === 'image'
        ? actions.addContent(activePage.id, { type: 'image', ...baseProps })
        : actions.addContent(activePage.id, { type: 'video', ...baseProps });
    selectContent(id);
    setPickerKind(null);
  };

  return (
    <>
      <Button onClick={handleAddText} disabled={!activePage}>
        + Text
      </Button>
      <Button onClick={() => setPickerKind('image')} disabled={!activePage}>
        + Image
      </Button>
      <Button onClick={() => setPickerKind('video')} disabled={!activePage}>
        + Video
      </Button>

      {pickerKind && (
        <MediaPicker
          kind={pickerKind}
          onClose={() => setPickerKind(null)}
          onPick={handlePickMedia}
        />
      )}
    </>
  );
}
