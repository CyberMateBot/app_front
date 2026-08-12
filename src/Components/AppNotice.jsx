import { X } from 'lucide-react';

export default function AppNotice({ notice, onDismiss }) {
    if (!notice?.message) {
        return null;
    }

    const variant = notice.variant === 'success' ? 'success' : 'error';

    return (
        <div
            className={`app-notice app-notice--${variant}`}
            role={variant === 'error' ? 'alert' : 'status'}
            aria-live="polite"
        >
            <p className="app-notice__text">{notice.message}</p>
            <button
                type="button"
                className="app-notice__close"
                aria-label="Закрыть"
                onClick={onDismiss}
            >
                <X size={16} aria-hidden="true" />
            </button>
        </div>
    );
}
