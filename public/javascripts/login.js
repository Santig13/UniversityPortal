
// Mostrar toast con mensaje de éxito o error
setTimeout(function() {
    const urlParams = new URLSearchParams(window.location.search);
    console.log(urlParams);  
    const toastBody = document.querySelector('.toast-body');
    if (urlParams.get('success') === 'true') {
        if (urlParams.get('type') === 'register') {
            toastBody.textContent = 'Registro exitoso';
        } else if (urlParams.get('type') === 'psw') {
            toastBody.textContent = 'Cambio de contraseña realizado';
        }
        const toast = new bootstrap.Toast(document.getElementById('myToast'));
        toast.show(); 
        setTimeout(() => toast.hide(), 5000); // Ocultar toast después de 5 segundos
    }
    else if(urlParams.get('fail') === 'true'){
        if (urlParams.get('type') === 'psw') {
            toastBody.textContent = 'Contraseña incorrecta';
        } else if (urlParams.get('type') === 'user') {
            toastBody.textContent = 'El usuario introducido no existe';
        }
        else if(urlParams.get('type') === 'recover'){
            toastBody.textContent = 'El correo introducido no existe';
        }
        const toast = new bootstrap.Toast(document.getElementById('myToast'));
        toast.show(); 
        setTimeout(() => toast.hide(), 5000); // Ocultar toast después de 5 segundos
    }
    
}, 200);


// Logica botón mostrar/ocultar contraseña
document.getElementById('togglePassword').addEventListener('click', function () {
    const passwordField = document.getElementById('contrasena');
    const passwordFieldType = passwordField.getAttribute('type');
    if (passwordFieldType === 'password') {
        passwordField.setAttribute('type', 'text');
        this.innerHTML = '<i class="bi bi-eye-slash"></i>';
    } else {
        passwordField.setAttribute('type', 'password');
        this.innerHTML = '<i class="bi bi-eye"></i>';
    }
});

