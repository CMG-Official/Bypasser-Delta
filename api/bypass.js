const rateLimitMap = new Map();

export default async function handler(req, res) {

    try {

        // Only GET requests
        if (req.method !== "GET") {
            return res.status(405).json({
                error: "Method not allowed"
            });
        }

        // Get user IP
        const ip =
            req.headers["x-forwarded-for"] ||
            req.socket.remoteAddress ||
            "unknown";

        // ===== RATE LIMIT =====

        const now = Date.now();

        const user = rateLimitMap.get(ip);

        if (user) {

            const timePassed = now - user.startTime;

            // Reset after 60 sec
            if (timePassed > 60000) {

                rateLimitMap.set(ip, {
                    count: 1,
                    startTime: now
                });

            } else {

                // Max 5 requests
                if (user.count >= 5) {

                    return res.status(429).json({
                        error: "Rate limit exceeded",
                        retryAfter:
                            Math.ceil(
                                (60000 - timePassed) / 1000
                            ) + " seconds"
                    });

                }

                user.count++;

            }

        } else {

            rateLimitMap.set(ip, {
                count: 1,
                startTime: now
            });

        }

        // =====================

        const { url, token } = req.query;

        // Validate URL
        if (!url) {
            return res.status(400).json({
                error: "Missing URL"
            });
        }

        if (!token) {
            return res.status(400).json({
                error: "Missing captcha token"
            });
        }

        // Check URL format
        try {
            new URL(url);
        } catch {

            return res.status(400).json({
                error: "Invalid URL"
            });

        }

        // Optional domain lock
        const referer = req.headers.referer || "";

        if (
            !referer.includes("atlantislabs.top") &&
            !referer.includes("localhost")
        ) {

            return res.status(403).json({
                error: "Forbidden"
            });

        }

        // REAL API REQUEST
        const apiResponse = await fetch(
            `https://ka.idarko.xyz/website/bypass?url=${encodeURIComponent(url)}&token=${token}`,
            {
                headers: {
                    "x-api-key": process.env.API_KEY
                }
            }
        );

        const data = await apiResponse.json();

        return res.status(200).json(data);

    } catch (err) {

        return res.status(500).json({
            error: "Internal server error"
        });

    }

}
