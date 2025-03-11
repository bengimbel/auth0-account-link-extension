const avatarUrl = require('../../lib/avatar');
const logger = require('../../lib/logger');

module.exports = () => ({
  method: 'GET',
  path: '/admin/user',
  options: {
    auth: {
      strategies: ['jwt'],
      scope: ['profile', 'email']
    }
  },
  handler: (req, h) => {
    console.log(`${req.auth}: req.auth.credentials`);
    logger.info(`${req.auth}: req.auth.credentials`);
    return h.response({
      email: req.auth.credentials.email,
      avatar: avatarUrl(req.auth.credentials.email)
    }).code(200);
  }
});
