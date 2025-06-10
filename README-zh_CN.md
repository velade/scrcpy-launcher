<center> <a href="./README.md">English</a> | <a href="./README-zh_TW.md">繁體中文</a> </center>

# Scrcpy启动器
一个简单的scrcpy的图形化界面启动器。

## 基本功能
- 即时刷新的设备列表
- 设备别名管理
- 简易的常用设定

## 安装
### 通过AUR（建议）
如果你使用的是Archlinux或其他基于Arch的Linux发行版，现在你可以通过AUR来安装本应用，它会自动处理依赖，并创建启动器图标。你可以通过`yay -S scrcpy-launcher`或其他AUR工具（例如`paru`）来安装。

对于其他发行版或Windows用户，暂时并未打包发布，请看下方手动安装步骤。

### 手动安装

#### 1. 依赖
- android-tools(adb指令)：Scrcpy本身依赖ADB提供连接，你可以：
- 安装adb（platform-tools）到系统，并设定path，使adb可以通过`adb`而不是`./adb`或`path/to/adb`执行。 
- 安装/解压缩adb到`启动器目录/adb`下，应用将优先使用存放在启动器目录下的adb（**如果你不使用此种方式，请确保启动器目录下没有adb档案夹**）
- scrcpy：启动器默认并未包含scrcpy，你可以：
- 安装Scrcpy到系统，并设定好path（这通常应该是自动的），使Scrcpy可以通过`scrcpy`而不是`./scrcpy`或`path/to/scrcpy`执行。 
- 安装/解压缩scrcpy到`启动器目录/scrcpy`下，应用将优先使用存放在启动器目录下的scrcpy（**如果你不使用此种方式，请确保启动器目录下没有scrcpy档案夹**）
##### 内建方式目录结构示例
```
启动器目录(scrcpy-launcher)
├── (其他档案)
├── Scrcpy启动器 或 Scrcpy启动器.exe
├── adb
│   ├── (其他档案)
│   └── adb 或 adb.exe
└── scrcpy
├── (其他档案)
└── scrcpy 或 scrcpy.exe
```
#### 2. 解压
- 将从release下载的压缩档解压到任意位置
- 直接执行解压后的`Scrcpy启动器`或`Scrcpy启动器.exe`
#### 3. 添加桌面启动器图标（可选）
- （Linux）自行建立.desktop档案，将Exec设为`Scrcpy启动器`的完整路径，将Icon设为程式目录下的`Scrcpy_logo.png`即可。 
- （Windows）在`Scrcpy启动器.exe`上右键，选择`发送到>>桌面快捷方式`即可。

## 精简模式
启动器包含一个精简模式，你可以通过将窗口宽度减少来使其进入，但目前你需要足够的宽度才能访问设定，精简模式下无法查看设定。因此建议在设定完成后再进入精简模式。

## release.sh 脚本是做什么的？
release.sh 是一个打包工具，因为种种原因我没有使用nw-builder这类东西，而是自己写了一个简单的脚本。通过`./release.sh <平台>`来使用，你也可以一次指定多个平台，以空格分隔，像这样`./release.sh linux64 win32 win64`，现在支援的平台有linux64 win32 win64。

此脚本会自动下载0.64.1版本的nwjs，压缩包会保留在nwjs档案夹中，后续打包无需再次下载，因为不推荐更高版本的nwjs，因为nw2有大量bug且部分bug几乎没有进行修复（比如一年前就出现的会破坏透明窗体的BUG，而我的圆角窗口需要用到透明窗体）。

打包好的压缩档会放在`dist/<版本号>`档案夹中

**不要删除dist和nwjs档案夹！找不到这两个档案夹的话脚本不会自动创建，而是会报错！ **

## NW.js 版本
**版本不建议更新为超过0.64.1的版本，因为在后续版本中会出现多余的叠加层破坏窗口圆角效果**