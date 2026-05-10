const uploadForm = document.getElementById('upload-form');
const characterFileInput = document.getElementById('character-file');
const avatarNameInput = document.getElementById('avatar-name');
const uploadButton = document.getElementById('upload-button');
const refreshButton = document.getElementById('refresh-button');
const saveStatus = document.getElementById('save-status');
const characterList = document.getElementById('character-list');

const fields = [
  { label: 'Skin', group: 'Colors', type: 'color' },
  { label: 'Clothes', group: 'Colors', type: 'color' },
  { label: 'Hair', group: 'Colors', type: 'color' },
  { label: 'Hair Style', group: 'Styles', type: 'style' },
  { label: 'Eye Style', group: 'Styles', type: 'style' },
  { label: 'Mouth Style', group: 'Styles', type: 'style' },
  { label: 'Hair Size', group: 'Sizes', type: 'percent' },
  { label: 'Eye Size', group: 'Sizes', type: 'percent' },
  { label: 'Mouth Size', group: 'Sizes', type: 'percent' },
  { label: 'Hair X', group: 'Position', type: 'coordinate' },
  { label: 'Hair Y', group: 'Position', type: 'coordinate' },
  { label: 'Eye X', group: 'Position', type: 'coordinate' },
  { label: 'Eye Y', group: 'Position', type: 'coordinate' },
  { label: 'Mouth X', group: 'Position', type: 'coordinate' },
  { label: 'Mouth Y', group: 'Position', type: 'coordinate' },
  { label: 'Mouth Rotation', group: 'Rotation', type: 'degrees' },
  { label: 'Hair Rotation', group: 'Rotation', type: 'degrees' },
  { label: 'Eye Rotation', group: 'Rotation', type: 'degrees' }
];
function createFormbiiLogo() {
  // Inject CSS once
  if (!document.getElementById("formbii-logo-styles")) {
    const style = document.createElement("style");
    style.id = "formbii-logo-styles";

    style.textContent = `
      .site-logo {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 18px;
        animation: formbiiLogoFloat 3s ease-in-out infinite;
      }

      .site-logo img {
        width: min(420px, 90vw);
        height: auto;

        filter:
          drop-shadow(0 4px 0 rgba(255,255,255,0.95))
          drop-shadow(0 8px 18px rgba(0,183,255,0.25));

        transition:
          transform 120ms ease,
          filter 120ms ease;

        user-select: none;
        -webkit-user-drag: none;
      }

      .site-logo img:hover {
        transform: scale(1.02);

        filter:
          drop-shadow(0 4px 0 rgba(255,255,255,1))
          drop-shadow(0 10px 22px rgba(0,183,255,0.35));
      }

      @keyframes formbiiLogoFloat {
        0% {
          transform: translateY(0px);
        }

        50% {
          transform: translateY(-3px);
        }

        100% {
          transform: translateY(0px);
        }
      }
    `;

    document.head.appendChild(style);
  }

  // Create logo container
  const logoContainer = document.createElement("header");
  logoContainer.className = "site-logo";

  // Create image
  const logo = document.createElement("img");
  logo.src = "/assets/formbii-logo.png";
  logo.alt = "formbii logo";

  logoContainer.appendChild(logo);

  return logoContainer;
}
function setSaveStatus(message) {
  saveStatus.textContent = message;
}

function createDownloadLink(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function cropCanvasToOpaqueBounds(sourceCanvas) {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const context = sourceCanvas.getContext('2d');
  if (!context) return sourceCanvas;

  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let foundOpaque = false;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 16) {
        foundOpaque = true;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (!foundOpaque || minX >= maxX || minY >= maxY) {
    return sourceCanvas;
  }

  const padding = 10;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width, maxX + padding);
  maxY = Math.min(height, maxY + padding);
  const croppedWidth = maxX - minX;
  const croppedHeight = maxY - minY;

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = croppedWidth;
  outputCanvas.height = croppedHeight;
  const outputContext = outputCanvas.getContext('2d');
  if (!outputContext) return sourceCanvas;

  outputContext.clearRect(0, 0, croppedWidth, croppedHeight);
  outputContext.drawImage(sourceCanvas, minX, minY, croppedWidth, croppedHeight, 0, 0, croppedWidth, croppedHeight);
  return outputCanvas;
}

function requestCanvasDataFromFrame(frame) {
  return new Promise((resolve, reject) => {
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const timeout = window.setTimeout(() => {
      window.removeEventListener('message', handleCanvasData);
      reject(new Error('Preview canvas not available.'));
    }, 10000);

    function handleCanvasData(event) {
      if (event.source !== frame.contentWindow || event.origin !== window.location.origin) return;
      if (!event.data || event.data.type !== 'CANVAS_DATA' || event.data.requestId !== requestId) return;

      window.clearTimeout(timeout);
      window.removeEventListener('message', handleCanvasData);

      if (event.data.error) {
        reject(new Error(event.data.error));
        return;
      }

      if (!event.data.dataUrl) {
        reject(new Error('Preview returned no image data.'));
        return;
      }

      resolve(event.data.dataUrl);
    }

    window.addEventListener('message', handleCanvasData);
    frame.contentWindow.postMessage({ type: 'REQUEST_CANVAS_DATA', requestId }, window.location.origin);
  });
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not process avatar image.'));
    image.src = dataUrl;
  });
}

function createPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not create PNG file.'));
        return;
      }

      resolve(blob);
    }, 'image/png');
  });
}

async function downloadAvatarPngFromFrame(frame, characterName) {
  if (!frame || !(frame instanceof HTMLIFrameElement)) {
    setSaveStatus('Unable to locate iframe for avatar.');
    return;
  }

  setSaveStatus('Preparing avatar for export...');

  try {
    const dataUrl = await requestCanvasDataFromFrame(frame);
    const image = await loadImageFromDataUrl(dataUrl);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Could not create PNG canvas.');
    }

    canvas.width = image.width;
    canvas.height = image.height;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);

    const exportCanvas = cropCanvasToOpaqueBounds(canvas);
    const filename = `${characterName.replace(/\.[^/.]+$/, '')}-avatar.png`;
    const blob = await createPngBlob(exportCanvas);

    createDownloadLink(blob, filename);
    setSaveStatus('PNG download started.');
  } catch (error) {
    console.error(error);
    setSaveStatus(`Could not export avatar PNG: ${error.message}`);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeHexColor(value) {
  const trimmedValue = String(value).trim();
  if (/^#[0-9a-f]{6}$/i.test(trimmedValue)) {
    return trimmedValue.toLowerCase();
  }

  if (/^[0-9a-f]{6}$/i.test(trimmedValue)) {
    return `#${trimmedValue.toLowerCase()}`;
  }

  return '';
}

function formatNumber(value, options = {}) {
  const number = Number.parseFloat(value);
  if (Number.isNaN(number)) {
    return String(value);
  }

  const roundedNumber = Math.round(number * 10) / 10;
  return options.keepSign ? String(roundedNumber) : String(Math.abs(roundedNumber));
}

function formatStyle(value) {
  const styleNumber = Number.parseInt(value, 10);
  if (Number.isNaN(styleNumber)) {
    return String(value);
  }

  return `Style ${styleNumber}`;
}

function formatCoordinate(value, label) {
  const number = Number.parseFloat(value);
  if (Number.isNaN(number)) {
    return String(value);
  }

  const creatorPosition = -Math.abs(number);
  if (creatorPosition === 0) {
    return 'Centered';
  }

  const distance = formatNumber(creatorPosition);
  if (label.endsWith(' X')) {
    return `${distance} left`;
  }

  if (label.endsWith(' Y')) {
    return `${distance} down`;
  }

  return String(creatorPosition);
}

function createPreviewUrl(characterText) {
  const query = new URLSearchParams({
    preview: '1',
    avatar: characterText
  });

  return `/creator.html?${query.toString()}`;
}

function createAvatarPreview(character, characterName) {
  return `
    <div class="avatar-preview is-loading" role="img" aria-label="${escapeHtml(characterName)} preview">
      <div class="avatar-preview-loading">PREVIEW LOADING</div>
      <iframe
        class="avatar-preview-frame"
        src="${escapeHtml(createPreviewUrl(character.content))}"
        title="${escapeHtml(characterName)} preview"
      ></iframe>
    </div>
  `;
}

function createDownloadUrl(characterText) {
  const blob = new Blob([characterText], { type: 'text/plain;charset=utf-8' });
  return URL.createObjectURL(blob);
}

function formatDetailValue(line) {
  if (line.type === 'color') {
    const color = normalizeHexColor(line.value);
    if (!color) {
      return escapeHtml(line.value);
    }

    return `
      <span class="color-value">
        <span class="color-swatch" style="background-color: ${escapeHtml(color)}"></span>
        <span>${escapeHtml(color)}</span>
      </span>
    `;
  }

  if (line.type === 'style') {
    return escapeHtml(formatStyle(line.value));
  }

  if (line.type === 'percent') {
    return `${escapeHtml(formatNumber(line.value))}%`;
  }

  if (line.type === 'degrees') {
    return `${escapeHtml(formatNumber(line.value, { keepSign: true }))}deg`;
  }

  if (line.type === 'coordinate') {
    return escapeHtml(formatCoordinate(line.value, line.label));
  }

  return escapeHtml(line.value);
}

function parseCharacterText(text) {
  const normalizedText = String(text)
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n');
  const lineValues = normalizedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '');
  const lines = lineValues.length >= fields.length
    ? lineValues
    : normalizedText
      .split(/\s*(?:\.\.\.|[,;|]|\r?\n)\s*|\s+/)
      .map((line) => line.trim())
      .filter((line) => line !== '');

  return lines.map((value, index) => {
    const field = fields[index] || {
      label: `Extra Value ${index - fields.length + 1}`,
      group: 'Extra',
      type: 'text'
    };

    return {
      ...field,
      value
    };
  });
}

function createDetailsSection(lines) {
  const groupedLines = lines.reduce((groups, line) => {
    if (!groups[line.group]) {
      groups[line.group] = [];
    }

    groups[line.group].push(line);
    return groups;
  }, {});

  return Object.entries(groupedLines).map(([groupName, groupLines]) => `
    <section class="detail-section">
      <h3>${escapeHtml(groupName)}</h3>
      <div class="details-grid">
        ${groupLines.map((line) => `
          <div>
            <div class="detail-label">${escapeHtml(line.label)}</div>
            <p class="detail-value">${formatDetailValue(line)}</p>
          </div>
        `).join('')}
      </div>
    </section>
  `).join('');
}

function renderCharacters(characters) {
  if (characters.length === 0) {
    characterList.innerHTML = '<section class="box empty-state">No saved characters yet.</section>';
    return;
  }

  characterList.innerHTML = characters.map((character) => {
    const lines = parseCharacterText(character.content);
    const savedDate = new Date(character.updatedAt).toLocaleString();
    const downloadName = character.originalName.endsWith('.txt')
      ? character.originalName
      : `${character.originalName}.txt`;

    return `
      <article class="box character-card">
        ${createAvatarPreview(character, character.originalName)}
        <div class="character-actions">
          <a
            class="button download-button"
            href="${escapeHtml(createDownloadUrl(character.content))}"
            download="${escapeHtml(downloadName)}"
          >Download Avatar Data</a>
          <button class="button download-png-button" type="button">Download Avatar PNG</button>
        </div>
        <h2>${escapeHtml(character.originalName)}</h2>
        <p class="character-meta">Saved ${escapeHtml(savedDate)}</p>
        <details class="character-details-toggle">
          <summary class="details-summary">View character details</summary>
          ${createDetailsSection(lines)}
          <div class="raw-data-title">Raw Data</div>
          <pre class="raw-data">${escapeHtml(character.content)}</pre>
        </details>
      </article>
    `;
  }).join('');

  document.querySelectorAll('.avatar-preview-frame').forEach((frame) => {
    frame.addEventListener('load', () => {
      setTimeout(() => markPreviewReady(frame), 5000);
    });

    // Fallback timeout in case load event doesn't fire
    setTimeout(() => {
      const preview = frame.closest('.avatar-preview');
      if (preview && !preview.classList.contains('is-ready')) {
        markPreviewReady(frame);
      }
    }, 8000);
  });
}

function markPreviewReady(frame) {
  const preview = frame.closest('.avatar-preview');
  if (!preview || preview.classList.contains('is-ready')) return;

  preview.classList.add('is-ready');
  setTimeout(() => {
    preview.classList.remove('is-loading');
  }, 180);
}

window.addEventListener('message', (event) => {
  if (event.data !== 'character-preview-ready') return;

  document.querySelectorAll('.avatar-preview-frame').forEach((frame) => {
    if (frame.contentWindow === event.source) {
      markPreviewReady(frame);
    }
  });
});

document.addEventListener('click', (event) => {
  const button = event.target.closest('.download-png-button');
  if (!button) return;

  const card = button.closest('.character-card');
  if (!card) {
    setSaveStatus('Unable to locate avatar preview.');
    return;
  }

  const frame = card.querySelector('.avatar-preview-frame');
  const characterName = card.querySelector('h2')?.textContent || 'avatar';
  button.disabled = true;
  Promise.resolve(downloadAvatarPngFromFrame(frame, characterName)).finally(() => {
    button.disabled = false;
  });
});

async function loadCharacters() {
  setSaveStatus('Loading characters...');

  const response = await fetch('/api/characters');
  if (!response.ok) {
    throw new Error('Could not load characters.');
  }

  const characters = await response.json();
  renderCharacters(characters);
  setSaveStatus('');
}

async function uploadCharacter(file) {
  const content = await file.text();
  const avatarName = avatarNameInput.value.trim();
  const uploadName = avatarName
    ? `${avatarName.replace(/\.txt$/i, '')}.txt`
    : file.name;

  const response = await fetch('/api/characters', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filename: uploadName,
      content
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Could not save character.' }));
    throw new Error(error.error || 'Could not save character.');
  }
}

uploadForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const file = characterFileInput.files[0];
  if (!file) {
    setSaveStatus('Choose a .txt file first.');
    return;
  }

  uploadButton.disabled = true;
  setSaveStatus('Saving character...');

  try {
    await uploadCharacter(file);
    characterFileInput.value = '';
    avatarNameInput.value = '';
    setSaveStatus('Character saved.');
    await loadCharacters();
  } catch (error) {
    setSaveStatus(error.message);
  } finally {
    uploadButton.disabled = false;
  }
});

refreshButton.addEventListener('click', async () => {
  try {
    await loadCharacters();
  } catch (error) {
    setSaveStatus(error.message);
  }
});

loadCharacters().catch((error) => {
  setSaveStatus(error.message);
});
