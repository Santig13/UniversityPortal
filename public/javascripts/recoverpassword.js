function validatePasswords() {
    var password = document.getElementById("password").value;
    var confirmPassword = document.getElementById("confirmPassword").value;
    if (password !== confirmPassword) {
        setTimeout(function() {
            const toastBody = document.querySelector('.toast-body');
            toastBody.textContent = 'Las contraseñas no coinciden';
            const toast = new bootstrap.Toast(document.getElementById('myToast'));
            toast.show(); 
        }, 200);
        setTimeout(() => toast.hide(), 5000);
        return false;
    }
    return true;
}

document.getElementById('confirmPassword').addEventListener('keyup', function () {
    const password = document.querySelector('input[name="password"]').value;
    const confirmPassword = this.value;
    const message = document.getElementById('passwordMessage');
    
    if (confirmPassword === '') {
        message.textContent = '';
    } else if (password === confirmPassword) {
        message.textContent = 'Las contraseñas coinciden';
        message.style.color = 'green';
    } else {
        message.textContent = 'Las contraseñas no coinciden';
        message.style.color = 'red';
    }
});


document.getElementById('confirmButton').addEventListener('click', function(event) {
    event.preventDefault(); 

    var email = document.getElementById('titulo').getAttribute('data-email');
    if (validatePasswords()) { 
        $.ajax({
            url: '/auth/updatepassword',  
            type: 'PATCH',  
            contentType: 'application/json',  
            data: JSON.stringify({
                email: email,
                password: document.getElementById('password').value,  
            }),
            success: function() {
                showToast('Contraseña actualizada exitosamente. Redirigiendo a la página de inicio de sesión...');
                setTimeout(() => window.location.href = '/', 3000);
            },
            error: function(xhr) {

                const contentType = xhr.getResponseHeader('content-type');

                if(contentType.includes('application/json')) {
                    var errorMessage = xhr.status + ': ' + xhr.statusText;
                    showToast('Error al actualizar la contraseña: ' + errorMessage);
                }
                else{
                    document.body.innerHTML = xhr.responseText;
                    document.body.style.display = 'flex';
                    document.body.style.justifyContent = 'center';
                    document.body.style.alignItems = 'center';
                    document.body.style.height = '100vh';
                }

               
            }
        });
    }
});

function showToast(message) {
    const toastElement = document.getElementById('myToast');
    const toastBody = toastElement.querySelector('.toast-body');
    toastBody.textContent = message;
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    setTimeout(() => toast.hide(), 5000); // Ocultar toast después de 5 segundos
}

