/**
 * 首右plus 字根数据模块
 * 基于 chaifen.txt 解析的字根与按键对应关系
 */

// 字根数据：按键 -> 字根数组
const RADICAL_MAP = {
    'Q': ['火', '龶'],
    'W': ['王', '亠', '攵'],
    'E': ['禾', '阝'],
    'R': ['亻', '彳'],
    'T': ['土', '田'],
    'Y': ['月', '又', '雨'],
    'U': ['氵'],
    'I': ['纟', '厶'],
    'O': ['虫', '刂'],
    'P': ['撇'],
    'A': ['讠'],
    'S': ['竖', '饣', '石', '尸'],
    'D': ['点', '目'],
    'F': ['扌', '十'],
    'G': ['竹', '辶', '山', '弓'],
    'H': ['横'],
    'J': ['钅', '几', '巾'],
    'K': ['口'],
    'L': ['日', '⺈', '力', '大'],
    'Z': ['⻊', '子', '西', '疒'],
    'X': ['忄', '小', '彐', '广'],
    'C': ['艹', '车', '乂', '寸'],
    'V': ['折', '舟'],
    'B': ['宀', '贝', '勹', '八', '犭'],
    'N': ['女', '鸟'],
    'M': ['木', '门']
};

// 生成扁平化的字根列表，每个字根包含其对应的按键
const RADICAL_LIST = [];

for (const [key, radicals] of Object.entries(RADICAL_MAP)) {
    for (const radical of radicals) {
        RADICAL_LIST.push({
            char: radical,      // 字根字符
            key: key,           // 对应按键
            id: `${key}_${radical}` // 唯一标识
        });
    }
}

// 总字根数量
const TOTAL_RADICALS = RADICAL_LIST.length;

/**
 * 字根管理器类
 * 使用改进的间隔重复算法
 */
class RadicalManager {
    constructor() {
        // 字根学习数据：包含权重、熟练度、上次练习时间等
        this.radicalData = {};
        // 初始化所有字根数据
        RADICAL_LIST.forEach(r => {
            this.radicalData[r.id] = {
                weight: 1,           // 基础权重
                mastery: 0,          // 熟练度（连续答对次数，0-5）
                lastPracticed: 0,    // 上次练习时间戳
                wrongCount: 0,       // 总错误次数
                correctCount: 0      // 总正确次数
            };
        });
        
        // 上一个字根（避免连续重复）
        this.lastRadical = null;
        
        // 已练习的字根集合
        this.practicedRadicals = new Set();
        
        // 练习计数器（用于间隔重复）
        this.practiceCounter = 0;
    }
    
    /**
     * 计算字根的选择优先级
     * 综合考虑：未练习 > 低熟练度 > 高权重 > 间隔时间
     */
    calculatePriority(radicalId) {
        const data = this.radicalData[radicalId];
        const isPracticed = this.practicedRadicals.has(radicalId);
        
        let priority = 0;
        
        // 1. 未练习的字根优先级最高
        if (!isPracticed) {
            priority += 100;
        }
        
        // 2. 基于熟练度：熟练度越低，优先级越高
        // 熟练度 0-5，对应优先级加成 50-0
        priority += (5 - data.mastery) * 10;
        
        // 3. 基于权重（错误越多权重越高）
        priority += data.weight * 5;
        
        // 4. 间隔重复：距离上次练习越久，优先级越高
        // 但熟练度高的字根间隔应该更长
        if (data.lastPracticed > 0) {
            const timeSinceLastPractice = this.practiceCounter - data.lastPracticed;
            // 熟练度越高，需要的间隔越长才会增加优先级
            const requiredInterval = Math.pow(2, data.mastery); // 1, 2, 4, 8, 16, 32
            if (timeSinceLastPractice >= requiredInterval) {
                priority += Math.min(20, timeSinceLastPractice - requiredInterval);
            }
        }
        
        // 添加小随机因素，避免完全固定的顺序
        priority += Math.random() * 5;
        
        return priority;
    }
    
    /**
     * 获取下一个字根（基于优先级的智能选择）
     * 优先选择：未练习 > 不熟练 > 错误多 > 间隔时间长
     */
    getNextRadical() {
        this.practiceCounter++;
        
        // 计算所有字根的优先级
        const priorityList = RADICAL_LIST.map(r => ({
            radical: r,
            priority: this.calculatePriority(r.id)
        }));
        
        // 按优先级排序
        priorityList.sort((a, b) => b.priority - a.priority);
        
        // 从前 5 个高优先级字根中随机选择（增加一些随机性）
        const topCandidates = priorityList.slice(0, Math.min(5, priorityList.length));
        
        // 加权随机选择，优先级越高被选中概率越大
        let totalPriority = topCandidates.reduce((sum, item) => sum + item.priority, 0);
        let random = Math.random() * totalPriority;
        let selected = topCandidates[0].radical;
        
        for (const item of topCandidates) {
            random -= item.priority;
            if (random <= 0) {
                selected = item.radical;
                break;
            }
        }
        
        // 如果选中的和上一个相同，且有其他选择，则选择第二优先级
        if (selected.id === this.lastRadical?.id && topCandidates.length > 1) {
            selected = topCandidates[1].radical;
        }
        
        this.lastRadical = selected;
        return selected;
    }
    
    /**
     * 处理答对（更新熟练度和权重）
     * @param {string} radicalId - 字根ID
     */
    handleCorrect(radicalId) {
        const data = this.radicalData[radicalId];
        if (data) {
            // 增加熟练度（最高 5）
            data.mastery = Math.min(5, data.mastery + 1);
            // 降低权重
            data.weight = Math.max(0.3, data.weight * 0.7);
            // 更新练习时间
            data.lastPracticed = this.practiceCounter;
            // 增加正确计数
            data.correctCount++;
        }
    }
    
    /**
     * 处理答错（重置熟练度，增加权重）
     * @param {string} radicalId - 字根ID
     */
    handleWrong(radicalId) {
        const data = this.radicalData[radicalId];
        if (data) {
            // 重置熟练度（答错一次就需要重新建立记忆）
            data.mastery = 0;
            // 增加权重（最高 5）
            data.weight = Math.min(5, data.weight + 1.5);
            // 更新练习时间
            data.lastPracticed = this.practiceCounter;
            // 增加错误计数
            data.wrongCount++;
        }
    }
    
    /**
     * 增加字根权重（答错时调用）- 保留旧接口兼容
     * @param {string} radicalId - 字根ID
     */
    increaseWeight(radicalId) {
        this.handleWrong(radicalId);
    }
    
    /**
     * 减少字根权重（答对时调用）- 保留旧接口兼容
     * @param {string} radicalId - 字根ID
     */
    decreaseWeight(radicalId) {
        this.handleCorrect(radicalId);
    }
    
    /**
     * 标记字根为已练习
     * @param {string} radicalId - 字根ID
     */
    markPracticed(radicalId) {
        this.practicedRadicals.add(radicalId);
    }
    
    /**
     * 检查是否所有字根都已练习
     */
    isAllPracticed() {
        return this.practicedRadicals.size >= TOTAL_RADICALS;
    }
    
    /**
     * 获取已练习的字根数量
     */
    getPracticedCount() {
        return this.practicedRadicals.size;
    }
    
    /**
     * 获取总字根数量
     */
    getTotalCount() {
        return TOTAL_RADICALS;
    }
    
    /**
     * 获取学习统计信息
     */
    getLearningStats() {
        let masteredCount = 0;  // 熟练度 >= 3 的字根数
        let learningCount = 0;  // 熟练度 1-2 的字根数
        let newCount = 0;       // 未练习的字根数
        let difficultCount = 0; // 错误次数 >= 3 的字根数
        
        RADICAL_LIST.forEach(r => {
            const data = this.radicalData[r.id];
            const isPracticed = this.practicedRadicals.has(r.id);
            
            if (!isPracticed) {
                newCount++;
            } else if (data.mastery >= 3) {
                masteredCount++;
            } else {
                learningCount++;
            }
            
            if (data.wrongCount >= 3) {
                difficultCount++;
            }
        });
        
        return {
            masteredCount,
            learningCount,
            newCount,
            difficultCount,
            totalCount: TOTAL_RADICALS
        };
    }
    
    /**
     * 重置所有数据
     */
    resetWeights() {
        RADICAL_LIST.forEach(r => {
            this.radicalData[r.id] = {
                weight: 1,
                mastery: 0,
                lastPracticed: 0,
                wrongCount: 0,
                correctCount: 0
            };
        });
        this.practicedRadicals.clear();
        this.lastRadical = null;
        this.practiceCounter = 0;
    }
    
    /**
     * 从存储恢复权重（兼容旧数据格式）
     * @param {Object} savedWeights - 保存的权重数据
     */
    restoreWeights(savedWeights) {
        if (savedWeights && typeof savedWeights === 'object') {
            // 检查是否是新格式（包含 mastery 等字段）
            const firstKey = Object.keys(savedWeights)[0];
            if (firstKey && typeof savedWeights[firstKey] === 'object') {
                // 新格式：完整的 radicalData
                for (const [id, data] of Object.entries(savedWeights)) {
                    if (this.radicalData[id]) {
                        this.radicalData[id] = { ...this.radicalData[id], ...data };
                    }
                }
            } else {
                // 旧格式：只有权重数字，转换为新格式
                for (const [id, weight] of Object.entries(savedWeights)) {
                    if (this.radicalData[id]) {
                        this.radicalData[id].weight = weight;
                    }
                }
            }
        }
    }
    
    /**
     * 恢复练习计数器
     * @param {number} counter - 练习计数器值
     */
    restorePracticeCounter(counter) {
        if (typeof counter === 'number') {
            this.practiceCounter = counter;
        }
    }
    
    /**
     * 从存储恢复已练习字根
     * @param {Array} practicedIds - 已练习的字根ID数组
     */
    restorePracticed(practicedIds) {
        if (Array.isArray(practicedIds)) {
            this.practicedRadicals = new Set(practicedIds);
        }
    }
    
    /**
     * 获取当前权重数据（用于存储）
     */
    getWeightsData() {
        // 返回完整的 radicalData 用于存储
        const data = {};
        for (const [id, radicalData] of Object.entries(this.radicalData)) {
            data[id] = { ...radicalData };
        }
        return data;
    }
    
    /**
     * 获取练习计数器（用于存储）
     */
    getPracticeCounter() {
        return this.practiceCounter;
    }
    
    /**
     * 获取已练习字根ID数组（用于存储）
     */
    getPracticedData() {
        return Array.from(this.practicedRadicals);
    }
    
    /**
     * 根据按键获取所有对应的字根
     * @param {string} key - 按键字符
     */
    getRadicalsByKey(key) {
        return RADICAL_MAP[key.toUpperCase()] || [];
    }
    
    /**
     * 检查按键是否正确
     * @param {string} inputKey - 用户输入的按键
     * @param {Object} radical - 当前字根对象
     */
    checkAnswer(inputKey, radical) {
        return inputKey.toUpperCase() === radical.key;
    }
}

// 导出（全局变量方式，因为使用原生 JS）
window.RadicalManager = RadicalManager;
window.RADICAL_MAP = RADICAL_MAP;
window.RADICAL_LIST = RADICAL_LIST;
window.TOTAL_RADICALS = TOTAL_RADICALS;
