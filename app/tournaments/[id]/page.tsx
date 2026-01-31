'use client';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, UserPlus, FileText, X, Check, Pencil, Table, LayoutGrid, Settings, Plus, Calendar, Trash2, Camera, AlertCircle } from 'lucide-react';
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

export default function TournamentPage() {
    const { id } = useParams();
    const router = useRouter();
    const [tournament, setTournament] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // View Mode
    const [viewMode, setViewMode] = useState<'LIST' | 'TABLE'>('LIST');

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [creating, setCreating] = useState(false);
    const [discountType, setDiscountType] = useState<'AMOUNT' | 'PERCENT'>('AMOUNT');
    const [editingTeamId, setEditingTeamId] = useState<number | null>(null);

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
    const [paymentData, setPaymentData] = useState<{
        amount: string;
        method: string;
        transferRef: string;
        transferDate: string;
        matchday: string; // "1" to "10" or ""
        notes: string;
    }>({
        amount: '',
        method: 'CASH',
        transferRef: '',
        transferDate: new Date().toISOString().split('T')[0],
        matchday: '',
        notes: ''
    });

    // Forms
    const [formData, setFormData] = useState({
        name: '',
        registrationFee: '',
        arbitrationFee: '',
        discountAmount: ''
    });

    const [tournamentSettings, setTournamentSettings] = useState({
        startDate: '',
        status: 'ACTIVE'
    });

    const [newTournamentForm, setNewTournamentForm] = useState({
        name: '',
        day: 'MONDAY',
        startDate: new Date().toISOString().split('T')[0]
    });

    const fetchTournament = () => {
        setLoading(true);
        api.get(`/tournaments/${id}`)
            .then(res => {
                setTournament(res.data);
                if (res.data.startDate) {
                    setTournamentSettings({
                        startDate: new Date(res.data.startDate).toISOString().split('T')[0],
                        status: res.data.status
                    });
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchTournament();
    }, [id]);

    const calculateTeamFinances = (team: any) => {
        const registrationFee = Number(team.registrationFee) || 0;
        const arbitrationFee = Number(team.arbitrationFee) || 0;
        const discountAmount = Number(team.discountAmount) || 0;

        const totalCost = registrationFee + arbitrationFee;
        const totalPayable = totalCost - discountAmount;

        // Total Paid (All payments)
        const totalPaid = team.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;

        // General Payments (No matchday) - "Anticipo"
        const generalPayments = team.payments?.filter((p: any) => !p.matchday)
            .reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;

        const balance = totalPayable - totalPaid;

        return { totalCost, discountAmount, totalPayable, totalPaid, generalPayments, balance };
    };

    const calculateMatchDates = (startDateStr: string) => {
        if (!startDateStr) return Array(10).fill(null);
        const start = new Date(startDateStr);
        // Fix timezone issue: Treating UTC components as Local
        const localStart = new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());

        const dates = [];
        for (let i = 0; i < 10; i++) {
            const d = new Date(localStart);
            d.setDate(localStart.getDate() + (i * 7));
            dates.push(d);
        }
        return dates;
    };

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        const regFee = Number(formData.registrationFee) || 0;
        const arbFee = Number(formData.arbitrationFee) || 0;
        const rawDiscount = Number(formData.discountAmount) || 0;

        let finalDiscount = rawDiscount;
        if (discountType === 'PERCENT') {
            const totalBase = regFee + arbFee;
            finalDiscount = totalBase * (rawDiscount / 100);
        }

        try {
            await api.post('/teams', {
                ...formData,
                tournamentId: Number(id),
                registrationFee: regFee,
                arbitrationFee: arbFee,
                discountAmount: finalDiscount
            });
            setShowModal(false);
            setFormData({ name: '', registrationFee: '', arbitrationFee: '', discountAmount: '' });
            setDiscountType('AMOUNT');
            fetchTournament();
        } catch (error) {
            console.error("Error creating team:", error);
            alert("Error al registrar el equipo.");
        } finally {
            setCreating(false);
        }
    };

    const handleEditTeam = (team: any) => {
        setEditingTeamId(team.id);
        setFormData({
            name: team.name,
            registrationFee: team.registrationFee,
            arbitrationFee: team.arbitrationFee,
            discountAmount: team.discountAmount
        });
        setDiscountType('AMOUNT');
        setShowEditModal(true);
    };

    const handleUpdateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTeamId) return;
        setCreating(true);

        const regFee = Number(formData.registrationFee) || 0;
        const arbFee = Number(formData.arbitrationFee) || 0;
        const rawDiscount = Number(formData.discountAmount) || 0;

        let finalDiscount = rawDiscount;
        if (discountType === 'PERCENT') {
            const totalBase = regFee + arbFee;
            finalDiscount = totalBase * (rawDiscount / 100);
        }

        try {
            await api.put(`/teams/${editingTeamId}`, {
                name: formData.name,
                registrationFee: regFee,
                arbitrationFee: arbFee,
                discountAmount: finalDiscount
            });
            setShowEditModal(false);
            setEditingTeamId(null);
            setFormData({ name: '', registrationFee: '', arbitrationFee: '', discountAmount: '' });
            alert("Equipo actualizado exitosamente");
            fetchTournament();
        } catch (error) {
            console.error("Error updating team:", error);
            alert("Error al actualizar el equipo.");
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteTeam = async (teamId: number) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar este equipo? Se borrarán todos sus datos y pagos.")) {
            return;
        }

        try {
            await api.delete(`/teams/${teamId}`);
            alert("Equipo eliminado exitosamente");
            fetchTournament();
        } catch (error) {
            console.error(error);
            alert("Error al eliminar el equipo.");
        }
    };

    const handleUpdateTournament = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await api.put(`/tournaments/${id}`, tournamentSettings);
            setShowSettingsModal(false);
            alert("Torneo actualizado");
            fetchTournament();
        } catch (error) {
            console.error(error);
            alert("Error al actualizar torneo");
        } finally {
            setCreating(false);
        }
    };

    const handleCreateTournament = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await api.post('/tournaments', newTournamentForm);
            setShowCreateModal(false);
            alert("Torneo creado exitosamente");
            // Optional: Redirect to new tournament or just stay here?
            // Usually user wants to go there.
            // For now, reload or specific feedback.
            router.push('/dashboard');
        } catch (error) {
            console.error(error);
            alert("Error al crear torneo");
        } finally {
            setCreating(false);
        }
    };

    const handleRegisterPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTeamId) return;
        setCreating(true);

        try {
            await api.post('/payments', {
                teamId: selectedTeamId,
                amount: Number(paymentData.amount),
                method: paymentData.method,
                transferRef: paymentData.method === 'TRANSFER' ? paymentData.transferRef : undefined,
                transferDate: paymentData.method === 'TRANSFER' ? new Date(paymentData.transferDate).toISOString() : undefined,
                matchday: paymentData.matchday ? Number(paymentData.matchday) : undefined,
                notes: paymentData.notes
            });
            setShowPaymentModal(false);
            setPaymentData({ amount: '', method: 'CASH', transferRef: '', transferDate: new Date().toISOString().split('T')[0], matchday: '', notes: '' });
            alert("Pago registrado exitosamente");
            fetchTournament();
        } catch (error) {
            console.error(error);
            alert("Error al registrar pago");
        } finally {
            setCreating(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="w-12 h-12 border-4 border-neutral-800 border-t-red-800 rounded-full animate-spin"></div>
        </div>
    );

    if (!tournament) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mb-4 mx-auto">
                <AlertCircle className="w-8 h-8 text-neutral-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-400 mb-2">Torneo no encontrado</h2>
            <p className="text-neutral-600 mb-6 max-w-md mx-auto">No pudimos encontrar la información del torneo solicitado. Es posible que haya sido eliminado o el ID sea incorrecto.</p>
            <Link href="/dashboard" className="px-6 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors font-medium">
                Volver al Panel Principal
            </Link>
        </div>
    );

    const matchDates = calculateMatchDates(tournament.startDate);

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-white/5 pb-6 gap-4">
                <div>
                    <Link href="/dashboard" className="flex items-center text-neutral-500 hover:text-white mb-2 text-sm transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver al Panel
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-light text-white tracking-wide">
                            {tournament.name}
                        </h1>
                        <span className={clsx(
                            "text-xs px-2 py-1 rounded border",
                            tournament.status === 'ACTIVE' ? "border-emerald-900 text-emerald-500 bg-emerald-900/10" : "border-neutral-700 text-neutral-500 bg-neutral-900"
                        )}>
                            {STATUS_MAP[tournament.status] || tournament.status}
                        </span>
                    </div>

                    <p className="text-red-500 text-sm font-medium uppercase tracking-widest mt-1 flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {DAYS_MAP[tournament.day] || tournament.day} | Inicio: {new Date(new Date(tournament.startDate).getUTCFullYear(), new Date(tournament.startDate).getUTCMonth(), new Date(tournament.startDate).getUTCDate()).toLocaleDateString()}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="p-3 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl transition-colors"
                        title="Configuración del Torneo"
                    >
                        <Settings className="w-5 h-5" />
                    </button>

                    {/* Removed 'Create Tournament' button as per request to keep it in Dashboard */}

                    <div className="flex bg-neutral-900 rounded-xl p-1 border border-neutral-800">
                        <button
                            onClick={() => setViewMode('LIST')}
                            className={clsx(
                                "p-2 rounded-lg transition-all",
                                viewMode === 'LIST' ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-500 hover:text-white"
                            )}
                            title="Vista de Lista"
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('TABLE')}
                            className={clsx(
                                "p-2 rounded-lg transition-all",
                                viewMode === 'TABLE' ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-500 hover:text-white"
                            )}
                            title="Tabla General"
                        >
                            <Table className="w-5 h-5" />
                        </button>
                    </div>

                    <button
                        onClick={() => {
                            setFormData({ name: '', registrationFee: '', arbitrationFee: '', discountAmount: '' });
                            setShowModal(true);
                        }}
                        className="bg-red-900/10 border border-red-900 text-red-500 px-6 py-3 rounded-xl hover:bg-red-900 hover:text-white flex items-center transition-all font-medium text-sm tracking-wider uppercase group"
                    >
                        <UserPlus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline">Registrar Equipo</span>
                    </button>
                </div>
            </div>

            {/* Content Switcher */}
            {viewMode === 'LIST' ? (
                /* Teams List View */
                <div className="space-y-3">
                    {tournament.teams.length === 0 ? (
                        <div className="bg-neutral-900/50 p-16 rounded-2xl border border-dashed border-neutral-800 text-center">
                            <Users className="w-16 h-16 mx-auto mb-4 text-neutral-700" />
                            <h3 className="text-xl font-light text-neutral-400">Sin Equipos</h3>
                            <p className="text-neutral-600 mt-2">No hay equipos registrados en este torneo aún.</p>
                        </div>
                    ) : (
                        tournament.teams.map((team: any) => {
                            const finances = calculateTeamFinances(team);
                            const hasDebt = finances.balance > 0;
                            return (
                                <div key={team.id} className="group bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-between shadow-lg shadow-black/10 backdrop-blur-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-neutral-800/50 rounded-full flex items-center justify-center text-neutral-300 font-medium border border-white/10">
                                            {team.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-lg text-white tracking-wide group-hover:text-red-400 transition-colors">{team.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-neutral-400">ID: #{team.id}</span>
                                                <span className={clsx(
                                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shadow-sm",
                                                    hasDebt ? "bg-red-600 text-white border-red-700 shadow-[0_0_10px_rgba(220,38,38,0.4)]" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                )}>
                                                    {hasDebt ? 'ADEUDO' : 'AL CORRIENTE'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEditTeam(team)}
                                            className="p-2 text-neutral-500 hover:text-white transition-colors"
                                            title="Editar Info"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTeam(team.id)}
                                            className="p-2 text-neutral-500 hover:text-red-500 transition-colors"
                                            title="Eliminar Equipo"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <Link
                                            href={`/teams/${team.id}/statement`}
                                            className="p-2 text-neutral-500 hover:text-cyan-400 transition-colors"
                                            title="Ver Foto Estado de Cuenta"
                                        >
                                            <Camera className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setSelectedTeamId(team.id);
                                                setShowPaymentModal(true);
                                            }}
                                            className="bg-emerald-900/20 text-emerald-500 hover:bg-emerald-900 hover:text-white border border-emerald-900/50 px-4 py-2 rounded-lg text-xs font-medium uppercase tracking-wider transition-colors"
                                        >
                                            Abonar
                                        </button>
                                        <Link
                                            href={`/teams/${team.id}/statement`}
                                            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2 rounded-lg text-xs font-medium uppercase tracking-wider transition-colors border border-neutral-700"
                                        >
                                            Ver Estado
                                        </Link>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            ) : (
                /* General Table View */
                <div className="bg-neutral-900/60 border border-white/10 rounded-2xl overflow-hidden shadow-2xl overflow-x-auto backdrop-blur-md">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-950/80 text-neutral-400 text-xs uppercase tracking-wider font-semibold border-b border-white/10">
                                <th className="p-4 whitespace-nowrap sticky left-0 bg-neutral-950/90 z-20 border-r border-white/10 backdrop-blur-sm shadow-[4px_0_24px_rgba(0,0,0,0.5)]">Equipo</th>
                                <th className="p-4 text-center whitespace-nowrap border-r border-white/10">Saldo Inicial</th>
                                <th className="p-4 text-center whitespace-nowrap border-r border-white/10">Anticipo</th>
                                {matchDates.map((date, i) => (
                                    <th key={i} className="p-4 text-center whitespace-nowrap min-w-[80px]">
                                        <div className="flex flex-col">
                                            <span>J{i + 1}</span>
                                            <span className="text-[10px] opacity-50">{date ? date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' }) : '-'}</span>
                                        </div>
                                    </th>
                                ))}
                                <th className="p-4 text-center whitespace-nowrap border-r border-white/10 font-bold text-emerald-400">ACUMULADO</th>
                                <th className="p-4 text-right whitespace-nowrap bg-neutral-950/50 text-red-400">Pendiente</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {tournament.teams.map((team: any) => {
                                const finances = calculateTeamFinances(team);
                                return (
                                    <tr key={team.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4 font-medium text-white sticky left-0 bg-neutral-900/90 group-hover:bg-neutral-800/90 transition-colors border-r border-white/10 backdrop-blur-sm shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-10">
                                            {team.name}
                                        </td>
                                        <td className="p-4 text-center text-neutral-300 border-r border-white/10">
                                            ${finances.totalPayable.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-center text-emerald-400 font-medium border-r border-white/10">
                                            ${finances.generalPayments.toLocaleString()}
                                        </td>
                                        {[...Array(10)].map((_, i) => {
                                            const matchday = i + 1;
                                            // Find exact payment amount for this matchday
                                            const matchdayPaid = team.payments
                                                ?.filter((p: any) => p.matchday === matchday.toString() || p.matchday === matchday)
                                                .reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;

                                            return (
                                                <td key={i} className="p-2 text-center align-middle">
                                                    <div className={clsx(
                                                        "w-full h-8 flex items-center justify-center rounded text-[10px] font-bold border transition-all whitespace-nowrap px-1",
                                                        matchdayPaid > 0
                                                            ? "bg-emerald-900/30 text-emerald-400 border-emerald-900/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                                                            : "bg-neutral-900 text-neutral-600 border-dashed border-neutral-800"
                                                    )}>
                                                        {matchdayPaid > 0 ? `$${matchdayPaid.toLocaleString()}` : 'SIN ABONO'}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td className="p-4 text-center font-bold text-emerald-400 border-r border-white/10">
                                            ${finances.totalPaid.toLocaleString()}
                                        </td>
                                        <td className={clsx(
                                            "p-4 text-right font-bold bg-neutral-900/30",
                                            finances.balance > 0 ? "text-red-500" : "text-emerald-500"
                                        )}>
                                            ${finances.balance.toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-neutral-950/90 font-bold text-xs uppercase tracking-wider text-neutral-400 border-t-2 border-white/10">
                            <tr>
                                <td className="p-4 sticky left-0 bg-neutral-950/90 border-r border-white/10 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">TOTALES</td>
                                <td className="p-4 text-center">
                                    ${tournament.teams.reduce((acc: number, t: any) => acc + calculateTeamFinances(t).totalPayable, 0).toLocaleString()}
                                </td>
                                <td className="p-4 text-center text-emerald-500">
                                    ${tournament.teams.reduce((acc: number, t: any) => acc + calculateTeamFinances(t).generalPayments, 0).toLocaleString()}
                                </td>
                                {[...Array(10)].map((_, i) => {
                                    const matchday = i + 1;
                                    const dayTotal = tournament.teams.reduce((acc: number, t: any) => {
                                        const paid = t.payments?.filter((p: any) => p.matchday === matchday.toString() || p.matchday === matchday).reduce((s: number, p: any) => s + Number(p.amount), 0) || 0;
                                        return acc + paid;
                                    }, 0);
                                    return (
                                        <td key={i} className="p-4 text-center text-emerald-500 whitespace-nowrap">
                                            {dayTotal > 0 ? `$${dayTotal.toLocaleString()}` : '-'}
                                        </td>
                                    );
                                })}
                                <td className="p-4 text-center text-emerald-400 font-black border-r border-white/10">
                                    ${tournament.teams.reduce((acc: number, t: any) => acc + calculateTeamFinances(t).totalPaid, 0).toLocaleString()}
                                </td>
                                <td className="p-4 text-right text-red-500 bg-neutral-950/30">
                                    ${tournament.teams.reduce((acc: number, t: any) => acc + calculateTeamFinances(t).balance, 0).toLocaleString()}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                    {tournament.teams.length === 0 && (
                        <div className="p-12 text-center text-neutral-500">No hay datos para mostrar.</div>
                    )}
                </div>
            )}

            {/* Settings Modal */}
            {showSettingsModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-neutral-900 border border-neutral-700 w-full max-w-lg rounded-2xl shadow-2xl relative">
                        <button onClick={() => setShowSettingsModal(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white"><X className="w-6 h-6" /></button>
                        <div className="p-8 border-b border-neutral-800">
                            <h2 className="text-2xl font-light text-white">Configurar Torneo</h2>
                        </div>
                        <form onSubmit={handleUpdateTournament} className="p-8 space-y-6">
                            <div>
                                <label className="block text-xs uppercase font-medium text-neutral-400 mb-2">Fecha de Inicio</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white"
                                    value={tournamentSettings.startDate}
                                    onChange={e => setTournamentSettings({ ...tournamentSettings, startDate: e.target.value })}
                                />
                                <p className="text-xs text-neutral-600 mt-2">Esta fecha determinará las fechas de las 10 jornadas.</p>
                            </div>
                            <div>
                                <label className="block text-xs uppercase font-medium text-neutral-400 mb-2">Estado</label>
                                <select
                                    className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white"
                                    value={tournamentSettings.status}
                                    onChange={e => setTournamentSettings({ ...tournamentSettings, status: e.target.value })}
                                >
                                    <option value="ACTIVE">Activo</option>
                                    <option value="FINISHED">Finalizado</option>
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowSettingsModal(false)} className="flex-1 py-3 bg-neutral-800 text-neutral-300 rounded-xl">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-red-900 text-white rounded-xl">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Tournament Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-neutral-900 border border-neutral-700 w-full max-w-lg rounded-2xl shadow-2xl relative">
                        <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white"><X className="w-6 h-6" /></button>
                        <div className="p-8 border-b border-neutral-800">
                            <h2 className="text-2xl font-light text-white">Nuevo Torneo</h2>
                        </div>
                        <form onSubmit={handleCreateTournament} className="p-8 space-y-6">
                            <div>
                                <label className="block text-xs uppercase font-medium text-neutral-400 mb-2">Nombre</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white"
                                    value={newTournamentForm.name}
                                    onChange={e => setNewTournamentForm({ ...newTournamentForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase font-medium text-neutral-400 mb-2">Día de Juego</label>
                                <select
                                    className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white"
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
                                    className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white"
                                    value={newTournamentForm.startDate}
                                    onChange={e => setNewTournamentForm({ ...newTournamentForm, startDate: e.target.value })}
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-neutral-800 text-neutral-300 rounded-xl">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-red-900 text-white rounded-xl">Crear Torneo</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-neutral-900 border border-neutral-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="p-8 border-b border-neutral-800 bg-neutral-900">
                            <h2 className="text-2xl font-light text-white">Nuevo Equipo</h2>
                            <p className="text-neutral-500 text-sm">Ingrese los datos financieros base del equipo.</p>
                        </div>

                        <form onSubmit={handleCreateTeam} className="p-8 space-y-6 bg-neutral-900/50">
                            <div>
                                <label className="block text-xs uppercase font-medium text-neutral-400 mb-2">Nombre del Equipo</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-red-900 focus:ring-1 focus:ring-red-900 outline-none transition-colors"
                                    placeholder="Ej. Los Rayos FC"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase font-medium text-neutral-400 mb-2">Inscripción ($)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-red-900 focus:ring-1 focus:ring-red-900 outline-none transition-colors"
                                        value={formData.registrationFee}
                                        onChange={e => setFormData({ ...formData, registrationFee: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase font-medium text-neutral-400 mb-2">Arbitraje ($)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-red-900 focus:ring-1 focus:ring-red-900 outline-none transition-colors"
                                        placeholder="Total x 10 jornadas"
                                        value={formData.arbitrationFee}
                                        onChange={e => setFormData({ ...formData, arbitrationFee: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs uppercase font-medium text-neutral-400">Descuento Inicial</label>
                                    <div className="flex bg-neutral-800 rounded-lg p-1">
                                        <button
                                            type="button"
                                            onClick={() => { setDiscountType('AMOUNT'); setFormData({ ...formData, discountAmount: '' }); }}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${discountType === 'AMOUNT' ? 'bg-neutral-600 text-white shadow' : 'text-neutral-400 hover:text-white'}`}
                                        >
                                            $
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setDiscountType('PERCENT'); setFormData({ ...formData, discountAmount: '' }); }}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${discountType === 'PERCENT' ? 'bg-red-900 text-white shadow' : 'text-neutral-400 hover:text-white'}`}
                                        >
                                            %
                                        </button>
                                    </div>
                                </div>

                                {discountType === 'AMOUNT' ? (
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-red-900 focus:ring-1 focus:ring-red-900 outline-none transition-colors pl-9"
                                            value={formData.discountAmount}
                                            onChange={e => setFormData({ ...formData, discountAmount: e.target.value })}
                                            placeholder="Monto en Pesos"
                                        />
                                        <span className="absolute left-3 top-3.5 text-neutral-500 text-sm font-medium">$</span>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <select
                                            className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-red-900 focus:ring-1 focus:ring-red-900 outline-none transition-colors appearance-none"
                                            value={formData.discountAmount}
                                            onChange={e => setFormData({ ...formData, discountAmount: e.target.value })}
                                        >
                                            <option value="">Seleccione porcentaje...</option>
                                            {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map(p => (
                                                <option key={p} value={p}>{p}%</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                        </div>
                                    </div>
                                )}

                                {discountType === 'PERCENT' && formData.registrationFee && formData.arbitrationFee && (
                                    <p className="text-right text-xs text-neutral-500 mt-2">
                                        Descuento calculado: <span className="text-red-400 font-medium">${
                                            (((Number(formData.registrationFee) || 0) + (Number(formData.arbitrationFee) || 0)) * ((Number(formData.discountAmount) || 0) / 100)).toFixed(2)
                                        }</span>
                                    </p>
                                )}
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-medium text-sm transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 py-3 bg-red-900 hover:bg-red-800 text-white rounded-xl font-medium text-sm transition-colors shadow-lg shadow-red-900/20"
                                >
                                    {creating ? 'Guardando...' : 'Registrar Equipo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal (Copy of Create Modal but uses handleUpdateTeam) */}
            {showEditModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-neutral-900 border border-neutral-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowEditModal(false)}
                            className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <div className="p-8 border-b border-neutral-800 bg-neutral-900">
                            <h2 className="text-2xl font-light text-white">Editar Equipo</h2>
                            <p className="text-neutral-500 text-sm">Modificar información del equipo.</p>
                        </div>
                        <form onSubmit={handleUpdateTeam} className="p-8 space-y-6 bg-neutral-900/50">
                            <div>
                                <label className="block text-xs uppercase font-medium text-neutral-400 mb-2">Nombre del Equipo</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-colors"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase font-medium text-neutral-400 mb-2">Inscripción ($)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-colors"
                                        value={formData.registrationFee}
                                        onChange={e => setFormData({ ...formData, registrationFee: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase font-medium text-neutral-400 mb-2">Arbitraje ($)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-colors"
                                        value={formData.arbitrationFee}
                                        onChange={e => setFormData({ ...formData, arbitrationFee: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs uppercase font-medium text-neutral-400">Descuento Inicial</label>
                                    <div className="flex bg-neutral-800 rounded-lg p-1">
                                        <button
                                            type="button"
                                            onClick={() => { setDiscountType('AMOUNT'); setFormData({ ...formData, discountAmount: '' }); }}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${discountType === 'AMOUNT' ? 'bg-neutral-600 text-white shadow' : 'text-neutral-400 hover:text-white'}`}
                                        >
                                            $
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setDiscountType('PERCENT'); setFormData({ ...formData, discountAmount: '' }); }}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${discountType === 'PERCENT' ? 'bg-blue-900 text-white shadow' : 'text-neutral-400 hover:text-white'}`}
                                        >
                                            %
                                        </button>
                                    </div>
                                </div>
                                {discountType === 'AMOUNT' ? (
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-colors pl-9"
                                            value={formData.discountAmount}
                                            onChange={e => setFormData({ ...formData, discountAmount: e.target.value })}
                                            placeholder="Monto en Pesos"
                                        />
                                        <span className="absolute left-3 top-3.5 text-neutral-500 text-sm font-medium">$</span>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <select
                                            className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-colors appearance-none"
                                            value={formData.discountAmount}
                                            onChange={e => setFormData({ ...formData, discountAmount: e.target.value })}
                                        >
                                            <option value="">Seleccione porcentaje...</option>
                                            {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map(p => (
                                                <option key={p} value={p}>{p}%</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-medium text-sm transition-colors">Cancelar</button>
                                <button type="submit" disabled={creating} className="flex-1 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-medium text-sm transition-colors shadow-lg shadow-blue-900/20">{creating ? 'Guardando...' : 'Actualizar Equipo'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-neutral-900 border border-neutral-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowPaymentModal(false)}
                            className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="p-8 border-b border-neutral-800 bg-neutral-900">
                            <h2 className="text-2xl font-light text-white">Nuevo Abono</h2>
                            <p className="text-neutral-500 text-sm">Registrar pago para el equipo.</p>
                        </div>

                        <form onSubmit={handleRegisterPayment} className="p-8 space-y-6 bg-neutral-900/50">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs uppercase font-medium text-neutral-400 mb-2">Monto ($)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900 outline-none transition-colors"
                                        value={paymentData.amount}
                                        onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase font-medium text-neutral-400 mb-2">Jornada (Opcional)</label>
                                    <select
                                        className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900 outline-none transition-colors appearance-none"
                                        value={paymentData.matchday}
                                        onChange={e => setPaymentData({ ...paymentData, matchday: e.target.value })}
                                    >
                                        <option value="">General</option>
                                        {[...Array(10)].map((_, i) => (
                                            <option key={i} value={i + 1}>Jornada {i + 1}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs uppercase font-medium text-neutral-400 mb-2">Método de Pago</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentData({ ...paymentData, method: 'CASH' })}
                                        className={`py-3 rounded-lg font-medium text-sm transition-all border ${paymentData.method === 'CASH' ? 'bg-emerald-900/20 border-emerald-900 text-emerald-500' : 'bg-black border-neutral-700 text-neutral-500 hover:text-white'}`}
                                    >
                                        Efectivo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentData({ ...paymentData, method: 'TRANSFER' })}
                                        className={`py-3 rounded-lg font-medium text-sm transition-all border ${paymentData.method === 'TRANSFER' ? 'bg-blue-900/20 border-blue-900 text-blue-500' : 'bg-black border-neutral-700 text-neutral-500 hover:text-white'}`}
                                    >
                                        Transferencia
                                    </button>
                                </div>
                            </div>

                            {paymentData.method === 'TRANSFER' && (
                                <div className="grid grid-cols-2 gap-4 bg-blue-900/5 p-4 rounded-xl border border-blue-900/20">
                                    <div className="col-span-2">
                                        <label className="block text-xs uppercase font-medium text-blue-400 mb-2">Folio / Referencia</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-black border border-blue-900/30 rounded-lg p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                                            value={paymentData.transferRef}
                                            onChange={e => setPaymentData({ ...paymentData, transferRef: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase font-medium text-blue-400 mb-2">Fecha</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full bg-black border border-blue-900/30 rounded-lg p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                                            value={paymentData.transferDate}
                                            onChange={e => setPaymentData({ ...paymentData, transferDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs uppercase font-medium text-neutral-400 mb-2">Notas (Opcional)</label>
                                <textarea
                                    className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 outline-none transition-colors resize-none h-20"
                                    value={paymentData.notes}
                                    onChange={e => setPaymentData({ ...paymentData, notes: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
                                    className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-medium text-sm transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 py-3 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl font-medium text-sm transition-colors shadow-lg shadow-emerald-900/20"
                                >
                                    {creating ? 'Procesando...' : 'Registrar Pago'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
