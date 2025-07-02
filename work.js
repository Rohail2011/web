// Replace this with your actual Web App URL from Apps Script
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby47QUiCms2lrTsWMUgwZjEWBXkW9eCP8yNscnnWNypI1F77T2eFa9msDuifKpHdN7L/exec';

const projectGrid = document.getElementById('projectGrid');
const tabs = document.querySelectorAll('.tab-btn');
const form = document.getElementById('addProjectForm');
const cancelEditBtn = document.getElementById('cancelEdit');
const formTitle = document.getElementById('formTitle');

let allProjects = [];
let editingIndex = null;

async function fetchProjects() {
  try {
    const response = await fetch(WEB_APP_URL);
    if (!response.ok) throw new Error('Network error');
    allProjects = await response.json();
    renderProjects('all');
  } catch (error) {
    alert('Failed to load projects.');
    console.error(error);
  }
}

function renderProjects(filter = 'all') {
  projectGrid.innerHTML = '';

  const filtered = filter === 'all' ? allProjects :
    allProjects.filter(p => (p.category || '').toLowerCase() === filter);

  if (filtered.length === 0) {
    projectGrid.innerHTML = '<p>No projects available.</p>';
    return;
  }

  filtered.forEach((project, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${project.title}</h3>
      <p class="meta"><strong>Category:</strong> ${project.category}</p>
      <p class="meta"><strong>Payment:</strong> ${project.payment || 'N/A'}</p>
      ${project.receipt ? `<a class="receipt-btn" href="${project.receipt}" target="_blank">Receipt</a>` : ''}
      <button class="edit-btn" onclick="editProject(${index})">Edit</button>
      <button class="delete-btn" onclick="deleteProject(${index})">Delete</button>
    `;
    projectGrid.appendChild(card);
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = form.title.value.trim();
  const category = form.category.value;
  const payment = form.payment.value.trim();
  const receipt = form.receipt.value.trim();

  if (!title || !category) {
    alert('Please fill in all required fields.');
    return;
  }

  const newProject = { title, category, payment, receipt };

  try {
    const response = await fetch(WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProject)
    });
    const result = await response.json();

    if (result.status === 'success') {
      alert('Project submitted!');
      allProjects.push(newProject);
      renderProjects(document.querySelector('.tab-btn.active').dataset.filter);
      form.reset();
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    alert('Error submitting project.');
    console.error(error);
  }
});

function editProject(index) {
  const project = allProjects[index];
  form.title.value = project.title;
  form.category.value = project.category;
  form.payment.value = project.payment;
  form.receipt.value = project.receipt;
  editingIndex = index;
  formTitle.textContent = 'Edit Project (not saved)';
  cancelEditBtn.style.display = 'inline-block';
}

cancelEditBtn.addEventListener('click', () => {
  form.reset();
  editingIndex = null;
  formTitle.textContent = 'Add New Project';
  cancelEditBtn.style.display = 'none';
});

function deleteProject(index) {
  if (!confirm('Delete this project from UI? (Backend not affected)')) return;
  allProjects.splice(index, 1);
  renderProjects(document.querySelector('.tab-btn.active').dataset.filter);
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelector('.tab-btn.active').classList.remove('active');
    tab.classList.add('active');
    renderProjects(tab.dataset.filter);
  });
});

function handleLogout() {
  sessionStorage.removeItem('loggedIn');
  window.location.href = 'admin.html';
}

window.handleLogout = handleLogout;

window.addEventListener('load', () => {
  if (!sessionStorage.getItem('loggedIn')) {
    alert('Please log in first.');
    window.location.href = 'admin.html';
    return;
  }
  fetchProjects();
});
