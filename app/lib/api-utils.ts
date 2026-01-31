import { NextResponse } from 'next/server';
import { verifyToken } from './auth';

export async function checkAuth(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
        return null;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    return decoded;
}

export function forbidden() {
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
}

export function unauthorized() {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
}
