import React from 'react';
import MarkdownMessage from './MarkdownMessage.jsx';

export default function ChatMessageBubble({ message }) {
    const renderMarkdown = message.role === 'assistant';

    return (
        <div className={`ai-chat__bubble ai-chat__bubble--${message.role}`}>
            {renderMarkdown ? (
                <MarkdownMessage content={message.content} />
            ) : (
                <p>{message.content}</p>
            )}
        </div>
    );
}
