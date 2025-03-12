const { expect } = require('chai');
const { createServer, createToken } = require('../test_helper');
const metadata = require('../../webtask.json');

describe('Requesting the metadata route', function() {
  let server;

  before(async function() {
    server = await createServer();
  });

  after(function() {
    server.stop();
  });

  describe('Regardless of token', function() {
    it('returns content from webtask.json file', async function() {
      const options = { method: 'GET', url: '/meta' };
      const res = await server.inject(options);
      expect(res.statusCode).to.equal(200);
      expect(res.result).to.deep.equal(metadata);
    });
  });

  describe('With valid token', function() {
    it('returns a 200 on linking page', async function() {
      const headers = {
        Authorization: `Bearer ${createToken({user_id: 1, email: 'foo@example.com'})}`
      };
      const options = { method: 'GET', url: '/meta', headers };
      const res = await server.inject(options);
      expect(res.statusCode).to.equal(200);
      expect(res.result).to.deep.equal(metadata);
    });

    // it('returns a 200 on linking page', async function() {
    //   const headers = {
    //     Authorization: `Bearer ${createToken({user_id: 1, email: 'foo@example.com'})}`
    //   };
    //   const options = { method: 'GET', url: '/', headers };
    //   const res = await server.inject(options);
    //   console.log(res)
    //   expect(res.statusCode).to.equal(200);
    //   expect(res.result).to.deep.equal(metadata);
    // });
  });
});

// {
//   "iss": "https://test1.test-aws-aloof-pup-4069.auth0c.com/",
//   "client_id": "wAhB6ROk321a2I3WKWK6OOpGTiBBauLV",
//   "redirect_uri": "https://manage.test-aws-aloof-pup-4069.auth0c.com/tester/callback?connection=test1",
//   "response_type": "code",
//   "response_mode": "",
//   "scope": "openid profile phone",
//   "state": "",
//   "nonce": "",
//   "audience": "",
//   "link_account_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHw2N2QxOGZjNDNiYjA1NzllYmZmMzYyNDIiLCJlbWFpbCI6ImJlbjFAYWNtZS5jb20iLCJiYXNlIjoiaHR0cHM6Ly90ZXN0MS50ZXN0LWF3cy1hbG9vZi1wdXAtNDA2OS5hdXRoMGMuY29tL2FwaS92MiIsImlhdCI6MTc0MTc4NzE4NSwiZXhwIjoxNzQxNzg3NDg1LCJhdWQiOiI5RmFESWdqQ3VtY1d3VXRlOGlvYzM4ZlMwbGZxcVY4MyIsImlzcyI6Imh0dHBzOi8vdGVzdDEudGVzdC1hd3MtYWxvb2YtcHVwLTQwNjkuYXV0aDBjLmNvbS8ifQ.vIT6AvAJ4-1vJzipTuCJ8A4WSzACO0XlahZ7CVuKwks",
//   "prevent_sign_up": true,
//   "connection": "Username-Password-Authentication"
// }

// https://test1.test-aws-aloof-pup-4069.auth0c.com/authorize?client_id=wAhB6ROk321a2I3WKWK6OOpGTiBBauLV&redirect_uri=https%3A%2F%2Fmanage.test-aws-aloof-pup-4069.auth0c.com%2Ftester%2Fcallback%3Fconnection%3Dtest1&response_type=code&scope=openid%20profile%20phone&link_account_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHw2N2QxOGZjNDNiYjA1NzllYmZmMzYyNDIiLCJlbWFpbCI6ImJlbjFAYWNtZS5jb20iLCJiYXNlIjoiaHR0cHM6Ly90ZXN0MS50ZXN0LWF3cy1hbG9vZi1wdXAtNDA2OS5hdXRoMGMuY29tL2FwaS92MiIsImlhdCI6MTc0MTc4NzE4NSwiZXhwIjoxNzQxNzg3NDg1LCJhdWQiOiI5RmFESWdqQ3VtY1d3VXRlOGlvYzM4ZlMwbGZxcVY4MyIsImlzcyI6Imh0dHBzOi8vdGVzdDEudGVzdC1hd3MtYWxvb2YtcHVwLTQwNjkuYXV0aDBjLmNvbS8ifQ.vIT6AvAJ4-1vJzipTuCJ8A4WSzACO0XlahZ7CVuKwks&prevent_sign_up=true&connection=Username-Password-Authentication



// {
//   "iss": "https://test1.test-aws-aloof-pup-4069.auth0c.com/",
//   "client_id": "wAhB6ROk321a2I3WKWK6OOpGTiBBauLV",
//   "redirect_uri": "https://manage.test-aws-aloof-pup-4069.auth0c.com/tester/callback?connection=test1",
//   "response_type": "code",
//   "response_mode": "",
//   "scope": "openid profile phone",
//   "state": "",
//   "nonce": "",
//   "audience": "",
//   "link_account_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHw2N2QxOTMxOTNiYjA1NzllYmZmMzYyNGMiLCJlbWFpbCI6ImJlbjFAYWNtZS5jb20iLCJiYXNlIjoiaHR0cHM6Ly90ZXN0MS50ZXN0LWF3cy1hbG9vZi1wdXAtNDA2OS5hdXRoMGMuY29tL2FwaS92MiIsImlhdCI6MTc0MTc4ODA3NywiZXhwIjoxNzQxNzg4Mzc3LCJhdWQiOiJBT1o2b29HSnd4Zk5SZmFYTUJzalBVWHE2bEVvM3Z1UCIsImlzcyI6Imh0dHBzOi8vdGVzdDEudGVzdC1hd3MtYWxvb2YtcHVwLTQwNjkuYXV0aDBjLmNvbS8ifQ.Ki34K1zwH4GU9Ek_vhNoWagJ-K-nzst6wFLeTU4BXYU",
//   "prevent_sign_up": true,
//   "connection": "Username-Password-Authentication"
// }

// https://test1.test-aws-aloof-pup-4069.auth0c.com/authorize?client_id=wAhB6ROk321a2I3WKWK6OOpGTiBBauLV&redirect_uri=https%3A%2F%2Fmanage.test-aws-aloof-pup-4069.auth0c.com%2Ftester%2Fcallback%3Fconnection%3Dtest1&response_type=code&scope=openid%20profile%20phone&link_account_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHw2N2QxOTMxOTNiYjA1NzllYmZmMzYyNGMiLCJlbWFpbCI6ImJlbjFAYWNtZS5jb20iLCJiYXNlIjoiaHR0cHM6Ly90ZXN0MS50ZXN0LWF3cy1hbG9vZi1wdXAtNDA2OS5hdXRoMGMuY29tL2FwaS92MiIsImlhdCI6MTc0MTc4ODA3NywiZXhwIjoxNzQxNzg4Mzc3LCJhdWQiOiJBT1o2b29HSnd4Zk5SZmFYTUJzalBVWHE2bEVvM3Z1UCIsImlzcyI6Imh0dHBzOi8vdGVzdDEudGVzdC1hd3MtYWxvb2YtcHVwLTQwNjkuYXV0aDBjLmNvbS8ifQ.Ki34K1zwH4GU9Ek_vhNoWagJ-K-nzst6wFLeTU4BXYU&prevent_sign_up=true&connection=Username-Password-Authentication

// "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHw2N2QxOTMxOTNiYjA1NzllYmZmMzYyNGMiLCJlbWFpbCI6ImJlbjFAYWNtZS5jb20iLCJiYXNlIjoiaHR0cHM6Ly90ZXN0MS50ZXN0LWF3cy1hbG9vZi1wdXAtNDA2OS5hdXRoMGMuY29tL2FwaS92MiIsImlhdCI6MTc0MTc4ODA3NywiZXhwIjoxNzQxNzg4Mzc3LCJhdWQiOiJBT1o2b29HSnd4Zk5SZmFYTUJzalBVWHE2bEVvM3Z1UCIsImlzcyI6Imh0dHBzOi8vdGVzdDEudGVzdC1hd3MtYWxvb2YtcHVwLTQwNjkuYXV0aDBjLmNvbS8ifQ.Ki34K1zwH4GU9Ek_vhNoWagJ-K-nzst6wFLeTU4BXYU": childtoken validate token
// {"header":{"alg":"HS256","typ":"JWT"},"payload":{"sub":"auth0|67d193193bb0579ebff3624c","email":"ben1@acme.com","base":"https://test1.test-aws-aloof-pup-4069.auth0c.com/api/v2","iat":1741788077,"exp":1741788377,"aud":"AOZ6ooGJwxfNRfaXMBsjPUXq6lEo3vuP","iss":"https://test1.test-aws-aloof-pup-4069.auth0c.com/"},"signature":"Ki34K1zwH4GU9Ek_vhNoWagJ-K-nzst6wFLeTU4BXYU"}: decoded validate token
