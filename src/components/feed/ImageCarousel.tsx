'use client';

import { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
  images: Array<{ thumb: string; fullsize: string; alt: string }>;
  className?: string;
}

export function ImageCarousel({ images, className = '' }: ImageCarouselProps) {
  const [current, setCurrent] = useState(0);
  const touchStart = useRef<number | null>(null);
  const touchDelta = useRef(0);
  const count = images.length;

  const go = useCallback(
    (dir: number) => {
      setCurrent((c) => (c + dir + count) % count);
    },
    [count]
  );

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
    touchDelta.current = 0;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    touchDelta.current = e.touches[0].clientX - touchStart.current;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (Math.abs(touchDelta.current) > 50) {
      go(touchDelta.current > 0 ? -1 : 1);
    }
    touchStart.current = null;
    touchDelta.current = 0;
  }, [go]);

  if (count === 1) {
    return (
      <img
        src={images[0].fullsize}
        alt={images[0].alt}
        className={`w-full object-cover ${className}`}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex transition-transform duration-300 ease-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {images.map((img, i) => (
          <img
            key={i}
            src={img.fullsize}
            alt={img.alt}
            className="w-full h-full object-cover shrink-0"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        ))}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); go(-1); }}
        className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity md:opacity-60 md:hover:opacity-100"
        aria-label="Previous image"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); go(1); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity md:opacity-60 md:hover:opacity-100"
        aria-label="Next image"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {images.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              i === current ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
