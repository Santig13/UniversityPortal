"use strict";

// Para mostrar el contenido del modal de notificaciones
$(document).ready(function () {
    $('#link-notificaciones').on('click', function () {
        $.ajax({
            url: '/notificaciones',
            method: 'GET',
            success: function (data, jqXHR, statusText) {
                const notificacionesContainer = $('#notificacionesContainer');
                notificacionesContainer.empty();
                let html = '';
                if (data.length === 0) {
                    $('#tituloNotificaciones').addClass('d-none');
                    notificacionesContainer.html('<h4 class="text-center">No hay notificaciones</h4>');
                }
                data.forEach(notificacion => {
                    moment.locale('es');
                    html += `
                    <div class="row mb-4">
                        <div class="col-12">
                            <div id="${notificacion.id}" class="card ${notificacion.leido ? '' : 'notificacion-no-leida'}">
                                <div class="card-body d-flex align-items-center">
                                    ${!notificacion.leido ? `<div id="circulo-${notificacion.id}" class="circulo-azul me-3"></div>` : ''}
                                    <div>
                                        <h4 class="card-title">Notificación</h5>
                                        <p class="card-text"><strong>Mensaje:</strong> ${notificacion.mensaje}</p>
                                        <p class="card-text"><strong>Fecha de Creación:</strong> ${moment(notificacion.fecha_creacion).fromNow()}</p>
                                    </div>
                                </div>
                                <div class="card-footer m-1 d-flex align-items-center">
                                    <small class="mx-2">ID Notificación: ${notificacion.id}</small>
                                    ${!notificacion.leido ? `<button id="btn-${notificacion.id}" class="btn btn-outline-primary btn-event ms-auto" onclick="marcarComoLeido(${notificacion.id})">Marcar como leído</button>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                });
                notificacionesContainer.append(html);
            },
            error: function (error) {
                alert('Error al recuperar las notificaciones');
            }
        });
    });
});
// Shortcut para ir a la página de usuario
$(document).keydown(function(event) {
    if (event.ctrlKey && event.key === 'p') {
        event.preventDefault();
        window.location.href = `/usuarios/${userId}`;
    }
});

// Para marcar una notificación como leída
function marcarComoLeido(notificacionId) {
    $.ajax({
        url: `/notificaciones/${notificacionId}/leido`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ leido: true }),
        success: function (data, jqXHR, statusText) {
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

// Para cambiar el tema oscuro o claro
$(document).ready(function () {
    const darkModeSwitch = $("#darkModeSwitch");
    const themeStylesheet = $("#theme-stylesheet");
    console.log($("#darkModeSwitch").length);
    console.log("Listener activado");
    const currentTheme = themeStylesheet.attr("href").includes("oscuro") ? "oscura" : "clara";
    darkModeSwitch.prop("checked", currentTheme === "oscura");

    // darkModeSwitch.on("change", function () {
    //     const newTheme = this.checked ? "oscuro" : "claro";
       
    //     themeStylesheet.attr("href", `/css/${newTheme}.css`);
    //     // $.ajax({
    //     //     url: '/usuarios/tema',
    //     //     method: 'PATCH',
    //     //     contentType: 'application/json',
    //     //     data: JSON.stringify({ accesibilidad_id: accesibilidad_id, tema: newTheme }),
    //     //     success: function (data) {
    //     //         if (!data.success) {
    //     //             showToast('Error al guardar el tema en la base de datos');
    //     //         }
    //     //     },
    //     //     error: function (error) {
    //     //         console.error('Error:', error);
    //     //     }
    //     // });
    // });

    $("#darkModeSwitch").on("change", function () {
        const newTheme = this.checked ? "oscuro" : "claro";
        console.log("Cambiando tema a:", newTheme);
    
        const themeStylesheet = $("#theme-stylesheet");
        themeStylesheet.attr("href", `/css/${newTheme}.css`);
        console.log("Hoja de estilos cambiada a:", themeStylesheet.attr("href"));
    });

    
});

// Para cambiar el tamaño de la letra
$(document).ready(function () {
    const fontSizeSelector = $('#fontSizeSelector'); 
    const body = $('body'); 

    fontSizeSelector.on('change', function () {
        const selectedSize = fontSizeSelector.val(); 

        body.removeClass('font-small font-normal font-large');

        if (selectedSize === 'small') {
            body.addClass('font-small');
        } else if (selectedSize === 'large') {
            body.addClass('font-large');
        } else {
            body.addClass('font-normal'); // Valor por defecto
        }
    });
});

