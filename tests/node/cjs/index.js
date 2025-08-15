/* eslint-disable */
if ('Bun' in globalThis) {
  throw new Error('❌ Use Node.js to run this test!')
}

const { compression } = require('@vafast/compress')

if (typeof compression !== 'function') {
  throw new Error('❌ CommonJS Node.js failed')
}

console.log('✅ CommonJS Node.js works!')
