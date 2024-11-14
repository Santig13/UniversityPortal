document.addEventListener('DOMContentLoaded', function(params) {
    // cargar facultades
    $.ajax({
        url: '/facultades',
        method: 'GET',
        success: function(data) {
            const facultadSelect = document.getElementById('facultad');
            data.forEach(facultad => {
                const option = document.createElement('option');
                option.value = facultad.nombre;
                option.textContent = facultad.nombre;
                facultadSelect.appendChild(option);
            });
        },
        error: function() {
            showToast('Error al cargar las facultades');
        }
    });

    // cambiar el prefijo del tlf
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const prefix = this.getAttribute('data-prefix');
            document.getElementById('dropdownMenuButton').textContent = prefix;
        });
    });

    document.getElementById('passwordConfirm').addEventListener('keyup', function () {
        const password = document.querySelector('input[name="password"]').value;
        const passwordConfirm = this.value;
        const message = document.getElementById('passwordMessage');
        
        if (passwordConfirm === '') {
            message.textContent = '';
        } else if (password === passwordConfirm) {
            message.textContent = 'Las contraseñas coinciden';
            message.style.color = 'green';
        } else {
            message.textContent = 'Las contraseñas no coinciden';
            message.style.color = 'red';
        }
    });

    document.getElementById('registerButton').addEventListener('click', function(event) {
        var password = document.getElementById('password');
        var passwordConfirm = document.getElementById('passwordConfirm');
        var passwordMessage = document.getElementById('passwordMessage');
    
        if (password.value !== passwordConfirm.value) {
            event.preventDefault();
    
            // Mostrar mensaje de error en el campo de confirmación
            passwordConfirm.setCustomValidity('Las contraseñas no coinciden');
            passwordConfirm.reportValidity();
        } else {
            passwordMessage.textContent = '';
            passwordConfirm.setCustomValidity(''); // Restablecer validez si coinciden
        }
    });
});

// Hacer post cuando se registre un usuario
document.getElementById('registerButton').addEventListener('click', async function(event) {
    const formCheck = document.querySelector('form');
    const requiredFields = formCheck.querySelectorAll('input[required], select[required]');
    let allFieldsFilled = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            allFieldsFilled = false;
        } 
    });

    // Solo continua si todos los campos están llenos
    if (!allFieldsFilled) {
        showToast('Por favor, complete todos los campos obligatorios.');
        event.preventDefault();
        return;
    }

    // Verificación de la contraseña
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    if (password !== passwordConfirm || password.length < 8) {
        showToast('Las contraseñas no coinciden o son demasiado cortas.');
        event.preventDefault();
        return;
    }

    event.preventDefault();
    const form = document.querySelector('form');
    const formData = new FormData(form);
        // Añadir el prefijo al teléfono
        const prefix = document.getElementById('dropdownMenuButton').textContent;

    const data = Object.fromEntries(formData.entries());

    data.telefonoCompleto = prefix + data.telefono;
    
    delete data.passwordConfirm; // No enviar la confirmación de la contraseña
    delete data.telefono; // No enviar el teléfono sin prefijo


    $.ajax({
        url: '/auth/register',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(jqXHR) {
            showToast('Registro exitoso. Redirigiendo a la página de inicio de sesión...');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000); 
        },
        error: function(jqXHR, textStatus, errorThrown) {
            if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
                showToast('Error en el registro: ' + jqXHR.responseJSON.message);
                console.log(jqXHR.responseJSON.message);
            } else {
                document.body.innerHTML = jqXHR.responseText;
                document.body.style.display = 'flex';
                document.body.style.justifyContent = 'center';
                document.body.style.alignItems = 'center';
                document.body.style.height = '100vh';
            }
        }
    });
});

function showToast(message) {
    const toastElement = document.getElementById('myToast');
    const toastBody = toastElement.querySelector('.toast-body');
    toastBody.textContent = message;
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}