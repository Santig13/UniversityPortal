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
            console.log(jqXHR);
            console.error('Error al obtener datos:', jqXHR.responseText);
        }
    });

    // Manejar clics en las opciones del dropdown
    $('.dropdown-menu a').on('click', function (e) {
        e.preventDefault();

        // Obtener el prefijo seleccionado
        const selectedPrefix = $(this).data('prefix');

        // Actualizar el botón del dropdown con el prefijo seleccionado
        $('#dropdownMenuButton').text(selectedPrefix);

        // Actualizar el campo oculto con el prefijo y número actual
        const currentNumber = $('#telefono').val();
        $('#telefonoCompleto').val(selectedPrefix + currentNumber);

        // Cambiar la clase activa en el dropdown
        $('.dropdown-menu a').removeClass('active');
        $(this).addClass('active');
    });

});


// Mostrar mensajes
function showToast(message) {
    const toastElement = $('#myToast');
    const toastBody = toastElement.find('.toast-body');
    toastBody.text(message);
    const toast = new bootstrap.Toast(toastElement[0]);
    toast.show();
}

// cambiar el prefijo del tlf
$('.dropdown-item').on('click', function(e) {
    e.preventDefault();
    const prefix = $(this).data('prefix');
    $('#dropdownMenuButton').text(prefix);
});


