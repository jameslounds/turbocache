# turborcache

Simple and Fast [custom remote cache](https://turborepo.org/docs/features/remote-caching#custom-remote-caches) for [Turborepo](https://turborepo.org/) on the [Cloudflare Workers & KV](https://workers.cloudflare.com/)

## How to use

Fork this, modify `wrangler.toml` and deploy to your Cloudflare account.

You should also setup a R2 bucket and the secret key. All artifacts older than 7 days are cleared every day at midnight UTC by default.

```bash
# to create a R2 bucket. You will need to add the binding name as R2_BUCKET. If you use the turbocache-artifacts, you do not need to change any config
yarn wrangler r2 bucket create turbocache-artifacts

# to provide a secret key
yarn wrangler secret put SECRET_KEY
# then enter a special text to restrict access to your cache
```

Next, deploy the worker. If you are deploying from CI, you will need an API token, you can create from [here](https://dash.cloudflare.com/profile/api-tokens) and the minimum permissions required for the API token are `Workers KV Storage:Edit`, `Workers Scripts:Edit`.

```
yarn deploy

# In case when deploying from CI
CLOUDFLARE_API_TOKEN=xxxx yarn deploy
```

Finally, you can use turbo repo with your own remote cache!

```bash
turbo run build --team="whatever" --api="https://turbocache.YOUR-ACCOUNT.workers.dev/" --token="<YOUR_SECRET_KEY>"
```

## Roadmap

If I ever actually use this...

- [ ] Auth via GitHub
- [ ] Team Management
- [ ] Web Client
- [ ] ... What else?

BTW, Turborepo is still in early stage, so there's room for many improvements, but at the same time, its structure is not clean and coupled to Vercel's interface. I assume it's eventually to be rewritten (in Rust?)

## LICENSE

MIT
