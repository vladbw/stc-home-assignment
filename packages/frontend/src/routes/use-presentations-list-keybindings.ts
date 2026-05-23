import { useEffect } from 'react';
import { isPlainModShortcut } from '../utils/keyboard';

export function usePresentationsListKeybindings(createPresentation: () => void) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isPlainModShortcut(e) || e.key.toLowerCase() !== 'n') return;

      e.preventDefault();
      if (e.repeat) return;

      createPresentation();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [createPresentation]);
}
