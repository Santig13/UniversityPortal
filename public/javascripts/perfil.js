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