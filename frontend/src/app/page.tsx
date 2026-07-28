"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, Loader2, ArrowRight, Sparkles, ChefHat, ExternalLink, Play, Globe, User } from "lucide-react";
import { searchProfessionals, getAuthToken, getMyProfessionalProfile } from "@/lib/api";
import { ResultCard } from "@/components/ResultCard";

const PLACEHOLDERS = [
  "Ej: necesito reducir el sodio en mi salsa sin perder vida util",
  "Ej: busco alguien que me ayude con el etiquetado nutricional",
  "Ej: mi planta tiene problemas de productividad en la linea de envasado",
  "Ej: necesito formular un producto sin gluten que sea rentable",
];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [placeholder] = useState(
    () => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]
  );
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [professionalId, setProfessionalId] = useState<number | null>(null);
  const [isSuperuser, setIsSuperuser] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    setLoggedIn(!!token);
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const uid = parseInt(payload.sub);
        setUserId(uid);
        setIsSuperuser(payload.is_superuser === true);
        getMyProfessionalProfile()
          .then((prof) => setProfessionalId(prof.id))
          .catch(() => {});
      } catch {}
    }
  }, []);

  const handleSearch = useCallback(async () => {
    if (query.trim().length < 10) return;

    setIsSearching(true);
    setError(null);
    setResults([]);

    try {
      const data = await searchProfessionals(query);
      setResults(data);
    } catch (err) {
      setError("Algo no salio bien. Intenta de nuevo en un momento.");
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const localResults = results.filter((r) => r.source === "registered");
  const webResults = results.filter((r) => r.source === "youtube" || r.source === "web");

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Nav */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <a href="/" className="flex items-center gap-2.5 text-lg font-bold text-white">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <ChefHat className="w-4.5 h-4.5 text-white" />
              </div>
              FoodTalent
            </a>
            <div className="flex items-center gap-3">
              {loggedIn ? (
                <>
                  {isSuperuser && (
                    <a href="/admin" className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors">
                      Admin
                    </a>
                  )}
                  <a href={`/profile/${professionalId}/edit`} className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm font-medium transition-colors">
                    <User className="w-4 h-4" />
                    Mi perfil
                  </a>
                  <button
                    onClick={() => {
                      localStorage.removeItem("foodtalent_token");
                      localStorage.removeItem("foodtalent_role");
                      setLoggedIn(false);
                      setUserId(null);
                      setIsSuperuser(false);
                    }}
                    className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
                  >
                    Cerrar sesion
                  </button>
                </>
              ) : (
                <>
                  <a href="/login" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
                    Iniciar sesion
                  </a>
                  <a
                    href="/register"
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-500 transition-colors"
                  >
                    Publica tu perfil de experto
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="min-h-[90vh] flex flex-col items-center justify-center px-4 pt-20 pb-16">
        <div className="w-full max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Impulsado por IA especializada
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight">
            Encuentra al experto
            <br />
            <span className="text-gradient">que resuelva tu reto</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            ¿Qué problema necesitas resolver en tu empresa de alimentos? Te encontramos a la persona mas idonea.
          </p>

          {/* Search box */}
          <div className="relative max-w-4xl mx-auto">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-60" />
              <div className="relative flex items-center bg-slate-900 rounded-2xl border border-slate-700/50 shadow-elevated focus-within:border-emerald-500/50 transition-all duration-300">
                <Search className="absolute left-5 w-5 h-5 text-slate-500 pointer-events-none" />
                <input
                  id="search-input"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className="w-full px-14 py-5 sm:py-6 text-lg bg-transparent rounded-2xl focus:outline-none text-white placeholder:text-slate-500"
                  aria-label="Describe tu reto"
                />
                <div className="absolute right-3 flex items-center gap-2">
                  <span className="hidden sm:block text-xs text-slate-600 font-mono">
                    {query.length}/10
                  </span>
                  <button
                    onClick={handleSearch}
                    disabled={query.trim().length < 10 || isSearching}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-white text-slate-900 hover:bg-slate-100 focus:ring-4 focus:ring-white/20 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                    aria-busy={isSearching}
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Buscando
                      </>
                    ) : (
                      <>
                        Buscar
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-600 mt-4">
            Minimo 10 caracteres para mejores resultados
          </p>
        </div>
      </section>

      {/* Two audiences */}
      <section className="max-w-2xl mx-auto px-4 pb-24">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-3">¿Eres consultor o ingeniero de alimentos?</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-5">
            Crea tu perfil técnico y deja que las empresas te encuentren por tu especialidad, no por tu CV.
          </p>
          <a href="/register" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-emerald-600 text-white hover:bg-emerald-500 transition-colors">
            Crear mi perfil
          </a>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center" role="alert">
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          {/* Local Professionals */}
          {localResults.length > 0 && (
            <div className="mb-12">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Expertos registrados
                </h2>
                <p className="text-slate-400">
                  Perfiles verificados en nuestra plataforma
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {localResults.map((result: any) => (
                  <ResultCard key={result.professional_id} result={result} />
                ))}
              </div>
            </div>
          )}

          {/* YouTube/Web Results */}
          {webResults.length > 0 && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Encontramos en la web
                </h2>
                <p className="text-slate-400">
                  Contenido relacionado de YouTube y sitios especializados
                </p>
              </div>
              <div className="space-y-3">
                {webResults.map((result: any) => (
                  <a
                    key={result.professional_id}
                    href={result.video_url || result.article_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-slate-700 hover:bg-slate-900/80 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-700 transition-colors">
                        {result.source === "youtube" ? (
                          <Play className="w-5 h-5 text-red-400" />
                        ) : (
                          <Globe className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate group-hover:text-emerald-400 transition-colors">
                          {result.name}
                        </h3>
                        <p className="text-slate-500 text-sm mt-1 line-clamp-2">
                          {result.summary}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded-md ${
                            result.source === "youtube"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-blue-500/10 text-blue-400"
                          }`}>
                            {result.source === "youtube" ? "YouTube" : "Web"}
                          </span>
                          {result.channel_name && (
                            <span className="text-xs text-slate-600">
                              {result.channel_name}
                            </span>
                          )}
                          {result.site_name && (
                            <span className="text-xs text-slate-600">
                              {result.site_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-slate-400 flex-shrink-0 mt-1" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
