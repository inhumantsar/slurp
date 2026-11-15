import { moment } from "obsidian";

const en = {
  commandName: "Create note from URL",
  menuTitle: "Slurp",
  defaultSaveLocation: "Default save location",
  defaultSaveLocationDesc: "What directory should Slurp save pages to? Leave blank to save to the vault's main directory.",
  frontmatterOnly: "Frontmatter only",
  frontmatterOnlyDesc: "Save only frontmatter, leaving note content empty.",
  images: "Images",
  saveImagesLocally: "Save images locally",
  saveImagesLocallyDesc: "Download remote images and replace their Markdown destinations with vault-local paths.",
  imageFolder: "Image folder",
  imageFolderDesc: "Folder relative to each saved note's directory. Leave blank to save beside the note.",
  bannerFrontmatter: "Set banner frontmatter",
  bannerFrontmatterDesc: "Set the banner property to the first image's URL or saved path.",
  properties: "Properties",
  showEmptyProperties: "Show empty properties",
  showEmptyPropertiesDesc: "Should Slurp add all note properties even if they are empty?",
  tags: "Tags",
  parseTags: "Parse tags",
  parseTagsDesc: "Use the tags and keywords discovered in slurped page metadata? WARNING: May result in a large number of new tags, prefixes are highly recommended. Some sites put entire sentences into the fields meant for comma-separated keywords. Yes, abc7news.com, I'm talking about you.",
  tagPrefix: "Tag prefix",
  tagPrefixDesc: "Apply this prefix to all tags.",
  tagCase: "Tag case",
  tagCaseDesc: "Format multi-word tags using this style. iKebab-case will replace spaces with hyphens without changing case.",
  reportIssue: "Report an Issue",
  reportIssueDesc: "Visit github.com/inhumantsar/slurp/issues/new to report a bug or request a feature.",
  debugMode: "Debug mode",
  debugModeDesc: "Write debug messages to console and slurp.log.",
  recentLogs: "Recent Logs",
  recentLogsDesc: "Copy+Paste these when opening a new GitHub issue. Not available when debug mode is enabled. Attach the most recent log file to the GitHub issue instead.",
  modalHeading: "What would you like to slurp today?",
  urlPlaceholder: "https://www.somesite.com/...",
  slurpButton: "Slurp",
  invalidUrl: "Invalid URL format.",
  incompatibleSite: "This site is known to be incompatible with Slurp.",
  errorPrefix: "Slurp Error!"
} as const;

type Key = keyof typeof en;

const zh: Record<Key, string> = {
  commandName: "从 URL 创建笔记",
  menuTitle: "抓取网页",
  defaultSaveLocation: "默认保存位置",
  defaultSaveLocationDesc: "Slurp 应将网页保存到哪个目录？留空则保存到库根目录。",
  frontmatterOnly: "仅保存 Frontmatter",
  frontmatterOnlyDesc: "仅保存 frontmatter，笔记正文留空。",
  images: "图片",
  saveImagesLocally: "将图片保存到本地",
  saveImagesLocallyDesc: "下载远程图片，并将 Markdown 中的图片地址替换为库内路径。",
  imageFolder: "图片文件夹",
  imageFolderDesc: "相对于每条笔记所在目录的文件夹。留空则保存在笔记旁边。",
  bannerFrontmatter: "设置 Banner frontmatter",
  bannerFrontmatterDesc: "将 banner 属性设置为第一张图片的远程 URL 或本地保存路径。",
  properties: "属性",
  showEmptyProperties: "显示空属性",
  showEmptyPropertiesDesc: "是否让 Slurp 添加所有笔记属性，即使这些属性为空？",
  tags: "标签",
  parseTags: "解析标签",
  parseTagsDesc: "使用抓取网页元数据中发现的标签和关键词？警告：可能产生大量新标签，强烈建议设置前缀。有些网站会把整句话填入本应放置逗号分隔关键词的字段。",
  tagPrefix: "标签前缀",
  tagPrefixDesc: "将此前缀应用于所有标签。",
  tagCase: "标签大小写",
  tagCaseDesc: "以该样式格式化多词标签。iKebab-case 会将空格替换为连字符，但不改变大小写。",
  reportIssue: "报告问题",
  reportIssueDesc: "访问 github.com/inhumantsar/slurp/issues/new 报告错误或请求功能。",
  debugMode: "调试模式",
  debugModeDesc: "将调试消息写入控制台和 slurp.log。",
  recentLogs: "最近日志",
  recentLogsDesc: "提交新的 GitHub issue 时请复制粘贴这些日志。调试模式启用时不可用，此时请将最新日志文件附加到 issue。",
  modalHeading: "今天想抓取什么网页？",
  urlPlaceholder: "https://www.somesite.com/...",
  slurpButton: "抓取",
  invalidUrl: "URL 格式无效。",
  incompatibleSite: "已知此网站与 Slurp 不兼容。",
  errorPrefix: "Slurp 错误！"
};

function hasChineseLanguage (): boolean {
  const locale = (moment.locale() || "en").replace("_", "-").toLowerCase();
  return locale === "zh" || locale.startsWith("zh-");
}

export function t (key: Key): string {
  return (hasChineseLanguage() ? zh : en)[key];
}
