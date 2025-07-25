#!/bin/bash

# 微信小程序部署脚本
# 用于自动切换不同环境配置

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置文件路径
ENV_CONFIG_FILE="miniprogram/config/environment.js"
PROJECT_CONFIG_FILE="miniprogram/project.config.json"

# 显示帮助信息
show_help() {
    echo -e "${BLUE}微信小程序环境部署脚本${NC}"
    echo ""
    echo "使用方法："
    echo "  $0 [环境类型]"
    echo ""
    echo "环境类型："
    echo "  development  - 开发环境（完整功能）"
    echo "  audit        - 审核版本（功能受限）"
    echo "  production   - 生产版本（完整功能）"
    echo "  webview_only - 纯webview版本（无抓取，零依赖）"
    echo ""
    echo "示例："
    echo "  $0 audit        # 切换到审核版本"
    echo "  $0 production   # 切换到生产版本"
    echo "  $0 webview_only # 切换到纯webview版本"
    echo ""
}

# 检查环境配置文件是否存在
check_files() {
    if [ ! -f "$ENV_CONFIG_FILE" ]; then
        echo -e "${RED}错误：环境配置文件不存在: $ENV_CONFIG_FILE${NC}"
        exit 1
    fi
    
    if [ ! -f "$PROJECT_CONFIG_FILE" ]; then
        echo -e "${RED}错误：项目配置文件不存在: $PROJECT_CONFIG_FILE${NC}"
        exit 1
    fi
}

# 备份当前配置
backup_config() {
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    cp "$ENV_CONFIG_FILE" "${ENV_CONFIG_FILE}.backup_${timestamp}"
    cp "$PROJECT_CONFIG_FILE" "${PROJECT_CONFIG_FILE}.backup_${timestamp}"
    echo -e "${GREEN}✓ 已备份当前配置${NC}"
}

# 切换环境配置
switch_environment() {
    local env_type=$1
    
    echo -e "${YELLOW}正在切换到 ${env_type} 环境...${NC}"
    
    # 使用 sed 替换环境类型
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/const CURRENT_ENV = ENV_TYPE\.[A-Z_]*/const CURRENT_ENV = ENV_TYPE.$(echo $env_type | tr '[:lower:]' '[:upper:]')/" "$ENV_CONFIG_FILE"
    else
        # Linux
        sed -i "s/const CURRENT_ENV = ENV_TYPE\.[A-Z_]*/const CURRENT_ENV = ENV_TYPE.$(echo $env_type | tr '[:lower:]' '[:upper:]')/" "$ENV_CONFIG_FILE"
    fi
    
    # 根据环境类型调整项目配置
    case $env_type in
        "audit")
            # 审核版本配置
            echo -e "${YELLOW}配置审核版本参数...${NC}"
            # 可以在这里添加特定的项目配置修改
            ;;
        "production")
            # 生产版本配置
            echo -e "${YELLOW}配置生产版本参数...${NC}"
            ;;
        "development")
            # 开发版本配置
            echo -e "${YELLOW}配置开发版本参数...${NC}"
            ;;
        "webview_only")
            # 纯webview版本配置
            echo -e "${YELLOW}配置纯webview版本参数...${NC}"
            echo -e "${GREEN}✓ 无需MCP服务器，完全无依赖${NC}"
            ;;
    esac
    
    echo -e "${GREEN}✓ 环境切换完成${NC}"
}

# 验证配置
verify_config() {
    local env_type=$1
    
    echo -e "${YELLOW}验证配置...${NC}"
    
    # 检查环境配置是否正确设置
    if grep -q "CURRENT_ENV = ENV_TYPE.$(echo $env_type | tr '[:lower:]' '[:upper:]')" "$ENV_CONFIG_FILE"; then
        echo -e "${GREEN}✓ 环境配置验证通过${NC}"
    else
        echo -e "${RED}✗ 环境配置验证失败${NC}"
        exit 1
    fi
}

# 显示当前配置
show_current_config() {
    echo -e "${BLUE}当前配置信息：${NC}"
    
    # 提取当前环境
    local current_env=$(grep "const CURRENT_ENV" "$ENV_CONFIG_FILE" | sed 's/.*ENV_TYPE\.\([A-Z_]*\).*/\1/')
    echo -e "环境类型: ${GREEN}${current_env}${NC}"
    
    # 显示功能状态
    echo -e "\n${BLUE}功能状态：${NC}"
    case $current_env in
        "AUDIT")
            echo -e "富文本模式: ${GREEN}启用${NC}"
            echo -e "代理网页模式: ${RED}禁用${NC}"
            echo -e "直接网页模式: ${RED}禁用${NC}"
            echo -e "平台跳转: ${RED}禁用${NC}"
            ;;
        "DEVELOPMENT")
            echo -e "富文本模式: ${GREEN}启用${NC}"
            echo -e "代理网页模式: ${GREEN}启用${NC}"
            echo -e "直接网页模式: ${GREEN}启用${NC}"
            echo -e "平台跳转: ${GREEN}启用${NC}"
            ;;
        "PRODUCTION")
            echo -e "富文本模式: ${GREEN}启用${NC}"
            echo -e "代理网页模式: ${GREEN}启用${NC}"
            echo -e "直接网页模式: ${GREEN}启用${NC}"
            echo -e "平台跳转: ${GREEN}启用${NC}"
            ;;
        "WEBVIEW_ONLY")
            echo -e "富文本模式: ${RED}禁用${NC}"
            echo -e "代理网页模式: ${RED}禁用${NC}"
            echo -e "直接网页模式: ${GREEN}强制启用${NC}"
            echo -e "平台跳转: ${GREEN}启用${NC}"
            echo -e "数据抓取: ${RED}完全禁用${NC}"
            echo -e "服务器依赖: ${RED}零依赖${NC}"
            ;;
    esac
}

# 显示部署提示
show_deploy_tips() {
    local env_type=$1
    
    echo -e "\n${BLUE}部署提示：${NC}"
    
    case $env_type in
        "audit")
            echo -e "${YELLOW}审核版本注意事项：${NC}"
            echo "1. 代理功能已禁用，只保留富文本模式"
            echo "2. 确保在小程序后台配置了正确的服务器域名"
            echo "3. 准备好免责声明和用户协议说明"
            echo "4. 在审核时强调'信息聚合'而非'代理服务'"
            ;;
        "production")
            echo -e "${GREEN}生产版本注意事项：${NC}"
            echo "1. 所有功能已启用"
            echo "2. 确保MCP服务器稳定运行"
            echo "3. 监控服务器性能和错误日志"
            echo "4. 定期检查第三方API可用性"
            ;;
        "development")
            echo -e "${BLUE}开发版本注意事项：${NC}"
            echo "1. 包含所有调试功能"
            echo "2. 使用本地开发服务器"
            echo "3. 显示详细错误信息"
            ;;
        "webview_only")
            echo -e "${GREEN}纯webview版本注意事项：${NC}"
            echo "1. 🚀 完全无数据抓取，完全合规"
            echo "2. 💰 无需部署MCP服务器，零成本"
            echo "3. 🔒 最佳隐私保护，用户数据不经过第三方"
            echo "4. 🌐 直接访问原网站，功能完整"
            echo "5. ⚡ 即开即用，无网络等待"
            echo "6. 📱 适合应用商店审核，合规性最佳"
            echo ""
            echo -e "${YELLOW}部署检查清单：${NC}"
            echo "✓ 确认无需配置服务器域名"
            echo "✓ 测试所有站点webview跳转功能"
            echo "✓ 验证设置页面显示正确"
            echo "✓ 确认无MCP相关错误日志"
            ;;
    esac
    
    echo -e "\n${GREEN}✓ 环境切换完成，可以开始构建和部署${NC}"
}

# 主函数
main() {
    local env_type=$1
    
    # 检查参数
    if [ -z "$env_type" ]; then
        show_help
        exit 1
    fi
    
    # 验证环境类型
    case $env_type in
        "development"|"audit"|"production"|"webview_only")
            ;;
        *)
            echo -e "${RED}错误：无效的环境类型 '$env_type'${NC}"
            show_help
            exit 1
            ;;
    esac
    
    echo -e "${BLUE}=== 微信小程序环境部署脚本 ===${NC}"
    echo ""
    
    # 检查文件
    check_files
    
    # 备份配置
    backup_config
    
    # 切换环境
    switch_environment "$env_type"
    
    # 验证配置
    verify_config "$env_type"
    
    # 显示当前配置
    show_current_config
    
    # 显示部署提示
    show_deploy_tips "$env_type"
}

# 如果脚本被直接调用（而不是被source）
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi