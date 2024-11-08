
setTimeout(function() {
    const urlParams = new URLSearchParams(window.location.search);
    console.log(urlParams);  // Verifica que contiene el parámetro 'success'
    if (urlParams.get('success') === 'true') {
        const toast = new bootstrap.Toast(document.getElementById('myToast'));
        toast.show(); // Mostrar el toast
    }
}, 500);



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
