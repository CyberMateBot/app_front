import React from 'react';
import { Clock } from 'lucide-react';

export default function SubscriptionTimeBadge({
    timeLeftLabel = '',
    expiryDateLabel = '',
    expiringSoon = false,
    language = 'ru',
    compact = false,
    inline = false,
}) {
    if (!timeLeftLabel && !expiryDateLabel) {
        return null;
    }

    const primary = timeLeftLabel || expiryDateLabel;
    const secondary = timeLeftLabel && expiryDateLabel ? expiryDateLabel : '';

    return (
        <div
            className={[
                'subscription-time-badge',
                expiringSoon ? 'subscription-time-badge--warn' : '',
                compact ? 'subscription-time-badge--compact' : '',
                inline ? 'subscription-time-badge--inline' : '',
            ].filter(Boolean).join(' ')}
            role="status"
        >
            <Clock size={compact || inline ? 16 : 18} aria-hidden="true" />
            <span className="subscription-time-badge__text">
                <span className="subscription-time-badge__primary">{primary}</span>
                {secondary && !compact ? (
                    <span className="subscription-time-badge__secondary">
                        {language === 'ru' ? `до ${secondary}` : `until ${secondary}`}
                    </span>
                ) : null}
            </span>
        </div>
    );
}
