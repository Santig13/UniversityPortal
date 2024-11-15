/* 
<% notificaciones.forEach(notificacion => { %>
                                <div class="row mb-4">
                                    <div class="col-12">
                                        <div class="card <%= notificacion.leido ? '' : 'notificacion-no-leida' %>">
                                            <div class="card-body ">
                                                <% if (!notificacion.leido) { %>
                                                    <div class="circulo-azul me-3"></div>
                                                <% } %>
                                                <h5 class="card-title">Notificación</h5>
                                                <p class="card-text"><strong>Mensaje:</strong> <%= notificacion.mensaje %></p>
                                                <p class="card-text"><strong>Fecha de Creación:</strong> <%= new Date(notificacion.fecha_creacion).toLocaleDateString() %></p>
                                            </div>
                                            <div class="card-footer m-1 d-flex align-items-center">
                                                <small class="text-muted mx-2">ID de la Notificación: <%= notificacion.id %></small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            <% }) %>
*/
document.addEventListener("DOMContentLoaded", function () {
    const notificationsLink = document.getElementById('link-notificaciones');
   
    notificationsLink.addEventListener('click', function () {
        $.ajax({
            url: '/notificaciones',
            method: 'GET',
            success: function (notificaciones, jqXHR) {
                const notificacionesContainer = document.getElementById('notificacionesContainer');
                notificacionesContainer.innerHTML = '';
                let html = '';
                if(notificaciones.length === 0){
                    notificacionesContainer.innerHTML = '<h5 class="text-center">No hay notificaciones</h5>';
                }
                notificaciones.forEach(notificacion => {
                    html +=  `
                    <div class="row mb-4">
                        <div class="col-12">
                            <div id="${notificacion.id}" class="card ${notificacion.leido ? '' : 'notificacion-no-leida'}">
                                <div class="card-body d-flex align-items-center">
                                    ${!notificacion.leido ? `<div id="circulo-${notificacion.id}" class="circulo-azul me-3"></div>` : ''}
                                    <div>
                                        <h5 class="card-title">Notificación</h5>
                                        <p class="card-text"><strong>Mensaje:</strong> ${notificacion.mensaje}</p>
                                        <p class="card-text"><strong>Fecha de Creación:</strong> ${new Date(notificacion.fecha_creacion).toISOString().slice(0, 19).replace('T', ' ')}</p>
                                    </div>
                                </div>
                                <div class="card-footer m-1 d-flex align-items-center">
                                    <small class="text-muted mx-2">ID de la Notificación: ${notificacion.id}</small>
                                    ${!notificacion.leido ? `<button id="btn-${notificacion.id}" class="btn btn-outline-primary btn-event ms-auto" onclick="marcarComoLeido(${notificacion.id})">Marcar como leído</button>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                });
                notificacionesContainer.insertAdjacentHTML('beforeend', html);
            },
            error: function (error) {
                console.log(error);
            }
        });
    });
});

function marcarComoLeido(notificacionId) {
    $.ajax({
        url: `/notificaciones/${notificacionId}/leido`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ leido: true }),
        success: function (data) {
            if (data.success) {
                document.getElementById(notificacionId).classList.remove('notificacion-no-leida');
                document.getElementById(`circulo-${notificacionId}`).classList.add('d-none');
                document.getElementById(`btn-${notificacionId}`).classList.add('d-none');
            } else {
                alert('Error al marcar la notificación como leída');
            }
        },
        error: function (error) {
            console.error('Error:', error);
        }
    });
}
/*
document.getElementById('#link-notificaciones').addEventListener('click', function () {
    $.ajax({
        url: '/notificaciones',
        method: 'GET',
        success: function (data, jqXHR) {
            if(data.success){
                const notificacionesContainer = document.getElementById('notificacionesContainer');
                notificacionesContainer.innerHTML = '';
                data.array.forEach(notificacion => {
                    const html =  `
                    <div class="row mb-4">
                        <div class="col-12">
                            <div class="card ${notificacion.leido ? '' : 'notificacion-no-leida'}">
                                <div class="card-body d-flex align-items-center">
                                    ${!notificacion.leido ? '<div class="circulo-azul me-3"></div>' : ''}
                                    <div>
                                        <h5 class="card-title">Notificación</h5>
                                        <p class="card-text"><strong>Mensaje:</strong> ${notificacion.mensaje}</p>
                                        <p class="card-text"><strong>Fecha de Creación:</strong> ${new Date(notificacion.fecha_creacion).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div class="card-footer m-1 d-flex align-items-center">
                                    <small class="text-muted mx-2">ID de la Notificación: ${notificacion.id}</small>
                                    ${!notificacion.leido ? `<button class="btn btn-outline-primary btn-event ms-auto" onclick="marcarComoLeido(${notificacion.id})">Marcar como leído</button>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                });
                notificacionesContainer.insertAdjacentHTML('beforeend', html);
            }
            else{
                
            }
        },
        error: function (error) {
            console.log(error);
        }
    });
});*/