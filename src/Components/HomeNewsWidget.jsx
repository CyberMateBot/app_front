import { useCallback, useEffect, useRef, useState } from 'react'

const SLIDE_DURATION_MS = 4000

function slideBackgroundStyle(slide) {
    if (slide.imageUrl) {
        return {
            backgroundImage: `url(${slide.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        };
    }

    return { background: slide.background };
}

export default function HomeNewsWidget({ slides }) {
    const [current, setCurrent] = useState(0)
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
                    <div className="home-news-widget__slide-bg" style={slideBackgroundStyle(slide)} />
                    <div className="home-news-widget__slide-overlay" />
                    <div className="home-news-widget__slide-content">
                        <span
                            className="home-news-widget__tag"
                            style={{ background: slide.tagBg, color: slide.tagColor }}
                        >
                            {slide.tag}
                        </span>
                        <h3 className="home-news-widget__title">{slide.title}</h3>
                        <p className="home-news-widget__desc">{slide.description}</p>
                    </div>
                </article>
            ))}
        </div>
    );
}
