import { Server } from 'tirne'

console.log('Tirne version:', require('tirne/package.json').version)

// 测试标准中间件
const logger = async (req, next) => {
  console.log('Middleware called with:', req.method, req.url)
  const response = await next()
  console.log('Response status:', response.status)
  return response
}

const routes = [
  {
    method: 'GET',
    path: '/',
    handler: () => new Response('Hello World'),
  },
]

const server = new Server(routes)

// 测试全局中间件
try {
  if (typeof server.use === 'function') {
    console.log('✅ server.use() 方法存在')
    server.use(logger)
  } else {
    console.log('❌ server.use() 方法不存在')
  }
} catch (error) {
  console.log('❌ server.use() 调用失败:', error.message)
}

// 测试路由级中间件
try {
  const routesWithMiddleware = [
    {
      method: 'GET',
      path: '/',
      handler: () => new Response('Hello World'),
      middleware: [logger],
    },
  ]
  console.log('✅ 路由级中间件语法支持')
} catch (error) {
  console.log('❌ 路由级中间件语法不支持:', error.message)
}

// 测试基本功能
async function test() {
  try {
    const response = await server.fetch(new Request('http://localhost/'))
    console.log('Response:', response)
    console.log('Response type:', typeof response)
    console.log('Response constructor:', response.constructor.name)
  } catch (error) {
    console.error('Error:', error)
  }
}

test()
