/* eslint-disable no-useless-escape */

const Joi = require('@hapi/joi');
const storage = require('../../lib/storage');

const logoPathRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;
const colorRegex = /^#[A-Fa-f0-9]{6}/;
const customDomainRegex = /^(?!www\.)[\w.-]+\.[a-z]{2,}$/i;

module.exports = () => ({
  method: 'PUT',
  options: {
    auth: {
      strategies: ['jwt']
    },
    validate: {
      payload: {
        template: Joi.string().required(),
        locale: Joi.string().required(),
        title: Joi.string().required(),
        color: Joi.string()
          .regex(colorRegex)
          .required(),
        logoPath: Joi.string()
          .regex(logoPathRegex)
          .allow(''),
        removeOverlay: Joi.bool().default(false),
        customDomain: Joi.string()
          .regex(customDomainRegex)
          .allow('')
      }
    }
  },
  path: '/admin/settings',
  handler: async (req, h) => {
    const settings = await storage.setSettings(req.payload);

    return h.response(settings).code(200);
  }
});
