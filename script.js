// ========================================
// BazaarLink AI Chatbot
// ========================================

// ضع مفتاح BazaarLink الخاص بك هنا للاختبار فقط.
// تنبيه: المفتاح داخل JavaScript يمكن لأي زائر للموقع رؤيته.
const API_KEY = "sk-bl-G_PENgckZ0mZGHbRbmo-bmMwDCLnnD2Ky0fO3t661iqj7V9U";

// رابط API
const API_URL = "https://api.bazaarlink.ai/v1/chat/completions";

// استخدم اسم نموذج موجود بالفعل في قائمة BazaarLink.
// يمكنك تغييره إلى أي model ID متاح لحسابك.
const MODEL_NAME = "openai/gpt-4o";

// ========================================
// عناصر الواجهة
// ========================================

const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = document.querySelector("#file-cancel");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbotButton = document.querySelector("#close-chatbot");

// ========================================
// متغيرات المحادثة
// ========================================

const chatHistory = [
    {
        role: "system",
        content:
            "أنت مساعد ذكاء اصطناعي مفيد. أجب بلغة المستخدم، واجعل إجاباتك واضحة ومنظمة. إذا سألك المستخدم بالعربية فأجب بالعربية."
    }
];

let selectedFile = null;
let isGenerating = false;

// ========================================
// أدوات مساعدة
// ========================================

function escapeHTML(text) {
    return String(text).replace(/[&<>"']/g, function (char) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[char];
    });
}

function scrollChatToBottom() {
    if (chatBody) {
        chatBody.scrollTop = chatBody.scrollHeight;
    }
}

function createMessageElement(content, className) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", className);

    const messageText = document.createElement("div");
    messageText.classList.add("message-text");
    messageText.innerHTML = escapeHTML(content).replace(/\n/g, "<br>");

    messageElement.appendChild(messageText);

    return messageElement;
}

function addMessage(content, className) {
    if (!chatBody) return null;

    const messageElement = createMessageElement(content, className);
    chatBody.appendChild(messageElement);

    scrollChatToBottom();

    return messageElement;
}

function setLoading(isLoading) {
    isGenerating = isLoading;

    if (sendMessageButton) {
        sendMessageButton.disabled = isLoading;
    }

    if (messageInput) {
        messageInput.disabled = isLoading;
    }

    if (sendMessageButton) {
        sendMessageButton.style.opacity = isLoading ? "0.6" : "1";
    }
}

function showError(message) {
    addMessage(message, "bot-message");
}

// ========================================
// التعامل مع الملفات والصور
// ========================================

function clearSelectedFile() {
    selectedFile = null;

    if (fileInput) {
        fileInput.value = "";
    }

    if (fileUploadWrapper) {
        fileUploadWrapper.classList.remove("file-uploaded");
    }

    const preview = document.querySelector(".selected-file-preview");

    if (preview) {
        preview.remove();
    }
}

function showSelectedFile(file) {
    if (!chatBody || !file) return;

    const oldPreview = document.querySelector(".selected-file-preview");

    if (oldPreview) {
        oldPreview.remove();
    }

    const preview = document.createElement("div");
    preview.className = "selected-file-preview";

    if (file.type.startsWith("image/")) {
        const image = document.createElement("img");
        image.src = URL.createObjectURL(file);
        image.alt = "الصورة المختارة";
        image.style.maxWidth = "160px";
        image.style.maxHeight = "160px";
        image.style.objectFit = "contain";

        preview.appendChild(image);
    }

    const fileName = document.createElement("span");
    fileName.textContent = file.name;
    preview.appendChild(fileName);

    chatBody.appendChild(preview);
    scrollChatToBottom();
}

if (fileInput) {
    fileInput.addEventListener("change", function () {
        const file = this.files && this.files[0];

        if (!file) return;

        // في هذه النسخة نسمح بالصور فقط.
        if (!file.type.startsWith("image/")) {
            showError("من فضلك اختر ملف صورة فقط.");
            clearSelectedFile();
            return;
        }

        // حد أقصى 5 ميجابايت للصورة.
        if (file.size > 5 * 1024 * 1024) {
            showError("حجم الصورة أكبر من 5 ميجابايت. اختر صورة أصغر.");
            clearSelectedFile();
            return;
        }

        selectedFile = file;

        if (fileUploadWrapper) {
            fileUploadWrapper.classList.add("file-uploaded");
        }

        showSelectedFile(file);
    });
}

if (fileCancelButton) {
    fileCancelButton.addEventListener("click", clearSelectedFile);
}

// ========================================
// تحويل الصورة إلى Base64
// ========================================

function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("تعذر قراءة الصورة."));

        reader.readAsDataURL(file);
    });
}

// ========================================
// إرسال الطلب إلى BazaarLink
// ========================================

async function getAIResponse(userText, imageFile = null) {
    const messages = [...chatHistory];

    let userContent = userText;

    // عند إرفاق صورة، نرسلها بصيغة OpenAI متعددة الوسائط.
    if (imageFile) {
        const imageDataURL = await fileToDataURL(imageFile);

        userContent = [
            {
                type: "text",
                text: userText || "اشرح لي محتوى هذه الصورة."
            },
            {
                type: "image_url",
                image_url: {
                    url: imageDataURL,
                    detail: "auto"
                }
            }
        ];
    }

    messages.push({
        role: "user",
        content: userContent
    });

    const response = await fetch(API_URL, {
        method: "POST",

        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`
        },

        body: JSON.stringify({
            model: MODEL_NAME,
            messages: messages,
            stream: false,
            temperature: 0.7,
            max_tokens: 1200
        })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const apiMessage =
            data?.error?.message ||
            data?.message ||
            `HTTP ${response.status}`;

        throw new Error(apiMessage);
    }

    const answer = data?.choices?.[0]?.message?.content;

    if (typeof answer === "string" && answer.trim()) {
        return {
            answer: answer.trim(),
            userContent: userContent
        };
    }

    // بعض النماذج قد ترجع المحتوى على هيئة أجزاء.
    if (Array.isArray(answer)) {
        const text = answer
            .filter(part => part && part.type === "text")
            .map(part => part.text || "")
            .join("\n")
            .trim();

        if (text) {
            return {
                answer: text,
                userContent: userContent
            };
        }
    }

    throw new Error("وصل رد من API، لكن لم أتمكن من استخراج النص.");
}

// ========================================
// إرسال الرسالة
// ========================================

async function handleOutgoingMessage(event) {
    if (event) {
        event.preventDefault();
    }

    if (isGenerating || !messageInput) return;

    const userText = messageInput.value.trim();

    if (!userText && !selectedFile) return;

    if (
        !API_KEY ||
        API_KEY === "ضع_مفتاح_BazaarLink_هنا"
    ) {
        showError("أضف مفتاح BazaarLink في متغير API_KEY داخل ملف script.js أولًا.");
        return;
    }

    const imageFile = selectedFile;

    // عرض رسالة المستخدم.
    const userMessageElement = addMessage(
        userText || "ما محتوى هذه الصورة؟",
        "user-message"
    );

    if (imageFile && userMessageElement) {
        const image = document.createElement("img");

        image.src = URL.createObjectURL(imageFile);
        image.alt = "الصورة المرسلة";
        image.style.display = "block";
        image.style.maxWidth = "220px";
        image.style.maxHeight = "220px";
        image.style.objectFit = "contain";
        image.style.marginTop = "8px";
        image.style.borderRadius = "10px";

        const messageText = userMessageElement.querySelector(".message-text");

        if (messageText) {
            messageText.appendChild(image);
        }
    }

    messageInput.value = "";
    clearSelectedFile();

    setLoading(true);

    const loadingElement = addMessage("جاري التفكير...", "bot-message");

    try {
        const result = await getAIResponse(userText, imageFile);

        if (loadingElement) {
            loadingElement.remove();
        }

        // حفظ الرسائل في سجل المحادثة بعد نجاح الطلب.
        chatHistory.push({
            role: "user",
            content: result.userContent
        });

        chatHistory.push({
            role: "assistant",
            content: result.answer
        });

        addMessage(result.answer, "bot-message");
    } catch (error) {
        if (loadingElement) {
            loadingElement.remove();
        }

        console.error("BazaarLink API error:", error);

        let message = "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.";

        if (error.message) {
            message += "\nالتفاصيل: " + error.message;
        }

        message +=
            "\nتحقق من مفتاح API، واسم النموذج، والرصيد، وإعدادات حساب BazaarLink.";

        showError(message);
    } finally {
        setLoading(false);

        if (messageInput) {
            messageInput.focus();
        }
    }
}

// ========================================
// أحداث الإرسال
// ========================================

if (sendMessageButton) {
    sendMessageButton.addEventListener("click", handleOutgoingMessage);
}

if (messageInput) {
    messageInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleOutgoingMessage(event);
        }
    });
}

// ========================================
// فتح وإغلاق الشات
// ========================================

if (chatbotToggler) {
    chatbotToggler.addEventListener("click", function () {
        document.body.classList.toggle("show-chatbot");
    });
}

if (closeChatbotButton) {
    closeChatbotButton.addEventListener("click", function () {
        document.body.classList.remove("show-chatbot");
    });
}

// ========================================
// EmojiMart - إذا كانت المكتبة موجودة
// ========================================

const emojiButton = document.querySelector("#emoji-picker");

if (emojiButton && typeof EmojiMart !== "undefined") {
    emojiButton.addEventListener("click", async function () {
        try {
            const picker = new EmojiMart.Picker({
                theme: "light",
                onEmojiSelect: function (emoji) {
                    if (!messageInput) return;

                    const start = messageInput.selectionStart;
                    const end = messageInput.selectionEnd;

                    const before = messageInput.value.slice(0, start);
                    const after = messageInput.value.slice(end);

                    messageInput.value =
                        before + emoji.native + after;

                    messageInput.focus();

                    const cursorPosition =
                        start + emoji.native.length;

                    messageInput.setSelectionRange(
                        cursorPosition,
                        cursorPosition
                    );
                }
            });

            document.body.appendChild(picker);

            // إزالة النافذة عند الضغط خارجها.
            const closePicker = function (event) {
                if (
                    !picker.contains(event.target) &&
                    event.target !== emojiButton
                ) {
                    picker.remove();
                    document.removeEventListener("click", closePicker);
                }
            };

            setTimeout(() => {
                document.addEventListener("click", closePicker);
            }, 0);
        } catch (error) {
            console.error("Emoji picker error:", error);
        }
    });
      }sition: "none",

  onEmojiSelect: (emoji) => {
    const {
      selectionStart: start,
      selectionEnd: end,
    } = messageInput;

    messageInput.setRangeText(
      emoji.native,
      start,
      end,
      "end"
    );

    messageInput.focus();

    messageInput.dispatchEvent(new Event("input"));
  },

  onClickOutside: (e) => {
    if (e.target.id === "emoji-picker") {
      document.body.classList.toggle("show-emoji-picker");
    } else {
      document.body.classList.remove("show-emoji-picker");
    }
  },
});

// Add emoji picker to chat form
document.querySelector(".chat-form").appendChild(picker);

// Send message
sendMessage.addEventListener("click", (e) => {
  handleOutgoingMessage(e);
});

// Upload file
document
  .querySelector("#file-upload")
  .addEventListener("click", () => {
    fileInput.click();
  });

// Close chatbot
closeChatbot.addEventListener("click", () => {
  document.body.classList.remove("show-chatbot");
});

// Toggle chatbot
chatbotToggler.addEventListener("click", () => {
  document.body.classList.toggle("show-chatbot");
});
