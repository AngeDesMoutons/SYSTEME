document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let xp = 0;
    let maxXp = 100;
    let level = 0;
    let notifications = 0;
    let tasks = [];
    let quests = [];
    let malus = [];
    let currentTheme = 'light';

    async function loadAllData() {
        try {
            const res = await fetch('/SYSTEME/data.php', { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                xp = data.xp || 0;
                maxXp = data.maxXp || 100;
                level = data.level || 0;
                tasks = data.tasks || [];
                quests = data.quests || [];
                malus = data.malus || [];
            }
        } catch (e) {
            // Si erreur, tu peux initialiser avec des valeurs par défaut si tu veux
        }
    }
    
    async function saveAllData() {
        await fetch('/SYSTEME/data.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xp, maxXp, level, tasks, quests, malus })
    });
    }

    // Simuler un chargement
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('passwordScreen').classList.remove('hidden');
    }, 1000);
    
    // Gestion du mot de passe
    document.getElementById('passwordForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const password = document.getElementById('password').value;
        
        if (password === 'Angelo8002!') {
            document.getElementById('passwordScreen').classList.add('hidden');
            document.getElementById('app').classList.remove('hidden');
            document.getElementById('app').classList.add('fade-in');
            
            // Initialiser les données
            initializeData();
        } else {
            alert('Mot de passe incorrect.');
        }
    });
    
    // Gestion du thème
    document.getElementById('themeToggle').addEventListener('click', function() {
        const html = document.documentElement;
        if (html.classList.contains('dark')) {
            html.classList.remove('dark');
            document.getElementById('darkIcon').classList.remove('hidden');
            document.getElementById('lightIcon').classList.add('hidden');
            currentTheme = 'light';
        } else {
            html.classList.add('dark');
            document.getElementById('darkIcon').classList.add('hidden');
            document.getElementById('lightIcon').classList.remove('hidden');
            currentTheme = 'dark';
        }
        localStorage.setItem('theme', currentTheme);
    });

    // Vérifier la préférence de thème
    if (localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        document.getElementById('darkIcon').classList.add('hidden');
        document.getElementById('lightIcon').classList.remove('hidden');
        currentTheme = 'dark';
    } else {
        document.documentElement.classList.remove('dark');
        document.getElementById('darkIcon').classList.remove('hidden');
        document.getElementById('lightIcon').classList.add('hidden');
        currentTheme = 'light';
    }
    
    // Gestion des notifications
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationsPanel = document.getElementById('notificationsPanel');
    const notificationCount = document.getElementById('notificationCount');
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    
    notificationBtn.addEventListener('click', function() {
        notificationsPanel.classList.toggle('hidden');
    });
    
    markAllReadBtn.addEventListener('click', function() {
        document.querySelectorAll('#notificationsList li').forEach(item => item.remove());
        notifications = 0;
        updateNotificationCount();
        notificationsPanel.classList.add('hidden');
    });
    
    // Boutons individuels "marquer comme lu"
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('mark-read-btn')) {
            const notificationItem = e.target.closest('li');
            notificationItem.remove();
            notifications--;
            updateNotificationCount();
            if (notifications === 0) {
                notificationsPanel.classList.add('hidden');
            }
        }
    });
    
    function updateNotificationCount() {
        if (notifications > 0) {
            notificationCount.textContent = notifications;
            notificationCount.classList.remove('hidden');
        } else {
            notificationCount.classList.add('hidden');
        }
    }
    
    // Gestion des filtres
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('filter-btn')) {
            const filter = e.target.getAttribute('data-filter');
            const filterButtons = document.querySelectorAll('.filter-btn');

            // Mise à jour des boutons
            filterButtons.forEach(btn => {
                btn.classList.remove('bg-indigo-600', 'dark:bg-indigo-500', 'text-white');
                btn.classList.add('bg-white', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
            });
            e.target.classList.remove('bg-white', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
            e.target.classList.add('bg-indigo-600', 'dark:bg-indigo-500', 'text-white');

            // Affichage/Masquage des sections
            const taskSection = document.getElementById('taskList').parentElement;
            const questSection = document.getElementById('questList').parentElement.parentElement;
            const malusSection = document.getElementById('malusList').parentElement.parentElement;

            // Par défaut, tout masquer
            taskSection.classList.add('hidden');
            questSection.classList.add('hidden');
            malusSection.classList.add('hidden');

            // Afficher la bonne section selon le filtre
            if (filter === 'all' || filter === 'daily' || filter === 'weekly' || filter === 'completed') {
                taskSection.classList.remove('hidden');
            }
            if (filter === 'quest') {
                questSection.classList.remove('hidden');
            }
            if (filter === 'malus') {
                malusSection.classList.remove('hidden');
            }

            // Filtrage des cartes
            const allCards = document.querySelectorAll('.task-card, .quest-card');
            allCards.forEach(card => {
                card.classList.add('hidden');
                if (filter === 'all') {
                    card.classList.remove('hidden');
                } else if (filter === 'completed' && card.classList.contains('completed')) {
                    card.classList.remove('hidden');
                } else if (filter === 'daily' && card.getAttribute('data-category') === 'daily') {
                    card.classList.remove('hidden');
                } else if (filter === 'weekly' && card.getAttribute('data-category') === 'weekly') {
                    card.classList.remove('hidden');
                } else if (filter === 'quest' && card.getAttribute('data-category') === 'quest') {
                    card.classList.remove('hidden');
                }
            });
        }
    });
    
    // Gestion du modal de tâche
    const taskModal = document.getElementById('taskModal');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const cancelTaskBtn = document.getElementById('cancelTaskBtn');
    const taskForm = document.getElementById('taskForm');
    const taskCategory = document.getElementById('taskCategory');
    const repeatContainer = document.getElementById('repeatContainer');
    
    addTaskBtn.addEventListener('click', function() {
        document.getElementById('taskModalTitle').textContent = 'Ajouter une tâche';
        document.getElementById('taskId').value = '';
        document.getElementById('taskName').value = '';
        document.getElementById('taskXp').value = '10';
        document.getElementById('taskCategory').value = 'daily';
        document.getElementById('taskRepeat').value = '1';
        document.getElementById('taskDeadline').value = '23:59';
        
        taskModal.classList.remove('hidden');
        document.getElementById('taskName').focus();
    });
    
    cancelTaskBtn.addEventListener('click', function() {
        taskModal.classList.add('hidden');
    });
    
    taskCategory.addEventListener('change', function() {
        if (this.value === 'weekly') {
            repeatContainer.classList.remove('hidden');
        } else {
            repeatContainer.classList.add('hidden');
        }
    });
    
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const id = document.getElementById('taskId').value || Date.now().toString();
        const name = document.getElementById('taskName').value;
        const xpValue = parseInt(document.getElementById('taskXp').value);
        const category = document.getElementById('taskCategory').value;
        const repeat = parseInt(document.getElementById('taskRepeat').value);
        const deadline = document.getElementById('taskDeadline').value;
        
        const task = {
            id,
            name,
            xp: xpValue,
            category,
            repeat: category === 'weekly' ? repeat : 1,
            progress: 0,
            deadline,
            completed: false,
            lastChecked: new Date().toISOString().split('T')[0]
        };
        
        // Ajouter ou mettre à jour la tâche
        const existingIndex = tasks.findIndex(t => t.id === id);
        if (existingIndex >= 0) {
            tasks[existingIndex] = task;
        } else {
            tasks.push(task);
        }
        
        // Sauvegarder et rafraîchir
        saveAllData();;
        renderTasks();
        taskModal.classList.add('hidden');
    });
    
    // Gestion du modal de quête spéciale
    const questModal = document.getElementById('questModal');
    const addQuestBtn = document.getElementById('addQuestBtn');
    const cancelQuestBtn = document.getElementById('cancelQuestBtn');
    const questForm = document.getElementById('questForm');
    
    addQuestBtn.addEventListener('click', function() {
        document.getElementById('questModalTitle').textContent = 'Ajouter une quête spéciale';
        document.getElementById('questId').value = '';
        document.getElementById('questName').value = '';
        document.getElementById('questXp').value = '100';
        document.getElementById('questDescription').value = '';
        document.getElementById('questDeadline').value = '';
        
        questModal.classList.remove('hidden');
        document.getElementById('questName').focus();
    });
    
    cancelQuestBtn.addEventListener('click', function() {
        questModal.classList.add('hidden');
    });
    
    questForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const id = document.getElementById('questId').value || Date.now().toString();
        const name = document.getElementById('questName').value;
        const xpValue = parseInt(document.getElementById('questXp').value);
        const description = document.getElementById('questDescription').value;
        const deadline = document.getElementById('questDeadline').value;
        
        const quest = {
            id,
            name,
            xp: xpValue,
            description,
            deadline,
            completed: false,
            category: 'quest'
        };
        
        // Ajouter ou mettre à jour la quête
        const existingIndex = quests.findIndex(q => q.id === id);
        if (existingIndex >= 0) {
            quests[existingIndex] = quest;
        } else {
            quests.push(quest);
        }
        
        // Sauvegarder et rafraîchir
        saveAllData();;
        renderQuests();
        questModal.classList.add('hidden');
    });
    
    // Gestion du modal de malus
    const malusModal = document.getElementById('malusModal');
    const addMalusBtn = document.getElementById('addMalusBtn');
    const cancelMalusBtn = document.getElementById('cancelMalusBtn');
    const malusForm = document.getElementById('malusForm');
    
    addMalusBtn.addEventListener('click', function() {
        document.getElementById('malusModalTitle').textContent = 'Ajouter un malus';
        document.getElementById('malusId').value = '';
        document.getElementById('malusName').value = '';
        document.getElementById('malusXp').value = '-10';
        
        malusModal.classList.remove('hidden');
        document.getElementById('malusName').focus();
    });
    
    cancelMalusBtn.addEventListener('click', function() {
        malusModal.classList.add('hidden');
    });
    
    malusForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const id = document.getElementById('malusId').value || Date.now().toString();
        const name = document.getElementById('malusName').value;
        const xpValue = parseInt(document.getElementById('malusXp').value);
        
        const malusItem = {
            id,
            name,
            xp: xpValue
        };
        
        // Ajouter ou mettre à jour le malus
        const existingIndex = malus.findIndex(m => m.id === id);
        if (existingIndex >= 0) {
            malus[existingIndex] = malusItem;
        } else {
            malus.push(malusItem);
        }
        
        // Sauvegarder et rafraîchir
        saveAllData();;
        renderMalus();
        malusModal.classList.add('hidden');
    });
    
    // Fonction pour ajouter/retirer XP
    function addXp(amount) {
        xp += amount;
        if (xp < 0) xp = 0;
        
        // Vérifier si passage de niveau
        while (xp >= maxXp) {
            level++;
            xp = xp - maxXp;
            maxXp = Math.floor(maxXp * 1.1); // Augmentation du XP requis par niveau
            document.querySelector('.level-badge').textContent = `Niveau ${level}`;
            
            // Animation de niveau
            const levelBadge = document.querySelector('.level-badge');
            levelBadge.classList.add('animate-pulse');
            setTimeout(() => {
                levelBadge.classList.remove('animate-pulse');
            }, 2000);
        }
        
        // Mettre à jour la barre de progression
        const percentage = Math.min(100, Math.floor((xp / maxXp) * 100));
        document.querySelector('.xp-bar').style.width = `${percentage}%`;
        document.querySelector('.text-sm.font-medium.text-indigo-700, .text-sm.font-medium.text-indigo-300').textContent = `Progression: ${xp} XP / ${maxXp} XP`;
        document.querySelectorAll('.text-sm.font-medium.text-indigo-700 + span, .text-sm.font-medium.text-indigo-300 + span')[0].textContent = `${percentage}%`;
        
        // Sauvegarder la progression
        saveAllData();;
    }
    
    // Fonction pour ajouter une notification
    function addNotification(title, message) {
        const notificationsList = document.getElementById('notificationsList');
        const newNotification = document.createElement('li');
        newNotification.className = 'p-2 bg-red-50 dark:bg-red-900/30 rounded flex justify-between items-center';
        newNotification.innerHTML = `
            <div>
                <p class="font-medium text-red-800 dark:text-red-300">${title}</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">${message}</p>
            </div>
            <button class="mark-read-btn text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-2 py-1 rounded text-gray-700 dark:text-gray-300" data-id="${Date.now()}">✓</button>
        `;
        
        notificationsList.appendChild(newNotification);
        notifications++;
        updateNotificationCount();
    }
    
    // Fonction pour initialiser les données
    async function initializeData() {
        await loadAllData();
        checkMissedTasks();
        renderTasks();
        renderQuests();
        renderMalus();

        const percentage = Math.min(100, Math.floor((xp / maxXp) * 100));
        document.querySelector('.xp-bar').style.width = `${percentage}%`;
        document.querySelector('.text-sm.font-medium.text-indigo-700, .text-sm.font-medium.text-indigo-300').textContent = `Progression: ${xp} XP / ${maxXp} XP`;
        document.querySelectorAll('.text-sm.font-medium.text-indigo-700 + span, .text-sm.font-medium.text-indigo-300 + span')[0].textContent = `${percentage}%`;
        document.querySelector('.level-badge').textContent = `Niveau ${level}`;
    }
    
    // Fonction pour rendre les tâches
    function renderTasks() {
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = '';
        
        tasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.className = `task-card bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md ${task.completed ? 'completed' : ''}`;
            taskCard.setAttribute('data-category', task.category);
            taskCard.setAttribute('data-id', task.id);
            
            let progressText = '';
            if (task.category === 'weekly' && task.repeat > 1) {
                progressText = `Progression: ${task.progress}/${task.repeat}`;
            }
            
            let deadlineText = '';
            if (task.deadline) {
                deadlineText = `• Échéance: ${task.deadline}`;
            }
            
            taskCard.innerHTML = `
                <div class="flex justify-between items-center mb-3">
                    <h3 class="font-semibold text-gray-800 dark:text-white">${task.name}</h3>
                    <span class="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium px-2 py-1 rounded">+${task.xp} XP</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-500 dark:text-gray-400">${task.category === 'daily' ? 'Quotidien' : 'Hebdomadaire'} ${progressText ? '• ' + progressText : ''} ${deadlineText}</span>
                    <div class="flex space-x-2">
                        ${task.completed ? 
                            `<button class="complete-btn bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-3 py-1 rounded-md text-sm">Complété</button>` : 
                            task.category === 'weekly' && task.repeat > 1 ? 
                                `<button class="increment-btn bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/40 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-md text-sm transition">+1</button>` : 
                                `<button class="complete-btn bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/40 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-md text-sm transition">Compléter</button>`
                        }
                        <button class="edit-task-btn p-1 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button class="delete-task-btn p-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            `;
            
            taskList.appendChild(taskCard);
        });
        
        // Ajouter les événements aux boutons
        addTaskButtonEvents();
    }
    
    // Fonction pour rendre les quêtes
    function renderQuests() {
        const questList = document.getElementById('questList');
        questList.innerHTML = '';
        
        quests.forEach(quest => {
            const questCard = document.createElement('div');
            questCard.className = `quest-card p-4 rounded-lg shadow-md text-white ${quest.completed ? 'completed opacity-60' : ''}`;
            questCard.setAttribute('data-category', 'quest');
            questCard.setAttribute('data-id', quest.id);
            
            let deadlineText = '';
            if (quest.deadline) {
                deadlineText = `<p class="text-sm text-white text-opacity-80 mt-1">Échéance: ${formatDate(quest.deadline)}</p>`;
            }
            
            questCard.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <h3 class="font-bold text-lg">${quest.name}</h3>
                    <span class="bg-white bg-opacity-20 text-white text-xs font-medium px-2 py-1 rounded">+${quest.xp} XP</span>
                </div>
                ${quest.description ? `<p class="text-sm text-white text-opacity-90 mb-2">${quest.description}</p>` : ''}
                ${deadlineText}
                <div class="flex justify-end space-x-2 mt-3">
                    ${quest.completed ? 
                        `<button class="bg-white bg-opacity-20 text-white px-3 py-1 rounded-md text-sm">Complété</button>` : 
                        `<button class="complete-quest-btn bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1 rounded-md text-sm transition">Compléter</button>`
                    }
                    <button class="edit-quest-btn p-1 text-white text-opacity-80 hover:text-opacity-100">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button class="delete-quest-btn p-1 text-white text-opacity-80 hover:text-red-300">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            `;
            
            questList.appendChild(questCard);
        });
        
        // Ajouter les événements aux boutons
        addQuestButtonEvents();
    }
    
    // Fonction pour rendre les malus
    function renderMalus() {
        const malusList = document.getElementById('malusList');
        malusList.innerHTML = '';
        
        malus.forEach(malusItem => {
            const malusCard = document.createElement('div');
            malusCard.className = 'task-card bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-red-500';
            malusCard.setAttribute('data-id', malusItem.id);
            
            malusCard.innerHTML = `
                <div class="flex justify-between items-center mb-3">
                    <h3 class="font-semibold text-gray-800 dark:text-white">${malusItem.name}</h3>
                    <span class="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs font-medium px-2 py-1 rounded">${malusItem.xp} XP</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-500 dark:text-gray-400">Malus</span>
                    <div class="flex space-x-2">
                        <button class="malus-btn bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/40 text-red-700 dark:text-red-300 px-3 py-1 rounded-md text-sm transition">Appliquer malus</button>
                        <button class="edit-malus-btn p-1 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button class="delete-malus-btn p-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            `;
            
            malusList.appendChild(malusCard);
        });
        
        // Ajouter les événements aux boutons
        addMalusButtonEvents();
    }
    
    // Ajouter les événements aux boutons des tâches
    function addTaskButtonEvents() {
        // Boutons de complétion
        document.querySelectorAll('.complete-btn').forEach(btn => {
            if (btn.textContent === 'Complété') return;
            
            btn.addEventListener('click', function() {
                const card = this.closest('.task-card');
                const taskId = card.getAttribute('data-id');
                const task = tasks.find(t => t.id === taskId);
                
                if (!task.completed) {
                    addXp(task.xp);
                    task.completed = true;
                    task.lastChecked = new Date().toISOString().split('T')[0];
                    this.textContent = 'Complété';
                    this.classList.remove('bg-indigo-100', 'hover:bg-indigo-200', 'dark:bg-indigo-900/30', 'dark:hover:bg-indigo-800/40', 'text-indigo-700', 'dark:text-indigo-300');
                    this.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-500', 'dark:text-gray-400');
                    card.classList.add('completed');
                    saveAllData();;
                }
            });
        });
        
        // Boutons d'incrémentation
        document.querySelectorAll('.increment-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const card = this.closest('.task-card');
                const taskId = card.getAttribute('data-id');
                const task = tasks.find(t => t.id === taskId);
                
                if (task.progress < task.repeat) {
                    task.progress++;
                    task.lastChecked = new Date().toISOString().split('T')[0];
                    
                    // Mettre à jour le texte
                    const progressText = card.querySelector('.text-sm.text-gray-500, .text-sm.text-gray-400');
                    progressText.textContent = `Hebdomadaire • Progression: ${task.progress}/${task.repeat}${task.deadline ? ' • Échéance: ' + task.deadline : ''}`;
                    
                    // Ajouter XP partielle
                    const partialXp = Math.floor(task.xp / task.repeat);
                    addXp(partialXp);
                    
                    // Si complété
                    if (task.progress === task.repeat) {
                        task.completed = true;
                        this.textContent = 'Complété';
                        this.classList.remove('bg-indigo-100', 'hover:bg-indigo-200', 'dark:bg-indigo-900/30', 'dark:hover:bg-indigo-800/40', 'text-indigo-700', 'dark:text-indigo-300');
                        this.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-500', 'dark:text-gray-400');
                        card.classList.add('completed');
                    }
                    
                    saveAllData();;
                }
            });
        });
        
        // Boutons d'édition
        document.querySelectorAll('.edit-task-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const card = this.closest('.task-card');
                const taskId = card.getAttribute('data-id');
                const task = tasks.find(t => t.id === taskId);
                
                document.getElementById('taskModalTitle').textContent = 'Modifier la tâche';
                document.getElementById('taskId').value = task.id;
                document.getElementById('taskName').value = task.name;
                document.getElementById('taskXp').value = task.xp;
                document.getElementById('taskCategory').value = task.category;
                document.getElementById('taskRepeat').value = task.repeat;
                document.getElementById('taskDeadline').value = task.deadline;
                
                if (task.category === 'weekly') {
                    document.getElementById('repeatContainer').classList.remove('hidden');
                } else {
                    document.getElementById('repeatContainer').classList.add('hidden');
                }
                
                taskModal.classList.remove('hidden');
            });
        });
        
        // Boutons de suppression
        document.querySelectorAll('.delete-task-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
                    const card = this.closest('.task-card');
                    const taskId = card.getAttribute('data-id');
                    
                    tasks = tasks.filter(t => t.id !== taskId);
                    saveAllData();;
                    card.remove();
                }
            });
        });
    }
    
    // Ajouter les événements aux boutons des quêtes
    function addQuestButtonEvents() {
        // Boutons de complétion
        document.querySelectorAll('.complete-quest-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const card = this.closest('.quest-card');
                const questId = card.getAttribute('data-id');
                const quest = quests.find(q => q.id === questId);
                
                if (!quest.completed) {
                    addXp(quest.xp);
                    quest.completed = true;
                    this.textContent = 'Complété';
                    this.classList.add('bg-opacity-10');
                    this.classList.remove('hover:bg-opacity-30');
                    card.classList.add('completed', 'opacity-60');
                    
                    addNotification(`Quête accomplie: ${quest.name}`, `Félicitations! +${quest.xp} XP`);
                    saveAllData();;
                }
            });
        });
        
        // Boutons d'édition
        document.querySelectorAll('.edit-quest-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const card = this.closest('.quest-card');
                const questId = card.getAttribute('data-id');
                const quest = quests.find(q => q.id === questId);
                
                document.getElementById('questModalTitle').textContent = 'Modifier la quête';
                document.getElementById('questId').value = quest.id;
                document.getElementById('questName').value = quest.name;
                document.getElementById('questXp').value = quest.xp;
                document.getElementById('questDescription').value = quest.description;
                document.getElementById('questDeadline').value = quest.deadline;
                
                questModal.classList.remove('hidden');
            });
        });
        
        // Boutons de suppression
        document.querySelectorAll('.delete-quest-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                if (confirm('Êtes-vous sûr de vouloir supprimer cette quête ?')) {
                    const card = this.closest('.quest-card');
                    const questId = card.getAttribute('data-id');
                    
                    quests = quests.filter(q => q.id !== questId);
                    saveAllData();;
                    card.remove();
                }
            });
        });
    }
    
    // Ajouter les événements aux boutons des malus
    function addMalusButtonEvents() {
        // Boutons d'application de malus
        document.querySelectorAll('.malus-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const card = this.closest('.task-card');
                const malusId = card.getAttribute('data-id');
                const malusItem = malus.find(m => m.id === malusId);
                
                addXp(malusItem.xp);
                
                this.textContent = 'Malus appliqué';
                this.disabled = true;
                this.classList.remove('bg-red-100', 'hover:bg-red-200', 'dark:bg-red-900/30', 'dark:hover:bg-red-800/40');
                this.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-500', 'dark:text-gray-400');
                
                setTimeout(() => {
                    this.textContent = 'Appliquer malus';
                    this.disabled = false;
                    this.classList.remove('bg-gray-100', 'dark:bg-gray-700', 'text-gray-500', 'dark:text-gray-400');
                    this.classList.add('bg-red-100', 'hover:bg-red-200', 'dark:bg-red-900/30', 'dark:hover:bg-red-800/40');
                }, 2000);
                
                addNotification(`Malus appliqué: ${malusItem.xp} XP`, `Vous avez appliqué un malus: ${malusItem.name}`);
            });
        });
        
        // Boutons d'édition
        document.querySelectorAll('.edit-malus-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const card = this.closest('.task-card');
                const malusId = card.getAttribute('data-id');
                const malusItem = malus.find(m => m.id === malusId);
                
                document.getElementById('malusModalTitle').textContent = 'Modifier le malus';
                document.getElementById('malusId').value = malusItem.id;
                document.getElementById('malusName').value = malusItem.name;
                document.getElementById('malusXp').value = malusItem.xp;
                
                malusModal.classList.remove('hidden');
            });
        });
        
        // Boutons de suppression
        document.querySelectorAll('.delete-malus-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                if (confirm('Êtes-vous sûr de vouloir supprimer ce malus ?')) {
                    const card = this.closest('.task-card');
                    const malusId = card.getAttribute('data-id');
                    
                    malus = malus.filter(m => m.id !== malusId);
                    saveAllData();;
                    card.remove();
                }
            });
        });
    }
    
    // Fermer les modals en cliquant à l'extérieur
    window.addEventListener('click', function(e) {
        if (e.target === taskModal) taskModal.classList.add('hidden');
        if (e.target === questModal) questModal.classList.add('hidden');
        if (e.target === malusModal) malusModal.classList.add('hidden');
    });
    
    // Fonction pour vérifier les tâches non complétées
    function checkMissedTasks() {
        const today = new Date();
        const currentDate = today.toISOString().split('T')[0];
        const dayOfWeek = today.getDay(); // 0 = dimanche, 1 = lundi, etc.
        
        tasks.forEach(task => {
            // Vérifier si la tâche n'est pas complétée et si la date a changé
            if (!task.completed && task.lastChecked !== currentDate) {
                // Pour les tâches quotidiennes
                if (task.category === 'daily') {
                    // Appliquer le malus
                    addXp(-task.xp);
                    
                    // Ajouter une notification
                    addNotification(`Tâche quotidienne manquée: ${task.name}`, `Malus appliqué: -${task.xp} XP`);
                    
                    // Réinitialiser pour le jour suivant
                    task.lastChecked = currentDate;
                }
                // Pour les tâches hebdomadaires, vérifier si c'est dimanche
                else if (task.category === 'weekly' && dayOfWeek === 0) {
                    // Calculer le malus en fonction de la progression
                    const missedProgress = task.repeat - task.progress;
                    if (missedProgress > 0) {
                        const malusXp = -Math.floor((task.xp / task.repeat) * missedProgress);
                        
                        // Appliquer le malus
                        addXp(malusXp);
                        
                        // Ajouter une notification
                        addNotification(`Tâche hebdomadaire incomplète: ${task.name}`, `Malus appliqué: ${malusXp} XP (${task.progress}/${task.repeat} complété)`);
                    }
                    
                    // Réinitialiser pour la semaine suivante
                    task.progress = 0;
                    task.completed = false;
                    task.lastChecked = currentDate;
                }
            }
        });
        
        // Vérifier les quêtes expirées
        quests.forEach(quest => {
            if (!quest.completed && quest.deadline && quest.deadline < currentDate) {
                // Ajouter une notification
                addNotification(`Quête expirée: ${quest.name}`, `La date limite est passée: ${formatDate(quest.deadline)}`);
            }
        });
        
        // Sauvegarder les changements
        saveAllData();;
    }
    
    // Fonction pour formater les dates
    function formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
    }
    
    // Vérifier les échéances toutes les minutes
    setInterval(() => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        
        tasks.forEach(task => {
            if (task.deadline && !task.completed && task.deadline <= currentTime) {
                // Vérifier si la tâche n'a pas déjà été vérifiée aujourd'hui
                const currentDate = now.toISOString().split('T')[0];
                if (task.lastChecked !== currentDate) {
                    // Appliquer le malus
                    addXp(-task.xp);
                    
                    // Ajouter une notification
                    addNotification(`Échéance dépassée: ${task.name}`, `Malus appliqué: -${task.xp} XP`);
                    
                    // Marquer comme vérifié pour aujourd'hui
                    task.lastChecked = currentDate;
                    saveAllData();;
                }
            }
        });
    }, 60000); // Vérifier chaque minute
});