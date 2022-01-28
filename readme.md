# JX3BOX-DICT

## 说明

这个项目用于将剑网3中的“宏”或“团队监控数据”准确地从简体中文转为繁体中文。  

网上直译的词库将可能导致宏无法运行或数据无法正常监控。

## 使用

你可以通过 https://www.jx3box.com/app/translator 在线转译你的作品。  

或直接引用 https://cdn.jsdelivr.net/gh/JX3BOX/jx3box-dict@master/dict.json 构建你自己的项目

## 贡献

请在 `src/JX3BOX` 目录下根据新建一个 UTF-8 编码的 `TSV` 文件（命名可以根据具体作用而定），并在其中写入你要增加的名词

文件内容形如 `简体文本\t繁体文本`，`\t` 为制表符，每行一组

之后运行 `npm run-script build` 生成输出数据，向本仓库发送 PR 即可

你也可以通过 https://github.com/JX3BOX/jx3box-dict/issues 提交需要补充的词汇。

## 贡献名单

感谢以下小伙伴对词库的辛勤整理&贡献：

+ 南宫伯

+ BILIN 

+ WUSISANERYI

+ CoolguyNH
