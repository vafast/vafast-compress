import type { Middleware } from 'vafast'
import type { BrotliOptions, ZlibOptions } from 'node:zlib'
export type CompressionEncoding = 'br' | 'deflate' | 'gzip'

export type CompressionOptions = {
  /**
   * The options use for brotli compression.
   *
   * @see https://nodejs.org/api/zlib.html#compressor-options
   */
  brotliOptions?: BrotliOptions

  /**
   * The options use for gzip or deflate compression.
   *
   * @see https://nodejs.org/api/zlib.html#class-options
   */
  zlibOptions?: ZlibOptions

  /**
   * The encodings to use.
   *
   * By default, we prioritize compression using
   * 1. br
   * 2. gzip
   * 3. deflate
   * If an unsupported encoding is received or if the 'accept-encoding' header is missing,
   * it will not compress the payload.
   *
   * You can change that by passing an array of compression tokens to the encodings option
   * example: `encodings: ['gzip', 'deflate']`
   */
  encodings?: CompressionEncoding[]

  /**
   * You can disable the compression by using `x-no-compression` header in request
   *
   * By default, we will not compress the payload if the 'x-no-compression' header is present
   *
   * @default true
   */
  disableByHeader?: boolean

  /**
   * The minimum byte size for a response to be compressed.
   *
   * Defaults to 1024.
   * @default 1024
   */
  threshold?: number

  /**
   * Whether to compress the stream data or not.
   * This generally refers to Server-Sent-Events
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
   * Defaults to `false`
   * @default false
   */
  compressStream?: boolean
}

export type LifeCycleOptions = {
  /**
   * Middleware execution order and scope.
   *
   * @default 'after'
   */
  as?: 'before' | 'after'
}

export type CacheOptions = {
  /**
   * The time-to-live in seconds for the cache.
   *
   * @default 86400 (24 hours)
   */
  TTL?: number
}

export type ElysiaCompressionOptions = CompressionOptions &
  LifeCycleOptions &
  CacheOptions
