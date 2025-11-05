<?php
/**
 * AIAbstractor API 调试脚本
 * 用于诊断HTTP 404错误问题
 */

// 模拟Typecho环境
if (!defined('__TYPECHO_ROOT_DIR__')) {
    define('__TYPECHO_ROOT_DIR__', dirname(__FILE__) . '/../../../../');
}

// 加载Typecho核心
require_once __TYPECHO_ROOT_DIR__ . 'config.inc.php';
require_once __TYPECHO_ROOT_DIR__ . 'var/Typecho/Common.php';
require_once __TYPECHO_ROOT_DIR__ . 'var/Typecho/Widget.php';
require_once __TYPECHO_ROOT_DIR__ . 'var/Typecho/Plugin.php';

echo "=== AIAbstractor API 调试信息 ===\n\n";

// 1. 检查Typecho版本
echo "1. Typecho版本: " . Typecho_Common::VERSION . "\n";

// 2. 检查插件配置
$options = Helper::options();
$pluginOptions = Helper::options()->plugin('AIAbstractor');

echo "\n2. 插件配置信息:\n";
echo "   - 插件URL: " . $options->pluginUrl . "\n";
echo "   - 网站索引: " . $options->index . "\n";
echo "   - API Base: " . ($pluginOptions->apiBase ?? '未设置') . "\n";
echo "   - 模型: " . ($pluginOptions->model ?? '未设置') . "\n";

// 3. 构建Action URL（与插件中相同逻辑）
$index = rtrim($options->index, '/');
$actionUrl = $index . '/action/ai-abstractor';
echo "\n3. 构建的Action URL: " . $actionUrl . "\n";

// 4. 检查Action是否已注册
$actions = Typecho_Plugin::factory('Widget_Archive')->getActions();
echo "\n4. 已注册的Actions:\n";
if (empty($actions)) {
    echo "   - 没有找到注册的Actions\n";
} else {
    foreach ($actions as $action => $callback) {
        echo "   - $action: " . print_r($callback, true) . "\n";
    }
}

// 5. 检查路由配置
echo "\n5. 检查路由配置:\n";
$router = Typecho_Router::get('action');
if ($router) {
    echo "   - Action路由已配置\n";
} else {
    echo "   - Action路由未配置\n";
}

// 6. 测试直接访问Action
echo "\n6. 测试Action访问:\n";
$testUrl = $actionUrl;
echo "   - 测试URL: $testUrl\n";

// 创建模拟请求
$ch = curl_init($testUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_NOBODY, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "   - HTTP状态码: $httpCode\n";

// 7. 检查插件激活状态
echo "\n7. 插件状态检查:\n";
$plugins = Typecho_Plugin::export();
if (isset($plugins['activated']['AIAbstractor'])) {
    echo "   - AIAbstractor插件已激活\n";
} else {
    echo "   - AIAbstractor插件未激活\n";
}

// 8. 提供解决方案
echo "\n=== 可能的解决方案 ===\n";
echo "1. 确保插件已正确激活\n";
echo "2. 检查Typecho的伪静态配置是否正确\n";
echo "3. 确认.htaccess文件存在且配置正确\n";
echo "4. 检查Web服务器是否支持URL重写\n";
echo "5. 尝试清除浏览器缓存和Typecho缓存\n";
echo "6. 检查是否有其他插件冲突\n";

echo "\n=== 调试完成 ===\n";