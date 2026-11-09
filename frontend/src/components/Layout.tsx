import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ClockCounterClockwise } from '@phosphor-icons/react';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  status: {
    db_connected: boolean;
    api_connected: boolean;
    db_name?: string;
    is_demo?: boolean;
    custom_db_allowed?: boolean;
  };
  onShowHistory: () => void;
}

export function Layout({ children, currentPage, onNavigate, status, onShowHistory }: LayoutProps) {
  const needsKey = !status.is_demo && (status.custom_db_allowed ?? true);
  const navItems = [
    { id: 'db', label: 'Connect', disabled: false },
    ...(needsKey ? [{ id: 'api', label: 'API key', disabled: false }] : []),
    { id: 'query', label: 'Ask', disabled: !status.db_connected || !status.api_connected },
  ];

  // Ask stays clickable while locked; clicking it explains what is missing.
  const [toast, setToast] = useState<{ id: number; leaving: boolean } | null>(null);
  const toastTimers = useRef<number[]>([]);
  const clearToastTimers = () => { toastTimers.current.forEach(clearTimeout); toastTimers.current = []; };
  const hideToast = () => {
    clearToastTimers();
    setToast(t => (t ? { ...t, leaving: true } : t));
    toastTimers.current.push(window.setTimeout(() => setToast(null), 260));
  };
  const showToast = () => {
    clearToastTimers();
    setToast({ id: Date.now(), leaving: false });
    toastTimers.current.push(window.setTimeout(hideToast, 5000));
  };
  useEffect(() => clearToastTimers, []);
  useEffect(() => {
    if (status.db_connected && status.api_connected && toast) hideToast();
  }, [status.db_connected, status.api_connected]);

  const missingDb = !status.db_connected;
  const missingTarget = missingDb ? 'db' : 'api';

  const [scrolled, setScrolled] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const btns = useRef(new Map<string, HTMLButtonElement>());
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const el = btns.current.get(currentPage);
      setPill(el ? { x: el.offsetLeft, w: el.offsetWidth } : null);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [currentPage, needsKey]);

  return (
    <>
      <div className="scroll-progress" aria-hidden />
      <a href="#main" className="skip-link">Skip to content</a>
      <div ref={sentinel} className="absolute left-0 top-0 h-px w-px" aria-hidden />

      <header className="nav" data-scrolled={scrolled}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => onNavigate('db')}
            className="rounded-full text-xl font-semibold tracking-tight transition-transform active:scale-95"
            aria-label="AskSQL home"
          >
            Ask<span className="text-accent-ink">SQL</span>
          </button>

          <nav aria-label="Primary" className="seg">
            {pill && (
              <span className="seg-pill" style={{ transform: `translateX(${pill.x}px)`, width: pill.w }} aria-hidden />
            )}
            {navItems.map(item => (
              <button
                key={item.id}
                type="button"
                ref={el => { if (el) btns.current.set(item.id, el); else btns.current.delete(item.id); }}
                aria-disabled={item.disabled || undefined}
                aria-current={currentPage === item.id ? 'page' : undefined}
                onClick={() => (item.disabled ? showToast() : onNavigate(item.id))}
                className="seg-btn"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <p className="hidden max-w-[12rem] truncate pr-2 text-sm text-ink-3 lg:block" aria-live="polite">
              {status.db_connected ? `Connected to ${status.db_name ?? 'database'}` : 'Not connected'}
            </p>
            <button type="button" onClick={onShowHistory} className="icon-btn" aria-label="Open query history">
              <ClockCounterClockwise size={22} />
            </button>
          </div>
        </div>
      </header>

      <main id="main" key={currentPage} className="page-enter mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 sm:pt-14">
        {children}
      </main>

      {toast && (
        <div className="toast-wrap" role="status" aria-live="polite">
          <div key={toast.id} className="toast" data-leaving={toast.leaving}>
            <span className="toast-dot" aria-hidden />
            <p className="toast-text">
              {missingDb ? 'Connect a database first' : 'Add your API key first'}
              <span className="toast-sub">
                {missingDb ? 'Then you can ask your first question.' : 'One more step before you can ask.'}
              </span>
            </p>
            <button
              type="button"
              className="toast-action"
              onClick={() => { hideToast(); onNavigate(missingTarget); }}
            >
              {missingDb ? 'Connect' : 'Add key'}
            </button>
            <button type="button" className="toast-close" onClick={hideToast} aria-label="Dismiss">×</button>
            <span className="toast-timer" aria-hidden />
          </div>
        </div>
      )}

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-sm text-ink-3 sm:px-6">
          <p>AskSQL turns plain English into MySQL.</p>
          <a className="btn-link" href="https://github.com/muhmd-sinan/AskSQL" target="_blank" rel="noreferrer">
            View source on GitHub
          </a>
        </div>
      </footer>
    </>
  );
}
