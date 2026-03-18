import { Request, Response } from 'express';

import { auth } from '@/utils/auth';

import { MainPage } from '@/types/pages.types';
import { User } from '@/types/user.types';








export async function mainController(req: Request, res: Response) {
    const mainPage: MainPage = {
        header: {
            title: 'Auth Boilerplate',
            description: 'A boilerplate for building a secure Express applications with authentication using Better-Auth.'
        },
        nav: {
            user: res.locals.user,
        },
        footer: {
            year: new Date().getFullYear().toString(),
            text: 'Auth Boilerplate by mrmovas'
        },
        user: res.locals.user,
    };
     
    res.render('main', mainPage);
}
    