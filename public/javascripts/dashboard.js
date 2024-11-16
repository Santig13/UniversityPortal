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
    filtrar();
});

 function filtrar() {
    const fecha = document.getElementById('fecha').value;
    const tipo = document.getElementById('tipo').value;
    const ubicacion = document.getElementById('ubicacion').value;
    const capacidad = document.getElementById('capacidad').value;
    const queryParams = new URLSearchParams({ fecha, tipo, ubicacion, capacidad }).toString();

    $.ajax({
        url: `/eventos/filter?${queryParams}`,
        method: 'GET',
        success: function(eventos) {
            renderEventos(eventos);

            // Reasignar los eventos de clic de los botones de eliminación después de refrescar la lista
            document.querySelectorAll('.btn-outline-danger').forEach(button => {
                button.addEventListener('click', function() {
                    const eventId = button.getAttribute('data-event-id');
                    setEventoId(eventId);
                });
            });
        },
        error: function() {
            showToast('Error al filtrar los eventos');
        }
    });
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
                            ${(userRole === 'organizador' && userId == evento.organizador_id) ? ` <button class="btn btn-outline-primary btn-event organizador" data-bs-toggle="modal" data-bs-target="#editEventModal" onclick="fillModal(${JSON.stringify(evento).replace(/"/g, '&quot;')})"><i class="bi bi-pencil-square me-1"></i> Editar</button>
                                                             <button class="btn btn-outline-danger btn-event organizador ms-2" data-bs-toggle= "modal" data-bs-target="#deleteEventModal" data-event-id="${evento.id}" onclick="setEventoId('${evento.id}')" style="display: inline-block;">
                                                                    <i class="bi bi-trash me-1"></i> Eliminar
                                                    </button><button class="btn btn-outline-info btn-event organizador ms-2" data-bs-toggle="modal" data-bs-target="#participantsModal" onclick="showParticipants('${evento.id}')">
                                                    <i class="bi bi-people me-1"></i> Participantes
                                                </button>` : ''}
                            ${userRole === 'participante' ? 
                                (!evento.inscrito ? 
                                    `<button onclick="inscribirUsuario('${evento.id}','${evento.organizador_id}')" class="btn btn-outline-primary btn-event participante">Apuntarse</button>` : 
                                    `<button onclick="desinscribirUsuario('${evento.id}','${evento.organizador_id}')" class="btn btn-outline-danger btn-event participante">Desapuntarse</button>`) : ''}
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

    $.ajax({
        url: '/eventos/crear',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(response) {
            showToast('Evento creado exitosamente');
            filtrar(); // Refrescar la lista después de crear
            const modal = document.getElementById('createEventModal');
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) {
                form.reset();
                modalInstance.hide();
            }
        },
        error: function(jqXHR) {
            if (jqXHR.getResponseHeader('content-type').includes('text/html')) {
                document.body.innerHTML = jqXHR.responseText;
                document.body.style.display = 'flex';
                document.body.style.justifyContent = 'center';
                document.body.style.alignItems = 'center';
                document.body.style.height = '100vh';
            } else {
                const data = JSON.parse(jqXHR.responseText);
                showToast('Errores en la creacion del evento: ' + data.message);
            }
        }
    });
});

let eventoId = null;

// Funcion para guardar el id del evento a eliminar o editar
function setEventoId(id) {
    eventoId = id;
}

// Funcion para guardar el id del evento a eliminar o editar
function fillModal(evento) {
    if (typeof evento === 'string') {
        evento = JSON.parse(evento);
    }

    const modal = document.getElementById('editEventModal');
    const form = document.getElementById('editEventForm');
    form.titulo.value = evento.titulo || '';
    form.descripcion.value = evento.descripcion || '';
    form.fecha.value = evento.fecha ? new Date(evento.fecha).toISOString().split('T')[0] : '';
    form.hora.value = evento.hora || '';
    form.ubicacion.value = evento.ubicacion || '';
    form.capacidad_maxima.value = evento.capacidad_maxima || '';
    const modalInstance = bootstrap.Modal.getInstance(modal);
    if (modalInstance) {
        modalInstance.show();
    }
    eventoId = evento.id;
}


// Funcion para el modal de confirmación de eliminación
document.getElementById('confirmDeleteEventButton').addEventListener('click', async function(event) {
    event.preventDefault();
    eliminarEvento(eventoId);
    const modal = document.getElementById('deleteEventModal');
    const modalInstance = bootstrap.Modal.getInstance(modal);
    if (modalInstance) {
        modalInstance.hide();
    }
    eventoId = null;
});

// Funcion para eliminar eventos
function eliminarEvento(eventId) { 
    $.ajax({
        url: `/eventos/${eventId}`,
        method: 'DELETE',
        success: function(data) {
            if (data.success) {
                showToast('Evento eliminado exitosamente');
                filtrar(); // Refrescar la lista después de eliminar
            } else {
                showToast('Error al eliminar el evento');
            }
        },
        error: function() {
            showToast('Error al eliminar el evento');
        }
    });
}

// Funcion para el modal de confirmación de eliminación
document.getElementById('confirmEditEventButton').addEventListener('click', async function(event) {
    event.preventDefault();
    editarEvento();
    const modal = document.getElementById('editEventModal');
    const modalInstance = bootstrap.Modal.getInstance(modal);
    if (modalInstance) {
        modalInstance.hide();
    }
    eventoId = null;
});

function editarEvento() {
    const form = document.getElementById('editEventForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    data.capacidad_maxima = parseInt(data.capacidad_maxima, 10);

    $.ajax({
        url: `/eventos/${eventoId}`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(response) {
            showToast('Evento editado exitosamente');
            filtrar(); // Refrescar la lista después de editar
        },
        error: function(jqXHR) {
            if (jqXHR.getResponseHeader('content-type').includes('text/html')) {
                document.body.innerHTML = jqXHR.responseText;
                document.body.style.display = 'flex';
                document.body.style.justifyContent = 'center';
                document.body.style.alignItems = 'center';
                document.body.style.height = '100vh';
            } else {
                const data = JSON.parse(jqXHR.responseText);
                showToast('Errores en la edicion del evento: ' + data.message);
            }
        }
    });
}

// Funcion para limpiar los campos del formulario de filtro
document.getElementById('filterForm').addEventListener('reset', async function(event) {
    event.preventDefault();
    document.getElementById('fecha').value = '';
    document.getElementById('tipo').value = '';
    document.getElementById('ubicacion').value = '';
    document.getElementById('capacidad').value = '';
    filtrar();
});

// Funcion para inscribir un usuario en un evento
function inscribirUsuario(eventId, organizador_id) {
    $.ajax({
        url: '/usuarios/inscribir',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            userId: userId,
            eventId: eventId,
            organizador_id: organizador_id,
        }),
        success: function(data) {
            const mensajeElemento = document.getElementById(`mensaje-${eventId}`);
            if (data.success) {
                mensajeElemento.innerText = 'Inscrito en el evento';
                mensajeElemento.classList.add('text-success');
                mensajeElemento.classList.add('mx-2');
                showToast('Inscrito en el evento');
                // // Deshabilitar el botón después de la inscripción
                // const botonApuntarse = mensajeElemento.previousElementSibling;
                // botonApuntarse.innerText = 'Desapuntarse';
                filtrar(); // Refrescar la lista después de inscribirse
            } else {
                showToast('Error al inscribirse en el evento');
            }
        },
        error: function() {
            showToast('Error al inscribirse en el evento');
        }
    });
}

function desinscribirUsuario(eventId,organizador_id){
    $.ajax({
        url: '/usuarios/desinscribir',
        method: 'DELETE',
        contentType: 'application/json',
        data: JSON.stringify({
            userId: userId,
            eventId: eventId,
            organizador_id: organizador_id,
        }),
        success: function(data) {
            const mensajeElemento = document.getElementById(`mensaje-${eventId}`);
            if (data.success) {
                mensajeElemento.innerText = '';
                mensajeElemento.classList.remove('text-success');
                mensajeElemento.classList.remove('mx-2');
                // Deshabilitar el botón después de la inscripción
                // const botonApuntarse = mensajeElemento.previousElementSibling;
                // botonApuntarse.innerText = 'Apuntarse';
                // botonApuntarse.addClassName('btn-outline-primary');
                // botonApuntarse.removeClassName('btn-outline-danger');
                //console.log('Desapuntado del evento');
                filtrar(); // Refrescar la lista después de desapuntarse
                showToast('Desapuntado del evento');
            } else {
                showToast('Error al desapuntarse en el evento');
            }
        },
        error: function() {
            showToast('Error al desapuntarse en el evento');
        }
    });
} 
function showParticipants(eventoId) {
    $.ajax({
        url: `/eventos/${eventoId}/participantes`,
        method: 'GET',
        success: function (response) {
            const participantesContainer = document.getElementById('participantesContainer');
            participantesContainer.innerHTML = '';
            let html = '';
            if (response.participantes.length === 0) {
                const tituloNotificaciones = document.getElementById('tituloNotificaciones');
                tituloNotificaciones.classList.add('d-none');
                participantesContainer.innerHTML = '<h4 class="text-center">No hay participantes</h4>';
            } else {
                response.participantes.forEach(participante => {
                    html += `
                    <div class="row mb-4">
                        <div class="col-12">
                            <div id="participante-${participante.id}" class="card">
                                <div class="card-body d-flex align-items-center">
                                    <div>
                                        <h5 class="card-title">Participante</h5>
                                        <p class="card-text"><strong>Nombre:</strong> ${participante.nombre}</p>
                                        <p class="card-text"><strong>Teléfono:</strong> ${participante.telefono}</p>
                                        <p class="card-text"><strong>Email:</strong> ${participante.email}</p>
                                        <p class="card-text"><strong>Facultad:</strong> ${participante.facultad}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    `;
                });
                participantesContainer.insertAdjacentHTML('beforeend', html);
            }
        },
        error: function (error) {
            console.log(error);
        }
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