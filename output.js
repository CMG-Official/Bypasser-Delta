let widgetId = null;
let captchaReady = false;

// Initialize hCaptcha
window.initHcaptcha = function () {
    if (typeof hcaptcha === "undefined") return;

    try {
        widgetId = hcaptcha.render("hcaptcha-container", {
            sitekey: "6b22d8d6-8eca-4dbe-9f40-c8ae55c62330",
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
        });

    } catch (err) {
        console.error(err);
    }
};

const form = document.getElementById("bypass-form");
const input = document.getElementById("bypass-url");
const result = document.getElementById("result");
const resultContent = document.getElementById("result-content");
const progressBar = document.getElementById("progress-bar");

// URL validation
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Main bypass function
async function performBypass(url) {

    try {

        progressBar.classList.remove("hidden");

        if (!captchaReady) {
            throw new Error("Solve hCaptcha first");
        }

        const token = hcaptcha.getResponse(widgetId);

        if (!token) {
            throw new Error("Missing captcha token");
        }

        // YOUR CUSTOM API
        const api =
            `https://api.atlantislabs.top/api/bypass?url=${encodeURIComponent(url)}&token=${token}`;

        const response = await fetch(api);

        const data = await response.json();

        result.classList.remove("hidden");

        const bypassedKey =
            data?.data?.result ||
            data?.result ||
            "No result";

        const timeTaken =
            data?.data?.time ||
            data?.time ||
            "Unknown";

        resultContent.innerHTML = `
            <div style="
                padding:15px;
                background:#1a1a1a;
                border-radius:8px;
                border:1px solid #333;
                margin-bottom:15px;
                position:relative;
            ">

                <h4 style="
                    margin:0 0 10px 0;
                    color:#aaa;
                ">
                    Bypassed Key:
                </h4>

                <div style="
                    font-size:1.2em;
                    color:lime;
                    word-break:break-all;
                    padding-right:60px;
                ">
                    ${bypassedKey}
                </div>

                <button id="copy-key-btn" style="
                    position:absolute;
                    right:15px;
                    top:50%;
                    transform:translateY(-50%);
                    padding:6px 12px;
                    background:#333;
                    color:white;
                    border:1px solid #555;
                    border-radius:4px;
                    cursor:pointer;
                ">
                    Copy
                </button>

            </div>

            <div style="
                padding:15px;
                background:#1a1a1a;
                border-radius:8px;
                border:1px solid #333;
            ">
                <h4 style="
                    margin:0 0 10px 0;
                    color:#aaa;
                ">
                    Time Taken:
                </h4>

                <div style="
                    font-size:1.1em;
                    color:#0cf;
                ">
                    ${timeTaken} seconds
                </div>
            </div>
        `;

        // Copy button
        const copyBtn = document.getElementById("copy-key-btn");

        if (copyBtn) {

            copyBtn.addEventListener("click", () => {

                navigator.clipboard.writeText(bypassedKey)
                    .then(() => {

                        copyBtn.innerText = "Copied!";
                        copyBtn.style.background = "lime";
                        copyBtn.style.color = "black";

                        setTimeout(() => {
                            copyBtn.innerText = "Copy";
                            copyBtn.style.background = "#333";
                            copyBtn.style.color = "white";
                        }, 2000);

                    });

            });

        }

    } catch (err) {

        result.classList.remove("hidden");

        resultContent.innerHTML = `
            <div style="color:red;">
                ERROR: ${err.message}
            </div>
        `;

    } finally {

        progressBar.classList.add("hidden");

        if (widgetId && typeof hcaptcha !== "undefined") {
            hcaptcha.reset(widgetId);
            captchaReady = false;
        }

    }
}

// Form submit
form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const url = input.value.trim();

    if (!url) return;

    if (!isValidUrl(url)) {

        result.classList.remove("hidden");

        resultContent.innerHTML = `
            <div style="color:red;">
                ERROR: Invalid URL
            </div>
        `;

        return;
    }

    await performBypass(url);

});
