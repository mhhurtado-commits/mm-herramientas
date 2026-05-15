// ============================================================
// Media Studio — Transcripción y Proyectos v3
// Con integración con Reels (enviar/recibir audio y subtítulos)
// ============================================================

const WORKER = 'https://mm-herramientas-worker.mhhurtado.workers.dev';

let currentTranscription = {
  texto: '',
  segments: [],
  words: [],
  proyectoId: null
};

let mediaRecorder = null;
let audioChunks = [];
let recordingTimer = null;
let recordingSeconds = 0;

// ============================================================
// UTILIDADES
// ============================================================

function toast(m) {
  const t = document.getElementById('toast');
  t.textContent = m;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function showLoading(text) {
  document.getElementById('loadingText').textContent = text || 'Procesando...';
  document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('active');
}

function updateCharCount() {
  const text = document.getElementById('transcriptionText').innerText;
  document.getElementById('charCount').textContent = text.length + ' caracteres';
}

// ============================================================
// FORMATO DE TIEMPOS
// ============================================================

function formatTimestampLocal(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

function formatTimestampLocalSRT(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

function parseTimestampToSeconds(timestamp) {
  const match = timestamp.match(/(\d{2,3}):(\d{2}):(\d{2})[.,](\d{3})/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = parseInt(match[3], 10);
    const ms = parseInt(match[4], 10);
    return hours * 3600 + minutes * 60 + seconds + ms / 1000;
  }
  return 0;
}

// ============================================================
// TRANSCRIPCIÓN (Cloudflare Whisper)
// ============================================================

async function transcribirAudio(file) {
  showLoading('Transcribiendo audio con IA...');

  try {
    const arrayBuffer = await file.arrayBuffer();
    const formData = new FormData();
    
    let mimeType = file.type;
    if (!mimeType || mimeType === '') {
      if (file.name.endsWith('.mp3')) mimeType = 'audio/mpeg';
      else if (file.name.endsWith('.wav')) mimeType = 'audio/wav';
      else if (file.name.endsWith('.webm')) mimeType = 'audio/webm';
      else mimeType = 'audio/mpeg';
    }
    
    const audioBlob = new Blob([arrayBuffer], { type: mimeType });
    formData.append('audio', audioBlob, file.name || 'audio.mp3');

    const res = await fetch(WORKER + '/studio/transcribir', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    currentTranscription = {
      texto: data.texto || '',
      segments: data.segments || [],
      words: data.words || [],
      proyectoId: null
    };

    const textarea = document.getElementById('transcriptionText');
    textarea.innerText = data.texto || '(sin texto reconocido)';
    updateCharCount();

    document.getElementById('transcriptionResult').style.display = 'block';
    document.getElementById('transcriptionStatus').style.display = 'none';

    toast(`✅ Transcripción: ${data.word_count || 0} palabras`);
    return data;
  } catch (err) {
    console.error('Error:', err);
    toast('✗ Error: ' + err.message);
    document.getElementById('transcriptionStatus').style.display = 'none';
    throw err;
  } finally {
    hideLoading();
  }
}

// ============================================================
// SUBIR ARCHIVO
// ============================================================

function setupFileUpload() {
  const uploadArea = document.getElementById('uploadArea');
  const audioInput = document.getElementById('audioInput');

  uploadArea.onclick = () => audioInput.click();
  audioInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast('⚠ El archivo es muy grande. Máximo 10MB');
      return;
    }

    document.getElementById('transcriptionStatus').style.display = 'block';
    transcribirAudio(file);
  };

  uploadArea.ondragover = (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--v)';
  };
  uploadArea.ondragleave = () => {
    uploadArea.style.borderColor = '';
  };
  uploadArea.ondrop = async (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      if (file.size > 10 * 1024 * 1024) {
        toast('⚠ Archivo muy grande. Máximo 10MB');
        return;
      }
      document.getElementById('transcriptionStatus').style.display = 'block';
      await transcribirAudio(file);
    } else {
      toast('⚠ Soltá un archivo de audio válido');
    }
  };
}

// ============================================================
// GRABACIÓN CON MICRÓFONO
// ============================================================

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const file = new File([audioBlob], 'grabacion.webm', { type: 'audio/webm' });
      stream.getTracks().forEach(track => track.stop());
      
      document.getElementById('recordingArea').classList.remove('active');
      document.getElementById('transcriptionStatus').style.display = 'block';
      
      await transcribirAudio(file);
    };
    
    mediaRecorder.start(1000);
    
    recordingSeconds = 0;
    if (recordingTimer) clearInterval(recordingTimer);
    recordingTimer = setInterval(() => {
      recordingSeconds++;
      const minutes = Math.floor(recordingSeconds / 60);
      const seconds = recordingSeconds % 60;
      document.getElementById('recordingTimer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
    
    document.getElementById('recordingArea').classList.add('active');
    toast('🎙 Grabando... hablá con claridad');
    
  } catch (err) {
    console.error('Error al acceder al micrófono:', err);
    toast('✗ No se pudo acceder al micrófono. Verificá los permisos.');
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    clearInterval(recordingTimer);
  }
}

// ============================================================
// ACCIONES
// ============================================================

function copiarTexto() {
  const texto = document.getElementById('transcriptionText').innerText;
  if (!texto) {
    toast('⚠ No hay texto para copiar');
    return;
  }
  navigator.clipboard.writeText(texto);
  toast('✓ Texto copiado');
}

async function crearNotaPeriodistica() {
  const texto = document.getElementById('transcriptionText').innerText;
  if (!texto || texto === '(sin texto reconocido)') {
    toast('⚠ Primero transcribí un audio');
    return;
  }

  showLoading('Generando nota periodística...');

  try {
    const res = await fetch(WORKER + '/reformular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: 'Nota desde transcripción',
        contenido: texto,
        contexto: 'Esta es una transcripción de audio convertida en nota periodística para Media Mendoza.',
        estilo: 'formal'
      })
    });

    const data = await res.json();
    
    if (!data.ok) throw new Error(data.error);

    window.open('https://mediamendoza.pages.dev/redaccion/', '_blank');
    toast('✓ Nota generada. Se abrirá en Redacción');
    
  } catch (err) {
    toast('✗ Error: ' + err.message);
  } finally {
    hideLoading();
  }
}

async function guardarProyecto() {
  const texto = document.getElementById('transcriptionText').innerText;
  if (!texto || texto === '(sin texto reconocido)') {
    toast('⚠ No hay transcripción para guardar');
    return;
  }

  const titulo = prompt('Nombre del proyecto:', 'Transcripción ' + new Date().toLocaleString());
  if (!titulo) return;

  const id = currentTranscription.proyectoId || 'proy_' + Date.now();

  showLoading('Guardando proyecto...');

  try {
    const res = await fetch(WORKER + '/studio/proyecto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: id,
        titulo: titulo,
        transcripcion: texto,
        segments: currentTranscription.segments,
        createdAt: currentTranscription.createdAt || Date.now()
      })
    });

    const data = await res.json();
    
    if (!data.ok) throw new Error(data.error);

    currentTranscription.proyectoId = id;
    toast('✓ Proyecto guardado');
    
    if (document.getElementById('tab-proyectos').style.display !== 'none') {
      cargarProyectos();
    }
  } catch (err) {
    toast('✗ Error: ' + err.message);
  } finally {
    hideLoading();
  }
}

async function descargarVTT() {
  if (!currentTranscription.segments || !currentTranscription.segments.length) {
    toast('⚠ No hay segmentos para generar subtítulos');
    return;
  }

  showLoading('Generando subtítulos VTT...');

  try {
    let vtt = "WEBVTT\n\n";
    
    currentTranscription.segments.forEach((seg, i) => {
      const start = formatTimestampLocal(seg.start);
      const end = formatTimestampLocal(seg.end);
      vtt += `${i + 1}\n${start} --> ${end}\n${seg.text.trim()}\n\n`;
    });
    
    const blob = new Blob([vtt], { type: 'text/vtt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitulos.vtt';
    a.click();
    URL.revokeObjectURL(url);

    toast('✓ Subtítulos VTT descargados');
  } catch (err) {
    toast('✗ Error: ' + err.message);
  } finally {
    hideLoading();
  }
}

async function descargarSRT() {
  if (!currentTranscription.segments || !currentTranscription.segments.length) {
    toast('⚠ No hay segmentos para generar subtítulos');
    return;
  }

  showLoading('Generando subtítulos SRT...');

  try {
    let srt = "";
    
    currentTranscription.segments.forEach((seg, i) => {
      const start = formatTimestampLocalSRT(seg.start);
      const end = formatTimestampLocalSRT(seg.end);
      srt += `${i + 1}\n${start} --> ${end}\n${seg.text.trim()}\n\n`;
    });
    
    const blob = new Blob([srt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitulos.srt';
    a.click();
    URL.revokeObjectURL(url);

    toast('✓ Subtítulos SRT descargados');
  } catch (err) {
    toast('✗ Error: ' + err.message);
  } finally {
    hideLoading();
  }
}

// ============================================================
// EDITOR DE SEGMENTOS
// ============================================================

function mostrarEditorSegmentos() {
  if (!currentTranscription.segments || !currentTranscription.segments.length) {
    toast('⚠ No hay segmentos para editar');
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'mm-modal-overlay open';
  modal.style.display = 'flex';
  
  let html = `
    <div class="mm-modal" style="max-width: 800px; max-height: 80vh;">
      <div class="mm-modal-header">
        <span class="mm-modal-title">✏ Editar segmentos de subtítulos</span>
        <button class="mm-modal-close" onclick="this.closest('.mm-modal-overlay').remove()">✕</button>
      </div>
      <div class="mm-modal-body" style="overflow-y: auto;">
        <div style="margin-bottom: 12px; font-size: 11px; color: var(--dim);">
          Podés ajustar los tiempos y el texto de cada segmento.
        </div>
  `;
  
  currentTranscription.segments.forEach((seg, idx) => {
    const startFormatted = formatTimestampLocal(seg.start);
    const endFormatted = formatTimestampLocal(seg.end);
    html += `
      <div class="segment-editor" data-idx="${idx}" style="background: var(--surface2); border: 1px solid var(--line); border-radius: var(--radius); padding: 12px; margin-bottom: 12px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
          <div>
            <label style="font-size: 9px; color: var(--dim);">Inicio</label>
            <input type="text" class="mm-input seg-start" value="${startFormatted}" placeholder="00:00:00.000">
          </div>
          <div>
            <label style="font-size: 9px; color: var(--dim);">Fin</label>
            <input type="text" class="mm-input seg-end" value="${endFormatted}" placeholder="00:00:00.000">
          </div>
        </div>
        <div>
          <label style="font-size: 9px; color: var(--dim);">Texto</label>
          <textarea class="mm-textarea seg-text" rows="2" style="resize: vertical;">${esc(seg.text)}</textarea>
        </div>
      </div>
    `;
  });
  
  html += `
      </div>
      <div class="mm-modal-footer">
        <button class="mm-btn mm-btn-primary" id="guardarSegmentosBtn">💾 Guardar cambios</button>
        <button class="mm-btn" onclick="this.closest('.mm-modal-overlay').remove()">Cancelar</button>
      </div>
    </div>
  `;
  
  modal.innerHTML = html;
  document.body.appendChild(modal);
  
  document.getElementById('guardarSegmentosBtn').onclick = () => {
    const nuevosSegmentos = [];
    document.querySelectorAll('.segment-editor').forEach(editor => {
      const startStr = editor.querySelector('.seg-start').value;
      const endStr = editor.querySelector('.seg-end').value;
      const text = editor.querySelector('.seg-text').value;
      
      const start = parseTimestampToSeconds(startStr);
      const end = parseTimestampToSeconds(endStr);
      
      if (!isNaN(start) && !isNaN(end) && text.trim()) {
        nuevosSegmentos.push({ start, end, text: text.trim() });
      }
    });
    
    if (nuevosSegmentos.length) {
      currentTranscription.segments = nuevosSegmentos;
      toast('✓ Segmentos actualizados');
      modal.remove();
    } else {
      toast('⚠ No hay segmentos válidos');
    }
  };
}

// ============================================================
// ENVIAR SUBTÍTULOS A REELS
// ============================================================

async function enviarSubtitulosAReels() {
  if (!currentTranscription.segments || !currentTranscription.segments.length) {
    toast('⚠ No hay subtítulos para enviar');
    return;
  }

  showLoading('Preparando subtítulos para Reels...');

  try {
    let vtt = "WEBVTT\n\n";
    currentTranscription.segments.forEach((seg, i) => {
      const start = formatTimestampLocal(seg.start);
      const end = formatTimestampLocal(seg.end);
      vtt += `${i + 1}\n${start} --> ${end}\n${seg.text.trim()}\n\n`;
    });
    
    sessionStorage.setItem('studio_subtitulos_generados', JSON.stringify({
      vtt: vtt,
      segments: currentTranscription.segments,
      texto: currentTranscription.texto,
      timestamp: Date.now()
    }));
    
    window.open('https://mediamendoza.pages.dev/social/', '_blank');
    toast('✓ Subtítulos enviados. En Reels, hacé clic en "Aplicar subtítulos desde Studio"');
    
  } catch (err) {
    toast('✗ Error: ' + err.message);
  } finally {
    hideLoading();
  }
}

// ============================================================
// RECIBIR AUDIO DESDE REELS
// ============================================================

function checkForReelAudio() {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  
  if (mode === 'subtitulos') {
    const datos = sessionStorage.getItem('reel_audio_para_studio');
    if (datos) {
      try {
        const audioData = JSON.parse(datos);
        mostrarPanelRecepcion(audioData);
        sessionStorage.removeItem('reel_audio_para_studio');
      } catch (e) {
        console.error('Error cargando datos:', e);
      }
    }
  }
}

function mostrarPanelRecepcion(audioData) {
  const panel = document.getElementById('receivePanel');
  const tituloEl = document.getElementById('receiveTitulo');
  const guionEl = document.getElementById('receiveGuion');
  const audioEl = document.getElementById('receiveAudio');
  
  tituloEl.textContent = audioData.titulo || 'Sin título';
  guionEl.textContent = audioData.guion || 'Sin guion';
  
  if (audioData.audioUrl && audioData.audioUrl.startsWith('blob:')) {
    audioEl.src = audioData.audioUrl;
  } else if (audioData.audioUrl) {
    audioEl.src = audioData.audioUrl;
  }
  
  panel.classList.add('show');
  
  document.getElementById('btnTranscribirRecibido').onclick = async () => {
    if (!audioEl.src) {
      toast('⚠ No hay audio para transcribir');
      return;
    }
    
    try {
      const response = await fetch(audioEl.src);
      const audioBlob = await response.blob();
      const file = new File([audioBlob], 'audio_desde_reel.webm', { type: 'audio/webm' });
      
      await transcribirAudio(file);
      
      if (audioData.guion && audioData.guion.trim()) {
        const textarea = document.getElementById('transcriptionText');
        const transcripcionActual = textarea.innerText;
        textarea.innerText = audioData.guion + '\n\n--- TRANSCRIPCIÓN AUTOMÁTICA ---\n\n' + transcripcionActual;
        updateCharCount();
      }
      
      toast('✅ Transcripción completada. Revisá los subtítulos y ajustá si es necesario.');
    } catch (err) {
      toast('✗ Error al transcribir: ' + err.message);
    }
  };
}

// ============================================================
// PROYECTOS
// ============================================================

async function cargarProyectos() {
  const container = document.getElementById('proyectosList');
  container.innerHTML = '<div class="text-muted" style="text-align: center; padding: 40px;">Cargando...</div>';

  try {
    const res = await fetch(WORKER + '/studio/proyectos');
    const data = await res.json();

    if (!data.ok) throw new Error(data.error);

    if (!data.proyectos || !data.proyectos.length) {
      container.innerHTML = '<div class="text-muted" style="text-align: center; padding: 40px;">No hay proyectos guardados.<br>Subí y transcribí un audio para crear uno.</div>';
      return;
    }

    container.innerHTML = '';
    data.proyectos.forEach(proy => {
      const fecha = new Date(proy.createdAt).toLocaleString('es-AR');
      const preview = proy.transcripcion.substring(0, 100) + (proy.transcripcion.length > 100 ? '...' : '');
      
      const div = document.createElement('div');
      div.className = 'proyecto-item';
      div.innerHTML = `
        <div class="proyecto-info">
          <div class="proyecto-titulo">${esc(proy.titulo)}</div>
          <div class="proyecto-preview">${esc(preview)}</div>
          <div class="proyecto-fecha">${fecha} · ${proy.transcripcion.length} caracteres</div>
        </div>
        <div class="proyecto-actions">
          <button class="mm-btn mm-btn-sm" data-id="${proy.id}" data-action="cargar">Cargar</button>
          <button class="mm-btn mm-btn-sm mm-btn-danger" data-id="${proy.id}" data-action="eliminar">✕</button>
        </div>
      `;
      container.appendChild(div);
    });

    container.querySelectorAll('[data-action="cargar"]').forEach(btn => {
      btn.onclick = () => cargarProyecto(btn.dataset.id);
    });
    container.querySelectorAll('[data-action="eliminar"]').forEach(btn => {
      btn.onclick = () => eliminarProyecto(btn.dataset.id);
    });

  } catch (err) {
    container.innerHTML = '<div class="text-muted" style="text-align: center; padding: 40px;">Error cargando proyectos</div>';
    toast('✗ Error cargando proyectos');
  }
}

async function cargarProyecto(id) {
  showLoading('Cargando proyecto...');
  
  try {
    const res = await fetch(WORKER + '/studio/proyectos');
    const data = await res.json();
    const proyecto = data.proyectos?.find(p => p.id === id);
    
    if (!proyecto) throw new Error('Proyecto no encontrado');

    currentTranscription = {
      texto: proyecto.transcripcion,
      segments: proyecto.segments || [],
      words: [],
      proyectoId: proyecto.id,
      createdAt: proyecto.createdAt
    };

    document.getElementById('transcriptionText').innerText = proyecto.transcripcion;
    updateCharCount();
    document.getElementById('transcriptionResult').style.display = 'block';

    document.querySelector('.studio-tab[data-tab="transcripcion"]').click();

    toast('✓ Proyecto cargado');
  } catch (err) {
    toast('✗ Error cargando proyecto');
  } finally {
    hideLoading();
  }
}

async function eliminarProyecto(id) {
  if (!confirm('¿Eliminar este proyecto permanentemente?')) return;

  showLoading('Eliminando...');

  try {
    const res = await fetch(WORKER + '/studio/proyecto?id=' + encodeURIComponent(id), {
      method: 'DELETE'
    });
    const data = await res.json();
    
    if (!data.ok) throw new Error(data.error);

    cargarProyectos();
    toast('✓ Proyecto eliminado');
  } catch (err) {
    toast('✗ Error eliminando');
  } finally {
    hideLoading();
  }
}

// ============================================================
// TABS
// ============================================================

function setupTabs() {
  document.querySelectorAll('.studio-tab').forEach(tab => {
    tab.onclick = () => {
      const target = tab.dataset.tab;
      
      document.querySelectorAll('.studio-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      document.getElementById('tab-transcripcion').style.display = target === 'transcripcion' ? 'block' : 'none';
      document.getElementById('tab-proyectos').style.display = target === 'proyectos' ? 'block' : 'none';
      
      if (target === 'proyectos') {
        cargarProyectos();
      }
    };
  });
}

// ============================================================
// TEMA CLARO/OSCURO
// ============================================================

function setTheme(theme) {
  const body = document.body;
  if (theme === 'dark') {
    body.classList.add('dark-theme');
    document.getElementById('themeIcon').textContent = '☀️';
    document.getElementById('themeLabel').textContent = 'Modo claro';
  } else {
    body.classList.remove('dark-theme');
    document.getElementById('themeIcon').textContent = '🌙';
    document.getElementById('themeLabel').textContent = 'Modo oscuro';
  }
  localStorage.setItem('mm-theme', theme);
}

function toggleTheme() {
  const isDark = document.body.classList.contains('dark-theme');
  setTheme(isDark ? 'light' : 'dark');
}

// ============================================================
// INICIALIZACIÓN
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  setupFileUpload();
  setupTabs();
  
  document.getElementById('uploadBtn').onclick = () => document.getElementById('audioInput').click();
  document.getElementById('micBtn').onclick = startRecording;
  document.getElementById('stopRecordingBtn').onclick = stopRecording;
  document.getElementById('copiarTextoBtn').onclick = copiarTexto;
  document.getElementById('crearNotaBtn').onclick = crearNotaPeriodistica;
  document.getElementById('guardarProyectoBtn').onclick = guardarProyecto;
  document.getElementById('descargarVTTBtn').onclick = descargarVTT;
  document.getElementById('descargarSRTBtn').onclick = descargarSRT;
  document.getElementById('editarSegmentosBtn').onclick = mostrarEditorSegmentos;
  document.getElementById('enviarSubtitulosBtn').onclick = enviarSubtitulosAReels;
  
  document.getElementById('transcriptionText').addEventListener('input', updateCharCount);
  
  // Verificar si hay audio pendiente desde Reels
  checkForReelAudio();
  
  const savedTheme = localStorage.getItem('mm-theme');
  savedTheme === 'dark' ? setTheme('dark') : setTheme('light');
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
});