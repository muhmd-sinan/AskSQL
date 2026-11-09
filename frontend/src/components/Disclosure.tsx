import { useId, useState, type ReactNode } from 'react';
import { CaretDown } from '@phosphor-icons/react';

interface DisclosureProps {
  title: ReactNode;
  meta?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function Disclosure({ title, meta, defaultOpen = false, children }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="flex min-w-0 items-baseline gap-3">
          <span className="truncate text-lg font-semibold tracking-tight">{title}</span>
          {meta && <span className="text-sm text-ink-3">{meta}</span>}
        </span>
        <CaretDown size={18} weight="bold" className="chev shrink-0 text-ink-3" aria-hidden />
      </button>
      <div id={id} className="disclosure-body" data-open={open} role="region">
        <div className="disclosure-inner" inert={!open}>
          {children}
        </div>
      </div>
    </div>
  );
}
