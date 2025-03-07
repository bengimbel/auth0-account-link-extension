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
// const jwksRsa = require('jwks-rsa');
const { promisify } = require('util');

const handleJwt = async (childtoken) => {
  try {
    // Decode the token with the complete option to get the header
    const decoded = decode(childtoken, { complete: true });
    console.log(`${JSON.stringify(decoded)} decoded`);
    logger.info(`${JSON.stringify(decoded)} decoded`);
    // Extract the header from the decoded token
    const header = decoded.header;
    console.log(`${JSON.stringify(header)} header`);
    logger.info(`${JSON.stringify(header)} header`);

    const jwtVerifyAsync = promisify(jwt.verify);
    // const getKey = jwksRsa.hapiJwt2Key({
    //   cache: true,
    //   rateLimit: true,
    //   jwksRequestsPerMinute: process.env.NODE_ENV === 'test' ? 10 : 2,
    //   jwksUri: `${config('AUTH0_RTA')}/.well-known/jwks.json`
    // });

    const key = config('AUTH0_CLIENT_SECRET');
    console.log(`${key} key`);
    logger.info(`${key} key`);
    console.log('key session login/callback');
    logger.info('key session login/callback');
    if (!key) {
      console.log('NO KEY');
      logger.info('NO KEY');
      return false;
    }

    // this token is issued by the RTA
    const verifyOptions = {
      audience: config('AUTH0_CLIENT_ID'),
      issuer: `${config('AUTH0_DOMAIN')}/`,
      algorithms: ['HS256']
    };

    await jwtVerifyAsync(childtoken, key, verifyOptions);
    return true;
  } catch (error) {
    logger.info(`${error} ERR decode`);
    console.log(`${error} error decode`);
  }
};

// const decodeToken = token =>
//   new Promise((resolve, reject) => {
//     try {
//       resolve(decode(token));
//     } catch (e) {
//       reject(e);
//     }
//   });

// const decodeToken2 = async (token) => {
//   try {
//     await handleJwt(token);
//     const decoded = decode(token);
//     logger.info('decoded', JSON.stringify(decoded));
//     console.log('decoded', JSON.stringify(decoded));
//     return decoded;
//   } catch (err) {
//     console.log('ERROR handlejwt decodeToken', err);
//     logger.info('ERROR handlejwt decodeToken', err);
//   }
// };

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
    logger.info('Starting index page rendering...');
    console.log('Starting index page rendering...');
    const stylesheetHelper = stylesheet(config('NODE_ENV') === 'production');
    const stylesheetTag = stylesheetHelper.tag('link');
    const customCSSTag = stylesheetHelper.tag(config('CUSTOM_CSS'), true);
    const params = req.query;
    const dynamicSettings = {};

    if (params.locale) dynamicSettings.locale = params.locale;
    if (params.color) dynamicSettings.color = `#${params.color}`;
    if (params.title) dynamicSettings.title = params.title;
    if (params.logoPath) dynamicSettings.logoPath = params.logoPath;
    try {
      logger.info('Start decoding child token');
      logger.info(`${JSON.stringify(params.child_token)} : Start decoding child token`);
      console.log(`${JSON.stringify(params.child_token)} : Start decoding child token`);
      const token = await handleJwt(params.child_token);
      const whatamI = await handleJwt(params.child_token);
      console.log('whatamI', whatamI);
      logger.info('whatamI', whatamI);
      logger.info(`${JSON.stringify(token)} child token decoded`);
      console.log(`${JSON.stringify(token)} child token decoded`);
      try {
        const { currentUser, matchingUsers } = await fetchUsersFromToken(token);
        const settings = await getSettings();
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
