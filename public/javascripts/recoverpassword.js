"use strict";
// Validar que las contraseñas coincidan
function validatePasswords() {
    var password = $('#password').val();
    var confirmPassword = $('#confirmPassword').val();
    if (password !== confirmPassword) {
        showToast('Las contraseñas no coinciden');
        return false;
    }
    return true;
}

// Validar que las contraseñas coincidan y mostrar mensaje
$('#confirmPassword').on('keyup', function () {
    var password = $('input[name="password"]').val();
    var confirmPassword = $(this).val();
    var message = $('#passwordMessage');
    
    if (confirmPassword === '') {
        message.text('');
    } else if (password === confirmPassword) {
        message.text('Las contraseñas coinciden').css('color', 'green');
    } else {
        message.text('Las contraseñas no coinciden').css('color', 'red');
    }
});

// Hacer patch al servidor para actualizar la contraseña
$('#confirmButton').on('click', function(event) {
    event.preventDefault(); 

    var email = $('#titulo').data('email');
    if (validatePasswords()) { 
        $.ajax({
            url: '/auth/updatepassword',  
            type: 'PATCH',  
            contentType: 'application/json',  
            data: JSON.stringify({
                email: email,
                password: $('#password').val(),  
            }),
            success: function() {
                showToast('Contraseña actualizada exitosamente. Ya puedes cerrar la ventana.');
                setTimeout(() => {
                    window.close();
                }, 5000);
            },
            error: function(jqXHR, statusText, errorThrown) {
                if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
                    showToast('Errores al actualizar la contraseña: ' + jqXHR.responseJSON.message);
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
    }
});

function showToast(message) {
    var toastElement = $('#myToast');
    var toastBody = toastElement.find('.toast-body');
    toastBody.text(message);
    toastElement.fadeIn(400, function() {
        setTimeout(() => toastElement.fadeOut(400), 5000); // Ocultar toast después de 5 segundos
    });
}
