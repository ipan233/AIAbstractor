/**
 * AIAbstractor - 前端脚本（修复版）
 * 修复HTTP 404错误，增强错误处理和调试功能
 */
(function() {
    'use strict';

    // 默认配置
    const AIAbstractorConfig = {
        appName: 'AIAbstractor',
        apiEndpoint: '/action/ai-abstractor',
        model: 'gpt-4o-mini',
        postSelector: '#article-container',
        wordLimit: 720,
        debug: false, // 调试模式
        retryCount: 3, // 重试次数
        retryDelay: 1000, // 重试延迟（毫秒）
        fallbackEndpoints: [ // 备用端点
            '/index.php/action/ai-abstractor',
            '/?action=ai-abstractor'
        ]
    };

    // 合并配置
    if (typeof window.AIAbstractorConfigOverrides === 'object') {
        Object.assign(AIAbstractorConfig, window.AIAbstractorConfigOverrides);
    }

    // 调试日志函数
    function debugLog(...args) {
        if (AIAbstractorConfig.debug || window.location.search.includes('debug=1')) {
            console.log('[AIAbstractor]', ...args);
        }
    }

    // 错误日志函数
    function errorLog(...args) {
        console.error('[AIAbstractor]', ...args);
    }

    // 创建UI元素
    function createUI() {
        const container = document.createElement('div');
        container.className = 'post-ai-abstractor';
        container.innerHTML = `
            <div class="ai-abstractor-title">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                AI 摘要
                <span class="ai-abstractor-status"></span>
            </div>
            <div class="ai-abstractor-content">
                <div class="ai-abstractor-explanation"></div>
                <div class="ai-abstractor-suggestions"></div>
            </div>
            <div class="ai-abstractor-error" style="display:none;"></div>
            <div class="ai-abstractor-debug" style="display:none;"></div>
        `;
        return container;
    }

    // 获取文章标题
    function getArticleTitle() {
        const titleEl = document.querySelector('h1, .post-title, .entry-title, .article-title');
        return titleEl ? titleEl.textContent.trim() : document.title;
    }

    // 获取文章内容
    function getArticleContent() {
        const postEl = document.querySelector(AIAbstractorConfig.postSelector);
        if (!postEl) {
            debugLog('未找到文章容器，使用body内容');
            return document.body.textContent.trim().slice(0, AIAbstractorConfig.wordLimit);
        }
        
        // 移除脚本、样式、广告等无关内容
        const tempEl = postEl.cloneNode(true);
        const elementsToRemove = tempEl.querySelectorAll('script, style, .ads, .advertisement, .social-share, .comments, .sidebar, .footer, .header');
        elementsToRemove.forEach(el => el.remove());
        
        return tempEl.textContent.trim().slice(0, AIAbstractorConfig.wordLimit);
    }

    // 构建提示词
    function buildPrompt(title, content) {
        return `请为以下文章生成一个简洁的摘要：

标题：${title}

内容：${content}

请提供：
1. 一段简洁的文章摘要（100字以内）
2. 3-5个关键要点或建议

请用中文回答，格式如下：
【摘要】
[摘要内容]

【要点】
• [要点1]
• [要点2]
• [要点3]`;
    }

    // 解析AI响应
    function parseAIResponse(text) {
        const result = {
            summary: '',
            suggestions: []
        };

        // 解析摘要
        const summaryMatch = text.match(/【摘要】\s*\n?([^【]+)/);
        if (summaryMatch) {
            result.summary = summaryMatch[1].trim();
        }

        // 解析要点
        const suggestionsMatch = text.match(/【要点】\s*\n?([\s\S]+)/);
        if (suggestionsMatch) {
            const suggestionsText = suggestionsMatch[1];
            result.suggestions = suggestionsText
                .split('\n')
                .filter(line => line.trim().startsWith('•'))
                .map(line => line.replace(/^•\s*/, '').trim())
                .filter(suggestion => suggestion.length > 0);
        }

        return result;
    }

    // 显示错误信息
    function showError(container, error, debugInfo = {}) {
        const errorEl = container.querySelector('.ai-abstractor-error');
        const debugEl = container.querySelector('.ai-abstractor-debug');
        
        errorEl.textContent = `错误：${error}`;
        errorEl.style.display = 'block';
        
        if (Object.keys(debugInfo).length > 0) {
            debugEl.innerHTML = '<strong>调试信息：</strong><br>' + 
                Object.entries(debugInfo).map(([key, value]) => 
                    `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`
                ).join('<br>');
            debugEl.style.display = 'block';
        }
        
        errorLog('AIAbstractor错误:', error, debugInfo);
    }

    // 清除错误信息
    function clearError(container) {
        const errorEl = container.querySelector('.ai-abstractor-error');
        const debugEl = container.querySelector('.ai-abstractor-debug');
        errorEl.style.display = 'none';
        debugEl.style.display = 'none';
    }

    // 显示状态
    function showStatus(container, status) {
        const statusEl = container.querySelector('.ai-abstractor-status');
        statusEl.textContent = status;
        statusEl.className = 'ai-abstractor-status ' + (status.includes('失败') ? 'error' : 'loading');
    }

    // 显示结果
    function displayResult(container, result) {
        const explanationEl = container.querySelector('.ai-abstractor-explanation');
        const suggestionsEl = container.querySelector('.ai-abstractor-suggestions');
        
        if (result.summary) {
            explanationEl.textContent = result.summary;
        }
        
        if (result.suggestions.length > 0) {
            suggestionsEl.innerHTML = '<h4>要点：</h4><ul>' + 
                result.suggestions.map(s => `<li>${s}</li>`).join('') + 
                '</ul>';
        }
        
        container.classList.add('loaded');
    }

    // 测试端点可用性
    async function testEndpoint(endpoint) {
        try {
            debugLog('测试端点:', endpoint);
            const response = await fetch(endpoint, {
                method: 'OPTIONS',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            debugLog('端点测试响应:', response.status, response.statusText);
            return response.status !== 404;
        } catch (error) {
            debugLog('端点测试失败:', endpoint, error);
            return false;
        }
    }

    // 获取可用端点
    async function getAvailableEndpoint() {
        const endpoints = [AIAbstractorConfig.apiEndpoint, ...AIAbstractorConfig.fallbackEndpoints];
        
        for (const endpoint of endpoints) {
            if (await testEndpoint(endpoint)) {
                debugLog('使用端点:', endpoint);
                return endpoint;
            }
        }
        
        throw new Error('所有端点都不可用');
    }

    // 调用API
    async function callAPI(prompt, model, retryCount = 0) {
        try {
            const endpoint = await getAvailableEndpoint();
            debugLog('调用API端点:', endpoint);
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: prompt,
                    model: model
                })
            });

            debugLog('API响应状态:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${response.statusText}\n${errorText}`);
            }

            const data = await response.json();
            debugLog('API响应数据:', data);

            if (data.error) {
                throw new Error(data.error);
            }

            return data.text || '';
        } catch (error) {
            errorLog('API调用失败:', error);
            
            // 重试逻辑
            if (retryCount < AIAbstractorConfig.retryCount) {
                debugLog(`重试 ${retryCount + 1}/${AIAbstractorConfig.retryCount}`);
                await new Promise(resolve => setTimeout(resolve, AIAbstractorConfig.retryDelay));
                return callAPI(prompt, model, retryCount + 1);
            }
            
            throw error;
        }
    }

    // 获取文章摘要
    async function getAbstract(container) {
        try {
            clearError(container);
            showStatus(container, '正在生成摘要...');
            
            const title = getArticleTitle();
            const content = getArticleContent();
            
            if (!title || !content) {
                throw new Error('无法获取文章标题或内容');
            }
            
            debugLog('文章标题:', title);
            debugLog('文章内容长度:', content.length);
            
            const prompt = buildPrompt(title, content);
            const text = await callAPI(prompt, AIAbstractorConfig.model);
            
            if (!text) {
                throw new Error('API返回空内容');
            }
            
            const result = parseAIResponse(text);
            displayResult(container, result);
            
            // 保存到本地存储
            saveAbstract(title, result);
            
            showStatus(container, '摘要生成完成');
            
        } catch (error) {
            showStatus(container, '生成失败');
            showError(container, error.message, {
                '端点': AIAbstractorConfig.apiEndpoint,
                '模型': AIAbstractorConfig.model,
                '重试次数': AIAbstractorConfig.retryCount,
                '错误类型': error.name || 'Unknown'
            });
        }
    }

    // 本地存储相关函数
    function getArticleKey(title) {
        return 'ai_abstractor_' + btoa(title).replace(/[^a-zA-Z0-9]/g, '');
    }

    function loadSavedAbstract(title) {
        try {
            const key = getArticleKey(title);
            const saved = localStorage.getItem(key);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            debugLog('读取本地存储失败:', e);
        }
        return null;
    }

    function saveAbstract(title, result) {
        try {
            const key = getArticleKey(title);
            const data = {
                title: title,
                summary: result.summary,
                suggestions: result.suggestions,
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(data));
            debugLog('保存摘要到本地存储:', key);
        } catch (e) {
            debugLog('保存本地存储失败:', e);
        }
    }

    // 检查URL并运行
    function checkURLAndRun() {
        // 排除后台、登录、注册、搜索、标签、分类、归档、作者、RSS等页面
        const excludePaths = [
            '/admin', '/login', '/register', '/search', '/tag/', '/category/',
            '/archive', '/author', '/feed', '/rss', '/atom', '/sitemap',
            '.xml', '.json', '.php'
        ];
        
        const currentPath = window.location.pathname;
        
        // 检查是否在排除路径中
        const shouldExclude = excludePaths.some(path => 
            currentPath.includes(path) || 
            window.location.href.includes(path)
        );
        
        if (shouldExclude) {
            debugLog('当前页面在排除列表中，不执行');
            return false;
        }
        
        // 检查是否有文章容器
        if (!document.querySelector(AIAbstractorConfig.postSelector)) {
            debugLog('未找到文章容器，不执行');
            return false;
        }
        
        return true;
    }

    // 初始化运行
    function initRun() {
        if (!checkURLAndRun()) {
            return;
        }
        
        debugLog('开始初始化AIAbstractor');
        
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', insertAndRun);
        } else {
            insertAndRun();
        }
    }

    // 插入UI并运行
    function insertAndRun() {
        try {
            const container = createUI();
            const postEl = document.querySelector(AIAbstractorConfig.postSelector);
            
            if (!postEl) {
                debugLog('未找到文章容器');
                return;
            }
            
            // 在文章容器前插入
            postEl.parentNode.insertBefore(container, postEl);
            
            // 检查是否有缓存
            const title = getArticleTitle();
            const saved = loadSavedAbstract(title);
            
            if (saved && saved.summary) {
                debugLog('使用缓存的摘要');
                displayResult(container, saved);
            } else {
                // 延迟加载，避免阻塞页面渲染
                setTimeout(() => {
                    getAbstract(container);
                }, 1000);
            }
            
        } catch (error) {
            errorLog('插入UI失败:', error);
        }
    }

    // 启用调试模式（可以通过URL参数启用）
    if (window.location.search.includes('ai_debug=1')) {
        AIAbstractorConfig.debug = true;
        debugLog('调试模式已启用');
    }

    // 启动
    initRun();

    // 暴露一些函数供调试使用
    window.AIAbstractorDebug = {
        config: AIAbstractorConfig,
        testEndpoint: testEndpoint,
        getAvailableEndpoint: getAvailableEndpoint,
        getArticleTitle: getArticleTitle,
        getArticleContent: getArticleContent,
        checkURLAndRun: checkURLAndRun
    };

})();