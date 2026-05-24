import { ContentResponse, TextStyle } from "@sts/shared";
import { useRef, useEffect,
  type KeyboardEvent, } from "react";
import { useEditorStore } from "../../../../stores/editor-store";
import { useEditorActions } from "../use-editor-actions";
import styles from '../editor.module.css';

export function TextEditView({
  item,
  presentationId,
  style,
}: {
  item: ContentResponse;
  presentationId: string;
  style: TextStyle;
}) {
  const endEdit = useEditorStore((s) => s.endEdit);
  const actions = useEditorActions(presentationId);

  const draftRef = useRef(item.text ?? '');
  const cancelledRef = useRef(false);
  const itemRef = useRef(item);
  itemRef.current = item;
  
  // Capture `actions` in a ref so the unmount cleanup can call the latest
  // version (actions is recreated on each render).
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    return () => {
      const value = draftRef.current;
      if (!cancelledRef.current && value !== (itemRef.current.text ?? '')) {
        actionsRef.current.patchContent(itemRef.current, { text: value });
      }
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    draftRef.current = e.target.value;
  };

  const onBlur = () => {
    endEdit();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelledRef.current = true;
      endEdit();
    }
  };

  return (
    <textarea
      autoFocus
      defaultValue={item.text ?? ''}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      className={styles.contentTextEditing}
      style={{
        left: item.x,
        top: item.y,
        zIndex: 9999,
        fontSize: style.fontSize,
        fontWeight: style.bold ? 700 : 400,
        fontStyle: style.italic ? 'italic' : 'normal',
        color: style.color,
      }}
    />
  );
}