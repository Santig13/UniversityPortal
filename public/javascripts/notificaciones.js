//Marcar como leido las notificaciones
$(document).ready(function () {
    $.ajax({
        url: `/notificaciones/leido`,
        method: 'post',
        success: function(eventos) {
            
        },
        error: function() {
            showToast('Error al filtrar los eventos');
        }
    });
});