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
                window.location.href = '/?success=true&type=psw'; 
            },
            error: function(xhr) {
                var errorMessage = xhr.status + ': ' + xhr.statusText;
                alert('Error - ' + errorMessage);  
            }
        });
    }
});

