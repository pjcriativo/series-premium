import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_series_id: string | null;
  series?: { id: string; title: string } | null;
}

interface HeroSliderProps {
  banners: Banner[];
}

const HeroSlider = React.forwardRef<HTMLDivElement, HeroSliderProps>(
  ({ banners }, ref) => {
    const navigate = useNavigate();
    const [selectedIndex, setSelectedIndex] = useState(0);

    const autoplay = useRef(Autoplay({ delay: 5000, stopOnInteraction: false }));
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [autoplay.current]);

    const onSelect = useCallback(() => {
      if (!emblaApi) return;
      setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
      if (!emblaApi) return;
      emblaApi.on("select", onSelect);
      onSelect();
      return () => { emblaApi.off("select", onSelect); };
    }, [emblaApi, onSelect]);

    if (!banners.length) return null;

    return (
      <div ref={ref} className="w-full px-4 md:px-8 pt-4">
        <section className="relative overflow-hidden max-w-7xl mx-auto rounded-lg">
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex">
              {banners.map((banner) => (
                <div key={banner.id} className="flex-[0_0_100%] min-w-0 relative aspect-[16/7] md:aspect-[16/6]">
                  {banner.image_url ? (
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/30 to-secondary" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

                  <div className="relative z-10 flex flex-col justify-end h-full max-w-7xl mx-auto px-6 md:px-14 pb-6 md:pb-14">
                    <h2 className="text-3xl md:text-5xl font-bold text-white max-w-lg leading-tight drop-shadow-lg">
                      {banner.title}
                    </h2>
                    {banner.subtitle && (
                      <p className="text-sm md:text-base text-white/80 max-w-md mt-2 line-clamp-2 drop-shadow">
                        {banner.subtitle}
                      </p>
                    )}
                    {banner.link_series_id && (
                      <button
                        onClick={() => navigate(`/series/${banner.link_series_id}`)}
                        className="mt-4 px-8 py-3 bg-white text-black rounded-md font-semibold inline-flex items-center gap-2 w-fit hover:bg-gray-200 transition"
                      >
                        <Play className="h-5 w-5 fill-black" /> Assistir
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute top-0 inset-x-0 h-16 md:h-24 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 inset-x-0 h-28 md:h-44 bg-gradient-to-t from-background via-background/60 to-transparent z-10 pointer-events-none" />
          <div className="absolute left-0 inset-y-0 w-20 md:w-40 lg:w-64 xl:w-80 bg-gradient-to-r from-background via-background/50 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 inset-y-0 w-20 md:w-40 lg:w-64 xl:w-80 bg-gradient-to-l from-background via-background/50 to-transparent z-10 pointer-events-none" />

          {banners.length > 1 && (
            <>
              <button
                onClick={() => emblaApi?.scrollPrev()}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 rounded-full p-2.5 text-white transition hidden md:flex items-center justify-center z-20"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => emblaApi?.scrollNext()}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 rounded-full p-2.5 text-white transition hidden md:flex items-center justify-center z-20"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {banners.length > 1 && (
            <div className="absolute bottom-4 right-6 flex gap-1.5 z-20">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => emblaApi?.scrollTo(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === selectedIndex ? "w-6 bg-white" : "w-1.5 bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }
);

HeroSlider.displayName = "HeroSlider";

export default HeroSlider;
