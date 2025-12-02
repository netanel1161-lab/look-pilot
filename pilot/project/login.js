import { getUserByPhone } from "./supabaseClient.js";

const phoneInput = document.getElementById("phone-input");
const loginForm = document.getElementById("login-form");
const loginBtn = document.getElementById("login-btn");
const feedbackMessage = document.getElementById("feedback-message");
const loginCard = document.getElementById("login-card");
const soundSuccess = document.getElementById("sound-success");
const soundError = document.getElementById("sound-error");

function validatePhone(phone) {
    if (!phone) return "נא להזין מספר טלפון";
    if (!/^[0-9]+$/.test(phone)) return "המספר חייב להכיל ספרות בלבד";
    if (phone.length !== 10) return "המספר חייב להיות באורך 10 ספרות";
    if (!phone.startsWith("05")) return "מספר חייב להתחיל ב-05";
    return null;
}

function showFeedback(type, text) {
    if (!feedbackMessage) return;
    feedbackMessage.classList.remove("show", "success", "error");
    feedbackMessage.textContent = text;
    feedbackMessage.classList.add("show", type);
}

function playSound(type) {
    const el = type === "success" ? soundSuccess : soundError;
    if (!el) return;
    el.currentTime = 0;
    el.play().catch(() => {});
}

function setLoading(isLoading) {
    if (!loginBtn || !phoneInput) return;
    if (isLoading) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="spinner"></span> בודק נתונים...';
        phoneInput.disabled = true;
    } else {
        loginBtn.disabled = false;
        loginBtn.innerHTML = "<span>כניסה</span>";
        phoneInput.disabled = false;
    }
}

loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const phone = phoneInput.value.trim();
    const error = validatePhone(phone);
    if (error) {
        showFeedback("error", error);
        playSound("error");
        return;
    }

    setLoading(true);
    showFeedback("success", "בודק את המספר...");

    const user = await getUserByPhone(phone);

    if (!user) {
        setLoading(false);
        showFeedback("error", "המספר לא נמצא במערכת.");
        playSound("error");
        phoneInput.focus();
        return;
    }

    localStorage.setItem("lok_user", JSON.stringify(user));
    playSound("success");

    const fullName = user.full_name || user.name || "משתמש";

    loginCard.innerHTML = `
        <div class="p-8 py-12 fade-in-up">
            <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h2 class="text-3xl font-bold text-gray-800 mb-2">היי, ${fullName}!</h2>
            <p class="text-gray-500 mb-6">הזהות אומתה בהצלחה. ניגש לנתוני הפיילוט...</p>
            <div class="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 mt-4 overflow-hidden">
                <div class="bg-lok-primary h-1.5 rounded-full" style="width: 45%; animation: progress 2s ease-in-out infinite;"></div>
            </div>
        </div>
    `;

    const style = document.createElement("style");
    style.innerHTML = `
        @keyframes progress {
            0% { width: 0%; transform: translateX(-100%); }
            100% { width: 100%; transform: translateX(100%); }
        }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
        window.location.href = "index.html";
    }, 1500);
});

document.addEventListener("DOMContentLoaded", () => {
    phoneInput?.focus();
});
