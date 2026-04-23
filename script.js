const statuses = [
  { id: "backlog", label: "Backlog", color: "#3090f0" },
  { id: "progress", label: "Em Progresso", color: "#ff981f" },
  { id: "review", label: "Em Revisao", color: "#1565c0" },
  { id: "done", label: "Concluido", color: "#19a36d" },
];

function createId() {
  return globalThis.crypto?.randomUUID?.() || `task-${Date.now()}-${Math.random()}`;
}

function parseDateInput(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getTodayInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

let tasks = [
  {
    id: createId(),
    title: "Refinar hero da home",
    description: "Ajustar hierarquia visual e CTA principal para melhorar escaneabilidade.",
    status: "backlog",
    priority: "high",
    assignee: "Ana",
    dueDate: "2026-04-25",
    tag: "UI",
  },
  {
    id: createId(),
    title: "Mapear fluxo de cadastro",
    description: "Desenhar estados de erro e sucesso do onboarding para a sprint atual.",
    status: "progress",
    priority: "medium",
    assignee: "Leo",
    dueDate: "2026-04-27",
    tag: "UX",
  },
  {
    id: createId(),
    title: "Validar componentes do dashboard",
    description: "Revisar consistencia entre tabelas, chips e graficos do modulo financeiro.",
    status: "review",
    priority: "high",
    assignee: "Bia",
    dueDate: "2026-04-29",
    tag: "QA",
  },
  {
    id: createId(),
    title: "Documentar padrao de cards",
    description: "Registrar espacamentos, tipografia e estados interativos do kanban.",
    status: "done",
    priority: "low",
    assignee: "Caio",
    dueDate: "2026-04-22",
    tag: "Docs",
  },
];

const boardElement = document.querySelector("#board");
const summaryGridElement = document.querySelector("#summaryGrid");
const searchInput = document.querySelector("#searchInput");
const priorityFilter = document.querySelector("#priorityFilter");
const taskModal = document.querySelector("#taskModal");
const taskForm = document.querySelector("#taskForm");
const modalTitle = document.querySelector("#modalTitle");
const summaryTemplate = document.querySelector("#summaryCardTemplate");
const openModalButton = document.querySelector("#openModalButton");
const closeModalButton = document.querySelector("#closeModalButton");
const cancelButton = document.querySelector("#cancelButton");
const taskIdInput = document.querySelector("#taskId");
const titleInput = document.querySelector("#titleInput");
const descriptionInput = document.querySelector("#descriptionInput");
const statusInput = document.querySelector("#statusInput");
const priorityInput = document.querySelector("#priorityInput");
const assigneeInput = document.querySelector("#assigneeInput");
const dueDateInput = document.querySelector("#dueDateInput");
const tagInput = document.querySelector("#tagInput");

const filters = {
  search: "",
  priority: "all",
};

function populateStatusOptions() {
  statusInput.innerHTML = statuses
    .map((status) => `<option value="${status.id}">${status.label}</option>`)
    .join("");
}

function getPriorityLabel(priority) {
  return {
    high: "Alta",
    medium: "Media",
    low: "Baixa",
  }[priority];
}

function getStatusLabel(statusId) {
  return statuses.find((status) => status.id === statusId)?.label || statusId;
}

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(parseDateInput(dateString));
}

function getFilteredTasks() {
  return tasks.filter((task) => {
    const matchesSearch =
      filters.search.length === 0 ||
      `${task.title} ${task.description}`.toLowerCase().includes(filters.search);

    const matchesPriority =
      filters.priority === "all" || task.priority === filters.priority;

    return matchesSearch && matchesPriority;
  });
}

function buildSummaryItems(filteredTasks) {
  const overdueCount = filteredTasks.filter((task) => {
    const dueDate = parseDateInput(task.dueDate);
    const today = parseDateInput(getTodayInputValue());
    return task.status !== "done" && dueDate < today;
  }).length;

  return [
    {
      label: "Tarefas visiveis",
      value: filteredTasks.length,
      hint: "Atualizado conforme os filtros aplicados",
    },
    {
      label: "Em progresso",
      value: filteredTasks.filter((task) => task.status === "progress").length,
      hint: "Cards em execucao pela equipe",
    },
    {
      label: "Alta prioridade",
      value: filteredTasks.filter((task) => task.priority === "high").length,
      hint: "Itens que merecem acompanhamento proximo",
    },
    {
      label: "Atrasadas",
      value: overdueCount,
      hint: "Pendencias com prazo vencido e ainda abertas",
    },
  ];
}

function renderSummary(filteredTasks) {
  const items = buildSummaryItems(filteredTasks);
  summaryGridElement.innerHTML = "";

  items.forEach((item) => {
    const fragment = summaryTemplate.content.cloneNode(true);
    fragment.querySelector(".summary-card__label").textContent = item.label;
    fragment.querySelector(".summary-card__value").textContent = item.value;
    fragment.querySelector(".summary-card__hint").textContent = item.hint;
    summaryGridElement.appendChild(fragment);
  });
}

function createEmptyState() {
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = "Nenhuma tarefa aqui com o filtro atual.";
  return empty;
}

function createTaskCard(task) {
  const article = document.createElement("article");
  article.className = "task-card";
  article.draggable = true;
  article.dataset.taskId = task.id;
  article.innerHTML = `
    <div class="task-card__row">
      <span class="priority-badge"></span>
      <span class="tag-badge"></span>
    </div>

    <div>
      <h4 class="task-card__title"></h4>
      <p class="task-card__description"></p>
    </div>

    <div class="task-card__meta">
      <span data-role="status"></span>
      <span data-role="deadline"></span>
    </div>

    <div class="task-card__footer">
      <div class="task-card__meta">
        <span class="task-card__avatar"></span>
        <span data-role="assignee"></span>
      </div>
      <div class="task-card__actions">
        <button class="pill-button" type="button" data-action="edit">Editar</button>
        <button class="pill-button" type="button" data-action="delete">Excluir</button>
      </div>
    </div>
  `;

  article.querySelector(".priority-badge").dataset.priority = task.priority;
  article.querySelector(".priority-badge").textContent = getPriorityLabel(task.priority);
  article.querySelector(".tag-badge").textContent = task.tag || "Geral";
  article.querySelector(".task-card__title").textContent = task.title;
  article.querySelector(".task-card__description").textContent =
    task.description || "Sem descricao informada.";
  article.querySelector('[data-role="status"]').textContent = getStatusLabel(task.status);
  article.querySelector('[data-role="deadline"]').textContent = `Prazo ${formatDate(task.dueDate)}`;
  article.querySelector(".task-card__avatar").textContent = getInitials(task.assignee);
  article.querySelector('[data-role="assignee"]').textContent = task.assignee;

  article.addEventListener("dragstart", (event) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer?.setData("text/plain", task.id);
  });

  article.querySelector('[data-action="edit"]').addEventListener("click", () => {
    openModal(task);
  });

  article.querySelector('[data-action="delete"]').addEventListener("click", () => {
    tasks = tasks.filter((item) => item.id !== task.id);
    render();
  });

  return article;
}

function createColumn(status, filteredTasks) {
  const section = document.createElement("section");
  section.className = "column";
  section.dataset.status = status.id;

  const cards = filteredTasks.filter((task) => task.status === status.id);

  section.innerHTML = `
    <div class="column__header">
      <div class="column__title-group">
        <span class="column__dot" style="background:${status.color}"></span>
        <div>
          <strong>${status.label}</strong>
        </div>
      </div>
      <span class="column__count">${cards.length}</span>
    </div>
    <div class="column__cards"></div>
  `;

  const cardsContainer = section.querySelector(".column__cards");
  if (cards.length === 0) {
    cardsContainer.appendChild(createEmptyState());
  } else {
    cards.forEach((task) => cardsContainer.appendChild(createTaskCard(task)));
  }

  section.addEventListener("dragover", (event) => {
    event.preventDefault();
    section.classList.add("column--drag-over");
  });

  section.addEventListener("dragleave", () => {
    section.classList.remove("column--drag-over");
  });

  section.addEventListener("drop", (event) => {
    event.preventDefault();
    section.classList.remove("column--drag-over");

    const taskId = event.dataTransfer?.getData("text/plain");
    if (!taskId) {
      return;
    }

    tasks = tasks.map((task) =>
      task.id === taskId ? { ...task, status: status.id } : task,
    );
    render();
  });

  return section;
}

function renderBoard(filteredTasks) {
  boardElement.innerHTML = "";
  statuses.forEach((status) => {
    boardElement.appendChild(createColumn(status, filteredTasks));
  });
}

function render() {
  const filteredTasks = getFilteredTasks();
  renderSummary(filteredTasks);
  renderBoard(filteredTasks);
}

function resetForm() {
  taskForm.reset();
  taskIdInput.value = "";
  statusInput.value = statuses[0].id;
  priorityInput.value = "high";
  dueDateInput.value = getTodayInputValue();
}

function openModal(task) {
  taskModal.classList.add("modal--open");
  taskModal.setAttribute("aria-hidden", "false");

  if (task) {
    modalTitle.textContent = "Editar tarefa";
    taskIdInput.value = task.id;
    titleInput.value = task.title;
    descriptionInput.value = task.description;
    statusInput.value = task.status;
    priorityInput.value = task.priority;
    assigneeInput.value = task.assignee;
    dueDateInput.value = task.dueDate;
    tagInput.value = task.tag;
  } else {
    modalTitle.textContent = "Nova tarefa";
    resetForm();
  }
}

function closeModal() {
  taskModal.classList.remove("modal--open");
  taskModal.setAttribute("aria-hidden", "true");
}

function saveTask(event) {
  event.preventDefault();

  const payload = {
    title: titleInput.value.trim(),
    description: descriptionInput.value.trim(),
    status: statusInput.value,
    priority: priorityInput.value,
    assignee: assigneeInput.value.trim(),
    dueDate: dueDateInput.value,
    tag: tagInput.value.trim(),
  };

  if (taskIdInput.value) {
    tasks = tasks.map((task) =>
      task.id === taskIdInput.value ? { ...task, ...payload } : task,
    );
  } else {
    tasks.unshift({
      id: createId(),
      ...payload,
    });
  }

  closeModal();
  resetForm();
  render();
}

searchInput.addEventListener("input", (event) => {
  filters.search = event.target.value.trim().toLowerCase();
  render();
});

priorityFilter.addEventListener("change", (event) => {
  filters.priority = event.target.value;
  render();
});

openModalButton.addEventListener("click", () => openModal());
closeModalButton.addEventListener("click", closeModal);
cancelButton.addEventListener("click", closeModal);

taskModal.addEventListener("click", (event) => {
  if (event.target.dataset.closeModal === "true") {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && taskModal.classList.contains("modal--open")) {
    closeModal();
  }
});

taskForm.addEventListener("submit", saveTask);

populateStatusOptions();
resetForm();
render();
