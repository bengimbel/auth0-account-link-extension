/* eslint-disable no-underscore-dangle */

const { getLocales } = require('../../lib/storage');

module.exports = () => ({
  method: 'GET',
  options: {
    auth: {
      stratigies: ['jwt'],
      access: {
        scope: ['profile']
      }
    }
  },
  path: '/admin/locales',
  handler: (req, h) => getLocales().then(h.response)
});
