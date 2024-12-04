"use strict";
// Funcion para filtrar eventos

const filterForm = $('#filterForm');
$("#filterForm").on("keydown", function(event) { 
    if (event.key === "Enter") {
        event.preventDefault();
        filtrar();
    }
});
if (filterForm.length) {
    filterForm.on('submit', function(event) {
        event.preventDefault();
        filtrar();
    });
}

// Funcion para filtrar eventos personales
function filtrar() {
    if (profile) {
        $.ajax({
            url: `/eventos/personales`,
            method: 'GET',
            success: function(eventos) {
                renderEventos(eventos);
                // Reasignar los eventos de clic de los botones de eliminación después de refrescar la lista
                $('.btn-outline-danger').each(function() {
                    $(this).on('click keydown', function(event) {
                        if (event.type === 'click' || (event.type === 'keydown' && event.key === 'Enter')) {
                            const eventId = $(this).data('event-id');
                            setEventoId(eventId);
                        }
                    });
                });
            },
            error: function() {
                showToast('Error al recuperar los eventos personales');
            }
        });
    } else {
        const fecha = $('#fecha').val() || "";
        const tipo = $('#tipo').val() || "";
        const ubicacion = $('#ubicacion').val() || "";
        const capacidad = $('#capacidad').val() || "";

        const queryParams = new URLSearchParams({ fecha, tipo, ubicacion, capacidad }).toString();
        $.ajax({
            url: `/eventos/filter?${queryParams}`,
            method: 'GET',
            success: function(eventos) {
                renderEventos(eventos);
                // Reasignar los eventos de clic de los botones de eliminación después de refrescar la lista
                $('.btn-outline-danger').each(function() {
                    $(this).on('click keydown', function(event) {
                        if (event.type === 'click' || (event.type === 'keydown' && event.key === 'Enter')) {
                            const eventId = $(this).data('event-id');
                            setEventoId(eventId);
                        }
                    });
                });
            },
            error: function() {
                showToast('Error al filtrar los eventos');
            }
        });
    }
}

// Funcion para renderizar los eventos despues del filtro
function renderEventos(eventos) {
    const eventosContainer = $('#eventosContainer');
    eventosContainer.empty(); // Limpia la lista actual de eventos
    //si no hay eventos, mostrar mensaje
    if (eventos.length === 0) {
        eventosContainer.html('<h4 class="text-center">No hay eventos</h4>');
    }
    else{
        eventos.forEach(evento => {
        const eventoHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card" tabindex="-1">
                    <div class="card-header m-1">
                        <h4 class="card-title">${evento.titulo}</h4>
                    </div>
                        <div class="card-body">
                            <p class="card-text"><strong>Descripción:</strong> ${evento.descripcion}</p>
                            <p class="card-text"><strong>Fecha:</strong> ${new Date(evento.fecha).toLocaleDateString('es-ES')}</p>
                            <p class="card-text"><strong>Hora de inicio:</strong> ${evento.hora_ini}</p>
                            <p class="card-text"><strong>Hora de fin:</strong> ${evento.hora_fin}</p>
                            <p class="card-text"><strong>Ubicación:</strong> ${evento.ubicacion}</p>
                            <p class="card-text"><strong>Capacidad Máxima:</strong> ${evento.capacidad_maxima}</p>
                            <p class="card-text"><strong>Organizador:</strong> ${evento.organizador_nombre}</p>
                        </div>
                        <div class="card-footer m-1 d-flex flex-wrap align-items-center justify-content-lg-start">
                            <small class="mx-2 mt-1">ID Evento: ${evento.id}</small>
                            ${evento.terminado ? `
                                <div class="mx-2 mt-1 red-text"> <i class="bi bi-calendar-x red-text"></i> Este evento ha terminado </div>
                                ${(userRole === 'participante' && evento.estadoInscripcion === 'inscrito') ? `
                                 <button class="btn btn-outline-primary btn-event participante ms-2 mt-1" data-bs-toggle="modal" data-bs-target="#rateEventModal" onclick="setRateEventId('${evento.id}')">
                                        <i class="bi bi-star me-1"></i> Calificar Evento
                                    </button>
                                    <button class="btn btn-outline-info btn-event organizador ms-2 mt-1" data-bs-toggle="modal" data-bs-target="#viewRatingsModal" onclick="showRatings('${evento.id}')">
                                        <i class="bi bi-list-stars me-1"></i> Ver Calificaciones
                                    </button>
                                ` :`
                                    <button class="btn btn-outline-info btn-event organizador ms-2 mt-1" data-bs-toggle="modal" data-bs-target="#viewRatingsModal" onclick="showRatings('${evento.id}')">
                                         <i class="bi bi-list-stars me-1"></i> Ver Calificaciones
                                    </button>
                                ` }
                            ` : `
                                ${(userRole === 'organizador' && userId == evento.organizador_id) ? `
                                    <button class="btn btn-outline-primary btn-event organizador mt-1" data-bs-toggle="modal" data-bs-target="#editEventModal" onclick="fillModal(${JSON.stringify(evento).replace(/"/g, '&quot;')})">
                                        <i class="bi bi-pencil-square me-1"></i> Editar
                                    </button>
                                    <button class="btn btn-outline-danger btn-event organizador ms-2 mt-1" data-bs-toggle="modal" data-bs-target="#deleteEventModal" data-event-id="${evento.id}" onclick="setEventoId('${evento.id}')" style="display: inline-block;">
                                        <i class="bi bi-trash me-1"></i> Eliminar
                                    </button>
                                    <button class="btn btn-outline-info btn-event organizador ms-2 mt-1" data-bs-toggle="modal" data-bs-target="#participantsModal" onclick="showParticipants('${evento.id}')">
                                        <i class="bi bi-people me-1"></i> Participantes
                                    </button>
                                ` : ''}
                                ${userRole === 'participante' ? `
                                    ${evento.estadoInscripcion === 'inscrito' ? `
                                        <button onclick="desinscribirUsuario('${evento.id}','${evento.organizador_id}')" class="btn btn-outline-danger btn-event participante">Desapuntarse</button>
                                        <div id="mensaje-${evento.id}" class="mx-2 green-text">Inscrito en el evento</div>
                                    ` : evento.estadoInscripcion === 'lista de espera' ? `
                                        <button onclick="abandonarListaEspera('${evento.id}','${evento.organizador_id}')" class="btn btn-outline-warning btn-event participante">Abandonar</button>
                                        <div id="mensaje-${evento.id}" class="mx-2 text-warning">En lista de espera</div>
                                    ` : `
                                        <button onclick="inscribirUsuario('${evento.id}','${evento.organizador_id}')" class="btn btn-outline-primary btn-event participante">Apuntarse</button>
                                        <div id="mensaje-${evento.id}"></div>
                                    `}
                                ` : ''}
                            `}
                        </div>
                </div>
            </div>
        `;
        
        eventosContainer.append(eventoHTML);
    });
    }
}
//boton que carga las facultades
$('#btn_modal_crear').on('click', async function(event) {
    event.preventDefault();
    $.ajax({
        url: '/facultades',
        method: 'GET',
        success: function(facultades) {
            
            const select = $('#facultad');
            // select.empty();
            facultades.forEach(facultad => {
                select.append(`<option value="${facultad.nombre}">${facultad.nombre}</option>`);
            });
            //miro si esta createEventModal y lo abro
            const modal = $('#createEventModal');
            const modalInstance = bootstrap.Modal.getInstance(modal[0]);
            if (modalInstance) {
                modalInstance.show();
            }
            
        },
        error: function() {
            const modal = $('#createEventModal');
            const modalInstance = bootstrap.Modal.getInstance(modal[0]);
            if (modalInstance) {
                form[0].reset();
                modalInstance.hide();
            }
            showToast('Error al obtener las facultades');
        }
    });
});
// Funcion para crear eventos
$('#createEventButton').on('click', async function(event) {
    event.preventDefault();
    const form = $('#createEventForm');
    const data = {
        titulo: form.find('[name="titulo"]').val(),
        descripcion: form.find('[name="descripcion"]').val(),
        fecha: form.find('[name="fecha"]').val(),
        hora_ini: form.find('[name="hora_ini"]').val(),
        hora_fin: form.find('[name="hora_fin"]').val(),
        ubicacion: form.find('[name="facultad"]').val() + ", " + form.find('[name="ubicacion"]').val(),
        capacidad_maxima: parseInt(form.find('[name="capacidad_maxima"]').val(), 10),
        organizador_id: parseInt(form.find('[name="organizador_id"]').val(), 10)
    };

    //mostrar toast y cerrar modal si alguno de los campos no esta rellenado
    if (!data.titulo || !data.descripcion || !data.fecha || !data.hora_ini || !data.hora_fin || !data.ubicacion || !data.capacidad_maxima) {
        showToast('Por favor, rellene todos los campos');
        return;
    }

    $.ajax({
        url: '/eventos/crear',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(response) {
            showToast('Evento creado exitosamente');
            filtrar(); // Refrescar la lista después de crear
            const modal = $('#createEventModal');
            const modalInstance = bootstrap.Modal.getInstance(modal[0]);
            if (modalInstance) {
                form[0].reset();
                modalInstance.hide();
            }
        },
        error: function(jqXHR) {
            const modal = $('#createEventModal');
            const modalInstance = bootstrap.Modal.getInstance(modal[0]);
            if (modalInstance) {
                form[0].reset();
                modalInstance.hide();
            }
            if(jqXHR.responseJSON){
                showToast('Errores en la creacion del evento: ' + jqXHR.responseJSON.message);
            }
            else{
                $('body').html(jqXHR.responseText)
                    .css({
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100vh'
                });
            }
        }
        
    });
});

let eventoId = null;

// Funcion para guardar el id del evento a eliminar o editar
function setEventoId(id) {
    eventoId = id;
}

// Funcion para el modal de confirmación de eliminación
$('#confirmDeleteEventButton').on('click', async function(event) {
    event.preventDefault();
    eliminarEvento(eventoId);
    const modal = $('#deleteEventModal');
    const modalInstance = bootstrap.Modal.getInstance(modal[0]);
    if (modalInstance) {
        modalInstance.hide();
    }
    eventoId = null;
});

// Funcion para eliminar eventos
function eliminarEvento(eventId) { 
    $.ajax({
        url: `/eventos/${eventId}`,
        method: 'PATCH',
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

// Funcion para el modal de confirmación de edición
$('#confirmEditEventButton').on('click', async function(event) {
    event.preventDefault();
    editarEvento();
    const modal = $('#editEventModal');
    const modalInstance = bootstrap.Modal.getInstance(modal[0]);
    if (modalInstance) {
        modalInstance.hide();
    }
    eventoId = null;
});


// Función para rellenar el modal de edición
function fillModal(evento) {
    if (typeof evento === 'string') {
        evento = JSON.parse(evento);
    }

    const form = $('#editEventForm');

    // Parse ubicacion into facultad and lugar
    const [facultad, lugar] = (evento.ubicacion || '').split(',');

    form.find('[name="titulo"]').val(evento.titulo || '');
    form.find('[name="descripcion"]').val(evento.descripcion || '');
    form.find('[name="fecha"]').val(evento.fecha ? moment(evento.fecha).format('YYYY-MM-DD') : '');
    form.find('[name="hora_ini"]').val(evento.hora_ini || '');
    form.find('[name="hora_fin"]').val(evento.hora_fin || '');
    form.find('[name="ubicacion"]').val(lugar?.trim() || '');
    form.find('[name="capacidad_maxima"]').val(evento.capacidad_maxima || '');

    const modal = $('#editEventModal');
    const modalInstance = bootstrap.Modal.getInstance(modal[0]) || new bootstrap.Modal(modal[0]);

    modal.on('shown.bs.modal', function () {
        const facultadSelect = form.find('[name="facultad"]');
        facultadSelect.empty(); // Limpia opciones previas

        // Realiza la llamada AJAX para obtener las facultades
        $.ajax({
            url: '/facultades',
            method: 'GET',
            success: function (data) {
                data.forEach(fac => {
                    const option = $('<option></option>')
                        .val(fac.nombre)
                        .text(fac.nombre)
                        .prop('selected', fac.nombre.trim() === facultad?.trim());
                    facultadSelect.append(option);
                });
            },
            error: function (jqXHR) {
                console.error('Error al cargar las facultades:', jqXHR);
                if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
                    showToast('Error al cargar las facultades: ' + jqXHR.responseJSON.message);
                } else {
                    $('body').html(jqXHR.responseText || 'Error inesperado').css({
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100vh'
                    });
                }
            }
        });
    });

    modalInstance.show();
    eventoId = evento.id;
}


// Funcion para editar eventos
function editarEvento() {
    const form = $('#editEventForm');
    const data = {
        titulo: form.find('[name="titulo"]').val(),
        descripcion: form.find('[name="descripcion"]').val(),
        fecha: form.find('[name="fecha"]').val(),
        hora_ini: form.find('[name="hora_ini"]').val(),
        hora_fin: form.find('[name="hora_fin"]').val(),
        ubicacion: form.find('[name="facultad"]').val() + ", " + form.find('[name="ubicacion"]').val(),
        capacidad_maxima: parseInt(form.find('[name="capacidad_maxima"]').val(), 10)
    };

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
            if(jqXHR.responseJSON){
                showToast('Errores en la edicion del evento: ' + jqXHR.responseJSON.message);
            }
            else{
                $('body').html(jqXHR.responseText)
                    .css({
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100vh'
                    });
            }
        }
    });
}

// Funcion para limpiar los campos del formulario de filtro
if (filterForm.length) {
    filterForm.on('reset', function(event) {
        event.preventDefault();
        $('#fecha').val('');
        $('#tipo').val('');
        $('#ubicacion').val('');
        $('#capacidad').val('');
        filtrar();
    });
}


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
            const mensajeElemento = $(`#mensaje-${eventId}`);
            if (data.success) {
                if (data.message === 'Se te ha añadido a la lista de espera') {
                    mensajeElemento.text('En lista de espera')
                        .addClass('text-warning mx-2');
                } else {
                    mensajeElemento.text('Inscrito en el evento')
                        .addClass('text-success mx-2');
                }
                showToast(data.message);
                filtrar(); // Refrescar la lista después de inscribirse
            } else {
                showToast('Error al inscribirse en el evento: ' + data.message);
            }
        },
        error: function(jqXHR) {
            if(jqXHR.responseJSON){
                showToast('Error al inscribirse en el evento: ' + jqXHR.responseJSON.message);
            }
            else{
                $('body').html(jqXHR.responseText)
                    .css({
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100vh'
                    });
            }
           
        }
    });
}

// Funcion para desinscribir un usuario de un evento
function desinscribirUsuario(eventId, organizador_id) {
    $.ajax({
        url: '/usuarios/desinscribir',
        method: 'PATCH',
        contentType: 'application/json',
        data: JSON.stringify({
            userId: userId,
            eventId: eventId,
            organizador_id: organizador_id,
        }),
        success: function(data) {
            const mensajeElemento = $(`#mensaje-${eventId}`);
            if (data.success) {
                mensajeElemento.text('')
                    .removeClass('text-success mx-2');
                filtrar(); // Refrescar la lista después de desapuntarse
                showToast(data.message);
            } else {
                showToast('Error al desapuntarse en el evento');
            }
        },
        error: function() {
            showToast('Error al desapuntarse en el evento');
        }
    });
}

// Funcion para hacer delete de la lista de espera
function abandonarListaEspera(eventId, organizador_id) {
    $.ajax({
        url: '/usuarios/abandonar',
        method: 'PATCH',
        contentType: 'application/json',
        data: JSON.stringify({
            userId: userId,
            eventId: eventId,
            organizador_id: organizador_id,
        }),
        success: function(data) {
            const mensajeElemento = $(`#mensaje-${eventId}`);
            if (data.success) {
                mensajeElemento.text('')
                    .removeClass('text-warning mx-2');
                filtrar(); // Refrescar la lista después de abandonar la lista de espera
                showToast(data.message);
            } else {
                showToast('Error al abandonar la lista de espera');
            }
        },
        error: function() {
            showToast('Error al abandonar la lista de espera');
        }
    });
}

// Funcion para mostrar el contenido del modal de calificar evento haciendo get de los participantes
function showParticipants(eventoId) {
    $.ajax({
        url: `/eventos/${eventoId}/participantes`,
        method: 'GET',
        success: function(response) {
            const participantesContainer = $('#participantesContainer');
            participantesContainer.empty();
            let inscritosHtml = '';
            let listaEsperaHtml = '';

            if (response.participantes.length === 0) {
                participantesContainer.html('<h4 class="text-center">No hay participantes</h4>');
            } else {
                response.participantes.forEach(participante => {
                    const participanteHtml = `
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
                    if (participante.estado === 'inscrito') {
                        inscritosHtml += participanteHtml;
                    } else if (participante.estado === 'lista de espera') {
                        listaEsperaHtml += participanteHtml;
                    }
                });

                if (inscritosHtml) {
                    participantesContainer.append(`<h4 class="text-center mb-3">Lista de Participantes</h4>${inscritosHtml}`);
                }
                if (listaEsperaHtml) {
                    participantesContainer.append(`<h4 class="text-center mb-3">Lista de Espera</h4>${listaEsperaHtml}`);
                }
            }
        },
        error: function() {
            showToast('Error al obtener la lista de participantes');
        }
    });
}

// Funcion para el modal de calificar evento
$('#calificarEventoButton').on('click', async function(event) {
    event.preventDefault();
    calificarEvento(eventoId);
    const modal = $('#rateEventModal');
    const modalInstance = bootstrap.Modal.getInstance(modal[0]);
    if (modalInstance) {
        modalInstance.hide();
    }
    eventoId = null;
});

// Funcion para hacer post de la calificacion del evento
function calificarEvento(Id) {
    $.ajax({
        url: `/eventos/calificacion`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            userId: userId,
            eventId: Id,
            calificacion: $('#rating').val(),
            comentario: $('#comments').val()
        }),
        success: function(data) {
            if (data.success) {
                showToast(data.message);
                //borrar contenido del input de texto del modal
                $('#rating').val('1'); 
                $('#comments').val('');
            } else {
                showToast('Error al calificar el evento');
            }
        },
        error: function() {
            showToast('Error al calificar el evento');
        }
    });
}

// Funcion para hacer get de las calificaciones y mostrarlas
function showRatings(eventoId) {
    $.ajax({
        url: `/eventos/${eventoId}/calificaciones`,
        method: 'GET',
        success: function(response) {
            const ratingsContainer = $('#ratingsContainer');
            ratingsContainer.empty();
            if (response.calificaciones.length === 0) {
                ratingsContainer.html('<h4 class="text-center">No hay calificaciones</h4>');
            } else {
                response.calificaciones.forEach(calificacion => {
                    const calificacionHtml = `
                    <div class="row mb-4">
                        <div class="col-12">
                            <div class="card" tabindex="0">
                                <div class="card-body d-flex align-items-center">
                                    <div>
                                        <h4 class="card-title">Calificación</h4>
                                        <p class="card-text"><strong>Usuario:</strong> ${calificacion.nombre}</p>
                                        <p class="card-text"><strong>Email:</strong> ${calificacion.email}</p>
                                        <p class="card-text"><strong>Calificación:</strong> ${calificacion.calificacion}</p>
                                        <p class="card-text"><strong>Comentario:</strong> ${calificacion.comentario}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    `;
                    ratingsContainer.append(calificacionHtml);
                });
            }
        },
        error: function() {
            console.log('Error al obtener las calificaciones');
        }
    });
}

let toastTimeout; 

function showToast(message) {
    const toastElement = $('#myToast');
    const toastBody = toastElement.find('.toast-body');
    toastBody.text(message);

    // Detén cualquier animación previa del toast y vuelve a mostrarlo
    toastElement.stop(true, true).fadeIn(function () {
        if (toastTimeout) {
            clearTimeout(toastTimeout);
        }

        toastTimeout = setTimeout(() => {
            toastElement.fadeOut();
        }, 5000);
    });

    toastElement.find('.btn-close').off('click').on('click', function () {
        toastElement.stop(true, true).fadeOut(); 
        clearTimeout(toastTimeout); 
    });
}
