import { prisma } from '../../app.js';

export const logMiddleware = async (req, res, next) => {
  const hidePasswords = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const cleaned = { ...obj };
    if (cleaned.password) cleaned.password = '***HIDDEN***';
    if (cleaned.confirmPassword) cleaned.confirmPassword = '***HIDDEN***';
    
    return cleaned;
  };

  const originalSend = res.send;
  let responseBody;

  res.send = function(body) {
    responseBody = body;
    return originalSend.apply(this, arguments);
  };

  res.on('finish', async () => {
    try {
      const payload = {
        ...req.body,
        ...req.query
      };

      await prisma.log.create({
        data: {
          ip: req.ip || req.connection.remoteAddress,
          method: req.method,
          path: req.path,
          payload: JSON.stringify(hidePasswords(payload)),
          statusCode: res.statusCode,
          userAgent: req.get('User-Agent')
        }
      });
    } catch (error) {
      console.error('Logging error:', error);
    }
  });

  next();
};