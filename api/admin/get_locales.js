/* eslint-disable no-underscore-dangle */

const { getLocales } = require('../../lib/storage');

module.exports = () => ({
  method: 'GET',
  options: {
    auth: 'jwt'
  },
  path: '/admin/locales',
  handler: (req, h) => getLocales().then(h.response)
});
