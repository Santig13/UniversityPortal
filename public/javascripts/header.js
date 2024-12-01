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
    else if (event.ctrlKey && event.key === 'h') {
        event.preventDefault();
        window.location.href = '/dashboard';
    }
    else if(event.altKey && event.key === 'c'){
        event.preventDefault();
        window.location.href = '/calendar';
    }
    else if(event.ctrlKey && event.altKey && event.key === 'n'){
        event.preventDefault();
        event.stopPropagation(); // Bloquea propagación
        $('#notificationsModal').modal('show'); // Mostrar el modal de notificaciones
        console.log("Interceptado Ctrl + Alt + N");
    }
});

$(document).keydown(function (event) {
    console.log(`Key pressed: ${event.key}, Ctrl: ${event.ctrlKey}, Alt: ${event.altKey}`);
    if (event.ctrlKey && event.altKey && event.key === 'c') {
        event.preventDefault();
        event.stopPropagation(); // Bloquea propagación
        console.log("Interceptado Ctrl + Alt + C");
        window.location.href = '/calendar';
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
                $(`#${notificacionId}`).removeClass('notificacion-no-leida');
                $(`#circulo-${notificacionId}`).addClass('d-none');
                $(`#btn-${notificacionId}`).addClass('d-none');
            } else {
                alert('Error al marcar la notificación como leída');
            }
        },
        error: function (error) {
            console.error('Error:', error);
        }
    });
}

$(document).ready(function () {
    const darkModeSwitch = $("#darkModeSwitch");
    const themeStylesheet = $("#theme-stylesheet");

    // Leer el tema de la cookie si existe
    const savedTheme = Cookies.get('theme');
    if (savedTheme) {
        themeStylesheet.attr("href", `/css/${savedTheme}.css`);
        darkModeSwitch.prop("checked", savedTheme === "oscuro");
    } else {
        const currentTheme = themeStylesheet.attr("href").includes("oscuro") ? "oscuro" : "claro";
        darkModeSwitch.prop("checked", currentTheme === "oscuro");
    }

    // Cambiar el tema y almacenar en la cookie
    darkModeSwitch.on("change", function () {
        const newTheme = this.checked ? "oscuro" : "claro";
        themeStylesheet.attr("href", `/css/${newTheme}.css`);
        Cookies.set('theme', newTheme, { expires: 1 }); // Almacenar el tema en una cookie por 1 dia
    });

    // Leer el tamaño de letra de la cookie si existe
    const savedFontSize = Cookies.get('fontSize');
    const body = $('body');
    if (savedFontSize) {
        body.addClass(`font-${savedFontSize}`);
        $('#fontSizeSelector').val(savedFontSize);
    }

    // Cambiar el tamaño de letra y almacenar en la cookie
    $('#fontSizeSelector').on('change', function () {
        const selectedSize = $(this).val();
        body.removeClass('font-small font-normal font-large');
        body.addClass(`font-${selectedSize}`);
        Cookies.set('fontSize', selectedSize, { expires: 1 }); // Almacenar el tamaño de letra en una cookie por 1 dia
    });
    
    $('#logoutButton').on('click', function(event) {
        event.preventDefault();
        Cookies.remove('theme');
        Cookies.remove('fontSize');
        $.ajax({
            url: '/auth/logout',
            type: 'POST'
        });
    });
    

    // Ocultar el spinner y mostrar el contenido principal
    $("#spinner").hide();
    $("body").show();

});
    
// 