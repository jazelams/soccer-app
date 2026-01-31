'use client';
import { useState } from 'react';
import api from '../services/api';
import { useRouter } from 'next/navigation';
import { ShieldCheck, User, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            console.log("Intentando login con:", username); // Debug
            const res = await api.post('/auth/login', { username, password });

            console.log("Login exitoso:", res.data);
            if (res.data.token) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user)); // Guardar info usuario

                // Forzar recarga o navegación
                router.refresh();
                router.push('/dashboard');
            } else {
                setError('El servidor no devolvió un token válido.');
            }
        } catch (err: any) {
            console.error("Login Error:", err);
            if (err.response) {
                // El servidor respondió con un estado de error (4xx, 5xx)
                if (err.response.status === 401) {
                    setError('Usuario o contraseña incorrectos.');
                } else {
                    setError(`Error del servidor: ${err.response.status}`);
                }
            } else if (err.request) {
                // La petición se hizo pero no hubo respuesta
                setError('No se pudo conectar con el servidor. Verifique que el backend esté corriendo en el puerto 3001.');
            } else {
                setError('Ocurrió un error inesperado.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-black to-neutral-950">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-900/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-red-950/20 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-md relative z-10 font-sans">

                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-neutral-800 to-black border border-neutral-800 shadow-2xl shadow-red-900/20 mb-6">
                        <ShieldCheck className="w-10 h-10 text-red-800" />
                    </div>
                    <h1 className="text-4xl font-serif font-bold text-white mb-2 tracking-wide">
                        LIGA FC
                    </h1>
                    <p className="text-neutral-500 uppercase tracking-widest text-xs font-bold">
                        Portal Administrativo
                    </p>
                </div>

                <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800 shadow-xl p-8 rounded-2xl border-t border-red-900/30">

                    {error && (
                        <div className="mb-6 bg-red-950/30 border border-red-900/50 text-red-200 p-4 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-neutral-500 ml-1">Credenciales</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-3.5 w-5 h-5 text-neutral-500 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-neutral-950/50 border border-neutral-800 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/50 transition-all placeholder:text-neutral-700"
                                    placeholder="Usuario"
                                    required
                                />
                            </div>
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-neutral-500 group-focus-within:text-red-500 transition-colors" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-neutral-950/50 border border-neutral-800 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/50 transition-all placeholder:text-neutral-700"
                                placeholder="Contraseña"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-red-900 text-white hover:bg-red-800 transition-all duration-300 shadow-lg shadow-red-900/20 active:scale-95 border border-red-800 py-4 rounded-xl font-bold uppercase tracking-wider text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Accediendo...
                                </span>
                            ) : 'Iniciar Sesión'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-neutral-600 text-xs mt-8">
                    Sistema Seguro v2.0 • Prohibido el acceso no autorizado
                </p>
            </div>
        </div>
    );
}
