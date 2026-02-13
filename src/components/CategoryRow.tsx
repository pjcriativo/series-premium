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
    synopsis?: string | null;
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
            className="w-[calc((100%_-_1rem)/2)] md:w-[calc((100%_-_2rem)/3)] lg:w-[calc((100%_-_5rem)/6)] flex-shrink-0"
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
