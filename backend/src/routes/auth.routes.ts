import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { loginSchema, registerStudentSchema } from '../validators/auth.validator.js';

const router = Router();

router.post('/login', validateRequest({ body: loginSchema }), authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);
router.post(
  '/register',
  authenticate,
  authorize('Teacher'),
  validateRequest({ body: registerStudentSchema }),
  authController.register
);

export default router;
