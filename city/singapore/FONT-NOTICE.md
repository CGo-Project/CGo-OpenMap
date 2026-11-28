# 字体说明

## 站码和线路标：Lato Bold

车站站码及 NSL / EWL / NEL / CCL / DTL / TEL / BP / STC / PTC 线路标统一使用 **Lato Bold（700）**。车站站码直接引用本地字体，线路标以同一份 `Lato-Bold.ttf` 的字形转成 SVG 路径，手机不依赖本机字体；不再使用 Roboto Slab。英文详情使用 Lato Regular。

源文件：`assets/fonts/Lato-Regular.ttf`、`Lato-Bold.ttf`。来源：https://github.com/google/fonts/tree/main/ofl/lato 。授权为 SIL Open Font License 1.1，见 [OFL.txt](assets/fonts/OFL.txt)。字体二进制未经修改，线路标只分发字形轮廓。

## 中文站名：Noto Sans CJK SC 子集

中文站名、施工牌和水系文字使用开源 Noto Sans CJK SC Regular / Bold。为保证手机、离线及桌面排版一致，按本站所需字符制作 WOFF 子集，并将字体内部名称改为 **Singapore Chinese**；原始版权为 © 2014–2021 Adobe。两份子集位于 `assets/fonts/SingaporeChinese-Regular.woff`、`SingaporeChinese-Bold.woff`。水系名称转成矢量路径。

来源：https://github.com/notofonts/noto-cjk 。授权为 SIL Open Font License 1.1，完整文本及修改说明见 [OFL-NotoSansCJK.txt](assets/fonts/OFL-NotoSansCJK.txt)。新增中文字符后应同步更新子集。

这些开源字体用于风格替代，不宣称是 LTA Identity。项目不包含或提取专有字体字形。字体许可独立于仓库代码及数据许可。
