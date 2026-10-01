import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

/**
 * Auto-resizing prompt textarea with smooth desktop mouse wheel scrolling.
 * Expands gently as the user writes a prompt (from min 32px up to max 114px, ~4-5 lines),
 * then enables vertical scrolling so nothing is cut off.
 */
const PromptTextarea = forwardRef(function PromptTextarea(
    {
        id,
        className = 'ai-chat__input',
        value = '',
        onChange,
        onKeyDown,
        placeholder,
        disabled = false,
        rows = 1,
        minHeight = 32,
        maxHeight = 114,
        ...restProps
    },
    ref
) {
    const internalRef = useRef(null);
    useImperativeHandle(ref, () => internalRef.current);

    const adjustHeight = useCallback(() => {
        const el = internalRef.current;
        if (!el) return;

        // Reset to auto to compute the natural content height
        el.style.height = 'auto';
        const scrollH = el.scrollHeight;
        const newHeight = Math.min(Math.max(scrollH, minHeight), maxHeight);
        el.style.height = `${newHeight}px`;

        if (scrollH > maxHeight) {
            el.style.overflowY = 'auto';
        } else {
            el.style.overflowY = 'hidden';
        }
    }, [minHeight, maxHeight]);

    // Recalculate on value change (including prompt clearing setTextPrompt(''))
    useEffect(() => {
        adjustHeight();
    }, [value, adjustHeight]);

    // Ensure desktop wheel scrolls textarea up/down smoothly without page capturing it
    const handleWheel = (event) => {
        const el = internalRef.current;
        if (!el) return;

        if (el.scrollHeight > el.clientHeight) {
            event.stopPropagation();
            el.scrollTop += event.deltaY;
        }
    };

    return (
        <textarea
            ref={internalRef}
            id={id}
            className={className}
            value={value}
            onChange={(event) => {
                onChange?.(event);
                adjustHeight();
            }}
            onKeyDown={onKeyDown}
            onWheel={handleWheel}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            {...restProps}
        />
    );
});

export default PromptTextarea;
