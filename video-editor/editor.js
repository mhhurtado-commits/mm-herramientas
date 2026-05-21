// Editor de Entrevistas IA - Frontend
let currentVideoFile = null;
let currentSegments = [];
let originalSegments = [];

let ffmpeg = null;

// Variables para la superposición de logo
let logoCanvas = null;
let logoCtx = null;
let logoImage = null;
let logoState = {
  x: 50,
  y: 50,
  width: 200,
  height: 70,
  opacity: 1,
  visible: true,
  active: false,
  action: null,
  dragOffset: { x: 0, y: 0 },
  resizeStart: null
};

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  setupDragAndDrop();
  initializeLogoOverlay();
});

function initializeLogoOverlay() {
  // Crear canvas para la superposición de logo
  const videoContainer = document.querySelector('.video-container');
  if (!videoContainer) return;
  
  // Crear canvas de superposición
  logoCanvas = document.createElement('canvas');
  logoCanvas.id = 'logo-overlay';
  logoCanvas.style.position = 'absolute';
  logoCanvas.style.top = '0';
  logoCanvas.style.left = '0';
  logoCanvas.style.pointerEvents = 'auto'; // Permitir interacciones
  logoCanvas.style.zIndex = '10';
  
  // Insertar el canvas sobre el video
  const videoPlayer = document.getElementById('videoPlayer');
  if (videoPlayer) {
    // Establecer dimensiones del canvas igual al video
    const updateCanvasSize = () => {
      if (videoPlayer.videoWidth && videoPlayer.videoHeight) {
        logoCanvas.width = videoPlayer.videoWidth;
        logoCanvas.height = videoPlayer.videoHeight;
      } else {
        // Dimensiones predeterminadas si el video no está listo
        logoCanvas.width = 800;
        logoCanvas.height = 450;
      }
      
      // Posicionar el canvas encima del video
      const rect = videoPlayer.getBoundingClientRect();
      const containerRect = videoContainer.getBoundingClientRect();
      
      logoCanvas.style.width = `${videoPlayer.offsetWidth}px`;
      logoCanvas.style.height = `${videoPlayer.offsetHeight}px`;
      logoCanvas.style.left = `${videoPlayer.offsetLeft}px`;
      logoCanvas.style.top = `${videoPlayer.offsetTop}px`;
    };
    
    // Actualizar tamaño cuando el video se cargue
    videoPlayer.addEventListener('loadedmetadata', updateCanvasSize);
    videoPlayer.addEventListener('resize', updateCanvasSize);
    
    // Actualizar tamaño también cuando cambie el tamaño de la ventana
    window.addEventListener('resize', updateCanvasSize);
    
    // Ejecutar inicialmente
    updateCanvasSize();
    
    // Añadir canvas al contenedor
    videoContainer.style.position = 'relative'; // Asegurar posición relativa
    videoContainer.appendChild(logoCanvas);
    
    // Obtener contexto del canvas
    logoCtx = logoCanvas.getContext('2d');
    
    // Cargar logo por defecto
    loadDefaultLogo();
    
    // Configurar eventos del canvas
    setupLogoCanvasEvents();
  }
}

function loadDefaultLogo() {
  // Cargar el logo por defecto (puedes cambiar esto por un logo específico)
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    logoImage = img;
    drawLogoOverlay();
  };
  // Utilizar un logo genérico o el logo de ejemplo del módulo de placas
  img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="260" height="90" viewBox="0 0 260 90"><rect width="260" height="90" fill="%23a6ce39"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="30" fill="white" text-anchor="middle" dominant-baseline="middle">LOGO</text></svg>';
}

function setupLogoCanvasEvents() {
  if (!logoCanvas) return;
  
  // Eventos de mouse
  logoCanvas.addEventListener('mousedown', handleLogoMouseDown);
  logoCanvas.addEventListener('mousemove', handleLogoMouseMove);
  logoCanvas.addEventListener('mouseup', handleLogoMouseUp);
  logoCanvas.addEventListener('mouseleave', handleLogoMouseUp);
  
  // Eventos táctiles para dispositivos móviles
  logoCanvas.addEventListener('touchstart', handleLogoTouchStart, { passive: false });
  logoCanvas.addEventListener('touchmove', handleLogoTouchMove, { passive: false });
  logoCanvas.addEventListener('touchend', handleLogoTouchEnd);
}

function getMousePos(canvas, evt) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  let clientX, clientY;
  if (evt.touches && evt.touches.length > 0) {
    clientX = evt.touches[0].clientX;
    clientY = evt.touches[0].clientY;
  } else {
    clientX = evt.clientX;
    clientY = evt.clientY;
  }
  
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

function hitTest(pos, element) {
  const SNAP = 8; // Distancia de acoplamiento (SNAP = 8 como solicitado)
  const handleSize = 12; // Tamaño del handle (handleRadius = 6, por lo tanto 12x12)
  
  // Verificar si el punto está dentro del elemento
  if (pos.x >= element.x && pos.x <= element.x + element.width &&
      pos.y >= element.y && pos.y <= element.y + element.height) {
    
    // Verificar si está sobre algún handle
    const handles = getHandles(element);
    for (const handle of handles) {
      if (Math.abs(pos.x - handle.x) < handleSize && Math.abs(pos.y - handle.y) < handleSize) {
        return { hit: true, type: 'handle', handle: handle.id };
      }
    }
    
    // Si está dentro del elemento pero no en un handle
    return { hit: true, type: 'element' };
  }
  
  return { hit: false };
}

function getHandles(element) {
  const handles = [];
  const handleRadius = 6;
  
  // Handles en las esquinas
  handles.push(
    { id: 'nw', x: element.x, y: element.y },         // Northwest
    { id: 'ne', x: element.x + element.width, y: element.y }, // Northeast
    { id: 'sw', x: element.x, y: element.y + element.height }, // Southwest
    { id: 'se', x: element.x + element.width, y: element.y + element.height } // Southeast
  );
  
  return handles;
}

function handleLogoMouseDown(e) {
  e.preventDefault();
  const pos = getMousePos(logoCanvas, e);
  const hitResult = hitTest(pos, logoState);
  
  if (hitResult.hit) {
    if (hitResult.type === 'handle') {
      // Comenzar redimensionamiento
      logoState.action = 'resize-' + hitResult.handle;
      logoState.resizeStart = {
        pos: { ...pos },
        element: { ...logoState }
      };
    } else if (hitResult.type === 'element') {
      // Comenzar arrastre
      logoState.action = 'drag';
      logoState.dragOffset = {
        x: pos.x - logoState.x,
        y: pos.y - logoState.y
      };
    }
    
    logoState.active = true;
    drawLogoOverlay();
  }
}

function handleLogoMouseMove(e) {
  if (!logoState.action) {
    const pos = getMousePos(logoCanvas, e);
    const hitResult = hitTest(pos, logoState);
    
    // Cambiar cursor según la situación
    if (hitResult.hit) {
      if (hitResult.type === 'handle') {
        const cursors = {
          'nw': 'nw-resize',
          'ne': 'ne-resize',
          'sw': 'sw-resize',
          'se': 'se-resize'
        };
        logoCanvas.style.cursor = cursors[hitResult.handle] || 'pointer';
      } else {
        logoCanvas.style.cursor = 'move';
      }
    } else {
      logoCanvas.style.cursor = 'default';
    }
    return;
  }
  
  e.preventDefault();
  const pos = getMousePos(logoCanvas, e);
  const SNAP = 8; // Distancia de acoplamiento (SNAP = 8 como solicitado)
  
  if (logoState.action === 'drag') {
    // Arrastrar el elemento
    let newX = pos.x - logoState.dragOffset.x;
    let newY = pos.y - logoState.dragOffset.y;
    
    // Aplicar acoplamiento magnético al centro
    const centerX = logoCanvas.width / 2;
    const centerY = logoCanvas.height / 2;
    
    // Acoplar horizontalmente al centro
    if (Math.abs((newX + logoState.width / 2) - centerX) < SNAP) {
      newX = centerX - logoState.width / 2;
    }
    
    // Acoplar verticalmente al centro
    if (Math.abs((newY + logoState.height / 2) - centerY) < SNAP) {
      newY = centerY - logoState.height / 2;
    }
    
    // Asegurar que el logo no salga del canvas
    newX = Math.max(0, Math.min(newX, logoCanvas.width - logoState.width));
    newY = Math.max(0, Math.min(newY, logoCanvas.height - logoState.height));
    
    logoState.x = newX;
    logoState.y = newY;
  } else if (logoState.action.startsWith('resize-')) {
    // Redimensionar el elemento manteniendo la proporción
    const handle = logoState.action.split('-')[1];
    const startX = logoState.resizeStart.element.x;
    const startY = logoState.resizeStart.element.y;
    const startW = logoState.resizeStart.element.width;
    const startH = logoState.resizeStart.element.height;
    
    const dx = pos.x - logoState.resizeStart.pos.x;
    const dy = pos.y - logoState.resizeStart.pos.y;
    
    // Calcular nuevas dimensiones basadas en el handle
    switch(handle) {
      case 'se': // Southeast - mantener proporción
        const newSizeSE = Math.min(
          Math.max(20, startW + dx), // Tamaño mínimo 20px
          Math.max(20, startH + dy)
        );
        logoState.width = newSizeSE;
        logoState.height = newSizeSE * (startH/startW); // Mantener proporción
        break;
      case 'nw': // Northwest - mantener proporción
        const newSizeNW = Math.min(
          Math.max(20, startW - dx), // Tamaño mínimo 20px
          Math.max(20, startH - dy)
        );
        const newW = newSizeNW;
        const newH = newSizeNW * (startH/startW); // Mantener proporción
        logoState.x = startX + (startW - newW);
        logoState.y = startY + (startH - newH);
        logoState.width = newW;
        logoState.height = newH;
        break;
      case 'ne': // Northeast - mantener proporción
        const newSizeNE = Math.min(
          Math.max(20, startW + dx), // Tamaño mínimo 20px
          Math.max(20, startH - dy)
        );
        const newWNE = newSizeNE;
        const newHNE = newSizeNE * (startH/startW); // Mantener proporción
        logoState.y = startY + (startH - newHNE);
        logoState.width = newWNE;
        logoState.height = newHNE;
        break;
      case 'sw': // Southwest - mantener proporción
        const newSizeSW = Math.min(
          Math.max(20, startW - dx), // Tamaño mínimo 20px
          Math.max(20, startH + dy)
        );
        const newWSW = newSizeSW;
        const newHSW = newSizeSW * (startH/startW); // Mantener proporción
        logoState.x = startX + (startW - newWSW);
        logoState.width = newWSW;
        logoState.height = newHSW;
        break;
    }
  }
  
  drawLogoOverlay();
}

function handleLogoMouseUp(e) {
  if (logoState.action) {
    logoState.action = null;
    logoState.resizeStart = null;
    logoCanvas.style.cursor = 'default';
    drawLogoOverlay();
  }
}

// Eventos táctiles
function handleLogoTouchStart(e) {
  if (e.touches.length > 0) {
    e.preventDefault();
    handleLogoMouseDown(e.touches[0]);
  }
}

function handleLogoTouchMove(e) {
  if (e.touches.length > 0) {
    e.preventDefault();
    handleLogoMouseMove(e.touches[0]);
  }
}

function handleLogoTouchEnd(e) {
  handleLogoMouseUp();
}

function drawLogoOverlay() {
  if (!logoCtx || !logoImage) return;
  
  // Limpiar canvas
  logoCtx.clearRect(0, 0, logoCanvas.width, logoCanvas.height);
  
  if (!logoState.visible) return;
  
  // Dibujar el logo
  logoCtx.globalAlpha = logoState.opacity;
  
  // Calcular la proporción para mantener la relación de aspecto
  const imgRatio = logoImage.width / logoImage.height;
  const logoRatio = logoState.width / logoState.height;
  
  let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
  
  if (imgRatio > logoRatio) {
    // La imagen es más ancha en proporción, ajustar por altura
    drawHeight = logoState.height;
    drawWidth = logoImage.width * (drawHeight / logoImage.height);
    offsetX = (logoState.width - drawWidth) / 2;
  } else {
    // La imagen es más alta en proporción, ajustar por ancho
    drawWidth = logoState.width;
    drawHeight = logoImage.height * (drawWidth / logoImage.width);
    offsetY = (logoState.height - drawHeight) / 2;
  }
  
  // Dibujar la imagen del logo
  logoCtx.drawImage(
    logoImage,
    logoState.x + offsetX,
    logoState.y + offsetY,
    drawWidth,
    drawHeight
  );
  
  logoCtx.globalAlpha = 1.0;
  
  // Dibujar handles si el elemento está activo
  if (logoState.active) {
    drawHandles();
  }
  
  // Dibujar líneas guía si está cerca del centro (para efecto de acoplamiento)
  drawGuidelines();
}

function drawHandles() {
  if (!logoCtx) return;
  
  const handles = getHandles(logoState);
  
  handles.forEach(handle => {
    logoCtx.beginPath();
    logoCtx.arc(handle.x, handle.y, 6, 0, Math.PI * 2); // radio de 6 como solicitado
    logoCtx.fillStyle = '#a6ce39'; // color verde como solicitado
    logoCtx.fill();
    logoCtx.strokeStyle = '#fff';
    logoCtx.lineWidth = 2;
    logoCtx.stroke();
  });
}

function drawGuidelines() {
  if (!logoCtx) return;
  
  const centerX = logoCanvas.width / 2;
  const centerY = logoCanvas.height / 2;
  const elementCenterX = logoState.x + logoState.width / 2;
  const elementCenterY = logoState.y + logoState.height / 2;
  
  const SNAP = 8; // Distancia de acoplamiento
  
  // Dibujar línea guía vertical si está cerca del centro
  if (Math.abs(elementCenterX - centerX) < SNAP) {
    logoCtx.beginPath();
    logoCtx.setLineDash([5, 3]); // Línea discontinua como solicitado
    logoCtx.moveTo(centerX, 0);
    logoCtx.lineTo(centerX, logoCanvas.height);
    logoCtx.strokeStyle = '#00ff00'; // Verde como solicitado
    logoCtx.lineWidth = 1;
    logoCtx.stroke();
    logoCtx.setLineDash([]);
  }
  
  // Dibujar línea guía horizontal si está cerca del centro
  if (Math.abs(elementCenterY - centerY) < SNAP) {
    logoCtx.beginPath();
    logoCtx.setLineDash([5, 3]); // Línea discontinua como solicitado
    logoCtx.moveTo(0, centerY);
    logoCtx.lineTo(logoCanvas.width, centerY);
    logoCtx.strokeStyle = '#00ff00'; // Verde como solicitado
    logoCtx.lineWidth = 1;
    logoCtx.stroke();
    logoCtx.setLineDash([]);
  }
}

function setupEventListeners() {
  const videoInput = document.getElementById('videoInput');
  const uploadArea = document.getElementById('uploadArea');
  const transcribeBtn = document.getElementById('transcribeBtn');
  const cleanBtn = document.getElementById('cleanBtn');
  const previewBtn = document.getElementById('previewBtn');
  const exportBtn = document.getElementById('exportBtn');
  const addSubtitlesBtn = document.getElementById('addSubtitlesBtn');
  
  uploadArea.addEventListener('click', () => videoInput.click());
  videoInput.addEventListener('change', handleVideoUpload);
  
  transcribeBtn.addEventListener('click', transcribeVideo);
  if (cleanBtn) cleanBtn.addEventListener('click', cleanTranscriptWithAI);
  if (previewBtn) previewBtn.addEventListener('click', previewEditedVideo);
  if (exportBtn) exportBtn.addEventListener('click', exportVideo);
  if (addSubtitlesBtn) addSubtitlesBtn.addEventListener('click', toggleSubtitles);
}

function setupDragAndDrop() {
  const uploadArea = document.getElementById('uploadArea');
  
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--v)';
    uploadArea.style.backgroundColor = 'var(--v-dim)';
  });

  uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--line2)';
    uploadArea.style.backgroundColor = '';
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--line2)';
    uploadArea.style.backgroundColor = '';
    
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        handleVideoFile(file);
      } else {
        showToast('Por favor seleccioná un archivo de video válido');
      }
    }
  });
}

function handleVideoUpload(e) {
  if (e.target.files.length > 0) {
    handleVideoFile(e.target.files[0]);
  }
}

function handleVideoFile(file) {
  if (file.size > 500 * 1024 * 1024) {
    showToast('El archivo es demasiado grande. Máximo 500MB.');
    return;
  }
  
  currentVideoFile = file;
  
  const videoPlayer = document.getElementById('videoPlayer');
  const uploadArea = document.getElementById('uploadArea');
  
  const url = URL.createObjectURL(file);
  videoPlayer.src = url;
  videoPlayer.style.display = 'block';
  uploadArea.style.display = 'none';
  
  document.getElementById('transcribeBtn').disabled = false;
  showToast('Video cargado correctamente. Hacé clic en "Transcribir con IA" para continuar.');
}

// Función principal de transcripción (sin FFmpeg)
async function transcribeVideo() {
  if (!currentVideoFile) {
    showToast('Primero subí un video');
    return;
  }
  
  showLoading('Extrayendo audio del video...');
  
  try {
    // Crear un elemento de video para obtener metadatos
    const videoUrl = URL.createObjectURL(currentVideoFile);
    const video = document.createElement('video');
    video.src = videoUrl;
    video.muted = true;
    
    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
    });
    
    const duration = video.duration;
    const sampleRate = 16000;
    
    // Crear un AudioContext normal para decodificar el audio
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Obtener el audio del video usando fetch (sin reproducción)
    const response = await fetch(videoUrl);
    const arrayBuffer = await response.arrayBuffer();
    
    // Decodificar el audio completo
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Limpiar recursos
    video.src = '';
    URL.revokeObjectURL(videoUrl);
    
    if (!audioBuffer || audioBuffer.duration === 0) {
      throw new Error('No se pudo extraer el audio del video');
    }
    
    console.log('Audio extraído correctamente, duración:', audioBuffer.duration);
    
    // Convertir a formato WAV (mono, 16kHz)
    const wavBlob = convertAudioBufferToWav(audioBuffer, sampleRate);
    
    console.log('Audio convertido a WAV, tamaño:', wavBlob.size);
    
    await audioContext.close();
    
    showLoading('Transcribiendo con IA...');
    
    // Enviar al Worker
    const WORKER = 'https://mm-herramientas-worker.mhhurtado.workers.dev';
    const formData = new FormData();
    formData.append('audio', wavBlob, 'audio.wav');
    
    const responseWorker = await fetch(WORKER + '/video-editor/transcribir', {
      method: 'POST',
      body: formData
    });
    
    const result = await responseWorker.json();
    
    if (!responseWorker.ok || !result.ok) {
      throw new Error(result.error || 'Error en transcripción');
    }
    
    if (result.segments && result.segments.length) {
      currentSegments = result.segments.map(seg => ({
        ...seg,
        removed: false
      }));
      originalSegments = [...currentSegments];
      renderTranscript(currentSegments);
      
      const buttons = ['cleanBtn', 'previewBtn', 'exportBtn', 'addSubtitlesBtn'];
      buttons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = false;
      });
      
      showToast(`✅ Transcripción completada: ${result.segments.length} segmentos`);
    } else {
      showToast('⚠ No se pudo transcribir el audio. Probá con otro video.');
    }
    
  } catch (error) {
    console.error('Error transcribiendo:', error);
    showToast(`Error: ${error.message}`);
  } finally {
    hideLoading();
  }
}

// Función para convertir AudioBuffer a WAV con resampleo
function convertAudioBufferToWav(audioBuffer, targetSampleRate = 16000) {
  const originalSampleRate = audioBuffer.sampleRate;
  const originalSamples = audioBuffer.getChannelData(0);
  
  let samples = originalSamples;
  
  // Resamplear si es necesario
  if (originalSampleRate !== targetSampleRate) {
    const ratio = targetSampleRate / originalSampleRate;
    const newLength = Math.round(originalSamples.length * ratio);
    samples = new Float32Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
      const srcIndex = i / ratio;
      const srcIndexFloor = Math.floor(srcIndex);
      const srcIndexCeil = Math.min(srcIndexFloor + 1, originalSamples.length - 1);
      const fraction = srcIndex - srcIndexFloor;
      samples[i] = originalSamples[srcIndexFloor] * (1 - fraction) + originalSamples[srcIndexCeil] * fraction;
    }
  }
  
  const numChannels = 1;
  const sampleRate = targetSampleRate;
  const format = 1;
  const bitDepth = 16;
  const dataLength = samples.length * 2;
  const bufferLength = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);
  
  function writeString(view, offset, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }
  
  writeString(view, 0, 'RIFF');
  view.setUint32(4, bufferLength - 8, true);
  view.setUint32(8, 16, true);
  view.setUint16(12, format, true);
  view.setUint16(14, numChannels, true);
  view.setUint32(16, sampleRate, true);
  view.setUint32(20, sampleRate * numChannels * 2, true);
  view.setUint16(24, numChannels * 2, true);
  view.setUint16(26, bitDepth, true);
  writeString(view, 28, 'data');
  view.setUint32(32, dataLength, true);
  
  let offset = 36;
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

async function cleanTranscriptWithAI() {
  if (currentSegments.length === 0) {
    showToast('Primero transcribí el video');
    return;
  }
  
  showLoading('Analizando con IA para detectar muletillas y silencios...');
  
  try {
    const transcriptText = currentSegments.map(s => s.text).join(' ');
    
    // Usar Gemini a través del worker
    const WORKER = 'https://mm-herramientas-worker.mhhurtado.workers.dev';
    
    const prompt = `Analiza esta transcripción de entrevista y devuelve SOLO los números de segmento (índices) que contienen muletillas, silencios o repeticiones. 
    Formato de respuesta: [0, 2, 5]
    
    Transcripción por segmentos:
    ${currentSegments.map((s, i) => `${i}: ${s.text}`).join('\n')}`;
    
    const response = await fetch(WORKER + '/titulares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modo: 'nota',
        contenido: prompt,
        cantidad: 1,
        tono: 'directo'
      })
    });
    
    const data = await response.json();
    
    let indicesAEliminar = [];
    
    if (data.ok && data.titulares && data.titulares.length) {
      const text = data.titulares[0];
      const matches = text.match(/\d+/g);
      if (matches) {
        indicesAEliminar = matches.map(Number).filter(i => i < currentSegments.length);
      }
    }
    
    // Si no se detectaron índices, usar detección local de muletillas
    if (indicesAEliminar.length === 0) {
      const muletillas = ['eh', 'este', 'em', 'mm', 'ah', 'ehh', 'estee', 'o sea', 'digamos', 'como que'];
      currentSegments.forEach((segment, idx) => {
        const textLower = segment.text.toLowerCase();
        let tieneMuletilla = false;
        for (const m of muletillas) {
          if (textLower.includes(m)) {
            tieneMuletilla = true;
            break;
          }
        }
        if (tieneMuletilla || (segment.end - segment.start) < 1.5) {
          indicesAEliminar.push(idx);
        }
      });
    }
    
    // Marcar los segmentos
    currentSegments = currentSegments.map((segment, idx) => ({
      ...segment,
      removed: indicesAEliminar.includes(idx) ? true : segment.removed
    }));
    
    renderTranscript(currentSegments);
    showToast(`🔍 ${indicesAEliminar.length} segmentos marcados para eliminar. Revisá y editá si es necesario.`);
    
  } catch (error) {
    console.error('Error limpiando con IA:', error);
    showToast(`Error: ${error.message}`);
  } finally {
    hideLoading();
  }
}

function renderTranscript(segments) {
  const container = document.getElementById('transcriptContent');
  
  if (segments.length === 0) {
    container.innerHTML = '<p class="text-muted">No hay transcripción disponible aún.</p>';
    return;
  }
  
  container.innerHTML = segments.map((segment, index) => {
    const startTime = formatTime(segment.start);
    const endTime = formatTime(segment.end);
    const removedClass = segment.removed ? 'removed' : '';
    
    return `
      <div class="segment ${removedClass}" data-index="${index}">
        <div class="segment-time">${startTime} - ${endTime}</div>
        <div class="segment-text">${escapeHtml(segment.text)}</div>
        <div class="segment-actions">
          <button class="mm-btn mm-btn-sm" onclick="toggleSegment(${index})">
            ${segment.removed ? '↩️ Restaurar' : '🗑️ Quitar'}
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  document.querySelectorAll('.segment').forEach(segmentEl => {
    segmentEl.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON') {
        const index = parseInt(segmentEl.dataset.index);
        const segment = currentSegments[index];
        if (segment) {
          const video = document.getElementById('videoPlayer');
          video.currentTime = segment.start;
          video.focus();
        }
      }
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function toggleSegment(index) {
  if (index < 0 || index >= currentSegments.length) return;
  
  currentSegments[index].removed = !currentSegments[index].removed;
  renderTranscript(currentSegments);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function previewEditedVideo() {
  const segmentsToKeep = currentSegments.filter(s => !s.removed);
  if (segmentsToKeep.length === 0) {
    showToast('No hay segmentos para previsualizar');
    return;
  }
  
  const video = document.getElementById('videoPlayer');
  if (video && segmentsToKeep[0]) {
    video.currentTime = segmentsToKeep[0].start;
    video.play();
    showToast(`Reproduciendo desde ${formatTime(segmentsToKeep[0].start)}`);
  }
}

async function exportVideo() {
  if (!currentVideoFile) {
    showToast('No hay video para exportar');
    return;
  }
  
  const segmentsToKeep = currentSegments.filter(s => !s.removed);
  if (segmentsToKeep.length === 0) {
    showToast('No hay segmentos para exportar. Dejá al menos un segmento activo.');
    return;
  }
  
  // Si solo hay un segmento y es el original, no hay cortes que hacer
  if (segmentsToKeep.length === 1 && 
      segmentsToKeep[0].start === 0 && 
      segmentsToKeep[0].end === currentSegments[currentSegments.length - 1].end) {
    showToast('No hay cambios para exportar. El video se mantiene igual.');
    return;
  }
  
  showLoading('Cargando FFmpeg...');
  
  try {
    const ffmpegInstance = await loadFFmpeg();
    
    showLoading('Procesando video editado...');
    
    // Escribir el video original en el sistema de archivos virtual
    const videoData = await readFileAsArrayBuffer(currentVideoFile);
    ffmpegInstance.FS('writeFile', 'input.mp4', new Uint8Array(videoData));
    
    // Construir el comando de FFmpeg para cortar y unir segmentos
    let filterComplex = '';
    let mapV = '';
    let mapA = '';
    
    for (let i = 0; i < segmentsToKeep.length; i++) {
      const seg = segmentsToKeep[i];
      const start = seg.start;
      const end = seg.end;
      
      filterComplex += `[0:v]trim=start=${start}:end=${end},setpts=PTS-STARTPTS[v${i}];`;
      filterComplex += `[0:a]atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS[a${i}];`;
      mapV += `[v${i}]`;
      mapA += `[a${i}]`;
    }
    
    filterComplex += `${mapV}concat=n=${segmentsToKeep.length}:v=1:a=0[vout];${mapA}concat=n=${segmentsToKeep.length}:v=0:a=1[aout]`;
    
    // Ejecutar FFmpeg
    await ffmpegInstance.run('-i', 'input.mp4', '-filter_complex', filterComplex, '-map', '[vout]', '-map', '[aout]', '-c:v', 'libx264', '-c:a', 'aac', '-preset', 'fast', '-crf', '23', 'output.mp4');
    
    // Leer el archivo resultante
    const data = ffmpegInstance.FS('readFile', 'output.mp4');
    const outputBlob = new Blob([data.buffer], { type: 'video/mp4' });
    const outputUrl = URL.createObjectURL(outputBlob);
    
    // Limpiar archivos temporales
    ffmpegInstance.FS('unlink', 'input.mp4');
    ffmpegInstance.FS('unlink', 'output.mp4');
    
    // Mostrar el resultado
    const videoPlayer = document.getElementById('videoPlayer');
    const videoResult = document.getElementById('videoResult');
    const exportVideoPreview = document.getElementById('exportVideoPreview');
    const downloadLink = document.getElementById('exportDownloadLink');
    
    if (exportVideoPreview) {
      exportVideoPreview.src = outputUrl;
      exportVideoPreview.style.display = 'block';
    }
    if (videoResult) videoResult.style.display = 'block';
    if (downloadLink) {
      downloadLink.href = outputUrl;
      downloadLink.download = `entrevista-editada-${new Date().toISOString().slice(0, 19)}.mp4`;
    }
    
    showToast(`✅ Video exportado correctamente. Segmentos conservados: ${segmentsToKeep.length}`);
    
  } catch (error) {
    console.error('Error exportando:', error);
    showToast(`Error exportando: ${error.message}`);
  } finally {
    hideLoading();
  }
}

function toggleSubtitles() {
  showToast('Funcionalidad de subtítulos en desarrollo.');
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function showLoading(text) {
  document.getElementById('loadingText').textContent = text || 'Procesando...';
  document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('active');
}

// Exponer toggleSegment globalmente para los botones onclick
window.toggleSegment = toggleSegment;

// ============================================================
// FFMPEG.WASM PARA CORTAR VIDEO
// ============================================================

let ffmpeg = null;

async function loadFFmpeg() {
  if (ffmpeg) return ffmpeg;
  
  showLoading('Cargando FFmpeg (primera vez puede tardar unos segundos)...');
  
  try {
    // Cargar FFmpeg desde CDN confiable
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/ffmpeg.min.js';
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    
    const { createFFmpeg } = FFmpeg;
    ffmpeg = createFFmpeg({ log: false });
    await ffmpeg.load();
    
    hideLoading();
    return ffmpeg;
  } catch (error) {
    console.error('Error cargando FFmpeg:', error);
    hideLoading();
    throw new Error('No se pudo cargar FFmpeg. Verificá tu conexión a internet.');
  }
}

// Función auxiliar para leer archivo como ArrayBuffer
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}