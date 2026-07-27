"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProfessionalProfile, updateProfessionalProfile } from "@/lib/api";
import { Loader2, Plus, X, ChefHat, ArrowLeft, ExternalLink } from "lucide-react";

interface ResearchProduct {
  name: string;
  url: string;
}

interface LastExperience {
  client: string;
  description: string;
  achievement: string;
}

export default function EditProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    summary: "",
    experience_years: 0,
    availability: "inmediata",
    hourly_rate: "",
    location: "",
  });

  const [specialties, setSpecialties] = useState<string[]>([]);
  const [specialty, setSpecialty] = useState("");
  const [researchProducts, setResearchProducts] = useState<ResearchProduct[]>([]);
  const [lastExperience, setLastExperience] = useState<LastExperience>({
    client: "",
    description: "",
    achievement: "",
  });

  const update = (field: string, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const addSpecialty = () => {
    const s = specialty.trim();
    if (s && !specialties.includes(s)) {
      setSpecialties((prev) => [...prev, s]);
      setSpecialty("");
    }
  };

  useEffect(() => {
    if (!params.id) return;
    getProfessionalProfile(Number(params.id))
      .then((profile) => {
        setForm({
          name: profile.name || "",
          email: profile.email || "",
          summary: profile.summary || "",
          experience_years: profile.experience_years || 0,
          availability: profile.availability || "inmediata",
          hourly_rate: profile.hourly_rate || "",
          location: profile.location || "",
        });
        setSpecialties(profile.specialties || []);
        setResearchProducts(
          profile.research_products && profile.research_products.length > 0
            ? profile.research_products
            : [{ name: "", url: "" }]
        );
        if (profile.last_experience) {
          setLastExperience(profile.last_experience);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const validResearch = researchProducts.filter((p) => p.name.trim());
      const hasLastExp = lastExperience.client.trim() || lastExperience.description.trim();

      await updateProfessionalProfile(Number(params.id), {
        ...form,
        specialties,
        research_products: validResearch,
        last_experience: hasLastExp ? lastExperience : null,
      });
      router.push(`/profile/${params.id}`);
    } catch (err: any) {
      setError(err.message || "Error al actualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <a href={`/profile/${params.id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver al perfil
          </a>
          <h1 className="text-2xl font-bold text-white mb-2">Editar perfil</h1>
          <p className="text-slate-400 text-sm">Actualiza tu informacion profesional</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-8 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm" role="alert">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Nombre completo</label>
            <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} required
              className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Correo electronico</label>
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Especialidades</label>
            <div className="flex gap-2">
              <input type="text" value={specialty} onChange={(e) => setSpecialty(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialty())}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm text-white placeholder:text-slate-500"
                placeholder="Agregar especialidad..."
              />
              <button type="button" onClick={addSpecialty}
                className="px-3 py-3 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 transition-colors border border-slate-700">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {specialties.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {specialties.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm rounded-lg font-medium">
                    {s}
                    <button type="button" onClick={() => setSpecialties((prev) => prev.filter((x) => x !== s))} className="hover:text-emerald-300 ml-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Anos de experiencia</label>
              <input type="number" min={0} max={60} value={form.experience_years}
                onChange={(e) => update("experience_years", parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Disponibilidad</label>
              <select value={form.availability} onChange={(e) => update("availability", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm text-white"
              >
                <option value="inmediata">Inmediata</option>
                <option value="1-2 semanas">En 1-2 semanas</option>
                <option value="1 mes">En un mes</option>
                <option value="a coordinar">A coordinar</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Tarifa por hora (USD)</label>
              <input type="text" value={form.hourly_rate} onChange={(e) => update("hourly_rate", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm text-white placeholder:text-slate-500"
                placeholder="Ej: 50"
              />
              <p className="text-xs text-slate-500 mt-1">En dolares USD por hora</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Ubicacion</label>
              <input type="text" value={form.location} onChange={(e) => update("location", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm text-white placeholder:text-slate-500"
                placeholder="Ej: Ciudad de Mexico"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Resumen de experiencia</label>
            <textarea value={form.summary} onChange={(e) => update("summary", e.target.value)} rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-y text-sm text-white placeholder:text-slate-500"
            />
          </div>

          {/* Research Products */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Productos de investigacion / desarrollo de producto
            </label>
            <p className="text-xs text-slate-500 mb-3">Maximo 3 productos. Incluye el nombre y un enlace.</p>
            <div className="space-y-3">
              {researchProducts.map((product, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <input
                      placeholder="Nombre del producto/proyecto"
                      value={product.name}
                      onChange={(e) => {
                        const updated = [...researchProducts];
                        updated[idx] = { ...updated[idx], name: e.target.value };
                        setResearchProducts(updated);
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm text-white placeholder:text-slate-500"
                    />
                    <input
                      type="url"
                      placeholder="https://..."
                      value={product.url}
                      onChange={(e) => {
                        const updated = [...researchProducts];
                        updated[idx] = { ...updated[idx], url: e.target.value };
                        setResearchProducts(updated);
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm text-white placeholder:text-slate-500"
                    />
                  </div>
                  {researchProducts.length > 1 && (
                    <button type="button" onClick={() => setResearchProducts(researchProducts.filter((_, i) => i !== idx))}
                      className="mt-1 p-2 text-slate-500 hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {researchProducts.length < 3 && (
              <button type="button" onClick={() => setResearchProducts([...researchProducts, { name: "", url: "" }])}
                className="mt-2 text-sm text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1">
                <Plus className="w-4 h-4" /> Agregar producto
              </button>
            )}
          </div>

          {/* Last Work Experience */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Ultima experiencia de trabajo
            </label>
            <p className="text-xs text-slate-500 mb-3">Describe tu ultimo proyecto o experiencia laboral relevante.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Cliente</label>
                <input
                  placeholder="Nombre del cliente o empresa"
                  value={lastExperience.client}
                  onChange={(e) => setLastExperience({ ...lastExperience, client: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm text-white placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Que hizo (max. 150 caracteres)</label>
                <div className="relative">
                  <textarea
                    placeholder="Describe que hiciste en este proyecto..."
                    value={lastExperience.description}
                    onChange={(e) => setLastExperience({ ...lastExperience, description: e.target.value.slice(0, 150) })}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none text-sm text-white placeholder:text-slate-500"
                  />
                  <span className={`absolute bottom-2 right-3 text-xs ${lastExperience.description.length >= 140 ? "text-amber-400" : "text-slate-600"}`}>
                    {lastExperience.description.length}/150
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Que logro (max. 150 caracteres)</label>
                <div className="relative">
                  <textarea
                    placeholder="Cual fue el resultado o logro principal..."
                    value={lastExperience.achievement}
                    onChange={(e) => setLastExperience({ ...lastExperience, achievement: e.target.value.slice(0, 150) })}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none text-sm text-white placeholder:text-slate-500"
                  />
                  <span className={`absolute bottom-2 right-3 text-xs ${lastExperience.achievement.length >= 140 ? "text-amber-400" : "text-slate-600"}`}>
                    {lastExperience.achievement.length}/150
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-3 px-4 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-500 focus:ring-4 focus:ring-emerald-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
            ) : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}
