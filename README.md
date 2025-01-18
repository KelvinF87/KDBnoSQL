
# KDBNoSQL

## Introducción
KDBNoSQL es una aplicación web que permite gestionar archivos JSON de manera sencilla y eficiente. Este manual proporciona instrucciones detalladas sobre cómo utilizar la aplicación, desde la creación de usuarios hasta la manipulación de archivos JSON.

## Requisitos Previos
- Navegador web moderno (Chrome, Firefox, Edge, etc.)
- Conexión a internet para acceder a la aplicación
- Node.js y npm instalados para ejecutar el servidor localmente

## Instalación y Ejecución del Servidor

### Clonar el Repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd KDBNoSQL
```

### Instalar Dependencias
```bash
npm install
```

### Ejecutar el Servidor
```bash
node server.js
```

## Acceder a la Aplicación
Abre tu navegador y ve a [http://localhost:3000/admin](http://localhost:3000/admin).

## Interfaz de Usuario
La interfaz de usuario de KDBNoSQL está dividida en tres secciones principales:

1. **Login**
   - Ingresa tu nombre de usuario y contraseña.
   - Haz clic en el botón "Login".
   - Si no tienes una cuenta, haz clic en "Create User" para crear una nueva.

2. **Crear Usuario**
   - Ingresa un nombre de usuario y una contraseña.
   - Haz clic en el botón "Create User".

3. **Aplicación Principal**
   - **Crear Archivo JSON**: Ingresa el nombre del archivo y haz clic en "Create".
   - **Listar Archivos JSON**: Selecciona un archivo del menú desplegable para ver su contenido.
   - **Ver y Editar Archivos JSON**: Selecciona un archivo, realiza cambios y guarda con "Save Changes".
   - **Eliminar Archivo JSON**: Selecciona un archivo y haz clic en "Delete Selected File".
   - **Tabla de Datos**: Filtra los datos ingresando texto en el campo de filtro.

## Uso de la API

### Iniciar Sesión
**Endpoint:** `POST /login`

**Cuerpo de la Solicitud:**
```json
{
  "username": "tu_usuario",
  "password": "tu_contraseña"
}
```

**Respuesta:**
```json
{
  "token": "tu_token"
}
```

**Ejemplo en JavaScript:**
```javascript
fetch('http://localhost:3000/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'tu_usuario', password: 'tu_contraseña' })
})
.then(response => response.json())
.then(data => {
  console.log('Token:', data.token);
  localStorage.setItem('token', data.token);
})
.catch(error => console.error('Error al iniciar sesión:', error));
```

### Listar Archivos JSON
**Endpoint:** `GET /list-json`

**Encabezados de la Solicitud:**
```json
{
  "Authorization": "Bearer tu_token"
}
```

**Respuesta:**
```json
[
  "archivo1.json",
  "archivo2.json"
]
```

### Crear un Archivo JSON
**Endpoint:** `POST /create-json`

**Cuerpo de la Solicitud:**
```json
{
  "fileName": "nombre_del_archivo"
}
```

**Encabezados de la Solicitud:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer tu_token"
}
```

**Respuesta:**
```json
{
  "message": "Archivo JSON creado"
}
```

## Ayuda y Soporte
Si tienes alguna pregunta o necesitas ayuda, puedes abrir el modal de ayuda haciendo clic en el botón "?" en la esquina inferior derecha de la aplicación.

## Conclusión
KDBNoSQL es una herramienta poderosa y flexible para la gestión de archivos JSON. Este manual proporciona una guía completa para utilizar la aplicación de manera efectiva. Si tienes alguna sugerencia o encuentras algún problema, no dudes en contactarnos.

## Licencia
El código fuente de KDBNoSQL está sujeto a los términos de la siguiente licencia:

**Permisos:**
- Usar, copiar, modificar y distribuir el software con atribución clara a Kelvin José Familia Adames.

**Condiciones:**
- Incluir una copia de esta licencia en cualquier distribución.

**Sin Garantía:**
El software se proporciona "tal cual", sin garantías de ningún tipo.

**Contacto:** Kelvin José Familia Adames - [https://github.com/KelvinF87](https://github.com/KelvinF87)
