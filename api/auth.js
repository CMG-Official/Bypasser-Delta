import crypto from "crypto";

export default async function handler(req, res) {

    try {

        const ip =
            req.headers["x-forwarded-for"] ||
            req.socket.remoteAddress ||
            "unknown";

        const timestamp =
            Date.now().toString();

        const nonce =
            crypto.randomBytes(16).toString("hex");

        const payload =
            `${ip}:${timestamp}:${nonce}`;

        const signature =
            crypto
                .createHmac(
                    "sha256",
                    process.env.JWT_SECRET
                )
                .update(payload)
                .digest("hex");

        return res.status(200).json({

            timestamp,
            nonce,
            signature

        });

    } catch {

        return res.status(500).json({
            error: "Auth error"
        });

    }

}
