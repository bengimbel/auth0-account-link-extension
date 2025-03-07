/* eslint-disable consistent-return */
/* eslint-disable no-param-reassign */
const { promisify } = require('util');
const Boom = require('@hapi/boom');
const jwksRsa = require('jwks-rsa');
const jwt = require('jsonwebtoken');
const config = require('../lib/config');
const plugin = require('../lib/session');
const logger = require('../lib/logger');

const scopes = [{ value: 'openid' }, { value: 'profile' }];

module.exports = {
  name: 'auth',
  async register(server) {
    const jwtOptions = {
      dashboardAdmin: {
        key: config('EXTENSION_SECRET'),
        verifyOptions: {
          audience: 'urn:api-account-linking',
          issuer: config('PUBLIC_WT_URL'),
          algorithms: ['HS256']
        }
      },
      resourceServer: {
        key: jwksRsa.hapiJwt2KeyAsync({
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 2,
          jwksUri: `https://${config('AUTH0_DOMAIN')}/.well-known/jwks.json`
        }),
        verifyOptions: {
          audience: 'urn:auth0-account-linking-api',
          issuer: `https://${config('AUTH0_DOMAIN')}/`,
          algorithms: ['RS256']
        }
      }
    };

    server.auth.strategy('jwt', 'jwt', {
      complete: true,
      verify: async (decoded, req) => {
        logger.info('on validate startttt');
        console.log('onvalidatestart');
        try {
          if (!decoded) {
            console.log('isApiRequest IS FAIL NO DECODED');
            return { isValid: false };
          }
          const header = req.headers.authorization;
          if (!header || !header.indexOf('Bearer ') === 0) {
            console.log('IS FAIL NO BEARER TOKEN');
            return { isValid: false };
          }
          const token = header.split(' ')[1];
          const isApiRequest = decoded && decoded.payload && decoded.payload.iss === `https://${config('AUTH0_DOMAIN')}/`;
          const isDashboardAdminRequest = decoded && decoded.payload && decoded.payload.iss === config('PUBLIC_WT_URL');

          const getKeyAsync = promisify(jwtOptions.resourceServer.key);
          const jwtVerifyAsync = promisify(jwt.verify);

          if (isApiRequest) {
            console.log('isApiRequest');
            if (decoded.payload.gty && decoded.payload.gty !== 'client-credentials') {
              console.log('isApiRequest IS FAIL clientcreds');
              return { isValid: false };
            }

            if (!decoded.payload.sub.endsWith('@clients')) {
              console.log('isApiRequest IS FAIL CLIENTS');
              return { isValid: false };
            }

            const resourceServerKey = await getKeyAsync(decoded);

            if (!resourceServerKey) {
              console.log('isApiRequest IS FAIL NO RESOURCE SERVER KEY');
              return { isValid: false };
            }

            // this can throw if there is an error
            await jwtVerifyAsync(token, resourceServerKey, jwtOptions.resourceServer.verifyOptions);
            console.log('isApiRequest verify token success');

            if (decoded.payload.scope && typeof decoded.payload.scope === 'string') {
              decoded.payload.scope = decoded.payload.scope.split(' '); // eslint-disable-line no-param-reassign
            }
            console.log('isApiRequest IS SUCCESS');
            return { credentials: decoded.payload, isValid: true };
          }
          if (isDashboardAdminRequest) {
            console.log('--isDashboardAdminRequest');
            if (!decoded.payload.access_token || !decoded.payload.access_token.length) {
              console.log('isDashboardAdminRequest IS FAIL NO ACCESSTOKEN');
              return { isValid: false };
            }

            // this can throw if there is an error
            await jwtVerifyAsync(
              token,
              jwtOptions.dashboardAdmin.key,
              jwtOptions.dashboardAdmin.verifyOptions
            );
            console.log('isDashboardAdminRequest IS SUCCESS');
            decoded.payload.scope = scopes.map(
              scope => scope.value
            ); // eslint-disable-line no-param-reassign
            return { credentials: decoded.payload, isValid: true };
          }
        } catch (error) {
          console.log('TRYCATCHFAIL');
          return { isValid: false };
        }
      }
    });
    server.auth.default('jwt');

    const session = {
      plugin,
      options: {
        stateKey: 'account-linking-admin-state',
        sessionStorageKey: 'com.auth0.account_linking.admin_ui.session_token',
        rta: config('AUTH0_RTA').replace('https://', ''),
        domain: config('AUTH0_DOMAIN'),
        scopes: '',
        baseUrl: config('PUBLIC_WT_URL'),
        audience: 'urn:api-account-linking',
        secret: config('EXTENSION_SECRET'),
        clientName: 'auth0-account-link',
        // eslint-disable-next-line no-unused-vars
        onLoginSuccess: (decoded, req) => {
          console.log('on login success onloginsuccess');
          if (decoded) {
            decoded.scope = scopes.map(
              scope => scope.value
            ); // eslint-disable-line no-param-reassign
            return decoded;
          }
          throw Boom.unauthorized('Invalid token', 'Token');
        }
      }
    };

    await server.register(session);
  }
};
