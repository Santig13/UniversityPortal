
// Mostrar toast si el registro fue exitoso
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

