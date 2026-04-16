import { Router, Request, Response } from 'express';
import { sql } from 'kysely';
import { db } from '@/config/database.config';
import { sendSuccess, sendError } from '@/utils/response.util';

const router = Router();




router.get('/', async (_req: Request, res: Response) => {
    let dbStatus: 'ok' | 'error' = 'error';

    try {
        await sql`SELECT 1`.execute(db);
        dbStatus = 'ok';
    } catch {
        dbStatus = 'error';
    }

    const healthy = dbStatus === 'ok';

    const payload = {
        status: healthy ? 'ok' : 'degraded',
        uptime: process.uptime(),
        checks: {
            database: dbStatus,
        },
    };

    if(healthy) return sendSuccess(res, payload, 'Service is healthy');
    return sendError(res, 'Service is degraded', 503, 'SERVICE_DEGRADED', payload);
});




export default router;
