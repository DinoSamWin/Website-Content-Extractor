# SnipIt Chrome扩展

<p align="center">
  <img src="./images/icon128.png" alt="SnipIt Logo" width="128" height="128">
</p>

一个简洁高效的Chrome扩展，用于提取并保存网页中选中的文本内容。

## 功能特点

- **便捷提取**：选中网页文本后，自动显示添加按钮，一键保存
- **分类管理**：按网站自动分类保存的内容，便于查找
- **状态标记**：支持勾选/取消勾选已保存的内容，方便跟踪阅读进度
- **悬浮窗口**：内容以悬浮窗口形式展示，不影响网页浏览
- **拖拽功能**：窗口支持拖拽移动，自由调整位置

## 安装方法

### 从Chrome网上应用店安装

1. 访问Chrome网上应用店（即将上线）
2. 点击"添加至Chrome"按钮

### 开发者模式安装

1. 下载此仓库的ZIP文件或使用git克隆到本地
2. 打开Chrome浏览器，进入扩展程序页面 (chrome://extensions/)
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"，选择项目文件夹

## 使用说明

1. **保存内容**：在网页中选中文本，点击出现的"+"按钮保存
2. **查看内容**：点击Chrome工具栏中的扩展图标，或在网页中点击"+"按钮后自动弹出内容窗口
3. **管理内容**：
   - 点击内容前的勾选框可标记/取消标记内容
   - 点击内容项右侧的"×"按钮可删除该内容
   - 点击网站标题可展开/折叠该网站下的所有内容

## 技术实现

- 使用Chrome扩展API实现跨页面内容保存和管理
- 采用原生JavaScript开发，无需额外框架
- 使用Chrome Storage API进行数据持久化存储
- 实现了自定义拖拽功能，提升用户体验

## 项目结构

```
├── background.js     # 后台脚本
├── content.css       # 内容脚本样式
├── content.js        # 内容脚本
├── images/           # 图标资源
├── manifest.json     # 扩展清单文件
├── popup-iframe.html # 弹窗iframe页面
├── popup.css         # 弹窗样式
├── popup.html        # 弹窗页面
└── popup.js          # 弹窗脚本
```

## 贡献指南

欢迎提交问题和功能请求！如果您想贡献代码：

1. Fork 这个仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详情请参阅 LICENSE 文件