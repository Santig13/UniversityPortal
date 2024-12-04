"use strict";
// Mensaje contraseñas
$('#passwordConfirm').on('keyup', function () {
    const password = $('input[name="password"]').val();
    const passwordConfirm = $(this).val();
    const message = $('#passwordMessage');
    
    if (passwordConfirm === '') {
        message.text('');
    } else if (password === passwordConfirm) {
        message.text('Las contraseñas coinciden').css('color', 'green');
    } else {
        message.text('Las contraseñas no coinciden').css('color', 'red');
    }
});

$('#updateProfileForm').on('keydown', function(e) {
    // Si se pulsa enter y se está haciendo focus en el botón
    if (e.key === 'Enter' && $(document.activeElement).is('#btnActualizarPerfil')) {	
        e.preventDefault();
        $(this).submit();
    }
});
// Actualizar perfil
$('#updateProfileForm').on('submit', function (e) {
    e.preventDefault();
    const password = $('input[name="password"]').val();
    const passwordConfirm = $('input[name="passwordConfirm"]').val();
    const phonePrefix = $('#dropdownMenuButton').text();
    const phoneNumber = $('input[name="telefono"]').val();
    const fullPhoneNumber = phonePrefix + phoneNumber;
    $('input[name="telefonoCompleto"]').val(fullPhoneNumber);
    if (password === passwordConfirm) {
        
        $.ajax({
            url: `/usuarios/${userId}/actualizar`,
            method: 'PUT',
            data: $(this).serialize(),
            success: function (response) {
                if (response === 'ok') {
                    showToast('Datos actualizados correctamente');
                } else {
                    showToast('Error al actualizar los datos');
                }
            },
            error: function (jqXHR) {
                
                showToast('Error: ' + jqXHR.responseJSON.message);
            }
        });
    } else {
        showToast('Las contraseñas no coinciden');
    }
});

// Poner los datos del usuario en el formulario
$(document).ready(function () {
    $.ajax({
        url: `/usuarios/${userId}/datos`,
        method: 'GET',
        success: function (response) {

            const phone = response.telefono;

            const prefix = phone.slice(0, 3); 
            const phoneNumber = phone.slice(3); 

            $('input[name="telefono"]').val(phoneNumber);
            $('#dropdownMenuButton').text(prefix);
            $(`input[name="nombre"]`).val(response.nombre);
            $(`.dropdown-menu a[data-prefix="${prefix}"]`).addClass('active');
        },
        error: function (jqXHR) {
            console.error('Error al obtener datos:', jqXHR.responseText);
        }
    });

    $('.dropdown-menu a').on('click', function (e) {
        e.preventDefault();

        const selectedPrefix = $(this).data('prefix');
        $('#dropdownMenuButton').text(selectedPrefix);

        const currentNumber = $('#telefono').val();
        $('#telefonoCompleto').val(selectedPrefix + currentNumber);

        $('.dropdown-menu a').removeClass('active');
        $(this).addClass('active');
    });

});

// hacer un get a accesibilidad para obtener las preferencias del usuario y mostrarlas en el form
$(document).ready(function () {
    $.ajax({
        url: `/usuarios/${userId}/accesibilidad`,
        method: 'GET',
        success: function (response) {
            $('#theme').val(response.paleta); 
            $('#navigation').val(response.navegacion); 
            $('#fontSize').val(response.tamañoTexto); 
        },
        error: function (jqXHR) {
            console.error('Error al obtener las preferencias de accesibilidad:', jqXHR.responseText);
        }
    });
});

$('#accessibilityForm').on('keydown', function(e) {
    if (e.key === 'Enter' && $(document.activeElement).is('#btnActualizarAccesibilidad')) {
        e.preventDefault();
        $(this).submit();
    }
});
//Guardar preferencias de accesibilidad
$('#accessibilityForm').on('submit', function(e) {
    e.preventDefault();
    
    $.ajax({
        url: `/usuarios/${userId}/accesibilidad`,
        method: 'PUT',
        data: $(this).serialize(),
        success: function(response) {
            if (response === 'ok') {
                showToast('Preferencias guardadas correctamente, recarga la página para aplicar los cambios');
                Cookies.remove('theme');
                Cookies.remove('fontSize');
                Cookies.remove('navigationMode');
            } else {
                showToast('Error al guardar las preferencias');
            }
        },
        error: function(jqXHR) {
            console.error('Error al guardar las preferencias:', jqXHR.responseText);
        }
    });
});
// Cambiar el prefijo del teléfono
$('#prefix-de, #prefix-uk, #prefix-es, #prefix-fr').on('click', function(e) {
    e.preventDefault(); 
    const prefix = $(this).data('prefix'); 
    $('#dropdownMenuButton').text(prefix); 
});


