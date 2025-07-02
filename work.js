// Replace this with your Google Apps Script Web App URL:
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx-95ID7rfJXtbIVvwBV-HMY-rxziOdr5Gn-ItkyG9cmcwgmtvS83yDcc0KJXWUdr8/exec';

const grid = document.getElementById('projectGrid');
const tabs = document.querySelectorAll('.tab-btn');
const form = document.getElementById('addProjectForm');
const cancelEditBtn = document.getElementById('cancelEdit');
const formTitle = document.getElementById('formTitle');

let allProjects = [];
let editingIndex = null;

async function fetchProjects() {
  try {
    const res = await fetch(WEB_APP_URL);
    allProjects = await res.json();
    renderProjects('all');
  } catch (err) {
    alert('Failed to load projects.');
    console.error(err);
  }
}

function renderProjects(filter = 'all') {
  grid.innerHTML = '';
  const filtered = filter === 'all' ? allProjects : allProjects.filter(p => (p.category || '').toLowerCase() === filter);

  filtered.forEach((project, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${project.title}</h3>
      <p class="meta">Payment: ${project.payment || 'N/A'}</p>
      ${project.receipt ? `<a class="receipt-btn" href="${project.receipt}" target="_blank" rel="noopener">View Receipt</a>` : `<span class="meta">No receipt</span>`}
      <button class="edit-btn" onclick="editProject(${index})">Edit</button>
      <button class="delete-btn" onclick="deleteProject(${index})">Delete</button>
    `;
    grid.appendChild(card);
  });
}

function resetForm() {
  form.reset();
  editingIndex = null;
  formTitle.textContent = 'Add New Project';
  cancelEditBtn.style.display = 'none';
}

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
      // Add new
      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
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
      // For editing, ideally you should implement backend update.
      // For now, we'll just update locally and alert user.
      allProjects[editingIndex] = projectData;
      alert('Project updated locally. Backend update not implemented.');
    }
    resetForm();
    renderProjects(document.querySelector('.tab-btn.active').dataset.filter);
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
  formTitle.textContent = 'Edit Project';
  cancelEditBtn.style.display = 'inline-block';
}

cancelEditBtn.addEventListener('click', () => {
  resetForm();
});

function deleteProject(index) {
  if (!confirm('Are you sure you want to delete this project?')) return;
  // Ideally implement backend delete here.
  allProjects.splice(index, 1);
  alert('Deleted from UI. Backend deletion not implemented.');
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
  localStorage.removeItem('rememberedUser');
  window.location.href = 'admin.html';
}

window.addEventListener('load', () => {
  if (!sessionStorage.getItem('loggedIn')) {
    alert('Please login first.');
    window.location.href = 'admin.html';
  } else {
    fetchProjects();
  }
});
