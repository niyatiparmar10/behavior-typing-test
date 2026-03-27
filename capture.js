// ---------- Paragraphs (single line — no \n inside) ----------

const paragraphs = [
  `Artificial intelligence is changing the way people work, communicate, and make decisions every day. Machines can now recognize faces, translate languages, and even write text that sounds like a human. Many experts believe that within the next decade, most routine jobs will be assisted or replaced by intelligent software. While this creates new opportunities, it also raises important questions about privacy, fairness, and the future of employment.`,

  `Scientists around the world are racing to develop clean energy solutions to slow down climate change. Solar panels and wind turbines are becoming cheaper and more powerful with every passing year. Several countries have already committed to producing all their electricity from renewable sources by the year 2050. The shift away from fossil fuels will require major changes in industry, transportation, and daily household habits.`,

  `Space exploration has entered a new era with private companies launching rockets alongside government agencies. Missions to the Moon and Mars are no longer distant dreams but active projects with real timelines. Astronauts may establish a permanent base on the Moon within the next fifteen years as a stepping stone to deeper space. These missions will test human endurance, technology, and our ability to survive far from Earth.`,

  `Social media platforms have transformed how people consume news, connect with friends, and express their opinions. Within seconds, a post can reach millions of people across different countries and cultures. However, the rapid spread of misinformation has become a serious problem that governments and researchers are trying to solve. Teaching people to critically evaluate online content is now considered an essential skill in modern education.`,

  `Cyber security systems are increasingly focusing on behavioral patterns to verify user identity during active sessions. Typing rhythm, key hold durations, and correction habits can uniquely identify individuals without requiring extra hardware. Continuous authentication operates transparently in the background, monitoring interaction signals in real time. This approach reduces the risk of unauthorized access and improves security in sensitive digital environments.`,

  `The global economy is experiencing rapid changes driven by automation, shifting trade relationships, and new technologies. Countries that invest heavily in education and digital infrastructure tend to adapt faster to these changes. Small businesses are finding new opportunities through online platforms that allow them to reach international customers directly. Economic experts argue that preparing workers for digital skills is the most important investment any government can make today.`,

  `Modern healthcare is being transformed by advances in genetic research, wearable sensors, and artificial intelligence diagnostics. Doctors can now detect certain diseases years earlier than before by analyzing patterns in patient data. Personalized medicine tailors treatment plans to the unique biology of each individual patient rather than applying general guidelines. These developments have the potential to significantly extend healthy human lifespan over the coming decades.`,

  `Electric vehicles are rapidly becoming the preferred choice for consumers who want to reduce their carbon footprint. Major car manufacturers have announced plans to phase out petrol and diesel engines within the next twenty years. Charging infrastructure is expanding quickly in cities, though rural areas still face significant coverage gaps. Battery technology continues to improve, with newer models offering longer range and faster charging times than ever before.`,

  `Mental health awareness has grown significantly over the past decade, reducing some of the stigma around seeking help. Young people in particular are more open about discussing anxiety, stress, and depression than previous generations were. Digital therapy apps and online counseling platforms have made support more accessible to people in remote areas. Experts emphasize that mental health care should be treated with the same urgency and resources as physical health care.`,

  `Water scarcity is becoming one of the most serious challenges facing both developed and developing countries worldwide. Changing rainfall patterns, growing populations, and industrial demand are putting enormous pressure on freshwater supplies. Engineers are developing advanced filtration systems that can convert seawater into safe drinking water at lower costs. Governments are also encouraging citizens to reduce water waste through smarter irrigation and household conservation habits.`,
];

// ---------- State ----------

let sessionCount = 1;
let selectedParagraph, promptText, chars;
let keystrokeData = [];
let mouseData = [];
let pauseData = [];
let lastKeyTime = null;
let typingStarted = false;
let typingStartTime = null;
let lastMouseTime = 0;
let sessionID = generateSessionID();
const sessionStartTime = Date.now();

// ---------- DOM refs ----------

const typingDisplay = document.getElementById("typingDisplay");
const typingArea = document.getElementById("typingArea");
const statusMessage = document.getElementById("statusMessage");
const sessionCounter = document.getElementById("sessionCounter");

// ---------- Helpers ----------

function generateSessionID() {
  return "session_" + Date.now();
}

function pickParagraph() {
  const idx = Math.floor(Math.random() * paragraphs.length);
  selectedParagraph = paragraphs[idx];
  promptText = selectedParagraph;
  chars = promptText.split("");
}

// ---------- Build Monkeytype display ----------

function buildDisplay() {
  typingDisplay.innerHTML = "";
  chars.forEach((ch, i) => {
    const span = document.createElement("span");
    // show space as non-breaking space so it's visible
    span.textContent = ch === " " ? "\u00A0" : ch;
    span.className = "char-pending";
    span.id = "char-" + i;
    typingDisplay.appendChild(span);
  });
  setCursor(0);
}

function setCursor(index) {
  const old = document.querySelector(".char-cursor");
  if (old) old.classList.remove("char-cursor");
  const el = document.getElementById("char-" + index);
  if (el) el.classList.add("char-cursor");
}

function updateDisplay(typedText, cursorIndex = typingArea.selectionStart) {
  const scrollY = window.scrollY;
  cursorIndex = Math.max(0, Math.min(cursorIndex, chars.length));

  for (let i = 0; i < chars.length; i++) {
    const span = document.getElementById("char-" + i);
    if (!span) continue;
    span.classList.remove(
      "char-correct",
      "char-wrong",
      "char-pending",
      "char-cursor",
    );

    if (i < typedText.length) {
      span.classList.add(
        typedText[i] === chars[i] ? "char-correct" : "char-wrong",
      );
    } else {
      span.classList.add("char-pending");
    }
  }

  setCursor(cursorIndex);
  window.scrollTo(0, scrollY);

  if (typedText === promptText) {
    statusMessage.innerText =
      "Typing complete. You can now download the session data.";
    statusMessage.style.color = "#e2b714";
  } else {
    statusMessage.innerText = "";
  }
}

// ---------- Init first paragraph ----------

pickParagraph();
buildDisplay();

// ---------- Refresh paragraph button ----------
// Only refreshes the paragraph — does NOT increment session count
// Session count increments only on successful download

document.getElementById("refreshPara").addEventListener("click", function () {
  if (
    !confirm(
      "Get a new paragraph? Your current typing progress will be cleared.",
    )
  )
    return;
  pickParagraph();
  buildDisplay();
  resetTypingState();
  sessionID = generateSessionID(); // new session ID for new para
  statusMessage.innerText = "";
});

// ---------- Focus management ----------
// Only focus typingArea when clicking the display, NOT the whole document
// This fixes the "can't type in form fields" bug

typingDisplay.addEventListener("click", function () {
  typingArea.focus();
});

// ---------- Prevent paste/copy/cut in typing area ----------

typingArea.addEventListener("paste", (e) => e.preventDefault());
typingArea.addEventListener("copy", (e) => e.preventDefault());
typingArea.addEventListener("cut", (e) => e.preventDefault());

// ---------- Tab switch warning ----------

document.addEventListener("visibilitychange", function () {
  if (document.hidden)
    alert("Please stay on this page during the typing session.");
});

// ---------- Page leave warning ----------

window.addEventListener("beforeunload", function (e) {
  e.preventDefault();
  e.returnValue = "";
});

// ---------- Modifier keys (kept + tagged) ----------

const MODIFIER_KEYS = [
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "CapsLock",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "PageUp",
  "PageDown",
];

// ---------- Keyboard capture ----------

typingArea.addEventListener("keydown", function (event) {
  const now = Date.now();

  if (!typingStarted) {
    typingStarted = true;
    typingStartTime = now;
  }

  if (lastKeyTime !== null) {
    const pause = now - lastKeyTime;
    if (pause > 0)
      pauseData.push({ event: "pause", duration: pause, time: now });
  }
  lastKeyTime = now;

  keystrokeData.push({
    key: event.key,
    event: "press",
    time: now,
    cursor: typingArea.selectionStart,
    is_modifier: MODIFIER_KEYS.includes(event.key),
    is_correct:
      event.key.length === 1 &&
      typingArea.selectionStart < chars.length &&
      event.key === chars[typingArea.selectionStart],
  });
});

typingArea.addEventListener("keyup", function (event) {
  const now = Date.now();
  keystrokeData.push({
    key: event.key,
    event: "release",
    time: now,
    cursor: typingArea.selectionStart,
    is_modifier: MODIFIER_KEYS.includes(event.key),
    is_correct:
      event.key.length === 1 &&
      typingArea.selectionStart > 0 &&
      event.key === chars[typingArea.selectionStart - 1],
  });

  // Update visual cursor position and display when navigation keys are used
  if (
    ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(
      event.key,
    )
  ) {
    updateDisplay(typingArea.value, typingArea.selectionStart);
  }
});

// ---------- Input → update display ----------

typingArea.addEventListener("input", function () {
  updateDisplay(typingArea.value, typingArea.selectionStart);
});

// ---------- Mouse capture on display ----------

typingDisplay.addEventListener("mousemove", function (event) {
  const now = Date.now();
  if (now - lastMouseTime > 50) {
    const rect = typingDisplay.getBoundingClientRect();
    mouseData.push({
      event: "move",
      x: Math.round(event.clientX - rect.left),
      y: Math.round(event.clientY - rect.top),
      time: now,
    });
    lastMouseTime = now;
  }
});

typingDisplay.addEventListener("click", function (event) {
  const rect = typingDisplay.getBoundingClientRect();
  mouseData.push({
    event: "click",
    x: Math.round(event.clientX - rect.left),
    y: Math.round(event.clientY - rect.top),
    time: Date.now(),
  });
});

// ---------- Session quality check ----------

function sessionQualityCheck(durationMs) {
  if (durationMs < 20000) {
    alert(
      "Session too short (under 20 seconds). Please type at a normal pace.",
    );
    return false;
  }
  if (durationMs > 300000) {
    alert("Session too long (over 5 minutes). Please try again.");
    return false;
  }
  return true;
}

// ---------- Reset typing state (not form fields) ----------

function resetTypingState() {
  keystrokeData = [];
  mouseData = [];
  pauseData = [];
  lastKeyTime = null;
  typingStarted = false;
  typingStartTime = null;
  typingArea.value = "";
  lastMouseTime = 0;
}

// ---------- Download ----------

document.getElementById("downloadData").addEventListener("click", function () {
  const userID = document.getElementById("userID").value.trim();
  const age = document.getElementById("age").value.trim();
  const gender = document.getElementById("gender").value;
  const keyboard = document.getElementById("keyboard").value;
  const typingExp = document.getElementById("typingExp").value;

  if (typingArea.value !== promptText) {
    alert(
      "Please finish typing the full paragraph correctly before downloading.",
    );
    return;
  }

  if (userID === "") {
    alert("Please enter a User ID.");
    return;
  }

  const sessionEndTime = Date.now();
  const sessionDuration = typingStartTime
    ? sessionEndTime - typingStartTime
    : sessionEndTime - sessionStartTime;

  if (!sessionQualityCheck(sessionDuration)) return;

  const sessionStartTimeNew = typingStartTime || Date.now();

  const sessionData = {
    user_id: userID,
    session_id: sessionID,
    session_number: sessionCount,
    session_start: sessionStartTimeNew,
    typing_start: typingStartTime,
    session_end: sessionEndTime,
    session_duration: sessionDuration,
    prompt_text: selectedParagraph,
    typed_text: typingArea.value,
    ui_type: "monkeytype",
    device_info: {
      platform: navigator.platform,
      user_agent: navigator.userAgent,
      screen_w: window.screen.width,
      screen_h: window.screen.height,
    },
    participant_info: {
      age: age,
      gender: gender,
      keyboard_type: keyboard,
      typing_exp: typingExp,
    },
    keystrokes: keystrokeData,
    pauses: pauseData,
    mouse: mouseData,
  };

  const blob = new Blob([JSON.stringify(sessionData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = userID + "_session" + sessionCount + "_" + sessionID + ".json";
  a.click();

  // Increment session count ONLY on successful download
  sessionCount++;
  sessionCounter.innerText = sessionCount;

  // Generate new session ID and new paragraph for next session
  sessionID = generateSessionID();
  pickParagraph();
  buildDisplay();
  resetTypingState();
  statusMessage.innerText = "";
});
