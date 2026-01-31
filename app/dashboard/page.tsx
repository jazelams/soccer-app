'use client';
import { useState, useEffect } from 'react';
import api from '../services/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trophy, ChevronRight, AlertTriangle, Calendar, Users, Plus, X } from 'lucide-react';
import { clsx } from 'clsx';

const DAYS_MAP: Record<string, string> = {
    MONDAY: 'LUNES',
    TUESDAY: 'MARTES',
    WEDNESDAY: 'MIÉRCOLES',
    THURSDAY: 'JUEVES',
    FRIDAY: 'VIERNES',
    SATURDAY: 'SÁBADO',
    SUNDAY: 'DOMINGO'
};

const STATUS_MAP: Record<string, string> = {
    ACTIVE: 'ACTIVO',
    FINISHED: 'FINALIZADO'
};

export default function DashboardPage() {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newTournamentForm, setNewTournamentForm] = useState({
        name: '',
        day: 'MONDAY',
        startDate: new Date().toISOString().split('T')[0]
    });

    const router = useRouter();

    const fetchTournaments = () => {
        setLoading(true);
        api.get('/tournaments')
            .then(res => setTournaments(res.data))
            .catch(err => {
                console.error(err);
                if (err.response?.status === 401) router.push('/login');
                else {
                    const message = err.response?.data?.details || err.response?.data?.error || 'Error de conexión con el servidor.';
                    setError(message);
                }
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        fetchTournaments();
    }, []);

    const [viewDatesId, setViewDatesId] = useState<number | null>(null);

    const calculateMatchDates = (startDate: string) => {
        if (!startDate) return [];
        const dates = [];
        const start = new Date(startDate);
        // Fix timezone issue: Treating UTC components as Local
        const localStart = new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());

        for (let i = 0; i < 10; i++) {
            const date = new Date(localStart);
            date.setDate(localStart.getDate() + (i * 7));
            dates.push(date);
        }
        return dates;
    };

    const handleCreateTournament = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await api.post('/tournaments', newTournamentForm);
            setShowCreateModal(false);
            setNewTournamentForm({ name: '', day: 'MONDAY', startDate: new Date().toISOString().split('T')[0] });
            fetchTournaments(); // Refresh list
            alert("Torneo creado exitosamente");
        } catch (error) {
            console.error(error);
            alert("Error al crear torneo");
        } finally {
            setCreating(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-neutral-800 border-t-red-800 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-neutral-700" />
                </div>
            </div>
        </div>
    );

    return (
        <div>
            {/* Hero Header */}
            <div className="mb-12 border-b border-white/5 pb-8 flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <h1 className="text-5xl font-serif font-black text-white mb-2 tracking-tight">
                        Torneos <span className="text-red-800">Activos</span>
                    </h1>
                    <p className="text-neutral-400 font-light text-lg">
                        Seleccione un torneo para gestionar equipos y finanzas.
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-red-900 hover:bg-red-800 text-white px-6 py-3 rounded-xl flex items-center shadow-lg shadow-red-900/20 transition-all group"
                >
                    <Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Nuevo Torneo
                </button>
            </div>

            {error ? (
                <div className="bg-red-950/20 border border-red-900/50 p-6 rounded-xl flex items-center text-red-200">
                    <AlertTriangle className="w-6 h-6 mr-4 text-red-500" />
                    {error}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {tournaments.length === 0 ? (
                        <div className="col-span-3 text-center py-20 bg-neutral-900/30 rounded-3xl border border-dashed border-neutral-800">
                            <p className="text-neutral-500">No hay torneos registrados.</p>
                        </div>
                    ) : (
                        tournaments.map((t: any) => (
                            <div key={t.id} className="group relative">
                                {/* Glow Effect */}
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-900/50 to-neutral-800/50 rounded-2xl blur opacity-20 group-hover:opacity-100 transition duration-500"></div>

                                {/* Card Content */}
                                <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:bg-neutral-800/80 transition-all duration-300 h-full flex flex-col">

                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex gap-2">
                                            <span className="px-3 py-1 rounded-full bg-neutral-950 border border-neutral-800 text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                                <Calendar className="w-3 h-3" />
                                                {DAYS_MAP[t.day] || t.day}
                                            </span>
                                            <span className={clsx(
                                                "px-2 py-1 rounded text-[10px] font-bold border flex items-center",
                                                t.status === 'ACTIVE' ? "border-emerald-900 text-emerald-500 bg-emerald-900/10" : "border-neutral-700 text-neutral-500 bg-neutral-900"
                                            )}>
                                                {STATUS_MAP[t.status] || t.status}
                                            </span>
                                        </div>
                                        <Trophy className="w-6 h-6 text-red-900 group-hover:text-red-600 transition-colors" />
                                    </div>

                                    <h3 className="text-2xl font-serif font-bold text-white mb-2 group-hover:text-red-500 transition-colors">
                                        {t.name}
                                    </h3>

                                    <div className="mb-4 flex items-center text-neutral-500 text-sm font-medium">
                                        <Users className="w-4 h-4 mr-2" />
                                        {t._count.teams} Equipos registrados
                                    </div>

                                    {/* Dates Toggle View */}
                                    {viewDatesId === t.id && (
                                        <div className="mb-6 bg-neutral-950/50 p-4 rounded-xl border border-white/5 animate-in fade-in slide-in-from-top-2">
                                            <h4 className="text-xs font-bold text-neutral-400 uppercase mb-3 text-center">Calendario - Inicio: {new Date(new Date(t.startDate).getUTCFullYear(), new Date(t.startDate).getUTCMonth(), new Date(t.startDate).getUTCDate()).toLocaleDateString()}</h4>
                                            <div className="space-y-1">
                                                {calculateMatchDates(t.startDate).map((date, i) => (
                                                    <div key={i} className="flex justify-between text-xs border-b border-white/5 last:border-0 py-1">
                                                        <span className="text-neutral-500">Jornada {i + 1}</span>
                                                        <span className="text-white font-mono">{date.toLocaleDateString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                                        <button
                                            onClick={() => setViewDatesId(viewDatesId === t.id ? null : t.id)}
                                            className="text-xs font-bold text-neutral-500 hover:text-white transition-colors uppercase tracking-wider"
                                        >
                                            {viewDatesId === t.id ? 'Ocultar' : 'Calendario'}
                                        </button>
                                        <Link
                                            href={`/tournaments/${t.id}`}
                                            className="flex items-center gap-2 text-sm font-bold text-white hover:text-red-500 transition-colors group-hover:translate-x-1 duration-300"
                                        >
                                            ADMINISTRAR
                                            <ChevronRight className="w-4 h-4 text-red-800" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Create Tournament Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-neutral-900 border border-neutral-700 w-full max-w-lg rounded-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white"><X className="w-6 h-6" /></button>
                        <div className="p-8 border-b border-neutral-800">
                            <h2 className="text-2xl font-light text-white">Nuevo Torneo</h2>
                            <p className="text-neutral-500 text-sm mt-1">Configure los datos generales del torneo.</p>
                        </div>
                        <form onSubmit={handleCreateTournament} className="p-8 space-y-6">
                            <div>
                                <label className="block text-xs uppercase font-medium text-neutral-400 mb-2">Nombre del Torneo</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej. Torneo Lunes Nocturno"
                                    className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-red-900 focus:ring-1 focus:ring-red-900 outline-none transition-colors"
                                    value={newTournamentForm.name}
                                    onChange={e => setNewTournamentForm({ ...newTournamentForm, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs uppercase font-medium text-neutral-400 mb-2">Día de Juego</label>
                                    <select
                                        className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-red-900 outline-none"
                                        value={newTournamentForm.day}
                                        onChange={e => setNewTournamentForm({ ...newTournamentForm, day: e.target.value })}
                                    >
                                        {Object.entries(DAYS_MAP).map(([key, value]) => (
                                            <option key={key} value={key}>{value}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs uppercase font-medium text-neutral-400 mb-2">Fecha de Inicio</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-red-900 outline-none"
                                        value={newTournamentForm.startDate}
                                        onChange={e => setNewTournamentForm({ ...newTournamentForm, startDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors">Cancelar</button>
                                <button type="submit" disabled={creating} className="flex-1 py-3 bg-red-900 hover:bg-red-800 text-white rounded-xl shadow-lg shadow-red-900/20 transition-colors">
                                    {creating ? 'Creando...' : 'Crear Torneo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
