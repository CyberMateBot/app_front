import React from 'react';
import MarkdownMessage from './MarkdownMessage.jsx';
import TypingMessage from './TypingMessage.jsx';
import GeneratingBubble from './GeneratingBubble.jsx';

export default function ChatMessageBubble({ message, generatingLabel }) {
    const renderMarkdown = message.role === 'assistant';

    if (message.role === 'assistant' && message.isPending) {
        return (
            <div className={`ai-chat__bubble ai-chat__bubble--${message.role} ai-chat__bubble--pending`}>
                <GeneratingBubble label={generatingLabel} />
            </div>
        );
    }

    if (message.role === 'assistant' && message.isTyping) {
        return (
            <div className={`ai-chat__bubble ai-chat__bubble--${message.role} ai-chat__bubble--typing`}>
                <TypingMessage
                    messageId={message.id}
                    text={message.content ?? ''}
                    typingProgress={message.typingProgress ?? 0}
                    renderMarkdown={renderMarkdown}
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
