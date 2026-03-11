import { User } from "./user.types";


/**
 * PARTIALS
 */

export type HeaderTag = {
    title: string;
    description: string;
};



export type NavTag = {
    user: User | null;
}



export type FooterTag = {
    year: string;
    text: string;
}


export type MessageTag = {
    type: 'error' | 'success';
    text: string;
}




/**
 * PAGES
 */

export type MainPage = {
    header: HeaderTag;
    nav: NavTag;
    footer: FooterTag;
    user: User | null;
}



export type AuthPage = {
    header: HeaderTag;
    nav: NavTag;
    footer: FooterTag;

    authType: 'login' | 'register' | 'reset-password' | 'verify-email';
    isTokenValid?: boolean; // For reset-password and verify-email pages

    message?: MessageTag;
}



export type ProfilePage = {
    header: HeaderTag;
    nav: NavTag;
    footer: FooterTag;

    user: User;

    message?: MessageTag;
}