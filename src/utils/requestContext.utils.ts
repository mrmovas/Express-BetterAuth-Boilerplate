import { AsyncLocalStorage } from 'node:async_hooks';

interface RequestContext {
    requestId: string;
    ip: string;
    userId: string | null;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getCtx() {
    return requestContext.getStore() ?? {};
}