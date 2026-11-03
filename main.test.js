const assert = require('assert')
const main = require('./main')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { once } = require('events')

describe('methods in server.js', () => {
  it('has serveNcmApi', () => {
    assert.strictEqual(typeof main.serveNcmApi, 'function')
  })

  it('has getModulesDefinitions', () => {
    assert.strictEqual(typeof main.getModulesDefinitions, 'function')
  })
})

describe('methods in module', () => {
  it('has activate_init_profile', () => {
    assert.strictEqual(typeof main.activate_init_profile, 'function')
  })
})

describe('HTTP route discovery', () => {
  let modulesPath

  beforeEach(() => {
    modulesPath = fs.mkdtempSync(path.join(os.tmpdir(), 'scopify-routes-'))
    const nestedPath = path.join(modulesPath, '(personal)', '(nested)')
    fs.mkdirSync(nestedPath, { recursive: true })
    const handler =
      'module.exports = async () => ({ status: 200, body: { code: 200 }, cookie: [] })'
    fs.writeFileSync(path.join(modulesPath, 'inner_version.js'), handler)
    fs.writeFileSync(path.join(nestedPath, 'personalized.js'), handler)
    fs.writeFileSync(path.join(nestedPath, 'personal_fm.js'), handler)
    fs.writeFileSync(path.join(nestedPath, 'README.md'), 'Not a route')
  })

  afterEach(() => {
    fs.rmSync(modulesPath, { recursive: true, force: true })
  })

  it('discovers grouped modules without adding directory names to URLs', async () => {
    const definitions = await main.getModulesDefinitions(
      modulesPath,
      { 'personal_fm.js': '/personal_fm' },
      false,
    )
    assert.deepStrictEqual(definitions.map(({ route }) => route).sort(), [
      '/inner/version',
      '/personal_fm',
      '/personalized',
    ])
    for (const definition of definitions) {
      assert.strictEqual(typeof definition.module, 'string')
      assert.ok(fs.existsSync(definition.module))
    }
  })

  it('serves grouped handlers at their existing public URLs', async () => {
    const definitions = await main.getModulesDefinitions(modulesPath, {
      'personal_fm.js': '/personal_fm',
    })
    const app = await main.serveNcmApi({
      checkVersion: false,
      host: '127.0.0.1',
      port: '0',
      moduleDefs: definitions,
    })
    const server = app.server
    try {
      if (!server.listening) await once(server, 'listening')
      const origin = `http://127.0.0.1:${server.address().port}`
      for (const route of ['/inner/version', '/personalized', '/personal_fm']) {
        const response = await fetch(origin + route)
        assert.strictEqual(response.status, 200, route)
        assert.deepStrictEqual(await response.json(), { code: 200 })
      }
    } finally {
      await new Promise((resolve) => server.close(resolve))
    }
  })

  it('registers production routes from the actual module tree', async () => {
    const definitions = await main.getModulesDefinitions(
      path.join(__dirname, 'module'),
      undefined,
      false,
    )
    const routes = new Set(definitions.map(({ route }) => route))
    for (const route of [
      '/inner/version',
      '/personalized',
      '/login/status',
      '/toplist/detail',
      '/playlist/detail',
    ]) {
      assert.ok(routes.has(route), 'Missing route: ' + route)
    }
    assert.strictEqual(routes.size, definitions.length, 'Duplicate routes')
  })
})
