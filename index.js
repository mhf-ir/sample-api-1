// @ts-check
const fs = require('fs');
const fastify = require('fastify');
const multipart = require('fastify-multipart');
const openApi = require('fastify-oas');
const cookie = require('fastify-cookie');
const formbody = require('fastify-formbody');
const pump = require('pump');

(async () => {
  const appHttp = fastify({
    trustProxy: true,
  });

  const appHttps = fastify({
    trustProxy: true,
    https: {
      allowHTTP1: true,
      key: fs.readFileSync(`${__dirname}/cert/server-key.pem`),
      cert: fs.readFileSync(`${__dirname}/cert/server.pem`),
    },
  });

  [appHttp, appHttps].forEach((app, i) => {
    let endPoint = 'http://127.0.0.1:10000/';
    if (i === 1) {
      endPoint = 'https://127.0.0.1:10001/';
    }
    app.addHook('onRequest', async (req) => {
      // @ts-ignore
      req.requestTime = Date.now();
    });

    app.addHook('onSend', async (req, reply) => {
      reply.header(
        'Server-Timing',
        // @ts-ignore
        `test-api;dur=${Date.now() - req.requestTime}`,
      );
    });

    // @ts-ignore
    app.register(multipart);

    app.register(formbody);
    app.register(cookie);

    app.register(openApi, {
      exposeRoute: true,
      routePrefix: '/docs',
      swagger: {
        info: {
          title: 'Test openapi',
          description: 'testing the fastify swagger api',
          version: '0.1.0',
        },
        consumes: ['application/json', 'multipart/form-data'], // app-wide default media-type
        produces: ['application/json'], // app-wide default media-type
        servers: [
          {
            url: endPoint,
            description: 'Sample server',
          },
        ],
        components: {
          // see https://github.com/OAI/OpenAPI-Specification/blob/OpenAPI.next/versions/3.0.0.md#componentsObject for more options
          securitySchemes: {
            BasicAuth: {
              type: 'http',
              scheme: 'basic',
            },
            cookieKey: {
              type: 'apiKey',
              name: 'api_key',
              in: 'cookie',
            },
            apiKey: {
              type: 'apiKey',
              name: 'api_key',
              in: 'header',
            },
          },
        },
      },
    });

    app.route({
      url: '/GET1',
      method: 'GET',
      schema: {
        querystring: {
          foo: {
            type: 'string',
            example: 'bar',
          },
        },
        security: [
          {
            BasicAuth: [],
            cookieKey: [],
            apiKey: [],
          },
        ],
      },
      handler: async (req, reply) => {
        reply.send({
          method: req.raw.method,
          cookies: req.cookies,
          headers: req.headers,
          query: req.query,
        });
      },
    });

    app.route({
      url: '/POST1',
      method: 'POST',
      schema: {
        body: {
          type: 'object',
          properties: {
            zoo: {
              type: 'string',
              example: 'cat',
            },
          },
        },
        querystring: {
          foo: {
            type: 'string',
            example: 'bar',
          },
        },
        security: [
          {
            BasicAuth: [],
            cookieKey: [],
            apiKey: [],
          },
        ],
      },
      handler: async (req, reply) => {
        reply.send({
          method: req.raw.method,
          body: req.body,
          cookies: req.cookies,
          headers: req.headers,
          query: req.query,
        });
      },
    });

    app.route({
      url: '/POST2',
      method: 'POST',
      schema: {
        consumes: ['application/x-www-form-urlencoded'],
        body: {
          type: 'object',
          properties: {
            zoo: {
              type: 'string',
              example: 'cat',
            },
          },
        },
        querystring: {
          foo: {
            type: 'string',
            example: 'bar',
          },
        },
        security: [
          {
            BasicAuth: [],
            cookieKey: [],
            apiKey: [],
          },
        ],
      },
      handler: async (req, reply) => {
        reply.send({
          method: req.raw.method,
          body: req.body,
          cookies: req.cookies,
          headers: req.headers,
          query: req.query,
        });
      },
    });

    app.route({
      url: '/FILE1',
      method: 'POST',
      handler: async (req, reply) => {
        const d = `/tmp/tmp-upload${Date.now()}${Math.random()
          .toString(36)
          .substring(2)}`;
        const handler = (field, file) => {
          pump(file, fs.createWriteStream(d));
        };

        const done = () => {
          reply.send(fs.createReadStream(d));
        };

        req.multipart(handler, done);
      },
    });

    app.ready();
    app.listen(10000 + i, '0.0.0.0');
  });
})();
