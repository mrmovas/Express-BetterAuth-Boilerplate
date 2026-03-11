import { Request, Response } from 'express';

import { auth } from '@/lib/auth';

import { MainPage } from '@/types/pages.types';








export async function mainController(req: Request, res: Response) {
    