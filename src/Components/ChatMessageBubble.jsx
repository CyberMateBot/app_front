import React from 'react';
import MarkdownMessage from './MarkdownMessage.jsx';
import TypingMessage from './TypingMessage.jsx';
import GeneratingBubble from './GeneratingBubble.jsx';

export default function ChatMessageBubble({ message, onTypingComplete, generatingLabel }) {
    const renderMarkdown = message.role === 'assistant';

    if (message.role === 'assistant' && message.isPending) {
        return (
            <div className={`ai-chat__bubble ai-chat__bubble--${message.role} ai-chat__bubble--generating`}>
                <GeneratingBubble label={generatingLabel} />
            </div>
        );
    }

    if (message.role === 'assistant' && message.isTyping) {
        return (
            <div className={`ai-chat__bubble ai-chat__bubble--${message.role} ai-chat__bubble--typing`}>
                <TypingMessage
                    text={message.content ?? ''}
                    renderMarkdown={renderMarkdown}
                    onComplete={() => onTypingComplete?.(message.id)}
                />
            </div>
        );
    }

    return (
        <div className={`ai-chat__bubble ai-chat__bubble--${message.role}`}>
            {message.imagePreview ? (
                <img
                    className="ai-chat__bubble-image"
                    src={message.imagePreview}
                    alt=""
                />
            ) : null}
            {renderMarkdown ? (
                <MarkdownMessage content={message.content} />
            ) : (
                <p>{message.content}</p>
            )}
        </div>
    );
}
