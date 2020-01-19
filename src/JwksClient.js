import debug from 'debug';
import request from 'request';

import ArgumentError from './errors/ArgumentError';
import JwksError from './errors/JwksError';
import SigningKeyNotFoundError from './errors/SigningKeyNotFoundError';

import {
  certToPEM,
  rsaPublicKeyToPEM
} from './utils';
import {
  cacheSigningKey,
  rateLimitSigningKey
} from './wrappers';

export class JwksClient {
  constructor(options) {
    this.options = {
      rateLimit: false,
      cache: false,
      strictSsl: true,
      ...options
    };
    this.logger = debug('jwks');

    // Initialize wrappers.
    if (this.options.rateLimit) {
      this.getSigningKey = rateLimitSigningKey(this, options);
    }
    if (this.options.cache) {
      this.getSigningKey = cacheSigningKey(this, options);
    }
  }

  _convertKeys = (keys, cb) => {
    const signingKeys = keys.filter((key) => {
      if(key.kty !== 'RSA'){
        return false;
      }
      if(!key.kid){
        return false;
      }
      if(key.hasOwnProperty('use') && key.use !== 'sig'){
        return false;
      }
      return ((key.x5c && key.x5c.length) || (key.n && key.e));
    })
    .map(key => {
      if (key.x5c && key.x5c.length) {
        return {
          kid: key.kid,
          nbf: key.nbf,
          publicKey: certToPEM(key.x5c[0])
        };
      } else {
        return {
          kid: key.kid,
          nbf: key.nbf,
          rsaPublicKey: rsaPublicKeyToPEM(key.n, key.e)
        };
      }
    })

    if (!signingKeys.length) {
      return cb(new JwksError('The JWKS endpoint did not contain any signing keys'));
    }

    this.logger('Signing Keys:', signingKeys);

    cb(null, signingKeys)
  }

  extractSigningKey({ keys }, kid, cb) {
    return this._convertKeys(keys, (err, signingKeys) => {
      if (err) {
        return cb(err)
      }

      if (!kid) {
        return cb(new ArgumentError('The kid must not be empty'))
      }

      this.logger(`Extracting signing key for '${kid}'`);

      return cb(null, signingKeys.find(k => k.kid === kid))
    })
  }

  extractSigningKeys({ keys }, cb) {
    return this._convertKeys(keys, (err, signingKeys) => {
      if (err) {
        return cb(err)
      }

      this.logger(`Extracting all signing keys`);

      return cb(null, signingKeys)
    })
  }

  getKeys(cb) {
    this.logger(`Fetching keys from '${this.options.jwksUri}'`);
    request({
      json: true,
      uri: this.options.jwksUri,
      strictSSL: this.options.strictSsl,
      headers: this.options.requestHeaders,
      agentOptions: this.options.requestAgentOptions
    }, (err, res) => {
      if (err || res.statusCode < 200 || res.statusCode >= 300) {
        this.logger('Failure:', res && res.body || err);
        if (res) {
          return cb(new JwksError(res.body && (res.body.message || res.body) || res.statusMessage || `Http Error ${res.statusCode}`));
        }
        return cb(err);
      }

      this.logger('Keys:', res.body.keys);
      return cb(null, res.body.keys);
    });
  }

  getSigningKeys(cb) {
    this.getKeys((err0, keys) => {
      if (err0) {
        return cb(err0);
      }

      if (!keys || !keys.length) {
        return cb(new JwksError('The JWKS endpoint did not contain any keys'));
      }

      this._convertKeys(keys, (err1, signingKeys) => {
        if (err1) {
          return cb(err1);
        }

        return cb(null, signingKeys);
      })
    });
  }

  getSigningKey = (kid, cb) => {
    this.logger(`Fetching signing key for '${kid}'`);

    this.getSigningKeys((err, keys) => {
      if (err) {
        return cb(err);
      }

      const key = keys.find(k => k.kid === kid);

      if (key) {
        return cb(null, key);
      } else {
        this.logger(`Unable to find a signing key that matches '${kid}'`);
        return cb(new SigningKeyNotFoundError(`Unable to find a signing key that matches '${kid}'`));
      }
    });
  }
}
