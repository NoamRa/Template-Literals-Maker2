
// region logic
function tokenizer(input) {
  const WHITESPACE = /\s/;
  const VARIABLE_IDENTIFIER_FIRST_CHARACTER = /[a-z$_]/i;
  const VARIABLE_IDENTIFIER_REST_CHARACTER = /[a-z0-9$_]/i;
  const JOINERS = /[+,]/;
  const enclosures = new Set(["'", "`", '"']);
  const tokens = [];
  const inputLength = input.length;

  let index = 0;

  const incrementIndex = () => (index += 1);

  const getPrevChar = () => (index > 0 ? input[index - 1] : "");
  const isEscaped = () => getPrevChar() === "\\"; // TODO calculate escape more than one char backwards
  const sanity = () => {
    if (index >= inputLength) {
      throw "Read more characters than there were in input";
    }
  };
  while (index < inputLength) {
    let char = input[index];

    if (WHITESPACE.test(char) || JOINERS.test(char)) {
      incrementIndex();
      continue;
    }

    if (enclosures.has(char) && !isEscaped()) {
      const currentEnclosure = char;
      char = input[incrementIndex()];
      let value = "";
      while (char !== currentEnclosure && !isEscaped()) {
        sanity();
        value += char;
        char = input[incrementIndex()];
      }
      tokens.push({
        type: currentEnclosure === "`" ? "templteLiteral" : "string",
        value,
      });
      incrementIndex();
      continue;
    }

    if (VARIABLE_IDENTIFIER_FIRST_CHARACTER.test(char)) {
      let value = "";
      while (VARIABLE_IDENTIFIER_REST_CHARACTER.test(char)) {
        sanity();
        value += char;
        char = input[incrementIndex()];
      }
      tokens.push({
        type: "variable",
        value,
      });
      incrementIndex();
      continue;
    }

    throw new TypeError(
      `I dont know what this character is: ${char} at position ${index}`,
    );
  }

  return tokens;
}

function codeGenerator(tokens) {
  const wrapAsPlaceholder = (value) => "${" + value + "}";

  let out = "`";
  tokens.forEach(({ type, value }) => {
    if (type === "string") {
      out += value;
    }
    if (type === "templteLiteral") {
      out += value;
    }
    if (type === "variable") {
      out += wrapAsPlaceholder(value);
    }
  });

  return out + "`";
}

function transformTextToTemplateLiteral(input) {
  const tokens = tokenizer(input);
  console.log(tokens);

  const output = codeGenerator(tokens);
  console.log(output);
  return output;
}

// endregion

// region page
const inputId = "theInput";
const outputId = "theOutput";
const errorId = "theError";
const copyButtonId = "copyButton";

const example = `"paste some " + \`\${concatenated} \` + strings + ' here ' + "and they'll be joined" + " as template literals :)"`;

document.getElementById(inputId).addEventListener("input", (evt) => {
  const transformed = transformTextToTemplateLiteral(evt.target.value);
  document.getElementById(outputId).value = transformed;
});

document.getElementById(inputId).addEventListener(
  "init",
  (evt) => {
    evt.target.value = example
    const transformed = transformTextToTemplateLiteral(evt.detail);
    document.getElementById(outputId).value = transformed;
  },
  { once: true },
);

const inputEl = document.getElementById(inputId);
const initEvt = new CustomEvent("init", { detail: example });
inputEl.dispatchEvent(initEvt);

function copyToClipboard() {
  const templateLiteral = document.getElementById(outputId);
  const str = templateLiteral.value;
  const tempEl = document.createElement("textarea");
  tempEl.value = str;
  tempEl.setAttribute("readonly", "");
  tempEl.style.position = "absolute";
  tempEl.style.left = "-9999px";
  document.body.appendChild(tempEl);
  tempEl.select();
  document.execCommand("copy");
  document.body.removeChild(tempEl);
}

// endregion