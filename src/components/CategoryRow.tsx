import React from "react";
import SeriesCard from "@/components/SeriesCard";
import HorizontalCarousel from "@/components/HorizontalCarousel";

interface CategoryRowProps {
  title: string;
  series: {
    id: string;
    title: string;
    cover_url: string | null;
    category_name?: string | null;
    episode_count?: number;
  }[];
}

const CategoryRow = React.forwardRef<HTMLElement, CategoryRowProps>(
  ({ title, series }, _ref) => {
    if (!series.length) return null;

    return (
      <HorizontalCarousel title={title}>
        {series.map((s) => (
          <div
            key={s.id}
            className="w-[calc((100%_-_0.75rem)/2)] md:w-[calc((100%_-_2.25rem)/4)] lg:w-[calc((100%_-_4.5rem)/7)] flex-shrink-0"
          >
            <SeriesCard series={s} />
          </div>
        ))}
      </HorizontalCarousel>
    );
  }
);

CategoryRow.displayName = "CategoryRow";

export default CategoryRow;
