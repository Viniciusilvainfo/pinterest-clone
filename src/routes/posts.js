import express from 'express';
import { postsController } from '../controllers/postsController.js';

const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
};

router.post('/upload', requireAuth, postsController.upload);
router.post('/:id/like', requireAuth, postsController.like);

export default router;