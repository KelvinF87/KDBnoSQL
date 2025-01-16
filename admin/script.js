const API_URL = 'http://localhost:3000';
let originalData = [];
let modifiedData = [];
let editor;
let token = null;

// Inicializar CodeMirror
function initEditor() {
    editor = CodeMirror(document.getElementById('jsonEditor'), {
        mode: 'application/json',
        lineNumbers: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        foldGutter: true,
        extraKeys: {
            "F11": function(cm) {
                cm.setOption("fullScreen", !cm.getOption("fullScreen"));
            },
            "Esc": function(cm) {
                if (cm.getOption("fullScreen")) cm.setOption("fullScreen", false);
            }
        }
    });

    editor.on('change', () => {
        const currentValue = editor.getValue();
        try {
            const parsedValue = JSON.parse(currentValue);
            modifiedData = parsedValue;
            document.getElementById('saveButton').style.display = 'inline-block';
            displayJsonData(parsedValue); // Actualizar la tabla dinámica
        } catch (e) {
            document.getElementById('saveButton').style.display = 'none';
        }
    });
}

// Load JSON files
function loadJsonFiles() {
    fetch(`${API_URL}/list-json`, {
        headers: {
            'Authorization': token
        }
    })
    .then(response => response.json())
    .then(files => {
        const select = document.getElementById('jsonFiles');
        select.innerHTML = '';
        files.forEach(file => {
            const option = document.createElement('option');
            option.value = file;
            option.textContent = file;
            select.appendChild(option);
        });
        if (files.length > 0) {
            loadJsonData();
        }
    })
    .catch(error => {
        console.error('Error loading JSON files:', error);
        alert('Error loading JSON files. Please check the console for details.');
    });
}

// Load JSON data from selected file
function loadJsonData() {
    const fileName = document.getElementById('jsonFiles').value;
    fetch(`${API_URL}/get-json-content?fileName=${fileName}`, {
        headers: {
            'Authorization': token
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        editor.setValue(JSON.stringify(data, null, 2));
        originalData = JSON.parse(JSON.stringify(data));
        modifiedData = JSON.parse(JSON.stringify(data));
        document.getElementById('saveButton').style.display = 'none';
        displayJsonData(data); // Mostrar la tabla dinámica
    })
    .catch(error => {
        console.error('Error loading JSON data:', error);
        alert('Error loading JSON data. Please check the console for details.');
    });
}

// Display JSON data in a table
function displayJsonData(data) {
    const tableDiv = document.getElementById('jsonTable');
    tableDiv.innerHTML = '';

    if (Array.isArray(data)) {
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // Create table header
        if (data.length > 0) {
            const headerRow = document.createElement('tr');
            Object.keys(data[0]).forEach(key => {
                const th = document.createElement('th');
                th.textContent = key;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
        }

        // Create table body
        data.forEach((item, index) => {
            const row = document.createElement('tr');
            Object.keys(item).forEach(key => {
                const td = document.createElement('td');
                const input = document.createElement('input');
                input.type = 'text';
                input.value = item[key];
                input.addEventListener('input', () => {
                    modifiedData[index][key] = input.value;
                    document.getElementById('saveButton').style.display = 'inline-block';
                });
                td.appendChild(input);
                row.appendChild(td);
            });
            tbody.appendChild(row);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        tableDiv.appendChild(table);
    } else {
        const pre = document.createElement('pre');
        pre.textContent = JSON.stringify(data, null, 2);
        tableDiv.appendChild(pre);
    }
}

// Filter table data
function filterTable() {
    const filterText = document.getElementById('filterInput').value.toLowerCase();
    const tableDiv = document.getElementById('jsonTable');
    const rows = tableDiv.querySelectorAll('tbody tr');

    rows.forEach(row => {
        const cells = row.querySelectorAll('td input');
        let match = false;

        cells.forEach(cell => {
            if (cell.value.toLowerCase().includes(filterText)) {
                match = true;
            }
        });

        row.style.display = match ? '' : 'none';
    });
}

// Create JSON file
function createJsonFile() {
    const fileName = document.getElementById('newFileName').value;
    if (confirm(`Are you sure you want to create the file "${fileName}"?`)) {
        fetch(`${API_URL}/create-json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ fileName })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            loadJsonFiles();
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
}

// Save JSON data
function saveJsonData() {
    const fileName = document.getElementById('jsonFiles').value;
    if (confirm(`Are you sure you want to save changes to the file "${fileName}"?`)) {
        try {
            const jsonContent = JSON.parse(editor.getValue());
            fetch(`${API_URL}/save-json-content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({ fileName, content: jsonContent })
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                originalData = JSON.parse(JSON.stringify(jsonContent));
                document.getElementById('saveButton').style.display = 'none';
            })
            .catch(error => {
                console.error('Error:', error);
            });
        } catch (parseError) {
            console.error('Invalid JSON:', parseError);
            alert('Invalid JSON. Please check the format.');
        }
    }
}

// Delete JSON file
function deleteJsonFile() {
    const fileName = document.getElementById('jsonFiles').value;
    if (confirm(`Are you sure you want to delete the file "${fileName}"?`)) {
        fetch(`${API_URL}/delete-json`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ fileName })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            loadJsonFiles();
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
}

// Create user
function createUser() {
    const username = document.getElementById('createUsername').value;
    const password = document.getElementById('createPassword').value;
    if (confirm(`Are you sure you want to create the user "${username}"?`)) {
        fetch(`${API_URL}/create-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            showLoginSection();
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
}

// Login
function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        token = data.token;
        localStorage.setItem('token', token);
        showAppSection();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Invalid credentials');
    });
}

// Logout
function logout() {
    fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        token = null;
        localStorage.removeItem('token');
        showLoginSection();
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Show login section
function showLoginSection() {
    document.getElementById('createUserSection').style.display = 'none';
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('appSection').style.display = 'none';
}

// Show create user section
function showCreateUserSection() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('createUserSection').style.display = 'block';
    document.getElementById('appSection').style.display = 'none';
}

// Show app section
function showAppSection() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('createUserSection').style.display = 'none';
    document.getElementById('appSection').style.display = 'block';
    initEditor();
    loadJsonFiles();
}

// Check if token exists in localStorage
function checkToken() {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
        token = storedToken;
        showAppSection();
    } else {
        showLoginSection();
    }
}

// Open help modal
function openHelpModal() {
    document.getElementById('helpModal').style.display = 'flex';
}

// Close help modal
function closeHelpModal() {
    document.getElementById('helpModal').style.display = 'none';
}

// Load login section when the page loads
window.onload = checkToken;
