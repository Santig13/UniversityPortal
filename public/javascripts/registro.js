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
        console.log(error);
    }

    // cambiar el prefijo del tlf
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const prefix = this.getAttribute('data-prefix');
            document.getElementById('dropdownMenuButton').textContent = prefix;
        });
    });

    // añadir prefijo al telefono
    const form = document.querySelector('form');
    form.addEventListener('submit', function(e) {
        const prefix = document.getElementById('dropdownMenuButton').textContent;
        const telefono = document.getElementById('telefono').value;
        document.getElementById('telefonoCompleto').value = prefix + telefono;
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