import * as Cloudflare from "cloudflare-client";

export interface Env {
	USERNAME: string;
	PASSWORD: string;
	CF_API_TOKEN: string;
	DNS_ZONE_ID: string;
}

async function updateRecord(type: "A" | "AAAA", domain: string, ipaddr: string | null, zoneId: string, accessToken: string): Promise<boolean> {
	// no-op if ipaddr is undefined
	if (ipaddr === null || ipaddr === undefined) {
		return true;
	}
	// zone api client
	const dnsRecords = Cloudflare.dnsRecords({zoneId: zoneId, accessToken: accessToken,});
	// get records
	const record = await dnsRecords.find({type: type, name: domain}).first();
	// check records
	if (record === undefined || record === null) {
		console.log(`${type} record for ${domain} was not found`)
		return false;
	}
	// update records
	const result = await dnsRecords.update(record.id, {...record, content: ipaddr!,});
	// check result
	return result !== undefined && result !== null;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// parse the URL
		const {searchParams, pathname} = new URL(request.url);
		if (pathname !== '/update') {
			return new Response(null, {status: 400});
		}
		// get auth params
		let username = searchParams.get('username');
		let password = searchParams.get('password');
		// check auth params
		if (env.USERNAME === undefined || env.USERNAME === null || env.USERNAME === "null" || env.PASSWORD === undefined || env.PASSWORD === null || env.PASSWORD === "null") {
			console.log(`username: ${env.USERNAME} or password: #${env.PASSWORD?.length ?? 0} is not set`)
			return new Response(null, {status: 500});
		}
		// check auth
		if (username === null || username !== env.USERNAME || password === null || password !== env.PASSWORD) {
			console.log(`username: ${username} or password: #${password?.length ?? 0} is not correct`)
			return new Response(null, {status: 200});
		}

		// get params
		let domain = searchParams.get('domain');
		let ip4addr = searchParams.get('ipaddr');
		let ip6addr = searchParams.get('ip6addr');
		// check params
		if (domain === null) {
			console.log(`domain: ${domain} is not set`)
			return new Response(null, {status: 400});
		}
		if (ip4addr === null && ip6addr === null) { // at least one of them must be set
			console.log(`ip4addr: ${ip4addr} and ip6addr: ${ip6addr} are not set`)
			return new Response(null, {status: 400});
		}

		// log params
		const result4 = await updateRecord("A", domain, ip4addr, env.DNS_ZONE_ID, env.CF_API_TOKEN);
		const result6 = await updateRecord("AAAA", domain, ip6addr, env.DNS_ZONE_ID, env.CF_API_TOKEN);
		// check result
		if (!result4 || !result6) {
			console.log(`update ${domain} failed: 4: ${result4}, 6: ${result6}`)
			return new Response(null, {status: 404});
		}

		return new Response(null, {status: 200});
	},
};
