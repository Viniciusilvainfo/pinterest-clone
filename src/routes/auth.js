import express from 'express';
import { authController } from '../controllers/authController.js';

const router = express.Router();

router.get('/login', authController.getLogin);
router.get('/signup', authController.getSignup);
router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.post('/logout', authController.logout);

export default router;