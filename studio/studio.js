// ============================================================
// Media Studio — Transcripción y Proyectos
// ============================================================

const WORKER = 'https://mm-herramientas-worker.mhhurtado.workers.dev';

let currentTranscription = {
  texto: '',
  segments: [],
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
// TRANSCRIPCIÓN
// ============================================================

async function transcribirAudio(audioBlob, fileName = 'audio.mp3') {
  const formData = new FormData();
  
  // Asegurar que el blob tenga el tipo MIME correcto
  let mimeType = audioBlob.type;
  if (!mimeType || mimeType === '') {
    mimeType = 'audio/mpeg'; // default para MP3
  }
  
  // Crear un nuevo blob con el tipo MIME correcto
  const correctedBlob = new Blob([audioBlob], { type: mimeType });
  formData.append('audio', correctedBlob, fileName);

  showLoading('Transcribiendo audio con IA...');

  try {
    const res = await fetch(WORKER + '/studio/transcribir', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Respuesta error:', errorText);
      throw new Error(`HTTP ${res.status}: ${errorText.substring(0, 100)}`);
    }

    const data = await res.json();

    if (!data.ok) {
      throw new Error(data.error || 'Error en transcripción');
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

    if (data.words && data.words.length) {
      console.log(`✅ ${data.words.length} palabras con timestamps`);
      toast(`✅ ${data.word_count || data.words.length} palabras transcritas`);
    } else {
      toast('✅ Transcripción completada');
    }

    document.getElementById('transcriptionResult').style.display = 'block';
    document.getElementById('transcriptionStatus').style.display = 'none';

    return data;
  } catch (err) {
    console.error('Error detallado:', err);
    toast('✗ Error: ' + err.message);
    document.getElementById('transcriptionStatus').style.display = 'none';
    
    // Mostrar error en el área de transcripción para debug
    const textarea = document.getElementById('transcriptionText');
    textarea.innerText = `Error: ${err.message}\n\nVerificá que el Worker esté actualizado y el binding AI configurado.`;
    document.getElementById('transcriptionResult').style.display = 'block';
    
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
    transcribirAudio(file, file.name);
  };

  // Drag & drop
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
      await transcribirAudio(file, file.name);
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
      audioChunks.push(event.data);
    };
    
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      stream.getTracks().forEach(track => track.stop());
      
      document.getElementById('recordingArea').classList.remove('active');
      document.getElementById('transcriptionStatus').style.display = 'block';
      
      await transcribirAudio(audioBlob, 'grabacion.webm');
    };
    
    mediaRecorder.start(1000);
    
    recordingSeconds = 0;
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
    
    if (!data.ok) {
      throw new Error(data.error || 'Error generando nota');
    }

    // Abrir en nueva pestaña con la nota generada
    const nuevaVentana = window.open('https://mediamendoza.pages.dev/redaccion/', '_blank');
    
    // Esperar un poco y enviar la nota por postMessage
    setTimeout(() => {
      nuevaVentana.postMessage({
        type: 'NOTA_DESDE_STUDIO',
        data: {
          titular: data.titular,
          cuerpo: data.cuerpo,
          categoria: data.categoria_sugerida
        }
      }, '*');
    }, 2000);

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
    
    // Recargar lista de proyectos si está visible
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
    toast('⚠ No hay segmentos de tiempo para generar subtítulos');
    return;
  }

  showLoading('Generando subtítulos...');

  try {
    const res = await fetch(WORKER + '/studio/generar-vtt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ segments: currentTranscription.segments })
    });

    if (!res.ok) throw new Error('Error generando VTT');

    const vttText = await res.text();
    const blob = new Blob([vttText], { type: 'text/vtt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitulos.vtt';
    a.click();
    URL.revokeObjectURL(url);

    toast('✓ Subtítulos descargados');
  } catch (err) {
    toast('✗ Error: ' + err.message);
  } finally {
    hideLoading();
  }
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
      const div = document.createElement('div');
      div.className = 'proyecto-item';
      div.innerHTML = `
        <div class="proyecto-info">
          <div class="proyecto-titulo">${esc(proy.titulo)}</div>
          <div class="proyecto-fecha">${fecha} · ${proy.transcripcion.length} caracteres</div>
        </div>
        <div class="proyecto-actions">
          <button class="mm-btn mm-btn-sm" data-id="${proy.id}" data-action="cargar">Cargar</button>
          <button class="mm-btn mm-btn-sm mm-btn-danger" data-id="${proy.id}" data-action="eliminar">✕</button>
        </div>
      `;
      container.appendChild(div);
    });

    // Agregar event listeners
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
      proyectoId: proyecto.id,
      createdAt: proyecto.createdAt
    };

    document.getElementById('transcriptionText').innerText = proyecto.transcripcion;
    updateCharCount();
    document.getElementById('transcriptionResult').style.display = 'block';

    // Cambiar a pestaña de transcripción
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
  
  // Botones
  document.getElementById('uploadBtn').onclick = () => document.getElementById('audioInput').click();
  document.getElementById('micBtn').onclick = startRecording;
  document.getElementById('stopRecordingBtn').onclick = stopRecording;
  document.getElementById('copiarTextoBtn').onclick = copiarTexto;
  document.getElementById('crearNotaBtn').onclick = crearNotaPeriodistica;
  document.getElementById('guardarProyectoBtn').onclick = guardarProyecto;
  document.getElementById('descargarVTTBtn').onclick = descargarVTT;
  
  // Actualizar contador de caracteres
  document.getElementById('transcriptionText').addEventListener('input', updateCharCount);
  
  // Tema
  const savedTheme = localStorage.getItem('mm-theme');
  savedTheme === 'dark' ? setTheme('dark') : setTheme('light');
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
});