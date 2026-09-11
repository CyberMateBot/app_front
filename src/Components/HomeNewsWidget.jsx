import { useCallback, useEffect, useRef, useState } from 'react'

const SLIDE_DURATION_MS = 4000

export default function HomeNewsWidget({ slides }) {
    const [current, setCurrent] = useState(0)
    const [brokenImageIds, setBrokenImageIds] = useState(() => new Set())
    const timerRef = useRef(null)
    const touchStartX = useRef(0)
    const count = slides.length

    const showSlide = useCallback((idx) => {
        if (count === 0) {
            return;
        }

        setCurrent(((idx % count) + count) % count);
    }, [count]);

    const nextSlide = useCallback(() => {
        showSlide(current + 1);
    }, [current, showSlide]);

    const prevSlide = useCallback(() => {
        showSlide(current - 1);
    }, [current, showSlide]);

    useEffect(() => {
        if (count <= 1) {
            return undefined;
        }

        timerRef.current = window.setInterval(() => {
            setCurrent((prev) => (prev + 1) % count);
        }, SLIDE_DURATION_MS);

        return () => {
            if (timerRef.current) {
                window.clearInterval(timerRef.current);
            }
        };
    }, [count, current]);

    const restartAuto = useCallback(() => {
        if (timerRef.current) {
            window.clearInterval(timerRef.current);
        }
        if (count <= 1) {
            return;
        }
        timerRef.current = window.setInterval(() => {
            setCurrent((prev) => (prev + 1) % count);
        }, SLIDE_DURATION_MS);
    }, [count]);

    if (count === 0) {
        return null;
    }

    return (
        <div
            className="home-news-widget"
            onTouchStart={(event) => {
                touchStartX.current = event.touches[0]?.clientX ?? 0;
            }}
            onTouchEnd={(event) => {
                const endX = event.changedTouches[0]?.clientX ?? 0;
                const diff = touchStartX.current - endX;

                if (Math.abs(diff) <= 40) {
                    return;
                }

                if (diff > 0) {
                    nextSlide();
                } else {
                    prevSlide();
                }
                restartAuto();
            }}
        >
            <div className="home-news-widget__dots" aria-hidden="true">
                {slides.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`home-news-widget__dot${index < current ? ' home-news-widget__dot--done' : ''}${index === current ? ' home-news-widget__dot--active' : ''}`}
                    >
                        <div
                            className="home-news-widget__dot-fill"
                            style={index === current ? { animationDuration: `${SLIDE_DURATION_MS}ms` } : undefined}
                        />
                    </div>
                ))}
            </div>

            {slides.map((slide, index) => (
                <article
                    key={slide.id}
                    className={`home-news-widget__slide${index === current ? ' home-news-widget__slide--active' : ''}`}
                    aria-hidden={index !== current}
                >
                    {slide.imageUrl && !brokenImageIds.has(slide.id) ? (
                        <div className="home-news-widget__slide-media">
                            <img
                                className="home-news-widget__slide-image"
                                src={slide.imageUrl}
                                alt=""
                                draggable={false}
                                loading={index === 0 ? 'eager' : 'lazy'}
                                decoding="async"
                                // If the photo fails to load (broken link, blocked
                                // request...) fall back to the gradient instead of
                                // leaving an empty "frame" with a broken-image icon.
                                onError={() => {
                                    setBrokenImageIds((prev) => {
                                        if (prev.has(slide.id)) {
                                            return prev;
                                        }
                                        const next = new Set(prev);
                                        next.add(slide.id);
                                        return next;
                                    });
                                }}
                            />
                        </div>
                    ) : (
                        <div className="home-news-widget__slide-bg" style={{ background: slide.background }} />
                    )}
                    {slide.tag || slide.title || slide.description ? (
                        <div className="home-news-widget__slide-overlay" />
                    ) : null}
                    <div className="home-news-widget__slide-content">
                        {slide.tag ? (
                            <span
                                className="home-news-widget__tag"
                                style={{ background: slide.tagBg, color: slide.tagColor }}
                            >
                                {slide.tag}
                            </span>
                        ) : null}
                        {slide.title ? (
                            <h3 className="home-news-widget__title">{slide.title}</h3>
                        ) : null}
                        {slide.description ? (
                            <p className="home-news-widget__desc">{slide.description}</p>
                        ) : null}
                    </div>
                </article>
            ))}
        </div>
    );
}
