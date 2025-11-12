import express from 'express';
import { validateBody } from '../middleware/validateReqSchema.middleware.js';
import { signup, login } from '../controllers/auth.controller.js';
import { signupSchema, loginSchema } from '../schemas/user.schema.js';

const router = express.Router();

router.post('/signup', validateBody(signupSchema), signup);
router.post('/login', validateBody(loginSchema), login);

export default router;