const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessage = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = fileUploadWrapper.querySelector("#file-cancel");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");

// API setup
const API_KEY = "AQ.Ab8RN6KxyUMzOUKwzzQ1sHECRSFh3HW4FQ3t-ZirWgY-50hpRw";

const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

// Initialize user message and file data
const userData = {
  message: null,
  file: {
    data: null,
    mime_type: null,
  },
};

// Store chat history
const chatHistory = [];
const initialInputHeight = messageInput.scrollHeight;

// Create message element with dynamic classes and return it
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Generate bot response using API
const generateBotResponse = async (incomingMessageDiv) => {
  const messageElement =
    incomingMessageDiv.querySelector(".message-text");

  // Add user message to chat history
  const userParts = [];

  if (userData.message) {
    userParts.push({
      text: userData.message,
    });
  }

  if (userData.file?.data && userData.file?.mime_type) {
    userParts.push({
      inline_data: {
        mime_type: userData.file.mime_type,
        data: userData.file.data,
      },
    });
  }

  chatHistory.push({
    role: "user",
    parts: userParts,
  });

  // API request options
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-goog-api-key": API_KEY,
    },
    body: JSON.stringify({
      contents: chatHistory,
    }),
  };

  try {
    // Validate API key
    if (
      !API_KEY ||
      API_KEY === "PUT_YOUR_NEW_API_KEY_HERE"
    ) {
      throw new Error(
        "يرجى إضافة مفتاح Gemini API صالح في إعدادات الاتصال."
      );
    }

    // Fetch bot response from API
    const response = await fetch(API_URL, requestOptions);

    // Read API response
    const data = await response.json();

    // Handle API errors
    if (!response.ok) {
      const apiError =
        data?.error?.message ||
        `حدث خطأ أثناء الاتصال بالخدمة. رمز الخطأ: ${response.status}`;

      throw new Error(apiError);
    }

    // Extract response safely
    const candidate = data?.candidates?.[0];

    const apiResponseText = candidate?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .trim();

    // Check for empty response
    if (!apiResponseText) {
      const finishReason = candidate?.finishReason;

      throw new Error(
        finishReason
          ? `لم يتم إنشاء الرد. سبب الإيقاف: ${finishReason}`
          : "لم يُرجع Gemini ردًا نصيًا. حاول مرة أخرى."
      );
    }

    // Display bot response
    messageElement.innerText = apiResponseText;

    // Add bot response to chat history
    chatHistory.push({
      role: "model",
      parts: [
        {
          text: apiResponseText,
        },
      ],
    });
  } catch (error) {
    // Handle errors
    console.error("Gemini API Error:", error);

    messageElement.innerText =
      error.name === "TypeError"
        ? "تعذر الاتصال بالخدمة. تحقق من اتصال الإنترنت وحاول مجددًا."
        : error.message || "حدث خطأ غير متوقع. حاول مرة أخرى.";

    messageElement.style.color = "#ff0000";

    // Remove failed user message from history
    // so it does not break the next request
    if (chatHistory.length > 0) {
      const lastMessage = chatHistory[chatHistory.length - 1];

      if (lastMessage.role === "user") {
        chatHistory.pop();
      }
    }
  } finally {
    // Reset user's file data
    userData.file = {
      data: null,
      mime_type: null,
    };

    fileInput.value = "";
    fileUploadWrapper.classList.remove("file-uploaded");

    // Remove thinking indicator and scroll chat to bottom
    incomingMessageDiv.classList.remove("thinking");

    chatBody.scrollTo({
      top: chatBody.scrollHeight,
      behavior: "smooth",
    });
  }
};

// Handle outgoing user messages
const handleOutgoingMessage = (e) => {
  e.preventDefault();

  userData.message = messageInput.value.trim();

  // Prevent empty messages unless a file is attached
  if (!userData.message && !userData.file?.data) {
    return;
  }

  // Create and display user message
  const messageContent = `
    <div class="message-text"></div>
    ${
      userData.file?.data
        ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />`
        : ""
    }
  `;

  const outgoingMessageDiv = createMessageElement(
    messageContent,
    "user-message"
  );

  outgoingMessageDiv.querySelector(".message-text").innerText =
    userData.message || "";

  chatBody.appendChild(outgoingMessageDiv);

  chatBody.scrollTo({
    top: chatBody.scrollHeight,
    behavior: "smooth",
  });

  // Clear input after saving the message
  messageInput.value = "";
  messageInput.dispatchEvent(new Event("input"));

  fileUploadWrapper.classList.remove("file-uploaded");

  // Simulate bot response with thinking indicator
  setTimeout(() => {
    const messageContent = `
      <svg class="bot-avatar"
        xmlns="http://www.w3.org/2000/svg"
        width="50"
        height="50"
        viewBox="0 0 1024 1024">
        <path
          d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"/>
      </svg>

      <div class="message-text">
        <div class="thinking-indicator">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>
    `;

    const incomingMessageDiv = createMessageElement(
      messageContent,
      "bot-message",
      "thinking"
    );

    chatBody.appendChild(incomingMessageDiv);

    chatBody.scrollTo({
      top: chatBody.scrollHeight,
      behavior: "smooth",
    });

    generateBotResponse(incomingMessageDiv);
  }, 600);
};

// Adjust input field height dynamically
messageInput.addEventListener("input", () => {
  messageInput.style.height = `${initialInputHeight}px`;

  messageInput.style.height =
    `${messageInput.scrollHeight}px`;

  document.querySelector(".chat-form").style.borderRadius =
    messageInput.scrollHeight > initialInputHeight
      ? "15px"
      : "32px";
});

// Handle Enter key press for sending messages
messageInput.addEventListener("keydown", (e) => {
  if (
    e.key === "Enter" &&
    !e.shiftKey &&
    window.innerWidth > 768
  ) {
    e.preventDefault();
    handleOutgoingMessage(e);
  }
});

// Handle file input change and preview the selected file
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];

  if (!file) return;

  // Accept images only
  if (!file.type.startsWith("image/")) {
    alert("يرجى اختيار ملف صورة.");
    fileInput.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    const result = e.target.result;

    fileUploadWrapper.querySelector("img").src = result;

    fileUploadWrapper.classList.add("file-uploaded");

    const base64String = result.split(",")[1];

    // Store file data
    userData.file = {
      data: base64String,
      mime_type: file.type,
    };
  };

  reader.onerror = () => {
    alert("تعذر قراءة الملف. حاول اختيار صورة أخرى.");
    fileInput.value = "";
  };

  reader.readAsDataURL(file);
});

// Cancel file upload
fileCancelButton.addEventListener("click", () => {
  userData.file = {
    data: null,
    mime_type: null,
  };

  fileInput.value = "";

  fileUploadWrapper.classList.remove("file-uploaded");
});

// Initialize emoji picker and handle emoji selection
const picker = new EmojiMart.Picker({
  theme: "light",
  skinTonePosition: "none",
  previewPosition: "none",

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
  },

  onClickOutside: (e) => {
    if (e.target.id === "emoji-picker") {
      document.body.classList.toggle("show-emoji-picker");
    } else {
      document.body.classList.remove("show-emoji-picker");
    }
  },
});

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
