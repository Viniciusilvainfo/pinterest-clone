import formidable from 'formidable';
import path from 'path';
import { prisma } from '../../app.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const postsController = {
  async upload(req, res) {
    const form = formidable({
      uploadDir: path.join(__dirname, '../../uploads'),
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(500).render('error', { 
          message: 'Error uploading file' 
        });
      }

      try {
        const { title, description, link } = fields;
        const imageFile = files.image;

        if (!imageFile) {
          return res.status(400).render('error', { 
            message: 'Image is required' 
          });
        }

        const imageUrl = imageFile[0].newFilename;

        await prisma.post.create({
          data: {
            title: title[0],
            description: description ? description[0] : null,
            link: link ? link[0] : null,
            imageUrl,
            userId: req.session.userId
          }
        });

        res.redirect('/');
      } catch (error) {
        console.error('Create post error:', error);
        res.status(500).render('error', { 
          message: 'Error creating post' 
        });
      }
    });
  },

  async like(req, res) {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.session.userId;

      const existingLike = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId,
            postId
          }
        }
      });

      if (existingLike) {
        await prisma.like.delete({
          where: {
            userId_postId: {
              userId,
              postId
            }
          }
        });
      } else {
        await prisma.like.create({
          data: {
            userId,
            postId
          }
        });
      }

      const likeCount = await prisma.like.count({
        where: { postId }
      });

      res.json({ success: true, likeCount });
    } catch (error) {
      console.error('Like error:', error);
      res.status(500).json({ success: false, error: 'Error processing like' });
    }
  }
};