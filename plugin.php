<?php
/**
 * AI摘要工具
 *
 * 一个为您的Typecho博客文章生成AI摘要的插件，支持自定义GPT API。
 *
 * @package AIAbstractor
 * @author Your Name // 请替换为您的名字
 * @version 1.0.0
 * @link https://github.com/YourGitHub/AIAbstractor // 请替换为您的GitHub仓库地址 (可选)
 */
class AIAbstractor_Plugin implements Typecho_Plugin_Interface
{
    /**
     * 激活插件方法
     */
    public static function activate()
    {
        // 注册在页面头部输出CSS和配置的钩子
        Typecho_Plugin::factory('Widget_Archive')->header = array('AIAbstractor_Plugin', 'header');
        // 注册在页面底部输出JS的钩子
        Typecho_Plugin::factory('Widget_Archive')->footer = array('AIAbstractor_Plugin', 'footer');
        return 'AI摘要工具已激活！';
    }

    /**
     * 禁用插件方法
     */
    public static function deactivate()
    {
        return 'AI摘要工具已禁用！';
    }

    /**
     * 获取插件配置面板
     *
     * @param Typecho_Widget_Helper_Form $form 配置面板
     */
    public static function config(Typecho_Widget_Helper_Form $form)
    {
        $appName = new Typecho_Widget_Helper_Form_Element_Text(
            'appName',
            NULL,
            'AI摘要工具',
            _t('应用名称'),
            _t('在博客页面上显示的AI摘要工具的名称。')
        );
        $form->addInput($appName);

        $classNamePrefix = new Typecho_Widget_Helper_Form_Element_Text(
            'classNamePrefix',
            NULL,
            'ai-abstractor',
            _t('类名/ID前缀'),
            _t('用于HTML元素的类名和ID前缀。请确保此值与JS和CSS文件中的前缀一致。')
        );
        $form->addInput($classNamePrefix);

        $apiEndpoint = new Typecho_Widget_Helper_Form_Element_Text(
            'apiEndpoint',
            NULL,
            'https://hub.onmicrosoft.cn/chat/stream', // 默认API端点
            _t('GPT API 端点'),
            _t('您的个人GPT API的流式输出端点。')
        );
        $form->addInput($apiEndpoint);

        $apiKey = new Typecho_Widget_Helper_Form_Element_Text(
            'apiKey',
            NULL,
            '', // 默认API Key为空
            _t('GPT API Key'),
            _t('您的个人GPT API密钥 (如果您的API需要)。')
        );
        $form->addInput($apiKey);

        $postSelector = new Typecho_Widget_Helper_Form_Element_Text(
            'postSelector',
            NULL,
            '.post-content', // 默认文章内容选择器
            _t('文章内容选择器'),
            _t('您的博客文章内容的CSS选择器，例如 ".post-body", ".entry-content" 等。')
        );
        $form->addInput($postSelector);

        $wordLimit = new Typecho_Widget_Helper_Form_Element_Text(
            'wordLimit',
            NULL,
            '100', // 默认摘要字数限制
            _t('摘要字数限制'),
            _t('生成的摘要的最大字数。')
        );
        $form->addInput($wordLimit);

        $postURL = new Typecho_Widget_Helper_Form_Element_Text(
            'postURL',
            NULL,
            '', // 默认URL匹配规则为空
            _t('URL匹配规则'),
            _t('可选：匹配文章URL的规则，例如 "/posts/*" 。留空表示所有页面都启用。')
        );
        $form->addInput($postURL);
    }

    /**
     * 个人用户的配置面板 (本插件不需要，留空)
     */
    public static function personalConfig(Typecho_Widget_Helper_Form $form)
    {
    }

    /**
     * 在页面头部输出CSS和AIAbstractorConfig配置
     */
    public static function header()
    {
        $options = Typecho_Widget::widget('Widget_Options')->plugin('AIAbstractor');

        // 输出CSS文件
        echo '<link rel="stylesheet" href="' . Typecho_Common::url('assets/css/ai_abstractor.css', __TYPECHO_PLUGIN_URL__ . '/AIAbstractor') . '">';

        // 输出AIAbstractorConfig配置 (必须在JS文件之前)
        echo '<script type="text/javascript">';
        echo 'const AIAbstractorConfig = {';
        echo 'appName: "' . addslashes($options->appName) . '",';
        echo 'classNamePrefix: "' . addslashes($options->classNamePrefix) . '",';
        echo 'apiEndpoint: "' . addslashes($options->apiEndpoint) . '",';
        echo 'apiKey: "' . addslashes($options->apiKey) . '",';
        echo 'postSelector: "' . addslashes($options->postSelector) . '",';
        echo 'wordLimit: ' . intval($options->wordLimit) . ',';
        echo 'postURL: ' . (empty($options->postURL) ? 'undefined' : '"' . addslashes($options->postURL) . '"');
        echo '};';
        echo '</script>';
    }

    /**
     * 在页面底部输出JS文件
     */
    public static function footer()
    {
        // 输出JS文件
        echo '<script type="text/javascript" src="' . Typecho_Common::url('assets/js/ai_abstractor.js', __TYPECHO_PLUGIN_URL__ . '/AIAbstractor') . '"></script>';
    }
}
