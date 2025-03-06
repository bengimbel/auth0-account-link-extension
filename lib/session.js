/* eslint-disable consistent-return */
const { promisify } = require('util');
const Boom = require('@hapi/boom');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const tools = require('auth0-extension-tools');
const jwksRsa = require('jwks-rsa');
const urlHelpers = require('./urlHelpers');
const logger = require('./logger');

const config = require('./config');

const buildUrl = paths => path.join.apply(null, paths).replace(/\\/g, '/').replace('http:/', 'http://').replace('https:/', 'https://');

const findCookie = (cookie, value) =>
  (Array.isArray(cookie)
    ? cookie.indexOf(value) === -1
    : cookie !== value);

module.exports = {
  name: 'dashboard-admin-session',
  async register(server, options) {
    logger.info(`${JSON.stringify(options)} options session start`);
    if (!options || typeof options !== 'object') {
      return new tools.ArgumentError('Must provide the options');
    }
    logger.info(`${options.onLoginSuccess} options.onLoginSuccess session start`);
    if (options.onLoginSuccess === null || options.onLoginSuccess === undefined) {
      logger.info('options.onLoginSuccess IS NOT HERE start');
      return new tools.ArgumentError('Must provide a valid login callback');
    }
    logger.info(`${JSON.stringify(options.secret)} options.secret session start`);
    if (options.secret === null || options.secret === undefined) {
      return new tools.ArgumentError('Must provide a valid secret');
    }
    logger.info(`${JSON.stringify(options.secret)} options.secret session start`);
    if (typeof options.secret !== 'string' || options.secret.length === 0) {
      return new tools.ArgumentError(`The provided secret is invalid: ${options.secret}`);
    }
    logger.info(`${JSON.stringify(options.audience)} options.audience session start`);
    if (options.audience === null || options.audience === undefined) {
      return new tools.ArgumentError('Must provide a valid audience');
    }
    logger.info(`${JSON.stringify(options.audience)} options.audience session start`);
    if (typeof options.audience !== 'string' || options.audience.length === 0) {
      return new tools.ArgumentError(`The provided audience is invalid: ${options.audience}`);
    }
    logger.info(`${JSON.stringify(options.rta)} options.rta session start`);
    if (options.rta === null || options.rta === undefined) {
      return new tools.ArgumentError('Must provide a valid rta');
    }
    logger.info(`${JSON.stringify(options.rta)} options.rta session start`);
    if (typeof options.rta !== 'string' || options.rta.length === 0) {
      return new tools.ArgumentError(`The provided rta is invalid: ${options.rta}`);
    }
    logger.info(`${JSON.stringify(options.domain)} domain.rta session start`);
    if (options.domain === null || options.domain === undefined) {
      return new tools.ArgumentError('Must provide a valid domain');
    }
    logger.info(`${JSON.stringify(options.domain)} domain.rta session start`);
    if (typeof options.domain !== 'string' || options.domain.length === 0) {
      return new tools.ArgumentError(`The provided domain is invalid: ${options.domain}`);
    }
    logger.info(`${JSON.stringify(options.baseUrl)} domain.baseUrl session start`);
    if (options.baseUrl === null || options.baseUrl === undefined) {
      return new tools.ArgumentError('Must provide a valid base URL');
    }
    logger.info(`${JSON.stringify(options.baseUrl)} domain.baseUrl session start`);
    if (typeof options.baseUrl !== 'string' || options.baseUrl.length === 0) {
      return new tools.ArgumentError(`The provided base URL is invalid: ${options.baseUrl}`);
    }
    logger.info(`${JSON.stringify(options.clientName)} domain.clientName session start`);
    if (options.clientName === null || options.clientName === undefined) {
      return new tools.ArgumentError('Must provide a valid client name');
    }
    logger.info(`${JSON.stringify(options.clientName)} domain.clientName session start`);
    if (typeof options.clientName !== 'string' || options.clientName.length === 0) {
      return new tools.ArgumentError(`The provided client name is invalid: ${options.clientName}`);
    }

    const stateKey = options.stateKey || 'state';
    const nonceKey = options.nonceKey || 'nonce';
    const urlPrefix = options.urlPrefix || '';
    const sessionStorageKey = options.sessionStorageKey || 'apiToken';
    const sessionManager = options.sessionManager ||
      new tools.SessionManager(
        options.rta,
        options.domain,
        options.baseUrl
      );
    const basicCookieAttr = {
      isHttpOnly: true
    };
    server.state(nonceKey, Object.assign({}, basicCookieAttr, { isSameSite: 'None', isSecure: true }));
    server.state(stateKey, Object.assign({}, basicCookieAttr, { isSameSite: 'None', isSecure: true }));
    server.state(`${nonceKey}_compat`, basicCookieAttr);
    server.state(`${stateKey}_compat`, basicCookieAttr);
    logger.info(`${urlPrefix} url prefix`);
    logger.info(`${urlPrefix}/login::: IS THE ROUTE`);
    server.route({
      method: 'GET',
      path: `${urlPrefix}/login`,
      options: {
        auth: false
      },
      handler: (req, h) => {
        const state = crypto.randomBytes(16).toString('hex');
        const nonce = crypto.randomBytes(16).toString('hex');
        logger.info(`${state}: state session login`);
        logger.info(`${nonce}: nonce session login`);
        logger.info(`${JSON.stringify(options)}: options session login`);
        const redirectTo = sessionManager.createAuthorizeUrl({
          redirectUri: buildUrl([urlHelpers.getBaseUrl(req), urlPrefix, '/login/callback']),
          scopes: options.scopes,
          expiration: options.expiration,
          nonce,
          state
        });

        return h.redirect(redirectTo)
          .state(nonceKey, nonce, { path: urlHelpers.getBasePath(req) })
          .state(stateKey, state, { path: urlHelpers.getBasePath(req) })
          .state(`${nonceKey}_compat`, nonce, { path: urlHelpers.getBasePath(req) })
          .state(`${stateKey}_compat`, state, { path: urlHelpers.getBasePath(req) });
      }
    });

    server.route({
      method: 'POST',
      path: `${urlPrefix}/login/callback`,
      options: {
        auth: false
      },
      handler: async (req, h) => {
        let decoded;

        const jwtVerifyAsync = promisify(jwt.verify);
        const idToken = req.payload.id_token;

        try {
          decoded = jwt.decode(idToken, { complete: true });
          logger.info(`${JSON.stringify(decoded)}: decoded session login/callback`);
          const getKey = jwksRsa.hapiJwt2Key({
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: process.env.NODE_ENV === 'test' ? 10 : 2,
            jwksUri: `${config('AUTH0_RTA')}/.well-known/jwks.json`
          });

          const getKeyAsync = promisify(getKey);
          const key = await getKeyAsync(decoded);
          logger.info(`${key}: key session login/callback`);
          if (!key) {
            return Boom.unauthorized('Invalid token');
          }

          // this token is issued by the RTA
          const verifyOptions = {
            audience: config('PUBLIC_WT_URL'),
            issuer: `${config('AUTH0_RTA')}/`,
            algorithms: ['RS256']
          };

          // // throws on failure
          await jwtVerifyAsync(idToken, key, verifyOptions);
        } catch (e) {
          decoded = null;
        }

        if (!decoded) {
          return Boom.unauthorized('Invalid token');
        }

        // handle multiple cookies with same name
        if (
          (
            req.state && req.state[nonceKey] &&
            findCookie(req.state[nonceKey], decoded.payload.nonce)
          ) ||
          (
            req.state && req.state[`${nonceKey}_compat`] &&
            findCookie(req.state[`${nonceKey}_compat`], decoded.payload.nonce)
          )
        ) {
          return Boom.badRequest('Nonce mismatch');
        }
        logger.info(`${JSON.stringify(req.state)}: req.state session login/callback`);
        if (
          (
            req.state && req.state[stateKey] &&
            findCookie(req.state[stateKey], req.payload.state)
          ) ||
          (
            req.state && req.state[`${stateKey}_compat`] &&
            findCookie(req.state[`${stateKey}_compat`], req.payload.state)
          )
        ) {
          return Boom.badRequest('State mismatch');
        }

        let token;

        try {
          token = await sessionManager.create(req.payload.id_token, req.payload.access_token, {
            secret: options.secret,
            issuer: options.baseUrl,
            audience: options.audience
          });
          logger.info(`${JSON.stringify(token)}: token session login/callback`);
        } catch (error) {
          server.log(['error'], 'Login callback failed', error);
          return Boom.boomify(error);
        }

        const html = `<html>
          <head>
            <script type="text/javascript"> 
              sessionStorage.setItem("${sessionStorageKey}", "${token}");
              window.location.href = "${buildUrl([urlHelpers.getBaseUrl(req), '/'])}";
            </script>
          </head>
        </html>`;

        return h.response(html)
          .type('text/html')
          .unstate(nonceKey, { path: urlHelpers.getBasePath(req) })
          .unstate(stateKey, { path: urlHelpers.getBasePath(req) })
          .unstate(`${nonceKey}_compat`, { path: urlHelpers.getBasePath(req) })
          .unstate(`${stateKey}_compat`, { path: urlHelpers.getBasePath(req) });
      }
    });

    server.route({
      method: 'GET',
      path: `${urlPrefix}/logout`,
      options: {
        auth: false
      },
      handler: (req, h) => {
        const encodedBaseUrl = encodeURIComponent(buildUrl([urlHelpers.getBaseUrl(req), '/']));
        const html = `<html>
          <head>
            <script type="text/javascript">
              sessionStorage.removeItem("${sessionStorageKey}");
              window.location.href = "https://${options.rta}/v2/logout/?returnTo=${encodedBaseUrl}&client_id=${encodedBaseUrl}";
            </script>
          </head>
        </html>`;

        return h.response(html)
          .type('text/html')
          .unstate(nonceKey, { path: urlHelpers.getBasePath(req) })
          .unstate(stateKey, { path: urlHelpers.getBasePath(req) })
          .unstate(`${nonceKey}_compat`, { path: urlHelpers.getBasePath(req) })
          .unstate(`${stateKey}_compat`, { path: urlHelpers.getBasePath(req) });
      }
    });

    server.route({
      method: 'GET',
      path: '/.well-known/oauth2-client-configuration',
      options: {
        auth: false
      },
      handler: (req, h) => h.response({
        redirect_uris: [buildUrl([urlHelpers.getBaseUrl(req), urlPrefix, '/login/callback'])],
        client_name: options.clientName,
        post_logout_redirect_uris: [buildUrl([urlHelpers.getBaseUrl(req), '/'])]
      })
    });

    server.auth.strategy('auth0-admins-jwt', 'jwt', {
      key: options.secret,
      validate: options.onLoginSuccess,
      verifyOptions: {
        audience: options.audience,
        issuer: options.baseUrl,
        algorithms: ['HS256']
      }
    });
  }
};
