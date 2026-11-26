import { useEffect } from 'react';

const TOAST_DURATION_MS = 3500;

// Aviso breve de confirmación o error (se oculta solo).
export default function Toast({ notice, onDismiss }) {
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(onDismiss, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [notice, onDismiss]);

  if (!notice) return null;
  const isError = notice.type === 'error';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      style={{
        position: 'fixed', right: '1.25rem', bottom: '1.25rem', zIndex: 300, maxWidth: '360px',
        padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600,
        boxShadow: '0 10px 25px rgba(0,0,0,0.18)',
        background: isError ? '#fef2f2' : '#ecfdf5',
        border: `1px solid ${isError ? '#fecaca' : '#a7f3d0'}`,
        color: isError ? '#dc2626' : '#047857'
      }}
    >
      {notice.text}
    </div>
  );
}
