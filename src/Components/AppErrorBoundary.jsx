import React from 'react';

export default class AppErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        if (import.meta.env.DEV) {
            console.error('[CyberMate] Render error:', error, info);
        }
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        const { error } = this.state;

        if (!error) {
            return this.props.children;
        }

        const message = error instanceof Error ? error.message : String(error);

        return (
            <div className="app-fatal">
                <p className="app-fatal__title">Не удалось открыть приложение</p>
                <p className="app-fatal__message">{message}</p>
                <button type="button" className="app-fatal__btn" onClick={this.handleReload}>
                    Обновить
                </button>
            </div>
        );
    }
}
