import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function AppPageHeader({
    title,
    subtitle,
    onBack,
    backLabel = 'Back',
    leading,
    trailing,
    centerAddon,
}) {
    return (
        <header className="app-page-header">
            <div className="app-page-header__side app-page-header__side--start">
                {onBack ? (
                    <button
                        type="button"
                        className="app-page-header__back"
                        onClick={onBack}
                        aria-label={backLabel}
                    >
                        <ArrowLeft size={18} aria-hidden="true" />
                    </button>
                ) : (
                    leading ?? <span className="app-page-header__spacer" aria-hidden="true" />
                )}
            </div>
            <div className="app-page-header__center">
                <div className="app-page-header__title-row">
                    <h1 className="app-page-header__title">{title}</h1>
                    {centerAddon ?? null}
                </div>
                {subtitle ? <p className="app-page-header__subtitle">{subtitle}</p> : null}
            </div>
            <div className="app-page-header__side app-page-header__side--end">
                {trailing ?? <span className="app-page-header__spacer" aria-hidden="true" />}
            </div>
        </header>
    );
}
