const { verify } = require('jsonwebtoken');
const { promisify } = require('util');
const config = require('./config');
const logger = require('./logger');
const findUsersByEmail = require('./findUsersByEmail');

const validateAuth0Token = async (childtoken) => {
  try {
    const jwtVerifyAsync = promisify(verify);
    const key = config('AUTH0_CLIENT_SECRET');
    if (!key) {
      return false;
    }

    const verifyOptions = {
      audience: config('AUTH0_CLIENT_ID'),
      issuer: `https://${config('AUTH0_DOMAIN')}/`,
      algorithms: ['HS256'],
      complete: true
    };
    const decoded = await jwtVerifyAsync(childtoken, key, verifyOptions);
    console.log(`decoded: ${JSON.stringify(decoded)}`);
    logger.info(`decoded: ${JSON.stringify(decoded)}`);
    console.log(`payload: ${JSON.stringify(decoded.payload)}`);
    logger.info(`payload: ${JSON.stringify(decoded.payload)}`);
    return decoded.payload;
  } catch (error) {
    logger.error('An error was encountered while decoding the token: ', error);
    throw new Error('An error was encountered while decoding the token: ', error);
  }
};

const fetchUsersFromToken = ({ sub, email }) =>
  findUsersByEmail(email).then(users => ({
    currentUser: users.find(u => u.user_id === sub),
    matchingUsers: users
      .filter(u => u.user_id !== sub)
      .sort((prev, next) => new Date(prev.created_at) - new Date(next.created_at))
  }));

module.exports = {
  fetchUsersFromToken,
  validateAuth0Token
};
