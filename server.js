const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());
app.use('/admin', express.static(path.join(__dirname, 'admin')));

const usersFilePath = path.join(__dirname, 'users.json');
const SECRET_KEY = 'your_secret_key';

// Función para leer el archivo de usuarios
function readUsersFile() {
    if (fs.existsSync(usersFilePath)) {
        const data = fs.readFileSync(usersFilePath, 'utf8');
        return JSON.parse(data);
    }
    return [];
}

// Función para escribir en el archivo de usuarios
function writeUsersFile(users) {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
}

// Ruta para crear un usuario
app.post('/create-user', (req, res) => {
    const { username, password } = req.body;
    const users = readUsersFile();
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = { id: users.length + 1, username, password: hashedPassword };
    users.push(newUser);
    writeUsersFile(users);
    fs.mkdirSync(path.join(__dirname, 'json', newUser.id.toString()));
    res.json({ message: 'User created successfully' });
});

// Ruta para iniciar sesión
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = readUsersFile();
    const user = users.find(user => user.username === username);
    if (user && bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY);
        res.json({ token });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
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

// Nueva ruta para servir admin/index.html
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
});
