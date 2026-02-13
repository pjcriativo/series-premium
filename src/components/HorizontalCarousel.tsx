import React, { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HorizontalCarouselProps {
  title: string;
  children: React.ReactNode;
}

const HorizontalCarousel: React.FC<HorizontalCarouselProps> = ({ title, children }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    setCanScrollLeft(container.scrollLeft > 1);
    setCanScrollRight(container.scrollLeft + container.clientWidth < container.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    updateScrollState();

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(container);
    container.addEventListener("scroll", updateScrollState, { passive: true });

    return () => {
      observer.disconnect();
      container.removeEventListener("scroll", updateScrollState);
    };
  }, [updateScrollState, children]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container || !container.firstElementChild) return;

    const gap = 12; // gap-3
    const cardWidth = (container.firstElementChild as HTMLElement).offsetWidth + gap;
    const w = window.innerWidth;
    const visibleCards = w >= 1024 ? 7 : w >= 768 ? 4 : 2;
    const scrollAmount = cardWidth * visibleCards;

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-foreground mb-3 px-4">{title}</h2>
      <div className="relative group/carousel">
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover/carousel:opacity-100 transition-opacity"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-hidden px-4 pb-2"
        >
          {children}
        </div>

        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover/carousel:opacity-100 transition-opacity"
            aria-label="Próximo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </section>
  );
};

export default HorizontalCarousel;
