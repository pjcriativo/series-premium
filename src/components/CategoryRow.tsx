import SeriesCard from "@/components/SeriesCard";

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

const CategoryRow = ({ title, series }: CategoryRowProps) => {
  if (!series.length) return null;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-foreground mb-3 px-4">{title}</h2>
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-hide">
        {series.map((s) => (
          <SeriesCard key={s.id} series={s} />
        ))}
      </div>
    </section>
  );
};

export default CategoryRow;
