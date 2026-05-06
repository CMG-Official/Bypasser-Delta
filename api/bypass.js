import crypto from "crypto";

const rateMap = new Map();

export default async function handler(req, res) {

    try {

        if (req.method !== "GET") {

            return res.status(405).json({
                error: "Method not allowed"
            });

        }

        // =========================
        // IP
        // =========================

        const ip =
            req.headers["x-forwarded-for"] ||
            req.socket.remoteAddress ||
            "unknown";

        // =========================
        // RATE LIMIT
        // =========================

        const now = Date.now();

        const user =
            rateMap.get(ip);

        if (user) {

            const diff =
                now - user.time;

            if (diff > 60000) {

                rateMap.set(ip, {
                    count: 1,
                    time: now
                });

            } else {

                if (user.count >= 5) {

                    return res.status(429).json({
                        error:
                            "Rate limit exceeded"
                    });

                }

                user.count++;

            }

        } else {

            rateMap.set(ip, {
                count: 1,
                time: now
            });

        }

        // =========================
        // HEADERS
        // =========================

        const signature =
            req.headers["x-atlantis-signature"];

        const timestamp =
            req.headers["x-atlantis-timestamp"];

        const nonce =
            req.headers["x-atlantis-nonce"];

        if (
            !signature ||
            !timestamp ||
            !nonce
        ) {

            return res.status(403).json({
                error: "Unauthorized"
            });

        }

        // =========================
        // EXPIRE CHECK
        // =========================

        const age =
            Math.abs(
                Date.now() -
                Number(timestamp)
            );

        // 60 sec expiry

        if (age > 60000) {

            return res.status(403).json({
                error: "Token expired"
            });

        }

        // =========================
        // VERIFY SIGNATURE
        // =========================

        const payload =
            `${ip}:${timestamp}:${nonce}`;

        const expected =
            crypto
                .createHmac(
                    "sha256",
                    process.env.JWT_SECRET
                )
                .update(payload)
                .digest("hex");

        if (expected !== signature) {

            return res.status(403).json({
                error: "Invalid signature"
            });

        }

        // =========================
        // QUERY
        // =========================

        const { url, token } =
            req.query;

        if (!url) {

            return res.status(400).json({
                error: "Missing URL"
            });

        }

        if (!token) {

            return res.status(400).json({
                error:
                    "Missing captcha token"
            });

        }

        // =========================
        // URL VALIDATION
        // =========================

        try {

            new URL(url);

        } catch {

            return res.status(400).json({
                error: "Invalid URL"
            });

        }

        // =========================
        // REFERER LOCK
        // =========================

        const referer =
            req.headers.referer || "";

        if (
            !referer.includes(
                "atlantislabs.top"
            )
        ) {

            return res.status(403).json({
                error: "Forbidden"
            });

        }

        // =========================
        // REAL API
        // =========================

        const response =
            await fetch(
                `https://ka.idarko.xyz/website/bypass?url=${encodeURIComponent(url)}&token=${token}`,
                {
                    headers: {
                        "x-api-key":
                            process.env.API_KEY
                    }
                }
            );

        const data =
            await response.json();

        return res
            .status(200)
            .json(data);

    } catch {

        return res.status(500).json({
            error:
                "Internal server error"
        });

    }

}
