/* eslint-disable consistent-return */
const { decode } = require('jsonwebtoken');
const _ = require('lodash');
const config = require('../lib/config');
const findUsersByEmail = require('../lib/findUsersByEmail');
const indexTemplate = require('../templates/index');
const logger = require('../lib/logger');
const stylesheet = require('../lib/stylesheet');
const getIdentityProviderPublicName = require('../lib/idProviders');
const humanizeArray = require('../lib/humanize');
const { resolveLocale } = require('../lib/locale');
const { getSettings } = require('../lib/storage');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const fetchUsersFromToken = ({ sub, email }) =>
  findUsersByEmail(email).then(users => ({
    currentUser: users.find(u => u.user_id === sub),
    matchingUsers: users
      .filter(u => u.user_id !== sub)
      .sort((prev, next) => new Date(prev.created_at) - new Date(next.created_at))
  }));

module.exports = () => ({
  method: 'GET',
  path: '/',
  options: {
    auth: false
  },
  handler: async (req, h) => {
    if (_.isEmpty(req.query)) {
      return h.redirect(`${config('PUBLIC_WT_URL')}/admin`);
    }
    const stylesheetHelper = stylesheet(config('NODE_ENV') === 'production');
    const stylesheetTag = stylesheetHelper.tag('link');
    const customCSSTag = stylesheetHelper.tag(config('CUSTOM_CSS'), true);
    const params = req.query;
    const dynamicSettings = {};
    const jwtVerifyAsync = promisify(jwt.verify);

    if (params.locale) dynamicSettings.locale = params.locale;
    if (params.color) dynamicSettings.color = `#${params.color}`;
    if (params.title) dynamicSettings.title = params.title;
    if (params.logoPath) dynamicSettings.logoPath = params.logoPath;
    try {
      const decoded = decode(params.childtoken, { complete: true });
      const key = config('AUTH0_CLIENT_SECRET');
      if (!key) {
        return false;
      }

      await jwtVerifyAsync(params.childtoken, key, {
        audience: config('AUTH0_CLIENT_ID'),
        issuer: `https://${config('AUTH0_DOMAIN')}/`,
        algorithms: ['HS256']
      });
      console.log(`${JSON.stringify(decoded)}, 'decoded'`);
      logger.info(`Decoded token: ${JSON.stringify(decoded)}`);
      const token = decoded.payload;
      console.log(`${JSON.stringify(token)}, 'token'`);
      logger.info(`token: ${JSON.stringify(token)}`);
      try {
        const { currentUser, matchingUsers } = await fetchUsersFromToken(token);
        console.log(`${JSON.stringify(currentUser)}-${JSON.stringify(matchingUsers)}, 'users'`);
        logger.info(`${JSON.stringify(currentUser)}-${JSON.stringify(matchingUsers)}, 'users'`);
        const settings = await getSettings();
        console.log('got setttings');
        logger.info('got setttings');
        const userMetadata = (matchingUsers[0] && matchingUsers[0].user_metadata) || {};
        const locale = typeof userMetadata.locale === 'string' ? userMetadata.locale : settings.locale;
        const t = await resolveLocale(locale);
        // FIXME: The "continue" button is always poiting to first user's identity
        // connection, so we can't show all available alternatives in the introduction
        // text: "You may sign in with IdP1 or IdP2 or..."
        // A proper fix could be showing multiple "continue" links (one per existing
        // identity) or one "continue" link with a connection selector.
        const rawIdentities = matchingUsers.length > 0 ? [matchingUsers[0].identities[0]] : [];
        const identities = rawIdentities.map(id => id.provider).map(getIdentityProviderPublicName);
        const humanizedIdentities = humanizeArray(identities, t('or'));
        console.log('got to temaplte');
        logger.info('got to temaplte');
        const template = await indexTemplate({
          dynamicSettings,
          stylesheetTag,
          currentUser,
          matchingUsers,
          customCSSTag,
          locale,
          identities: humanizedIdentities,
          params,
          token
        });

        return h.response(template).type('text/html');
      } catch (error) {
        const state = req.query.state;
        logger.error('An error was encountered: ', error);
        logger.info(
          `Redirecting to failed link to /continue: ${token.iss}continue?state=${
            req.query.state
          }`
        );

        return h.redirect(`${token.iss}continue?state=${state}`);
      }
    } catch (tokenError) {
      logger.error('An invalid token was provided', tokenError);

      const template = await indexTemplate({
        dynamicSettings,
        stylesheetTag,
        currentUser: null,
        matchingUsers: [],
        customCSSTag
      });

      return h.response(template).type('text/html').code(400);
    }
  }
});
