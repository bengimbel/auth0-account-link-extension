const avatarUrl = require('../../lib/avatar');

module.exports = () => ({
  method: 'GET',
  path: '/admin/user',
  options: {
    auth: {
      stratigies: ['jwt'],
      access: {
        scope: ['profile']
      }
    }
  },
  handler: (req, h) => h.response({
    email: req.auth.credentials.email,
    avatar: avatarUrl(req.auth.credentials.email)
  }).code(200)
});
