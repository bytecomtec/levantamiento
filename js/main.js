/**
 * main.js - Consolidado Bytecomtec
 * Sistema de levantamiento técnico
 */

// 1. FORZAR ELIMINACIÓN DE SERVICE WORKER
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
            registration.unregister().then(() => console.log("Service Worker eliminado"));
        }
    });
}

// 2. BLOQUE PRINCIPAL
if (!window.hasLoadedMain) {
    window.hasLoadedMain = true;

    // Configuración Inicial
    window.FormConfig = window.FormConfig || { titulo: "Ficha de Levantamiento Técnico", empresa: "BYTECOMTEC" };

    // --- Funciones Globales ---

    window.ejecutarImpresionClean = function() {
        if (!window.validarFormulario()) return;
        document.querySelectorAll('.row-item').forEach(fila => {
            const checkbox = fila.querySelector('input[type="checkbox"]');
            const cantidad = fila.querySelector('.qty-input');
            const select = fila.querySelector('select');
            
            if ((checkbox && checkbox.checked) || (cantidad && cantidad.value.trim() !== "") || (select && select.value !== "" && select.value !== "Seleccionar...")) {
                fila.classList.add('is-printed');
            } else {
                fila.classList.remove('is-printed');
            }
        });
        window.print();
    };

    async function obtenerToken() {
        let token = localStorage.getItem('GITHUB_TOKEN_BYTECOMTEC');
        if (!token) {
            token = prompt("Ingresa tu GitHub Token:");
            if (token) localStorage.setItem('GITHUB_TOKEN_BYTECOMTEC', token);
        }
        return token;
    }

    async function guardarLevantamientoEnGitHub(nombreArchivo, datosJson) {
        const GITHUB_TOKEN = await obtenerToken();
        if (!GITHUB_TOKEN) throw new Error("Token no disponible");
        
        const url = `https://api.github.com/repos/bytecomtec/levantamiento/contents/datos/${nombreArchivo}`;
        const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(datosJson, null, 2))));

        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Guardando: ${nombreArchivo}`,
                content: contentBase64,
                branch: "main"
            })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Error al subir");
        return result;
    }

    window.llenarFormularioConDatos = function(data) {
        try {
            ['cliente', 'proyecto', 'contacto', 'cargo', 'direccion', 'fechaVisita', 'horaVisita', 'contactoDatos'].forEach(id => { 
                const el = document.getElementById(id); 
                if (el) el.value = data[id] || ''; 
            });

            if (data.ingeniero) {
                const selIng = document.getElementById('ingeniero');
                if (selIng) Array.from(selIng.options).forEach(opt => { if (opt.text === data.ingeniero) selIng.value = opt.value; });
            }

            Object.entries(data.secciones || {}).forEach(([idBase, val]) => {
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

            if (data.entregables && Array.isArray(data.entregables)) {
                document.querySelectorAll('.checkbox-grid input[type="checkbox"]').forEach(cb => { 
                    cb.checked = data.entregables.includes(cb.parentElement.innerText.trim()); 
                });
            }
            alert("Proyecto cargado correctamente.");
        } catch (err) {
            console.error(err);
            alert("Error al procesar los datos.");
        }
    };

    window.obtenerDatosFormulario = function() {
        const datos = {
            cliente: document.getElementById('cliente')?.value,
            proyecto: document.getElementById('proyecto')?.value,
            contacto: document.getElementById('contacto')?.value,
            cargo: document.getElementById('cargo')?.value,
            direccion: document.getElementById('direccion')?.value,
            fechaVisita: document.getElementById('fechaVisita')?.value,
            horaVisita: document.getElementById('horaVisita')?.value,
            contactoDatos: document.getElementById('contactoDatos')?.value,
            ingeniero: document.getElementById('ingeniero')?.options[document.getElementById('ingeniero').selectedIndex]?.text,
            secciones: {},
            entregables: []
        };

        document.querySelectorAll('.row-item').forEach(fila => {
            const id = fila.getAttribute('data-item');
            if (id) {
                datos.secciones[id] = {
                    cantidad: fila.querySelector('.qty-input')?.value,
                    especificacion: fila.querySelector('select')?.value,
                    notas: fila.querySelector('input[type="text"][placeholder*="Notas"]')?.value
                };
            }
        });

        document.querySelectorAll('.checkbox-grid input[type="checkbox"]:checked').forEach(cb => {
            datos.entregables.push(cb.parentElement.innerText.trim());
        });

        return datos;
    };

    document.addEventListener('DOMContentLoaded', () => {

        // 1. Lógica Auto-Checkbox
        document.querySelectorAll('.row-item').forEach(row => {
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

        // 2. Lógica Auto-Llenado Fibra
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

        // 3. Validación Inteligente
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

        // 4. Eventos de Botones
        document.getElementById('btnGuardar')?.addEventListener('click', async () => {
            const nombre = `${document.getElementById('cliente')?.value || 'proyecto'}.json`;
            const datos = window.obtenerDatosFormulario();
            try {
                await guardarLevantamientoEnGitHub(nombre, datos);
                alert("Guardado en la nube exitosamente.");
            } catch (e) {
                alert("Error al guardar: " + e.message);
            }
        });

        /**
 * main.js - Versión Completa Bytecomtec
 */

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(reg => reg.unregister()));
}

if (!window.hasLoadedMain) {
    window.hasLoadedMain = true;

    // --- Funciones Globales ---
    window.ejecutarImpresionClean = function() {
        if (!window.validarFormulario()) return alert("Completa los campos obligatorios marcados en rojo.");
        document.querySelectorAll('.row-item').forEach(fila => {
            const check = fila.querySelector('input[type="checkbox"]');
            const cant = fila.querySelector('.qty-input');
            const sel = fila.querySelector('select');
            fila.classList.toggle('is-printed', (check?.checked || cant?.value.trim() !== "" || (sel && sel.value !== "Seleccionar...")));
        });
        window.print();
    };

    // --- Lógica de Nube ---
    async function guardarLevantamientoEnGitHub(nombreArchivo, datosJson) {
        const token = localStorage.getItem('GITHUB_TOKEN_BYTECOMTEC') || prompt("Ingresa tu GitHub Token:");
        if (token) localStorage.setItem('GITHUB_TOKEN_BYTECOMTEC', token);
        if (!token) throw new Error("Token no disponible");
        
        const url = `https://api.github.com/repos/bytecomtec/levantamiento/contents/datos/${nombreArchivo.replace(/ /g, '_')}.json`;
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(datosJson, null, 2))));

        const resp = await fetch(url, {
            method: 'PUT',
            headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `Guardando: ${nombreArchivo}`, content, branch: "main" })
        });
        if (!resp.ok) throw new Error("Error al subir a GitHub");
    }

    document.addEventListener('DOMContentLoaded', () => {

        // 1. CÁLCULO DE ALMACENAMIENTO (HDD)
        window.calcularHDD = function() {
            const camaras = parseInt(document.getElementById('totalCamaras')?.value) || 0;
            const dias = parseInt(document.getElementById('diasGrabacion')?.value) || 0;
            const res = document.getElementById('resultadoHDD');
            if (res) res.innerText = ((camaras * dias * 0.5) / 1000).toFixed(2) + " TB requeridos.";
        };

        // 2. BOTÓN WHATSAPP
        document.getElementById('btnWhatsApp')?.addEventListener('click', () => {
            const data = window.obtenerDatosFormulario();
            const msg = `Levantamiento Técnico: ${data.proyecto}%0ACliente: ${data.cliente}%0AFecha: ${data.fechaVisita}`;
            window.open(`https://wa.me/52155XXXXXXXX?text=${msg}`, '_blank');
        });

        // 3. CARGA JSON LOCAL
        document.getElementById('inputCargaRespaldo')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => window.llenarFormularioConDatos(JSON.parse(e.target.result));
            reader.readAsText(file);
        });

        // 4. OTROS BOTONES
        document.getElementById('btnGuardar')?.addEventListener('click', async () => {
            try {
                const nombre = document.getElementById('cliente')?.value || 'Proyecto_Sin_Nombre';
                await guardarLevantamientoEnGitHub(nombre, window.obtenerDatosFormulario());
                alert("Guardado en la nube exitosamente.");
            } catch (e) { alert(e.message); }
        });

        document.getElementById('btnProcesarCalculo')?.addEventListener('click', window.calcularHDD);
        document.getElementById('btnImprimir')?.addEventListener('click', window.ejecutarImpresionClean);

        // ... [AQUÍ MANTIENES TU LÓGICA DE AUTO-CHECKBOX, FIBRA Y VALIDACIÓN QUE YA TENÍAS] ...
        
        // RECUERDA: Mantener tus funciones window.llenarFormularioConDatos y window.obtenerDatosFormulario 
        // debajo del DOMContentLoaded como lo teníamos definido anteriormente.
    });
}

        // 5. Botón Imprimir
        document.getElementById('btnImprimir')?.addEventListener('click', window.ejecutarImpresionClean);
    });
}
