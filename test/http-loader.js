import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import { get } from 'node:https'

const fetch = url => new Promise(rs => get(url, rs))
const cache = new URL('./.cache/', import.meta.url)

/**
 * @param {string} specifier
 * @param {{
 *   conditions: !Array<string>,
 *   parentURL: !(string | undefined),
 * }} context
 * @param {Function} defaultResolve
 * @returns {Promise<{ url: string }>}
 */
export async function resolve (specifier, context, defaultResolve) {
  const { parentURL = null } = context

  // Normally Node.js would error on specifiers starting with 'https://', so
  // this hook intercepts them and converts them into absolute URLs to be
  // passed along to the later hooks below.
  if (specifier.startsWith('https://')) {
    return {
      url: specifier
    }
  } else if (parentURL && parentURL.startsWith('https://')) {
    return {
      url: new URL(specifier, parentURL).href
    }
  }

  // Let Node.js handle all other specifiers.
  return defaultResolve(specifier, context, defaultResolve)
}

export async function load (url, context, defaultLoad) {
  // For JavaScript to be loaded over the network, we need to fetch and
  // return it.
  if (url.startsWith('https://')) {
    const uuid = Buffer.from(url).toString('hex')
    const cachedFile = new URL(uuid, cache)
    let data = ''

    // cache remote files for 1h
    if (fs.existsSync(cachedFile) && fs.statSync(cachedFile).mtimeMs > Date.now() - 1000 * 60 * 60) {
      data = fs.readFileSync(cachedFile, 'utf8')
    } else {
      const res = await fetch(url).catch(err => err)
      for await (const chunk of res) data += chunk
      fs.mkdirSync(cache, { recursive: true })
      fs.writeFileSync(cachedFile, data)
    }

    return {
      // This example assumes all network-provided JavaScript is ES module
      // code.
      format: 'module',
      source: data
    }
  }

  // Let Node.js handle all other URLs.
  return defaultLoad(url, context, defaultLoad)
}
