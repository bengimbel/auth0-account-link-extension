const Boom = require('@hapi/boom');
const template = require('../../templates/server/locale');
const config = require('../../lib/config');
const stylesheet = require('../../lib/stylesheet');

module.exports = () => ({
  method: 'GET',
  path: '/admin/locale',
  options: {
    auth: false
  },
  handler: async (req, h) => {
    try {
      const stylesheetHelper = stylesheet(config('NODE_ENV') === 'production');
      const html = template({
        stylesheetTag: stylesheetHelper.tag('admin'),
        baseURL: config('PUBLIC_WT_URL')
      });

      return h.response(html).type('text/html').code(200);
    } catch (error) {
      return Boom.serverUnavailable(error);
    }
  }
});
