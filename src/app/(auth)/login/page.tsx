"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState("No autenticado");
    const router = useRouter();
    const { login } = useAuth();

    const onLogin = async () => {
        try {
            setStatus("Autenticando...");
            await login(username, password);
            setStatus("Autenticado");
            router.push("/");
        } catch (error) {
            console.error(error);
            setStatus("Error al autenticar");
        }
    };

    return (
        <div className="min-h-screen bg-cloud flex items-center justify-center px-4">
            <div className="grid w-full max-w-4xl overflow-hidden rounded-[32px] glass-panel md:grid-cols-[1.1fr_0.9fr]">
                <div
                    className="relative hidden overflow-hidden md:flex flex-col justify-between p-10 text-white"
                    style={{
                        backgroundImage: "url(/login-hero.png)",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-navy/70 via-slate-900/55 to-ink/45" />
                    <div className="relative z-10">
                        <p className="text-xs uppercase tracking-[0.25em] text-white/70">Enerfluid Apps</p>
                        <p className="text-lg font-semibold">Portal interno</p>
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-semibold leading-tight">
                            Accede al portal de aplicaciones internas.
                        </h2>
                        <p className="mt-3 text-sm text-white/70">
                            Usa tu usuario autorizado para entrar a Inventario, CRM y Usuarios.
                        </p>
                    </div>
                </div>
                <div className="p-8 md:p-10">
                    <div className="flex items-center gap-3">
                        <img src="/enerfluid-logo.png" alt="Enerfluid" className="h-9" />
                    </div>
                    <div className="mt-5 space-y-2">
                        <h1 className="text-2xl font-semibold text-slate-800">Bienvenido</h1>
                        <p className="text-sm text-slate-500">Inicia sesion para acceder al panel.</p>
                    </div>
                    <div className="mt-6 space-y-4">
                        <label className="block text-sm text-slate-600">
                            Usuario
                            <Input
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                placeholder="usuario"
                            />
                        </label>
                        <label className="block text-sm text-slate-600">
                            Contrasena
                            <Input
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="********"
                            />
                        </label>
                        <Button className="w-full" onClick={onLogin}>
                            Ingresar
                        </Button>
                        <div className="flex items-center justify-center">
                            <Badge variant="outline">{status}</Badge>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
