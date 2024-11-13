// Funcion para mostrar los botones de acuerdo al rol del usuario
document.addEventListener("DOMContentLoaded", function() {
    const buttons = document.querySelectorAll(".btn-event");

    buttons.forEach(button => {
        if (button.classList.contains(userRole)) {
            button.style.display = "inline-block";
        } else {
            button.style.display = "none";
        }
    });
});

// Funcion para filtrar eventos
document.getElementById('filterForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    await filtrar();
});

async function filtrar() {
    const fecha = document.getElementById('fecha').value;
    const tipo = document.getElementById('tipo').value;
    const ubicacion = document.getElementById('ubicacion').value;
    const capacidad = document.getElementById('capacidad').value;
    const queryParams = new URLSearchParams({ fecha, tipo, ubicacion, capacidad }).toString();
    const response = await fetch(`/eventos/filter?${queryParams}`);
    const eventos = await response.json();
    renderEventos(eventos);
}

// Funcion para renderizar los eventos despues del filtro
function renderEventos(eventos) {
    const eventosContainer = document.getElementById('eventosContainer');
    eventosContainer.innerHTML = ''; // Limpia la lista actual de eventos
    eventos.forEach(evento => {
        const eventoHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${evento.titulo}</h5>
                            <p class="card-text"><strong>Descripción:</strong> ${evento.descripcion}</p>
                            <p class="card-text"><strong>Fecha:</strong> ${new Date(evento.fecha).toLocaleDateString()}</p>
                            <p class="card-text"><strong>Hora:</strong> ${evento.hora}</p>
                            <p class="card-text"><strong>Ubicación:</strong> ${evento.ubicacion}</p>
                            <p class="card-text"><strong>Capacidad Máxima:</strong> ${evento.capacidad_maxima}</p>
                            <p class="card-text"><strong>Organizador ID:</strong> ${evento.organizador_id}</p>
                        </div>
                        <div class="card-footer m-1 d-flex align-items-center">
                            <small class="text-muted mx-2">ID del Evento: ${evento.id}</small>
                            ${(userRole === 'organizador' && userId == evento.organizador_id) ? `<button class="btn btn-outline-primary btn-event organizador"> <i class="bi bi-pencil-square me-2"></i>Editar</button>
                                                             <button class="btn btn-outline-danger btn-event organizador ms-2 data-bs-toggle="modal" data-bs-target="#deleteEventModal" onclick="setEventoId(${evento.id})">
                                                                    <i class="bi bi-trash me-1"></i> Eliminar
                                                    </button>` : ''}
                            ${userRole === 'participante' ? 
                                (!evento.inscrito ? 
                                    `<button onclick="inscribirUsuario('${evento.id}')" class="btn btn-outline-primary btn-event participante">Apuntarse</button>` : 
                                    `<button class="btn btn-outline-primary btn-event participante" disabled>Inscrito</button>`) : ''}
                            ${ userRole === 'participante' && evento.inscrito ? 
                                `<div id="mensaje-${evento.id}" class=" mx-2 text-success">Inscrito en el evento</div>` : 
                                `<div id="mensaje-${evento.id}"></div>`}
                        </div>
                    </div>
                </div>
            </div>
        `;
        eventosContainer.insertAdjacentHTML('beforeend', eventoHTML);
    });
}
// Funcion para crear eventos

document.getElementById('createEventButton').addEventListener('click', async function(event) {
    event.preventDefault();
    const form = document.getElementById('createEventForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    data.capacidad_maxima = parseInt(data.capacidad_maxima, 10);
    data.organizador_id = parseInt(data.organizador_id, 10);

    try {
        const response = await fetch('/eventos/crear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data) 
        });

        const contentType = response.headers.get('content-type');
        if (response.ok) {
            showToast('Evento creado exitosamente');
            filtrar(); // Refrescar la lista después de crear
        } 
        else {
            if (contentType && contentType.includes('text/html')) {
                const html = await response.text();
                document.body.innerHTML = html;
                document.body.style.display = 'flex';
                document.body.style.justifyContent = 'center';
                document.body.style.alignItems = 'center';
                document.body.style.height = '100vh';
            } else {
                const data = await response.json();
                showToast('Errores en la creacion del evento: ' + data.message);
            }
        }
            const modal = document.getElementById('createEventModal');
            const modalInstance = bootstrap.Modal.getInstance(modal);

            if (modalInstance) {
                form.reset();
                modalInstance.hide();
            }
    } catch (error) {
        showToast('Error en la creación del evento: ' + error.message);
    }
});

let eventoId = null;

// Funcion para guardar el id del evento a eliminar
function setEventoId(id) {
    eventoId = id;
}

// Funcion para el modal de confirmación de eliminación
document.getElementById('confirmDeleteEventButton').addEventListener('click', async function(event) {
    event.preventDefault();
    eliminarEvento(eventoId);
    console.log("llego aqui")
    const modal = document.getElementById('deleteEventModal');
    const modalInstance = bootstrap.Modal.getInstance(modal);
    if (modalInstance) {
        modalInstance.hide();
    }
    eventoId = null;
});

// Funcion para eliminar eventos
function eliminarEvento(eventId) { //copilot revisar
    console.log(eventId);
    fetch(`/eventos/${eventId}`, {
        method: 'DELETE',
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Evento eliminado exitosamente');
            filtrar(); // Refrescar la lista después de eliminar
        } else {
            showToast('Error al eliminar el evento');
        }
    })
    .catch(error => {
        showToast('Error al eliminar el evento');
    });
}

// Funcion para limpiar los campos del formulario de filtro
document.getElementById('filterForm').addEventListener('reset', async function(event) {
    event.preventDefault();
    document.getElementById('fecha').value = '';
    document.getElementById('tipo').value = '';
    document.getElementById('ubicacion').value = '';
    document.getElementById('capacidad').value = '';
    await filtrar();
});

// Funcion para inscribir un usuario en un evento
function inscribirUsuario(eventId) {
    fetch('/usuarios/inscribir', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId: userId,
            eventId: eventId,
        })
    })
    .then(response => response.json())
    .then(data => {
        const mensajeElemento = document.getElementById(`mensaje-${eventId}`);
        if (data.success) {
            mensajeElemento.innerText = 'Inscrito en el evento';
            mensajeElemento.classList.add('text-success');  
            mensajeElemento.classList.add('mx-2'); 
            // Deshabilitar el botón después de la inscripción
            const botonApuntarse = mensajeElemento.previousElementSibling;
            botonApuntarse.disabled = true;
            botonApuntarse.innerText = 'Inscrito';
        } 
        else{
            showToast('Error al inscribirse en el evento');
        }
    })
    .catch(error => {
        showToast('Error al inscribirse en el evento');
    });

}

// Funcion para mostrar un toast
function showToast(message) {
    const toastElement = document.getElementById('myToast');
    const toastBody = toastElement.querySelector('.toast-body');
    toastBody.textContent = message;
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    setTimeout(() => toast.hide(), 5000); // Ocultar toast después de 5 segundos
}