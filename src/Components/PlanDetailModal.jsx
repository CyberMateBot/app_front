import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const CLOSE_ANIMATION_MS = 300;

export default function PlanDetailModal({
    open = false,
    planName = '',
    sections = [],
    text = {},
    language = 'ru',
    onClose,
}) {
    const [shouldRender, setShouldRender] = useState(open);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose?.();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, onClose]);

    useEffect(() => {
        if (open) {
            setShouldRender(true);
            const frame = window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => setIsVisible(true));
            });
            return () => window.cancelAnimationFrame(frame);
        }

        setIsVisible(false);
        const timer = window.setTimeout(() => setShouldRender(false), CLOSE_ANIMATION_MS);
        return () => window.clearTimeout(timer);
    }, [open]);

    if (!shouldRender || typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div
            className={`plan-detail-modal${isVisible ? ' plan-detail-modal--visible' : ''}`}
            role="presentation"
        >
            <button
                type="button"
                className="plan-detail-modal__backdrop"
                aria-label={language === 'ru' ? 'Закрыть' : 'Close'}
                onClick={() => onClose?.()}
            />
            <div
                className="plan-detail-modal__panel"
                role="dialog"
                aria-modal="true"
                aria-label={planName}
            >
                <div className="plan-detail-modal__head">
                    <div>
                        <p className="plan-detail-modal__eyebrow">
                            {language === 'ru' ? 'Доступные модели' : 'Available models'}
                        </p>
                        <h3 className="plan-detail-modal__title">{planName}</h3>
                    </div>
                    <button
                        type="button"
                        className="plan-detail-modal__close"
                        aria-label={language === 'ru' ? 'Закрыть' : 'Close'}
                        onClick={() => onClose?.()}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="plan-detail-modal__body">
                    {sections.length ? sections.map((section, index) => (
                        <section
                            key={section.id}
                            className="plan-detail-modal__section"
                            style={{ '--section-index': index }}
                        >
                            <h4 className="plan-detail-modal__section-title">
                                {text[section.labelKey] ?? section.id}
                            </h4>
                            <ul className="plan-detail-modal__models">
                                {section.models.map((model, modelIndex) => (
                                    <li
                                        key={model.id}
                                        className="plan-detail-modal__model"
                                        style={{ '--model-index': modelIndex }}
                                    >
                                        {model.label}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )) : (
                        <p className="plan-detail-modal__empty">
                            {language === 'ru'
                                ? 'Для этого плана пока нет доступных моделей.'
                                : 'No models are available on this plan yet.'}
                        </p>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}
