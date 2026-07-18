// FORZAR ELIMINACIÓN DE SERVICE WORKER
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
            registration.unregister().then(() => console.log("Service Worker eliminado"));
        }
    });
}

    if (!window.hasLoadedMain) {
    window.hasLoadedMain = true;

    // --- 0. Configuración Inicial ---
    if (typeof window.FormConfig === 'undefined') {
        window.FormConfig = {
            titulo: "Ficha de Levantamiento Técnico",
            empresa: "BYTECOMTEC"
        };
    }

    // --- Funciones Globales ---
    window.ejecutarImpresionClean = function() {
    if (!window.validarFormulario()) return;

    // Marcamos TODAS las filas que tienen algún valor para que el CSS las muestre
    document.querySelectorAll('.row-item').forEach(fila => {
        const checkbox = fila.querySelector('input[type="checkbox"]');
        const cantidad = fila.querySelector('.qty-input');
        const select = fila.querySelector('select');
        
        // Marcamos si tiene un checkbox checkeado o tiene valor en cantidad/select
        if ((checkbox && checkbox.checked) || 
            (cantidad && cantidad.value.trim() !== "") || 
            (select && select.value !== "" && select.value !== "Seleccionar...")) {
            fila.classList.add('is-printed');
        } else {
            fila.classList.remove('is-printed');
        }
    });

    window.print();
};

async function obtenerToken() {
    // 1. Busca si ya hay un token guardado en este dispositivo
    let token = localStorage.getItem('GITHUB_TOKEN_BYTECOMTEC');
    
    // 2. Si no hay, pídelo al usuario y guárdalo
    if (!token) {
        token = prompt("Ingresa tu GitHub Token (se guardará solo en este dispositivo):");
        if (token) {
            localStorage.setItem('GITHUB_TOKEN_BYTECOMTEC', token);
        }
    }
    return token;
}

async function guardarLevantamientoEnGitHub(nombreArchivo, datosJson) {
    const GITHUB_TOKEN = await obtenerToken();
    if (!GITHUB_TOKEN) throw new Error("Token no disponible");

    const repoOwner = "bytecomtec"; // Asegúrate que sea tu usuario correcto
    const repoName = "levantamiento"; // Nombre de tu repositorio
    const path = `datos/${nombreArchivo}`;
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;

    // Convertir los datos a Base64 (requerido por la API de GitHub)
    const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(datosJson, null, 2))));

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: `Guardando levantamiento: ${nombreArchivo}`,
            content: contentBase64,
            branch: "main" // Verifica que tu rama principal se llame 'main'
        })
    });

    const result = await response.json();

    if (!response.ok) {
        console.error("Error respuesta GitHub:", result);
        throw new Error(result.message || "Error al subir a GitHub");
    }

    return result;
}
    
    window.actualizarEstadoImpresion = function() {
        document.querySelectorAll('.row-item').forEach(row => {
            const checkbox = row.querySelector('input[type="checkbox"]');
            if (checkbox && checkbox.checked) {
                row.classList.add('is-printed');
            } else {
                row.classList.remove('is-printed');
            }
        });
    };

document.addEventListener('DOMContentLoaded', () => {

    // 1. Lógica Auto-Checkbox
        const rows = document.querySelectorAll('.row-item');
        rows.forEach(row => {
        const checkbox = row.querySelector('input[type="checkbox"]');
        const cantidad = row.querySelector('.qty-input');
        const select = row.querySelector('select');
        const notas = row.querySelector('input[type="text"][placeholder*="Notas"]');

        const procesarCambios = (e) => {
            if (cantidad && (cantidad.value === "" || cantidad.value === "0")) {
                if (e.target === select || e.target === notas) cantidad.value = "1";
            }
                if (checkbox) {
                    const tieneValor = ((cantidad && cantidad.value.trim() !== "" && cantidad.value !== "0") || 
                                        (select && select.value !== "" && select.value !== "Seleccionar...") || 
                                        (notas && notas.value.trim() !== ""));
                    checkbox.checked = tieneValor;
                }
        };

            if (cantidad) cantidad.addEventListener('input', procesarCambios);
            if (select) select.addEventListener('change', procesarCambios);
            if (notas) notas.addEventListener('input', procesarCambios);
        });
    //LÓGICA AUTO-CHECKBOX


    // 2. LÓGICA AUTO-LLENADO FIBRA
        const inputFibra = document.querySelector('.qty-fibra');
        if (inputFibra) {
        inputFibra.addEventListener('input', (e) => {
        const cantFibra = parseInt(e.target.value) || 0;
        const llenarFila = (cQty, cSpec, cNota, vQty, vSpec, vNota) => {
        const elQty = document.querySelector(`.${cQty}`);
            if (elQty) {
                const fila = elQty.closest('.row-item');
                elQty.value = vQty;
                if (fila.querySelector(`.${cSpec}`)) fila.querySelector(`.${cSpec}`).value = vSpec;
                if (fila.querySelector(`.${cNota}`)) fila.querySelector(`.${cNota}`).value = vNota;
                const check = fila.querySelector('input[type="checkbox"]');
                    if (check) { check.checked = true; check.dispatchEvent(new Event('change')); }
            }
        };
                llenarFila('qty-cajas', 'spec-cajas', 'nota-cajas', cantFibra * 2, 'FTB-501', 'FiberHome');
                llenarFila('qty-conv', 'spec-conv', 'nota-conv', cantFibra * 2, 'MC220L', 'TP-Link');
                llenarFila('qty-pig', 'spec-pigtails', 'nota-pig', cantFibra * 2, 'LP-FO-LCU-SCA-01', 'LinkedPro');
                llenarFila('qty-sfp', 'spec-sfp', 'nota-sfp', cantFibra * 2, 'TL-SM321A/B', 'TP-link');
            });
        }
    // FIN DE LÓGICA AUTO-LLENADO FIBRA


    // 3. VALIDACIÓN INTELIGENTE
        window.validarFormulario = function() {
        let esValido = true;
        document.querySelectorAll('.row-item').forEach(fila => {
            const checkbox = fila.querySelector('input[type="checkbox"]');
            const inputNotas = fila.querySelector('input[type="text"][placeholder*="Notas"]');
            if (checkbox?.checked && inputNotas && inputNotas.value.trim() === "") {
                inputNotas.classList.add('input-error');
                esValido = false;
                } else if (inputNotas) { inputNotas.classList.remove('input-error'); }
            });
            return esValido;
        };
        // FIN VALIDACIÓN INTELIGENTE

    //INICIO LLENAR FORMULARIO CON DATOS
        window.llenarFormularioConDatos = function(data) {
        try {
        // 1. Carga de campos básicos y de visita
        ['cliente', 'proyecto', 'contacto', 'cargo', 'direccion', 'fechaVisita', 'horaVisita', 'contactoDatos'].forEach(id => { 
            const el = document.getElementById(id); 
            if (el) el.value = data[id] || ''; 
        });

        // 2. Carga específica para el select de ingeniero
        if (data.ingeniero) {
            const selIng = document.getElementById('ingeniero');
            if (selIng) {
                Array.from(selIng.options).forEach(opt => {
                    if (opt.text === data.ingeniero) selIng.value = opt.value;
                });
            }
        }

        // 3. Lógica existente para secciones
        Object.entries(data.secciones).forEach(([idBase, val]) => {
            const fila = document.querySelector(`.row-item[data-item="${idBase.trim()}"]`);
            if (fila) {
                const check = fila.querySelector('input[type="checkbox"]');
                if (check) { check.checked = true; check.dispatchEvent(new Event('change')); }
                if (fila.querySelector('.qty-input')) fila.querySelector('.qty-input').value = val.cantidad || '';
                if (fila.querySelector('select')) fila.querySelector('select').value = val.especificacion || 'N/A';
                if (fila.querySelector('input[type="text"][placeholder*="Notas"]')) 
                    fila.querySelector('input[type="text"][placeholder*="Notas"]').value = val.notas || '';
            }
        });

        // 4. Lógica para entregables
        if (data.entregables && Array.isArray(data.entregables)) {
            document.querySelectorAll('.checkbox-grid input[type="checkbox"]').forEach(cb => { 
                cb.checked = data.entregables.includes(cb.parentElement.innerText.trim()); 
            });
        }

        alert("Proyecto cargado correctamente.");
            } catch (err) {
        console.error(err);
        alert("Error al procesar los datos.");}
        };
    // FIN DE FORMULARIO CON DATOS

    // 4. Obtención de Datos
            window.obtenerDatosFormulario = function() {
            const datos = { secciones: {}, cliente: document.getElementById('cliente')?.value || 'N/A', 
            proyecto: document.getElementById('proyecto')?.value || 'N/A',
            contacto: document.getElementById('contacto')?.value || 'N/A', 
            cargo: document.getElementById('cargo')?.value || 'N/A', 
            direccion: document.getElementById('direccion')?.value || 'N/A',
            fechaVisita: document.getElementById('fechaVisita')?.value || '',
            horaVisita: document.getElementById('horaVisita')?.value || '',
            contactoDatos: document.getElementById('contactoDatos')?.value || '',
            ingeniero: document.getElementById('ingeniero')?.options[document.getElementById('ingeniero').selectedIndex].text || ''
            };
            document.querySelectorAll('.row-item').forEach(item => {
                const checkbox = item.querySelector('input[type="checkbox"]');
                const select = item.querySelector('select');
                if ((checkbox?.checked) || (select && select.value !== "" && select.value !== "Seleccionar...")) {
                    datos.secciones[item.getAttribute('data-item') || 'Elemento'] = {
                        cantidad: item.querySelector('.qty-input')?.value || '',
                        especificacion: select?.value || 'N/A',
                        notas: item.querySelector('input[type="text"][placeholder*="Notas"]')?.value || ''
                    };
                }
            });
            const entregables = [];
            document.querySelectorAll('.checkbox-grid input[type="checkbox"]:checked').forEach(cb => entregables.push(cb.parentElement.innerText.trim()));
            datos.entregables = entregables;
            return datos;
        };
        // FIN DE OBTENCIÓN DE DATOS.

    // 5. Botón WhatsApp
            document.getElementById('btnWhatsApp')?.addEventListener('click', (e) => {
            e.preventDefault();
            if (!window.validarFormulario()) { alert("Completa las notas faltantes."); return; }
            const data = window.obtenerDatosFormulario();
            let msg = `Proyecto: ${data.proyecto}%0ACliente: ${data.cliente}%0A%0ADetalles:%0A`;
            Object.entries(data.secciones).forEach(([idBase, v]) => {
                const fila = document.querySelector(`.row-item[data-item="${idBase}"]`);
                const label = fila?.querySelector('label');
                const nombreLegible = label ? label.innerText.replace(/:/g, '').trim() : idBase;
                msg += `• ${nombreLegible}: ${v.cantidad ? 'Cant: ' + v.cantidad + ', ' : ''}${v.especificacion !== 'N/A' ? v.especificacion + ', ' : ''}Notas: ${v.notas}%0A`;
            });
            if (data.entregables?.length > 0) msg += `%0AEntregables:%0A• ${data.entregables.join('%0A• ')}%0A`;
            window.open(`https://wa.me/?text=${msg}`, '_blank');
        });
    //FIN DE BOTÓN WHATS APP


    // 6. Botón Guardar
        document.getElementById('btnGuardar').addEventListener('click', async () => {
        // 1. Recolectar datos del formulario
        const datos = obtenerDatosFormulario(); 
    
        // 2. Generar nombre de archivo basado en el proyecto
        // Obtenemos el nombre del proyecto y lo limpiamos (quitamos espacios y caracteres raros)
        const nombreProyecto = (datos.proyecto || 'levantamiento').trim().replace(/[^a-z0-9]/gi, '_');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const nombreArchivo = `${nombreProyecto}_${timestamp}.json`;

        // 3. Subir a GitHub
        try {
        alert("Guardando en la nube, por favor espera...");
        
        await guardarLevantamientoEnGitHub(nombreArchivo, datos);
        
        alert("¡Éxito! El levantamiento se ha guardado como: " + nombreArchivo);
            } catch (error) {
        console.error("Error al guardar en GitHub:", error);
        alert("Hubo un error al guardar en GitHub: " + error.message);
            }
        });
    //FIN DE BOTÓN GUARDAR 

    // 7. Calculadora HDD
        document.getElementById('btnCalcularHDD')?.addEventListener('click', () => { document.getElementById('calculadoraPanel').style.display = document.getElementById('calculadoraPanel').style.display === 'none' ? 'block' : 'none'; });
        document.getElementById('btnProcesarCalculo')?.addEventListener('click', () => {
        const modos = { "continuo": 1.0, "movimiento": 0.5, "acusense": 0.3 };
        const m = { "2MP": [2048, 1536, 1024], "4MP": [4096, 3072, 2048], "3K/5MP": [5120, 3840, 2560], "6MP": [6144, 4608, 3072], "8MP": [8192, 6144, 4096] };
        const col = document.getElementById('calc_compresion')?.value === 'H.264' ? 0 : (document.getElementById('calc_compresion')?.value === 'H.265' ? 1 : 2);
        const bits = ((parseInt(document.getElementById('cant_ca_domo')?.value) || 0) * (m[document.getElementById('spec_cam_domo')?.value]?.[col] || 0)) + ((parseInt(document.getElementById('cant_cam_bullet')?.value) || 0) * (m[document.getElementById('spec_cam_bullet')?.value]?.[col] || 0));
        const cap = parseInt(document.getElementById('spec_hdd')?.value.match(/\d+/)) * (parseInt(document.getElementById('cant_hdd')?.value) || 1);
        const dias = bits > 0 ? Math.floor(((cap * 0.9) * 1000000000000 * 8) / ((bits * modos[document.getElementById('modo_grabacion')?.value || "continuo"] * 1000) * 86400)) : 0;
        alert(`Estimación: ${dias} días de grabación.`);
        if (document.getElementById('notes_hdd')) document.getElementById('notes_hdd').value = `Calculado: ${dias} días`;
    });
    // FIN DE CALCULADORA HDD


//    document.getElementById('btnProcesarCalculo')?.addEventListener('click', ...);
    
    // 2. Vía NUBE (La nueva lógica)
        document.getElementById('btnCargarNube')?.addEventListener('click', async () => {
        try {
        const GITHUB_TOKEN = await obtenerToken();
        const url = `https://api.github.com/repos/bytecomtec/levantamiento/contents/datos`;
        
        const response = await fetch(url, {
            headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
        });
        
        if (!response.ok) throw new Error("No pude acceder a la carpeta 'datos'");
        
        const archivos = await response.json();
        
        // Creamos una selección rápida
        const nombres = archivos.map(f => f.name);
        const seleccion = prompt("Elige un archivo para cargar:\n\n" + nombres.join('\n'));
        
        if (!seleccion) return;

        const fileUrl = `https://api.github.com/repos/bytecomtec/levantamiento/contents/datos/${seleccion}`;
        const resFile = await fetch(fileUrl, {
            headers: { 
                'Authorization': `token ${GITHUB_TOKEN}`, 
                'Accept': 'application/vnd.github.v3.raw' 
            }
        });
        
        const data = await resFile.json();
        window.llenarFormularioConDatos(data);
        
        } catch (err) {
        console.error(err);
        alert("No se pudo cargar desde la nube: " + err.message);
        }
    });
    //FIN DE SECCIÓN VÍA NUBE


    // 8. Carga JSON
        document.getElementById('inputCargaRespaldo')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
        const data = JSON.parse(event.target.result);
        window.llenarFormularioConDatos(data);
        };
        reader.readAsText(file);
    });
    //FIN DE CARGA ARCHIVOS JSON


    // 9. Botón Imprimir
        document.getElementById('btnImprimir')?.addEventListener('click', (e) => {
        e.preventDefault();
    
        // 1. Obtener nombre del cliente para el nombre del archivo
        const nombreEscuela = document.getElementById('cliente')?.value || 'Proyecto';
        const nombreLimpio = nombreEscuela.replace(/[^a-z0-9]/gi, '_');
    
        // 2. Cambiar título temporalmente
        const tituloOriginal = document.title;
        document.title = `${nombreLimpio} _ Propuesta Profesional`;
    
        // 3. Ejecutar la impresión
        window.ejecutarImpresionClean();
    
        // 4. Restaurar el título original
        setTimeout(() => {
        document.title = tituloOriginal;
        }, 2000); // 2 segundos para asegurar que el diálogo de impresión tome el nombre
    });
    //BOTÓN IMPRIMIR



});
