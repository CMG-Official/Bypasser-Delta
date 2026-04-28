let currentUrl = null;
const bypassForm = document.getElementById("bypass-form");
const bypassUrlInput = document.getElementById("bypass-url");
const resultContainer = document.getElementById('result');
const resultContent = document.getElementById("result-content");
const progressBar = document.getElementById('progress-bar');
const errorContainer = document.getElementById("errorContainer");
const nav = document.querySelector("nav");
let hcaptchaWidgetId = null;

function initHcaptcha() {
    if (typeof hcaptcha !== "undefined") {
        hcaptchaWidgetId = hcaptcha.render("hcaptcha-container", {
            'sitekey': "6b22d8d6-8eca-4dbe-9f40-c8ae55c62330",
            'theme': 'dark'
        });
        setInterval(function () {
            if (hcaptchaWidgetId !== null) {
                hcaptcha.reset(hcaptchaWidgetId);
            }
        }, 30000);
    }
}

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

async function copyToClipboard(text) {
    await navigator.clipboard.writeText(text);
}

async function performBypass(url) {
    try {
        showProgressBar();
        let hcaptchaResponse = hcaptcha.getResponse(hcaptchaWidgetId);
        if (!hcaptchaResponse) {
            throw new Error("Please complete the hCaptcha verification");
        }

        let response = await fetch(`https://ka.idarko.xyz/website/bypass?url=${encodeURIComponent(url)}&token=${hcaptchaResponse}`, {
            method: "GET",
            headers: {
                'x-api-key': "websiteontop"
            }
        });

        if (!response.ok) {
            let errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Unable to bypass the link.");
        }

        let data = await response.json();
        
        if (data.message === "URL not supported.") {
            showNotSupported();
            return;
        }

        if (data.status === "success") {
            showResult(data.data);
        } else {
            throw new Error(data.message || "Bypass failed. Please try again.");
        }
    } catch (error) {
        showError(error.message || "An unexpected error occurred.");
    } finally {
        hideProgressBar();
        if (hcaptchaWidgetId !== null) {
            hcaptcha.reset(hcaptchaWidgetId);
        }
    }
}

function clearResult() {
    errorContainer.innerHTML = '';
    resultContent.innerHTML = '';
    resultContainer.classList.add("hidden");
    resultContainer.classList.remove("show");
}

function showProgressBar() {
    progressBar.classList.remove("hidden");
}

function hideProgressBar() {
    progressBar.classList.add('hidden');
}

function showError(errorMessage) {
    let inputValue = bypassUrlInput.value.trim();
    if (inputValue) {
        currentUrl = inputValue;
    }
    resultContainer.classList.remove("hidden");
    resultContent.innerHTML = `
        <div class="flex flex-col items-center justify-center text-center py-4">
            <div class="bg-gray-900/80 p-4 rounded-xl w-full max-w-xs border border-red-500/30">
                <p class="text-red-400 font-semibold text-lg">Bypass Failed</p>
                <p class="text-gray-300 text-sm mt-1">${errorMessage}</p>
            </div>
            
            <mdui-button
                id="retryBtn"
                variant="filled"
                class="mt-4 btn-gradient"
                style="border-radius: 9999px;"
            >
                <mdui-icon name="refresh" slot="icon"></mdui-icon>
                Try Again
            </mdui-button>
        </div>
    `;
    setTimeout(() => resultContainer.classList.add("show"), 30);
    setTimeout(() => {
        let retryBtn = document.getElementById("retryBtn");
        if (retryBtn) {
            retryBtn.addEventListener("click", async () => {
                if (!currentUrl) return;
                clearResult();
                await performBypass(currentUrl);
            });
        }
    }, 50);
}

function showNotSupported() {
    resultContainer.classList.remove("hidden");
    resultContent.innerHTML = `
        <div class="flex flex-col items-center justify-center text-center py-4">
            <div class="bg-gray-900/80 p-3 rounded-xl w-full max-w-xs border border-yellow-500/40">
                <p class="text-yellow-400 font-semibold text-base">URL Not Supported</p>
                <p class="text-gray-300 text-sm mt-1">This link cannot be bypassed.</p>
            </div>
        </div>
    `;
    setTimeout(() => resultContainer.classList.add("show"), 30);
}

function showResult(data) {
    let htmlContent = '';
    if (data.result) {
        let bypassResult = data.result;
        if (isValidUrl(bypassResult)) {
            htmlContent += `
                        <div class="flex flex-col items-center justify-center h-full">
                            <mdui-button variant="filled" href="${bypassResult}" target="_blank" style="border-radius: 9999px;">
                                <mdui-icon name="open_in_new" slot="icon"></mdui-icon>
                                Open Bypassed Link
                            </mdui-button>
                            <p class="text-sm mt-2" style="color: #e0e0e0;">Opens in a new tab</p>
                        </div>
                    `;
        } else if (bypassResult.length > 70) {
            htmlContent += `
                        <div class="flex flex-col items-center justify-center h-full">
                            <div class="bg-gray-900/80 p-4 rounded-lg mb-4 w-full overflow-auto max-h-40">
                                <p class="text-sm" style="color: #e0e0e0;">${bypassResult.substring(0, 70)}...</p>
                            </div>
                            <mdui-button variant="filled" class="copy-btn" data-text="${btoa(bypassResult)}" style="border-radius: 9999px;">
                                <mdui-icon name="content_copy" slot="icon"></mdui-icon>
                                Copy Full Text
                            </mdui-button>
                            <p class="text-sm mt-2" style="color: #e0e0e0;">Text is long so it is shortened here</p>
                        </div>
                    `;
        } else {
            htmlContent += `
                        <div class="flex flex-col items-center justify-center h-full">
                            <div class="bg-gray-900/80 p-4 rounded-lg mb-4 w-full">
                                <p style="color: #e0e0e0;">${bypassResult}</p>
                            </div>
                            <mdui-button variant="filled" class="copy-btn" data-text="${btoa(bypassResult)}" style="border-radius: 9999px;">
                                <mdui-icon name="content_copy" slot="icon"></mdui-icon>
                                Copy Text
                            </mdui-button>
                        </div>
                    `;
        }
    }
    
    if (data.time) {
        htmlContent += `<p class="text-center mt-3 md:mt-4 text-sm" style="color: #e0e0e0;">Processing time: ${data.time}s</p>`;
    }
    
    resultContent.innerHTML = htmlContent;
    resultContainer.classList.remove("hidden");
    
    setTimeout(() => {
        resultContainer.classList.add("show");
    }, 40);
    
    document.querySelectorAll(".copy-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            copyToClipboard(atob(btn.dataset.text));
            let oldIndicator = btn.parentElement.querySelector(".copied-indicator");
            if (oldIndicator) {
                oldIndicator.remove();
            }
            let indicator = document.createElement('p');
            indicator.className = "copied-indicator";
            indicator.innerText = 'Copied!';
            btn.parentElement.appendChild(indicator);
            
            setTimeout(() => {
                indicator.style.opacity = 0;
                setTimeout(() => indicator.remove(), 200);
            }, 1400); // 0x578 is 1400ms
        });
    });
}

window.addEventListener("scroll", () => {
    if (window.scrollY > 12) {
        nav.classList.add("nav-scrolled");
    } else {
        nav.classList.remove("nav-scrolled");
    }
});

window.addEventListener("DOMContentLoaded", () => {
    const featureCards = document.querySelectorAll(".feature-card");
    const cardObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.18 });
    
    featureCards.forEach(card => cardObserver.observe(card));
    
    const revealElements = document.querySelectorAll(".reveal-on-scroll");
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("reveal-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    
    revealElements.forEach(el => revealObserver.observe(el));
});

if (document.readyState === "loading") {
    document.addEventListener('DOMContentLoaded', initHcaptcha);
} else {
    initHcaptcha();
}

bypassForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    let url = bypassUrlInput.value.trim();
    
    if (!url) {
        showError("Please enter a link to bypass!");
        return;
    }
    
    if (!isValidUrl(url)) {
        showNotSupported();
        return;
    }
    
    currentUrl = url;
    clearResult();
    await performBypass(url);
});
