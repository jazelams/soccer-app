'use client';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, Bell, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TournamentsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

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

            {/* Content Wrapper */}
            <div className="relative z-10 flex flex-col min-h-screen">
                {/* Top Navbar */}
                <nav className="border-b border-white/5 bg-neutral-950/40 backdrop-blur-md sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

                        <div className="flex items-center gap-3">
                            <Link href="/dashboard" className="w-8 h-8 rounded bg-red-900 flex items-center justify-center font-serif font-bold text-white border border-red-800 shadow-[0_0_15px_rgba(158,27,50,0.5)] hover:scale-105 transition-transform">
                                <ArrowLeft className="w-4 h-4" />
                            </Link>
                            <span className="font-serif font-bold text-xl text-white tracking-wide">
                                LIGA <span className="text-red-700 font-light">PRO</span>
                            </span>
                        </div>

                        <div className="flex items-center gap-6">
                            <button className="text-neutral-400 hover:text-white transition-colors relative">
                                <Bell className="w-5 h-5" />
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full"></span>
                            </button>
                            <div className="h-6 w-px bg-white/10"></div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-red-500 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Salir
                            </button>
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto py-10 px-6 flex-grow w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
