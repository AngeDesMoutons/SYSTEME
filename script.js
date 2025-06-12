document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let sessionId = null;
    let xp = 0;
    let maxXp = 100;
    let level = 0;
    let notifications = 0;
    let tasks = [];
    let quests = [];
    let malus = [];
    let bonus = [];
    let currentTheme = 'light';

    async function loadAllData() {
        try {
            const res = await fetch('data.php', {
                cache: "no-store",
                headers: { 'X-Session-Id': sessionId || localStorage.getItem('sessionId') || '' }
            });
            if (res.status === 403) {
                alert("Connexion expirée ou utilisée ailleurs. Veuillez vous reconnecter.");
                localStorage.removeItem('sessionId');
                window.location.reload();
                return;
            }
            if (res.ok) {
                const data = await res.json();
                xp = data.xp || 0;
                maxXp = data.maxXp || 100;
                level = data.level || 0;
                tasks = data.tasks || [];
                quests = data.quests || [];
                bonus = data.bonus || [];
                malus = data.malus || [];
            }
        } catch (e) {
            // Si erreur, tu peux initialiser avec des valeurs par défaut si tu veux
        }
    }
    
    async function saveAllData() {
        // Ne sauvegarde pas si aucune donnée utile (évite l'écrasement au démarrage)
        if (
            (tasks.length === 0 && quests.length === 0 && malus.length === 0) &&
            xp === 0 && level === 0
        ) {
            return;
        }
        const res = await fetch('data.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-Id': sessionId || localStorage.getItem('sessionId') || ''
            },
            body: JSON.stringify({ xp, maxXp, level, tasks, quests, bonus, malus })
        });
        if (res.status === 403) {
            alert("Connexion expirée ou utilisée ailleurs. Veuillez vous reconnecter.");
            localStorage.removeItem('sessionId');
            window.location.reload();
            return;
        }
    }

    // Simuler un chargement
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('passwordScreen').classList.remove('hidden');
    }, 1000);
    
    // Gestion du mot de passe
    document.getElementById('passwordForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const password = document.getElementById('password').value;

        // Vérification côté serveur
        const res = await fetch('check_password.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        const data = await res.json();

        if (data.success) {
            sessionId = data.sessionId;
            localStorage.setItem('sessionId', sessionId);
            hideWithAnimation(document.getElementById('passwordScreen'), 'fade-out');
            setTimeout(() => {
                document.getElementById('app').classList.remove('hidden');
                document.getElementById('app').classList.add('fade-in');
            }, 400);
            initializeData();
            window.addEventListener('beforeunload', function() {
                saveAllData();
            });
        } else {
            alert('Mot de passe incorrect.');
        }
    });

    function hideWithAnimation(element, animation = 'fade-out', duration = 400) {
        document.body.classList.add('scrollbar-fade');
        element.classList.remove('fade-in', 'slide-in');
        element.classList.add(animation);
        setTimeout(() => {
            element.classList.add('hidden');
            element.classList.remove(animation);
            document.body.classList.remove('scrollbar-fade');
        }, duration);
    }
    
    document.getElementById('refreshBtn').addEventListener('click', function() {
        const svg = this.querySelector('svg');
        svg.classList.add('spin');
        // Sauvegarde avant de recharger les données
        saveAllData().then(() => {
            if (typeof initializeData === 'function') {
                initializeData().then(() => {
                    addNotification('Rafraîchissement', 'L\'application a été rechargée avec succès.');
                    setTimeout(() => {
                        svg.classList.remove('spin');
                    }, 700);
                });
            }
        });
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
    
    function showWithAnimation(element) {
        element.classList.remove('hidden', 'fade-out');
        element.classList.add('fade-in');
    }
    
    // Gestion des filtres
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('filter-btn')) {
        const filter = e.target.getAttribute('data-filter');

        // Mise à jour des boutons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.classList.remove('bg-indigo-600', 'dark:bg-indigo-500', 'text-white', 'animate-pulse');
            btn.classList.add('bg-white', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
        });
        e.target.classList.remove('bg-white', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
        e.target.classList.add('bg-indigo-600', 'dark:bg-indigo-500', 'text-white', 'animate-pulse');
        // Sélection des sections
        const questSection = document.getElementById('questList').closest('.mt-8');
        const malusSection = document.getElementById('malusList').closest('.mt-8');
        const bonusSection = document.getElementById('bonusList').closest('.mt-8');

        // Cartes
        const taskCards = document.querySelectorAll('#taskList .task-card');
        const questCards = document.querySelectorAll('#questList .quest-card');
        const malusCards = document.querySelectorAll('#malusList .task-card');
        const bonusCards = document.querySelectorAll('#bonusList .task-card');

        const filtersContainer = document.getElementById('filtersContainer');
        filtersContainer.classList.add('scrollbar-fade');
        document.body.classList.add('scrollbar-fade');
        setTimeout(() => {
            filtersContainer.classList.remove('scrollbar-fade');
            document.body.classList.remove('scrollbar-fade');
        }, 100);
        // Application des filtres
        switch (filter) {
            case 'daily':
                taskCards.forEach(card => {
                    if (card.getAttribute('data-category') === 'daily') {
                        showWithAnimation(card);
                    } else {
                        if (!card.classList.contains('hidden')) hideWithAnimation(card, 'fade-out');
                    }
                });
                questCards.forEach(card => { if (!card.classList.contains('hidden')) hideWithAnimation(card, 'fade-out'); });
                bonusCards.forEach(card => { if (!card.classList.contains('hidden')) hideWithAnimation(card, 'fade-out'); });
                malusCards.forEach(card => { if (!card.classList.contains('hidden')) hideWithAnimation(card, 'fade-out'); });
                hideWithAnimation(questSection, 'fade-out');
                hideWithAnimation(bonusSection, 'fade-out');
                hideWithAnimation(malusSection, 'fade-out');
                break;
            case 'weekly':
                taskCards.forEach(card => {
                    if (card.getAttribute('data-category') === 'weekly') {
                        showWithAnimation(card);
                    } else {
                        if (!card.classList.contains('hidden')) hideWithAnimation(card, 'fade-out');
                    }
                });
                questCards.forEach(card => { if (!card.classList.contains('hidden')) hideWithAnimation(card, 'fade-out'); });
                bonusCards.forEach(card => { if (!card.classList.contains('hidden')) hideWithAnimation(card, 'fade-out'); });
                malusCards.forEach(card => { if (!card.classList.contains('hidden')) hideWithAnimation(card, 'fade-out'); });
                hideWithAnimation(questSection, 'fade-out');
                hideWithAnimation(bonusSection, 'fade-out');
                hideWithAnimation(malusSection, 'fade-out');
                break;
            case 'quest':
                taskCards.forEach(card => { if (!card.classList.contains('hidden')) hideWithAnimation(card, 'fade-out'); });
                questCards.forEach(card => { showWithAnimation(card); });
                bonusCards.forEach(card => { if (!card.classList.contains('hidden')) hideWithAnimation(card, 'fade-out'); });
                malusCards.forEach(card => { if (!card.classList.contains('hidden')) hideWithAnimation(card, 'fade-out'); });
                showWithAnimation(questSection);
                hideWithAnimation(bonusSection, 'fade-out');
                hideWithAnimation(malusSection, 'fade-out');
                break;
            case 'completed':
                taskCards.forEach(card => {
                    if (card.classList.contains('completed')) {
                        showWithAnimation(card);
                    } else {
                        if (!card.classList.contains('hidden')) hideWithAnimation(card, 'fade-out');
                    }
                });

                // Correction pour les quêtes spéciales
                let hasCompletedQuest = false;
                questCards.forEach(card => {
                    if (card.classList.contains('completed')) {
                        showWithAnimation(card);
                        hasCompletedQuest = true;
                    } else {
                        if (!card.classList.contains('hidden')) hideWithAnimation(card, 'fade-out');
                    }
                });
                if (hasCompletedQuest) {
                    showWithAnimation(questSection);
                } else {
                    hideWithAnimation(questSection, 'fade-out');
                }

                malusCards.forEach(card => { if (!card.classList.contains('hidden')) hideWithAnimation(card, 'fade-out'); });
                bonusCards.forEach(card => { if (!card.classList.contains('hidden')) hideWithAnimation(card, 'fade-out'); });
                hideWithAnimation(bonusSection, 'fade-out');
                hideWithAnimation(malusSection, 'fade-out');
                break;
            case 'malus':
                taskCards.forEach(card => { if (!card.classList.contains('hidden')) hideWithAnimation(card, 'fade-out'); });
                questCards.forEach(card => { if (!card.classList.contains('hidden')) hideWithAnimation(card, 'fade-out'); });
                bonusCards.forEach(card => { if (!card.classList.contains('hidden')) hideWithAnimation(card, 'fade-out'); });
                malusCards.forEach(card => { showWithAnimation(card); });
                hideWithAnimation(questSection, 'fade-out');
                hideWithAnimation(bonusSection, 'fade-out');
                showWithAnimation(malusSection);
                break;
            case 'bonus':
                taskCards.forEach(card => { if (!card.classList.contains('hidden')) hideWithAnimation(card, 'fade-out'); });
                questCards.forEach(card => { if (!card.classList.contains('hidden')) hideWithAnimation(card, 'fade-out'); });
                malusCards.forEach(card => { if (!card.classList.contains('hidden')) hideWithAnimation(card, 'fade-out'); });
                bonusCards.forEach(card => { showWithAnimation(card); });
                hideWithAnimation(questSection, 'fade-out');
                hideWithAnimation(malusSection, 'fade-out');
                showWithAnimation(bonusSection);
                break;
            case 'all':
            default:
                taskCards.forEach(card => { showWithAnimation(card); });
                questCards.forEach(card => { showWithAnimation(card); });
                bonusCards.forEach(card => { showWithAnimation(card); });
                malusCards.forEach(card => { showWithAnimation(card); });
                showWithAnimation(questSection);
                showWithAnimation(malusSection);
                showWithAnimation(bonusSection);
                break;
        }
    }});
    
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
        
        taskModal.classList.remove('hidden');
        document.getElementById('taskName').focus();
    });
    
    cancelTaskBtn.addEventListener('click', function() {
        hideWithAnimation(taskModal, 'fade-out');
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
        
        const task = {
            id,
            name,
            xp: xpValue,
            category,
            repeat: category === 'weekly' ? repeat : 1,
            progress: 0,
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
        hideWithAnimation(taskModal, 'fade-out');
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
        hideWithAnimation(questModal, 'fade-out');
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
        hideWithAnimation(questModal, 'fade-out');
    });
    
    // Modal bonus
    const bonusModal = document.getElementById('bonusModal');
    const addBonusBtn = document.getElementById('addBonusBtn');
    const cancelBonusBtn = document.getElementById('cancelBonusBtn');
    const bonusForm = document.getElementById('bonusForm');

    addBonusBtn.addEventListener('click', function() {
        document.getElementById('bonusModalTitle').textContent = 'Ajouter un bonus';
        document.getElementById('bonusId').value = '';
        document.getElementById('bonusName').value = '';
        document.getElementById('bonusXp').value = '10';

        bonusModal.classList.remove('hidden');
        document.getElementById('bonusName').focus();
    });

    cancelBonusBtn.addEventListener('click', function() {
        hideWithAnimation(bonusModal, 'fade-out');
    });

    bonusForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const id = document.getElementById('bonusId').value || Date.now().toString();
        const name = document.getElementById('bonusName').value;
        const xpValue = parseInt(document.getElementById('bonusXp').value);

        const bonusItem = {
            id,
            name,
            xp: xpValue
        };

        // Ajouter ou mettre à jour le bonus
        const existingIndex = bonus.findIndex(b => b.id === id);
        if (existingIndex >= 0) {
            bonus[existingIndex] = bonusItem;
        } else {
            bonus.push(bonusItem);
        }

        saveAllData();
        renderBonus();
        hideWithAnimation(bonusModal, 'fade-out');
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
        hideWithAnimation(malusModal, 'fade-out');
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
        hideWithAnimation(malusModal, 'fade-out');
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
    // Réinitialise les notifications à chaque connexion
    document.getElementById('notificationsList').innerHTML = '';
    notifications = 0;
    updateNotificationCount();

    checkMissedTasks();
    renderTasks();
    renderQuests();
    renderBonus();
    renderMalus();

    const percentage = Math.min(100, Math.floor((xp / maxXp) * 100));
    document.querySelector('.xp-bar').style.width = `${percentage}%`;
    document.querySelector('.text-sm.font-medium.text-indigo-700, .text-sm.font-medium.text-indigo-300').textContent = `Progression: ${xp} XP / ${maxXp} XP`;
    document.querySelectorAll('.text-sm.font-medium.text-indigo-700 + span, .text-sm.font-medium.text-indigo-300 + span')[0].textContent = `${percentage}%`;
    document.querySelector('.level-badge').textContent = `Niveau ${level}`;
    }
    
    // Fonction pour rendre les tâches avec tri logique
    function renderTasks() {
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = '';

        // Tri logique
        const sortedTasks = [...tasks].sort((a, b) => {
            // 1. Quotidiennes non complétées
            if (a.category === 'daily' && !a.completed && !(b.category === 'daily' && !b.completed)) return -1;
            if (b.category === 'daily' && !b.completed && !(a.category === 'daily' && !a.completed)) return 1;
            // 2. Hebdomadaires non complétées
            if (a.category === 'weekly' && !a.completed && !(b.category === 'weekly' && !b.completed)) return -1;
            if (b.category === 'weekly' && !b.completed && !(a.category === 'weekly' && !a.completed)) return 1;
            // 3. Quotidiennes complétées
            if (a.category === 'daily' && a.completed && !(b.category === 'daily' && b.completed)) return -1;
            if (b.category === 'daily' && b.completed && !(a.category === 'daily' && a.completed)) return 1;
            // 4. Hebdomadaires complétées
            if (a.category === 'weekly' && a.completed && !(b.category === 'weekly' && b.completed)) return -1;
            if (b.category === 'weekly' && b.completed && !(a.category === 'weekly' && a.completed)) return 1;
            // Si même catégorie et même statut, trier par progression croissante (pour weekly)
            if (a.category === b.category && a.completed === b.completed) {
                if (a.category === 'weekly') {
                    return (a.progress / a.repeat) - (b.progress / b.repeat);
                }
                return a.name.localeCompare(b.name, 'fr');
            }
            return 0;
        });

        sortedTasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.className = `task-card bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md ${task.completed ? 'completed' : ''} fade-in`;
            taskCard.setAttribute('data-category', task.category);
            taskCard.setAttribute('data-id', task.id);

            let progressText = '';
            if (task.category === 'weekly' && task.repeat > 1) {
                progressText = `Progression: ${task.progress}/${task.repeat}`;
            }

            taskCard.innerHTML = `
                <div class="flex justify-between items-center mb-3">
                    <h3 class="font-semibold text-gray-800 dark:text-white">${task.name}</h3>
                    <span class="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium px-2 py-1 rounded">+${task.xp} XP</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-500 dark:text-gray-400">${task.category === 'daily' ? 'Quotidien' : 'Hebdomadaire'} ${progressText ? '• ' + progressText : ''}</span>
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

        addTaskButtonEvents();
    }
    
    // Fonction pour rendre les quêtes spéciales avec tri logique
    function renderQuests() {
        const questList = document.getElementById('questList');
        questList.innerHTML = '';

        // Tri logique
        const sortedQuests = [...quests].sort((a, b) => {
            // Non complétées d'abord
            if (!a.completed && b.completed) return -1;
            if (a.completed && !b.completed) return 1;
            // Si non complétées, échéance la plus proche d'abord
            if (!a.completed && !b.completed) {
                if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline);
                if (a.deadline) return -1;
                if (b.deadline) return 1;
                // Sinon, XP décroissant
                return b.xp - a.xp;
            }
            // Si complétées, échéance la plus récente d'abord
            if (a.completed && b.completed) {
                if (a.deadline && b.deadline) return new Date(b.deadline) - new Date(a.deadline);
                if (a.deadline) return -1;
                if (b.deadline) return 1;
                return b.xp - a.xp;
            }
            return 0;
        });

        sortedQuests.forEach(quest => {
            const questCard = document.createElement('div');
            questCard.className = `quest-card p-4 rounded-lg shadow-md text-white ${quest.completed ? 'completed opacity-60' : ''} fade-in`;
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

        addQuestButtonEvents();
    }
    
    // Fonction pour rendre les malus avec tri logique
    function renderMalus() {
        const malusList = document.getElementById('malusList');
        malusList.innerHTML = '';

        // Tri par XP décroissant (plus punitif en haut)
        const sortedMalus = [...malus].sort((a, b) => b.xp - a.xp);

        sortedMalus.forEach(malusItem => {
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

        addMalusButtonEvents();
    }
    
    // Fonction pour rendre les bonus avec tri logique
    function renderBonus() {
        const bonusList = document.getElementById('bonusList');
        bonusList.innerHTML = '';

        // Tri par XP décroissant (plus gratifiant en haut)
        const sortedBonus = [...bonus].sort((a, b) => b.xp - a.xp);

        sortedBonus.forEach(bonusItem => {
            const bonusCard = document.createElement('div');
            bonusCard.className = 'task-card bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-green-500';
            bonusCard.setAttribute('data-id', bonusItem.id);

            bonusCard.innerHTML = `
                <div class="flex justify-between items-center mb-3">
                    <h3 class="font-semibold text-gray-800 dark:text-white">${bonusItem.name}</h3>
                    <span class="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium px-2 py-1 rounded">+${bonusItem.xp} XP</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-500 dark:text-gray-400">Bonus</span>
                    <div class="flex space-x-2">
                        <button class="bonus-btn bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/40 text-green-700 dark:text-green-300 px-3 py-1 rounded-md text-sm transition">Appliquer bonus</button>
                        <button class="edit-bonus-btn p-1 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button class="delete-bonus-btn p-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            `;

            bonusList.appendChild(bonusCard);
        });

        addBonusButtonEvents();
    }
    
    function addBonusButtonEvents() {
        // Appliquer bonus
        document.querySelectorAll('.bonus-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const card = this.closest('.task-card');
                const bonusId = card.getAttribute('data-id');
                const bonusItem = bonus.find(b => b.id === bonusId);

                addXp(bonusItem.xp);

                this.textContent = 'Bonus appliqué';
                this.disabled = true;
                this.classList.remove('bg-green-100', 'hover:bg-green-200', 'dark:bg-green-900/30', 'dark:hover:bg-green-800/40');
                this.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-500', 'dark:text-gray-400');

                setTimeout(() => {
                    this.textContent = 'Appliquer bonus';
                    this.disabled = false;
                    this.classList.remove('bg-gray-100', 'dark:bg-gray-700', 'text-gray-500', 'dark:text-gray-400');
                    this.classList.add('bg-green-100', 'hover:bg-green-200', 'dark:bg-green-900/30', 'dark:hover:bg-green-800/40');
                }, 2000);

                addNotification(`Bonus appliqué: +${bonusItem.xp} XP`, `Vous avez appliqué un bonus: ${bonusItem.name}`);
            });
        });

        // Editer bonus
        document.querySelectorAll('.edit-bonus-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const card = this.closest('.task-card');
                const bonusId = card.getAttribute('data-id');
                const bonusItem = bonus.find(b => b.id === bonusId);

                document.getElementById('bonusModalTitle').textContent = 'Modifier le bonus';
                document.getElementById('bonusId').value = bonusItem.id;
                document.getElementById('bonusName').value = bonusItem.name;
                document.getElementById('bonusXp').value = bonusItem.xp;

                bonusModal.classList.remove('hidden');
            });
        });

        // Supprimer bonus
        document.querySelectorAll('.delete-bonus-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                if (confirm('Êtes-vous sûr de vouloir supprimer ce bonus ?')) {
                    const card = this.closest('.task-card');
                    const bonusId = card.getAttribute('data-id');

                    bonus = bonus.filter(b => b.id !== bonusId);
                    saveAllData();
                    hideWithAnimation(card, 'fade-out');
                    setTimeout(() => card.remove(), 400);
                }
            });
        });
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
                    renderTasks();
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
                        saveAllData();;
                        renderTasks();
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
                    hideWithAnimation(card, 'fade-out');
                    setTimeout(() => card.remove(), 400);
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
                    hideWithAnimation(card, 'fade-out');
                    setTimeout(() => card.remove(), 400);
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
                    hideWithAnimation(card, 'fade-out');
                    setTimeout(() => card.remove(), 400);
                }
            });
        });
    }
    
    // Fermer les modals en cliquant à l'extérieur
    window.addEventListener('click', function(e) {
        if (e.target === taskModal) hideWithAnimation(taskModal, 'fade-out');
        if (e.target === questModal) hideWithAnimation(questModal, 'fade-out');
        if (e.target === bonusModal) hideWithAnimation(bonusModal, 'fade-out');
        if (e.target === malusModal) hideWithAnimation(malusModal, 'fade-out');
    });
    
    // Fonction pour vérifier les tâches non complétées
    function checkMissedTasks() {
        const today = new Date();
        const currentDate = today.toISOString().split('T')[0];
        const dayOfWeek = today.getDay(); // 0 = dimanche, 1 = lundi, etc.

        tasks.forEach(task => {
            // Réinitialisation quotidienne pour les tâches quotidiennes
            if (task.category === 'daily' && task.lastChecked !== currentDate) {
                if (!task.completed) {
                    // Appliquer le malus si non complétée
                    addXp(-task.xp);
                    addNotification(`Tâche quotidienne manquée: ${task.name}`, `Malus appliqué: -${task.xp} XP`);
                }
                // Réinitialiser la tâche pour le nouveau jour
                task.completed = false;
                task.lastChecked = currentDate;
            }

            // Réinitialisation hebdomadaire pour les tâches hebdomadaires (le dimanche)
            if (task.category === 'weekly' && dayOfWeek === 0 && task.lastChecked !== currentDate) {
                if (task.progress < task.repeat) {
                    const missedProgress = task.repeat - task.progress;
                    if (missedProgress > 0) {
                        const malusXp = -Math.floor((task.xp / task.repeat) * missedProgress);
                        addXp(malusXp);
                        addNotification(`Tâche hebdomadaire incomplète: ${task.name}`, `Malus appliqué: ${malusXp} XP (${task.progress}/${task.repeat} complété)`);
                    }
                }
                // Réinitialiser la tâche pour la nouvelle semaine
                task.progress = 0;
                task.completed = false;
                task.lastChecked = currentDate;
            }
        });

        // Vérifier les quêtes expirées
        quests.forEach(quest => {
            if (!quest.completed && quest.deadline && quest.deadline < currentDate) {
                addNotification(`Quête expirée: ${quest.name}`, `La date limite est passée: ${formatDate(quest.deadline)}`);
            }
        });

        // Sauvegarder les changements
        saveAllData();
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
    
});