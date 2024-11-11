
// Mostrar toast con mensaje de éxito o error
setTimeout(function() {
    const urlParams = new URLSearchParams(window.location.search);
    let message;
    if(urlParams.get('fail') === 'true'){
        if(urlParams.get('type') === 'recover'){
            message = 'Error en la recuperación de contraseña: El correo introducido no existe';
            document.getElementById('recoverEmail').value = '';
        }
        showToast(message);
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


//hacer post a /login
document.getElementById('loginButton').addEventListener('click', async function (event) {
    event.preventDefault();
    const form = document.getElementById('loginForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const contentType = response.headers.get('content-type');
        if (!response.ok) {
            if(contentType && contentType.includes('application/json')){
            const error = await response.json();
            showToast('Error en el inicio de sesión: ' + error.message);
            }
            else{
                const html = await response.text();
                document.body.innerHTML = html;
                document.body.innerHTML = html;
                document.body.style.display = 'flex';
                document.body.style.justifyContent = 'center';
                document.body.style.alignItems = 'center';
                document.body.style.height = '100vh';
            }
        }
        else{
            // Redirigir al dashboard si el login es exitoso
            window.location.href = '/dashboard';
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error en el inicio de sesión: ' + error.message);
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