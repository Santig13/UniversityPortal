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
                            ${userRole === 'organizador' ? `<button class="btn btn-outline-primary btn-event organizador"> <i class="bi bi-pencil-square me-2"></i>Editar</button>
                                                             <button class="btn btn-outline-danger btn-event organizador ms-2" onclick="eliminarEvento(${evento.id})">
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

function eliminarEvento(eventId) { //copilot revisar
    fetch(`/eventos/${eventId}`, {
        method: 'DELETE',
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Evento eliminado exitosamente');
            filtrar(); // Refrescar la lista después de eliminar
        } else {
            alert('Error al eliminar el evento');
        }
    })
    .catch(error => {
        alert('Error al eliminar el evento');
    });
}

document.getElementById('filterForm').addEventListener('reset', async function(event) {
    event.preventDefault();
    document.getElementById('fecha').value = '';
    document.getElementById('tipo').value = '';
    document.getElementById('ubicacion').value = '';
    document.getElementById('capacidad').value = '';
    await filtrar();
});

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

function showToast(message) {
    const toastElement = document.getElementById('myToast');
    const toastBody = toastElement.querySelector('.toast-body');
    toastBody.textContent = message;
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    setTimeout(() => toast.hide(), 5000); // Ocultar toast después de 5 segundos
}