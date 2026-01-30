/**
 * 首右plus 本地存储模块
 * 使用 LocalStorage 保存练习进度和统计数据
 */

const STORAGE_KEY = 'shouyou_plus_practice';

/**
 * 存储管理器类
 */
class StorageManager {
    constructor() {
        this.storageKey = STORAGE_KEY;
    }
    
    /**
     * 获取默认数据结构
     */
    getDefaultData() {
        return {
            // 统计数据
            stats: {
                totalAttempts: 0,      // 总尝试次数
                correctCount: 0,       // 正确次数
                wrongCount: 0,         // 错误次数
                currentCombo: 0,       // 当前连击
                maxCombo: 0,           // 最高连击
                practicedCount: 0,     // 已练习字根数
            },
            // 字根权重数据
            weights: {},
            // 已练习的字根ID列表
            practicedRadicals: [],
            // 最后练习时间
            lastPracticeTime: null,
            // 版本号（用于数据迁移）
            version: 1
        };
    }
    
    /**
     * 从 LocalStorage 加载数据
     */
    load() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                // 合并默认值，确保数据完整性
                return this.mergeWithDefaults(data);
            }
        } catch (error) {
            console.warn('加载存储数据失败:', error);
        }
        return this.getDefaultData();
    }
    
    /**
     * 保存数据到 LocalStorage
     * @param {Object} data - 要保存的数据
     */
    save(data) {
        try {
            data.lastPracticeTime = new Date().toISOString();
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('保存数据失败:', error);
            return false;
        }
    }
    
    /**
     * 更新统计数据
     * @param {Object} stats - 统计数据对象
     */
    updateStats(stats) {
        const data = this.load();
        data.stats = { ...data.stats, ...stats };
        return this.save(data);
    }
    
    /**
     * 更新字根权重
     * @param {Object} weights - 权重数据对象
     */
    updateWeights(weights) {
        const data = this.load();
        data.weights = weights;
        return this.save(data);
    }
    
    /**
     * 更新已练习字根列表
     * @param {Array} practicedRadicals - 已练习字根ID数组
     */
    updatePracticedRadicals(practicedRadicals) {
        const data = this.load();
        data.practicedRadicals = practicedRadicals;
        return this.save(data);
    }
    
    /**
     * 保存完整的练习状态
     * @param {Object} state - 完整状态对象
     */
    saveState(state) {
        const data = this.load();
        if (state.stats) data.stats = state.stats;
        if (state.weights) data.weights = state.weights;
        if (state.practicedRadicals) data.practicedRadicals = state.practicedRadicals;
        return this.save(data);
    }
    
    /**
     * 清除所有数据
     */
    clear() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('清除数据失败:', error);
            return false;
        }
    }
    
    /**
     * 重置为默认数据
     */
    reset() {
        return this.save(this.getDefaultData());
    }
    
    /**
     * 合并数据与默认值
     * @param {Object} data - 已存储的数据
     */
    mergeWithDefaults(data) {
        const defaults = this.getDefaultData();
        return {
            stats: { ...defaults.stats, ...data.stats },
            weights: data.weights || defaults.weights,
            practicedRadicals: data.practicedRadicals || defaults.practicedRadicals,
            lastPracticeTime: data.lastPracticeTime || defaults.lastPracticeTime,
            version: data.version || defaults.version
        };
    }
    
    /**
     * 获取统计数据
     */
    getStats() {
        const data = this.load();
        return data.stats;
    }
    
    /**
     * 获取字根权重
     */
    getWeights() {
        const data = this.load();
        return data.weights;
    }
    
    /**
     * 获取已练习字根列表
     */
    getPracticedRadicals() {
        const data = this.load();
        return data.practicedRadicals;
    }
    
    /**
     * 检查是否有存储数据
     */
    hasData() {
        try {
            return localStorage.getItem(this.storageKey) !== null;
        } catch {
            return false;
        }
    }
    
    /**
     * 获取最后练习时间
     */
    getLastPracticeTime() {
        const data = this.load();
        return data.lastPracticeTime ? new Date(data.lastPracticeTime) : null;
    }
    
    /**
     * 导出数据（用于备份）
     */
    exportData() {
        const data = this.load();
        return JSON.stringify(data, null, 2);
    }
    
    /**
     * 导入数据（用于恢复）
     * @param {string} jsonString - JSON 格式的数据字符串
     */
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            return this.save(this.mergeWithDefaults(data));
        } catch (error) {
            console.error('导入数据失败:', error);
            return false;
        }
    }
}

// 导出（全局变量方式）
window.StorageManager = StorageManager;
window.STORAGE_KEY = STORAGE_KEY;
