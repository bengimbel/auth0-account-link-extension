const path = require('path');
const { expect } = require('chai');
const sinon = require('sinon');
const { FileStorageContext } = require('auth0-extension-tools');
const { createServer, createAuth0Token } = require('../test_helper');
const initStorage = require('../../lib/db').init;

describe('Requesting the linking route', function() {
  describe('With an invalid token', function() {
    let server;

    before(async function() {
      server = await createServer();
      initStorage(new FileStorageContext(path.join(__dirname, '../../data.json')));
    });

    after(function() {
      server.stop();
    });

    it('returns a 400 with an invalid token', async function() {
      const options = { method: 'GET', url: '/?foo=bar', payload: {} }
      const res = await server.inject(options);
      expect(res.statusCode).to.eq(400);
    });
    it('returns 401 invalid token', async function() {
      const token = createAuth0Token({ user_id: 'auth0|67d304a8b5dd1267e87c53ba', email: 'ben1@acme.com' });
      const headers = { Authorization: `Bearer ${token}` };
      const options = { method: 'GET', url: '/admin/locales', headers };

      const res = await server.inject(options);
      expect(res.statusCode).to.equal(401);
    });
    it('returns 401 invalid token', async function() {
      const token = createAuth0Token({ user_id: 'auth0|67d304a8b5dd1267e87c53ba', email: 'ben1@acme.com' });
      const headers = { Authorization: `Bearer ${token}` };
      const options = { method: 'GET', url: '/admin/settings', headers };

      const res = await server.inject(options);
      expect(res.statusCode).to.equal(401);
    });
  });
});
