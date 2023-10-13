# Cloudflare worker for dynamic DNS (DynDNS) updates from a Fritzbox (FRITZ!Box)

This is a [Cloudflare worker](https://workers.cloudflare.com/)
that can be used to update an `A` & an `AAAA` DNS record
in a Cloudflare DNS zone
from automatic IP address updates of a Fritzbox (FRITZ!Box) router.

Mainly, i created this to be able to use a custom dyndns domain for my Fritzbox without relying on MyFritz.

## Usage

### Get required information

- `CF_API_TOKEN`: Cloudflare API token with the following permissions:
	- `Zone.Zone` (read)
	- `Zone.DNS` (edit)
- `DNS_ZONE_ID`: Cloudflare DNS zone ID (see overview page of the site in the Cloudflare dashboard)
- `USERNAME` & `PASSWORD`: Choose a username & password, that will be used to authenticate the update requests
- Choose a subdomain to use for the dynamic DNS record (e.g. `home.example.com`)
	- create a placeholder `A` record for this subdomain in the Cloudflare dashboard, set low TTL (e.g. 1 minute)
	- create a placeholder `AAAA` record for this subdomain in the Cloudflare dashboard (if you want to use IPv6), set low TTL (e.g. 1 minute)

### Setup

- Clone this repository
- Install dependencies: `npm install`

#### Configure environment secrets required for the cloudflare worker

- Execute the following commands to set the required environment secrets for the cloudflare worker gathered previously:

```bash
wrangler secret put DNS_ZONE_ID
wrangler secret put CF_API_TOKEN
wrangler secret put USERNAME
wrangler secret put PASSWORD
```

### Configure routes to cloudflare worker

You need to adapt the routes in `wrangler.toml`:

```toml
# If you want to use a default route on workers.dev, set this to true
workers_dev = false
# If you want to use a custom domain adapt the example domain or else remove or comment out the routes section
routes = [
	{ pattern = "dyndns.example.com", custom_domain = true }
]
```

#### Deploy to cloudflare

- Execute `wrangler deploy` to deploy the worker to cloudflare (probably prompting you to log in to cloudflare)

### Configure the client (e.g. Fritzbox)

- Open the Fritzbox web interface
- Go to `Internet` -> `Freigaben` -> `Dynamic DNS`
- Select `Benutzerdefiniert` as `Anbieter`
- Enter `Update-URL` using the custom domain URL of the worker (e.g. `https://home.example.com/update`) & the default
	argument list:

```
https://home.example.com/update?username=<username>&password=<pass>&domain=<domain>&ipaddr=<ipaddr>&ip6addr=<ip6addr>
```

- If you don't want to use IPv6, remove `&ip6addr=<ip6addr>` from the URL
- Be sure to keep `update?...` after your custom domain, as this is the path that the worker expects
- Enter the username & password you chose earlier as `Benutzername` & `Kennwort`
- Click `Übernehmen`

## Tested with

- node v19.7.0
- wrangler 3.13.1
