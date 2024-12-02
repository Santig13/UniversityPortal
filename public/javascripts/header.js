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
                            <div id="${notificacion.id}" class="card ${notificacion.leido ? '' : 'notificacion-no-leida'}" tabindex="0">
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

    const savedFontSize = Cookies.get('fontSize');
    const body = $('body');
    if (savedFontSize) {
        body.addClass(`font-${savedFontSize}`);
        $('#fontSizeSelector').val(savedFontSize);
    }
    else{
        
        body.addClass(`font-${tamañoTexto}`);
        $('#fontSizeSelector').val(tamañoTexto);
    }

    // Cambiar el tamaño de letra y almacenar en la cookie
    $('#fontSizeSelector').on('change', function () {
        const selectedSize = $(this).val();
        body.removeClass('font-Pequña font-Normal font-Grande');
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
    
function setNavigationMode(mode) {
    // Limpia todos los eventos previos
    $(document).off('keydown', handleKeyboardNavigation);
    $(document).off('keydown', preventKeyboardNavigation);
    $(document).off('click', preventMouseNavigation);

    // Limpia desactivaciones específicas de inputs y hovers
    $('*').off('mouseenter mouseleave');
    $('input, textarea, select, button').off('focus blur');

    //limpio body por si tiene la clase no-hover
    $("body").removeClass("no-hover");
    //limpio cards
    $('.card').off('click');


    if (mode === 'teclado') {
        // Habilitar navegación con teclado, deshabilitar ratón
        $(document).on('keydown', handleKeyboardNavigation);
        $(document).on('click', preventMouseNavigation);
        $("body").addClass("no-hover ");
        disableHover();
        disableInputInteractions();
    } else if (mode === 'ratón') {
        console.log("Modo ratón");
        // Habilitar navegación con ratón, deshabilitar teclado
        $(document).on('keydown', preventKeyboardNavigation);
        $(document).on('click', handleMouseNavigation);
        disableHover();
        disableInputInteractions();
    } else if (mode === 'ambos') {
        // Habilitar ambos modos
        $(document).on('keydown', handleKeyboardNavigation);
        $(document).on('click', handleMouseNavigation);
    }
}

// Evitar navegación con el ratón
function preventMouseNavigation(event) {
    event.preventDefault();
    event.stopImmediatePropagation(); // Evita que otros oyentes se ejecuten
   
}

// Evitar navegación con el teclado
function preventKeyboardNavigation(event) {
    event.preventDefault();
    event.stopImmediatePropagation(); // Evita que otros oyentes se ejecuten
    if (event.key === 'Tab') {
        event.preventDefault();
    }
   
}
    // Funcion de manejo de raton
    function handleMouseNavigation(event) {
        $('.card').on('click', function(event) {
            $(this).focus();
        });
    }
    
    // Funciones de manejo de navegación
    function handleKeyboardNavigation(event) {
        const cards = $('.card');
        let currentIndex = cards.index(document.activeElement);
        //hago que los enters cuenten como clicks
        console.log(event.key);
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
            event.preventDefault();
            if (currentIndex < cards.length - 1) {
                cards.eq(currentIndex + 1).focus();
            }
        } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
            event.preventDefault();
            if (currentIndex > 0) {
                cards.eq(currentIndex - 1).focus();
            }
        } 
        else if (event.ctrlKey && event.key === 'p') {
            event.preventDefault();
            window.location.href = `/usuarios/${userId}`;
        } else if (event.ctrlKey && event.key === 'h') {
            event.preventDefault();
            window.location.href = '/dashboard';
        } else if (event.altKey && event.key === 'c') {
            event.preventDefault();
            window.location.href = '/calendar';
        } else if (event.ctrlKey && event.altKey && event.key === 'n') {
            event.preventDefault();
            $('#notificationsModal').modal('show'); // Mostrar el modal de notificaciones
            $('#link-notificaciones').click();
        } 

        if(userRol === 'participante'){
             if (event.ctrlKey && event.key === 'i') {
                event.preventDefault();
                const currentCard = cards.eq(currentIndex);
                const apuntarseButton = currentCard.find('button:contains("Apuntarse")');
                if (apuntarseButton.length) {
                    apuntarseButton.click();
                }
            } else if (event.ctrlKey && event.key === 'd') {
                event.preventDefault();
                const currentCard = cards.eq(currentIndex);
                const desapuntarseButton = currentCard.find('button:contains("Desapuntarse")');
                if (desapuntarseButton.length) {
                    desapuntarseButton.click();
                }
            }
        }
    }

    // Deshabilitar efectos hover
    function disableHover() {
        $('*').on('mouseenter mouseleave', function (event) {
            event.stopImmediatePropagation(); // Bloquea eventos hover
        });
    }

    // Deshabilitar interacciones con inputs
    function disableInputInteractions() {
        $('input, textarea, select, button').on('focus blur', function (event) {
            event.preventDefault();
            event.stopImmediatePropagation();
        });
       
    }

    setNavigationMode(navegacion);
    // Ocultar el spinner y mostrar el contenido principal
    $("#spinner").hide();
    $("body").show();

});
    
// 