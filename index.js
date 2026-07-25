const exprDisplay = document.getElementById('expression');
const resDisplay = document.getElementById('result');
const ansBadge = document.getElementById('ans-badge');
const btnDeg = document.getElementById('btn-deg');
const keypadDeg = document.getElementById('keypad-deg');
const historyPanel = document.getElementById('history-panel');
const historyList = document.getElementById('history-list');

let currentExpression = "";
let lastAnswer = 0;
let isDegMode = true;
let isEvaluated = false;
let calcHistory = [];

// Remove persistent outline focus on buttons on click
document.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', () => btn.blur());
});

// Load history from localStorage safely
try {
  const storedHistory = localStorage.getItem('calc_history');
  calcHistory = storedHistory ? JSON.parse(storedHistory) : [];
  if (!Array.isArray(calcHistory)) calcHistory = [];
} catch (e) {
  calcHistory = [];
}

renderHistory();

function updateDisplay() {
  exprDisplay.innerText = currentExpression;
  exprDisplay.scrollLeft = exprDisplay.scrollWidth;
  resDisplay.scrollLeft = resDisplay.scrollWidth;
}

function isOperator(char) {
  return ['+', '-', '×', '÷', '^', '%', '²', '³', 'P', 'C', 'ʸ√', '!'].includes(char);
}

function append(val) {
  const binaryOps = ['+', '-', '×', '÷', '^', 'P', 'C', 'ʸ√'];

  if (isEvaluated) {
    if (isOperator(val)) {
      currentExpression = "Ans" + val;
    } else if (val === '.') {
      currentExpression = "0.";
    } else {
      currentExpression = val;
    }
    isEvaluated = false;
    updateDisplay();
    return;
  }

  if (!currentExpression && binaryOps.includes(val) && val !== '+') {
    if (val === '-') {
      currentExpression = "-";
      updateDisplay();
      return;
    }
    currentExpression = "Ans" + val;
    isEvaluated = false;
    updateDisplay();
    return;
  }

  if (val === '.') {
    if (/(?:\)|π|e|Ans|!|%|²|³)$/.test(currentExpression)) {
      currentExpression += '×0.';
      updateDisplay();
      return;
    }
    if (!currentExpression || /[+×÷^\-(,PCʸ√]$/.test(currentExpression)) {
      currentExpression += '0.';
      updateDisplay();
      return;
    }
    const match = currentExpression.match(/(\d+\.?\d*)$/);
    if (match && match[0].includes('.')) {
      return;
    }
  }

  if (binaryOps.includes(val)) {
    if (val === '-') {
      if (currentExpression.endsWith('+') || currentExpression.endsWith('-')) {
        currentExpression = currentExpression.slice(0, -1) + '-';
        updateDisplay();
        return;
      }
    } else {
      if (currentExpression.endsWith('ʸ√')) {
        currentExpression = currentExpression.slice(0, -2) + val;
        updateDisplay();
        return;
      }
      if (/[+×÷^\-PC]$/.test(currentExpression)) {
        if (currentExpression.endsWith('-') && /[×÷^(,PC]/.test(currentExpression.slice(-2, -1))) {
          currentExpression = currentExpression.slice(0, -2) + val;
        } else {
          currentExpression = currentExpression.slice(0, -1) + val;
        }
        updateDisplay();
        return;
      }
    }
  }

  currentExpression += val;
  isEvaluated = false;
  updateDisplay();
}

function appendFunc(funcName) {
  if (isEvaluated) {
    currentExpression = "";
  }
  isEvaluated = false;
  if (currentExpression && /(?:\d|\)|π|e|Ans|!|%|²|³)$/.test(currentExpression)) {
    currentExpression += '×';
  }
  currentExpression += funcName;
  updateDisplay();
}

function appendReciprocal() {
  if (isEvaluated) {
    currentExpression = "1/(Ans)";
    isEvaluated = false;
  } else if (!currentExpression) {
    currentExpression = "1/(";
  } else if (/(?:\d|\)|π|e|Ans|!|%|²|³)$/.test(currentExpression)) {
    currentExpression = '1/(' + currentExpression + ')';
  } else {
    currentExpression += '1/(';
  }
  updateDisplay();
}

function clearAll() {
  currentExpression = "";
  resDisplay.innerText = "0";
  isEvaluated = false;
  updateDisplay();
}

function deleteChar() {
  if (isEvaluated) {
    clearAll();
    return;
  }
  const funcTokens = [
    'asin(', 'acos(', 'atan(', 'sinh(', 'cosh(', 'tanh(',
    '10^(', 'e^(', 'sin(', 'cos(', 'tan(', 'log10(', 'log(', 'ln(', '1/(',
    'Ans', 'ʸ√', '∛(', '√(', '(-'
  ];
  for (let token of funcTokens) {
    if (currentExpression.endsWith(token)) {
      currentExpression = currentExpression.slice(0, -token.length);
      updateDisplay();
      return;
    }
  }
  currentExpression = currentExpression.slice(0, -1);
  updateDisplay();
}

function toggleDegRad() {
  isDegMode = !isDegMode;
  const label = isDegMode ? "DEG" : "RAD";
  if (btnDeg) {
    btnDeg.innerText = label;
    btnDeg.classList.toggle('rad-mode', !isDegMode);
  }
  if (keypadDeg) {
    keypadDeg.innerText = label;
    keypadDeg.classList.toggle('rad-mode', !isDegMode);
  }
}

function isWrappedInNegation(str) {
  if (!str.startsWith('-(') || !str.endsWith(')')) return false;
  let depth = 0;
  for (let i = 1; i < str.length - 1; i++) {
    if (str[i] === '(') depth++;
    else if (str[i] === ')') depth--;
    if (depth === 0) return false;
  }
  return depth === 1;
}

function toggleSign() {
  if (isEvaluated) {
    currentExpression = "-(Ans)";
    isEvaluated = false;
  } else if (!currentExpression) {
    currentExpression = "-";
  } else if (currentExpression === '-') {
    currentExpression = "";
  } else if (currentExpression.endsWith('(-')) {
    currentExpression = currentExpression.slice(0, -2);
  } else if (/[+×÷^\-(]$/.test(currentExpression)) {
    if (currentExpression.endsWith('+')) {
      currentExpression = currentExpression.slice(0, -1) + '-';
    } else if (currentExpression.endsWith('-')) {
      currentExpression = currentExpression.slice(0, -1) + '+';
    } else {
      currentExpression += '(-';
    }
  } else if (/^-?\d+(\.\d+)?$/.test(currentExpression)) {
    currentExpression = currentExpression.startsWith('-') ? currentExpression.slice(1) : '-' + currentExpression;
  } else if (isWrappedInNegation(currentExpression)) {
    currentExpression = currentExpression.slice(2, -1);
  } else {
    currentExpression = '-(' + currentExpression + ')';
  }
  updateDisplay();
}

function toggleHistory() {
  historyPanel.classList.toggle('open');
}

function addHistoryEntry(expr, res) {
  calcHistory.unshift({ expr, res });
  if (calcHistory.length > 20) {
    calcHistory.pop();
  }
  try {
    localStorage.setItem('calc_history', JSON.stringify(calcHistory));
  } catch (e) {}
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";
  if (calcHistory.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-history';
    emptyDiv.textContent = 'No calculations recorded yet';
    historyList.appendChild(emptyDiv);
    return;
  }

  calcHistory.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'history-item';
    
    const exprDiv = document.createElement('div');
    exprDiv.className = 'history-expr';
    exprDiv.textContent = item.expr + ' =';
    exprDiv.title = 'Click to insert formula';
    exprDiv.onclick = () => insertToExpression(item.expr);

    const resDiv = document.createElement('div');
    resDiv.className = 'history-res';
    resDiv.textContent = item.res;
    resDiv.title = 'Click to insert result';
    resDiv.onclick = () => insertToExpression(item.res);

    div.appendChild(exprDiv);
    div.appendChild(resDiv);
    historyList.appendChild(div);
  });
}

function insertToExpression(textToInsert) {
  if (textToInsert === "Math Error" || textToInsert === "Syntax Error") return;

  let valToInsert = textToInsert;

  if (valToInsert.startsWith('-') && currentExpression && /[+×÷^\-(]$/.test(currentExpression)) {
    valToInsert = `(${valToInsert})`;
  }

  if (isEvaluated) {
    currentExpression = valToInsert;
    isEvaluated = false;
  } else if (!currentExpression) {
    currentExpression = valToInsert;
  } else if (/(?:\d|\)|π|e|Ans|!|%|²|³)$/.test(currentExpression)) {
    currentExpression += '×' + valToInsert;
  } else {
    currentExpression += valToInsert;
  }

  let numVal = Number(textToInsert);
  if (!isNaN(numVal)) {
    lastAnswer = numVal;
    ansBadge.innerText = `ANS = ${formatResult(lastAnswer)}`;
  }

  updateDisplay();
  toggleHistory();
}

function clearHistory() {
  calcHistory = [];
  try {
    localStorage.removeItem('calc_history');
  } catch (e) {}
  renderHistory();
}

function parseBinaryInfix(str, opToken, targetFuncName, rightToLeft = false) {
  let maxIterations = 50;
  let lastStr = "";
  const isPowerOrRoot = (opToken === '^' || opToken === 'ʸ√');

  while (str.includes(opToken) && maxIterations-- > 0) {
    if (str === lastStr) break;
    lastStr = str;

    let idx = rightToLeft ? str.lastIndexOf(opToken) : str.indexOf(opToken);
    if (idx === -1) break;

    let leftStart = 0;
    let depth = 0;
    for (let i = idx - 1; i >= 0; i--) {
      let ch = str[i];
      if (ch === ')') depth++;
      else if (ch === '(') depth--;

      if (depth < 0) {
        leftStart = i + 1;
        break;
      }

      if (depth === 0 && ['+', '-', '*', '/', '^', ','].includes(ch)) {
        if (['+', '-'].includes(ch)) {
          let prevIdx = i - 1;
          while (prevIdx >= 0 && str[prevIdx] === ' ') prevIdx--;
          if (!isPowerOrRoot && (prevIdx < 0 || ['+', '-', '*', '/', '^', '(', ','].includes(str[prevIdx]))) {
            continue; 
          }
        }
        leftStart = i + 1;
        break;
      }
    }

    let rightStart = idx + opToken.length;
    let rightEnd = str.length;
    depth = 0;
    let foundFirstNonSpace = false;
    for (let i = rightStart; i < str.length; i++) {
      let ch = str[i];
      if (ch === '(') depth++;
      else if (ch === ')') depth--;

      if (depth < 0) {
        rightEnd = i;
        break;
      }

      if (depth === 0 && ['+', '-', '*', '/', '^', ','].includes(ch)) {
        if (!foundFirstNonSpace && ['+', '-'].includes(ch)) {
          foundFirstNonSpace = true;
          continue;
        }
        rightEnd = i;
        break;
      }

      if (ch !== ' ') {
        foundFirstNonSpace = true;
      }
    }

    let leftOperand = str.slice(leftStart, idx).trim();
    let rightOperand = str.slice(rightStart, rightEnd).trim();

    if (!leftOperand || !rightOperand) break;

    let replacement = `${targetFuncName}(${leftOperand},${rightOperand})`;
    str = str.slice(0, leftStart) + replacement + str.slice(rightEnd);
  }
  return str;
}

function parsePostfixOp(str, opToken, targetFuncName, appendArg = "") {
  let maxIterations = 50;
  let lastStr = "";
  while (str.includes(opToken) && maxIterations-- > 0) {
    if (str === lastStr) break;
    lastStr = str;

    let idx = str.indexOf(opToken);
    if (idx === -1) break;

    let depth = 0;
    let start = 0;
    for (let i = idx - 1; i >= 0; i--) {
      let ch = str[i];
      if (ch === ')') depth++;
      else if (ch === '(') depth--;

      if (depth < 0) {
        start = i + 1;
        break;
      }

      if (depth === 0 && ['+', '-', '*', '/', '^', ','].includes(ch)) {
        if (['+', '-'].includes(ch)) {
          let prevIdx = i - 1;
          while (prevIdx >= 0 && str[prevIdx] === ' ') prevIdx--;
          if (prevIdx < 0 || ['+', '-', '*', '/', '^', '(', ','].includes(str[prevIdx])) {
            start = i + 1;
            break;
          }
        }
        start = i + 1;
        break;
      }
    }

    let operand = str.slice(start, idx).trim();
    if (!operand) break;

    let args = appendArg ? `${operand},${appendArg}` : operand;
    let replacement = `${targetFuncName}(${args})`;
    str = str.slice(0, start) + replacement + str.slice(idx + opToken.length);
  }
  return str;
}

function formatResult(val) {
  if (typeof val !== 'number' || isNaN(val)) return "Math Error";
  if (!isFinite(val)) return val > 0 ? "Infinity" : "-Infinity";

  if (Math.abs(val) < 1e-15) val = 0;

  let absVal = Math.abs(val);
  if (absVal !== 0 && (absVal >= 1e12 || absVal <= 1e-7)) {
    return val.toExponential(8).replace(/\.?0+e/, 'e');
  }
  
  let rounded = Math.round(val * 1e12) / 1e12;
  return rounded.toString();
}

function calculate() {
  if (!currentExpression) return;

  try {
    let parsed = currentExpression;

    // 1. Basic operator normalization
    parsed = parsed.replace(/×/g, '*');
    parsed = parsed.replace(/÷/g, '/');

    // 2. Protect scientific notation numbers (e.g., 1e5, 2.5e-3)
    const sciPlaceholders = [];
    parsed = parsed.replace(/(?<![a-zA-Z_])(\d+(?:\.\d+)?|\.\d+)[eE]([+-]?\d+)\b/g, (match, p1, p2) => {
      sciPlaceholders.push(`${p1}e${p2}`);
      return `___SN_${sciPlaceholders.length - 1}___`;
    });

    // 3. Map mathematical functions to digit-free placeholders
    parsed = parsed.replace(/e\^\(/g, '__exp(');
    parsed = parsed.replace(/∛\(/g, '__cbrt(');
    parsed = parsed.replace(/√\(/g, '__sqrt(');

    // FIX: Using __lg( instead of __log10( prevents digit matching on '10'
    parsed = parsed.replace(/(?<![a-zA-Z_])log10\s*\(/g, '__lg(');
    parsed = parsed.replace(/(?<![a-zA-Z_])log\s*\(/g, '__lg(');
    parsed = parsed.replace(/(?<![a-zA-Z_])ln\s*\(/g, '__log(');

    parsed = parsed.replace(/(?<![a-zA-Z_])sinh\s*\(/g, '__sinh(');
    parsed = parsed.replace(/(?<![a-zA-Z_])cosh\s*\(/g, '__cosh(');
    parsed = parsed.replace(/(?<![a-zA-Z_])tanh\s*\(/g, '__tanh(');

    parsed = parsed.replace(/(?<![a-zA-Z_])asin\s*\(/g, '__asin(');
    parsed = parsed.replace(/(?<![a-zA-Z_])acos\s*\(/g, '__acos(');
    parsed = parsed.replace(/(?<![a-zA-Z_])atan\s*\(/g, '__atan(');

    parsed = parsed.replace(/(?<![a-zA-Z_])sin\s*\(/g, '__sin(');
    parsed = parsed.replace(/(?<![a-zA-Z_])cos\s*\(/g, '__cos(');
    parsed = parsed.replace(/(?<![a-zA-Z_])tan\s*\(/g, '__tan(');

    parsed = parsed.replace(/π/g, ' __pi__ ');
    parsed = parsed.replace(/(?<![a-zA-Z_])e(?![a-zA-Z_])/g, ' __E__ ');

    // 4. Implicit multiplication resolution (with boundary lookbehinds)
    let prevParsed;
    do {
      prevParsed = parsed;
      parsed = parsed.replace(/(?<![a-zA-Z_])(\d+(?:\.\d+)?|\)|__pi__|__E__|Ans|___SN_\d+___|!|%|²|³)\s*(\(|__pi__|__E__|Ans|__\w+)/g, '$1*$2');
      parsed = parsed.replace(/(\)|__pi__|__E__|Ans|___SN_\d+___|!|%|²|³)\s*(?<![a-zA-Z_])(\d+(?:\.\d+)?|___SN_\d+___)/g, '$1*$2');
    } while (parsed !== prevParsed);

    // 5. Operator parsing
    parsed = parsePostfixOp(parsed, '²', '__smart_pow__', '2');
    parsed = parsePostfixOp(parsed, '³', '__smart_pow__', '3');
    parsed = parsePostfixOp(parsed, '%', '__pct__');
    parsed = parsePostfixOp(parsed, '!', '__fact__');

    parsed = parseBinaryInfix(parsed, 'ʸ√', '__yroot__');
    parsed = parseBinaryInfix(parsed, 'P', '__perm__');
    parsed = parseBinaryInfix(parsed, 'C', '__comb__');
    parsed = parseBinaryInfix(parsed, '^', '__smart_pow__', true);

    // 6. Restore standard JavaScript evaluation names
    parsed = parsed.replace(/__exp\(/g, 'Math.exp(');
    parsed = parsed.replace(/__cbrt\(/g, 'Math.cbrt(');
    parsed = parsed.replace(/__sqrt\(/g, 'Math.sqrt(');
    parsed = parsed.replace(/__lg\(/g, '_log10(');
    parsed = parsed.replace(/__log\(/g, '_ln(');
    parsed = parsed.replace(/__sinh\(/g, 'Math.sinh(');
    parsed = parsed.replace(/__cosh\(/g, 'Math.cosh(');
    parsed = parsed.replace(/__tanh\(/g, 'Math.tanh(');

    parsed = parsed.replace(/__asin\(/g, '_asin(');
    parsed = parsed.replace(/__acos\(/g, '_acos(');
    parsed = parsed.replace(/__atan\(/g, '_atan(');
    parsed = parsed.replace(/__sin\(/g, '_sin(');
    parsed = parsed.replace(/__cos\(/g, '_cos(');
    parsed = parsed.replace(/__tan\(/g, '_tan(');

    parsed = parsed.replace(/__pi__/g, 'Math.PI');
    parsed = parsed.replace(/__E__/g, 'Math.E');

    sciPlaceholders.forEach((val, idx) => {
      parsed = parsed.replace(new RegExp(`___SN_${idx}___`, 'g'), val);
    });

    // 7. Auto-close dangling parentheses
    let openCount = (parsed.match(/\(/g) || []).length;
    let closeCount = (parsed.match(/\)/g) || []).length;
    if (openCount > closeCount) {
      parsed += ')'.repeat(openCount - closeCount);
    }

    // 8. Definition of math wrappers
    const __smart_pow__ = (base, exp) => {
      if (base < 0 && !Number.isInteger(exp)) {
        let inv = 1 / exp;
        if (Math.abs(inv - Math.round(inv)) < 1e-9) {
          let roundedInv = Math.round(inv);
          if (roundedInv % 2 !== 0) {
            return -Math.pow(-base, exp);
          }
        }
      }
      return Math.pow(base, exp);
    };

    const _sin = (x) => {
      if (isDegMode) {
        let norm = ((x % 360) + 360) % 360;
        if (norm === 0 || norm === 180) return 0;
        if (norm === 90) return 1;
        if (norm === 270) return -1;
        return Math.sin(x * Math.PI / 180);
      }
      return Math.sin(x);
    };

    const _cos = (x) => {
      if (isDegMode) {
        let norm = ((x % 360) + 360) % 360;
        if (norm === 90 || norm === 270) return 0;
        if (norm === 0) return 1;
        if (norm === 180) return -1;
        return Math.cos(x * Math.PI / 180);
      }
      return Math.cos(x);
    };

    const _tan = (x) => {
      if (isDegMode) {
        let norm = ((x % 360) + 360) % 360;
        if (norm === 90 || norm === 270) return NaN;
        if (norm === 0 || norm === 180) return 0;
        return Math.tan(x * Math.PI / 180);
      }
      return Math.tan(x);
    };

    const _asin = (x) => isDegMode ? (Math.asin(x) * 180 / Math.PI) : Math.asin(x);
    const _acos = (x) => isDegMode ? (Math.acos(x) * 180 / Math.PI) : Math.acos(x);
    const _atan = (x) => isDegMode ? (Math.atan(x) * 180 / Math.PI) : Math.atan(x);

    const _log10 = (x) => (x <= 0 ? NaN : Math.log10(x));
    const _ln = (x) => (x <= 0 ? NaN : Math.log(x));

    const __pct__ = (x) => Number(x) / 100;

    const __yroot__ = (y, x) => {
      if (x < 0) {
        if (Number.isInteger(y) && Math.abs(y % 2) === 1) {
          return -Math.pow(-x, 1 / y);
        }
        return NaN;
      }
      return Math.pow(x, 1 / y);
    };

    const __fact__ = (n) => {
      n = Number(n);
      if (isNaN(n)) return NaN;
      if (Math.abs(n - Math.round(n)) < 1e-11) n = Math.round(n);
      if (n < 0 || !Number.isInteger(n)) return NaN;
      if (n > 170) return Infinity;
      if (n === 0 || n === 1) return 1;
      let res = 1;
      for (let i = 2; i <= n; i++) res *= i;
      return res;
    };

    const __perm__ = (n, r) => {
      n = Math.round(Number(n));
      r = Math.round(Number(r));
      if (isNaN(n) || isNaN(r) || n < 0 || r < 0 || r > n) return NaN;
      let res = 1;
      for (let i = 0; i < r; i++) {
        res *= (n - i);
        if (!isFinite(res)) return Infinity;
      }
      return res;
    };

    const __comb__ = (n, r) => {
      n = Math.round(Number(n));
      r = Math.round(Number(r));
      if (isNaN(n) || isNaN(r) || n < 0 || r < 0 || r > n) return NaN;
      if (r === 0 || r === n) return 1;
      if (r > n / 2) r = n - r;
      let res = 1;
      for (let i = 1; i <= r; i++) {
        res = (res * (n - i + 1)) / i;
      }
      return res;
    };

    // 9. Execute parsed string safely
    const evalFunc = new Function(
      'Ans', '_sin', '_cos', '_tan', '_asin', '_acos', '_atan', '_log10', '_ln', '__pct__', '__yroot__', '__fact__', '__perm__', '__comb__', '__smart_pow__',
      `return ${parsed};`
    );

    const result = evalFunc(lastAnswer, _sin, _cos, _tan, _asin, _acos, _atan, _log10, _ln, __pct__, __yroot__, __fact__, __perm__, __comb__, __smart_pow__);

    let formatted = formatResult(result);
    resDisplay.innerText = formatted;
    resDisplay.scrollLeft = resDisplay.scrollWidth;

    if (formatted !== "Math Error" && formatted !== "Syntax Error") {
      addHistoryEntry(currentExpression, formatted);
      lastAnswer = result;
      ansBadge.innerText = `ANS = ${formatResult(lastAnswer)}`;
    }
    isEvaluated = true;

  } catch (err) {
    resDisplay.innerText = "Syntax Error";
    resDisplay.scrollLeft = resDisplay.scrollWidth;
    isEvaluated = true;
  }
}

document.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
    document.activeElement.blur();
  }

  const key = e.key;

  if ((key >= '0' && key <= '9') || key === '.') {
    e.preventDefault();
    append(key);
  } 
  else if (key === '+') { e.preventDefault(); append('+'); }
  else if (key === '-') { e.preventDefault(); append('-'); }
  else if (key === '*' || key === 'x') { e.preventDefault(); append('×'); }
  else if (key === '/') { e.preventDefault(); append('÷'); }
  else if (key === '%') { e.preventDefault(); append('%'); }
  else if (key === '^') { e.preventDefault(); append('^'); }
  else if (key === '!') { e.preventDefault(); append('!'); }
  else if (key === '(') { e.preventDefault(); append('('); }
  else if (key === ')') { e.preventDefault(); append(')'); }
  
  else if (key === 'S') { e.preventDefault(); appendFunc('asin('); }
  else if (key === 'C') { 
    e.preventDefault(); 
    if (/(?:\d|\)|π|e|Ans|!|%|²|³)$/.test(currentExpression)) {
      append('C');
    } else {
      appendFunc('acos(');
    }
  }
  else if (key === 'T') { e.preventDefault(); appendFunc('atan('); }
  else if (key === 's') { e.preventDefault(); appendFunc('sin('); }
  else if (key === 'c') { e.preventDefault(); appendFunc('cos('); }
  else if (key === 't') { e.preventDefault(); appendFunc('tan('); }
  
  else if (key === 'l' || key === 'L') { e.preventDefault(); appendFunc('log('); }
  else if (key === 'n' || key === 'N') { e.preventDefault(); appendFunc('ln('); }
  else if (key === 'p') { e.preventDefault(); append('π'); }
  else if (key === 'P') { 
    e.preventDefault(); 
    if (/(?:\d|\)|π|e|Ans|!|%|²|³)$/.test(currentExpression)) {
      append('P');
    } else {
      append('π');
    }
  }
  else if (key === 'e' || key === 'E') { e.preventDefault(); append('e'); }
  else if (key === 'r' || key === 'R') { e.preventDefault(); appendFunc('√('); }
  else if (key === 'a' || key === 'A') { e.preventDefault(); append('Ans'); }
  else if (key === 'd' || key === 'D') { e.preventDefault(); toggleDegRad(); }
  else if (key === 'h' || key === 'H') { e.preventDefault(); toggleHistory(); }

  else if (key === 'Enter' || key === '=') { 
    e.preventDefault(); 
    calculate(); 
  }
  else if (key === 'Backspace') { 
    e.preventDefault(); 
    deleteChar(); 
  }
  else if (key === 'Escape' || key === 'Delete') { 
    e.preventDefault(); 
    if (historyPanel.classList.contains('open')) {
      toggleHistory();
    } else {
      clearAll(); 
    }
  }
});
