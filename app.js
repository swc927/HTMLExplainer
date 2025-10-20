// Code Explainer by SWC
// All logic runs locally in the browser.
// The parser creates an explanation plan that moves from tags to attributes to nesting.

const state = {
  steps: [],
  index: 0,
  voices: [],
  score: 0,
  lang: "en",
  sources: new Set(),
};

// Minimal MDN map for trusted references
const MDN = {
  html: {
    _root: {
      title: "HTML basics",
      url: "https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/HTML_basics",
    },
    a: {
      title: "a element",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a",
    },
    div: {
      title: "div element",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/div",
    },
    span: {
      title: "span element",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/span",
    },
    p: {
      title: "p element",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/p",
    },
    h1: {
      title: "h1 element",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements",
    },
    img: {
      title: "img element",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img",
    },
    ul: {
      title: "ul element",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ul",
    },
    ol: {
      title: "ol element",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol",
    },
    li: {
      title: "li element",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/li",
    },
    button: {
      title: "button element",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button",
    },
    input: {
      title: "input element",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input",
    },
    form: {
      title: "form element",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form",
    },
    label: {
      title: "label element",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label",
    },
    section: {
      title: "section element",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/section",
    },
    article: {
      title: "article element",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/article",
    },
    nav: {
      title: "nav element",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav",
    },
    header: {
      title: "header element",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/header",
    },
    footer: {
      title: "footer element",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/footer",
    },
    script: {
      title: "script element",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script",
    },
    style: {
      title: "style element",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style",
    },
  },
  css: {
    _root: {
      title: "CSS first steps",
      url: "https://developer.mozilla.org/en-US/docs/Learn/CSS/First_steps",
    },
    color: {
      title: "color",
      url: "https://developer.mozilla.org/en-US/docs/Web/CSS/color_value",
    },
    background: {
      title: "background",
      url: "https://developer.mozilla.org/en-US/docs/Web/CSS/background",
    },
    display: {
      title: "display",
      url: "https://developer.mozilla.org/en-US/docs/Web/CSS/display",
    },
    margin: {
      title: "margin",
      url: "https://developer.mozilla.org/en-US/docs/Web/CSS/margin",
    },
    padding: {
      title: "padding",
      url: "https://developer.mozilla.org/en-US/docs/Web/CSS/padding",
    },
    border: {
      title: "border",
      url: "https://developer.mozilla.org/en-US/docs/Web/CSS/border",
    },
    grid: {
      title: "grid",
      url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout",
    },
  },
  js: {
    _root: {
      title: "JavaScript first steps",
      url: "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps",
    },
    querySelector: {
      title: "Document.querySelector",
      url: "https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector",
    },
    addEventListener: {
      title: "EventTarget.addEventListener",
      url: "https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener",
    },
    forEach: {
      title: "Array.prototype.forEach",
      url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach",
    },
    map: {
      title: "Array.prototype.map",
      url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map",
    },
  },
};

// Elements
const codeInput = document.getElementById("codeInput");
const explainBtn = document.getElementById("explainBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const playBtn = document.getElementById("playBtn");
const explainBlock = document.getElementById("explainBlock");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const previewFrame = document.getElementById("previewFrame");
const refreshPreview = document.getElementById("refreshPreview");
const autoRefresh = document.getElementById("autoRefresh");
const languageSelect = document.getElementById("languageSelect");
const sourceList = document.getElementById("sourceList");
const newSessionBtn = document.getElementById("newSessionBtn");
const helpBtn = document.getElementById("helpBtn");

// Voice setup
function loadVoices() {
  state.voices = window.speechSynthesis.getVoices();
}
if ("speechSynthesis" in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function chooseVoice(langGuess) {
  if (!state.voices.length) return null;
  // Prefer Google voices if present
  const googlePreferred = state.voices.find(
    (v) =>
      v.name &&
      v.name.toLowerCase().includes("google") &&
      (!langGuess || v.lang.startsWith(langGuess))
  );
  if (googlePreferred) return googlePreferred;
  const byLang = state.voices.find(
    (v) => langGuess && v.lang.startsWith(langGuess)
  );
  return byLang || state.voices[0];
}

// Language detection simple heuristic
function detectLang(text) {
  if (state.lang !== "auto") return state.lang;
  // Detect CJK
  if (/[\u3400-\u9FBF]/.test(text)) return "zh-CN";
  if (/[\u3040-\u30FF]/.test(text)) return "ja";
  if (/[\u3130-\u318F\uAC00-\uD7AF]/.test(text)) return "ko";
  // Default to browser
  return navigator.language || "en";
}

// Basic HTML tokenizer to plan steps
function planFromHTML(html) {
  const container = document.createElement("div");
  container.innerHTML = html;
  const steps = [];
  function walk(node, depth) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase();
      const attrs = [...node.attributes].map((a) => ({
        name: a.name,
        value: a.value,
      }));
      const text = node.textContent && node.textContent.trim();
      steps.push({
        type: "element",
        title: `<${tag}> element`,
        text: explainElement(tag, attrs, text),
        mdn: MDN.html[tag] || MDN.html._root,
      });
      // Attributes as sub steps
      attrs.forEach((attr) => {
        const mdn = MDN.html[tag] || MDN.html._root;
        steps.push({
          type: "attribute",
          title: `${tag} attribute ${attr.name}`,
          text: explainAttribute(tag, attr),
          mdn,
        });
      });
      // Children
      node.childNodes.forEach((child) => walk(child, depth + 1));
    } else if (node.nodeType === Node.TEXT_NODE) {
      const content = node.textContent.trim();
      if (content) {
        steps.push({
          type: "text",
          title: "Text content",
          text: `This is plain text content that will be rendered as is inside its parent element.`,
          mdn: MDN.html._root,
        });
      }
    }
  }
  container.childNodes.forEach((n) => walk(n, 0));
  if (steps.length === 0) {
    steps.push({
      type: "note",
      title: "Nothing detected",
      text: "I did not find valid HTML elements. Paste proper markup then try again.",
      mdn: MDN.html._root,
    });
  }
  return steps;
}

function explainElement(tag, attrs, text) {
  const hasId = attrs.find((a) => a.name === "id");
  const hasClass = attrs.find((a) => a.name === "class");
  const details = [];
  details.push(
    `This is the ${tag} element. It defines structure or meaning within the document.`
  );
  if (hasId)
    details.push(`It has an id attribute used as a unique hook in CSS or JS.`);
  if (hasClass)
    details.push(`It uses class for styling or selecting groups of elements.`);
  if (text && text.length < 120)
    details.push(`It contains short text "${text}".`);
  return details.join(" ");
}

function explainAttribute(tag, attr) {
  return `The ${attr.name} attribute on ${tag} is set to "${attr.value}". This configures behaviour, identification or presentation.`;
}

// Stepper control
function renderStep() {
  const step = state.steps[state.index];
  if (!step) {
    explainBlock.innerHTML = "No step.";
    return;
  }
  const block = `
    <h3>${escapeHTML(step.title)}</h3>
    <p>${escapeHTML(step.text)}</p>
    ${
      step.mdn
        ? `<p class="small">See more on <a href="${
            step.mdn.url
          }" target="_blank" rel="noopener">${escapeHTML(
            step.mdn.title
          )}</a></p>`
        : ""
    }
  `;
  explainBlock.innerHTML = block;
  if (step.mdn) state.sources.add(step.mdn.url);
  updateProgress();
  maybeQuiz(step);
  if (document.getElementById("autoRefresh").checked) {
    updatePreview();
  }
}

function updateProgress() {
  const total = state.steps.length;
  const current = state.index + 1;
  const ratio = total ? Math.max(0, Math.min(1, current / total)) : 0;
  progressFill.style.width = `${Math.floor(ratio * 100)}%`;
  progressText.textContent = `${current} of ${total}`;
  // Source list
  sourceList.innerHTML = [...state.sources]
    .map(
      (u) => `<li><a href="${u}" target="_blank" rel="noopener">${u}</a></li>`
    )
    .join("");
}

function next() {
  if (state.index < state.steps.length - 1) {
    state.index++;
    renderStep();
  }
}
function prev() {
  if (state.index > 0) {
    state.index--;
    renderStep();
  }
}

function speakCurrent() {
  if (!("speechSynthesis" in window)) {
    alert("Voice not available on this device.");
    return;
  }
  const step = state.steps[state.index];
  const utterance = new SpeechSynthesisUtterance(
    stripHTML(`${step.title}. ${step.text}`)
  );
  const guessed = detectLang(utterance.text);
  utterance.lang = guessed;
  const voice = chooseVoice(guessed);
  if (voice) utterance.voice = voice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function escapeHTML(s) {
  return s.replace(
    /[&<>]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])
  );
}
function stripHTML(s) {
  const d = document.createElement("div");
  d.innerHTML = s;
  return d.textContent || d.innerText || "";
}

// Preview
function updatePreview() {
  const html = codeInput.value.trim();
  const srcdoc =
    html ||
    '<!doctype html><html><body><p style="font-family:system-ui">Paste some HTML above then click Explain.</p></body></html>';
  const f = document.getElementById("previewFrame");
  f.srcdoc = srcdoc;
}

// Quiz
function maybeQuiz(step) {
  const quizArea = document.getElementById("quizArea");
  const q = document.getElementById("quizQuestion");
  const opts = document.getElementById("quizOptions");
  const fb = document.getElementById("quizFeedback");
  // Simple trigger every 5 steps for elements
  if (state.index % 5 === 0 && step.type === "element") {
    quizArea.classList.remove("hidden");
    const tag = step.title.match(/<(.*)>/)[1];
    q.textContent = `What is the primary purpose of the ${tag} element?`;
    const answers = [
      `It gives semantic or structural meaning for its content.`,
      `It defines a server.`,
      `It compiles code.`,
    ];
    const correct = answers[0];
    // shuffle
    answers.sort(() => Math.random() - 0.5);
    opts.innerHTML = "";
    answers.forEach((ans) => {
      const b = document.createElement("button");
      b.className = "btn secondary";
      b.textContent = ans;
      b.onclick = () => {
        if (ans === correct) {
          state.score += 10;
          fb.textContent = "Correct. Points plus ten.";
          fb.style.color = "var(--good)";
        } else {
          fb.textContent =
            "Not quite. See the MDN link above for a deeper look.";
          fb.style.color = "var(--bad)";
        }
        setTimeout(() => {
          fb.textContent = "";
          quizArea.classList.add("hidden");
        }, 1400);
      };
      opts.appendChild(b);
    });
  } else {
    quizArea.classList.add("hidden");
  }
}

// Build steps from code
function buildPlan() {
  const pasted = codeInput.value.trim();
  state.sources.clear();
  if (!pasted) {
    state.steps = [
      {
        type: "note",
        title: "Paste something first",
        text: "Paste HTML above then click Explain.",
        mdn: MDN.html._root,
      },
    ];
    state.index = 0;
    renderStep();
    return;
  }
  // Try extract inline style or script and include notes
  const plan = planFromHTML(pasted);
  // CSS attributes guess
  const styleBlocks = [
    ...pasted.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi),
  ].map((m) => m[1]);
  if (styleBlocks.length) {
    plan.push({
      type: "note",
      title: "Style detected",
      text: "I found embedded CSS. Explanations will focus on HTML first. See MDN CSS first steps below.",
      mdn: MDN.css._root,
    });
  }
  // JS blocks
  const scriptBlocks = [
    ...pasted.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi),
  ].map((m) => m[1]);
  if (scriptBlocks.length) {
    plan.push({
      type: "note",
      title: "Script detected",
      text: "I found embedded JavaScript. Start by understanding the HTML structure then inspect the script logic.",
      mdn: MDN.js._root,
    });
  }
  state.steps = plan;
  state.index = 0;
  renderStep();
}

// Events
explainBtn.addEventListener("click", buildPlan);
nextBtn.addEventListener("click", next);
prevBtn.addEventListener("click", prev);
playBtn.addEventListener("click", speakCurrent);
refreshPreview.addEventListener("click", updatePreview);
autoRefresh.addEventListener("change", () => {
  if (autoRefresh.checked) updatePreview();
});
languageSelect.addEventListener("change", (e) => {
  state.lang = e.target.value;
});

newSessionBtn.addEventListener("click", () => {
  codeInput.value = "";
  state.steps = [];
  state.index = 0;
  state.sources.clear();
  explainBlock.innerHTML = "";
  updateProgress();
  updatePreview();
});

helpBtn.addEventListener("click", () => {
  const msg = [
    "Paste HTML into the box. The tool parses elements and attributes then explains them one step at a time.",
    "Click Next to move through the plan.",
    "Live preview renders your HTML inside the frame.",
    "Click Play voice to hear the explanation. The app tries to pick a suitable voice.",
    "A quick check pops up every few steps to help you recall ideas.",
  ].join("\n");
  alert(msg);
});

// Render initial state
updatePreview();
