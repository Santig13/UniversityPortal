"use strict";

// Logica botón mostrar/ocultar contraseña
$('#togglePassword').click(function () {
    const passwordField = $('#contrasena');
    const passwordFieldType = passwordField.attr('type');
    if (passwordFieldType === 'password') {
        passwordField.attr('type', 'text');
        $(this).html('<i class="bi bi-eye-slash"></i>');
    } else {
        passwordField.attr('type', 'password');
        $(this).html('<i class="bi bi-eye"></i>');
    }
});

// hacer post a /auth/recover
$('#recoverButton').click(function(event) {
    event.preventDefault();
    const email = $('#recoverEmail').val();
    if (!email) {
        showToast('Error en la recuperación de contraseña: Debe introducir un correo');
        return;
    }
    $('#recoverPasswordModal').modal('hide');
    showToast('Enviando correo de recuperación de contraseña...');
    $.ajax({
        url: '/auth/recuperar',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ email }),
        success: function(data, statusText, jqXHR) {
            $('#recoverPasswordModal').modal('hide');
            $('#recoverEmail').val('');
            showToast(data.message);
        },
        error: function(jqXHR, statusText, errorThrown) {
            if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
                showToast('Error en la recuperación de contraseña: ' + jqXHR.responseJSON.message);
                $('#recoverEmail').val('');
            } else {
                // Mostrar error en la página con ejs
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

//hacer post a /login
$('#loginButton').click(function(event) {
    event.preventDefault();
    const email = $('#usuario').val();
    const password = $('#contrasena').val();
    const data = { email, password };

    $.ajax({
        url: '/auth/login',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function() {
            // Redirigir al dashboard si el login es exitoso
            window.location.href = '/dashboard';
        },
        error: function(jqXHR, textStatus, errorThrown) {
            if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
                showToast('Error en el inicio de sesión: ' + jqXHR.responseJSON.message);
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
