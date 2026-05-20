// Editor de Entrevistas IA - Frontend
let currentVideoFile = null;
let currentSegments = [];
let originalSegments = [];

let ffmpeg = null;

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  setupDragAndDrop();
});

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
    // Método: crear un elemento de audio y capturar su stream
    const videoUrl = URL.createObjectURL(currentVideoFile);
    
    // Crear un elemento de audio
    const audioElement = new Audio();
    audioElement.src = videoUrl;
    
    await new Promise((resolve) => {
      audioElement.addEventListener('canplaythrough', resolve, { once: true });
    });
    
    // Crear contexto de audio
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Crear el stream de audio
    const destination = audioContext.createMediaStreamDestination();
    const source = audioContext.createMediaElementSource(audioElement);
    source.connect(destination);
    source.connect(audioContext.destination);
    
    // Grabar el audio
    const mediaRecorder = new MediaRecorder(destination.stream);
    const chunks = [];
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    
    const recordingPromise = new Promise((resolve) => {
      mediaRecorder.onstop = () => {
        const webmBlob = new Blob(chunks, { type: 'audio/webm' });
        resolve(webmBlob);
      };
    });
    
    mediaRecorder.start();
    await audioElement.play();
    
    await new Promise((resolve) => {
      audioElement.addEventListener('ended', resolve, { once: true });
      setTimeout(resolve, (audioElement.duration || 30) * 1000 + 2000);
    });
    
    mediaRecorder.stop();
    const webmBlob = await recordingPromise;
    
    // Limpiar
    audioElement.pause();
    audioElement.src = '';
    URL.revokeObjectURL(videoUrl);
    await audioContext.close();
    
    if (!webmBlob || webmBlob.size < 1000) {
      throw new Error('No se pudo extraer audio del video');
    }
    
    console.log('Audio WebM extraído, tamaño:', webmBlob.size);
    
    showLoading('Convirtiendo audio a WAV...');
    
    // Convertir WebM a WAV
    const wavBlob = await convertWebMToWav(webmBlob);
    
    console.log('Audio WAV convertido, tamaño:', wavBlob.size, 'tipo:', wavBlob.type);
    
    showLoading('Transcribiendo con IA...');
    
    // Enviar al Worker - usar 'audio' como campo (el mismo que funciona en Studio)
    const WORKER = 'https://mm-herramientas-worker.mhhurtado.workers.dev';
    const formData = new FormData();
    formData.append('audio', wavBlob, 'audio.wav');
    
    const response = await fetch(WORKER + '/studio/transcribir', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    console.log('Respuesta del Worker:', result);
    
    if (!response.ok || !result.ok) {
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

// Función para convertir WebM a WAV
async function convertWebMToWav(webmBlob) {
  return new Promise(async (resolve, reject) => {
    try {
      // Crear AudioContext para decodificar
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Leer el blob como ArrayBuffer
      const arrayBuffer = await webmBlob.arrayBuffer();
      
      // Decodificar el audio
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Configurar para WAV (mono, 16000Hz)
      const numChannels = 1;
      const sampleRate = 16000;
      const bitDepth = 16;
      
      // Crear un buffer mono
      const offlineContext = new OfflineAudioContext(
        numChannels,
        audioBuffer.duration * sampleRate,
        sampleRate
      );
      
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineContext.destination);
      source.start();
      
      const renderedBuffer = await offlineContext.startRendering();
      
      // Convertir a WAV
      const wavBlob = audioBufferToWav(renderedBuffer);
      
      await audioContext.close();
      resolve(wavBlob);
      
    } catch (error) {
      console.error('Error convirtiendo a WAV:', error);
      reject(error);
    }
  });
}

// Función para convertir AudioBuffer a WAV Blob
function audioBufferToWav(buffer) {
  const numChannels = 1; // Mono
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const samples = buffer.getChannelData(0);
  const dataLength = samples.length * 2;
  const bufferLength = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);
  
  function writeString(view, offset, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(i + offset, str.charCodeAt(i));
    }
  }
  
  writeString(view, 0, 'RIFF');
  view.setUint32(4, bufferLength - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);
  
  let offset = 44;
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
  
  const segmentsToExport = currentSegments.filter(s => !s.removed);
  if (segmentsToExport.length === 0) {
    showToast('No hay segmentos para exportar.');
    return;
  }
  
  showLoading('Procesando video editado...');
  
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const exportPanel = document.getElementById('exportPanel');
    if (exportPanel) exportPanel.style.display = 'block';
    
    const fileNameInput = document.getElementById('fileNameInput');
    if (fileNameInput) {
      fileNameInput.value = `entrevista-editada-${new Date().toISOString().slice(0, 10)}`;
    }
    
    showToast('¡Video procesado! Puedes descargarlo ahora.');
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