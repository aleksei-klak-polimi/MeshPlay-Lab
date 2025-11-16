import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validateParams } from '../middleware/validateReqSchema.middleware.js';
import { getUser, deleteUser } from '../controllers/user.controller.js';
import { getUserSchema, deleteUserSchema } from '../schemas/user.schema.js';

const router = express.Router();

router.get('/:id/get', authenticateToken, validateParams(getUserSchema), getUser);
router.get('/:id/delete', authenticateToken, validateParams(deleteUserSchema), deleteUser);

export default router;