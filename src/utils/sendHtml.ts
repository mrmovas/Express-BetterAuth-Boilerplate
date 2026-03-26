import { Response } from 'express';
import path from 'path';


/**
 * This function is used to send HTML files using res.sendFile.
 * It was created to make it easier to send HTML files from the 'views' directory without having to specify the full path every time in the controllers.
 */

export function sendHtml(res: Response, filename: string) {
    if(!filename.endsWith('.html')) filename += '.html';
    res.sendFile(filename, { root: path.join(__dirname, '../../views') });
}