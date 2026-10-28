// Select HTML elements
const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessage = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = fileUploadWrapper.querySelector("#file-cancel");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");

// Meta Model API setup
const API_KEY = "LLM_2039073353449386_YmyZYjPY87EiGeqqaum2GTbjZY8";

const API_URL = "https://api.meta.ai/v1/chat/completions";

const MODEL_NAME = "muse-spark-1.3";

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

// Generate bot response using Meta Model API
const generateBotResponse = async (incomingMessageDiv) => {
  const messageElement =
    incomingMessageDiv.querySelector(".message-text");

  let userHistoryMessage = null;

  try {
    // Validate API key
    if (
      !API_KEY ||
      API_KEY === "ضع_مفتاح_Meta_API_هنا"
    ) {
      throw new Error(
        "يرجى إضافة مفتاح Meta API صالح داخل إعدادات الاتصال."
      );
    }

    // Build user message content
    const userParts = [];

    if (userData.message) {
      userParts.push({
        type: "text",
        text: userData.message,
      });
    }

    // Add image using Meta's image_url format
    if (userData.file?.data && userData.file?.mime_type) {
      userParts.push({
        type: "image_url",
        image_url: {
          url: `data:${userData.file.mime_type};base64,${userData.file.data}`,
          detail: "auto",
        },
      });
    }

    // Add user message to conversation history
    userHistoryMessage = {
      role: "user",
      content:
        userParts.length === 1 &&
        userParts[0].type === "text"
          ? userParts[0].text
          : userParts,
    };

    chatHistory.push(userHistoryMessage);

    // API request options
    const requestOptions = {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },

      body: JSON.stringify({
        model: MODEL_NAME,
        messages: chatHistory,
        stream: false,
      }),
    };

    // Send request to Meta Model API
    const response = await fetch(API_URL, requestOptions);

    // Read API response safely
    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        "تعذر قراءة استجابة Meta API. تحقق من عنوان الاتصال."
      );
    }

    // Handle API errors
    if (!response.ok) {
      const apiError =
        data?.error?.message ||
        `حدث خطأ أثناء الاتصال بالخدمة. رمز الخطأ: ${response.status}`;

      throw new Error(apiError);
    }

    // Extract response text
    const apiResponseText =
      data?.choices?.[0]?.message?.content;

    // Support both text and array-form responses
    let responseText = "";

    if (typeof apiResponseText === "string") {
      responseText = apiResponseText.trim();
    } else if (Array.isArray(apiResponseText)) {
      responseText = apiResponseText
        .map((part) => {
          if (typeof part === "string") {
            return part;
          }

          return part?.text || "";
        })
        .join("")
        .trim();
    }

    // Check for empty response
    if (!responseText) {
      const finishReason = data?.choices?.[0]?.finish_reason;

      throw new Error(
        finishReason
          ? `لم يتم إنشاء الرد. سبب الإيقاف: ${finishReason}`
          : "لم تُرجع Meta API ردًا نصيًا. حاول مرة أخرى."
      );
    }

    // Display bot response
    messageElement.innerText = responseText;
    messageElement.style.color = "";

    // Add bot response to conversation history
    chatHistory.push({
      role: "assistant",
      content: responseText,
    });

  } catch (error) {
    // Log error for debugging
    console.error("Meta Model API Error:", error);

    // Display error message
    messageElement.innerText =
      error.name === "TypeError"
        ? "تعذر الاتصال بالخدمة. تحقق من الإنترنت أو إعدادات الاتصال."
        : error.message || "حدث خطأ غير متوقع. حاول مرة أخرى.";

    messageElement.style.color = "#ff0000";

    // Remove the failed user message from history
    if (userHistoryMessage) {
      const historyIndex = chatHistory.lastIndexOf(
        userHistoryMessage
      );

      if (historyIndex !== -1) {
        chatHistory.splice(historyIndex, 1);
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

    // Remove thinking indicator
    incomingMessageDiv.classList.remove("thinking");

    // Scroll chat to bottom
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

  // Scroll chat to bottom
  chatBody.scrollTo({
    top: chatBody.scrollHeight,
    behavior: "smooth",
  });

  // Clear input after saving the message
  messageInput.value = "";

  messageInput.dispatchEvent(new Event("input"));

  // Remove uploaded file indicator
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

    // Scroll chat to bottom
    chatBody.scrollTo({
      top: chatBody.scrollHeight,
      behavior: "smooth",
    });

    // Generate response
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

    // Store image data
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
