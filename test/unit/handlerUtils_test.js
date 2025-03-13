const { expect } = require('chai');
const handlerUtils = require('../../lib/handlerUtils')
const { createAuth0Token } = require('../test_helper');

describe('Handler Utils Tests', () => {
    it('validates a token successfully', async () => {
        const token = createAuth0Token({ user_id: 'auth0|67d304a8b5dd1267e87c53ba', email: 'ben1@acme.com' });
        const decoded = await handlerUtils.validateAuth0Token(token)

        expect(decoded.sub).to.deep.equal('auth0|67d304a8b5dd1267e87c53ba');
        expect(decoded.email).to.deep.equal('ben1@acme.com');
        expect(decoded.base).to.deep.equal('auth0.example.com/api/v2');
        expect(decoded.aud).to.deep.equal('22qApOBZ9BkEf3WDIYetEiJPXswpQdmY');
        expect(decoded.iss).to.deep.equal('https://account-linking-testing.auth0.com/');
    })
});
