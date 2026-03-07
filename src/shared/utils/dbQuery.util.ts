type DbResult<T> =
    | { success: true;  data: T }
    | { success: false; error: Error };

export async function dbQuery<T>(fn: () => Promise<T>): Promise<DbResult<T>> {
    try {
        const data = await fn();
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error as Error };
    }
}