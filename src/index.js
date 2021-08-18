import { Router } from 'itty-router'
import * as utils from './utils'

// Create a new router
const router = Router()

/*
 * Index route
 */
router.get('/', () => {
  return new Response(null, {
    headers: { Location: 'https://streamcord.io/twitch/' },
    status: 302
  })
})

/*
 * Create a new analytics link
 */
router.post('/api/links', async request => {
  // Check for proper authorization
  if (request.headers.get('Authorization') !== AUTHORIZATION_TOKEN) {
    return new Response('403 Forbidden', { status: 403 })
  }

  const body = await request.json()
  // Enforce lowercase
  if (body.streamer === undefined) {
    return new Response(`'streamer' is required`, { status: 400 })
  }
  body.streamer = body.streamer.toLowerCase()

  const id = await utils.makeUniqueID(body.streamer, 8)

  // Since this is an internal endpoint, we're going to trust that all the fields are valid
  const doc = JSON.stringify({
    created_at: new Date().toISOString(),
    source: {
      channel: body.channel_id,
      guild: body.guild_id,
      notification: body.notification_id
    },
    stream: {
      game: body.stream_game,
      title: body.stream_title
    },
    total_clicks: 0
  })

  await LINKS.put(`links:${body.streamer}:${id}`, doc)

  const res = JSON.stringify({
    uri: `https://streamcord.tv/link/${body.streamer}/${id}`
  })

  return new Response(res, {
    headers: { 'Content-Type': 'application/json' },
    status: 201
  })
})

/*
 * Get details on a link by its ID
 */
router.get('/api/links/:streamer/:id/clicks', async request => {
  const id = request.params.id
  const streamer = request.params.streamer.toLowerCase()

  // Find the link from KV
  const link = await LINKS.get(`links:${streamer}:${id}`, {type: 'json'})
  if (!link) {
    return new Response('404 Link Not Found', { status: 404 })
  }

  // Get a cursor if one was provided
  const url = new URL(request.url)
  const cursor = url.searchParams.get('cursor')

  const listOp = await CLICKS.list({
    cursor,
    limit: 50,
    prefix: `links:${streamer}:${id}:clicks:`
  })

  const clicks = []
  for (const click of listOp.keys) {
    clicks.push(
        await CLICKS.get(click.name, {type: 'json'})
    )
  }

  const res = JSON.stringify({
    cursor: listOp.list_complete ? null : listOp.cursor,
    results: clicks,
    total: link.total_clicks
  })

  return new Response(res, {
    headers: { 'Content-Type': 'application/json' }
  })
})

/*
 * Main analytics endpoint - validate the link, record the user's geolocation info, and redirect them to Twitch
 */
router.get('/link/:streamer/:id', async request => {
  const id = request.params.id
  const streamer = request.params.streamer.toLowerCase()

  // Find the link from KV
  const link = await LINKS.get(`links:${streamer}:${id}`, {type: 'json'})

  if (!link) {
    return new Response('404 Link Not Found', { status: 404 })
  }

  // update the total click count
  link.total_clicks++
  await LINKS.put(`links:${streamer}:${id}`, JSON.stringify(link))

  // Get information about the requester
  const click = JSON.stringify({
    at: new Date().toISOString(),
    geo: {
      continent: request.cf.continent,
      country: request.cf.country,
      region: request.cf.region,
      region_code: request.cf.regionCode,
      timezone: request.cf.timezone
    },
    user_agent: request.headers.get('User-Agent')
  })
  const clickId = utils.cyrb53(click)

  await CLICKS.put(`links:${streamer}:${id}:clicks:${clickId}`, click, {expirationTtl: 2592000})

  return new Response(null, {
    headers: {
      'Location': `https://twitch.tv/${streamer}`,
      'X-Click-ID': clickId
    },
    status: 302
  })
})

/*
 * Handle 404s
 */
router.all('*', () => new Response('404 Not Found', { status: 404 }))

addEventListener('fetch', e => {
  e.respondWith(router.handle(e.request))
})
