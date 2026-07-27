"use client";

import { useState } from "react";
import { register, createProfessionalProfile } from "@/lib/api";
import { Loader2, Plus, X, ChefHat, ArrowRight, CheckCircle, ExternalLink } from "lucide-react";

const SECTORES = ["Carnicos", "Lacteos", "Bebidas", "Panificacion", "Snacks", "Otro"];
const CATEGORIAS = ["Formulacion", "Procesos", "Regulatorio", "Productividad", "Planta"];

interface ResearchProduct {
  name: string;
  url: string;
}

interface LastExperience {
  client: string;
  description: string;
  achievement: string;
}

export default function RegisterPage() {
  const [paso, setPaso] = useState<"cuenta" | "perfil" | "listo">("cuenta");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Account fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // Profile fields
  const [sectores, setSectores] = useState<string[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [anosExperiencia, setAnosExperiencia] = useState(0);
  const [disponibilidad, setDisponibilidad] = useState("inmediata");
  const [resumenExperiencia, setResumenExperiencia] = useState("");
  const [tarifa, setTarifa] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  // Research products (max 3)
  const [researchProducts, setResearchProducts] = useState<ResearchProduct[]>([
    { name: "", url: "" },
  ]);

  // Last experience
  const [lastExperience, setLastExperience] = useState<LastExperience>({
    client: "",
    description: "",
    achievement: "",
  });

  const toggle = (lista: string[], setLista: (v: string[]) => void, item: string) => {
    setLista(lista.includes(item) ? lista.filter((i) => i !== item) : [...lista, item]);
  };

  const handleCrearCuenta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) {
      setError("Debes aceptar los Terminos y Condiciones para continuar.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const resp = await register(email, password, "profesional", fullName);
      localStorage.setItem("foodtalent_token", resp.access_token);
      if (resp.role) localStorage.setItem("foodtalent_role", resp.role);
      setPaso("perfil");
    } catch (err: any) {
      setError(err.message || "No pudimos crear tu cuenta. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleCrearPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumenExperiencia.trim()) {
      setError("Cuentanos tu experiencia para completar tu perfil.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const validResearch = researchProducts.filter((p) => p.name.trim());
      const hasLastExp = lastExperience.client.trim() || lastExperience.description.trim();

      await createProfessionalProfile({
        name: fullName,
        email,
        specialties: [...sectores, ...categorias],
        experience_years: anosExperiencia,
        availability: disponibilidad,
        hourly_rate: tarifa,
        location: ubicacion,
        whatsapp,
        summary: resumenExperiencia,
        research_products: validResearch,
        last_experience: hasLastExp ? lastExperience : null,
      });
      setPaso("listo");
    } catch (err: any) {
      setError(err.message || "Algo no salio bien guardando tu perfil.");
    } finally {
      setLoading(false);
    }
  };

  if (paso === "listo") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Perfil creado</h1>
            <p className="text-slate-400 mb-6 text-sm">
              Tu perfil ya esta listo y disponible para empresas que buscan tu experiencia.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 py-3 px-6 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors text-sm"
            >
              Ir al inicio
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo + Header */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2.5 text-xl font-bold text-white mb-6">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            FoodTalent
          </a>
          <h1 className="text-2xl font-bold text-white mb-2">Crea tu perfil de experto</h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Empresas de alimentos buscan justo tu experiencia. Entre mas completo este tu perfil, mejor calidad de match recibiras.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm" role="alert">
            {error}
          </div>
        )}

        {paso === "cuenta" && (
          <form onSubmit={handleCrearCuenta} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Nombre completo</label>
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm text-white placeholder:text-slate-500"
                placeholder="Ej: Maria Garcia" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Correo electronico</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm text-white placeholder:text-slate-500"
                placeholder="tu@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Contrasena</label>
              <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm text-white placeholder:text-slate-500"
                placeholder="Minimo 8 caracteres" />
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" id="accept-terms" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500/20 focus:ring-2" />
              <label htmlFor="accept-terms" className="text-sm text-slate-400 leading-relaxed">
                Acepto los{" "}
                <a href="/terminos" target="_blank" className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2">
                  Terminos y Condiciones
                </a>{" "}
                y la Politica de Tratamiento de Datos Personales de FoodTalent.
              </label>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando cuenta...</> : "Continuar"}
            </button>
          </form>
        )}

        {paso === "perfil" && (
          <form onSubmit={handleCrearPerfil} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-8 space-y-6">

            {/* Sectores */}
            <fieldset>
              <legend className="text-sm font-medium text-slate-300 mb-2">Sectores en los que trabajas</legend>
              <div className="flex flex-wrap gap-2">
                {SECTORES.map((s) => (
                  <button type="button" key={s} onClick={() => toggle(sectores, setSectores, s)}
                    aria-pressed={sectores.includes(s)}
                    className={`px-3 py-1.5 rounded-lg text-sm border font-medium transition-all ${
                      sectores.includes(s)
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                        : "border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}>{s}</button>
                ))}
              </div>
            </fieldset>

            {/* Categorias */}
            <fieldset>
              <legend className="text-sm font-medium text-slate-300 mb-2">Areas de experiencia</legend>
              <div className="flex flex-wrap gap-2">
                {CATEGORIAS.map((c) => (
                  <button type="button" key={c} onClick={() => toggle(categorias, setCategorias, c)}
                    aria-pressed={categorias.includes(c)}
                    className={`px-3 py-1.5 rounded-lg text-sm border font-medium transition-all ${
                      categorias.includes(c)
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                        : "border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}>{c}</button>
                ))}
              </div>
            </fieldset>

            {/* Experience + Availability */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Anos de experiencia</label>
                <input type="number" min={0} value={anosExperiencia} onChange={(e) => setAnosExperiencia(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Disponibilidad</label>
                <select value={disponibilidad} onChange={(e) => setDisponibilidad(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm text-white">
                  <option value="inmediata">Inmediata</option>
                  <option value="1-2 semanas">En 1-2 semanas</option>
                  <option value="1 mes">En un mes</option>
                  <option value="a coordinar">A coordinar</option>
                </select>
              </div>
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Numero de WhatsApp</label>
              <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm text-white placeholder:text-slate-500"
                placeholder="Ej: +52 55 1234 5678" />
              <p className="text-xs text-slate-500 mt-1">Las empresas te contactaran por este numero</p>
            </div>

            {/* Tarifa + Ubicacion */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Tarifa por hora (USD)</label>
                <input type="text" value={tarifa} onChange={(e) => setTarifa(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm text-white placeholder:text-slate-500"
                  placeholder="Ej: 50" />
                <p className="text-xs text-slate-500 mt-1">En dolares USD por hora</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Ubicacion</label>
                <input type="text" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm text-white placeholder:text-slate-500"
                  placeholder="Ej: Ciudad de Mexico" />
              </div>
            </div>

            {/* Resumen experiencia */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Cuentanos tu experiencia</label>
              <p className="text-xs text-slate-500 mb-2">Escribe como si se lo explicaras a un cliente que no te conoce. Que problemas has resuelto y en que sectores.</p>
              <textarea value={resumenExperiencia} onChange={(e) => setResumenExperiencia(e.target.value)} rows={4} required
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-y text-sm text-white placeholder:text-slate-500" />
            </div>

            {/* Research Products */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Productos de investigacion o desarrollo de producto
              </label>
              <p className="text-xs text-slate-500 mb-3">Maximo 3 productos. Incluye el nombre y un enlace para ver el proyecto.</p>
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

            <button type="submit" disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando perfil...</> : "Crear mi perfil"}
            </button>

            <p className="text-center text-sm text-slate-500">
              Ya tienes cuenta?{" "}
              <a href="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold">Iniciar sesion</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
