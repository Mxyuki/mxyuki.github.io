// Combined Arknights Tracker Application
// All modules in one file to avoid loading conflicts

// Data Manager Class
class DataManager {
    constructor() {
        this.storageKey = 'arknights-tracker-progress';
        this.operatorDataUrl = './infoOP.json';
    }

    // Load operator data from JSON file
    async loadOperatorData() {
        try {
            console.log('Attempting to load operator data from:', this.operatorDataUrl);
            
            const response = await fetch(this.operatorDataUrl);
            console.log('Fetch response status:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Successfully loaded operator data:', data.length, 'operators');
            
            return this.validateOperatorData(data);
        } catch (error) {
            console.error('Detailed error loading operator data:', error);
            
            // Provide more specific error messages
            if (error.name === 'SyntaxError') {
                throw new Error('Invalid JSON format in infoOP.json file. Please check the file syntax.');
            } else if (error.message.includes('404')) {
                throw new Error('infoOP.json file not found. Make sure it\'s in the same folder as your HTML file.');
            } else if (error.message.includes('Failed to fetch')) {
                throw new Error('Cannot load infoOP.json. Please serve the files through a web server (not file://).');
            } else {
                throw new Error(`Failed to load operator data: ${error.message}`);
            }
        }
    }

    // Validate operator data structure
    validateOperatorData(data) {
        if (!Array.isArray(data)) {
            throw new Error('Invalid data format: Expected an array of operators');
        }

        return data.map(operator => {
            const required = ['name', 'class', 'branch', 'faction', 'rarity', 'img'];
            const missing = required.filter(field => !operator[field]);
            
            if (missing.length > 0) {
                console.warn(`Operator ${operator.name || 'Unknown'} missing fields:`, missing);
            }

            return operator;
        });
    }

    // Load user progress from localStorage
    loadUserProgress() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) {
                return {};
            }

            const parsed = JSON.parse(saved);
            return this.validateUserProgress(parsed);
        } catch (error) {
            console.error('Error loading user progress:', error);
            return {};
        }
    }

    // Validate user progress structure
    validateUserProgress(progress) {
        if (typeof progress !== 'object' || progress === null) {
            console.warn('Invalid progress data, resetting to empty object');
            return {};
        }

        const cleaned = {};
        Object.entries(progress).forEach(([operatorName, data]) => {
            if (typeof data === 'object' && data !== null) {
                cleaned[operatorName] = {
                    owned: Boolean(data.owned),
                    level: this.validateLevel(data.level),
                    potential: this.validatePotential(data.potential),
                    comment: this.validateComment(data.comment),
                    priority: this.extractPriority(data.comment || ''),
                    skills: this.validateSkills(data.skills),
                    modules: this.validateModules(data.modules)
                };
            }
        });

        return cleaned;
    }

    // Validate level data - defaults to 1 if no valid level (allows up to max possible level)
    validateLevel(level) {
        if (typeof level === 'number' && level >= 1 && level <= 90) {
            return level;
        }
        if (typeof level === 'string') {
            const parsed = parseInt(level, 10);
            if (!isNaN(parsed) && parsed >= 1 && parsed <= 90) {
                return parsed;
            }
        }
        return 1; // Default to level 1 instead of null
    }

    // Validate potential data - defaults to 1 if no valid potential
    validatePotential(potential) {
        if (typeof potential === 'number' && potential >= 1 && potential <= 6) {
            return potential;
        }
        if (typeof potential === 'string') {
            const parsed = parseInt(potential, 10);
            if (!isNaN(parsed) && parsed >= 1 && parsed <= 6) {
                return parsed;
            }
        }
        return 1; // Default to potential 1 instead of null
    }

    // Get maximum level based on operator rarity
    getMaxLevel(rarity) {
        switch (rarity) {
            case 1:
            case 2:
                return 30;
            case 3:
                return 55;
            case 4:
                return 70;
            case 5:
                return 80;
            case 6:
                return 90;
            default:
                return 90; // Default to highest level
        }
    }

    // Validate comment data
    validateComment(comment) {
        if (typeof comment === 'string') {
            return comment.trim();
        }
        return '';
    }

    // Extract priority from comment
    extractPriority(comment) {
        const lowerComment = comment.toLowerCase();
        if (lowerComment.includes('essential')) return 'essential';
        if (lowerComment.includes('important')) return 'important';
        if (lowerComment.includes('consider')) return 'consider';
        if (lowerComment.includes('optional')) return 'optional';
        if (lowerComment.includes('useless')) return 'useless';
        if (lowerComment.includes('maxed')) return 'maxed';
        return null;
    }

    // Validate skills data
    validateSkills(skills) {
        if (typeof skills !== 'object' || skills === null) {
            return {};
        }

        const validLevels = ['M0', 'M1', 'M2', 'M3'];
        const cleaned = {};
        
        ['skill1', 'skill2', 'skill3'].forEach(skillKey => {
            if (skills[skillKey] && validLevels.includes(skills[skillKey])) {
                cleaned[skillKey] = skills[skillKey];
            }
        });

        return cleaned;
    }

    // Validate modules data
    validateModules(modules) {
        if (typeof modules !== 'object' || modules === null) {
            return {};
        }

        const validStages = ['S0', 'S1', 'S2', 'S3'];
        const cleaned = {};
        
        Object.entries(modules).forEach(([moduleId, stage]) => {
            if (validStages.includes(stage)) {
                cleaned[moduleId] = stage;
            }
        });

        return cleaned;
    }

    // Save user progress to localStorage
    saveUserProgress(progress) {
        try {
            const dataToSave = JSON.stringify(progress);
            localStorage.setItem(this.storageKey, dataToSave);
            return true;
        } catch (error) {
            console.error('Error saving user progress:', error);
            
            if (error.name === 'QuotaExceededError') {
                throw new Error('Storage quota exceeded. Please clear some browser data.');
            }
            
            throw new Error('Failed to save progress');
        }
    }

    // Export user progress as JSON file
    exportData(progress) {
        try {
            const exportData = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    version: '1.0',
                    appName: 'Arknights Tracker'
                },
                operators: progress
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `arknights-tracker-${this.formatDateForFilename()}.json`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(link.href);
            
            return true;
        } catch (error) {
            console.error('Export error:', error);
            throw new Error('Failed to export data');
        }
    }

    // Import user progress from JSON file
    async importData(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('No file provided'));
                return;
            }

            if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
                reject(new Error('Invalid file type. Please select a JSON file.'));
                return;
            }

            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    const validatedData = this.validateImportData(importedData);
                    resolve(validatedData);
                } catch (error) {
                    reject(new Error('Invalid JSON file or corrupted data'));
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsText(file);
        });
    }

    // Validate imported data
    validateImportData(data) {
        if (typeof data !== 'object' || data === null) {
            throw new Error('Invalid data format');
        }

        if (data.metadata && data.operators) {
            return this.validateUserProgress(data.operators);
        }

        if (data.operators || Object.keys(data).some(key => typeof data[key] === 'object')) {
            return this.validateUserProgress(data.operators || data);
        }

        throw new Error('Invalid data structure');
    }

    // Format date for filename
    formatDateForFilename() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}_${hours}-${minutes}`;
    }

    // Merge imported data with existing data
    mergeProgress(existingProgress, importedProgress, strategy = 'merge') {
        switch (strategy) {
            case 'replace':
                return importedProgress;
            
            case 'merge':
            default:
                const merged = { ...existingProgress };
                
                Object.entries(importedProgress).forEach(([operatorName, data]) => {
                    if (!merged[operatorName]) {
                        merged[operatorName] = data;
                    } else {
                        merged[operatorName] = {
                            owned: merged[operatorName].owned || data.owned,
                            level: data.level || merged[operatorName].level,
                            potential: data.potential || merged[operatorName].potential,
                            comment: data.comment || merged[operatorName].comment,
                            skills: this.mergeSkills(merged[operatorName].skills, data.skills),
                            modules: this.mergeModules(merged[operatorName].modules, data.modules)
                        };
                    }
                });
                
                return merged;
        }
    }

    // Merge skills keeping highest mastery levels
    mergeSkills(existing = {}, imported = {}) {
        const skillLevels = { 'M0': 0, 'M1': 1, 'M2': 2, 'M3': 3 };
        const merged = { ...existing };
        
        Object.entries(imported).forEach(([skill, level]) => {
            const existingLevel = existing[skill] || 'M0';
            if (skillLevels[level] > skillLevels[existingLevel]) {
                merged[skill] = level;
            }
        });
        
        return merged;
    }

    // Merge modules keeping highest stages
    mergeModules(existing = {}, imported = {}) {
        const stageLevels = { 'S0': 0, 'S1': 1, 'S2': 2, 'S3': 3 };
        const merged = { ...existing };
        
        Object.entries(imported).forEach(([module, stage]) => {
            const existingStage = existing[module] || 'S0';
            if (stageLevels[stage] > stageLevels[existingStage]) {
                merged[module] = stage;
            }
        });
        
        return merged;
    }
}

// UI Manager Class
class UIManager {
    constructor() {
        this.tooltip = null;
        this.tooltipTimeout = null;
        this.currentFeedback = null;
        
        this.init();
    }

    init() {
        this.tooltip = document.getElementById('tooltip');
        this.initializeTooltips();
        this.initializeFeedbackSystem();
    }

    // Render all operators in the grid
    renderOperators(operators, userProgress = {}) {
        const grid = document.getElementById('operatorsGrid');
        const noResults = document.getElementById('noResults');
        
        if (!operators || operators.length === 0) {
            grid.innerHTML = '';
            noResults.style.display = 'block';
            return;
        }
        
        noResults.style.display = 'none';
        grid.innerHTML = '';

        operators.forEach((operator, index) => {
            const card = this.createOperatorCard(operator, userProgress[operator.name] || {});
            card.style.animationDelay = `${index * 0.05}s`;
            grid.appendChild(card);
        });
    }

    // Create individual operator card
    createOperatorCard(operator, progress) {
        const template = document.getElementById('operatorCardTemplate');
        const card = template.content.cloneNode(true);
        
        const cardElement = card.querySelector('.operator-card');
        cardElement.dataset.operatorId = operator.name;
        
        // Set rarity stars
        const rarityStars = card.querySelector('.rarity-stars');
        rarityStars.dataset.rarity = operator.rarity;
        
        // Set operator image
        const operatorImg = card.querySelector('.operator-img');
        operatorImg.src = operator.img;
        operatorImg.alt = operator.name;
        operatorImg.loading = 'lazy';
        
        // Handle image loading errors
        operatorImg.onerror = () => {
            operatorImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iODAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSI0MCIgeT0iNDUiIGZpbGw9IiM4ODgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
        };
        
        // Set operator name and link
        const operatorLink = card.querySelector('.operator-name a');
        operatorLink.textContent = operator.name;
        operatorLink.href = `https://arknights.wiki.gg/wiki/${encodeURIComponent(operator.name)}`;
        
        // Set operator details
        card.querySelector('.operator-class').textContent = operator.class;
        card.querySelector('.operator-branch').textContent = operator.branch;
        card.querySelector('.operator-faction').textContent = operator.faction;
        
        // Set ownership status with default values of 1 for level and potential
        this.setupOwnership(card, operator.name, progress.owned || false, progress.level || 1, progress.potential || 1, progress.comment || '', operator.rarity);
        
        // Set up skills
        this.setupSkills(card, operator, progress.skills || {});
        
        // Set up modules
        this.setupModules(card, operator, progress.modules || {});
        
        return cardElement;
    }

    // Setup ownership toggle
    setupOwnership(card, operatorName, isOwned, level = 1, potential = 1, comment = '', rarity = 6) {
        const ownershipBtn = card.querySelector('.ownership-btn');
        const ownershipText = card.querySelector('.ownership-text');
        const levelInput = card.querySelector('.level-input');
        const potentialInput = card.querySelector('.potential-input');
        const commentInput = card.querySelector('.comment-input');
        
        // Get max level based on rarity
        const maxLevel = this.getMaxLevel(rarity);
        
        ownershipBtn.dataset.owned = isOwned;
        ownershipText.textContent = isOwned ? 'Owned' : 'Not Owned';
        
        // Always set level value (default to 1)
        levelInput.value = level;
        levelInput.setAttribute('max', maxLevel);
        this.updateLevelStyling(levelInput, level, maxLevel);
        
        // Always set potential value (default to 1)
        potentialInput.value = potential;
        this.updatePotentialStyling(potentialInput, potential);
        
        // Set comment value with highlighting
        commentInput.value = comment;
        this.updateCommentDisplay(commentInput, comment);
        
        // Add event listeners
        ownershipBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleOwnership(operatorName, ownershipBtn);
        });
        
        // Level input event listener
        let levelTimeout;
        levelInput.addEventListener('input', (e) => {
            clearTimeout(levelTimeout);
            const value = parseInt(e.target.value, 10);
            this.updateLevelStyling(e.target, value, maxLevel);
            
            levelTimeout = setTimeout(() => {
                if (!isNaN(value) && value >= 1 && value <= maxLevel) {
                    this.updateLevel(operatorName, value);
                } else if (e.target.value === '') {
                    this.updateLevel(operatorName, 1); // Default to 1 instead of null
                }
            }, 2000);
        });
        
        levelInput.addEventListener('blur', (e) => {
            clearTimeout(levelTimeout);
            const value = parseInt(e.target.value, 10);
            if (isNaN(value) || value < 1 || value > maxLevel) {
                e.target.value = '1'; // Default to 1
                this.updateLevel(operatorName, 1);
                this.updateLevelStyling(e.target, 1, maxLevel);
            } else {
                this.updateLevel(operatorName, value);
                this.updateLevelStyling(e.target, value, maxLevel);
            }
        });
        
        // Potential input event listener
        let potentialTimeout;
        potentialInput.addEventListener('input', (e) => {
            clearTimeout(potentialTimeout);
            const value = parseInt(e.target.value, 10);
            this.updatePotentialStyling(e.target, value);
            
            potentialTimeout = setTimeout(() => {
                if (!isNaN(value) && value >= 1 && value <= 6) {
                    this.updatePotential(operatorName, value);
                } else if (e.target.value === '') {
                    this.updatePotential(operatorName, 1); // Default to 1 instead of null
                }
            }, 2000);
        });
        
        potentialInput.addEventListener('blur', (e) => {
            clearTimeout(potentialTimeout);
            const value = parseInt(e.target.value, 10);
            if (isNaN(value) || value < 1 || value > 6) {
                e.target.value = '1'; // Default to 1
                this.updatePotential(operatorName, 1);
                this.updatePotentialStyling(e.target, 1);
            } else {
                this.updatePotential(operatorName, value);
                this.updatePotentialStyling(e.target, value);
            }
        });
        
        // Comment input event listener
        let commentTimeout;
        commentInput.addEventListener('input', (e) => {
            clearTimeout(commentTimeout);
            this.updateCommentDisplay(commentInput, e.target.value);
            commentTimeout = setTimeout(() => {
                this.updateComment(operatorName, e.target.value);
            }, 5000);
        });
        
        commentInput.addEventListener('blur', (e) => {
            clearTimeout(commentTimeout);
            this.updateComment(operatorName, e.target.value);
        });
    }

    // Get maximum level based on operator rarity
    getMaxLevel(rarity) {
        switch (rarity) {
            case 1:
            case 2:
                return 30;
            case 3:
                return 55;
            case 4:
                return 70;
            case 5:
                return 80;
            case 6:
                return 90;
            default:
                return 90; // Default to highest level
        }
    }

    // Update level input styling based on max level
    updateLevelStyling(input, level, maxLevel) {
        input.classList.remove('max-level');
        if (level === maxLevel) {
            input.classList.add('max-level');
        }
    }

    // Update potential input styling based on max potential
    updatePotentialStyling(input, potential) {
        input.classList.remove('max-potential');
        if (potential === 6) {
            input.classList.add('max-potential');
        }
    }

    // Setup skills section
    setupSkills(card, operator, skillProgress) {
        const skillsGrid = card.querySelector('.skills-grid');
        skillsGrid.innerHTML = '';
        
        const skills = ['skill1', 'skill2', 'skill3'];
        let hasAnySkills = false;
        
        skills.forEach(skillKey => {
            const skill = operator[skillKey];
            if (!skill) return;
            
            hasAnySkills = true;
            
            // Create skill element dynamically
            const skillItem = document.createElement('div');
            skillItem.className = 'skill-item';
            skillItem.dataset.skill = skillKey;
            
            // Create skill image container
            const skillImageDiv = document.createElement('div');
            skillImageDiv.className = 'skill-image';
            
            const skillImg = document.createElement('img');
            skillImg.src = skill.img;
            skillImg.alt = skill.name;
            skillImg.className = 'skill-img';
            skillImg.dataset.tooltip = skill.name;
            skillImg.loading = 'lazy';
            
            skillImg.onerror = () => {
                skillImg.style.display = 'none';
            };
            
            skillImageDiv.appendChild(skillImg);
            skillItem.appendChild(skillImageDiv);
            
            // Create mastery buttons container
            const masteryButtonsDiv = document.createElement('div');
            masteryButtonsDiv.className = 'mastery-buttons';
            
            const masteryLevels = ['M0', 'M1', 'M2', 'M3'];
            const currentMastery = skillProgress[skillKey] || 'M0';
            
            masteryLevels.forEach(level => {
                const btn = document.createElement('button');
                btn.className = 'mastery-btn';
                btn.dataset.level = level;
                btn.textContent = level;
                
                if (level === currentMastery) {
                    btn.classList.add('active');
                }
                
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const allButtons = masteryButtonsDiv.querySelectorAll('.mastery-btn');
                    this.setSkillMastery(operator.name, skillKey, level, allButtons);
                });
                
                masteryButtonsDiv.appendChild(btn);
            });
            
            skillItem.appendChild(masteryButtonsDiv);
            skillsGrid.appendChild(skillItem);
        });
        
        if (!hasAnySkills) {
            const noSkillsMsg = document.createElement('p');
            noSkillsMsg.className = 'no-skills';
            noSkillsMsg.textContent = 'No active skills';
            skillsGrid.appendChild(noSkillsMsg);
        }
    }

    // Setup modules section
    setupModules(card, operator, moduleProgress) {
        const modulesGrid = card.querySelector('.modules-grid');
        modulesGrid.innerHTML = '';
        
        if (!operator.modules || Object.keys(operator.modules).length === 0) {
            const noModulesMsg = document.createElement('p');
            noModulesMsg.className = 'no-modules';
            noModulesMsg.textContent = 'No modules available';
            modulesGrid.appendChild(noModulesMsg);
            return;
        }
        
        Object.entries(operator.modules).forEach(([moduleId, module]) => {
            const moduleElement = this.createModuleElement(operator.name, moduleId, module, moduleProgress[moduleId] || 'S0');
            modulesGrid.appendChild(moduleElement);
        });
    }

    // Create module element
    createModuleElement(operatorName, moduleId, module, currentStage) {
        const moduleItem = document.createElement('div');
        moduleItem.className = 'module-item';
        moduleItem.dataset.module = moduleId;
        
        // Create module image
        const moduleImageDiv = document.createElement('div');
        moduleImageDiv.className = 'module-image';
        
        const moduleImg = document.createElement('img');
        moduleImg.src = module.img;
        moduleImg.alt = module.name;
        moduleImg.className = 'module-img';
        moduleImg.dataset.tooltip = module.name;
        moduleImg.loading = 'lazy';
        
        moduleImg.onerror = () => {
            moduleImg.style.display = 'none';
        };
        
        moduleImageDiv.appendChild(moduleImg);
        moduleItem.appendChild(moduleImageDiv);
        
        // Create module name
        const moduleNameDiv = document.createElement('div');
        moduleNameDiv.className = 'module-name';
        moduleNameDiv.textContent = module.name;
        moduleItem.appendChild(moduleNameDiv);
        
        // Create stage buttons container
        const stageButtonsDiv = document.createElement('div');
        stageButtonsDiv.className = 'stage-buttons';
        
        const stages = ['S0', 'S1', 'S2', 'S3'];
        stages.forEach(stage => {
            const btn = document.createElement('button');
            btn.className = 'stage-btn';
            btn.dataset.stage = stage;
            btn.textContent = stage;
            
            if (stage === currentStage) {
                btn.classList.add('active');
            }
            
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const allButtons = stageButtonsDiv.querySelectorAll('.stage-btn');
                this.setModuleStage(operatorName, moduleId, stage, allButtons);
            });
            
            stageButtonsDiv.appendChild(btn);
        });
        
        moduleItem.appendChild(stageButtonsDiv);
        
        return moduleItem;
    }

    // Toggle ownership status
    toggleOwnership(operatorName, button) {
        const currentOwned = button.dataset.owned === 'true';
        const newOwned = !currentOwned;
        
        button.dataset.owned = newOwned;
        button.querySelector('.ownership-text').textContent = newOwned ? 'Owned' : 'Not Owned';
        
        // Remove the scale animation that might cause blinking
        // button.style.transform = 'scale(0.95)';
        // setTimeout(() => {
        //     button.style.transform = '';
        // }, 150);
        
        this.dispatchProgressUpdate('ownership', {
            operatorName,
            owned: newOwned
        });
    }

    // Set skill mastery level
    setSkillMastery(operatorName, skillKey, level, buttons) {
        buttons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.level === level);
        });
        
        // Remove the scale animation that might cause blinking
        // const activeBtn = Array.from(buttons).find(btn => btn.dataset.level === level);
        // if (activeBtn) {
        //     activeBtn.style.transform = 'scale(0.9)';
        //     setTimeout(() => {
        //         activeBtn.style.transform = '';
        //     }, 150);
        // }
        
        this.dispatchProgressUpdate('skill', {
            operatorName,
            skillKey,
            level
        });
    }

    // Set module stage
    setModuleStage(operatorName, moduleId, stage, buttons) {
        buttons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.stage === stage);
        });
        
        // Remove the scale animation that might cause blinking
        // const activeBtn = Array.from(buttons).find(btn => btn.dataset.stage === stage);
        // if (activeBtn) {
        //     activeBtn.style.transform = 'scale(0.9)';
        //     setTimeout(() => {
        //         activeBtn.style.transform = '';
        //     }, 150);
        // }
        
        this.dispatchProgressUpdate('module', {
            operatorName,
            moduleId,
            stage
        });
    }

    // Update level
    updateLevel(operatorName, level) {
        this.dispatchProgressUpdate('level', {
            operatorName,
            level: level ? parseInt(level, 10) : 1 // Default to 1 instead of null
        });
    }

    // Update potential
    updatePotential(operatorName, potential) {
        this.dispatchProgressUpdate('potential', {
            operatorName,
            potential: potential ? parseInt(potential, 10) : 1 // Default to 1 instead of null
        });
    }

    // Update comment display with highlighting
    updateCommentDisplay(textarea, comment) {
        // Create a div to show highlighted text below the textarea
        let highlightDiv = textarea.parentNode.querySelector('.comment-highlight');
        
        if (!highlightDiv) {
            highlightDiv = document.createElement('div');
            highlightDiv.className = 'comment-highlight';
            highlightDiv.style.cssText = `
                margin-top: 8px;
                padding: 8px;
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-md);
                font-size: 0.875rem;
                line-height: 1.4;
                min-height: 24px;
            `;
            textarea.parentNode.appendChild(highlightDiv);
        }
        
        if (comment.trim()) {
            const highlightedComment = this.highlightPriorityWords(comment);
            highlightDiv.innerHTML = highlightedComment;
            highlightDiv.style.display = 'block';
        } else {
            highlightDiv.style.display = 'none';
        }
    }

    // Highlight priority words in comment
    highlightPriorityWords(text) {
    const priorities = [
        { word: 'essential', class: 'priority-essential' },
        { word: 'important', class: 'priority-important' },
        { word: 'consider', class: 'priority-consider' },
        { word: 'optional', class: 'priority-optional' },
        { word: 'useless', class: 'priority-useless' },
        { word: 'maxed', class: 'priority-maxed' }
    ];
    
    let highlightedText = text;
    
    priorities.forEach(({ word, class: className }) => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        highlightedText = highlightedText.replace(regex, `<span class="${className}">$&</span>`);
    });
    
    return highlightedText;
}

    // Update comment
    updateComment(operatorName, comment) {
        this.dispatchProgressUpdate('comment', {
            operatorName,
            comment: comment.trim()
        });
    }

    // Dispatch progress update event
    dispatchProgressUpdate(type, data) {
        const event = new CustomEvent('progressUpdate', {
            detail: { type, ...data }
        });
        document.dispatchEvent(event);
    }

    // Initialize tooltip system
    initializeTooltips() {
        if (!this.tooltip) return;

        document.addEventListener('mouseover', (e) => {
            if (e.target.dataset.tooltip) {
                this.showTooltip(e.target, e.target.dataset.tooltip);
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (e.target.dataset.tooltip && this.tooltip.classList.contains('show')) {
                this.updateTooltipPosition(e);
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.dataset.tooltip) {
                this.hideTooltip();
            }
        });

        document.addEventListener('scroll', () => {
            this.hideTooltip();
        });
    }

    // Show tooltip
    showTooltip(element, text) {
        clearTimeout(this.tooltipTimeout);
        
        const tooltipContent = this.tooltip.querySelector('.tooltip-content');
        tooltipContent.textContent = text;
        
        this.tooltipTimeout = setTimeout(() => {
            this.tooltip.classList.add('show');
        }, 300);
    }

    // Update tooltip position
    updateTooltipPosition(e) {
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        
        let left = e.pageX + 10;
        let top = e.pageY - 30;
        
        if (left + tooltipRect.width > viewportWidth) {
            left = e.pageX - tooltipRect.width - 10;
        }
        
        if (top < window.pageYOffset) {
            top = e.pageY + 20;
        }
        
        this.tooltip.style.left = left + 'px';
        this.tooltip.style.top = top + 'px';
    }

    // Hide tooltip
    hideTooltip() {
        clearTimeout(this.tooltipTimeout);
        this.tooltip.classList.remove('show');
    }

    // Initialize feedback system
    initializeFeedbackSystem() {
        const feedbackElement = document.getElementById('feedbackMessage');
        if (!feedbackElement) return;
        
        const closeButton = feedbackElement.querySelector('.feedback-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.hideFeedback();
            });
        }
    }

    // Show feedback message
    showFeedback(message, type = 'info', duration = 5000) {
        const feedbackElement = document.getElementById('feedbackMessage');
        if (!feedbackElement) return;
        
        const textElement = feedbackElement.querySelector('.feedback-text');
        
        this.hideFeedback();
        
        textElement.textContent = message;
        feedbackElement.className = `feedback-message ${type}`;
        feedbackElement.style.display = 'block';
        
        this.currentFeedback = setTimeout(() => {
            this.hideFeedback();
        }, duration);
    }

    // Hide feedback message
    hideFeedback() {
        const feedbackElement = document.getElementById('feedbackMessage');
        if (feedbackElement) {
            feedbackElement.style.display = 'none';
        }
        
        if (this.currentFeedback) {
            clearTimeout(this.currentFeedback);
            this.currentFeedback = null;
        }
    }

    // Show/hide loading state
    showLoading(show) {
        const loading = document.getElementById('loading');
        const grid = document.getElementById('operatorsGrid');
        
        if (show) {
            loading.style.display = 'block';
            grid.style.display = 'none';
        } else {
            loading.style.display = 'none';
            grid.style.display = 'grid';
        }
    }

    // Initialize keyboard navigation
    initializeKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideFeedback();
                this.hideTooltip();
            }
            
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }
        });
    }

    // Update page title with current filter info
    updatePageTitle(filteredCount, totalCount) {
        const baseTitle = 'Arknights Operator Tracker';
        if (filteredCount < totalCount) {
            document.title = `${baseTitle} (${filteredCount}/${totalCount})`;
        } else {
            document.title = baseTitle;
        }
    }

    // Update filter counts
    updateFilterCounts(operators, filteredCount) {
        const totalCount = operators.length;
        console.log(`Showing ${filteredCount} of ${totalCount} operators`);
    }

    // Cleanup resources
    cleanup() {
        clearTimeout(this.tooltipTimeout);
        clearTimeout(this.currentFeedback);
    }
}

// Filter Manager Class
class FilterManager {
    constructor() {
        this.operators = [];
        this.filteredOperators = [];
        this.currentFilters = {
            search: '',
            ownership: 'all',
            rarity: 'all',
            class: 'all',
            priority: 'all'
        };
        this.userProgress = {};
        
        this.initializeEventListeners();
    }

    // Set initial data
    setData(operators, userProgress = {}) {
        this.operators = operators;
        this.userProgress = userProgress;
        this.filteredOperators = [...operators];
        this.applyAllFilters();
    }

    // Update user progress data silently without re-rendering
    updateUserProgressSilently(userProgress) {
        this.userProgress = userProgress;
        // Don't call applyAllFilters() to avoid re-rendering
    }

    // Update user progress data (with re-rendering)
    updateUserProgress(userProgress) {
        this.userProgress = userProgress;
        this.applyAllFilters();
    }

    // Initialize event listeners for filter controls
    initializeEventListeners() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
            
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    e.target.value = '';
                    this.handleSearch('');
                }
            });
        }

        const filters = [
            { id: 'ownershipFilter', key: 'ownership' },
            { id: 'rarityFilter', key: 'rarity' },
            { id: 'classFilter', key: 'class' },
            { id: 'priorityFilter', key: 'priority' }
        ];

        filters.forEach(({ id, key }) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', (e) => {
                    this.currentFilters[key] = e.target.value;
                    this.applyAllFilters();
                });
            }
        });

        const resetBtn = document.getElementById('resetFilters');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetAllFilters();
            });
        }
    }

    // Handle search functionality
    handleSearch(searchTerm) {
        this.currentFilters.search = searchTerm.toLowerCase().trim();
        this.applyAllFilters();
    }

    // Apply search filter
    applySearchFilter(operators) {
        const searchTerm = this.currentFilters.search;
        
        if (!searchTerm) {
            return operators;
        }

        return operators.filter(operator => {
            const searchableFields = [
                operator.name,
                operator.class,
                operator.branch,
                operator.faction
            ];

            if (operator.skill1?.name) searchableFields.push(operator.skill1.name);
            if (operator.skill2?.name) searchableFields.push(operator.skill2.name);
            if (operator.skill3?.name) searchableFields.push(operator.skill3.name);

            if (operator.modules) {
                Object.values(operator.modules).forEach(module => {
                    if (module.name) searchableFields.push(module.name);
                });
            }

            return searchableFields.some(field => 
                field && field.toLowerCase().includes(searchTerm)
            );
        });
    }

    // Apply ownership filter
    applyOwnershipFilter(operators) {
        const ownershipFilter = this.currentFilters.ownership;
        
        if (ownershipFilter === 'all') {
            return operators;
        }

        return operators.filter(operator => {
            const isOwned = this.userProgress[operator.name]?.owned || false;
            return ownershipFilter === 'owned' ? isOwned : !isOwned;
        });
    }

    // Apply rarity filter
    applyRarityFilter(operators) {
        const rarityFilter = this.currentFilters.rarity;
        
        if (rarityFilter === 'all') {
            return operators;
        }

        return operators.filter(operator => 
            operator.rarity.toString() === rarityFilter
        );
    }

    // Apply class filter
    applyClassFilter(operators) {
        const classFilter = this.currentFilters.class;
        
        if (classFilter === 'all') {
            return operators;
        }

        return operators.filter(operator => 
            operator.class === classFilter
        );
    }

    // Apply priority filter
    applyPriorityFilter(operators) {
        const priorityFilter = this.currentFilters.priority;
        
        if (priorityFilter === 'all') {
            return operators;
        }

        return operators.filter(operator => {
            const operatorData = this.userProgress[operator.name];
            if (!operatorData || !operatorData.comment) return false;
            
            const comment = operatorData.comment.toLowerCase();
            return comment.includes(priorityFilter);
        });
    }

    // Apply all filters in sequence
    applyAllFilters() {
        let filtered = [...this.operators];

        filtered = this.applySearchFilter(filtered);
        filtered = this.applyOwnershipFilter(filtered);
        filtered = this.applyRarityFilter(filtered);
        filtered = this.applyClassFilter(filtered);
        filtered = this.applyPriorityFilter(filtered);

        this.filteredOperators = filtered;
        this.dispatchFilterUpdate();
        
        return filtered;
    }

    // Get currently filtered operators
    getFilteredOperators() {
        return this.filteredOperators;
    }

    // Reset all filters to default values
    resetAllFilters() {
        this.currentFilters = {
            search: '',
            ownership: 'all',
            rarity: 'all',
            class: 'all',
            priority: 'all'
        };

        this.resetFilterUI();
        this.applyAllFilters();
    }

    // Reset filter UI elements
    resetFilterUI() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }

        const selects = ['ownershipFilter', 'rarityFilter', 'classFilter', 'priorityFilter'];
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.value = 'all';
            }
        });
    }

    // Get filter statistics
    getFilterStats() {
        const totalOperators = this.operators.length;
        const filteredCount = this.filteredOperators.length;
        
        const rarityStats = {};
        this.filteredOperators.forEach(op => {
            rarityStats[op.rarity] = (rarityStats[op.rarity] || 0) + 1;
        });

        const classStats = {};
        this.filteredOperators.forEach(op => {
            classStats[op.class] = (classStats[op.class] || 0) + 1;
        });

        const ownedCount = this.filteredOperators.filter(op => 
            this.userProgress[op.name]?.owned || false
        ).length;

        return {
            total: totalOperators,
            filtered: filteredCount,
            owned: ownedCount,
            notOwned: filteredCount - ownedCount,
            byRarity: rarityStats,
            byClass: classStats
        };
    }

    // Dispatch filter update event
    dispatchFilterUpdate() {
        const event = new CustomEvent('filtersUpdated', {
            detail: {
                filtered: this.filteredOperators,
                stats: this.getFilterStats(),
                currentFilters: { ...this.currentFilters }
            }
        });
        document.dispatchEvent(event);
    }

    // Save current filter state
    saveFilterState() {
        try {
            localStorage.setItem('arknights-tracker-filters', JSON.stringify(this.currentFilters));
        } catch (error) {
            console.warn('Could not save filter state:', error);
        }
    }

    // Load saved filter state
    loadFilterState() {
        try {
            const saved = localStorage.getItem('arknights-tracker-filters');
            if (saved) {
                const filters = JSON.parse(saved);
                this.currentFilters = { ...this.currentFilters, ...filters };
                this.updateFilterUI();
                return true;
            }
        } catch (error) {
            console.warn('Could not load filter state:', error);
        }
        return false;
    }

    // Update UI to match current filter state
    updateFilterUI() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = this.currentFilters.search;
        }

        const filterMappings = [
            { id: 'ownershipFilter', key: 'ownership' },
            { id: 'rarityFilter', key: 'rarity' },
            { id: 'classFilter', key: 'class' },
            { id: 'priorityFilter', key: 'priority' }
        ];

        filterMappings.forEach(({ id, key }) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = this.currentFilters[key];
            }
        });
    }
}

// Main Application Class
class ArknightsTracker {
    constructor() {
        this.dataManager = new DataManager();
        this.uiManager = new UIManager();
        this.filterManager = new FilterManager();
        
        this.operators = [];
        this.userProgress = {};
        
        this.init();
    }

    async init() {
        try {
            this.uiManager.showLoading(true);
            
            await this.loadOperatorData();
            this.loadUserProgress();
            this.initializeEventListeners();
            
            this.filterManager.setData(this.operators, this.userProgress);
            this.filterManager.loadFilterState();
            
            this.renderOperators();
            this.uiManager.showLoading(false);
            this.uiManager.initializeKeyboardNavigation();
            
            this.uiManager.showFeedback('Operator data loaded successfully!', 'success', 3000);
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.uiManager.showFeedback('Failed to load operator data. Please check your connection and try again.', 'error');
            this.uiManager.showLoading(false);
        }
    }

    async loadOperatorData() {
        try {
            this.operators = await this.dataManager.loadOperatorData();
        } catch (error) {
            console.error('Error loading operator data:', error);
            this.uiManager.showFeedback(error.message, 'error', 10000);
            
            if (confirm('Failed to load operator data. Would you like to load with test data instead?')) {
                this.operators = this.getTestData();
                this.uiManager.showFeedback('Loaded with test data', 'info');
            } else {
                throw error;
            }
        }
    }

    // Test data for development/debugging
    getTestData() {
        return [
            {
                "name": "Test Operator",
                "class": "Guard",
                "branch": "Fighter",
                "faction": "Test",
                "rarity": 6,
                "img": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iODAiIGZpbGw9IiM0MzQzNDMiLz48dGV4dCB4PSI0MCIgeT0iNDUiIGZpbGw9IiNGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiI+VEVTVDwvdGV4dD48L3N2Zz4=",
                "modules": {
                    "1": {
                        "name": "Test Module",
                        "img": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiM2NjY2NjYiLz48dGV4dCB4PSIzMCIgeT0iMzUiIGZpbGw9IiNGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCI+TU9EPC90ZXh0Pjwvc3ZnPg=="
                    }
                },
                "skill1": {
                    "img": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIGZpbGw9IiM5OTk5OTkiLz48dGV4dCB4PSIyNCIgeT0iMjgiIGZpbGw9IiNGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4Ij5TMTwvdGV4dD48L3N2Zz4=",
                    "name": "Test Skill 1"
                }
            }
        ];
    }

    loadUserProgress() {
        this.userProgress = this.dataManager.loadUserProgress();
    }

    saveUserProgress() {
        try {
            this.dataManager.saveUserProgress(this.userProgress);
        } catch (error) {
            console.error('Error saving progress:', error);
            this.uiManager.showFeedback('Failed to save progress. Please try again.', 'error');
        }
    }

    initializeEventListeners() {
        document.addEventListener('progressUpdate', (e) => {
            this.handleProgressUpdate(e.detail);
        });

        document.addEventListener('filtersUpdated', (e) => {
            this.handleFilterUpdate(e.detail);
        });

        const exportBtn = document.getElementById('exportData');
        const importFile = document.getElementById('importFile');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        if (importFile) {
            importFile.addEventListener('change', (e) => this.importData(e));
        }

        window.addEventListener('beforeunload', () => {
            this.filterManager.saveFilterState();
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveUserProgressSilently();
            }
        });
    }

    handleProgressUpdate(detail) {
        const { type, operatorName } = detail;
        
        if (!this.userProgress[operatorName]) {
            this.userProgress[operatorName] = {
                owned: false,
                level: 1, // Default to 1 instead of null
                potential: 1, // Default to 1 instead of null
                comment: '',
                skills: {},
                modules: {}
            };
        }

        switch (type) {
            case 'ownership':
                this.userProgress[operatorName].owned = detail.owned;
                break;
                
            case 'level':
                this.userProgress[operatorName].level = detail.level;
                break;
                
            case 'potential':
                this.userProgress[operatorName].potential = detail.potential;
                break;
                
            case 'comment':
                this.userProgress[operatorName].comment = detail.comment;
                // Update priority based on comment
                this.userProgress[operatorName].priority = this.dataManager.extractPriority(detail.comment);
                break;
                
            case 'skill':
                if (!this.userProgress[operatorName].skills) {
                    this.userProgress[operatorName].skills = {};
                }
                this.userProgress[operatorName].skills[detail.skillKey] = detail.level;
                break;
                
            case 'module':
                if (!this.userProgress[operatorName].modules) {
                    this.userProgress[operatorName].modules = {};
                }
                this.userProgress[operatorName].modules[detail.moduleId] = detail.stage;
                break;
        }

        // Save progress silently without any UI updates
        this.saveUserProgressSilently();
        
        // Only update filter manager data without triggering re-render
        this.filterManager.updateUserProgressSilently(this.userProgress);
    }

    // Silent save without feedback animation
    saveUserProgressSilently() {
        try {
            this.dataManager.saveUserProgress(this.userProgress);
        } catch (error) {
            console.error('Error saving progress:', error);
            // Only show error feedback, not success
            this.uiManager.showFeedback('Failed to save progress. Please try again.', 'error');
        }
    }

    handleFilterUpdate(detail) {
        const { filtered, stats } = detail;
        
        this.uiManager.renderOperators(filtered, this.userProgress);
        this.uiManager.updatePageTitle(stats.filtered, stats.total);
        this.uiManager.updateFilterCounts(this.operators, stats.filtered);
    }

    renderOperators() {
        const filteredOperators = this.filterManager.getFilteredOperators();
        this.uiManager.renderOperators(filteredOperators, this.userProgress);
    }

    async exportData() {
        try {
            const success = this.dataManager.exportData(this.userProgress);
            if (success) {
                const stats = this.getProgressStats();
                this.uiManager.showFeedback(
                    `Data exported successfully! (${stats.ownedCount} operators, ${stats.masteredSkills} mastered skills)`, 
                    'success'
                );
            }
        } catch (error) {
            console.error('Export error:', error);
            this.uiManager.showFeedback('Failed to export data. Please try again.', 'error');
        }
    }

    async importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const importedProgress = await this.dataManager.importData(file);
            this.userProgress = this.dataManager.mergeProgress(this.userProgress, importedProgress, 'merge');
            
            this.saveUserProgress();
            this.filterManager.updateUserProgress(this.userProgress);
            this.renderOperators();
            
            const stats = this.getProgressStats();
            this.uiManager.showFeedback(
                `Data imported successfully! Now tracking ${stats.ownedCount} operators.`, 
                'success'
            );
            
        } catch (error) {
            console.error('Import error:', error);
            this.uiManager.showFeedback(`Import failed: ${error.message}`, 'error');
        }
        
        event.target.value = '';
    }

    getProgressStats() {
        const ownedOperators = Object.values(this.userProgress).filter(p => p.owned);
        const ownedCount = ownedOperators.length;
        
        let masteredSkills = 0;
        let maxModules = 0;
        let avgLevel = 0;
        let maxPotential = 0;
        
        Object.values(this.userProgress).forEach(progress => {
            if (progress.skills) {
                masteredSkills += Object.values(progress.skills).filter(level => level === 'M3').length;
            }
            if (progress.modules) {
                maxModules += Object.values(progress.modules).filter(stage => stage === 'S3').length;
            }
            if (progress.level) {
                avgLevel += progress.level;
            }
            if (progress.potential === 6) {
                maxPotential++;
            }
        });
        
        if (ownedCount > 0) {
            avgLevel = Math.round(avgLevel / ownedCount);
        }
        
        return {
            ownedCount,
            totalOperators: this.operators.length,
            masteredSkills,
            maxModules,
            avgLevel,
            maxPotential,
            completionRate: ((ownedCount / this.operators.length) * 100).toFixed(1)
        };
    }

    // Utility methods for external access
    getOperatorByName(name) {
        return this.operators.find(op => op.name === name);
    }

    getOperatorProgress(name) {
        return this.userProgress[name] || {
            owned: false,
            level: 1, // Default to 1 instead of null
            potential: 1, // Default to 1 instead of null
            comment: '',
            priority: null,
            skills: {},
            modules: {}
        };
    }

    // Debug methods
    debugInfo() {
        console.log('=== Arknights Tracker Debug Info ===');
        console.log('Total operators:', this.operators.length);
        console.log('User progress entries:', Object.keys(this.userProgress).length);
        console.log('Current filters:', this.filterManager.currentFilters);
        console.log('Filtered operators:', this.filterManager.getFilteredOperators().length);
        console.log('Progress stats:', this.getProgressStats());
        
        // Priority breakdown
        const priorityBreakdown = {};
        Object.values(this.userProgress).forEach(progress => {
            if (progress.priority) {
                priorityBreakdown[progress.priority] = (priorityBreakdown[progress.priority] || 0) + 1;
            }
        });
        console.log('Priority breakdown:', priorityBreakdown);
    }

    // Reset all data
    resetAllData() {
        if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
            this.dataManager.clearAllData();
            this.userProgress = {};
            this.filterManager.updateUserProgress(this.userProgress);
            this.filterManager.resetAllFilters();
            this.renderOperators();
            this.uiManager.showFeedback('All data has been reset.', 'info');
        }
    }

    // Performance monitoring
    measurePerformance(operation, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`${operation} took ${(end - start).toFixed(2)}ms`);
        return result;
    }

    // Error handling
    handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        this.uiManager.showFeedback(
            `An error occurred${context ? ` in ${context}` : ''}. Please try again.`,
            'error'
        );
    }

    // Cleanup on page unload
    cleanup() {
        this.saveUserProgress();
        this.filterManager.saveFilterState();
        this.uiManager.cleanup();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.arknightsTracker = new ArknightsTracker();
    
    // Add cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (window.arknightsTracker) {
            window.arknightsTracker.cleanup();
        }
    });
    
    // Add debug access in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.debug = () => window.arknightsTracker.debugInfo();
        console.log('Debug mode enabled. Type debug() in console for info.');
    }
});
