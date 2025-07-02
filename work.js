// Replace with your actual deployed Google Apps Script Web App URL:
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx-95ID7rfJXtbIVvwBV-HMY-rxziOdr5Gn-ItkyG9cmcwgmtvS83yDcc0KJXWUdr8/exec';

const projectGrid = document.getElementById('projectGrid');
const tabs = document.querySelectorAll('.tab-btn');
const form = document.getElementById('addProjectForm');
const cancelEditBtn = document.getElementById('cancelEdit');
const formTitle = document.getElementById('formTitle');

let allProjects = [];
let editingIndex = null;

// Fetch projects from backend
async function fetchProjects() {
  try {
    const response = await fetch(WEB_APP_URL);
    if (!response.ok) throw new Error('Network response was not ok');
    allProjects = await response.json();
    renderProjects('all');
  } catch (error) {
    alert('Failed to load projects.');
    console.error(error);
  }
}

// Render projects to UI filtered by category
function renderProjects(filter = 'all') {
  projectGrid.innerHTML = '';

  const filtered = filter === 'all'
    ? allProjects
    : allProjects.filter(p => (p.category || '').toLowerCase() === filter);

  if (filtered.length === 0) {
    projectGrid.innerHTML = '<p>No projects to display.</p>';
    return;
  }

  filtered.forEach((project, index) => {
    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <h3>${project.title}</h3>
      <p class="meta"><strong>Category:</strong> ${project.category}</p>
      <p class="meta"><strong>Payment:</strong> ${project.payment || 'N/A'}</p>
      ${project.receipt ? `<a class="receipt-btn" href="${project.receipt}" target="_blank" rel="noopener noreferrer">View Receipt</a>` : '<span class="meta">No receipt</span>'}
      <button class="edit-btn" onclick="editProject(${index})">Edit</button>
      <button class="delete-btn" onclick="deleteProject(${index})">Delete</button>
    `;

    projectGrid.appendChild(card);
  });
}

function resetForm() {
  form.reset();
  editingIndex = null;
  formTitle.textContent = 'Add New Project';
  cancelEditBtn.style.display = 'none';
}

// Handle form submission for add/edit
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = form.title.value.trim();
  const category = form.category.value;
  const payment = form.payment.value.trim();
  const receipt = form.receipt.value.trim();

  if (!title || !category) {
    alert('Title and Category are required.');
    return;
  }

  const projectData = { title, category, payment, receipt };

  try {
    if (editingIndex === null) {
      // Add new project: POST to backend
      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });
      const json = await res.json();

      if (json.status === 'success') {
        alert('Project added successfully!');
        allProjects.push(projectData);
      } else {
        alert('Failed to add project.');
        return;
      }
    } else {
      // Editing is local only (backend update not implemented)
      allProjects[editingIndex] = projectData;
      alert('Project updated locally only. Backend update not implemented.');
    }
    resetForm();
    renderProjects(document.querySelector('.tab-btn.active').dataset.filter);
  } catch (error) {
    alert('Error submitting project.');
    console.error(error);
  }
});

// Edit button handler
function editProject(index) {
  const project = allProjects[index];
  form.title.value = project.title;
  form.category.value = project.category;
  form.payment.value = project.payment;
  form.receipt.value = project.receipt;
  editingIndex = index;
  formTitle.textContent = 'Edit Project';
  cancelEditBtn.style.display = 'inline-block';
}

// Cancel edit handler
cancelEditBtn.addEventListener('click', () => {
  resetForm();
});

// Delete button handler (local only)
function deleteProject(index) {
  if (!confirm('Are you sure you want to delete this project?')) return;
  allProjects.splice(index, 1);
  alert('Deleted from UI only. Backend deletion not implemented.');
  renderProjects(document.querySelector('.tab-btn.active').dataset.filter);
}

// Tab buttons filter
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelector('.tab-btn.active').classList.remove('active');
    tab.classList.add('active');
    renderProjects(tab.dataset.filter);
  });
});

// Logout function
function handleLogout() {
  sessionStorage.removeItem('loggedIn');
  localStorage.removeItem('rememberedUser');
  window.location.href = 'admin.html';
}

window.handleLogout = handleLogout; // expose for inline onclick

// On load, check login and fetch projects
window.addEventListener('load', () => {
  if (!sessionStorage.getItem('loggedIn')) {
    alert('Please login first.');
    window.location.href = 'admin.html';
    return;
  }
  fetchProjects();
});
