let widgetId = null;
let captchaReady = false;

// Initialize hCaptcha
window.initHcaptcha = function () {

    if (typeof hcaptcha === "undefined") return;

    try {

        widgetId = hcaptcha.render(
            "hcaptcha-container",
            {

                sitekey:
                    "6b22d8d6-8eca-4dbe-9f40-c8ae55c62330",

                theme: "dark",

                callback: () => {

                    captchaReady = true;

                },

                "expired-callback": () => {

                    captchaReady = false;

                },

                "error-callback": () => {

                    captchaReady = false;

                }

            }
        );

    } catch (err) {

        console.error(err);

    }

};

// Elements
const form =
    document.getElementById(
        "bypass-form"
    );

const input =
    document.getElementById(
        "bypass-url"
    );

const result =
    document.getElementById(
        "result"
    );

const resultContent =
    document.getElementById(
        "result-content"
    );

const loadingBox =
    document.getElementById(
        "loading-box"
    );

// Validate URL
function isValidUrl(url) {

    try {

        new URL(url);

        return true;

    } catch {

        return false;

    }

}

// Main bypass
async function performBypass(url) {

    try {

        // Show loader
        loadingBox.classList.remove(
            "hidden"
        );

        // Hide old result
        result.classList.add(
            "hidden"
        );

        // hCaptcha check
        if (!captchaReady) {

            throw new Error(
                "Solve hCaptcha first"
            );

        }

        // hCaptcha token
        const token =
            hcaptcha.getResponse(
                widgetId
            );

        if (!token) {

            throw new Error(
                "Missing captcha token"
            );

        }

        // =========================
        // AUTH REQUEST
        // =========================

        const authResponse =
            await fetch(
                "https://delta.atlantislabs.top/api/auth"
            );

        const authData =
            await authResponse.json();

        // =========================
        // API URL
        // =========================

        const apiUrl =
            `https://delta.atlantislabs.top/api/bypass?url=${encodeURIComponent(url)}&token=${token}`;

        // =========================
        // MAIN REQUEST
        // =========================

        const response =
            await fetch(apiUrl, {

                headers: {

                    "x-atlantis-signature":
                        authData.signature,

                    "x-atlantis-timestamp":
                        authData.timestamp,

                    "x-atlantis-nonce":
                        authData.nonce

                }

            });

        const data =
            await response.json();

        // =========================
        // ERROR CHECK
        // =========================

        if (data.error) {

            throw new Error(
                data.error
            );

        }

        // =========================
        // SHOW RESULT
        // =========================

        result.classList.remove(
            "hidden"
        );

        const bypassedKey =
            data?.data?.result ||
            data?.result ||
            "No result";

        const timeTaken =
            data?.data?.time ||
            data?.time ||
            "Unknown";

        // =========================
        // AUTO COPY
        // =========================

        let copiedText =
            "Auto copied";

        try {

            await navigator.clipboard
                .writeText(
                    bypassedKey
                );

        } catch {

            copiedText =
                "Copy failed";

        }

        // =========================
        // RENDER
        // =========================

        resultContent.innerHTML = `

            <div style="
                padding:15px;
                background:#111;
                border:1px solid #222;
                border-radius:8px;
                margin-bottom:15px;
            ">

                <h4 style="
                    margin-bottom:10px;
                    color:#aaa;
                ">
                    Bypassed Key
                </h4>

                <div style="
                    color:lime;
                    font-size:1.1rem;
                    word-break:break-all;
                    margin-bottom:12px;
                ">
                    ${bypassedKey}
                </div>

                <div style="
                    display:inline-block;
                    background:lime;
                    color:black;
                    padding:8px 14px;
                    border-radius:6px;
                    font-weight:bold;
                ">
                    ${copiedText}
                </div>

            </div>

            <div style="
                padding:15px;
                background:#111;
                border:1px solid #222;
                border-radius:8px;
            ">

                <h4 style="
                    margin-bottom:10px;
                    color:#aaa;
                ">
                    Time Taken
                </h4>

                <div style="
                    color:#00cfff;
                ">
                    ${timeTaken} seconds
                </div>

            </div>

        `;

    } catch (err) {

        // =========================
        // ERROR
        // =========================

        result.classList.remove(
            "hidden"
        );

        resultContent.innerHTML = `

            <div style="
                color:red;
                background:#111;
                border:1px solid #300;
                padding:15px;
                border-radius:8px;
            ">

                ERROR: ${err.message}

            </div>

        `;

    } finally {

        // =========================
        // HIDE LOADER
        // =========================

        loadingBox.classList.add(
            "hidden"
        );

        // =========================
        // RESET CAPTCHA
        // =========================

        if (
            widgetId &&
            typeof hcaptcha !==
                "undefined"
        ) {

            hcaptcha.reset(
                widgetId
            );

            captchaReady = false;

        }

    }

}

// Submit
form.addEventListener(
    "submit",
    async (e) => {

        e.preventDefault();

        const url =
            input.value.trim();

        if (!url) return;

        // Invalid URL
        if (!isValidUrl(url)) {

            result.classList.remove(
                "hidden"
            );

            resultContent.innerHTML = `

                <div style="
                    color:red;
                    background:#111;
                    border:1px solid #300;
                    padding:15px;
                    border-radius:8px;
                ">

                    ERROR: Invalid URL

                </div>

            `;

            return;

        }

        // Run
        await performBypass(
            url
        );

    }
);
