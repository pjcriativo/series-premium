import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import SeriesCard from "@/components/SeriesCard";
import { Tables } from "@/integrations/supabase/types";

const Search = () => {
  const [query, setQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState<string | null>(null);

  const { data: allSeries } = useQuery({
    queryKey: ["published-series"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("*")
        .eq("status", "published")
        .order("title");
      if (error) throw error;
      return data as Tables<"series">[];
    },
  });

  const genres = [...new Set((allSeries || []).map((s) => s.genre).filter(Boolean))] as string[];

  const filtered = (allSeries || []).filter((s) => {
    const matchesQuery = !query || s.title.toLowerCase().includes(query.toLowerCase());
    const matchesGenre = !activeGenre || s.genre === activeGenre;
    return matchesQuery && matchesGenre;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-14 px-4">
        <div className="relative mt-4 mb-4">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar séries..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {genres.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
            <button
              onClick={() => setActiveGenre(null)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !activeGenre
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              Todos
            </button>
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setActiveGenre(activeGenre === g ? null : g)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeGenre === g
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {g}
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
