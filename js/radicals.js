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
 */
class RadicalManager {
    constructor() {
        // 字根权重（用于智能选择）
        this.weights = {};
        // 初始化所有字根权重为 1
        RADICAL_LIST.forEach(r => {
            this.weights[r.id] = 1;
        });
        
        // 上一个字根（避免连续重复）
        this.lastRadical = null;
        
        // 已练习的字根集合
        this.practicedRadicals = new Set();
    }
    
    /**
     * 获取下一个字根（基于权重的随机选择）
     * 错误次数多的字根权重更高，更容易被选中
     */
    getNextRadical() {
        // 计算总权重
        let totalWeight = 0;
        const weightedList = RADICAL_LIST.map(r => {
            const weight = this.weights[r.id] || 1;
            totalWeight += weight;
            return { radical: r, weight };
        });
        
        // 加权随机选择
        let random = Math.random() * totalWeight;
        let selected = null;
        
        for (const item of weightedList) {
            random -= item.weight;
            if (random <= 0) {
                selected = item.radical;
                break;
            }
        }
        
        // 如果选中的和上一个相同，且有其他选择，则重新选择
        if (selected && selected.id === this.lastRadical?.id && RADICAL_LIST.length > 1) {
            return this.getNextRadical();
        }
        
        this.lastRadical = selected;
        return selected;
    }
    
    /**
     * 增加字根权重（答错时调用）
     * @param {string} radicalId - 字根ID
     */
    increaseWeight(radicalId) {
        if (this.weights[radicalId] !== undefined) {
            // 权重增加，最高为 5
            this.weights[radicalId] = Math.min(5, this.weights[radicalId] + 1);
        }
    }
    
    /**
     * 减少字根权重（答对时调用）
     * @param {string} radicalId - 字根ID
     */
    decreaseWeight(radicalId) {
        if (this.weights[radicalId] !== undefined) {
            // 权重减少，最低为 0.5
            this.weights[radicalId] = Math.max(0.5, this.weights[radicalId] - 0.2);
        }
    }
    
    /**
     * 标记字根为已练习
     * @param {string} radicalId - 字根ID
     */
    markPracticed(radicalId) {
        this.practicedRadicals.add(radicalId);
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
     * 重置所有权重
     */
    resetWeights() {
        RADICAL_LIST.forEach(r => {
            this.weights[r.id] = 1;
        });
        this.practicedRadicals.clear();
        this.lastRadical = null;
    }
    
    /**
     * 从存储恢复权重
     * @param {Object} savedWeights - 保存的权重数据
     */
    restoreWeights(savedWeights) {
        if (savedWeights && typeof savedWeights === 'object') {
            this.weights = { ...this.weights, ...savedWeights };
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
        return { ...this.weights };
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
