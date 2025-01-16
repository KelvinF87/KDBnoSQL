const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());
app.use('/admin', express.static(path.join(__dirname, 'admin')));

const db = new sqlite3.Database('./database.db');
const SECRET_KEY = 'your_secret_key';

// Crear tabla de usuarios si no existe
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)");
});

// Función para encriptar la clave
function encryptKey(key, secret) {
    const iv = crypto.randomBytes(16); // Vector de inicialización
    const cipher = crypto.createCipheriv('aes-256-cbc', secret, iv);
    let encrypted = cipher.update(key, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted
    };
}

// Generar una clave de encriptación válida
const encryptionKey = crypto.randomBytes(32);

// Clave a encriptar
const key = 'my_super_secret_key';

// Encriptar la clave
const encryptedKey = encryptKey(key, encryptionKey);

// Guardar la clave encriptada en un archivo JSON
fs.writeFileSync('superkey.json', JSON.stringify(encryptedKey, null, 2));

console.log('Clave encriptada y guardada en superkey.json');

// Ruta para listar archivos JSON
app.get('/list-json', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const jsonDirectory = path.join(__dirname, 'json', userId.toString());
    fs.readdir(jsonDirectory, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to scan directory: ' + err });
        }
        const jsonFiles = files.filter(file => path.extname(file).toLowerCase() === '.json');
        res.json(jsonFiles);
    });
});

// Ruta para obtener el contenido de un archivo JSON
app.get('/get-json-content', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const fileName = req.query.fileName;
    const filePath = path.join(__dirname, 'json', userId.toString(), fileName);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to read file: ' + err });
        }
        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData);
        } catch (parseError) {
            res.status(500).json({ error: 'Unable to parse JSON: ' + parseError });
        }
    });
});

// Ruta para crear un archivo JSON
app.post('/create-json', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { fileName } = req.body;
    const uniqueId = Math.floor(100000 + Math.random() * 900000).toString(); // ID único de 6 dígitos
    const filePath = path.join(__dirname, 'json', userId.toString(), `${uniqueId}_${fileName}.json`);
    fs.writeFile(filePath, JSON.stringify({}), (err) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to create file: ' + err });
        }
        res.json({ message: 'File created successfully' });
    });
});

// Ruta para guardar cambios en un archivo JSON
app.post('/save-json-content', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { fileName, content } = req.body;
    const filePath = path.join(__dirname, 'json', userId.toString(), fileName);
    fs.writeFile(filePath, JSON.stringify(content, null, 2), (err) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to save file: ' + err });
        }
        res.json({ message: 'File saved successfully' });
    });
});

// Ruta para eliminar un archivo JSON
app.delete('/delete-json', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { fileName } = req.body;
    const filePath = path.join(__dirname, 'json', userId.toString(), fileName);
    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to delete file: ' + err });
        }
        res.json({ message: 'File deleted successfully' });
    });
});

// Ruta para crear un usuario
app.post('/create-user', (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
    stmt.run(username, hashedPassword, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        fs.mkdirSync(path.join(__dirname, 'json', this.lastID.toString()));
        res.json({ message: 'User created successfully' });
    });
    stmt.finalize();
});

// Ruta para iniciar sesión
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const stmt = db.prepare("SELECT * FROM users WHERE username = ?");
    stmt.get(username, (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (user && bcrypt.compareSync(password, user.password)) {
            const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY);
            res.json({ token });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    });
    stmt.finalize();
});

// Ruta para cerrar sesión
app.post('/logout', (req, res) => {
    res.json({ message: 'Logout successful' });
});

// Middleware para autenticar el token
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (token) {
        jwt.verify(token, SECRET_KEY, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
}

// Nueva ruta para servir admin/index.html
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
