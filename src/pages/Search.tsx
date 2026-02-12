import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import SeriesCard from "@/components/SeriesCard";

const Search = () => {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: allSeries } = useQuery({
    queryKey: ["published-series"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("*, categories(name)")
        .eq("is_published", true)
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  const seriesWithCategory = (allSeries || []).map((s) => ({
    ...s,
    category_name: (s as any).categories?.name ?? null,
  }));

  const filtered = seriesWithCategory.filter((s) => {
    const matchesQuery = !query || s.title.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = !activeCategory || s.category_id === activeCategory;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-14 px-4">
        <div className="relative mt-4 mb-4">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar séries..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>

        {(categories ?? []).length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${!activeCategory ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
            >
              Todos
            </button>
            {(categories ?? []).map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(activeCategory === c.id ? null : c.id)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeCategory === c.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filtered.map((s) => (
            <SeriesCard key={s.id} series={s} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Nenhuma série encontrada.</p>
        )}
      </main>
    </div>
  );
};

export default Search;
