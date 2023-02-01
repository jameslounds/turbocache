/// <reference types="@cloudflare/workers-types" />

declare let R2_BUCKET: R2Bucket;
const key = (hash: string) => `artifact:${hash}`;

// See https://developers.cloudflare.com/workers/cli-wrangler/commands#secret
declare let SECRET_KEY: string;

const RETENTION_DAYS = 7;

addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  const storageRoutePattern = /^\/v8\/artifacts\/(?<hash>\w+)$/;
  const match = url.pathname.match(storageRoutePattern);

  if (!match) {
    return void event.respondWith(new Response(null, { status: 404 }));
  }

  if (request.headers.get('Authorization') !== `Bearer ${SECRET_KEY}`) {
    return void event.respondWith(
      new Response('Request not permitted', { status: 401 })
    );
  }

  const { hash } = match.groups!;

  switch (request.method) {
    case 'GET': {
      return void event.respondWith(getArtifact(hash));
    }

    case 'HEAD': {
      return void event.respondWith(getArtifact(hash));
    }

    case 'PUT': {
      if (!request.body) {
        return void event.respondWith(
          new Response('Request body cannot be empty', { status: 400 })
        );
      }
      return void event.respondWith(putArtifact(hash, request.body));
    }

    default: {
      return void event.respondWith(
        new Response('Method not allowed', { status: 405 })
      );
    }
  }
});

async function getArtifact(hash: string): Promise<Response> {
  const artifact = await R2_BUCKET.get(key(hash));
  if (artifact) {
    return new Response(artifact.body);
  } else {
    return new Response('Artifact not found', { status: 404 });
  }
}

async function putArtifact(
  hash: string,
  artifact: ReadableStream
): Promise<Response> {
  try {
    await R2_BUCKET.put(key(hash), artifact);
    return new Response(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return new Response('Failed to store artifact', {
      status: 500,
    });
  }
}

addEventListener('scheduled', event => {
  event.waitUntil(deleteOldArtifacts());
});

async function deleteOldArtifacts() {
  const { objects: artifacts } = await R2_BUCKET.list({
    prefix: 'artifact:',
  });
  const keepAfter = +Date.now() - 86_400 * RETENTION_DAYS;
  const oldArtifacts = artifacts.filter(a => +a.uploaded < keepAfter);
  await R2_BUCKET.delete(oldArtifacts.map(a => a.key));
}
