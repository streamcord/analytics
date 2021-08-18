# Analytics

Cloudflare Worker script for tracking basic info about clicks on outbound links

Also known as "Click Analytics" on the Streamcord [documentation site](https://docs.streamcord.io)

### Data tracked from clicks
- Continent
- Country
- Region
- Timestamp of the event
- Total clicks received for a specific link

## Prerequisites

- Cloudflare account with attached domain
- Wrangler CLI
- A valid [wrangler.toml](https://developers.cloudflare.com/workers/learning/getting-started#7-configure-your-project-for-deployment) file

## Setup & publishing

Use `wrangler publish` to publish your worker to Cloudflare
