import { nanoid } from 'nanoid'

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const key = url.pathname.slice(1);

		switch (request.method) {
			case 'OPTIONS':
				return new Response(null, { headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': '*',
					'Access-Control-Allow-Credentials': 'true'
				}})
			case 'PUT':
				if(key !== 'documents')
					return new Response('Unknown operation', { status: 404 });

				const randomKey = nanoid()

				// get string from request body
				const body = await request.text()

				// if string length is over 10000000, return error
				if(body.length > 10000000)
					return new Response('Document too large', { status: 413, headers: { 'Access-Control-Allow-Origin': '*' } })

				await env.PASTES_BUCKET.put(randomKey, body);
				return new Response('{"key":"' + randomKey + '"}', { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
			case 'GET':
				if(key.split("/")[0] === 'raw') {
					const rawKey = url.pathname.slice(5)

					const object = await env.PASTES_BUCKET.get(rawKey);

					if (object === null) {
						return new Response('{"data":"Object Not Found", "key":' + rawKey + '}', { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } });
					}

					const headers = new Headers();
					object.writeHttpMetadata(headers);
					headers.set('etag', object.httpEtag);
					headers.set('Access-Control-Allow-Origin', '*')

					const data = await object.text();

					return new Response(data, {
						headers,
					});
				}

				const object = await env.PASTES_BUCKET.get(key);

				if (object === null) {
					return new Response('{"data":"Object Not Found", "key":' + key + '}', { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } });
				}

				const headers = new Headers();
				object.writeHttpMetadata(headers);
				headers.set('etag', object.httpEtag);
				headers.set('Access-Control-Allow-Origin', '*')

				const data = await object.text();

				return new Response('{"data":' + JSON.stringify(data) + ',"key":"' + key + '"}', {
					headers,
				});
			default:
				return new Response('Method Not Allowed', {
					status: 405,
					headers: {
						Allow: 'PUT, GET, OPTIONS',
						'Access-Control-Allow-Origin': '*'
					},
				});
		}
	},
};