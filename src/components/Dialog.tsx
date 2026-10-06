import { useEffect, useRef, type ReactNode } from "react";

// The native <dialog> handles Escape, focus and the backdrop.
interface DialogProps {
  open: boolean;
  onClose: () => void;
  titleId: string;
  title: string;
  hideTitle?: boolean;
  className?: string;
  children: ReactNode;
}

export function Dialog({ open, onClose, titleId, title, hideTitle, className, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    const handleClick = (event: MouseEvent) => {
      const box = dialog.getBoundingClientRect();
      const outside =
        event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
      if (outside) dialog.close();
    };

    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("click", handleClick);
    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("click", handleClick);
    };
  }, [onClose]);

  return (
    <dialog ref={ref} aria-labelledby={titleId} className={className}>
      <h2 id={titleId} className={hideTitle ? "sr" : undefined}>
        {title}
      </h2>
      {children}
    </dialog>
  );
}
