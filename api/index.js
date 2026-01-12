// Vercel serverless function entry point
import app from '../server/index.js';

// Export as Vercel serverless function handler
export default (req, res) => {
  return app(req, res);
};
