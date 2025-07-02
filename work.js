// IMPORTANT: Replace this with your actual Web App URL from Apps Script deployment
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzrBGuwguy6gWAkSjTDkW9LS5jKgIGf8msCKP1O7bveU2ic9GkV287K3tZEmGrVrCWh/exec';

const projectGrid = document.getElementById('projectGrid');
const tabs = document.querySelectorAll('.tab-btn');
const projectForm = document.getElementById('projectForm');
const cancelEditBtn = document.getElementById('cancelEdit');
const formTitle = document.getElementById('formTitle');
const projectIdInput = document.getElementById('projectId'); // Hidden input for ID

let allProjects = [];
let currentFilter = 'all'; // Keep track of the active filter
let editingProject = null; // Store the project being edited (instead of just index)

// --- API Interaction Functions ---

async function sendRequest(action, projectData = null) {
  try {
    const payload = { action, project: projectData };
    const response = await fetch(WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API Request Failed:', error);
    alert(`Operation failed: ${error.message || 'Unknown error'}. Check console for details.`);
    return { status: 'error', message: 'API request failed.' };
  }
}

async function fetchProjects() {
  try {
    const response = await fetch(WEB_APP_URL); // GET request for all projects
    if (!response.ok) throw new Error('Network response was not ok.');
    allProjects = await response.json();
    renderProjects(currentFilter); // Re-render with the current filter
  } catch (error) {
    alert('Failed to load projects. Please ensure the Apps Script URL is correct and deployed.');
    console.error('Error fetching projects:', error);
  }
}

// --- UI Rendering and Interaction ---

function renderProjects(filter = 'all') {
  currentFilter = filter; // Update the current filter
  projectGrid.innerHTML = '';

  const filtered = filter === 'all' ? allProjects :
    allProjects.filter(p => (p.category || '').toLowerCase() === filter);

  if (filtered.length === 0) {
    projectGrid.innerHTML = '<p>No projects available for this category.</p>';
    return;
  }

  filtered.forEach((project) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${project.title}</h3>
      <p class="meta"><strong>Category:</strong> ${project.category}</p>
      <p class="meta"><strong>Payment:</strong> ${project.payment || 'N/A'}</p>
      <div class="card-actions">
        ${project.receipt ? `<a class="receipt-btn" href="${project.receipt}" target="_blank">Receipt</a>` : ''}
        <button class="edit-btn" data-project-id="${project.ID}">Edit</button>
        <button class="delete-btn" data-project-id="${project.ID}">Delete</button>
      </div>
    `;
    projectGrid.appendChild(card);
  });

  // Attach event listeners to newly created buttons
  attachCardButtonListeners();
}

function attachCardButtonListeners() {
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.onclick = (e) => editProject(e.target.dataset.projectId);
    });
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.onclick = (e) => deleteProject(e.target.dataset.projectId);
    });
}


// --- Form Handling ---

projectForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = projectForm.title.value.trim();
  const category = projectForm.category.value;
  const payment = projectForm.payment.value.trim();
  const receipt = projectForm.receipt.value.trim();

  if (!title || !category) {
    alert('Please fill in all required fields (Title and Category).');
    return;
  }

  const projectData = { title, category, payment, receipt };
  let result;

  if (editingProject) {
    // Update existing project
    projectData.id = editingProject.ID; // Use the ID from the stored editingProject
    result = await sendRequest('UPDATE', projectData);
    if (result.status === 'success') {
      alert('Project updated successfully!');
      // Find and update the project in allProjects array
      const index = allProjects.findIndex(p => p.ID === editingProject.ID);
      if (index !== -1) {
        allProjects[index] = { ...allProjects[index], ...projectData }; // Merge updated data
      }
    }
  } else {
    // Add new project
    result = await sendRequest('ADD', projectData);
    if (result.status === 'success') {
      alert('Project added successfully!');
      // Add the new project with its backend-generated ID
      allProjects.push({ ID: result.id, ...projectData });
    }
  }

  if (result.status === 'success') {
    resetForm();
    renderProjects(currentFilter); // Re-render with the current filter
  }
});

function editProject(projectId) {
  editingProject = allProjects.find(p => p.ID === projectId);

  if (editingProject) {
    projectIdInput.value = editingProject.ID; // Set hidden ID
    projectForm.title.value = editingProject.title;
    projectForm.category.value = editingProject.category;
    projectForm.payment.value = editingProject.payment;
    projectForm.receipt.value = editingProject.receipt;

    formTitle.textContent = 'Edit Project';
    cancelEditBtn.style.display = 'inline-block';
    document.getElementById('submitBtn').textContent = 'Update Project'; // Change button text
  }
}

cancelEditBtn.addEventListener('click', () => {
  resetForm();
});

function resetForm() {
  projectForm.reset();
  editingProject = null;
  projectIdInput.value = ''; // Clear hidden ID
  formTitle.textContent = 'Add New Project';
  cancelEditBtn.style.display = 'none';
  document.getElementById('submitBtn').textContent = 'Submit'; // Reset button text
}

async function deleteProject(projectId) {
  if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) {
    return;
  }

  const result = await sendRequest('DELETE', { id: projectId });

  if (result.status === 'success') {
    alert('Project deleted successfully!');
    // Remove from allProjects array
    allProjects = allProjects.filter(p => p.ID !== projectId);
    renderProjects(currentFilter); // Re-render with the current filter
  }
}

// --- Tab Filtering ---

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelector('.tab-btn.active')?.classList.remove('active'); // Use optional chaining
    tab.classList.add('active');
    renderProjects(tab.dataset.filter);
  });
});

// --- Logout and Initial Load ---

function handleLogout() {
  sessionStorage.removeItem('loggedIn');
  window.location.href = 'admin.html'; // Redirect to login page
}

// Attach handleLogout to the global window object (for onclick in HTML)
window.handleLogout = handleLogout;

window.addEventListener('load', () => {
  // Check if logged in before fetching projects
  if (!sessionStorage.getItem('loggedIn')) {
    alert('Please log in first.');
    window.location.href = 'admin.html';
    return;
  }
  fetchProjects(); // Fetch and display projects only if logged in
});