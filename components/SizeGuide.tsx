import { useEffect, useRef, useState } from 'react';
import type { LandingContent } from '@/lib/landing-content';

export default function SizeGuide({ content }: { content: LandingContent }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  return (
    <>
      <button
        type="button"
        className="text-link"
        aria-haspopup="dialog"
        onClick={() => {
          dialog.current?.showModal();
          setOpen(true);
        }}
      >
        Size guide
      </button>
      <dialog
        ref={dialog}
        className="size-guide-dialog"
        aria-labelledby="size-guide-title"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const bounds = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < bounds.left ||
              event.clientX > bounds.right ||
              event.clientY < bounds.top ||
              event.clientY > bounds.bottom
            )
              dialog.current?.close();
          }
        }}
      >
        <div className="section-heading">
          <h2 id="size-guide-title">Size guide</h2>
          <button
            type="button"
            autoFocus
            onClick={() => dialog.current?.close()}
            aria-label="Close size guide"
          >
            Close ×
          </button>
        </div>
        <p className="cms-copy">{content.copy.sizeIntro}</p>
        <div className="table-wrap">
          <table>
            <caption>Garment measurements in centimetres</caption>
            <thead>
              <tr>
                <th scope="col">Size</th>
                <th scope="col">Width (cm)</th>
                <th scope="col">Length (cm)</th>
              </tr>
            </thead>
            <tbody>
              {content.measurements.map((row) => (
                <tr key={row.size}>
                  <th scope="row">{row.size}</th>
                  <td>{row.width}</td>
                  <td>{row.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3>{content.copy.sizeFitTitle}</h3>
        <p className="cms-copy">{content.copy.sizeBody}</p>
        <small>{content.copy.sizeNote}</small>
      </dialog>
    </>
  );
}
