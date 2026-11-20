import { Router } from 'express';
import { loginDoctor } from '../controllers/doctorController.js';

const router = Router();

router.post('/login', loginDoctor);

export default router;
