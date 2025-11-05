# AIAbstractor API HTTP 404 错误解决方案

## 错误分析

HTTP 404错误表示请求的API端点不存在。对于AIAbstractor插件，这通常是由于以下原因之一：

## 常见原因及解决方案

### 1. Typecho伪静态配置问题

**问题描述**: Typecho的Action路由未正确配置，导致`/action/ai-abstractor`无法访问。

**解决方案**:
- 确保Typecho后台开启了伪静态功能
- 检查网站根目录是否存在`.htaccess`文件（Apache）或`nginx.conf`配置（Nginx）
- 确认Web服务器支持URL重写

**Apache .htaccess示例**:
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php [L,E=PATH_INFO:$1]
</IfModule>
```

**Nginx配置示例**:
```nginx
location / {
    if (!-e $request_filename) {
        rewrite ^(.*)$ /index.php$1 last;
    }
}
```

### 2. 插件未正确激活

**问题描述**: 插件虽然显示已激活，但Action未正确注册。

**解决方案**:
1. 进入Typecho后台 -> 插件管理
2. 禁用AIAbstractor插件
3. 重新启用插件
4. 清除浏览器缓存和Typecho缓存

### 3. 端点URL构建错误

**问题描述**: 插件构建的API端点URL不正确。

**解决方案**: 修改插件代码中的URL构建逻辑：

```php
// 在Plugin.php的footer()方法中，替换现有的URL构建逻辑
public static function footer()
{
    // ... 现有代码 ...
    
    // 尝试不同的URL构建方式
    $options = Helper::options();
    
    // 方法1: 使用绝对路径
    $actionUrl = $options->index . '/action/ai-abstractor';
    
    // 方法2: 使用相对路径（如果方法1失败）
    // $actionUrl = '/action/ai-abstractor';
    
    // 方法3: 使用查询参数形式（如果伪静态有问题）
    // $actionUrl = $options->index . '/?action=ai-abstractor';
    
    // ... 其余代码 ...
}
```

### 4. 检查Action注册状态

**问题描述**: Action未正确注册到Typecho系统中。

**解决方案**: 在插件激活时添加调试信息：

```php
public static function activate()
{
    // 注册Action
    Helper::addAction('ai-abstractor', 'AIAbstractor_Action');
    
    // 添加调试日志
    error_log('AIAbstractor: Action registered - ai-abstractor');
    
    return _t('AIAbstractor 插件已启用');
}
```

### 5. 浏览器控制台调试

**使用测试工具**:
1. 在浏览器中打开 `http://your-site.com/usr/plugins/AIAbstractor/test_api.html`
2. 使用提供的测试工具进行API测试
3. 查看浏览器控制台的网络请求详情

### 6. 服务器端调试

**检查服务器日志**:
- 查看Web服务器错误日志
- 检查PHP错误日志
- 确认是否有权限问题

### 7. 替代端点格式

如果标准端点格式有问题，可以尝试以下替代方案：

```javascript
// 在JavaScript中尝试不同的端点格式
const possibleEndpoints = [
    '/action/ai-abstractor',                    // 标准格式
    '/index.php/action/ai-abstractor',         // 带index.php
    '/?action=ai-abstractor',                  // 查询参数格式
    '/index.php?action=ai-abstractor'          // 带index.php的查询参数
];

// 测试每个端点
async function testEndpoints() {
    for (const endpoint of possibleEndpoints) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ q: 'test', model: 'gpt-4o-mini' })
            });
            
            if (response.ok) {
                console.log('成功端点:', endpoint);
                return endpoint;
            }
        } catch (e) {
            console.log('失败端点:', endpoint, e.message);
        }
    }
    return null;
}
```

## 快速排查步骤

1. **检查插件激活状态**: 确保插件已正确激活
2. **测试基础URL**: 访问 `http://your-site.com/action/ai-abstractor` 看是否返回405错误（POST方法要求）
3. **检查伪静态**: 确认Typecho伪静态配置正确
4. **查看控制台**: 使用浏览器开发者工具查看网络请求详情
5. **测试替代端点**: 使用提供的测试工具尝试不同的端点格式

## 临时解决方案

如果以上方法都不能解决问题，可以临时修改JavaScript代码，使用查询参数格式：

```javascript
// 在ai_abstractor.js中修改API端点
window.AIAbstractorConfig = {
    // ... 其他配置 ...
    apiEndpoint: '/?action=ai-abstractor',  // 使用查询参数格式
    // ... 其他配置 ...
};
```

## 联系支持

如果问题仍然存在，请提供以下信息进行进一步诊断：
1. Typecho版本号
2. Web服务器类型（Apache/Nginx）
3. 伪静态配置内容
4. 浏览器控制台错误信息
5. 服务器错误日志