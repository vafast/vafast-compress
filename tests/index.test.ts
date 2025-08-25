import { describe, expect, it } from 'bun:test'
import zlib from 'node:zlib'
import { Server, createRouteHandler } from 'vafast'
import type { Route } from 'vafast'

import { req, responseShort, jsonResponse } from './setup'
import compression from '../src'

describe(`@vafast/compress`, () => {
  it('Dont compress when the threshold is not met', async () => {
    const routes: Route[] = [
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
          return responseShort
        }),
        middleware: [
          compression({
            encodings: ['br'],
            threshold: 1024,
            compressStream: false,
          }),
        ],
      },
    ]
    const server = new Server(routes)
    const res = await server.fetch(req())

    expect(res.headers.get('Content-Encoding')).toBeNull()
    expect(res.headers.get('vary')).toBeNull()
  })

  it('handle brotli compression', async () => {
    const routes: Route[] = [
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
          return responseShort
        }),
        middleware: [
          compression({
            encodings: ['br'],
            threshold: 1,
            compressStream: false,
          }),
        ],
      },
    ]
    const server = new Server(routes)
    const res = await server.fetch(req())

    expect(res.headers.get('Content-Encoding')).toBe('br')
    expect(res.headers.get('vary')).toBe('accept-encoding')
  })

  it('handle deflate compression', async () => {
    const routes: Route[] = [
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
          return responseShort
        }),
        middleware: [
          compression({
            encodings: ['deflate'],
            threshold: 1,
            compressStream: false,
          }),
        ],
      },
    ]
    const server = new Server(routes)
    const res = await server.fetch(req())

    expect(res.headers.get('Content-Encoding')).toBe('deflate')
    expect(res.headers.get('vary')).toBe('accept-encoding')
  })

  it('handle gzip compression', async () => {
    const routes: Route[] = [
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
          return responseShort
        }),
        middleware: [
          compression({
            encodings: ['gzip'],
            threshold: 1,
            compressStream: false,
          }),
        ],
      },
    ]
    const server = new Server(routes)
    const res = await server.fetch(req())

    expect(res.headers.get('Content-Encoding')).toBe('gzip')
    expect(res.headers.get('vary')).toBe('accept-encoding')
  })

  it('accept additional headers', async () => {
    const routes: Route[] = [
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
          return {
            data: responseShort,
            headers: {
              'x-powered-by': '@vafast/compress',
            },
          }
        }),
        middleware: [
          compression({
            encodings: ['deflate'],
            threshold: 1,
            compressStream: false,
          }),
        ],
      },
    ]
    const server = new Server(routes)
    const res = await server.fetch(req())

    expect(res.headers.get('Content-Encoding')).toBe('deflate')
    expect(res.headers.get('x-powered-by')).toBe('@vafast/compress')
    expect(res.headers.get('vary')).toBe('accept-encoding')
  })

  it('return correct plain/text', async () => {
    const routes: Route[] = [
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
          return {
            data: responseShort,
            headers: {
              'Content-Type': '',
            },
          }
        }),
        middleware: [
          compression({
            encodings: ['gzip'],
            threshold: 1,
            compressStream: false,
          }),
        ],
      },
    ]
    const server = new Server(routes)
    const res = await server.fetch(req())

    expect(res.headers.get('Content-Type')).toBe('')
    expect(res.headers.get('vary')).toBe('accept-encoding')
  })

  it('return correct application/json', async () => {
    const routes: Route[] = [
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
          return { hello: 'world' }
        }),
        middleware: [
          compression({
            encodings: ['gzip'],
            threshold: 1,
            compressStream: false,
          }),
        ],
      },
    ]
    const server = new Server(routes)
    const res = await server.fetch(req())

    expect(res.headers.get('Content-Type')).toBe('application/json')
    expect(res.headers.get('vary')).toBe('accept-encoding')
  })

  it('return correct image type', async () => {
    const routes: Route[] = [
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
          return {
            data: 'image content',
            headers: {
              'Content-Type': '',
            },
          }
        }),
        middleware: [
          compression({
            encodings: ['gzip'],
            threshold: 1,
            compressStream: false,
          }),
        ],
      },
    ]
    const server = new Server(routes)
    const res = await server.fetch(req())

    expect(res.headers.get('Content-Type')).toBe('')
    expect(res.headers.get('vary')).toBe('accept-encoding')
  })

  it('must be redirected to /not-found', async () => {
    const routes: Route[] = [
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
          return {
            data: '',
            status: 302,
            headers: {
              Location: '/not-found',
            },
          }
        }),
        middleware: [
          compression({
            encodings: ['gzip'],
            threshold: 1,
            compressStream: false,
          }),
        ],
      },
    ]
    const server = new Server(routes)
    const res = await server.fetch(req())

    expect(res.headers.get('Location')).toBe('/not-found')
  })

  it('cookie should be set', async () => {
    const routes: Route[] = [
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
          return {
            data: '',
            headers: {
              'Set-Cookie': 'test=test',
            },
          }
        }),
        middleware: [
          compression({
            encodings: ['gzip'],
            threshold: 1,
            compressStream: false,
          }),
        ],
      },
    ]
    const server = new Server(routes)
    const res = await server.fetch(req())

    expect(res.headers.get('set-cookie')).toContain('test=test')
  })

  it('stream should be compressed', async () => {
    const routes: Route[] = [
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
          const stream = new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('hello'))
              setTimeout(() => {
                controller.enqueue(new TextEncoder().encode('world'))
                controller.close()
              }, 100)
            },
          })
          return stream
        }),
        middleware: [
          compression({
            encodings: ['gzip'],
            threshold: 1,
            compressStream: true,
          }),
        ],
      },
    ]
    const server = new Server(routes)
    const res = await server.fetch(req())

    expect(res.headers.get('Content-Encoding')).toBe('gzip')
    expect(res.headers.get('vary')).toBe('accept-encoding')
  })

  it(`Should't compress response if threshold is not met minimum size (1024)`, async () => {
    const routes: Route[] = [
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
          return responseShort
        }),
        middleware: [compression({ threshold: 1024, compressStream: false })],
      },
    ]
    const server = new Server(routes)
    const res = await server.fetch(req())

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Encoding')).toBeNull()
    expect(res.headers.get('Vary')).toBeNull()
  })

  it(`Should't compress response if x-no-compression header is present`, async () => {
    const routes: Route[] = [
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
          return responseShort
        }),
        middleware: [
          compression({ disableByHeader: true, compressStream: false }),
        ],
      },
    ]
    const server = new Server(routes)
    const res = await server.fetch(req({ 'x-no-compression': 'true' }))

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Encoding')).toBeNull()
    expect(res.headers.get('Vary')).toBeNull()
  })

  it(`When not compress response send original response`, async () => {
    const routes: Route[] = [
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
          return responseShort
        }),
        middleware: [compression({ threshold: 1024, compressStream: false })],
      },
    ]
    const server = new Server(routes)
    const res = await server.fetch(req())
    const test = await res.text()

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Encoding')).toBeNull()
    expect(res.headers.get('Vary')).toBeNull()
    expect(test).toBe(responseShort)
  })

  it(`When not compress response should send original content-type`, async () => {
    const routes: Route[] = [
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(async () => {
          const content = await jsonResponse.text()
          return {
            data: content,
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
            },
          }
        }),
        middleware: [
          compression({
            threshold: Number.MAX_SAFE_INTEGER,
            compressStream: false,
          }),
        ],
      },
    ]
    const server = new Server(routes)
    const res = await server.fetch(req())
    const test = await res.text()

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Encoding')).toBeNull()
    expect(res.headers.get('Vary')).toBeNull()
    expect(test).toBe(await jsonResponse.text())
    expect(res.headers.get('Content-Type')).toBe(
      'application/json;charset=utf-8',
    )
  })

  it(`Should'nt compress response if browser not support any compression algorithm`, async () => {
    const routes: Route[] = [
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
          return responseShort
        }),
        middleware: [compression({ threshold: 1024, compressStream: false })],
      },
    ]
    const server = new Server(routes)
    const res = await server.fetch(req({ 'accept-encoding': '*' }))

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Encoding')).toBeNull()
    expect(res.headers.get('Vary')).toBeNull()
  })

  it(`Should return data from cache`, async () => {
    const routes: Route[] = [
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
          return responseShort
        }),
        middleware: [compression({ threshold: 0, compressStream: false })],
      },
    ]
    const server = new Server(routes)
    const res = await server.fetch(req())
    const test = zlib
      .brotliDecompressSync(await res.arrayBuffer())
      .toString('utf-8')

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Encoding')).toBe('br')
    expect(res.headers.get('Vary')).toBe('accept-encoding')
    expect(test).toBe(responseShort)

    const res2 = await server.fetch(req())
    const test2 = zlib
      .brotliDecompressSync(await res2.arrayBuffer())
      .toString('utf-8')

    expect(res2.status).toBe(200)
    expect(res2.headers.get('Content-Encoding')).toBe('br')
    expect(res2.headers.get('Vary')).toBe('accept-encoding')
    expect(test2).toBe(responseShort)
    expect(test2).toBe(test)
  })

  it(`Don't append vary header if values are *`, async () => {
    const routes: Route[] = [
      {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
          return {
            data: responseShort,
            headers: {
              Vary: 'location, header',
            },
          }
        }),
        middleware: [compression({ threshold: 0, compressStream: false })],
      },
    ]
    const server = new Server(routes)
    const res = await server.fetch(req())

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Encoding')).toBe('br')
    expect(res.headers.get('Vary')).toBe('location, header, accept-encoding')
  })
})
