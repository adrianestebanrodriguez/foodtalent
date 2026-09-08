"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { LogOut, User, ChefHat, Shield } from "lucide-react";

interface UserInfo {
  professionalId: string | null;
  isSuperuser: boolean;
}

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const profile = useQuery(
    api.professionals.myProfile,
    isAuthenticated ? {} : "skip",
  );
  const myProfessional = useQuery(
    api.professionals.getMyProfessional,
    isAuthenticated ? {} : "skip",
  );
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && profile !== undefined) {
      setUser({
        professionalId: myProfessional ? String(myProfessional._id) : null,
        isSuperuser: profile?.isSuperuser === true,
      });
    } else if (!isAuthenticated) {
      setUser(null);
    }
  }, [pathname, isAuthenticated, isLoading, profile, myProfessional]);

  if (pathname === "/") return null;

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    router.push("/");
  };

  const profileId = user?.professionalId;

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
                {user.isSuperuser && (
                  <a
                    href="/admin"
                    className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200 text-sm font-medium transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    Administracion
                  </a>
                )}
                {profileId && (
                  <a
                    href={`/profile/${profileId}/edit`}
                    className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm font-medium transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Mi perfil
                  </a>
                )}
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
