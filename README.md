# @vafast/compress

Vafast 响应压缩中间件：根据客户端 `Accept-Encoding` 压缩响应体，支持 **Brotli / gzip / deflate**。

导出名是 **`compression`**（不是 `compress`）。

## 先搞清几个概念

- **协商**：用配置的 `encodings` 顺序与 `Accept-Encoding`（按 `, ` 拆分）求交，取第一个；无交集或不带头则不压缩。
- **threshold**：缓冲响应小于该字节数（默认 1024）不压缩。
- **level / quality**：`zlibOptions.level`（默认 6）控制 gzip/deflate；Brotli 用 `BROTLI_PARAM_QUALITY`（默认 Node 默认质量）。越高越省体积、越费 CPU。
- **compressStream**：运行时默认 **`true`**（会压缩 `ReadableStream`）。类型文件 JSDoc 仍写 `@default false`，以运行为准。SSE 建议设 `false`。

## 安装

```bash
npm install @vafast/compress
```

## 快速开始

```typescript
import { Server, defineRoute, defineRoutes, json, serve } from 'vafast'
import { compression } from '@vafast/compress'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => json({ message: 'Hello '.repeat(200) }),
  }),
])

const server = new Server(routes)
server.use(compression())
serve({ fetch: server.fetch, port: 3000 })
```

## 用法

```typescript
// 只启用 gzip，提高阈值；关闭流压缩（适合 SSE）
server.use(
  compression({
    encodings: ['gzip', 'deflate'],
    threshold: 2048,
    compressStream: false,
    zlibOptions: { level: 6 },
    TTL: 3600,
  }),
)
```

请求带 `x-no-compression` 且 `disableByHeader` 为默认 `true` 时跳过压缩。

## API

### 导出

| 导出 | 说明 |
|------|------|
| `compression` / `default` | 中间件工厂 |
| `CompressionStream` | 流式压缩 Transform 封装 |
| 相关类型 | `CompressionOptions`、`CompressionEncoding` 等 |

### 选项摘要

| 选项 | 默认 | 说明 |
|------|------|------|
| `encodings` | `['br', 'gzip', 'deflate']` | 与 `Accept-Encoding` 求交后取第一个 |
| `threshold` | `1024` | 小于该字节数不压缩（缓冲路径） |
| `disableByHeader` | `true` | 请求带 `x-no-compression` 则跳过 |
| `compressStream` | **运行时 `true`** | 是否压缩 `ReadableStream`；SSE 建议 `false` |
| `brotliOptions` / `zlibOptions` | 内置 | 传给 Node `zlib` |
| `TTL` | `86400` | 压缩结果内存缓存秒数（非流式） |
| `as` | `'after'` | 类型保留，**当前未使用** |

仅压缩 `response.ok`（200–299）的响应。

## 最佳实践

1. JSON / HTML 全局开启；SSE 设 `compressStream: false`
2. 用 `threshold` 跳过过小响应
3. CPU 紧张时可降低 Brotli quality 或只用 gzip
4. 注意 `TTL` 进程内缓存的内存占用

## 注意事项

- `Accept-Encoding` 按 `, ` 拆分，不做 `q` 权重解析
- 缓冲路径会检查可压缩 Content-Type；无 Content-Type 视为可压
- 流式路径不检查 threshold / Content-Type 正则
- 依赖 Node `zlib` / `crypto`

## 相关链接

- 完整文档：[Compress 中间件](https://vafast.huyooo.com/middleware/compress.html)（仓库内 `vafast-doc/docs/middleware/compress.md`）
- [MDN: Accept-Encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding)
- [Node.js zlib](https://nodejs.org/api/zlib.html)

## License

MIT
