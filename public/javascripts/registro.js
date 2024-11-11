document.addEventListener('DOMContentLoaded', async function(params) {
    // cargar facultades
    try {
        const respuesta = await fetch('/facultades');
        const data = await respuesta.json();
        const facultadSelect = document.getElementById('facultad');
        data.forEach(facultad => {
            const option = document.createElement('option');
            option.value = facultad.nombre;
            option.textContent = facultad.nombre;
            facultadSelect.appendChild(option);
            
        });
    } catch (error) {
        showToast('Error al cargar las facultades');
    }

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
    if(document.getElementById('password').value === document.getElementById('passwordConfirm').value && document.getElementById('password').value.length >= 8) {
        event.preventDefault();
        const form = document.querySelector('form');
        const formData = new FormData(form);
         // Añadir el prefijo al teléfono
         const prefix = document.getElementById('dropdownMenuButton').textContent;
    
        const data = Object.fromEntries(formData.entries());
    
        data.telefonoCompleto = prefix + data.telefono;
        
        delete data.passwordConfirm; // No enviar la confirmación de la contraseña
        delete data.telefono; // No enviar el teléfono sin prefijo
    
        try {
            const response = await fetch('/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const contentType = response.headers.get('content-type');

            if (response.ok) {
                // Mostrar un mensaje de éxito
                showToast('Registro exitoso. Redirigiendo a la página de inicio de sesión...');
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000); // Redirigir después de 2 segundos
            } else {
                if(contentType && contentType.includes('text/html')) {
                    const html = await response.text();
                    document.body.innerHTML = html;
                    document.body.style.display = 'flex';
                    document.body.style.justifyContent = 'center';
                    document.body.style.alignItems = 'center';
                    document.body.style.height = '100vh';
                } 
                else{
                    const data = await response.json();
                    showToast('Errores en el registro: ' + data.message);
                }
            } 
        } catch (error) {
            showToast('Error en el registro: ' + error.message);
        }
    }
   
});

function showToast(message) {
    const toastElement = document.getElementById('myToast');
    const toastBody = toastElement.querySelector('.toast-body');
    toastBody.textContent = message;
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}