// public/js/admin.js

document.addEventListener('DOMContentLoaded', () => {
  // (Req: CSRF) El token se inyecta en <script> en el EJS
  // @ts-ignore
  const CSRF_TOKEN = window.csrfToken || '';

  // --- Lógica para Eliminar Usuario ---
  document.querySelectorAll('button.btn-danger').forEach(button => {
    button.addEventListener('click', async (e) => {
      // @ts-ignore
      const id = e.target.dataset.userId;
      if (!id) return;

      if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
        return;
      }

      try {
        const res = await fetch(`/admin/users/${id}`, {
          method: 'DELETE',
          headers: {
            'CSRF-Token': CSRF_TOKEN // (Req: CSRF)
          }
        });

        if (res.ok) {
          // Si se elimina, recargar la página para ver la lista actualizada
          location.reload();
        } else {
          const errorMsg = await res.text();
          alert(`Error al eliminar: ${errorMsg}`);
        }
      } catch (err) {
        alert('Error de red al eliminar usuario.');
      }
    });
  });

  // --- Lógica para Cambiar Rol ---
  document.querySelectorAll('select.form-select').forEach(select => {
    select.addEventListener('change', async (e) => {
      // @ts-ignore
      const id = e.target.dataset.userId;
      // @ts-ignore
      const role = e.target.value;
      if (!id) return;

      try {
        const res = await fetch(`/admin/users/${id}/role`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CSRF-Token': CSRF_TOKEN // (Req: CSRF)
          },
          body: JSON.stringify({ role })
        });

        if (res.ok) {
          alert('Rol actualizado correctamente.');
        } else {
          const errorMsg = await res.text();
          alert(`Error al actualizar rol: ${errorMsg}`);
        }
      } catch (err) {
        alert('Error de red al actualizar rol.');
      }
    });
  });
});