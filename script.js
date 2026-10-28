// ========================================
// Chatbot Elements - الأسماء الأصلية
// ========================================

const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessage = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = document.querySelector("#file-cancel");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");


// ========================================
// BazaarLink API Configuration
// ========================================

// ضع مفتاح BazaarLink الخاص بك هنا
const API_KEY = "sk-bl-G_PENgckZ0mZGHbRbmo-bmMwDCLnnD2Ky0fO3t661iqj7V9U";

// عنوان API
const API_URL =
    "https://api.bazaarlink.ai/v1/chat/completions";

// نموذج تلقائي ضمن مسار النماذج المجانية
const MODEL_NAME = "auto:free";


// ========================================
// User Data
// ========================================

const userData = {
    message: null,
    file: {
        data: null,
        mime_type: null
    }
};


// سجل المحادثة
const chatHistory = [];


// ========================================
// Create Message Element
// ========================================

function createMessageElement(content, ...classes) {
    const div = document.createElement("div");

    div.classList.add("message", ...classes);

    div.innerHTML = content;

    return div;
}


// ========================================
// Format Bot Response
// ========================================

function formatBotResponse(text) {
    const escapedText = String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    return escapedText
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>");
}


// ========================================
// Generate Bot Response
// ========================================

async function generateBotResponse(incomingMessageDiv) {
    const messageElement =
        incomingMessageDiv.querySelector(".message-text");

    try {
        if (
            !API_KEY ||
            API_KEY === "ضع_مفتاح_BazaarLink_هنا"
        ) {
            throw new Error(
                "يرجى وضع مفتاح BazaarLink API داخل الكود."
            );
        }

        // تجهيز سجل الرسائل بصيغة OpenAI-compatible
        const messages = [
            {
                role: "system",
                content:
                    "أنت مساعد ذكي ومفيد. أجب باللغة التي يستخدمها المستخدم، " +
                    "واجعل إجاباتك واضحة ومباشرة."
            },
            ...chatHistory
        ];

        // إضافة الرسالة الحالية
        let currentMessage;

        if (userData.file.data) {
            // إرسال الصورة مع النص
            currentMessage = {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: userData.message ||
                            "اشرح محتوى الصورة المرفقة."
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: userData.file.data,
                            detail: "auto"
                        }
                    }
                ]
            };
        } else {
            // إرسال رسالة نصية
            currentMessage = {
                role: "user",
                content: userData.message
            };
        }

        messages.push(currentMessage);

        // إرسال الطلب إلى BazaarLink
        const response = await fetch(API_URL, {
            method: "POST",

            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                model: MODEL_NAME,
                messages: messages,
                stream: false,
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        // قراءة الاستجابة
        const data = await response.json();

        if (!response.ok) {
            const errorMessage =
                data?.error?.message ||
                data?.message ||
                `خطأ في الاتصال بالخدمة (${response.status})`;

            throw new Error(errorMessage);
        }

        // استخراج رد المساعد
        const botResponse =
            data?.choices?.[0]?.message?.content;

        if (!botResponse) {
            throw new Error(
                "لم تصل إجابة من النموذج. تحقق من اسم النموذج ورصيد الحساب."
            );
        }

        // بعض النماذج قد تعيد المحتوى على هيئة أجزاء
        let finalResponse = "";

        if (typeof botResponse === "string") {
            finalResponse = botResponse;
        } else if (Array.isArray(botResponse)) {
            finalResponse = botResponse
                .filter(part => part.type === "text")
                .map(part => part.text || "")
                .join("\n");
        } else {
            finalResponse = String(botResponse);
        }

        // عرض الإجابة
        messageElement.innerHTML =
            formatBotResponse(finalResponse);

        // حفظ المحادثة لإرسال سياقها في الطلبات التالية
        chatHistory.push(currentMessage);

        chatHistory.push({
            role: "assistant",
            content: finalResponse
        });

    } catch (error) {
        console.error("BazaarLink API Error:", error);

        messageElement.textContent =
            "عذرًا، حدثت مشكلة أثناء الحصول على الرد.\n" +
            error.message;

        messageElement.style.color = "red";

    } finally {
        // إزالة مؤشر الانتظار
        incomingMessageDiv.classList.remove(
            "message-loading"
        );

        chatBody.scrollTo({
            top: chatBody.scrollHeight,
            behavior: "smooth"
        });

        // مسح بيانات الملف بعد انتهاء الطلب
        userData.file = {
            data: null,
            mime_type: null
        };

        if (fileInput) {
            fileInput.value = "";
        }

        if (fileUploadWrapper) {
            fileUploadWrapper.classList.remove(
                "file-uploaded"
            );
        }
    }
}


// ========================================
// Handle Outgoing Message
// ========================================

function handleOutgoingMessage(e) {
    if (e) {
        e.preventDefault();
    }

    const message = messageInput.value.trim();

    // لا ترسل طلبًا إذا لم يوجد نص أو ملف
    if (!message && !userData.file.data) {
        return;
    }

    // تخزين رسالة المستخدم
    userData.message = message;

    // إنشاء رسالة المستخدم
    const messageContent = `
        <div class="message-text"></div>
    `;

    const outgoingMessageDiv = createMessageElement(
        messageContent,
        "outgoing"
    );

    const outgoingText =
        outgoingMessageDiv.querySelector(".message-text");

    outgoingText.textContent = message;

    // إظهار الصورة إذا كانت موجودة
    if (userData.file.data) {
        const imageElement =
            document.createElement("img");

        imageElement.src = userData.file.data;
        imageElement.alt = "الصورة المرفقة";
        imageElement.classList.add("attachment");

        outgoingMessageDiv.appendChild(imageElement);
    }

    // إضافة رسالة المستخدم إلى الواجهة
    chatBody.appendChild(outgoingMessageDiv);

    // تفريغ مربع الكتابة
    messageInput.value = "";

    // إعادة ارتفاع مربع الكتابة إذا كان يدعم تغيير الارتفاع
    messageInput.style.height = "auto";

    // الانتقال إلى آخر المحادثة
    chatBody.scrollTo({
        top: chatBody.scrollHeight,
        behavior: "smooth"
    });

    // إنشاء مؤشر انتظار المساعد
    const thinkingContent = `
        <div class="message-text">
            <div class="thinking-indicator">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        </div>
    `;

    const incomingMessageDiv = createMessageElement(
        thinkingContent,
        "incoming",
        "message-loading"
    );

    chatBody.appendChild(incomingMessageDiv);

    chatBody.scrollTo({
        top: chatBody.scrollHeight,
        behavior: "smooth"
    });

    // طلب الرد من BazaarLink
    generateBotResponse(incomingMessageDiv);
}


// ========================================
// Send Message Events
// ========================================

if (sendMessage) {
    sendMessage.addEventListener(
        "click",
        handleOutgoingMessage
    );
}

if (messageInput) {
    messageInput.addEventListener("keydown", function (e) {
        const message = messageInput.value.trim();

        if (
            e.key === "Enter" &&
            !e.shiftKey &&
            (message || userData.file.data)
        ) {
            e.preventDefault();
            handleOutgoingMessage(e);
        }
    });
}


// ========================================
// File Upload
// ========================================

if (fileInput) {
    fileInput.addEventListener("change", function () {
        const file = fileInput.files[0];

        if (!file) {
            return;
        }

        // السماح بالصور فقط في هذا الجزء
        if (!file.type.startsWith("image/")) {
            alert("يرجى اختيار ملف صورة.");

            fileInput.value = "";
            return;
        }

        // التحقق من حجم الصورة: 5 ميجابايت
        const maxSize = 5 * 1024 * 1024;

        if (file.size > maxSize) {
            alert(
                "حجم الصورة أكبر من 5 ميجابايت. اختر صورة أصغر."
            );

            fileInput.value = "";
            return;
        }

        const fileReader = new FileReader();

        fileReader.onload = function (e) {
            userData.file = {
                data: e.target.result,
                mime_type: file.type
            };

            if (fileUploadWrapper) {
                fileUploadWrapper.classList.add(
                    "file-uploaded"
                );
            }
        };

        fileReader.onerror = function () {
            alert("تعذر قراءة الصورة. حاول مرة أخرى.");
        };

        fileReader.readAsDataURL(file);
    });
}


// ========================================
// Cancel File Upload
// ========================================

if (fileCancelButton) {
    fileCancelButton.addEventListener("click", function () {
        userData.file = {
            data: null,
            mime_type: null
        };

        if (fileInput) {
            fileInput.value = "";
        }

        if (fileUploadWrapper) {
            fileUploadWrapper.classList.remove(
                "file-uploaded"
            );
        }
    });
}


// ========================================
// Chatbot Toggle
// ========================================

if (chatbotToggler) {
    chatbotToggler.addEventListener("click", function () {
        document.body.classList.toggle("show-chatbot");
    });
}


// ========================================
// Close Chatbot
// ========================================

if (closeChatbot) {
    closeChatbot.addEventListener("click", function () {
        document.body.classList.remove("show-chatbot");
    });
}


// ========================================
// Emoji Picker - EmojiMart
// ========================================

if (fileUploadWrapper) {
    const emojiButton =
        document.querySelector("#emoji-picker");

    if (emojiButton) {
        emojiButton.addEventListener("click", async function () {
            try {
                const picker = document.querySelector(
                    "em-emoji-picker"
                );

                if (picker) {
                    picker.remove();
                    return;
                }

                if (
                    typeof customElements !== "undefined" &&
                    !customElements.get("em-emoji-picker")
                ) {
                    await customElements.whenDefined(
                        "em-emoji-picker"
                    );
                }

                const newPicker =
                    document.createElement("em-emoji-picker");

                newPicker.addEventListener(
                    "emoji-click",
                    function (event) {
                        const emoji =
                            event.detail.unicode;

                        const start =
                            messageInput.selectionStart;

                        const end =
                            messageInput.selectionEnd;

                        const value = messageInput.value;

                        messageInput.value =
                            value.slice(0, start) +
                            emoji +
                            value.slice(end);

                        messageInput.focus();

                        messageInput.selectionStart =
                            messageInput.selectionEnd =
                            start + emoji.length;
                    }
                );

                fileUploadWrapper.appendChild(newPicker);

            } catch (error) {
                console.error(
                    "Emoji picker error:",
                    error
                );
            }
        });
    }
}error.message) {
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
