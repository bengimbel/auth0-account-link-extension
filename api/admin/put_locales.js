/* eslint-disable no-useless-escape */

const { setLocales } = require('../../lib/storage');

module.exports = () => ({
  method: 'PUT',
  options: {
    auth: {
      strategies: ['jwt'],
      // scope: ['profile'],
      scope: ['yar']
    }
  },
  path: '/admin/locales',
  handler: (req, h) => setLocales(req.payload).then(h.response)
});
