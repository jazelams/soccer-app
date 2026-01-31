'use client';
import { useState, useEffect, useRef } from 'react';
import api from '../../../services/api';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Wallet, Calendar, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { clsx } from 'clsx';
import { toPng } from 'html-to-image';

export default function TeamStatementPage() {
    const { id } = useParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const statementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        api.get(`/teams/${id}/statement`)
            .then(res => setData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    const handleDownloadImage = async () => {
        if (!statementRef.current) {
            alert("No se pudo encontrar el documento para generar la imagen.");
            return;
        }

        try {
            const dataUrl = await toPng(statementRef.current, {
                cacheBust: true,
                backgroundColor: '#ffffff',
                pixelRatio: 2 // Improve quality like scale: 2
            });

            const link = document.createElement('a');
            link.download = `estado_cuenta_${data?.teamInfo?.name?.replace(/\s+/g, '_') || 'equipo'}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error: any) {
            console.error("Error generating image:", error);
            alert(`Error al generar la imagen: ${error.message || 'Intente nuevamente'}`);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
        </div>
    );

    if (!data) return <div className="p-8 text-center text-slate-500">No se encontraron datos.</div>;

    const { teamInfo, financialSummary, payments } = data;

    return (
        <div className="min-h-screen relative font-sans text-neutral-200">
            {/* Background Image with Overlay */}
            <div
                className="fixed inset-0 z-0"
                style={{
                    backgroundImage: "url('/bg-waves.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed'
                }}
            />
            {/* Dark Overlay Gradient */}
            <div className="fixed inset-0 z-0 bg-gradient-to-br from-neutral-900/60 via-black/50 to-neutral-900/70 backdrop-blur-[2px]" />

            <div className="relative z-10 p-8 max-w-4xl mx-auto">
                <div className="mb-6 flex justify-between items-center print:hidden">
                    <Link
                        href={`/tournaments/${teamInfo.tournamentId}`}
                        className="flex items-center text-neutral-300 hover:text-white transition-colors bg-white/10 px-4 py-2 rounded-lg shadow-sm border border-white/10 font-medium text-sm backdrop-blur-md"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver al Torneo
                    </Link>

                    <button
                        onClick={handleDownloadImage}
                        className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg shadow-md transition-all font-bold text-sm tracking-wide"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Descargar Imagen
                    </button>
                </div>

                {/* Printable Area */}
                <div ref={statementRef} className="bg-white p-8 rounded-sm shadow-xl border border-slate-200 text-slate-900">
                    {/* Header Card */}
                    <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-slate-900">
                        <div>
                            <h1 className="text-4xl font-black mb-2 tracking-tighter uppercase">{teamInfo.name}</h1>
                            <div className="flex items-center text-slate-500 gap-4 text-sm font-bold uppercase tracking-widest">
                                <span className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> {teamInfo.tournament} • {teamInfo.day}</span>
                            </div>
                        </div>
                        <div className={clsx(
                            "px-4 py-2 rounded font-bold text-xs uppercase tracking-wider flex items-center border-2",
                            financialSummary.balance <= 0 ? "bg-emerald-100 text-emerald-700 border-emerald-600" : "bg-red-100 text-red-700 border-red-600"
                        )}>
                            {financialSummary.balance <= 0 ? 'AL CORRIENTE' : 'CON ADEUDO'}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 border border-slate-100 rounded-xl mb-8">
                        <div className="p-6 text-center">
                            <span className="block text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">Costo Total (Inicial)</span>
                            <span className="text-2xl font-black text-slate-800">${Number(financialSummary.baseAmount).toLocaleString()}</span>
                        </div>
                        <div className="p-6 text-center">
                            <span className="block text-xs uppercase tracking-widest text-emerald-600 font-bold mb-1">Abonos Totales</span>
                            <span className="text-3xl font-black text-emerald-600">${Number(financialSummary.totalPaid).toLocaleString()}</span>
                        </div>
                        <div className="p-6 text-center bg-slate-50/50">
                            <span className="block text-xs uppercase tracking-widest text-red-500 font-bold mb-1">Saldo Pendiente</span>
                            <span className={clsx(
                                "text-3xl font-black",
                                financialSummary.balance > 0 ? "text-red-600" : "text-slate-400"
                            )}>${Number(financialSummary.balance).toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Account Statement Table */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center border-b border-slate-100 pb-3">
                            <Wallet className="w-5 h-5 mr-2 text-slate-600" />
                            Historial de Movimientos
                        </h2>
                        <div className="rounded-xl border border-slate-200 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="p-5">Fecha</th>
                                        <th className="p-5">Concepto</th>
                                        <th className="p-5">Método / Detalles</th>
                                        <th className="p-5 text-right">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {payments.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-slate-400 italic">No hay movimientos registrados.</td>
                                        </tr>
                                    ) : (
                                        payments.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((p: any) => (
                                            <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="p-5 font-mono text-sm text-slate-600">
                                                    {new Date(p.date).toLocaleDateString()}
                                                </td>
                                                <td className="p-5">
                                                    <div className="font-bold text-slate-700">
                                                        {p.matchday ? `Abono Jornada ${p.matchday}` : "Abono General / Anticipo"}
                                                    </div>
                                                    {p.notes && (
                                                        <p className="text-xs text-slate-500 mt-1 italic">"{p.notes}"</p>
                                                    )}
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex flex-col">
                                                        <span className={clsx(
                                                            "inline-flex items-center w-fit px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider mb-1",
                                                            p.method === 'TRANSFER' ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"
                                                        )}>
                                                            {p.method === 'TRANSFER' ? 'Transferencia' : 'Efectivo'}
                                                        </span>
                                                        {p.method === 'TRANSFER' && (
                                                            <span className="text-xs text-slate-500 font-mono">
                                                                Folio: <span className="text-slate-900 font-medium">{p.reference || 'N/A'}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-5 text-right">
                                                    <span className="font-bold text-emerald-600 text-lg">+${Number(p.amount).toLocaleString()}</span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                <tfoot className="bg-slate-50 border-t border-slate-200">
                                    <tr>
                                        <td colSpan={3} className="p-5 text-right font-bold text-slate-500 uppercase text-xs tracking-wider">Total Abonado</td>
                                        <td className="p-5 text-right font-black text-slate-800 text-lg">
                                            ${Number(financialSummary.totalPaid).toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <div className="mt-8 text-center text-xs text-slate-400 pt-8 border-t border-slate-100">
                        <p>Este documento es un comprobante digital de los movimientos registrados en el sistema.</p>
                        <p className="mt-1 font-mono text-[10px] opacity-70">Generado el: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
