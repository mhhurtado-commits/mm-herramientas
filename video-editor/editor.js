// Editor de Entrevistas IA - Nuevo Rediseño
const WORKER = 'https://mm-herramientas-worker.mhhurtado.workers.dev';
console.log('🔧 Worker URL:', WORKER);

let currentVideoFile = null;
let currentSegments = [];
let originalSegments = [];
let currentWords = [];      // Palabras con sus tiempos (de la transcripción)
let ffmpeg = null;
let showSubtitles = false;
let subtitleCanvas = null;
let subtitleCtx = null;
let fontLoaded = false;

// Variables para el sistema de marcadores de corte
let cuts = []; // { id, start, end }
let timelineCanvas = null;
let timelineCtx = null;
let audioCanvas = null;
let audioCtx = null;
let audioBuffer = null;
let videoDuration = 0;
let animationFrame = null;
let timelineThumbnails = [];
let isExtractingThumbnails = false;
let waveformData = [];

// Variables para el sistema de overlays
let overlays = []; // { id, type, file, startTime, duration, opacity, x, y }
let nextOverlayId = 1;
let tempOverlayFile = null;

// ============================================================
// INICIALIZACIÓN DE FFMPEG
// ============================================================

async function initFFmpeg() {
  try {
    // Esperar a que FFmpeg esté disponible (hasta 5 segundos)
    let attempts = 0;
    const maxAttempts = 50; // 5 segundos con intervalos de 100ms
    
    while (typeof FFmpeg === 'undefined' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (typeof FFmpeg === 'undefined') {
      console.error('❌ FFmpeg no está cargado del CDN');
      showToast('Error: FFmpeg no disponible', 'error');
      return false;
    }

    // Verificar si FFmpeg ya está cargado
    if (ffmpeg && ffmpeg.isLoaded()) {
      console.log('✅ FFmpeg ya estaba cargado');
      return true;
    }

    console.log('⏳ Inicializando FFmpeg (WASM - sin threads)...');
    
    // Crear instancia de FFmpeg usando el constructor global
    ffmpeg = FFmpeg.createFFmpeg({ log: false });

    // Configuración para Cloudflare Pages (sin COOP/COEP)
    await ffmpeg.load({
      coreURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@latest/dist/ffmpeg-core.js'
    });

    console.log('✅ FFmpeg (WASM) inicializado correctamente');
    console.log('⚠️ Modo: Single-threaded (más lento, pero compatible)');
    showToast('✅ Editor listo', 'success');
    return true;

  } catch (error) {
    console.error('❌ Error inicializando FFmpeg:', error.message);
    
    // Si falla WASM, usar fallback
    console.warn('⚠️ Fallback: FFmpeg no disponible');
    console.warn('ℹ️ Algunas funciones no estarán disponibles');
    
    showToast('⚠️ Algunas funciones pueden no estar disponibles', 'warning');
    return false;
  }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', async () => {
  console.log('📍 Iniciando aplicación...');
  await initFFmpeg();
  setupEventListeners();
  setupDragAndDrop();
  initTimeline();
  initSubtitleCanvas();
  
  // Resizar canvas de subtítulos cuando cambia el tamaño del video
  window.addEventListener('resize', resizeSubtitleCanvas);
  resizeSubtitleCanvas();
  
  // Cargar la fuente de los subtítulos
  document.fonts.load("900 72px 'BebasNeue'").then(() => {
    fontLoaded = true;
    console.log('Fuente BebasNeue cargada.');
  }).catch(() => {
    fontLoaded = true; // Continuar aunque falle
    console.warn('No se pudo cargar la fuente BebasNeue, usando fallback.');
  });
});

function setupEventListeners() {
  const videoInput = document.getElementById('videoInput');
  videoInput.addEventListener('change', handleVideoUpload);
  
  document.getElementById('transcribeBtn').addEventListener('click', transcribeVideo);
  document.getElementById('previewBtn').addEventListener('click', previewEditedVideo);
  document.getElementById('exportBtn').addEventListener('click', exportVideo);
  document.getElementById('toggleSubsBtn').addEventListener('click', toggleSubtitles);
  
  document.getElementById('markInBtn').addEventListener('click', marcarInicioCorte);
  document.getElementById('markOutBtn').addEventListener('click', marcarFinCorte);
  document.getElementById('clearCutsBtn').addEventListener('click', limpiarTodosCortes);
  document.getElementById('addManualCutBtn').addEventListener('click', addManualCut);
  
  // Event listeners para overlays
  const overlayInput = document.getElementById('overlayInput');
  if (overlayInput) {
    overlayInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        tempOverlayFile = e.target.files[0];
        if (tempOverlayFile.size > 100 * 1024 * 1024) {
          showToast('El overlay es demasiado grande. Máximo 100MB.', 'error');
          tempOverlayFile = null;
          return;
        }
        // Mostrar propiedades de overlay
        const propsDiv = document.getElementById('overlayProperties');
        if (propsDiv) {
          propsDiv.style.display = 'flex';
          propsDiv.style.flexDirection = 'column';
          document.getElementById('overlayStartTime').value = Math.floor(document.getElementById('videoPlayer').currentTime || 0);
          document.getElementById('overlayDuration').value = 3;
          document.getElementById('overlayOpacity').value = 80;
        }
      }
    });
  }

  document.getElementById('overlayOpacity')?.addEventListener('input', (e) => {
    document.getElementById('opacityValue').textContent = e.target.value + '%';
  });

  document.getElementById('confirmOverlayBtn')?.addEventListener('click', confirmAddOverlay);
}

function setupDragAndDrop() {
  const uploadArea = document.getElementById('uploadArea');
  if (!uploadArea) return;
  
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--v)';
    uploadArea.style.backgroundColor = 'var(--v-dim)';
  });

  uploadArea.addEventListener('dragleave', () => {
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

function handleVideoUpload(event) {
  const file = event.target.files[0];
  
  if (!file) {
    showToast('No se seleccionó archivo', 'error');
    return;
  }

  // Validar tamaño (máximo 500MB)
  const maxSize = 500 * 1024 * 1024; // 500MB en bytes
  if (file.size > maxSize) {
    showToast(`❌ Archivo demasiado grande. Máximo 500MB, tienes ${(file.size / 1024 / 1024).toFixed(2)}MB`, 'error');
    return;
  }

  // Validar tipo de archivo
  const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/mpeg'];
  if (!validTypes.some(type => file.type.startsWith(type.split('/')[0]))) {
    showToast('❌ Formato no soportado. Usa MP4, MOV, AVI', 'error');
    return;
  }

  console.log('📹 Cargando video:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  showLoading('Cargando video en memoria...');

  try {
    currentVideoFile = file;

    // Crear Blob URL de forma segura
    if (window.videoURL) {
      URL.revokeObjectURL(window.videoURL);
    }
    window.videoURL = URL.createObjectURL(file);

    // Mostrar video en player
    const videoElement = document.getElementById('videoPlayer');
    const videoWrapper = document.getElementById('videoWrapper');
    const uploadArea = document.getElementById('uploadArea');

    videoElement.src = window.videoURL;
    videoWrapper.style.display = 'block';
    uploadArea.style.display = 'none';

    // Event: cuando el navegador lee los metadatos del video
    videoElement.onloadedmetadata = () => {
      videoDuration = videoElement.duration;
      console.log('✅ Video cargado. Duración:', formatTime(videoDuration));

      // Habilitar botones
      document.getElementById('transcribeBtn').disabled = false;
      document.getElementById('toggleSubsBtn').disabled = false;
      document.getElementById('previewBtn').disabled = false;
      document.getElementById('exportBtn').disabled = false;

      // Mostrar controles
      document.getElementById('cutControls').style.display = 'flex';
      document.getElementById('timelineContainer').style.display = 'block';
      
      // Actualizar etiquetas de tiempo
      document.getElementById('timelineStart').textContent = '0:00';
      document.getElementById('timelineEnd').textContent = formatTime(videoDuration);
      document.getElementById('timelineTime').textContent = '0:00 / ' + formatTime(videoDuration);

      // Inicializar cortes (todo el video)
      if (cuts.length === 0) {
        cuts = [{ id: 1, start: 0, end: videoDuration }];
        actualizarListaCuts();
      }

      // Iniciar extracción de miniaturas y waveform en paralelo
      extractVideoThumbnails(videoElement);
      extractAudioWaveform();
      
      // Iniciar loop de animación
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(updateProgress);

      showToast(`✅ Video cargado: ${file.name} (${formatTime(videoDuration)})`);
      hideLoading();
    };

    // Event: si hay error cargando
    videoElement.onerror = (e) => {
      console.error('❌ Error cargando video:', e);
      showToast('❌ Error al cargar video. Intenta con otro formato.', 'error');
      hideLoading();
    };

  } catch (error) {
    console.error('❌ Error en handleVideoUpload:', error);
    showToast(`Error: ${error.message}`, 'error');
    hideLoading();
  }
}

// Mantener la función handleVideoFile como wrapper para drag & drop
function handleVideoFile(file) {
  // Creamos un objeto event simulado para reutilizar handleVideoUpload
  const event = { target: { files: [file] } };
  handleVideoUpload(event);
}

function updateProgress() {
  const videoPlayer = document.getElementById('videoPlayer');
  if (videoPlayer) {
    // Actualizar tiempo actual / total
    const current = formatTime(videoPlayer.currentTime);
    const total = formatTime(videoDuration);
    document.getElementById('timelineTime').textContent = current + ' / ' + total;
    
    // Redibujar timeline y waveform
    drawTimeline();
    drawWaveform();
    
    if (showSubtitles) {
      drawSubtitles(videoPlayer.currentTime);
    }
  }
  animationFrame = requestAnimationFrame(updateProgress);
}

async function transcribeVideo() {
  if (!currentVideoFile) {
    showToast('Primero subí un video');
    return;
  }
  showLoading('Extrayendo audio y transcribiendo...');

  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const response = await fetch(URL.createObjectURL(currentVideoFile));
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const CHUNK_DURATION = 60; // 60 segundos por fragmento
    const TARGET_SAMPLE_RATE = 16000;
    const chunks = [];
    let start = 0;

    while (start < audioBuffer.duration) {
        const end = Math.min(start + CHUNK_DURATION, audioBuffer.duration);
        const duration = end - start;
        const offlineCtx = new OfflineAudioContext(1, Math.ceil(duration * TARGET_SAMPLE_RATE), TARGET_SAMPLE_RATE);
        const source = offlineCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineCtx.destination);
        source.start(0, start);
        const renderedBuffer = await offlineCtx.startRendering();
        const wavBlob = await audioBufferToWav(renderedBuffer, TARGET_SAMPLE_RATE);
        chunks.push({ blob: wavBlob, start: start });
        start = end;
    }
    await audioContext.close();

    let allWordsData = [];
    let allSegmentsData = [];

    for (let i = 0; i < chunks.length; i++) {
        showLoading(`Transcribiendo fragmento ${i + 1}/${chunks.length}...`);
        const formData = new FormData();
        formData.append('audio', chunks[i].blob, `chunk_${i}.wav`);
        const res = await fetch(`${WORKER}/video-editor/transcribir`, { method: 'POST', body: formData });
        const result = await res.json();

        if (!res.ok) throw new Error(result.error || `Error en el fragmento ${i + 1}`);

        const offset = chunks[i].start;
        if (result.words) {
            allWordsData.push(...result.words.map(w => ({ ...w, start: w.start + offset, end: w.end + offset })));
        }
        if (result.segments) {
            allSegmentsData.push(...result.segments.map(s => ({ ...s, start: s.start + offset, end: s.end + offset })));
        }
    }

    currentWords = allWordsData;
    currentSegments = allSegmentsData; // Guardar segmentos también
    
    hideLoading();
    renderInteractiveTranscript({ words: currentWords, segments: currentSegments });
    showToast(`✅ Transcripción completada.`);

  } catch (error) {
    console.error('❌ Error transcribiendo:', error);
    showToast(`Error: ${error.message}`);
    hideLoading();
  }
}

function renderInteractiveTranscript({ words, segments }) {
  const miniContainer = document.getElementById('transcriptTextMini');
  if (!miniContainer) return;
  miniContainer.innerHTML = '';

  if (!words || words.length === 0) return;

  let speakersMap = {};
  words.forEach(word => {
    const speaker = word.speaker || 'Hablante 1';
    if (!speakersMap[speaker]) speakersMap[speaker] = [];
    speakersMap[speaker].push(word);
  });

  Object.entries(speakersMap).forEach(([speaker, words]) => {
    const speakerBlock = document.createElement('div');
    speakerBlock.className = 'mm-speaker-block';
    const speakerBadge = document.createElement('div');
    speakerBadge.className = 'mm-speaker-badge';
    speakerBadge.textContent = speaker;
    speakerBlock.appendChild(speakerBadge);
    const wordsContainer = document.createElement('div');
    wordsContainer.className = 'mm-transcript-words-container';

    words.forEach(wordObj => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'mm-transcript-word';
      wordSpan.textContent = wordObj.word + ' ';
      wordSpan.dataset.start = wordObj.start;
      wordSpan.dataset.end = wordObj.end;
      wordSpan.addEventListener('click', () => {
        const videoPlayer = document.getElementById('videoPlayer');
        if (videoPlayer) {
          videoPlayer.currentTime = parseFloat(wordObj.start);
          videoPlayer.play().catch(e => console.log("Playback failed:", e));
        }
      });
      wordsContainer.appendChild(wordSpan);
    });
    speakerBlock.appendChild(wordsContainer);
    miniContainer.appendChild(speakerBlock);
  });

  document.getElementById('transcriptionMini').style.display = 'block';
  const videoPlayer = document.getElementById('videoPlayer');
  videoPlayer.addEventListener('timeupdate', () => {
      const currentTime = videoPlayer.currentTime;
      const wordElements = document.querySelectorAll('.mm-transcript-word');
      wordElements.forEach(word => {
          const start = parseFloat(word.dataset.start);
          const end = parseFloat(word.dataset.end);
          if (currentTime >= start && currentTime <= end) {
              word.classList.add('active');
              word.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          } else {
              word.classList.remove('active');
          }
      });
  });
}


// --- Funciones de Subtítulos --- 

function initSubtitleCanvas() {
  subtitleCanvas = document.getElementById('subtitleCanvas');
  subtitleCtx = subtitleCanvas.getContext('2d');
  resizeSubtitleCanvas();
}

function resizeSubtitleCanvas() {
  const video = document.getElementById('videoPlayer');
  const wrapper = document.getElementById('videoWrapper');
  if (!video || !wrapper) return;
  
  const rect = wrapper.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  
  subtitleCanvas.width = rect.width * dpr;
  subtitleCanvas.height = rect.height * dpr;
  subtitleCanvas.style.width = rect.width + 'px';
  subtitleCanvas.style.height = rect.height + 'px';
  
  subtitleCtx.setTransform(1, 0, 0, 1, 0, 0);
  subtitleCtx.scale(dpr, dpr);
}

function toggleSubtitles() {
  showSubtitles = !showSubtitles;
  const btn = document.getElementById('toggleSubsBtn');
  btn.classList.toggle('active', showSubtitles);
  if (!showSubtitles) {
    subtitleCtx.clearRect(0, 0, subtitleCanvas.width, subtitleCanvas.height);
  }
  showToast(`Subtítulos ${showSubtitles ? 'activados' : 'desactivados'}`);
}

function drawSubtitles(currentTime) {
  if (!currentSegments || !currentWords || !showSubtitles) return;

  // Usar las dimensiones de display (sin DPR para coordenadas)
  const wrapper = document.getElementById('videoWrapper');
  if (!wrapper) return;
  
  const rect = wrapper.getBoundingClientRect();
  const W = rect.width;
  const H = rect.height;
  
  subtitleCtx.clearRect(0, 0, W, H);

  const S = { // Configuraciones de estilo
    subsPosY: 0.88, // Posición vertical
    subsColorNormal: '#ffffff',
    subsColorResaltado: '#a6ce39',
    subsFontSize: 48, // Tamaño base
    subsBgOp: 0.5,
  };

  reelDrawSubtitulosBloqueConPalabraActiva(
    subtitleCtx, W, H,
    currentSegments, currentWords, currentTime, S
  );
}

function reelDrawSubtitulosBloqueConPalabraActiva(ctx, W, H, segments, words, currentTime, S) {
  if (!segments || !segments.length) return;

  const activeSegment = segments.find(seg => currentTime >= seg.start && currentTime <= seg.end);
  if (!activeSegment) return;

  const activeWord = words.find(w => currentTime >= w.start && currentTime <= w.end);
  
  // Usar una fuente grande para buena calidad
  const ff = fontLoaded ? "'BebasNeue', Impact, sans-serif" : "Impact, sans-serif";
  const sz = S.subsFontSize || 48; // Tamaño fijo en pixels de display
  ctx.font = `900 ${sz}px ${ff}`;
  ctx.textBaseline = 'top';
  const GAP = Math.round(sz * 0.15);
  const PAD_H = Math.round(sz * 0.4), PAD_V = Math.round(sz * 0.2);

  const palabrasTexto = activeSegment.text.trim().split(/\s+/);
  const palabrasMayus = palabrasTexto.map(p => p.toUpperCase());
  const anchos = palabrasMayus.map(p => ctx.measureText(p).width);

  let lineas = [];
  let lineaActual = [];
  let anchoActual = 0;

  for (let i = 0; i < palabrasMayus.length; i++) {
      const anchoPalabra = anchos[i];
      if (anchoActual > 0 && anchoActual + GAP + anchoPalabra > W * 0.92) {
          lineas.push(lineaActual);
          lineaActual = [palabrasMayus[i]];
          anchoActual = anchoPalabra;
      } else {
          lineaActual.push(palabrasMayus[i]);
          anchoActual += (anchoActual > 0 ? GAP : 0) + anchoPalabra;
      }
  }
  if (lineaActual.length) lineas.push(lineaActual);

  const altL = sz * 1.15;
  const yIni = Math.round(H * (S.subsPosY || 0.85)) - (lineas.length - 1) * altL;

  // Fondo del subtítulo
  if (S.subsBgOp > 0) {
      ctx.save();
      ctx.fillStyle = '#000000';
      ctx.globalAlpha = S.subsBgOp;
      const maxAncho = Math.max(...lineas.map(l => ctx.measureText(l.join(' ')).width));
      rrCtx(ctx, (W - maxAncho) / 2 - PAD_H, yIni - PAD_V, maxAncho + PAD_H * 2, lineas.length * altL + PAD_V * 2, sz * 0.15);
      ctx.fill();
      ctx.restore();
  }

  // Dibujar cada palabra
  lineas.forEach((linea, li) => {
      const aw = ctx.measureText(linea.join(' ')).width;
      let x = (W - aw) / 2;
      const yL = yIni + li * altL;
      
      linea.forEach(palabra => {
          const palabraOriginal = words.find(w => w.word.toUpperCase() === palabra && w.start >= activeSegment.start && w.end <= activeSegment.end);
          const isActive = palabraOriginal && activeWord && palabraOriginal.start === activeWord.start;

          ctx.save();
          ctx.fillStyle = isActive ? S.subsColorResaltado : S.subsColorNormal;
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = sz * 0.12;
          ctx.fillText(palabra, x, yL);
          ctx.restore();
          x += ctx.measureText(palabra).width + GAP;
      });
  });
}

function rrCtx(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

// --- Resto de las funciones (Timeline, Cortes, Exportación, etc.) ---

async function audioBufferToWav(audioBuffer, sampleRate) {
    const samples = audioBuffer.getChannelData(0);
    const dataLength = samples.length * 2;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    let pcm = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
        let s = Math.max(-1, Math.min(1, samples[i]));
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    new Int16Array(buffer, 44).set(pcm);

    return new Blob([view], { type: 'audio/wav' });
}


function initTimeline() {
  timelineCanvas = document.getElementById('timelineCanvas');
  timelineCtx = timelineCanvas.getContext('2d');
  audioCanvas = document.getElementById('audioCanvas');
  timelineCanvas.addEventListener('click', onTimelineClick);
}

async function extractAudioWaveform() {
  if (!currentVideoFile) return;
  
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const response = await fetch(URL.createObjectURL(currentVideoFile));
    const arrayBuffer = await response.arrayBuffer();
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Extraer datos de waveform (promedio de muestras)
    const rawData = audioBuffer.getChannelData(0);
    const samples = 200; // número de muestras para el waveform
    const blockSize = Math.floor(rawData.length / samples);
    waveformData = [];
    
    for (let i = 0; i < samples; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[i * blockSize + j]);
      }
      waveformData.push(sum / blockSize);
    }
    
    // Normalizar
    const maxVal = Math.max(...waveformData);
    waveformData = waveformData.map(v => v / maxVal);
    
    audioCtx = audioContext;
    drawWaveform();
    
  } catch (error) {
    console.warn('No se pudo extraer waveform:', error);
  }
}

function drawWaveform() {
  if (!audioCanvas || !waveformData.length) return;
  
  const ctx = audioCanvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const wrapper = audioCanvas.parentElement;
  const displayWidth = wrapper.clientWidth;
  const displayHeight = 50;
  
  // Solo redimensionar si cambió
  if (audioCanvas.width !== displayWidth * dpr || audioCanvas.height !== displayHeight * dpr) {
    audioCanvas.width = displayWidth * dpr;
    audioCanvas.height = displayHeight * dpr;
    audioCanvas.style.width = displayWidth + 'px';
    audioCanvas.style.height = displayHeight + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }
  
  const w = displayWidth;
  const h = displayHeight;
  
  // Fondo
  ctx.fillStyle = '#252522';
  ctx.fillRect(0, 0, w, h);
  
  // Dibujar waveform como área verde
  const sliceWidth = w / waveformData.length;
  
  // Área superior
  ctx.fillStyle = 'rgba(166, 206, 57, 0.7)';
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  for (let i = 0; i < waveformData.length; i++) {
    const v = waveformData[i];
    const y = (1 - v) * h * 0.5;
    ctx.lineTo(i * sliceWidth, y);
  }
  ctx.lineTo(w, h / 2);
  ctx.closePath();
  ctx.fill();
  
  // Área inferior (espejo)
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  for (let i = 0; i < waveformData.length; i++) {
    const v = waveformData[i];
    const y = h / 2 + v * h * 0.5;
    ctx.lineTo(i * sliceWidth, y);
  }
  ctx.lineTo(w, h / 2);
  ctx.closePath();
  ctx.fill();
  
  // Playhead en el audio
  const video = document.getElementById('videoPlayer');
  if (video && video.currentTime && videoDuration) {
    const x = (video.currentTime / videoDuration) * w;
    // Línea vertical playhead
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 1, 0, 2, h);
  }
}

function extractVideoThumbnails(video) {
  if (isExtractingThumbnails || !video.src) return;
  isExtractingThumbnails = true;
  timelineThumbnails = [];
  
  const numThumbs = Math.max(6, Math.floor(videoDuration / 10));
  const interval = videoDuration / numThumbs;
  let capturedCount = 0;
  
  // Crear un solo video oculto para extraer miniaturas
  const hiddenVideo = document.createElement('video');
  hiddenVideo.src = video.src;
  hiddenVideo.muted = true;
  hiddenVideo.crossOrigin = 'anonymous';
  
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = 160;
  thumbCanvas.height = 90;
  const thumbCtx = thumbCanvas.getContext('2d');
  
  function captureThumbnail(index) {
    if (index >= numThumbs) {
      isExtractingThumbnails = false;
      drawTimeline();
      return;
    }
    
    hiddenVideo.onseeked = () => {
      thumbCtx.drawImage(hiddenVideo, 0, 0, 160, 90);
      // Crear una imagen desde el canvas
      const img = new Image();
      img.src = thumbCanvas.toDataURL('image/jpeg', 0.7);
      timelineThumbnails[index] = img;
      capturedCount++;
      drawTimeline();
      // Continuar con la siguiente miniatura
      captureThumbnail(index + 1);
    };
    
    hiddenVideo.currentTime = index * interval;
  }
  
  hiddenVideo.onloadedmetadata = () => {
    captureThumbnail(0);
  };
}

function drawTimeline() {
  if (!timelineCtx || !videoDuration) return;
  
  const dpr = window.devicePixelRatio || 1;
  const wrapper = timelineCanvas.parentElement;
  const displayWidth = wrapper.clientWidth;
  const displayHeight = 70;
  
  // Redimensionar canvas si es necesario
  if (timelineCanvas.width !== displayWidth * dpr || timelineCanvas.height !== displayHeight * dpr) {
    timelineCanvas.width = displayWidth * dpr;
    timelineCanvas.height = displayHeight * dpr;
    timelineCanvas.style.width = displayWidth + 'px';
    timelineCanvas.style.height = displayHeight + 'px';
    timelineCtx.setTransform(1, 0, 0, 1, 0, 0);
    timelineCtx.scale(dpr, dpr);
  }
  
  const w = displayWidth;
  const h = displayHeight;

  // Fondo
  timelineCtx.fillStyle = '#2a2a28';
  timelineCtx.fillRect(0, 0, w, h);

  // Miniaturas (si ya están cargadas)
  if (timelineThumbnails.length > 0) {
    const numThumbs = Math.max(6, Math.floor(videoDuration / 10));
    const thumbWidth = w / numThumbs;
    for (let i = 0; i < Math.min(timelineThumbnails.length, numThumbs); i++) {
      if (timelineThumbnails[i]) {
        timelineCtx.drawImage(timelineThumbnails[i], i * thumbWidth, 0, thumbWidth, h);
      }
    }
  }
  
  // Marcar zonas excluidas en rojo (solo donde NO hay cortes)
  // Primero, marcar todo el timeline en rojo
  timelineCtx.fillStyle = 'rgba(230, 57, 70, 0.3)';
  timelineCtx.fillRect(0, 0, w, h);
  
  // Dibujar zonas preservadas (cortes) - zonas sin rojo
  cuts.forEach(cut => {
    if (cut.start !== undefined && cut.end !== undefined) {
      const x1 = (cut.start / videoDuration) * w;
      const x2 = (cut.end / videoDuration) * w;
      // Fondo oscuro para la zona preservada (se ve natural con las miniaturas)
      timelineCtx.fillStyle = 'rgba(20, 20, 18, 0.5)';
      timelineCtx.fillRect(x1, 0, x2 - x1, h);
      // Bordes verdes de los cortes
      timelineCtx.fillStyle = '#a6ce39';
      timelineCtx.fillRect(x1, 0, 3, h);
      timelineCtx.fillRect(x2 - 3, 0, 3, h);
    }
  });

  // Playhead - indicador de reproducción
  const video = document.getElementById('videoPlayer');
  if (video && video.currentTime) {
    const x = (video.currentTime / videoDuration) * w;
    // Línea playhead - blanco brillante
    timelineCtx.strokeStyle = '#ffffff';
    timelineCtx.lineWidth = 2;
    timelineCtx.beginPath();
    timelineCtx.moveTo(x, 0);
    timelineCtx.lineTo(x, h);
    timelineCtx.stroke();
    // Triángulo arriba
    timelineCtx.fillStyle = '#ffffff';
    timelineCtx.beginPath();
    timelineCtx.moveTo(x - 7, 0);
    timelineCtx.lineTo(x + 7, 0);
    timelineCtx.lineTo(x, 10);
    timelineCtx.closePath();
    timelineCtx.fill();
  }
}

function onTimelineClick(e) {
  const rect = timelineCanvas.getBoundingClientRect();
  const scaleX = timelineCanvas.width / rect.width;
  const time = ((e.clientX - rect.left) * scaleX / timelineCanvas.width) * videoDuration;
  document.getElementById('videoPlayer').currentTime = time;
}

function marcarInicioCorte() {
    const video = document.getElementById('videoPlayer');
    const currentTime = video.currentTime;
    const lastCut = cuts[cuts.length - 1];

    if (lastCut && lastCut.end === undefined) {
        if (currentTime > lastCut.start) {
            lastCut.end = currentTime;
            showToast(`Fin de corte marcado en ${formatTime(currentTime)}`);
        } else {
            showToast('El fin debe ser mayor que el inicio.', 'error');
        }
    } else {
        cuts.push({ start: currentTime, end: undefined });
        showToast(`Inicio de corte marcado en ${formatTime(currentTime)}`);
    }
    actualizarListaCuts();
    drawTimeline();
}

function marcarFinCorte() {
    const video = document.getElementById('videoPlayer');
    const currentTime = video.currentTime;

    // Buscar el último corte que aún no tiene 'end'
    const openCut = cuts.find(c => c.end === undefined);

    if (openCut) {
        if (currentTime > openCut.start) {
            openCut.end = currentTime;
            showToast(`Fin de corte: ${formatTime(currentTime)}`);
        } else {
            showToast('El fin debe ser mayor que el inicio.', 'error');
            return;
        }
    } else {
        showToast('Primero marcá el inicio de un corte.', 'error');
        return;
    }

    actualizarListaCuts();
    drawTimeline();
}

function limpiarTodosCortes() {
  if (confirm('¿Eliminar todos los cortes?')) {
    cuts = [];
    drawTimeline();
    actualizarListaCuts();
  }
}

function addManualCut() {
    const currentTime = document.getElementById('videoPlayer').currentTime || 0;
    cuts.push({ start: Math.max(0, currentTime - 1), end: Math.min(videoDuration, currentTime + 1) });
    actualizarListaCuts();
    drawTimeline();
}

function actualizarListaCuts() {
    const container = document.getElementById('cutsList');
    container.innerHTML = '';
    if (cuts.length === 0) {
        container.innerHTML = '<div class="panel-empty">No hay cortes. Usá los botones de la timeline.</div>';
        return;
    }
    cuts.forEach((cut, idx) => {
        const item = document.createElement('div');
        item.className = 'cut-item';
        item.innerHTML = `
            <input type="text" class="cut-item-input" value="${formatTime(cut.start)}" data-index="${idx}" data-type="start" placeholder="00:00">
            <span class="cut-sep">→</span>
            <input type="text" class="cut-item-input" value="${cut.end ? formatTime(cut.end) : '--:--'}" data-index="${idx}" data-type="end" placeholder="00:00">
            <button class="cut-remove" data-index="${idx}">✕</button>
        `;
        container.appendChild(item);
    });
    
    // Event listeners para inputs de tiempo
    container.querySelectorAll('.cut-item-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const idx = parseInt(e.target.dataset.index);
            const type = e.target.dataset.type;
            const timeParts = e.target.value.split(':');
            
            if (timeParts.length === 2) {
                const seconds = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
                if (!isNaN(seconds) && seconds >= 0 && seconds <= videoDuration) {
                    cuts[idx][type] = seconds;
                    drawTimeline();
                } else {
                    e.target.value = formatTime(cuts[idx][type]);
                    showToast('Tiempo fuera de rango', 'error');
                }
            }
        });
    });
    
    // Event listeners para botones eliminar
    container.querySelectorAll('.cut-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.dataset.index);
            if (cuts.length > 1) {
                cuts.splice(idx, 1);
                actualizarListaCuts();
                drawTimeline();
            } else {
                showToast('Necesitás al menos un corte', 'error');
            }
        });
    });
}

async function exportVideo() {
  try {
    // Validar precondiciones
    if (!currentVideoFile) {
      showToast('Cargá un video primero', 'error');
      return;
    }

    if (!ffmpeg || !ffmpeg.isLoaded()) {
      showToast('Inicializando FFmpeg...', 'info');
      const success = await initFFmpeg();
      if (!success) {
        showToast('Error: No se pudo cargar FFmpeg', 'error');
        return;
      }
    }

    console.log('🎬 Iniciando exportación...');
    showLoading('Procesando video... (esto puede tardar 30-60 segundos)');

    // Limpiar archivos previos de FFmpeg
    if (ffmpeg.FS('readdir', '/').includes('input.mp4')) {
      ffmpeg.FS('unlink', 'input.mp4');
    }
    if (ffmpeg.FS('readdir', '/').includes('output.mp4')) {
      ffmpeg.FS('unlink', 'output.mp4');
    }

    // Cargar video en FFmpeg
    console.log('📹 Cargando video en FFmpeg...');
    const videoData = await FFmpeg.fetchFile(currentVideoFile);
    ffmpeg.FS('writeFile', 'input.mp4', videoData);
    console.log('✅ Video en FFmpeg');

    // Construir lista de segmentos a mantener (cortes)
    let segmentsToKeep = [];
    if (cuts && cuts.length > 0) {
      segmentsToKeep = cuts.sort((a, b) => a.start - b.start);
    } else {
      // Si no hay cortes, mantener video completo
      segmentsToKeep = [{ id: 1, start: 0, end: videoDuration }];
    }

    console.log(`📋 Procesando ${segmentsToKeep.length} segmento(s)`);

    // ── Cargar overlays en FFmpeg FS ──
    for (let i = 0; i < overlays.length; i++) {
      const ov = overlays[i];
      const data = await FFmpeg.fetchFile(ov.file);
      ffmpeg.FS('writeFile', `overlay_${i}.png`, data);
      console.log(`📸 Overlay ${i} cargado: ${ov.fileName}`);
    }

    // ── Generar filter complex con cortes + overlays ──
    let filterComplex = '';
    
    if (segmentsToKeep.length === 1 && segmentsToKeep[0].start === 0 && segmentsToKeep[0].end === videoDuration && overlays.length === 0) {
      // Video sin modificaciones
      console.log('✂️ Sin cortes ni overlays - exportando video original');
      filterComplex = '';
    } else {
      // Procesar cada segmento y aplicar overlays que caen dentro
      let segmentLabels = [];
      
      for (let i = 0; i < segmentsToKeep.length; i++) {
        const seg = segmentsToKeep[i];
        const segDuration = seg.end - seg.start;
        
        // Buscar overlays que caen dentro de este segmento
        const segOverlays = overlays.filter(ov => 
          ov.startTime >= seg.start && ov.startTime < seg.end
        );
        
        if (segOverlays.length === 0) {
          // Sin overlays: trim simple
          filterComplex += `[0:v]trim=start=${seg.start}:end=${seg.end},setpts=PTS-STARTPTS[v${i}];[0:a]atrim=start=${seg.start}:end=${seg.end},asetpts=PTS-STARTPTS[a${i}]`;
          segmentLabels.push(`[v${i}][a${i}]`);
        } else {
          // Con overlays: encadenar overlay filters
          let lastVideo = `[0:v]`;
          let lastAudio = `[0:a]`;
          
          for (let j = 0; j < segOverlays.length; j++) {
            const ov = segOverlays[j];
            const ovIndex = overlays.indexOf(ov);
            const relStart = ov.startTime - seg.start;
            const relEnd = relStart + ov.duration;
            
            // Primer trim del segmento
            if (j === 0) {
              filterComplex += `[0:v]trim=start=${seg.start}:end=${seg.end},setpts=PTS-STARTPTS[v${i}_base];`;
              filterComplex += `[0:a]atrim=start=${seg.start}:end=${seg.end},asetpts=PTS-STARTPTS[a${i}];`;
              lastVideo = `[v${i}_base]`;
            }
            
            // Overlay con enable temporal y opacidad
            // La opacidad se maneja con blend o alpha premultiplied
            const x = ov.x || 0;
            const y = ov.y || 0;
            const opacity = ov.opacity !== undefined ? ov.opacity : 1;
            
            // Para opacidad < 1, usamos format=yuva422p y overlay con alpha
            const fmt = opacity < 1 ? 'format=yuva422p,' : '';
            filterComplex += `${lastVideo}${fmt}overlay=${x}:${y}:enable='between(t,${relStart},${relEnd})'[v${i}_ov${j}];`;
            lastVideo = `[v${i}_ov${j}]`;
          }
          
          segmentLabels.push(`[v${i}_ov${segOverlays.length - 1}][a${i}]`);
        }
        
        if (i < segmentsToKeep.length - 1) {
          filterComplex += ';';
        }
      }
      
      // Concatenar todos los segmentos
      filterComplex += ';' + segmentLabels.join('') + 
        `concat=n=${segmentsToKeep.length}:v=1:a=1[outv][outa]`;
      
      console.log(`✂️ ${segmentsToKeep.length} corte(s), ${overlays.length} overlay(s) aplicado(s)`);
    }

    // Ejecutar FFmpeg
    console.log('⚙️ Ejecutando FFmpeg...');
    
    // Construir lista de inputs: video + un -i por cada overlay
    const overlayInputs = overlays.map((_, i) => ['-i', `overlay_${i}.png`]).flat();
    
    const ffmpegCmd = filterComplex 
      ? ['-i', 'input.mp4', ...overlayInputs, '-filter_complex', filterComplex, '-map', '[outv]', '-map', '[outa]', 'output.mp4']
      : ['-i', 'input.mp4', 'output.mp4'];

    await ffmpeg.run(...ffmpegCmd);
    
    console.log('✅ FFmpeg completado');

    // Leer output
    const data = ffmpeg.FS('readFile', 'output.mp4');
    const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
    const outputURL = URL.createObjectURL(videoBlob);

    // Mostrar preview
    const videoResult = document.getElementById('videoResult');
    const exportPreview = document.getElementById('exportVideoPreview');
    const downloadLink = document.getElementById('exportDownloadLink');

    if (videoResult && exportPreview) {
      exportPreview.src = outputURL;
      downloadLink.href = outputURL;
      downloadLink.download = `media-mendoza-${Date.now()}.mp4`;
      videoResult.style.display = 'block';
      
      console.log('✅ Video listo para descargar');
      showToast('✅ Video exportado. Descargá aquí.', 'success');
    }

    hideLoading();

  } catch (error) {
    console.error('❌ Error en exportVideo:', error);
    showToast(`❌ Error: ${error.message}`, 'error');
    hideLoading();
  }
}

function resetUploadArea() {
  currentVideoFile = null;
  currentSegments = [];
  currentWords = [];
  cuts = [];
  videoDuration = 0;
  timelineThumbnails = [];
  showSubtitles = false;

  document.getElementById('videoWrapper').style.display = 'none';
  document.getElementById('uploadArea').style.display = 'block';
  document.getElementById('timelineContainer').style.display = 'none';
  document.getElementById('cutControls').style.display = 'none';
  document.getElementById('transcriptionMini').style.display = 'none';
  document.getElementById('videoResult').style.display = 'none';
  
  const subsBtn = document.getElementById('toggleSubsBtn');
  subsBtn.classList.remove('active');
  subsBtn.disabled = true;
  document.getElementById('transcribeBtn').disabled = true;
  document.getElementById('previewBtn').disabled = true;
  document.getElementById('exportBtn').disabled = true;

  if (timelineCtx) timelineCtx.clearRect(0, 0, timelineCanvas.width, timelineCanvas.height);
  if (subtitleCtx) subtitleCtx.clearRect(0, 0, subtitleCanvas.width, subtitleCanvas.height);
  if (animationFrame) cancelAnimationFrame(animationFrame);
  
  showToast('🔄 Listo para un nuevo video.');
}


async function previewEditedVideo() {
  if (!currentVideoFile) {
    showToast('Cargá un video primero', 'error');
    return;
  }
  
  showLoading('Generando previsualización...');

  try {
    // Limpiar FFmpeg
    if (ffmpeg.FS('readdir', '/').includes('input.mp4')) ffmpeg.FS('unlink', 'input.mp4');
    if (ffmpeg.FS('readdir', '/').includes('preview.mp4')) ffmpeg.FS('unlink', 'preview.mp4');

    // Cargar video
    const videoData = await FFmpeg.fetchFile(currentVideoFile);
    ffmpeg.FS('writeFile', 'input.mp4', videoData);

    // Cargar overlays
    for (let i = 0; i < overlays.length; i++) {
      const ov = overlays[i];
      const data = await FFmpeg.fetchFile(ov.file);
      ffmpeg.FS('writeFile', `overlay_${i}.png`, data);
    }

    // Tomar el primer segmento de corte para preview (max 30 segundos)
    const sortedCuts = cuts.sort((a, b) => a.start - b.start);
    const firstCut = sortedCuts.length > 0 
      ? { start: sortedCuts[0].start, end: Math.min(sortedCuts[0].start + 30, sortedCuts[0].end) }
      : { start: 0, end: Math.min(30, videoDuration) };

    // Buscar overlays dentro del preview window
    const previewOverlays = overlays.filter(ov => ov.startTime >= firstCut.start && ov.startTime < firstCut.end);
    
    let filterComplex = '';
    let overlayInputs = previewOverlays.map((_, i) => ['-i', `overlay_${overlays.indexOf(previewOverlays[i])}.png`]).flat();

    if (previewOverlays.length === 0) {
      // Solo cortes sin overlays
      filterComplex = `[0:v]trim=start=${firstCut.start}:end=${firstCut.end},setpts=PTS-STARTPTS[pv];[0:a]atrim=start=${firstCut.start}:end=${firstCut.end},asetpts=PTS-STARTPTS[pa];[pv][pa]concat=n=1:v=1:a=1[outv][outa]`;
    } else {
      // Cortes + overlays
      let lastVideo = `[0:v]trim=start=${firstCut.start}:end=${firstCut.end},setpts=PTS-STARTPTS[pv_base];`;
      lastVideo += `[0:a]atrim=start=${firstCut.start}:end=${firstCut.end},asetpts=PTS-STARTPTS[pa];`;
      
      previewOverlays.forEach((ov, j) => {
        const relStart = ov.startTime - firstCut.start;
        const relEnd = relStart + ov.duration;
        const x = ov.x || 0;
        const y = ov.y || 0;
        const fmt = ov.opacity < 1 ? 'format=yuva422p,' : '';
        lastVideo += `${lastVideo === '' ? '' : lastVideo}overlay_${j}=${x}:${y}:enable='between(t,${relStart},${relEnd})'[pv_ov${j}];`;
      });

      const lastOv = previewOverlays.length - 1;
      filterComplex = lastVideo + `[pv_ov${lastOv}][pa]concat=n=1:v=1:a=1[outv][outa]`;
    }

    const ffmpegCmd = ['-i', 'input.mp4', ...overlayInputs, '-filter_complex', filterComplex, '-map', '[outv]', '-map', '[outa]', '-t', String(firstCut.end - firstCut.start), 'preview.mp4'];

    await ffmpeg.run(...ffmpegCmd);

    const data = ffmpeg.FS('readFile', 'preview.mp4');
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);

    const videoResult = document.getElementById('videoResult');
    const preview = document.getElementById('exportVideoPreview');
    const downloadLink = document.getElementById('exportDownloadLink');

    if (videoResult && preview) {
      preview.src = url;
      downloadLink.href = url;
      downloadLink.download = `preview-media-mendoza.mp4`;
      videoResult.style.display = 'block';
      showToast(`✅ Preview: segundos ${formatTime(firstCut.start)} a ${formatTime(firstCut.end)}`);
    }

    hideLoading();

  } catch (error) {
    console.error('❌ Error en preview:', error);
    showToast(`❌ Preview: ${error.message}`, 'error');
    hideLoading();
  }
}
function formatTime(s) { return new Date(s * 1000).toISOString().substr(14, 5); }
function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `mm-toast show ${type}`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function showLoading(text = 'Procesando...') {
  const overlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  if (overlay) {
    if (loadingText) loadingText.textContent = text;
    overlay.style.display = 'flex';
  }
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.style.display = 'none';
}

function toggleTranscriptionMini(){
    const content = document.getElementById('transcriptionMiniContent');
    content.classList.toggle('open');
    document.getElementById('transcriptionToggleIcon').textContent = content.classList.contains('open') ? '▼' : '▶';
}

function confirmAddOverlay() {
  if (!tempOverlayFile) {
    showToast('Seleccioná un archivo primero.', 'error');
    return;
  }

  const startTime = parseFloat(document.getElementById('overlayStartTime').value || 0);
  const duration = parseFloat(document.getElementById('overlayDuration').value || 3);
  const opacity = parseInt(document.getElementById('overlayOpacity').value || 80);

  if (startTime < 0 || duration <= 0) {
    showToast('Valores inválidos. Inicio >= 0, Duración > 0.', 'error');
    return;
  }

  if (startTime + duration > videoDuration) {
    showToast(`El overlay no cabe en el video. Duración total: ${formatTime(videoDuration)}`, 'error');
    return;
  }

  const overlayType = tempOverlayFile.type.startsWith('video/') ? 'video' : 'image';
  
  const newOverlay = {
    id: nextOverlayId++,
    type: overlayType,
    file: tempOverlayFile,
    fileName: tempOverlayFile.name,
    startTime: startTime,
    duration: duration,
    opacity: opacity / 100,  // Convertir a decimal (0-1)
    x: 0,
    y: 0,
    scale: 1
  };

  overlays.push(newOverlay);
  tempOverlayFile = null;

  // Limpiar inputs
  document.getElementById('overlayInput').value = '';
  const propsDiv = document.getElementById('overlayProperties');
  if (propsDiv) propsDiv.style.display = 'none';

  renderOverlaysList();
  drawTimeline(); // Redibujar timeline para mostrar overlays
  showToast(`✅ Overlay agregado: ${newOverlay.fileName} (${overlayType.toUpperCase()})`);
}

function updateOverlaysList() {
  const container = document.getElementById('overlaysList');
  if (!container) return;

  if (overlays.length === 0) {
    container.innerHTML = '<p class="text-muted" style="font-size:11px; text-align:center;">No hay overlays. Agregá fotos o videos.</p>';
    return;
  }

  container.innerHTML = '';
  overlays.forEach(overlay => {
    const item = document.createElement('div');
    item.className = 'overlay-item';
    item.innerHTML = `
      <div class="overlay-item-info">
        <div class="overlay-item-type">${overlay.type.toUpperCase()}</div>
        <div>${overlay.fileName}</div>
        <div class="overlay-item-time">${overlay.startTime}s - ${(overlay.startTime + overlay.duration)}s · ${(overlay.opacity)}%</div>
      </div>
      <button class="overlay-remove" onclick="removeOverlay(${overlay.id})">🗑️</button>
    `;
    container.appendChild(item);
  });
}

function removeOverlay(id) {
  const idx = overlays.findIndex(o => o.id === id);
  if (idx >= 0) {
    const removed = overlays.splice(idx, 1)[0];
    renderOverlaysList();
    drawTimeline();
    showToast(`🗑️ Overlay eliminado: ${removed.fileName}`);
  }
}

function renderOverlaysList() {
  const container = document.getElementById('overlaysList');
  if (!container) return;

  container.innerHTML = '';

  if (overlays.length === 0) {
    container.innerHTML = '<p class="text-muted" style="font-size:11px; text-align:center;">No hay overlays.</p>';
    return;
  }

  overlays.forEach((overlay) => {
    const overlayDiv = document.createElement('div');
    overlayDiv.className = 'overlay-item';
    
    const typeIcon = overlay.type === 'video' ? '🎬' : '📸';
    const typeLabel = overlay.type === 'video' ? 'VIDEO' : 'IMAGEN';
    
    overlayDiv.innerHTML = `
      <div class="overlay-item-info">
        <div class="overlay-item-type">${typeIcon} ${typeLabel}</div>
        <div class="overlay-item-time">${formatTime(overlay.startTime)} → ${formatTime(overlay.startTime + overlay.duration)}</div>
        <div style="font-size:9px; color:var(--dim); margin-top:2px;">${overlay.fileName}</div>
        <div style="font-size:9px; color:var(--dim);">Opacidad: ${Math.round(overlay.opacity * 100)}%</div>
      </div>
      <button class="overlay-remove" data-id="${overlay.id}">✕</button>
    `;

    // Event listener para botón eliminar
    overlayDiv.querySelector('.overlay-remove').addEventListener('click', (e) => {
      e.preventDefault();
      removeOverlay(parseInt(e.target.dataset.id));
    });

    container.appendChild(overlayDiv);
  });
}
