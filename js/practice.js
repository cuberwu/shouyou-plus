/**
 * 首右plus 练习逻辑模块
 * 处理用户交互、反馈显示和状态管理
 */

class PracticeApp {
    constructor() {
        // 管理器实例
        this.radicalManager = new RadicalManager();
        this.storageManager = new StorageManager();
        
        // 当前字根
        this.currentRadical = null;
        
        // 答案是否已显示
        this.answerRevealed = false;
        
        // 是否正在过渡到下一个字根（防止快速连续按键导致跳过字根）
        this.isTransitioning = false;
        
        // 统计数据
        this.stats = {
            totalAttempts: 0,
            correctCount: 0,
            wrongCount: 0,
            currentCombo: 0,
            maxCombo: 0,
            practicedCount: 0
        };
        
        // DOM 元素引用
        this.elements = {};
        
        // 反馈消息定时器
        this.feedbackTimer = null;
        
        // 初始化
        this.init();
    }
    
    /**
     * 初始化应用
     */
    init() {
        // 缓存 DOM 元素
        this.cacheElements();
        
        // 恢复存储的数据
        this.restoreFromStorage();
        
        // 绑定事件
        this.bindEvents();
        
        // 显示第一个字根
        this.showNextRadical();
        
        // 更新 UI
        this.updateUI();
        
        // 聚焦输入框
        this.focusInput();
    }
    
    /**
     * 缓存 DOM 元素引用
     */
    cacheElements() {
        this.elements = {
            radicalChar: document.getElementById('radical-char'),
            keyHint: document.getElementById('key-hint'),
            keyHintContainer: document.getElementById('key-hint-container'),
            inputField: document.getElementById('input-field'),
            feedbackIcon: document.getElementById('feedback-icon'),
            iconCorrect: document.getElementById('icon-correct'),
            iconWrong: document.getElementById('icon-wrong'),
            feedbackMessage: document.getElementById('feedback-message'),
            currentCount: document.getElementById('current-count'),
            totalCount: document.getElementById('total-count'),
            progressBar: document.getElementById('progress-bar'),
            accuracy: document.getElementById('accuracy'),
            combo: document.getElementById('combo'),
            comboMultiplier: document.getElementById('combo-multiplier'),
            multiplierValue: document.getElementById('multiplier-value'),
            maxCombo: document.getElementById('max-combo'),
            resetBtn: document.getElementById('reset-btn'),
            // 字根图相关元素
            radicalChartSection: document.getElementById('radical-chart-section'),
            toggleChartBtn: document.getElementById('toggle-chart-btn'),
            toggleChartText: document.getElementById('toggle-chart-text'),
            closeChartBtn: document.getElementById('close-chart-btn'),
            radicalKeyboard: document.getElementById('radical-keyboard')
        };
    }
    
    /**
     * 从存储恢复数据
     */
    restoreFromStorage() {
        const savedData = this.storageManager.load();
        
        // 恢复统计数据
        if (savedData.stats) {
            this.stats = { ...this.stats, ...savedData.stats };
        }
        
        // 恢复字根权重
        if (savedData.weights) {
            this.radicalManager.restoreWeights(savedData.weights);
        }
        
        // 恢复已练习字根
        if (savedData.practicedRadicals) {
            this.radicalManager.restorePracticed(savedData.practicedRadicals);
        }
        
        // 恢复练习计数器
        if (savedData.practiceCounter) {
            this.radicalManager.restorePracticeCounter(savedData.practiceCounter);
        }
    }
    
    /**
     * 保存数据到存储
     */
    saveToStorage() {
        this.storageManager.saveState({
            stats: this.stats,
            weights: this.radicalManager.getWeightsData(),
            practicedRadicals: this.radicalManager.getPracticedData(),
            practiceCounter: this.radicalManager.getPracticeCounter()
        });
    }
    
    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 输入框事件
        this.elements.inputField.addEventListener('input', (e) => this.handleInput(e));
        this.elements.inputField.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // 全局键盘事件（允许不聚焦输入框也能输入）
        document.addEventListener('keydown', (e) => this.handleGlobalKeyDown(e));
        
        // 重置按钮
        this.elements.resetBtn.addEventListener('click', () => this.handleReset());
        
        // 字根图开关按钮
        if (this.elements.toggleChartBtn) {
            this.elements.toggleChartBtn.addEventListener('click', () => this.toggleRadicalChart());
        }
        
        // 字根图关闭按钮
        if (this.elements.closeChartBtn) {
            this.elements.closeChartBtn.addEventListener('click', () => this.hideRadicalChart());
        }
        
        // 页面可见性变化时保存数据
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveToStorage();
            }
        });
        
        // 页面卸载前保存数据
        window.addEventListener('beforeunload', () => {
            this.saveToStorage();
        });
        
        // 恢复字根图显示状态
        this.restoreChartState();
    }
    
    /**
     * 切换字根图显示/隐藏
     */
    toggleRadicalChart() {
        const { radicalChartSection } = this.elements;
        if (radicalChartSection) {
            const isHidden = radicalChartSection.classList.contains('hidden');
            if (isHidden) {
                this.showRadicalChart();
            } else {
                this.hideRadicalChart();
            }
        }
    }
    
    /**
     * 显示字根图
     */
    showRadicalChart() {
        const { radicalChartSection, toggleChartText } = this.elements;
        if (radicalChartSection) {
            radicalChartSection.classList.remove('hidden');
            if (toggleChartText) {
                toggleChartText.textContent = '隐藏字根图';
            }
            // 保存状态
            this.saveChartState(true);
        }
    }
    
    /**
     * 隐藏字根图
     */
    hideRadicalChart() {
        const { radicalChartSection, toggleChartText } = this.elements;
        if (radicalChartSection) {
            radicalChartSection.classList.add('hidden');
            if (toggleChartText) {
                toggleChartText.textContent = '显示字根图';
            }
            // 保存状态
            this.saveChartState(false);
        }
        // 聚焦输入框
        this.focusInput();
    }
    
    /**
     * 保存字根图显示状态
     */
    saveChartState(isVisible) {
        try {
            localStorage.setItem('shouyou_plus_chart_visible', isVisible ? 'true' : 'false');
        } catch (e) {
            console.warn('保存字根图状态失败:', e);
        }
    }
    
    /**
     * 恢复字根图显示状态
     */
    restoreChartState() {
        try {
            const isVisible = localStorage.getItem('shouyou_plus_chart_visible') === 'true';
            if (isVisible) {
                this.showRadicalChart();
            }
        } catch (e) {
            console.warn('恢复字根图状态失败:', e);
        }
    }
    
    /**
     * 高亮字根图中的按键
     * @param {string} key - 按键字符
     */
    highlightKey(key) {
        const { radicalKeyboard } = this.elements;
        if (!radicalKeyboard) return;
        
        // 移除之前的高亮
        const prevHighlight = radicalKeyboard.querySelector('.key-cell.highlight');
        if (prevHighlight) {
            prevHighlight.classList.remove('highlight');
        }
        
        // 添加新的高亮
        const keyCell = radicalKeyboard.querySelector(`[data-key="${key.toUpperCase()}"]`);
        if (keyCell) {
            keyCell.classList.add('highlight');
        }
    }
    
    /**
     * 清除字根图高亮
     */
    clearKeyHighlight() {
        const { radicalKeyboard } = this.elements;
        if (!radicalKeyboard) return;
        
        const highlighted = radicalKeyboard.querySelector('.key-cell.highlight');
        if (highlighted) {
            highlighted.classList.remove('highlight');
        }
    }
    
    /**
     * 处理输入事件
     */
    handleInput(e) {
        const input = e.target.value.trim().toUpperCase();
        
        if (input.length === 0) return;
        
        // 检查答案
        this.checkAnswer(input);
        
        // 清空输入框
        this.elements.inputField.value = '';
    }
    
    /**
     * 处理键盘按下事件
     */
    handleKeyDown(e) {
        // 空格键显示答案
        if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            this.revealAnswer();
        }
    }
    
    /**
     * 处理全局键盘事件
     */
    handleGlobalKeyDown(e) {
        // 如果焦点在输入框，不处理
        if (document.activeElement === this.elements.inputField) return;
        
        // 忽略功能键
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        
        // 空格键显示答案
        if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            this.revealAnswer();
            return;
        }
        
        // 字母键
        if (/^[a-zA-Z]$/.test(e.key)) {
            e.preventDefault();
            this.checkAnswer(e.key.toUpperCase());
        }
    }
    
    /**
     * 检查答案
     */
    checkAnswer(input) {
        if (!this.currentRadical) return;
        
        // 如果正在过渡到下一个字根，忽略输入（防止快速连续按键导致跳过字根）
        if (this.isTransitioning) return;
        
        const isCorrect = this.radicalManager.checkAnswer(input, this.currentRadical);
        
        this.stats.totalAttempts++;
        
        if (isCorrect) {
            this.handleCorrect();
        } else {
            this.handleWrong(input);
        }
        
        // 更新 UI 和保存
        this.updateUI();
        this.saveToStorage();
    }
    
    /**
     * 处理正确答案
     */
    handleCorrect() {
        this.stats.correctCount++;
        this.stats.currentCombo++;
        
        // 更新最高连击
        if (this.stats.currentCombo > this.stats.maxCombo) {
            this.stats.maxCombo = this.stats.currentCombo;
        }
        
        // 检查是否是首次练习该字根（用于完成提示）
        const wasAllPracticed = this.radicalManager.isAllPracticed();
        
        // 标记为已练习
        this.radicalManager.markPracticed(this.currentRadical.id);
        this.stats.practicedCount = this.radicalManager.getPracticedCount();
        
        // 降低权重（答对的字根出现频率降低）
        this.radicalManager.decreaseWeight(this.currentRadical.id);
        
        // 显示反馈
        this.showFeedback('correct');
        
        // 检查是否刚刚完成所有字根的首次练习
        const isNowAllPracticed = this.radicalManager.isAllPracticed();
        if (!wasAllPracticed && isNowAllPracticed) {
            // 首次完成所有字根练习，显示完成提示
            this.showCompletionCelebration();
        }
        
        // 连击提示
        if (this.stats.currentCombo > 0 && this.stats.currentCombo % 5 === 0) {
            this.showComboMessage(this.stats.currentCombo);
        }
        
        // 设置过渡标志，防止快速连续按键导致跳过字根
        this.isTransitioning = true;
        
        // 延迟显示下一个字根
        setTimeout(() => {
            this.showNextRadical();
        }, 200);
    }
    
    /**
     * 显示练习完成庆祝提示
     */
    showCompletionCelebration() {
        const stats = this.radicalManager.getLearningStats();
        const accuracy = this.stats.totalAttempts > 0 
            ? Math.round((this.stats.correctCount / this.stats.totalAttempts) * 100) 
            : 0;
        
        // 创建庆祝弹窗
        const modal = document.createElement('div');
        modal.className = 'completion-modal';
        modal.innerHTML = `
            <div class="completion-content">
                <div class="completion-icon">🎉</div>
                <h2 class="completion-title">恭喜完成！</h2>
                <p class="completion-subtitle">你已经练习过所有 ${stats.totalCount} 个字根！</p>
                <div class="completion-stats">
                    <div class="stat-item">
                        <span class="stat-value">${accuracy}%</span>
                        <span class="stat-label">正确率</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${this.stats.maxCombo}</span>
                        <span class="stat-label">最高连击</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${stats.masteredCount}</span>
                        <span class="stat-label">已掌握</span>
                    </div>
                </div>
                <p class="completion-tip">继续练习可以巩固记忆，系统会智能安排复习！</p>
                <button class="completion-btn" onclick="this.closest('.completion-modal').remove()">继续练习</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 添加进入动画
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                this.focusInput();
            }
        });
        
        // 按任意键关闭
        const closeOnKey = (e) => {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
                modal.remove();
                document.removeEventListener('keydown', closeOnKey);
                this.focusInput();
            }
        };
        document.addEventListener('keydown', closeOnKey);
    }
    
    /**
     * 处理错误答案
     */
    handleWrong(input) {
        this.stats.wrongCount++;
        this.stats.currentCombo = 0;
        
        // 增加权重（答错的字根出现频率增加）
        this.radicalManager.increaseWeight(this.currentRadical.id);
        
        // 标记答案已显示
        this.answerRevealed = true;
        
        // 显示按键提示
        this.showKeyHint();
        
        // 显示反馈
        this.showFeedback('wrong', input);
    }
    
    /**
     * 显示答案（按空格触发）
     */
    revealAnswer() {
        if (!this.currentRadical || this.answerRevealed) return;
        
        this.answerRevealed = true;
        
        // 显示按键提示
        this.showKeyHint();
        
        // 显示提示消息
        this.showMessage(`答案是 ${this.currentRadical.key}`, 'skip');
    }
    
    /**
     * 显示下一个字根
     */
    showNextRadical() {
        this.currentRadical = this.radicalManager.getNextRadical();
        
        // 重置答案显示状态
        this.answerRevealed = false;
        
        // 重置过渡标志
        this.isTransitioning = false;
        
        // 清除之前的反馈状态
        this.clearFeedback();
        
        if (this.currentRadical) {
            // 先隐藏按键提示（立即隐藏，避免显示旧内容）
            this.hideKeyHint(true);
            
            // 更新显示
            this.elements.radicalChar.textContent = this.currentRadical.char;
            this.elements.keyHint.textContent = this.currentRadical.key;
            
            // 高亮字根图中对应的按键
            this.highlightKey(this.currentRadical.key);
            
            // 添加进入动画
            this.elements.radicalChar.classList.remove('radical-enter');
            void this.elements.radicalChar.offsetWidth; // 触发重排
            this.elements.radicalChar.classList.add('radical-enter');
        }
        
        // 聚焦输入框
        this.focusInput();
    }
    
    /**
     * 显示按键提示
     */
    showKeyHint() {
        if (this.elements.keyHintContainer) {
            this.elements.keyHintContainer.classList.remove('opacity-0');
            this.elements.keyHintContainer.classList.add('opacity-100');
        }
        // 高亮字根图中对应的按键
        if (this.currentRadical) {
            this.highlightKey(this.currentRadical.key);
        }
    }
    
    /**
     * 隐藏按键提示
     * @param {boolean} immediate - 是否立即隐藏（不使用过渡动画）
     */
    hideKeyHint(immediate = false) {
        if (this.elements.keyHintContainer) {
            if (immediate) {
                // 立即隐藏：先禁用过渡，设置透明度，再恢复过渡
                this.elements.keyHintContainer.style.transition = 'none';
                this.elements.keyHintContainer.classList.remove('opacity-100');
                this.elements.keyHintContainer.classList.add('opacity-0');
                // 强制重排后恢复过渡
                void this.elements.keyHintContainer.offsetWidth;
                this.elements.keyHintContainer.style.transition = '';
            } else {
                this.elements.keyHintContainer.classList.remove('opacity-100');
                this.elements.keyHintContainer.classList.add('opacity-0');
            }
        }
    }
    
    /**
     * 显示反馈
     */
    showFeedback(type, wrongInput = '') {
        const { radicalChar, inputField, feedbackIcon, iconCorrect, iconWrong, feedbackMessage } = this.elements;
        
        // 清除之前的反馈
        this.clearFeedback();
        
        // 显示反馈图标
        feedbackIcon.classList.remove('opacity-0');
        feedbackIcon.classList.add('opacity-100');
        
        switch (type) {
            case 'correct':
                // 正确反馈
                iconCorrect.classList.remove('hidden');
                radicalChar.classList.add('feedback-correct');
                inputField.classList.add('input-correct');
                this.showMessage('正确！', 'correct');
                // 正确时设置定时器，200ms 后清除反馈
                this.feedbackTimer = setTimeout(() => {
                    this.clearFeedback();
                }, 200);
                break;
                
            case 'wrong':
                // 错误反馈 - 不设置定时器，保持错误状态直到用户输入正确答案
                iconWrong.classList.remove('hidden');
                radicalChar.classList.add('feedback-wrong');
                inputField.classList.add('input-wrong');
                this.showMessage(`错误！正确答案是 ${this.currentRadical.key}`, 'wrong');
                // 错误时不自动清除，等待用户输入正确答案后由 showNextRadical 清除
                break;
        }
    }
    
    /**
     * 显示消息
     */
    showMessage(text, type) {
        const { feedbackMessage } = this.elements;
        feedbackMessage.innerHTML = `<span class="feedback-msg ${type}">${text}</span>`;
    }
    
    /**
     * 显示连击消息
     */
    showComboMessage(combo) {
        const { feedbackMessage } = this.elements;
        const messages = [
            '不错！',
            '很好！',
            '太棒了！',
            '完美！',
            '无敌！'
        ];
        const msgIndex = Math.min(Math.floor(combo / 5) - 1, messages.length - 1);
        feedbackMessage.innerHTML = `<span class="feedback-msg combo">🔥 ${combo} 连击！${messages[msgIndex]}</span>`;
        
        // 连击动画
        this.elements.combo.parentElement.classList.add('combo-achieved');
        setTimeout(() => {
            this.elements.combo.parentElement.classList.remove('combo-achieved');
        }, 400);
    }
    
    /**
     * 清除反馈
     */
    clearFeedback() {
        const { radicalChar, inputField, feedbackIcon, iconCorrect, iconWrong, feedbackMessage } = this.elements;
        
        if (this.feedbackTimer) {
            clearTimeout(this.feedbackTimer);
            this.feedbackTimer = null;
        }
        
        // 隐藏图标
        feedbackIcon.classList.remove('opacity-100');
        feedbackIcon.classList.add('opacity-0');
        iconCorrect.classList.add('hidden');
        iconWrong.classList.add('hidden');
        
        // 移除动画类
        radicalChar.classList.remove('feedback-correct', 'feedback-wrong');
        inputField.classList.remove('input-correct', 'input-wrong');
        
        // 清除反馈消息
        feedbackMessage.innerHTML = '';
    }
    
    /**
     * 更新 UI
     */
    updateUI() {
        const { currentCount, totalCount, progressBar, accuracy, combo, comboMultiplier, multiplierValue, maxCombo } = this.elements;
        
        // 进度
        const practiced = this.stats.practicedCount;
        const total = this.radicalManager.getTotalCount();
        currentCount.textContent = practiced;
        totalCount.textContent = total;
        
        // 进度条
        const progress = total > 0 ? (practiced / total) * 100 : 0;
        progressBar.style.width = `${progress}%`;
        
        // 正确率
        const acc = this.stats.totalAttempts > 0 
            ? Math.round((this.stats.correctCount / this.stats.totalAttempts) * 100) 
            : 0;
        accuracy.textContent = acc;
        
        // 连击
        combo.textContent = this.stats.currentCombo;
        
        // 连击倍数（每 10 连击增加 0.5 倍）
        const multiplier = 1 + Math.floor(this.stats.currentCombo / 10) * 0.5;
        if (multiplier > 1) {
            comboMultiplier.classList.remove('hidden');
            multiplierValue.textContent = multiplier.toFixed(1);
        } else {
            comboMultiplier.classList.add('hidden');
        }
        
        // 最高连击
        maxCombo.textContent = this.stats.maxCombo;
    }
    
    /**
     * 处理重置
     */
    handleReset() {
        if (confirm('确定要重新开始吗？所有进度将被清除。')) {
            // 重置统计
            this.stats = {
                totalAttempts: 0,
                correctCount: 0,
                wrongCount: 0,
                currentCombo: 0,
                maxCombo: 0,
                practicedCount: 0
            };
            
            // 重置字根管理器
            this.radicalManager.resetWeights();
            
            // 清除存储
            this.storageManager.reset();
            
            // 重置答案显示状态
            this.answerRevealed = false;
            
            // 更新 UI
            this.updateUI();
            
            // 显示新字根（会自动隐藏按键提示）
            this.showNextRadical();
            
            // 显示提示
            this.showMessage('已重置，重新开始！', 'skip');
        }
    }
    
    /**
     * 聚焦输入框
     */
    focusInput() {
        // 延迟聚焦，确保动画完成
        setTimeout(() => {
            this.elements.inputField.focus();
        }, 50);
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.practiceApp = new PracticeApp();
});
