"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAuthToken, getMyProfessionalProfile } from "@/lib/api";
import { LogOut, User, ChefHat } from "lucide-react";

interface UserInfo {
  id: number;
  role: string;
  professionalId: number | null;
}

function parseToken(): UserInfo | null {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("foodtalent_role") : null;
    return { id: parseInt(payload.sub), role: storedRole || payload.role || "profesional", professionalId: null };
  } catch {
    return null;
  }
}

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const info = parseToken();
    if (info) {
      getMyProfessionalProfile()
        .then((prof) => setUser({ ...info, professionalId: prof.id }))
        .catch(() => setUser(info));
    } else {
      setUser(null);
    }
  }, [pathname]);

  if (pathname === "/") return null;

  const handleLogout = () => {
    localStorage.removeItem("foodtalent_token");
    localStorage.removeItem("foodtalent_role");
    setUser(null);
    router.push("/");
  };

  const profileId = user?.professionalId || user?.id;

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <a
            href="/"
            className="flex items-center gap-2.5 text-lg font-bold text-white"
          >
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <ChefHat className="w-4.5 h-4.5 text-white" />
            </div>
            FoodTalent
          </a>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <a
                  href={`/profile/${profileId}/edit`}
                  className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm font-medium transition-colors"
                >
                  <User className="w-4 h-4" />
                  Mi perfil
                </a>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Salir
                </button>
              </>
            ) : (
              <>
                <a
                  href="/login"
                  className="text-slate-300 hover:text-white text-sm font-medium transition-colors"
                >
                  Iniciar sesion
                </a>
                <a
                  href="/register"
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-500 transition-colors"
                >
                  Soy experto
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
