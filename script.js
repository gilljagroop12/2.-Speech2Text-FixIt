const micButton = document.getElementById("micButton");
const statusRow = document.getElementById("statusRow");
const statusText = document.getElementById("statusText");
const transcriptBox = document.getElementById("transcript");
const copyBtn = document.getElementById("copyBtn");
const clearBtn = document.getElementById("clearBtn");
const unsupportedMsg = document.getElementById("unsupported");

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  unsupportedMsg.style.display = "block";
  micButton.disabled = true;
  micButton.style.opacity = "0.4";
  micButton.style.cursor = "not-allowed";
} else {
  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  let isListening = false;
  let finalText = "";
  let silenceTimer = null;

  const SILENCE_LIMIT_MS = 5000;

  function resetSilenceTimer() {
    if (silenceTimer) {
      clearTimeout(silenceTimer);
    }

    silenceTimer = setTimeout(() => {
      if (isListening) {
        recognition.stop();
      }
    }, SILENCE_LIMIT_MS);
  }

  function clearSilenceTimer() {
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
  }

  micButton.addEventListener("click", () => {
    if (isListening) {
      recognition.stop();
    } else {
      finalText = transcriptBox.value;

      recognition.start();
    }
  });

  recognition.onstart = () => {
    isListening = true;

    micButton.classList.add("recording");

    statusRow.classList.add("live");

    statusText.textContent = "Listening";

    resetSilenceTimer();
  };

  recognition.onend = () => {
    isListening = false;

    micButton.classList.remove("recording");

    statusRow.classList.remove("live");

    statusText.textContent = "Press to begin";

    clearSilenceTimer();
  };

  recognition.onerror = (event) => {
    isListening = false;

    micButton.classList.remove("recording");

    statusRow.classList.remove("live");

    clearSilenceTimer();

    if (event.error === "not-allowed" || event.error === "permission-denied") {
      statusText.textContent = "Microphone blocked";
    } else if (event.error === "no-speech") {
      statusText.textContent = "No speech detected";
    } else {
      statusText.textContent = "Something went wrong";
    }
  };

  recognition.onresult = (event) => {
    resetSilenceTimer();

    let interim = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const chunk = event.results[i][0].transcript;

      if (event.results[i].isFinal) {
        finalText += chunk + " ";
      } else {
        interim += chunk;
      }
    }

    transcriptBox.value = finalText + interim;

    transcriptBox.scrollTop = transcriptBox.scrollHeight;
  };
}

// COPY BUTTON

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(transcriptBox.value);

    const original = copyBtn.textContent;

    copyBtn.textContent = "Copied";

    setTimeout(() => {
      copyBtn.textContent = original;
    }, 1500);
  } catch (err) {
    transcriptBox.select();

    document.execCommand("copy");
  }
});

// CLEAR BUTTON

clearBtn.addEventListener("click", () => {
  transcriptBox.value = "";

  transcriptBox.focus();
});

// ======================================================
// AI CONNECTION SECTION
// This connects the webpage to Node.js server.js
//
// Flow:
//
// Browser
//    ↓
// script.js
//    ↓
// Node.js server.js :3000/chat
//    ↓
// Ollama :11434
//    ↓
// Gemma3:1b
//    ↓
// Response back here
//
// ======================================================

const fixItBtn = document.getElementById("fixItBtn");

const fixItStatus = document.getElementById("fixItStatus");

fixItBtn.addEventListener("click", async () => {
  // Get text from textbox

  const originalText = transcriptBox.value;

  // Don't send empty text

  if (!originalText.trim()) {
    fixItStatus.textContent = "Nothing to fix yet";

    return;
  }

  // Tell user AI is working

  fixItStatus.textContent = "Fixing...";

  try {
    // Send request to Node.js bridge

    //const response = await fetch("http://20.119.67.29:3000/chat", {

    const response = await fetch(
      "https://wjiai.eastus.cloudapp.azure.com/chat",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          prompt: originalText,
        }),
      },
    );

    // Get answer from Node.js

    const data = await response.json();

    // Check for server errors

    if (data.error) {
      throw new Error(data.error);
    }

    // Replace textbox with AI result

    transcriptBox.value = data.response;

    fixItStatus.textContent = "Fixed!";
  } catch (error) {
    console.error(error);

    fixItStatus.textContent = "Could not reach the AI model";
  }
});
