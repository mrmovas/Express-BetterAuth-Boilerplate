import { Router } from "express";

// CONTROLLERS
import { mainController } from "@/routes/main/main.controller";


const router = Router();



/**
 * PUBLIC ROUTES
 */
router.get("/", mainController);




export default router;