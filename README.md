# jwks-rsa

[![NPM version][npm-image]][npm-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

A library to retrieve RSA signing keys from a JWKS (JSON Web Key Set) endpoint.

> npm install --save jwks-rsa

## Usage

You'll provide the client with the JWKS endpoint which exposes your signing keys. Using the `getSigningKey` you can then get the signing key that matches a specific `kid`.

```js
const jwksClient = require('jwks-rsa');

// options may be omitted for extracting keys from object
const client = jwksClient({
  strictSsl: true, // Default value
  jwksUri: 'https://sandrino.auth0.com/.well-known/jwks.json',
  requestHeaders: {}, // Optional
  requestAgentOptions: {} // Optional
});

const jwksObject = {
  "keys": [
    {
      "alg": "RS256",
      "kty": "RSA",
      "use": "sig",
      "n": "vqNYBKQeFfPlSDq3kGxgGtcMiCta7Tl_eirZ8T7knlEQomJjQN1z4p1rfhnA6m2dSh5_cnAo8MByRMlAO6DB401k_A6YUxEqPjGoSnESQhfwL7MezjVDrHnhlnLTFT5a9MZx2PPJlNn-HSI5iKyzAVBP-zrvnS1kbQE4G1nmpL_zS2ZYfvEWK2B7B1a14loBIT947Woy102yn1_E603lT-lkNTIWbdhF85w4PNWqnfA7P51wpvtx1k3XURgZk6SMR6Slx53McKj0fho6Z0oKnK2ov_0VeiKFwEyDf2zU5bdx_B-B_n-S84l1ypHg-gBNBN-wNWh4xZUHhcsZHpILmQ",
      "e": "AQAB",
      "kid": "RkI5MjI5OUY5ODc1N0Q4QzM0OUYzNkVGMTJDOUEzQkFCOTU3NjE2Rg",
      "x5t": "RkI5MjI5OUY5ODc1N0Q4QzM0OUYzNkVGMTJDOUEzQkFCOTU3NjE2Rg",
      "x5c": ["MIIDDTCCAfWgAwIBAgIJAJVkuSv2H8mDMA0GCSqGSIb3DQEBBQUAMB0xGzAZBgNVBAMMEnNhbmRyaW5vLmF1dGgwLmNvbTAeFw0xNDA1MTQyMTIyMjZaFw0yODAxMjEyMTIyMjZaMB0xGzAZBgNVBAMMEnNhbmRyaW5vLmF1dGgwLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAL6jWASkHhXz5Ug6t5BsYBrXDIgrWu05f3oq2fE+5J5REKJiY0Ddc+Kda34ZwOptnUoef3JwKPDAckTJQDugweNNZPwOmFMRKj4xqEpxEkIX8C+zHs41Q6x54ZZy0xU+WvTGcdjzyZTZ/h0iOYisswFQT/s6750tZG0BOBtZ5qS/80tmWH7xFitgewdWteJaASE/eO1qMtdNsp9fxOtN5U/pZDUyFm3YRfOcODzVqp3wOz+dcKb7cdZN11EYGZOkjEekpcedzHCo9H4aOmdKCpytqL/9FXoihcBMg39s1OW3cfwfgf5/kvOJdcqR4PoATQTfsDVoeMWVB4XLGR6SC5kCAwEAAaNQME4wHQYDVR0OBBYEFHDYn9BQdup1CoeoFi0Rmf5xn/W9MB8GA1UdIwQYMBaAFHDYn9BQdup1CoeoFi0Rmf5xn/W9MAwGA1UdEwQFMAMBAf8wDQYJKoZIhvcNAQEFBQADggEBAGLpQZdd2ICVnGjc6CYfT3VNoujKYWk7E0shGaCXFXptrZ8yaryfo6WAizTfgOpQNJH+Jz+QsCjvkRt6PBSYX/hb5OUDU2zNJN48/VOw57nzWdjI70H2Ar4oJLck36xkIRs/+QX+mSNCjZboRwh0LxanXeALHSbCgJkbzWbjVnfJEQUP9P/7NGf0MkO5I95C/Pz9g91y8gU+R3imGppLy9Zx+OwADFwKAEJak4JrNgcjHBQenakAXnXP6HG4hHH4MzO8LnLiKv8ZkKVL67da/80PcpO0miMNPaqBBMd2Cy6GzQYE0ag6k0nk+DMIFn7K+o21gjUuOEJqIbAvhbf2KcM="]
    }
  ]
}
const kid = 'RkI5MjI5OUY5ODc1N0Q4QzM0OUYzNkVGMTJDOUEzQkFCOTU3NjE2Rg';

client.extractSigningKey(jwksObject, kid, (err, key) => {
  const signingKey = key.publicKey || key.rsaPublicKey

  // Now I can use this to configure my Express or Hapi middleware
});

client.getSigningKey(kid, (err, key) => {
  const signingKey = key.publicKey || key.rsaPublicKey;

  // Now I can use this to configure my Express or Hapi middleware
});
```

Integrations are also provided with:

 - [express/express-jwt](examples/express-demo)
 - [express/passport-jwt](examples/passport-demo)
 - [hapi/hapi-auth-jwt2](examples/hapi-demo)
 - [koa/koa-jwt](examples/koa-demo)

### Caching

In order to prevent a call to be made each time a signing key needs to be retrieved you can also configure a cache as follows. If a signing key matching the `kid` is found, this will be cached and the next time this `kid` is requested the signing key will be served from the cache instead of calling back to the JWKS endpoint.

```js
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  cache: true,
  cacheMaxEntries: 5, // Default value
  cacheMaxAge: ms('10h'), // Default value
  jwksUri: 'https://sandrino.auth0.com/.well-known/jwks.json'
});

const kid = 'RkI5MjI5OUY5ODc1N0Q4QzM0OUYzNkVGMTJDOUEzQkFCOTU3NjE2Rg';
client.getSigningKey(kid, (err, key) => {
  const signingKey = key.publicKey || key.rsaPublicKey;

  // Now I can use this to configure my Express or Hapi middleware
});
```

### Rate Limiting

Even if caching is enabled the library will call the JWKS endpoint if the `kid` is not available in the cache, because a key rotation could have taken place. To prevent attackers to send many random `kid`s you can also configure rate limiting. This will allow you to limit the number of calls that are made to the JWKS endpoint per minute (because it would be highly unlikely that signing keys are rotated multiple times per minute).

```js
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10, // Default value
  jwksUri: 'https://sandrino.auth0.com/.well-known/jwks.json'
});

const kid = 'RkI5MjI5OUY5ODc1N0Q4QzM0OUYzNkVGMTJDOUEzQkFCOTU3NjE2Rg';
client.getSigningKey(kid, (err, key) => {
  const signingKey = key.publicKey || key.rsaPublicKey;

  // Now I can use this to configure my Express or Hapi middleware
});
```

### Using AgentOptions for TLS/SSL Configuration

The `requestAgentOptions` property can be used to configure SSL/TLS options. An
example use case is providing a trusted private (i.e. enterprise/corporate) root
certificate authority to establish TLS communication with the `jwks_uri`.

```js
const jwksClient = require("jwks-rsa");
const client = jwksClient({
  strictSsl: true, // Default value
  jwksUri: 'https://my-enterprise-id-provider/.well-known/jwks.json',
  requestHeaders: {}, // Optional
  requestAgentOptions: {
    ca: fs.readFileSync(caFile)
  }
});
```

For more information, see [the NodeJS request library `agentOptions`
documentation](https://github.com/request/request#using-optionsagentoptions).

## Running Tests

```
npm run test
```

## Showing Trace Logs

To show trace logs you can set the following environment variable:

```
DEBUG=jwks
```

Output:

```
jwks Retrieving keys from http://my-authz-server/.well-known/jwks.json +5ms
jwks Keys: +8ms [ { alg: 'RS256',
  kty: 'RSA',
  use: 'sig',
  x5c: [ 'pk1' ],
  kid: 'ABC' },
{ alg: 'RS256', kty: 'RSA', use: 'sig', x5c: [], kid: '123' } ]
```

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.

[npm-image]: https://img.shields.io/npm/v/jwks-rsa.svg?style=flat-square
[npm-url]: https://npmjs.org/package/jwks-rsa
[license-image]: http://img.shields.io/npm/l/jwks-rsa.svg?style=flat-square
[license-url]: #license
[downloads-image]: http://img.shields.io/npm/dm/jwks-rsa.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/jwks-rsa
