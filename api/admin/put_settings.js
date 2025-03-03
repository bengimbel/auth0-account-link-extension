/* eslint-disable no-useless-escape */

const Joi = require('@hapi/joi');
const { setSettings } = require('../../lib/storage');

const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;
const colorRegex = /^#[A-Fa-f0-9]{6}/;

module.exports = () => ({
  method: 'PUT',
  options: {
    auth: 'jwt',
    validate: {
      payload: {
        template: Joi.string().required(),
        locale: Joi.string().required(),
        title: Joi.string().required(),
        color: Joi.string()
          .regex(colorRegex)
          .required(),
        logoPath: Joi.string()
          .regex(urlRegex)
          .allow(''),
        removeOverlay: Joi.bool().default(false)
      }
    }
  },
  path: '/admin/settings',
  handler: async (req, h) => {
    const settings = await setSettings(req.payload);
    return h.response(settings).code(200);
  }
});
