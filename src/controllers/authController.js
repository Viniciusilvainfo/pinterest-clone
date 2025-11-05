import bcrypt from 'bcryptjs';
import { prisma } from '../../app.js';

export const authController = {
  getLogin(req, res) {
    if (req.session.userId) {
      return res.redirect('/');
    }
    res.render('login', { error: null });
  },

  getSignup(req, res) {
    if (req.session.userId) {
      return res.redirect('/');
    }
    res.render('signup', { error: null });
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.render('login', { 
          error: 'Invalid email or password' 
        });
      }

      req.session.userId = user.id;
      req.session.userName = user.name;
      
      res.redirect('/');
    } catch (error) {
      console.error('Login error:', error);
      res.render('login', { error: 'An error occurred during login' });
    }
  },

  async signup(req, res) {
    try {
      const { name, email, password, confirmPassword } = req.body;

      if (password !== confirmPassword) {
        return res.render('signup', { 
          error: 'Passwords do not match' 
        });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.render('signup', { 
          error: 'User with this email already exists' 
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword
        }
      });

      req.session.userId = user.id;
      req.session.userName = user.name;
      
      res.redirect('/');
    } catch (error) {
      console.error('Signup error:', error);
      res.render('signup', { error: 'An error occurred during registration' });
    }
  },

  logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
      }
      res.redirect('/');
    });
  }
};