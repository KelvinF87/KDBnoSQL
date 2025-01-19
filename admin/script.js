let codeMirrorInstance;
const baseUrl = 'http://localhost:3000';
let tableDataLocal = null;
let currentFileName = null;
const myToken = document.getElementById('myToken');

// Function to get the token from local storage
function getToken() {
    return localStorage.getItem('token');
}

// Function to check if the user is logged in based on token availability
function isLoggedIn() {
    return !!getToken();
}
myToken.innerText = `${getToken()}`;
// Function to display an error message
function displayError(message) {
    const errorContainer = document.getElementById('errorContainer');
    const errorMessage = document.getElementById('errorMessage');
    errorContainer.classList.remove('hidden');
    errorMessage.textContent = message;
    setTimeout(() => {
        errorContainer.classList.add('hidden');
    }, 3000);
}

// Function to fetch and display list of JSON files
async function fetchFileList() {
    try {
        const token = getToken();
        const response = await fetch(`${baseUrl}/list-json`, {
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            displayError("Error loading collections. Please log in again.");
          
            localStorage.removeItem('token');
            window.location.href = '/admin/index.html';
            return;
        }
        const files = await response.json();
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';
         files.forEach(fileName => {
                const listItem = document.createElement('li');
                listItem.textContent = fileName;
                listItem.addEventListener('click', () => loadFile(fileName));
                 if (fileName === currentFileName) {
                    listItem.classList.add('active');
                 }
                fileList.appendChild(listItem);
         });
    } catch (error) {
        displayError(`Error fetching file list: ${error.message}`);
    }
}

// Function to load the content of a JSON file
async function loadFile(fileName, isTableView = false) {
    try {
         document.querySelectorAll('#fileList li').forEach(li => li.classList.remove('active'));
        const token = getToken();
         const response = await fetch(`${baseUrl}/get-json-content?fileName=${fileName}`, {
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            displayError(`Error loading file: ${response.statusText}`);
            return;
        }
        const data = await response.json();
         if (!isTableView) {
            const jsonString = JSON.stringify(data, null, 2);
            codeMirrorInstance.setValue(jsonString);
        }
        document.getElementById('selectedFileName').textContent = fileName;
        // Enable the save and delete buttons
        toggleButtons(true);
         tableDataLocal = data
        // Generate Table
         currentFileName = fileName;
          const activeListItem =  Array.from(document.querySelectorAll('#fileList li')).find(li => li.textContent === fileName)
          activeListItem?.classList.add('active')
        generateTable(tableDataLocal);
        return data;
    } catch (error) {
        displayError(`Error loading file content: ${error.message}`);
         return null;
    }
}

// Function to generate a table from JSON data
function generateTable(data) {
    const tableHeader = document.getElementById('jsonTableHeader');
    const tableBody = document.getElementById('jsonTableBody');
    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';
     let isObject = Array.isArray(data) && data.length > 0 && typeof data[0] === 'object';
    // Render data as a table if it's an array of objects.
    if (isObject) {
        const headers = Object.keys(data[0]);
        const headerRow = document.createElement('tr');

        headers.forEach(headerText => {
            const header = document.createElement('th');
            header.textContent = headerText;
             headerRow.appendChild(header);
        });
        const addHeaderButton = document.createElement('th');
        const button = document.createElement('button')
          button.innerText = "+"
            button.addEventListener('click', () => {
                const newHeader = prompt('Enter the new field name:');
                 if(newHeader){
                     data.forEach(item => item[newHeader] = null);
                     generateTable(data)
                    }
           })
         addHeaderButton.appendChild(button)
        headerRow.appendChild(addHeaderButton)
        tableHeader.appendChild(headerRow);

       data.forEach(item => {
            const dataRow = document.createElement('tr');
            headers.forEach(header => {
                const dataItem = document.createElement('td');
                 let value = item[header];
                const type = typeof value;
                 let valueString = String(value);
                if (Array.isArray(value)) {
                    valueString = `[${value.map(val => String(val)).join(', ')}]`;
                } else if (type === 'object' && value !== null) {
                    valueString = `{${Object.keys(value).map(key => `${key}:${String(value[key])}`).join(', ')}}`;
               }
                dataItem.textContent = valueString;
                 dataItem.classList.add(type);
                dataItem.contentEditable = true;
                   dataItem.addEventListener('input', (event) => {
                        item[header] = event.target.textContent;
                   });
                dataRow.appendChild(dataItem);
             });
           const deleteButtonCell = document.createElement('td');
            const deleteButton = document.createElement('button');
            deleteButton.innerText = 'Delete';
             deleteButton.addEventListener('click', () => {
                const index = data.indexOf(item);
                if (index > -1) {
                    data.splice(index, 1);
                   generateTable(data);
                }
            });
             deleteButtonCell.appendChild(deleteButton);
            dataRow.appendChild(deleteButtonCell);
           tableBody.appendChild(dataRow);
        });
        // Add row button
       const addRowButton = document.createElement('button');
         addRowButton.innerText = 'Add Row';
        addRowButton.addEventListener('click', () => {
            const newItem = {};
             headers.forEach(header => newItem[header] = null);
             data.push(newItem);
            generateTable(data);
        });
        tableBody.appendChild(addRowButton);
    } else {
        tableHeader.innerHTML = '<th>Value</th><th>Type</th>';
        const row = document.createElement('tr');
        const valueTd = document.createElement('td');
         let valueString = String(data)
        const type = typeof data;
            if(Array.isArray(data)){
             valueString = `[${data.map(val => String(val))}]`
           }else if(type === 'object' && data !== null){
            valueString = `{${Object.keys(data).map(key => `${key}:${String(data[key])}`)}}`
           }
         valueTd.textContent = valueString;
        valueTd.classList.add(type)
        valueTd.contentEditable = true;
          valueTd.addEventListener('input', (event) => {
                 data = event.target.textContent;
           });

        row.appendChild(valueTd);
         const typeTd = document.createElement('td');
        typeTd.textContent = type;
        row.appendChild(typeTd);
        tableBody.appendChild(row);
     }
}


// Function to save the content of a JSON file
async function saveFile() {
    try {
        const fileName = document.getElementById('selectedFileName').textContent;
        const token = getToken();
        const editorContent = codeMirrorInstance.getValue();
        let content;
         try {
              content = JSON.parse(editorContent);
        } catch(error){
          content = editorContent
        }
        const response = await fetch(`${baseUrl}/save-json-content`, {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fileName, content })
        });
        if (!response.ok) {
            displayError(`Error saving file: ${response.statusText}`);
            return;
        }
         displayError("File saved successfully!");
         // Refresh the editor content
          if(document.getElementById('tableView').style.display === 'none'){
            loadFile(fileName)
        }
    } catch (error) {
        displayError(`Error saving file: ${error.message}`);
    }
}
// Function to delete the content of a JSON file
async function deleteFile() {
    const fileName = document.getElementById('selectedFileName').textContent;
    if (confirm('Are you sure you want to delete this file?')) {
         try {
             const token = getToken();
            const response = await fetch(`${baseUrl}/delete-json`, {
                method: 'DELETE',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fileName })
            });
            if (!response.ok) {
                displayError(`Error deleting file: ${response.statusText}`);
                 return;
            }
             displayError("File deleted successfully!");
           // Clear the editor content
           codeMirrorInstance.setValue('');
            document.getElementById('selectedFileName').textContent = 'Select a file';
            // Disable the save and delete buttons
            toggleButtons(false);
            // Refresh the file list
             fetchFileList();
        } catch (error) {
            displayError(`Error deleting file: ${error.message}`);
        }
     }
}

// Function to create a new JSON file
async function createFile() {
      const fileName = prompt('Enter the new file name:');
        if(fileName){
           try {
                const token = getToken();
                //const uniqueId = Math.floor(100000 + Math.random() * 900000).toString()
                 const defaultData =  [{"id":"value", "name": "value"}]
                const response = await fetch(`${baseUrl}/create-json`, {
                    method: 'POST',
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json'
                    },
                      body: JSON.stringify({ fileName: `${fileName}`,content: defaultData }),
                 });
                if (!response.ok) {
                     displayError(`Error creating new file: ${response.statusText}`);
                     return;
                }
                 displayError("File created successfully!")
                // Refresh the file list
                  fetchFileList();
                // Initialize with a default structure
                  const jsonString = JSON.stringify(defaultData, null, 2);
                  codeMirrorInstance.setValue(jsonString)
           } catch (error) {
               displayError(`Error creating new file: ${error.message}`);
           }
        }
}


// Function to log in the user
async function login(username, password) {
    try {
        const response = await fetch(`${baseUrl}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        const errorDiv = document.getElementById('loginError');
        if (!response.ok) {
            const data = await response.json();
            errorDiv.innerText = data.message;
            return;
        }
        const data = await response.json();
        errorDiv.innerText = "";
        localStorage.setItem('token', data.token);
        window.location.href = '/admin/dashboard.html';
    } catch (error) {
        displayError(`Error during login: ${error.message}`);
    }
}

// Function to logout the user
async function logout() {
    try {
        const token = getToken();
        const response = await fetch(`${baseUrl}/logout`, {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            return;
        }
        localStorage.removeItem('token');
         localStorage.removeItem('lastSelectedFile');
        window.location.href = '/admin/index.html';
    } catch (error) {
        displayError(`Error during logout: ${error.message}`);
    }
}

// Function to format JSON code
function formatJSON() {
    try {
        const editorContent = codeMirrorInstance.getValue();
        const formattedJSON = JSON.stringify(JSON.parse(editorContent), null, 2);
        codeMirrorInstance.setValue(formattedJSON);
        displayError("JSON formatted!");
    } catch (error) {
        displayError(`Error formatting JSON: ${error.message}`);
    }
}

// Toggle between editor and table view
function toggleView(view) {
    const editorView = document.getElementById('editorView');
    const tableView = document.getElementById('tableView');
    const editorViewBtn = document.getElementById('editorViewBtn');
    const tableViewBtn = document.getElementById('tableViewBtn');
    const saveBtn = document.getElementById('saveBtn');
    const loadTableBtn = document.getElementById('loadTableBtn');
    const fileName = document.getElementById('selectedFileName').textContent;
    switch (view) {
        case 'editor':
            editorView.style.display = 'block';
            tableView.style.display = 'none';
            editorViewBtn.classList.add('active');
            tableViewBtn.classList.remove('active');
             saveBtn.style.display = 'block';
            loadTableBtn.style.display = 'none';
            break;
        case 'table':
            tableView.style.display = 'block';
            editorView.style.display = 'none';
            tableViewBtn.classList.add('active');
            editorViewBtn.classList.remove('active');
             saveBtn.style.display = 'none';
            loadTableBtn.style.display = 'block';
            if(fileName) loadFile(fileName,true)
            break;
    }
}

// Function to toggle save and delete buttons
function toggleButtons(enable) {
    document.getElementById('saveBtn').disabled = !enable;
    document.getElementById('deleteBtn').disabled = !enable;
    document.getElementById('formatBtn').disabled = !enable;
}

// Initialize CodeMirror
const jsonEditor = document.getElementById('jsonEditor');
if (jsonEditor) {
    codeMirrorInstance = CodeMirror.fromTextArea(jsonEditor, {
        mode: 'application/json',
        lineNumbers: true,
        theme: 'default'
    });
}

// Handle login form submission
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        await login(username, password);
    });
}

// Attach event listeners
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
}

const createFileBtn = document.getElementById('createFileBtn');
if (createFileBtn) {
    createFileBtn.addEventListener('click', createFile);
}
const saveBtn = document.getElementById('saveBtn');
if (saveBtn) {
    saveBtn.addEventListener('click', saveFile);
}

const deleteBtn = document.getElementById('deleteBtn');
if (deleteBtn) {
    deleteBtn.addEventListener('click', deleteFile);
}

const formatBtn = document.getElementById('formatBtn');
if (formatBtn) {
    formatBtn.addEventListener('click', formatJSON);
}

const editorViewBtn = document.getElementById('editorViewBtn');
if (editorViewBtn) {
    editorViewBtn.addEventListener('click', () => toggleView('editor'));
}

const tableViewBtn = document.getElementById('tableViewBtn');
if (tableViewBtn) {
    tableViewBtn.addEventListener('click', () => toggleView('table'));
}

const loadTableBtn = document.createElement('button');
loadTableBtn.textContent = 'Load JSON';
loadTableBtn.id = 'loadTableBtn'
document.querySelector('section.file-content .file-header div').appendChild(loadTableBtn);

loadTableBtn.addEventListener('click',async () => {
         const fileName = document.getElementById('selectedFileName').textContent;
          if(fileName) {
              const data =  tableDataLocal;
                if(data) {
                    generateTable(data)
                       const jsonString = JSON.stringify(data, null, 2);
                     codeMirrorInstance.setValue(jsonString);
                  }  else {
                       const data =  await loadFile(fileName,true);
                         if(data) {
                           tableDataLocal = data;
                            generateTable(tableDataLocal);
                             const jsonString = JSON.stringify(tableDataLocal, null, 2);
                             codeMirrorInstance.setValue(jsonString);
                       }
              }
                   await saveFile()
            }
});

// Redirect to dashboard if user is already logged in
if (window.location.pathname === '/admin/index.html') {
    if (isLoggedIn()) {
        window.location.href = '/admin/dashboard.html';
    }
} else if (window.location.pathname === '/admin/dashboard.html') {
    if (!isLoggedIn()) {
        window.location.href = '/admin/index.html';
    } else {
        fetchFileList(); // Load file list
    }
//     const user =  jwt.decode(getToken())
//     const dashboard = document.querySelector('.container');
//     const userInfoDiv = document.createElement('div');
//     userInfoDiv.id = 'userInfo'
//     userInfoDiv.innerHTML = `
//        <h3>Logged in as: ${user.username}</h3>
//         <div id="tokenContainer" style="display: none;">
//             <p>Token: ${getToken()}</p>
//         </div>
//         <button id="toggleTokenButton">Show Token</button>
//     `
//     dashboard.prepend(userInfoDiv)
//     document.getElementById('toggleTokenButton').addEventListener('click', () => {
//         const tokenContainer = document.getElementById('tokenContainer');
//         const button = document.getElementById('toggleTokenButton')
//         if (tokenContainer.style.display === 'none') {
//              tokenContainer.style.display = 'block';
//              button.textContent = 'Hide Token'
//         } else {
//            tokenContainer.style.display = 'none';
//            button.textContent = 'Show Token'
//         }
//    });
}
const tokenContainer = document.getElementById('tokenContainer');
const toggleTokenButton = document.getElementById('toggleTokenButton');
  if (tokenContainer) {
  toggleTokenButton.addEventListener('click', () => {
      const token = document.getElementById('myToken');
      if (tokenContainer.style.display === 'none') {
          tokenContainer.style.display = 'block';
          toggleTokenButton.textContent = '🔐';
      } else {
          tokenContainer.style.display = 'none';
           toggleTokenButton.textContent = '👁️';
      }
  });
}