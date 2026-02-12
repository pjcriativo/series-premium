import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

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

const HeroSlider = ({ banners }: HeroSliderProps) => {
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  ]);

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
    <div className="relative w-full">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner) => (
            <div key={banner.id} className="flex-[0_0_100%] min-w-0 relative aspect-[16/9] md:aspect-[21/9]">
              {banner.image_url ? (
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary flex items-center justify-center">
                  <span className="text-6xl font-bold text-foreground/20">{banner.title.charAt(0)}</span>
                </div>
              )}
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-6 left-4 right-4 md:bottom-10 md:left-8 md:right-1/2 space-y-2">
                <h2 className="text-2xl md:text-4xl font-bold text-foreground drop-shadow-lg leading-tight">
                  {banner.title}
                </h2>
                {banner.subtitle && (
                  <p className="text-sm md:text-base text-foreground/80 drop-shadow line-clamp-2">
                    {banner.subtitle}
                  </p>
                )}
                {banner.link_series_id && (
                  <Button
                    size="sm"
                    className="mt-2 gap-2"
                    onClick={() => navigate(`/series/${banner.link_series_id}`)}
                  >
                    <Play className="h-4 w-4" /> Assistir
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === selectedIndex ? "w-6 bg-primary" : "w-1.5 bg-foreground/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroSlider;
