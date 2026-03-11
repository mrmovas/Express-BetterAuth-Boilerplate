import { Router } from 'express';

import { mainController } from './main.controller'; 




const router = Router()




router.get('/', mainController); 