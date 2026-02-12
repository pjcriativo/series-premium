import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const EpisodeForm = () => {
  const { id } = useParams();
  const isNew = !id;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/episodes"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <h1 className="text-2xl font-bold text-foreground">{isNew ? "Novo Episódio" : "Editar Episódio"}</h1>
      </div>
      <p className="text-muted-foreground">Formulário em construção.</p>
    </div>
  );
};

export default EpisodeForm;
