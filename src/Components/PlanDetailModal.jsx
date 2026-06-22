import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function PlanDetailModal({
    open = false,
    planName = '',
    sections = [],
    text = {},
    language = 'ru',
    onClose,
}) {
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

    if (!open || typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div className="plan-detail-modal" role="presentation">
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
                    {sections.length ? sections.map((section) => (
                        <section key={section.id} className="plan-detail-modal__section">
                            <h4 className="plan-detail-modal__section-title">
                                {text[section.labelKey] ?? section.id}
                            </h4>
                            <ul className="plan-detail-modal__models">
                                {section.models.map((model) => (
                                    <li key={model.id} className="plan-detail-modal__model">
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
