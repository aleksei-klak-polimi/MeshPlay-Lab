import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validateParams } from '../middleware/validateReqSchema.middleware.js';
import { getUser } from '../controllers/user.controller.js';
import { getUserSchema } from '../schemas/user.schema.js';

const router = express.Router();

router.get('/:id/get', authenticateToken, validateParams(getUserSchema), getUser);

export default router;