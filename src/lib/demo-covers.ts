import coverAmor from "@/assets/cover-amor-em-chamas.jpg";
import coverSombras from "@/assets/cover-sombras-do-passado.jpg";
import coverConfusoes from "@/assets/cover-confusoes-em-familia.jpg";

// Fallback covers for demo series (by ID)
const demoCoverMap: Record<string, string> = {
  "a1b2c3d4-0001-4000-8000-000000000001": coverAmor,
  "a1b2c3d4-0002-4000-8000-000000000002": coverSombras,
  "a1b2c3d4-0003-4000-8000-000000000003": coverConfusoes,
};

export function getSeriesCover(seriesId: string, coverUrl: string | null): string | null {
  return coverUrl || demoCoverMap[seriesId] || null;
}
