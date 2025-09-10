import { BASE_ASKAI_URL } from "./constants";

const TOKEN_KEY = "askai_token";

type TokenPayload = { exp: number };

const decode = (token: string): TokenPayload => {
	const [b64] = token.split(".");
	return JSON.parse(atob(b64));
};

const isExpired = (token?: string | null): boolean => {
	if (!token) return true;
	try {
		const { exp } = decode(token);
		// refresh 30 s before the backend rejects it
		return Date.now() / 1000 > exp - 30;
	} catch {
		return true;
	}
};

let inflight: Promise<string> | null = null;

// call /token once, cache the promise while it’s running
// eslint-disable-next-line require-await
export const getValidToken = async ({
	assistantId,
}: {
	assistantId: string;
}): Promise<string> => {
	const cached = sessionStorage.getItem(TOKEN_KEY);
	if (!isExpired(cached)) return cached!;

	if (!inflight) {
		inflight = fetch(`${BASE_ASKAI_URL}/chat/token`, {
			method: "POST",
			headers: {
				"x-algolia-assistant-id": assistantId,
				"content-type": "application/json",
			},
		})
			.then((r) => r.json())
			.then(({ token }) => {
				sessionStorage.setItem(TOKEN_KEY, token);
				return token;
			})
			.finally(() => (inflight = null));
	}

	return inflight;
};

export const postFeedback = async ({
	assistantId,
	thumbs,
	messageId,
	appId,
}: {
	assistantId: string;
	thumbs: 0 | 1;
	messageId: string;
	appId: string;
}): Promise<Response> => {
	const headers = new Headers();
	headers.set("x-algolia-assistant-id", assistantId);
	headers.set("content-type", "application/json");

	const token = await getValidToken({ assistantId });
	headers.set("authorization", `TOKEN ${token}`);

	return fetch(`${BASE_ASKAI_URL}/feedback`, {
		method: "POST",
		body: JSON.stringify({
			appId,
			messageId,
			thumbs,
		}),
		headers,
	});
};
