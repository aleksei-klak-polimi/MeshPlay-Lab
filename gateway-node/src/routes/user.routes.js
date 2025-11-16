import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validateParams, validateBody } from '../middleware/validateReqSchema.middleware.js';
import { getUser, deleteUser, editUser } from '../controllers/user.controller.js';
import { getUserSchema, deleteUserSchema, editUserParamSchema, editUserBodySchema } from '../schemas/user.schema.js';

const router = express.Router();

router.get('/:id/get', authenticateToken, validateParams(getUserSchema), getUser);
router.delete('/:id', authenticateToken, validateParams(deleteUserSchema), deleteUser);
router.patch('/:id', authenticateToken, validateParams(editUserParamSchema), validateBody(editUserBodySchema), editUser);

export default router;