import assert from "node:assert/strict"
import test from "node:test"

import { createContentSecurityPolicy } from "../next.config.mjs"

test("development CSP permits React debugging eval", () => {
  const policy = createContentSecurityPolicy({ isDevelopment: true })

  assert.match(
    policy,
    /script-src 'self' 'unsafe-inline' 'unsafe-eval'(?:;|$)/,
  )
})

test("production CSP does not permit eval", () => {
  const policy = createContentSecurityPolicy({ isDevelopment: false })

  assert.match(policy, /script-src 'self' 'unsafe-inline'(?:;|$)/)
  assert.doesNotMatch(policy, /'unsafe-eval'/)
})
