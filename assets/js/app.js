let app = {

    //--------------------------------------------------------------------
    // Méthode exécutée au lancement de l'application Todolist.
    //--------------------------------------------------------------------

    init: function() {
        app.fetchData();
  
        let tasks = document.querySelectorAll('.tasks .task');
        for (task of tasks) {
            app.bindTaskListeners(task);
        }

        // On cible le formulaire d'ajout d'une tâche.
        let formAddTask = document.querySelector('#form-new-task');
        // Puis on pose un écouteur d'événement pour sa soumission.
        formAddTask.addEventListener('submit', app.handleFormAddTaskSubmit);

        // Je cible le boutton pour Voir les archives
        let seeArchive = document.querySelector('.filters-bar__element > a');
        seeArchive.addEventListener('click', app.handleArchive);

        // Je cible le boutton pour voir toutes les tâche (complètes et incomplètes)
        let allTasks = document.querySelector('.filters-bar__element > button');
        allTasks.addEventListener('click', app.handleAllTasks);

        // Je cible le boutton pour voir les tâche complètes
        let completeTasks = document.querySelector('.filters-bar__element > button:nth-of-type(2)');
        completeTasks.addEventListener('click', app.handleCompleteTasks);

        // Je cible le boutton pour voir les tâche incomplètes
        let incompleteTasks = document.querySelector('.filters-bar__element > button:nth-of-type(3)');
        incompleteTasks.addEventListener('click', app.handleIncompleteTasks);

        // Je cible la sélection de catégorie
        let selectElement = document.querySelector('.filters-bar__element.select');
        selectElement.addEventListener('click', app.handleCategorySelect);
    },

    //--------------------------------------------------------------------
    // Méthodes de récupération des datas depuis l'API *lumen(laravel)*
    //--------------------------------------------------------------------

    apiBaseUrl: 'http://localhost:8080/',// <- l'URL de l'API lumen

    fetchData: function() {// <- réunie l'appel a l'API de catégorie et tâche
        app.fetchCategories();
        app.fetchTasks();
    },
    fetchCategories: function() {// <- Connexion avec l'API pour récupérer la liste des catégories
        let fetchOptions = {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
        };

        let promesse = fetch(app.apiBaseUrl + 'categories', fetchOptions);
        promesse
            .then(app.convertJSONtoJS)
            .then(function(categories) {
                // 0. mémorisation de la liste des catégories pour usage ultérieur
                app.categories = {};
                for (category of categories) {
                    app.categories[category.id] = category;
                };

                // 1. création du <select> dans le header du site
                app.createCategoriesSelect(categories, 'Toutes les catégories', '.header .filters-bar__element.select');
                
                // 2. création d'un même <select> dans le formulaire d'ajout
                app.createCategoriesSelect(categories, 'Choisissez une catégorie', '#form-new-task .select');
            });
    },
    fetchTasks: function() {// <- Connexion avec l'API pour récupérer la liste des tâches
        let fetchOptions = {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
        };
  
        let promesse = fetch(app.apiBaseUrl + 'tasks', fetchOptions);

        promesse
            .then(app.convertJSONtoJS)
            .then(app.createAllTasks);
    },
    convertJSONtoJS: function(response) {// <- Convertie le format JSON reçu par l'API en format JS
        return response.json();
    },

    //--------------------------------------------------------------------
    // Méthodes de manipulation du DOM
    //--------------------------------------------------------------------

    displayArchives: false,

    createCategoriesSelect: function(categories, label, injectionPoint) {// <- Créer la sélection des catégories dans le header et le formulaire
        let selectElement = document.createElement('select'); // 1

        let optionAllCategories = document.createElement('option');
        optionAllCategories.textContent = label;
        optionAllCategories.value = '';
        selectElement.appendChild(optionAllCategories);

        for (category of categories) { // 2
            let option = document.createElement('option');
            option.textContent = category.name;
            option.value = category.id;
            selectElement.appendChild(option); // 3
        }

        let injectionArea = document.querySelector(injectionPoint);
        injectionArea.appendChild(selectElement); // 4
    },
    handleFormAddTaskSubmit: function(evt) {// <- Écoute le formulaire d'ajout d'une tâche
        evt.preventDefault();

        // Récupération des valeurs qui viennent du formulaire
        let form = evt.currentTarget;
        // Je récupère les inputs du formulaire
        let input = form.querySelector('.task__content__name > input');
        let title = input.value;
        let checkedOption = form.querySelector('.task__content__category option:checked');
        // Je récupère l'id de la catégorie grâce à la valeur du select
        let categoryId = checkedOption.value;
        // On envoie les donnée à notre API via la méthode POST
        let fetchOptions = {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            body: 'title='+title+'&category_id='+categoryId,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            }
        }
        fetch(app.apiBaseUrl + 'tasks', fetchOptions)
        .then(app.convertJSONtoJS)
        .then(function(task){
            app.createTask(task.id, task.title, task.category_id, task.completion, task.status);
        });
        // On réinitialise le champ du formulaire
        input.value = '';
        input.focus();
    },
    createAllTasks: function(tasks) {// <- Mise en place pour ajouter toutes les tâches dans le template
        let tasksList = document.querySelector('.tasks');
        tasksList.innerHTML = '';
        for (task of tasks) {
            app.createTask(task.id, task.title, task.category_id, task.completion, task.status);
        }
    },
    createTask: function(id, title, category_id, completion, status) {// <- Créé les tâches dans le template
        // 1. Utilisation du #template-new-task pour créer du contenu HTML
        let tpl = document.querySelector('#template-new-task');
        // 2. On crée une copie du template, et on travaillera sur la copie
        let copy = tpl.content.cloneNode(true);
        let newTask = copy.querySelector('.task');
        // 3. Préparation du nouveau contenu HTML.
        newTask.dataset.id = id;
        newTask.dataset.category = category_id;
        // 4. On pimp (personnalise) notre copie du template
        newTask.querySelector('.task__content__name > input').value = title;
        newTask.querySelector('.task__content__name > p').textContent = title;
        newTask.querySelector('.task__content__category > p').textContent = app.categories[category_id].name;
        newTask.querySelector('.progress-bar__level').style.width = completion+'%';
        // 5. Condition de la tâche
        if (completion === 100 && status === 1) {
            for (state of app.taskStates) {
                newTask.classList.remove(state);
            }
            newTask.classList.add('task--complete');
        }
        if (status === 2) {
            for (state of app.taskStates) {
                newTask.classList.remove(state);
            }
            newTask.classList.add('task--archive');
            newTask.style.display='none';
        }
        // 6. Création des écouteurs d'événements
        app.bindTaskListeners(newTask);
        // 7. Injection du contenu HTML dans la page courante
        let tasksList = document.querySelector('.tasks');
        tasksList.prepend(newTask);
    },
    handleAllTasks: function(evt) {// <- Affiche toutes les tâches (complètes et incomplètes)
        let otherInputButton = document.querySelectorAll('.filters-bar__element > button');
        for (inputButton of otherInputButton) {
            inputButton.classList.remove('is-info', 'is-selected');
        };
        let input = evt.currentTarget;
        input.classList.add('is-info', 'is-selected');
        let completeTasksElement = document.querySelector('.tasks').childNodes;
        for (task of completeTasksElement) {
            if(task.classList.contains('task--complete') || task.classList.contains('task--todo')){
                task.style.display='';
            }
        }
    },
    handleCompleteTasks: function(evt) {// <- Affiche toutes les tâches complètes
        let otherInputButton = document.querySelectorAll('.filters-bar__element > button');
        for (inputButton of otherInputButton) {
            inputButton.classList.remove('is-info', 'is-selected');
        };
        let input = evt.currentTarget;
        input.classList.add('is-info', 'is-selected');
        let completeTasksElement = document.querySelector('.tasks').childNodes;
        for (task of completeTasksElement) {
            if(task.classList.contains('task--complete')){
                task.style.display='';
            } else {
                task.style.display='none';
            }
        }
    },
    handleIncompleteTasks: function(evt) {// <- Affiche toutes les tâches incomplètes
        let otherInputButton = document.querySelectorAll('.filters-bar__element > button');
        for (inputButton of otherInputButton) {
            inputButton.classList.remove('is-info', 'is-selected');
        };
        let input = evt.currentTarget;
        input.classList.add('is-info', 'is-selected');
        let incompleteTasksElement = document.querySelector('.tasks').childNodes;
        for (task of incompleteTasksElement) {
            if(task.classList.contains('task--todo')){
                task.style.display='';
            } else {
                task.style.display='none';
            }
        }
    },
    handleArchive: function() {// <- Afficher les tâches archivées
        let taskElement = document.querySelector('.tasks').childNodes;
        if (app.displayArchives === false) {

            document.querySelector('.filters-bar__element > a').textContent = 'Voir les tâches actives';
            for (task of taskElement) {
                if(task.classList.contains('task--archive')){
                    task.style.display='';
                } else {
                    task.style.display='none';
                }
            }
            app.displayArchives = true;

        } else if (app.displayArchives === true) {

            document.querySelector('.filters-bar__element > a').textContent = 'Voir les archives';
            for (task of taskElement) {
                if(task.classList.contains('task--archive')){
                    task.style.display='none';
                } else {
                    task.style.display='';
                }
            }
            app.displayArchives = false;
        }
    },
    handleCategorySelect: function() {// <- Affiche les tâche selon la catégorie sélectionner
        let selectElement = document.querySelector('select');
        let idCategorySelect = selectElement.value;

        // Je séléctionne le <div> contenant toutes les tâches
        let categoryTasksElement = document.querySelector('.tasks').childNodes;

        // Je boucle sur categoryTasksElement pour récupérer toutes les tâches
        for (task of categoryTasksElement) {

            // Je récupère l'id de la catégorie du data-category de la tâche
            let idDataCategory = task.dataset.category;

            // Je trie toutes les tâches sauf celle qui sont archivées
            if (app.displayArchives == false) {
                if (idCategorySelect == idDataCategory && !task.classList.contains('task--archive')) {
                    task.style.display='';
                } else {
                    task.style.display='none';
                }
                if (!idCategorySelect && !task.classList.contains('task--archive')) {
                    task.style.display='';
                }
            }
            
            // Je trie toutes les tâches qui sont archivées
            if (app.displayArchives == true) {
                if (idCategorySelect == idDataCategory && task.classList.contains('task--archive')) {
                    task.style.display='';
                } else {
                    task.style.display='none';
                }
                if (!idCategorySelect && task.classList.contains('task--archive')) {
                    task.style.display='';
                }
            }
        };
    },

    //--------------------------------------------------------------------
    // Méthodes de manipulation des tâches.
    //--------------------------------------------------------------------

    taskStates: [// <- Tableau des classlist des tâches
        'task--todo',
        'task--edit',
        'task--complete',
        'task--archive',
    ],

    bindTaskListeners: function(taskEl) {   // <- Écoute les actions et les boutons des tâches
        // On cible les titres de tâches => on récupère un tableau
        let taskTitle = taskEl.querySelector('.task__content__name > p');
        // Puis on pose un écouteur d'événement sur chaque titre de tâche
        taskTitle.addEventListener('click', app.handleClickOnTaskTitle);

        // On cible les boutons "modifier"
        let taskUpdate = taskEl.querySelector('.task__content__button__modify');
        // Puis on pose un écouteur d'événement
        taskUpdate.addEventListener('click', app.handleClickOnTaskUpdate);

        // On cible les input
        let taskInput = taskEl.querySelector('.task__content__name > input');
        // Puis on pose un écouteur d'événement
        taskInput.addEventListener('blur', app.handleTaskTitle);
        taskInput.addEventListener('keydown', app.handleTaskTitleEnterKey);

        // On cible les boutons pour marquer une tâche comme complétée
        let validateTaskButton = taskEl.querySelector('.task__content__button__validate');
        // Puis on pose un écouteur d'événement
        validateTaskButton.addEventListener('click', app.handleTaskValidate);

        // On cible les boutons pour marquer une tâche comme incomplète
        let unvalidateTaskButton = taskEl.querySelector('.task__content__button__incomplete');
        // Puis on pose un écouteur d'événement
        unvalidateTaskButton.addEventListener('click', app.handleTaskUnvalidate)

        // On cible les boutons pour marquer une tâche comme archiver
        let archiveTaskButton = taskEl.querySelector('.task__content__button__archive');
        // Puis on pose un écouteur d'événement
        archiveTaskButton.addEventListener('click', app.handleTaskArchive)

        // On cible les boutons pour enlever une tâche des archives
        let unpackTaskButton = taskEl.querySelector('.task__content__button__desarchive');
        // Puis on pose un écouteur d'événement
        unpackTaskButton.addEventListener('click', app.handleTaskunpack)

        // On cible les boutons pour supprimer une tâche
        let deleteTaskButton = taskEl.querySelector('.task__content__button__delete');
        // Puis on pose un écouteur d'événement
        deleteTaskButton.addEventListener('click', app.handleTaskDelete)
    },
    handleClickOnTaskTitle: function(evt) {// <- Changer le titre de la tâche en cliquant dessus
        let titleElement = evt.currentTarget;
        let taskElement = titleElement.closest('.task');
        if (taskElement.classList.contains('task--archive')) {
            return;
        } else if (taskElement.classList.contains('task--complete')) {
            return;
        } else {
            taskElement.classList.add('task--edit');
        }
        let inputElement = titleElement.previousElementSibling;
        inputElement.value = '';
        inputElement.focus();
        inputElement.value = titleElement.textContent;
    },
    handleTaskTitleEnterKey: function(evt) {// <- Valider le titre de la tâche avec le boutton entrée
        // console.log(evt.keyCode);
        // si la touche est "Entrée"
        if (evt.keyCode === 13) {
            app.handleTaskTitle(evt);
        }
    },
    handleTaskTitle: function(evt) {// <- Action directement en cliquant sur le titre pour éditer une tâche
        let inputElement = evt.currentTarget;
        let titleElement = inputElement.nextElementSibling;
        let value = inputElement.value;
        titleElement.textContent = value;
        let taskElement = inputElement.closest('.task');
        taskElement.classList.remove('task--edit');
    },
    handleClickOnTaskUpdate: function(evt) {// <- Action du boutton pour éditer une tâche
        let buttonClicked = evt.currentTarget;
        let taskElement = buttonClicked.closest('.task');
        let title = taskElement.querySelector('.task__content__name > p').textContent;
        let taskId = taskElement.dataset.id;
        let fetchOptions = {
            method: 'PUT',
            mode: 'cors',
            cache: 'no-cache',
            body: JSON.stringify({'title': title}),
            headers: {
                'Content-type': 'application/json'
            }
        }
        fetch(app.apiBaseUrl + 'tasks/' + taskId, fetchOptions)
        .then(app.convertJSONtoJS)
        .then(function(response){
            alert('Tâche modifiée');
        })
    },
    handleTaskValidate: function(evt) {// <- Action du boutton complétait une tâche
        let buttonClicked = evt.currentTarget;
        let taskElement = buttonClicked.closest('.task');
        let taskId = taskElement.dataset.id;
        let fetchOptions = {
            method: 'PUT',
            mode: 'cors',
            cache: 'no-cache',
            body: JSON.stringify({'completion': 100}),
            headers: {
                'Content-type': 'application/json'
            }
        }
        fetch(app.apiBaseUrl + 'tasks/' + taskId, fetchOptions)
        .then(app.convertJSONtoJS)
        .then(function(response){
            for (state of app.taskStates) {
                taskElement.classList.remove(state);
            }
            taskElement.classList.add('task--complete');
            let progressBar = taskElement.querySelector('.progress-bar__level');
            progressBar.style.width = '100%';
            console.log('Tâche complétée');
        })
    },
    handleTaskUnvalidate: function(evt) {// <- Action du boutton décomplétait une tâche
        let buttonClicked = evt.currentTarget;
        let taskElement = buttonClicked.closest('.task');
        let taskId = taskElement.dataset.id;
        let fetchOptions = {
            method: 'PUT',
            mode: 'cors',
            cache: 'no-cache',
            body: JSON.stringify({'completion': 0}),
            headers: {
                'Content-type': 'application/json'
            }
        }
        fetch(app.apiBaseUrl + 'tasks/' + taskId, fetchOptions)
        .then(app.convertJSONtoJS)
        .then(function(response){
            for (state of app.taskStates) {
                taskElement.classList.remove(state);
            }
            taskElement.classList.add('task--todo');
            let progressBar = taskElement.querySelector('.progress-bar__level');
            progressBar.style.width = '0%';
            console.log('Tâche décompléter');
        })
    },
    handleTaskArchive: function(evt) {// <- Action du boutton pour archiver une tâche
        let buttonClicked = evt.currentTarget;
        let taskElement = buttonClicked.closest('.task');
        let taskId = taskElement.dataset.id;
        let fetchOptions = {
            method: 'PUT',
            mode: 'cors',
            cache: 'no-cache',
            body: JSON.stringify({'status': 2}),
            headers: {
                'Content-type': 'application/json'
            }
        }
        fetch(app.apiBaseUrl + 'tasks/' + taskId, fetchOptions)
        .then(app.convertJSONtoJS)
        .then(function(response){
            for (state of app.taskStates) {
                taskElement.classList.remove(state);
            }
            taskElement.classList.add('task--archive');
            taskElement.style.display='none';
            console.log('Tâche archivée');
        })
    },
    handleTaskunpack: function(evt) {// <- Action du boutton désarchivait une tâche
        let buttonClicked = evt.currentTarget;
        let taskElement = buttonClicked.closest('.task');
        let taskId = taskElement.dataset.id;
        let fetchOptions = {
            method: 'PUT',
            mode: 'cors',
            cache: 'no-cache',
            body: JSON.stringify({'status': 1}),
            headers: {
                'Content-type': 'application/json'
            }
        }
        fetch(app.apiBaseUrl + 'tasks/' + taskId, fetchOptions)
        .then(app.convertJSONtoJS)
        .then(function(response){
            let progressElement = taskElement.querySelector('.progress-bar__level').style;
            for (state of app.taskStates) {
                taskElement.classList.remove(state);
            }
            if (progressElement.width === '100%') {
                taskElement.classList.add('task--complete');
            } else {
                taskElement.classList.add('task--todo');
            }
            app.displayArchives = false;
            app.handleArchive();
            console.log('Tâche désarchivée');
        })
    },
    handleTaskDelete: function(evt) {// <- Action du boutton supprimait une tâche
        let buttonClicked = evt.currentTarget;
        let taskElement = buttonClicked.closest('.task');
        let taskId = taskElement.dataset.id;
        let comfirmDelete = confirm('Voulez-vous vraiment supprimer la tâche');
        if (comfirmDelete === true) {
            let fetchOptions = {
                method: 'DELETE',
                mode: 'cors',
                cache: 'no-cache',
                header: {
                    'Content-Type': 'application/json'
                }
            }
            fetch(app.apiBaseUrl + 'tasks/' + taskId, fetchOptions)
            .then(app.convertJSONtoJS)
            .then(function(response){
                taskElement.remove();
                console.log('Tâche supprimée');
            })
        }
    },
};

document.addEventListener('DOMContentLoaded', app.init);