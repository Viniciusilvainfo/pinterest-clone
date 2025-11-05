import express from 'express';
import session from 'express-session';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './src/routes/auth.js';
import postRoutes from './src/routes/posts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.use(session({
  secret: 'pinterest-clone-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));


app.use('/', authRoutes);
app.use('/posts', postRoutes);

const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
};

app.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'recent';

    let orderBy = {};
    if (sortBy === 'popular') {
      orderBy = {
        likes: {
          _count: 'desc'
        }
      };
    } else {
      orderBy = { createdAt: 'desc' };
    }

    const posts = await prisma.post.findMany({
      include: {
        user: {
          select: { name: true, id: true }
        },
        likes: {
          where: req.session.userId ? { userId: req.session.userId } : undefined
        },
        _count: {
          select: {
            likes: true
          }
        }
      },
      orderBy,
      skip,
      take: limit
    });

    const totalPosts = await prisma.post.count();
    const totalPages = Math.ceil(totalPosts / limit);

    const userData = req.session.userId ? { 
      id: req.session.userId, 
      name: req.session.userName 
    } : null;

    res.render('home', {
      posts,
      currentPage: page,
      totalPages,
      sortBy,
      user: userData
    });
  } catch (error) {
    console.error('Error loading home page:', error);
    res.status(500).render('error', { message: 'Error loading posts' });
  }
});

app.get('/upload', requireAuth, (req, res) => {
  res.render('publish', { 
    user: { id: req.session.userId, name: req.session.userName } 
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { prisma };