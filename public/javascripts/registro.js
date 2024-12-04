"use strict";
$(document).ready(function() {
    // cargar facultades
    $.ajax({
        url: '/facultades',
        method: 'GET',
        success: function(data, statusText, jqXHR) {
            const facultadSelect = $('#facultad');
            data.forEach(facultad => {
                const option = $('<option></option>').val(facultad.nombre).text(facultad.nombre);
                facultadSelect.append(option);
            });
        },
        error: function(jqXHR, statusText, errorThrown) {
            if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
                showToast('Error al cargar las facultades: ' + jqXHR.responseJSON.message);
            }
            else{
                $('body').html(jqXHR.responseText).css({
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh'
                });
            }
        }
    });
});

// cambiar el prefijo del tlf
$('.dropdown-item').on('click', function(e) {
    e.preventDefault();
    const prefix = $(this).data('prefix');
    $('#dropdownMenuButton').text(prefix);
});

// Validar que las contraseñas coincidan
$('#passwordConfirm').on('keyup', function() {
    const password = $('input[name="password"]').val();
    const passwordConfirm = $(this).val();
    const message = $('#passwordMessage');
    
    if (passwordConfirm === '') {
        message.text('');
    } else if (password === passwordConfirm) {
        message.text('Las contraseñas coinciden').css('color', '#00C700');
    } else {
        message.text('Las contraseñas no coinciden').css('color', 'red');
    }
});

// Validar que las contraseñas coincidan al hacer click en el botón de registro
$('#registerButton').on('click', function(event) {
    const password = $('#password').val();
    const passwordConfirm = $('#passwordConfirm').val();
    const passwordMessage = $('#passwordMessage');

    if (password !== passwordConfirm) {
        event.preventDefault();

        // Mostrar mensaje de error en el campo de confirmación
        $('#passwordConfirm')[0].setCustomValidity('Las contraseñas no coinciden');
        $('#passwordConfirm')[0].reportValidity();
    } else {
        passwordMessage.text('');
        $('#passwordConfirm')[0].setCustomValidity(''); // Restablecer validez si coinciden
    }
});


// Hacer post cuando se registre un usuario
$('#registerButton').on('click', async function(event) {
    const formCheck = $('form');
    const requiredFields = formCheck.find('input[required], select[required]');
    let allFieldsFilled = true;

    if (requiredFields.length > 0) {
        requiredFields.each(function() {
            const value = $(this).val();
            if (value === null || !value.trim()) {
                allFieldsFilled = false;
            }
        });
    }

    // Solo continua si todos los campos están llenos
    if (!allFieldsFilled) {
        showToast('Por favor, complete todos los campos obligatorios.');
        event.preventDefault();
        return;
    }

    // Verificación de la contraseña
    const password = $('#password').val();
    const passwordConfirm = $('#passwordConfirm').val();
    if (password !== passwordConfirm || password.length < 8) {
        showToast('Las contraseñas no coinciden o son demasiado cortas.');
        event.preventDefault();
        return;
    }

    event.preventDefault();
    const data = {
        nombre: $('input[name="nombre"]').val(),
        email: $('input[name="email"]').val(),
        rol: $('#rol').val(),
        password: password,
        facultad: $('#facultad').val(),
        telefonoCompleto: $('#dropdownMenuButton').text() + $('input[name="telefono"]').val()
    };

    $.ajax({
        url: '/auth/register',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function() {
            showToast('Registro exitoso. Redirigiendo a la página de inicio de sesión...');
            setTimeout(() => {
                window.location.href = '/';
            }, 3000); 
        },
        error: function(jqXHR, statusText, errorThrown) {
            if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
                showToast('Errores en el registro: ' + jqXHR.responseJSON.message);
            } else {
                $('body').html(jqXHR.responseText).css({
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh'
                });
            }
        }
    });
});

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