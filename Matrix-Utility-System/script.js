const operationSelect = document.getElementById('operation-select');
const matrixInputs = document.getElementById('matrix-inputs');
const matrixBDimensions = document.getElementById('matrix-b-dimensions');
const feedback = document.getElementById('feedback');
const resultArea = document.getElementById('result-area');
const resultTitle = document.getElementById('result-title');
const resultContent = document.getElementById('result-content');
const MAX_DIMENSION = 8;

function isBinaryOperation() {
  return ['add', 'subtract', 'multiply'].includes(operationSelect.value);
}

function clearOutput() {
  feedback.hidden = true;
  feedback.textContent = '';
  feedback.classList.remove('success');
  resultArea.hidden = true;
  resultTitle.textContent = 'Result';
  resultContent.replaceChildren();
}

function showFeedback(message, isSuccess = false) {
  feedback.textContent = message;
  feedback.classList.toggle('success', isSuccess);
  feedback.hidden = false;
}

function readDimensions(rowsId, columnsId, label) {
  const rows = Number(document.getElementById(rowsId).value);
  const columns = Number(document.getElementById(columnsId).value);
  if (!Number.isInteger(rows) || !Number.isInteger(columns) || rows < 1 || columns < 1 || rows > MAX_DIMENSION || columns > MAX_DIMENSION) {
    throw new Error(`${label} rows and columns must be whole numbers between 1 and ${MAX_DIMENSION}.`);
  }
  return { rows, columns };
}

function createMatrixPanel(name, rows, columns) {
  const panel = document.createElement('section');
  panel.className = 'matrix-panel';
  panel.dataset.matrix = name;

  const heading = document.createElement('div');
  heading.className = 'matrix-panel-heading';
  const title = document.createElement('h3');
  title.textContent = `Matrix ${name}`;
  const size = document.createElement('span');
  size.className = 'matrix-size';
  size.textContent = `${rows} × ${columns}`;
  heading.append(title, size);

  const grid = document.createElement('div');
  grid.className = 'matrix-grid';
  grid.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const input = document.createElement('input');
      input.className = 'matrix-cell-input';
      input.type = 'number';
      input.step = 'any';
      input.inputMode = 'decimal';
      input.dataset.row = String(row);
      input.dataset.column = String(column);
      input.setAttribute('aria-label', `Matrix ${name}, row ${row + 1}, column ${column + 1}`);
      input.addEventListener('input', () => input.classList.remove('invalid'));
      grid.append(input);
    }
  }

  panel.append(heading, grid);
  return panel;
}

function createMatrixInputs() {
  clearOutput();
  try {
    const dimensionsA = readDimensions('rows-a', 'cols-a', 'Matrix A');
    const panels = [createMatrixPanel('A', dimensionsA.rows, dimensionsA.columns)];
    if (isBinaryOperation()) {
      const dimensionsB = readDimensions('rows-b', 'cols-b', 'Matrix B');
      panels.push(createMatrixPanel('B', dimensionsB.rows, dimensionsB.columns));
    }
    matrixInputs.replaceChildren(...panels);
  } catch (error) {
    matrixInputs.replaceChildren();
    showFeedback(error.message);
  }
}

function getMatrixValues(matrixName) {
  const panel = matrixInputs.querySelector(`[data-matrix="${matrixName}"]`);
  if (!panel) {
    showFeedback(`Create Matrix ${matrixName} inputs before calculating.`);
    return null;
  }

  const cells = Array.from(panel.querySelectorAll('.matrix-cell-input'));
  const matrix = [];
  let hasInvalidValue = false;
  cells.forEach((cell) => {
    const value = cell.value.trim();
    if (value === '' || !Number.isFinite(Number(value))) {
      cell.classList.add('invalid');
      hasInvalidValue = true;
    }
  });
  if (hasInvalidValue) {
    showFeedback(`Enter a valid number in every cell of Matrix ${matrixName}.`);
    const firstInvalid = panel.querySelector('.matrix-cell-input.invalid');
    firstInvalid?.focus();
    return null;
  }

  const columns = Number(panel.querySelector('.matrix-size').textContent.split('×')[1].trim());
  for (let index = 0; index < cells.length; index += columns) {
    matrix.push(cells.slice(index, index + columns).map((cell) => Number(cell.value)));
  }
  return matrix;
}

function getBothMatrices() {
  const matrixA = getMatrixValues('A');
  if (!matrixA) return null;
  const matrixB = getMatrixValues('B');
  if (!matrixB) return null;
  return { matrixA, matrixB };
}

function showMatrixResult(title, matrix) {
  resultTitle.textContent = title;
  const output = document.createElement('div');
  output.className = 'result-matrix';
  output.style.gridTemplateColumns = `repeat(${matrix[0].length}, max-content)`;
  matrix.flat().forEach((value) => {
    const cell = document.createElement('span');
    cell.textContent = formatNumber(value);
    output.append(cell);
  });
  resultContent.replaceChildren(output);
  resultArea.hidden = false;
  feedback.hidden = true;
}

function showScalarResult(title, value) {
  resultTitle.textContent = title;
  const output = document.createElement('p');
  output.className = 'result-value';
  output.textContent = value;
  resultContent.replaceChildren(output);
  resultArea.hidden = false;
  feedback.hidden = true;
}

function formatNumber(value) {
  if (Number.isInteger(value)) return String(value);
  return String(Number(value.toPrecision(10)));
}

function addMatrices() {
  const matrices = getBothMatrices();
  if (!matrices) return;
  const { matrixA, matrixB } = matrices;
  if (matrixA.length !== matrixB.length || matrixA[0].length !== matrixB[0].length) {
    showFeedback('Matrix addition requires both matrices to have the same dimensions.');
    return;
  }
  const result = matrixA.map((row, rowIndex) => row.map((value, columnIndex) => value + matrixB[rowIndex][columnIndex]));
  showMatrixResult('A + B', result);
}

function subtractMatrices() {
  const matrices = getBothMatrices();
  if (!matrices) return;
  const { matrixA, matrixB } = matrices;
  if (matrixA.length !== matrixB.length || matrixA[0].length !== matrixB[0].length) {
    showFeedback('Matrix subtraction requires both matrices to have the same dimensions.');
    return;
  }
  const result = matrixA.map((row, rowIndex) => row.map((value, columnIndex) => value - matrixB[rowIndex][columnIndex]));
  showMatrixResult('A − B', result);
}

function multiplyMatrices() {
  const matrices = getBothMatrices();
  if (!matrices) return;
  const { matrixA, matrixB } = matrices;
  if (matrixA[0].length !== matrixB.length) {
    showFeedback('Matrix multiplication is not possible. Columns of Matrix A must equal rows of Matrix B.');
    return;
  }
  const result = matrixA.map((row) => matrixB[0].map((_, columnIndex) => (
    row.reduce((sum, value, rowIndex) => sum + value * matrixB[rowIndex][columnIndex], 0)
  )));
  showMatrixResult('A × B', result);
}

function transposeMatrix() {
  const matrix = getMatrixValues('A');
  if (!matrix) return;
  const transpose = matrix[0].map((_, columnIndex) => matrix.map((row) => row[columnIndex]));
  showMatrixResult('Transpose of A', transpose);
}

function calculateDeterminant() {
  const matrix = getMatrixValues('A');
  if (!matrix) return;
  if (matrix.length !== matrix[0].length) {
    showFeedback('A determinant can only be calculated for a square matrix.');
    return;
  }
  if (matrix.length === 2) {
    const [[a, b], [c, d]] = matrix;
    showScalarResult('Determinant', `Determinant = ${formatNumber(a * d - b * c)}`);
    return;
  }
  if (matrix.length === 3) {
    const [[a, b, c], [d, e, f], [g, h, i]] = matrix;
    const determinant = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
    showScalarResult('Determinant', `Determinant = ${formatNumber(determinant)}`);
    return;
  }
  showFeedback('Determinant calculation supports 2 × 2 and 3 × 3 matrices.');
}

function displayMatrix() {
  const matrix = getMatrixValues('A');
  if (!matrix) return;
  showMatrixResult('Matrix A', matrix);
}

function calculateSelectedOperation() {
  clearOutput();
  const operations = {
    add: addMatrices,
    subtract: subtractMatrices,
    multiply: multiplyMatrices,
    transpose: transposeMatrix,
    determinant: calculateDeterminant,
    display: displayMatrix
  };
  operations[operationSelect.value]();
}

function updateOperationControls() {
  matrixBDimensions.hidden = !isBinaryOperation();
  matrixInputs.replaceChildren();
  const message = document.createElement('p');
  message.className = 'empty-state';
  message.textContent = 'Set your matrix dimensions above, then create the input grids.';
  matrixInputs.append(message);
  clearOutput();
}

function resetCalculator() {
  operationSelect.value = 'add';
  document.getElementById('rows-a').value = '2';
  document.getElementById('cols-a').value = '2';
  document.getElementById('rows-b').value = '2';
  document.getElementById('cols-b').value = '2';
  matrixBDimensions.hidden = false;
  matrixInputs.replaceChildren();
  const message = document.createElement('p');
  message.className = 'empty-state';
  message.textContent = 'Set your matrix dimensions above, then create the input grids.';
  matrixInputs.append(message);
  clearOutput();
}

const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.getElementById('primary-navigation');
menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation menu' : 'Close navigation menu');
  navigation.classList.toggle('is-open', !isOpen);
});
navigation.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navigation.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation menu');
  });
});

document.getElementById('create-matrices').addEventListener('click', createMatrixInputs);
document.getElementById('calculate-button').addEventListener('click', calculateSelectedOperation);
document.getElementById('reset-button').addEventListener('click', resetCalculator);
operationSelect.addEventListener('change', updateOperationControls);
document.getElementById('cpp-info-button').addEventListener('click', () => {
  const message = document.getElementById('cpp-message');
  message.hidden = !message.hidden;
});
