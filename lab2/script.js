"use strict";

var lists = [
	{
		name: "Pilne",
		collapsed: false,
		tasks: [
			{
				text: "kupic masło",
				done: false,
				completedAt: null
			},
			{
				text: "zjesc maslo",
				done: true,
				completedAt: "2026-04-12T01:44:00"
			}
		]
	},
	{
		name: "Mało pilne",
		collapsed: false,
		tasks: []
	},
	{
		name: "Na wczoraj",
		collapsed: false,
		tasks: [
			{
				text: "posprzątać",
				done: false,
				completedAt: null
			}
		]
	}
];

var currentListIndex = 0;
var lastDeletedTask = null;
var pendingDeleteListIndex = -1;
var pendingDeleteTaskIndex = -1;

var taskForm = document.getElementById("task-form");
var taskInput = document.getElementById("task-input");
var listSelect = document.getElementById("list-select");
var listForm = document.getElementById("list-form");
var newListInput = document.getElementById("new-list-input");
var searchInput = document.getElementById("search-input");
var caseInsensitiveCheckbox = document.getElementById("case-insensitive");
var currentListSelect = document.getElementById("current-list-select");
var collapseButton = document.getElementById("collapse-button");
var singleListContainer = document.getElementById("single-list-container");
var trashContent = document.getElementById("trash-content");
var undoButton = document.getElementById("undo-button");
var deleteDialog = document.getElementById("delete-dialog");
var deleteQuestion = document.getElementById("delete-question");
var cancelDeleteButton = document.getElementById("cancel-delete");
var confirmDeleteButton = document.getElementById("confirm-delete");

function formatDate(dateString) {
	var date = new Date(dateString);
	return date.toLocaleString("pl-PL");
}

function updateSelects() {
	var i;
	var option1;
	var option2;

	listSelect.innerHTML = "";
	currentListSelect.innerHTML = "";

	for (i = 0; i < lists.length; i += 1) {
		option1 = document.createElement("option");
		option1.value = String(i);
		option1.textContent = lists[i].name;
		listSelect.appendChild(option1);

		option2 = document.createElement("option");
		option2.value = String(i);
		option2.textContent = lists[i].name;
		currentListSelect.appendChild(option2);
	}

	if (currentListIndex >= lists.length) {
		currentListIndex = 0;
	}

	listSelect.value = String(currentListIndex);
	currentListSelect.value = String(currentListIndex);
}

function textMatchesSearch(text) {
	var query = searchInput.value.trim();

	if (query === "") {
		return true;
	}

	if (caseInsensitiveCheckbox.checked) {
		return text.toLowerCase().indexOf(query.toLowerCase()) !== -1;
	}

	return text.indexOf(query) !== -1;
}

function renderTrash() {
	if (lastDeletedTask === null) {
		trashContent.textContent = "Brak usuniętych zadań.";
		undoButton.disabled = true;
	} else {
		trashContent.textContent = 'Ostatnio usunięto: "' + lastDeletedTask.task.text + '" z listy "' + lastDeletedTask.listName + '".';
		undoButton.disabled = false;
	}
}

function createTaskItem(listIndex, taskIndex) {
	var task = lists[listIndex].tasks[taskIndex];

	var item = document.createElement("li");
	item.className = "task-item";

	if (task.done) {
		item.className += " done";
	}

	var mainButton = document.createElement("button");
	mainButton.type = "button";
	mainButton.className = "task-main";

	mainButton.addEventListener("click", function () {
		toggleTask(listIndex, taskIndex);
	});

	var textSpan = document.createElement("span");
	textSpan.className = "task-text";
	textSpan.textContent = task.text;
	mainButton.appendChild(textSpan);

	if (task.done && task.completedAt !== null) {
		var dateSpan = document.createElement("span");
		dateSpan.className = "task-date";
		dateSpan.textContent = "Wykonano: " + formatDate(task.completedAt);
		mainButton.appendChild(dateSpan);
	}

	var deleteButton = document.createElement("button");
	deleteButton.type = "button";
	deleteButton.className = "delete-button";
	deleteButton.textContent = "X";

	deleteButton.addEventListener("click", function () {
		openDeleteDialog(listIndex, taskIndex);
	});

	item.appendChild(mainButton);
	item.appendChild(deleteButton);

	return item;
}

function renderCurrentList() {
	var list = lists[currentListIndex];
	var taskList;
	var i;
	var visibleCount;
	var emptyText;
	var collapsedText;

	singleListContainer.innerHTML = "";
	currentListSelect.value = String(currentListIndex);

	if (list.collapsed) {
		collapseButton.textContent = "Rozwiń";
		collapsedText = document.createElement("p");
		collapsedText.className = "empty-text";
		collapsedText.textContent = "Lista jest zwinięta.";
		singleListContainer.appendChild(collapsedText);

		return;
	}

	collapseButton.textContent = "Zwiń";

	taskList = document.createElement("ul");
	taskList.className = "task-list";
	visibleCount = 0;

	for (i = 0; i < list.tasks.length; i += 1) {
		if (textMatchesSearch(list.tasks[i].text)) {
			taskList.appendChild(createTaskItem(currentListIndex, i));
			visibleCount += 1;
		}
	}

	if (visibleCount === 0) {
		emptyText = document.createElement("p");
		emptyText.className = "empty-text";

		if (list.tasks.length === 0) {
			emptyText.textContent = "Brak zadań na tej liście.";
		} else {
			emptyText.textContent = "Brak zadań pasujących do wyszukiwania.";
		}

		singleListContainer.appendChild(emptyText);
	} else {
		singleListContainer.appendChild(taskList);
	}
}

function renderAll() {
	updateSelects();
	renderCurrentList();
	renderTrash();
}

function addTask() {
	var text = taskInput.value.trim();
	var selectedListIndex;

	if (text === "") {
		taskInput.focus();
		return;
	}

	selectedListIndex = Number(listSelect.value);

	lists[selectedListIndex].tasks.push({
		text: text,
		done: false,
		completedAt: null
	});

	taskInput.value = "";
	renderCurrentList();
	taskInput.focus();
}

function addList() {
	var newName = newListInput.value.trim();
	var i;

	if (newName === "") {
		newListInput.focus();
		return;
	}

	for (i = 0; i < lists.length; i += 1) {
		if (lists[i].name.toLowerCase() === newName.toLowerCase()) {
			newListInput.value = "";
			newListInput.focus();
			return;
		}
	}

	lists.push({
		name: newName,
		collapsed: false,
		tasks: []
	});

	currentListIndex = lists.length - 1;
	newListInput.value = "";
	renderAll();
}

function toggleTask(listIndex, taskIndex) {
	var task = lists[listIndex].tasks[taskIndex];

	task.done = !task.done;

	if (task.done) {
		task.completedAt = new Date().toISOString();
	} else {
		task.completedAt = null;
	}

	renderCurrentList();
}

function toggleCurrentListCollapse() {
	lists[currentListIndex].collapsed = !lists[currentListIndex].collapsed;
	renderCurrentList();
}

function changeCurrentList() {
	currentListIndex = Number(currentListSelect.value);
	renderAll();
}

function openDeleteDialog(listIndex, taskIndex) {
	var task = lists[listIndex].tasks[taskIndex];

	pendingDeleteListIndex = listIndex;
	pendingDeleteTaskIndex = taskIndex;
	deleteQuestion.textContent = "Czy na pewno chcesz usunąć zadanie o treści: " + task.text;
	deleteDialog.showModal();
}

function confirmDelete() {
	var removedTask;
	var list;

	if (pendingDeleteListIndex === -1 || pendingDeleteTaskIndex === -1) {
		return;
	}

	list = lists[pendingDeleteListIndex];
	removedTask = list.tasks.splice(pendingDeleteTaskIndex, 1)[0];

	lastDeletedTask = {
		listName: list.name,
		listIndex: pendingDeleteListIndex,
		taskIndex: pendingDeleteTaskIndex,
		task: removedTask
	};

	pendingDeleteListIndex = -1;
	pendingDeleteTaskIndex = -1;

	deleteDialog.close();
	renderAll();
}

function undoDelete() {
	if (lastDeletedTask === null) {
		return;
	}

	lists[lastDeletedTask.listIndex].tasks.splice(
		lastDeletedTask.taskIndex,
		0,
		lastDeletedTask.task
	);

	lastDeletedTask = null;
	renderAll();
}

taskForm.addEventListener("submit", function (event) {
	event.preventDefault();
	addTask();
});

listForm.addEventListener("submit", function (event) {
	event.preventDefault();
	addList();
});

searchInput.addEventListener("input", function () {
	renderCurrentList();
});

caseInsensitiveCheckbox.addEventListener("change", function () {
	renderCurrentList();
});

currentListSelect.addEventListener("change", function () {
	changeCurrentList();
});

collapseButton.addEventListener("click", function () {
	toggleCurrentListCollapse();
});

undoButton.addEventListener("click", function () {
	undoDelete();
});

cancelDeleteButton.addEventListener("click", function () {
	pendingDeleteListIndex = -1;
	pendingDeleteTaskIndex = -1;
	deleteDialog.close();
});

confirmDeleteButton.addEventListener("click", function () {
	confirmDelete();
});

renderAll();