import React, { useCallback } from 'react';
import MarkdownMessage from './MarkdownMessage.jsx';
import TypingMessage from './TypingMessage.jsx';

export default function ChatMessageBubble({ message, onTypingComplete }) {
    const handleComplete = useCallback(() => {
        onTypingComplete?.(message.id);
    }, [message.id, onTypingComplete]);

    const showTyping = message.role === 'assistant' && message.isTyping;
    const renderMarkdown = message.role === 'assistant';

    return (
        <div className={`ai-chat__bubble ai-chat__bubble--${message.role}`}>
            {showTyping ? (
                <TypingMessage text={message.content} onComplete={handleComplete} renderMarkdown={renderMarkdown} />
            ) : renderMarkdown ? (
                <MarkdownMessage content={message.content} />
            ) : (
                <p>{message.content}</p>
            )}
        </div>
    );
}
