<center> <a href="./README-zh_TW.md">繁體中文</a> | <a href="./README-zh_TW.md">简体中文</a> </center>

# Scrcpy Launcher
A simple scrcpy GUI launcher.

## Basic Features
- Instantly refreshed device list
- Device alias management
- Complete graphical parameter setting
Supported operating systems:
    - Windows 10 or later
    - Ubuntu 20.04 or later
    - Debian 11 or later
    - Fedora 32 or later
    - Latest Arch Linux version (maintain rolling updates)
    - RHEL/CentOS RHEL 9 series or later
    - **Windows 7 and earlier, and Linux distributions with glibc below 2.31 are not supported**
    - **macOS is not currently supported, but you can try porting it yourself if needed**

## Installation
### Through AUR (recommended)
If you are using Archlinux or other Arch-based Linux distributions, you can now install the application through AUR, which will automatically handle dependencies and create a launcher icon. You can install it through `yay -S scrcpy-launcher` or other AUR tools (such as `paru`).

For other distributions or Windows users, it is not packaged yet, please see the manual installation steps below.

### Manual Installation

#### 1. Dependencies (Choose One)
- Global Dependencies
    - android-tools (adb command): Scrcpy itself relies on ADB for connectivity. Install adb (platform-tools) on the system and set the path so that adb can be run through `adb` instead of `./adb` or `path/to/adb`.
    - scrcpy: The launcher doesn't include scrcpy by default. Install Scrcpy on the system and set the path (this should usually happen automatically) so that Scrcpy can be run through `scrcpy` instead of `./scrcpy` or `path/to/scrcpy`.
- Built-in Dependencies
    - You can also install/unzip scrcpy to `launcher_directory/scrcpy`. The application will prioritize the scrcpy stored in the launcher directory. Since scrcpy includes adb, there's no need to download adb separately and set it up.

        **If you do not use this built-in dependency method, please make sure there is no scrcpy folder in the launcher directory!**
##### Example of built-in directory structure
```
Launcher directory (scrcpy-launcher)
├── (other files)
├── ScrcpyLauncher or ScrcpyLauncher.exe
└── scrcpy
    ├── (other files)
    ├── adb or adb.exe
    └── scrcpy or scrcpy.exe
```
#### 2. Unzip
- Unzip the compressed file downloaded from release to any location
- Directly execute the unzipped `ScrcpyLauncher` or `ScrcpyLauncher.exe`
#### 3. Add a desktop launcher icon (optional)
- (Linux) Create a .desktop file, set Exec to the full path of `ScrcpyLauncher`, and set Icon to `Scrcpy_logo.png` in the program directory.
- (Windows) Right-click on `ScrcpyLauncher.exe` and select `Send to >> Desktop Shortcut`.

## Compact Mode
The launcher includes a compact mode, which you can enter by reducing the window width, but currently you need enough width to access the settings, and you cannot view the settings in compact mode. Therefore, it is recommended to enter the compact mode after the settings are completed.

## What does the release.sh script do?

release.sh is a packaging tool. For various reasons, I did not use things like nw-builder, but wrote a simple script myself. Use it through `./release.sh <platform>`. You can also specify multiple platforms at a time, separated by spaces, like this `./release.sh linux64 win64`. The currently supported platforms are linux64 win64.

This script will automatically download the 0.64.1 version of nwjs. The compressed package will be kept in the nwjs folder. You don't need to download it again for subsequent packaging. It is not recommended to use a higher version of nwjs, because nw2 has a lot of bugs and some of them have hardly been fixed (for example, the bug that broke the transparent window appeared a year ago, and my rounded window needs a transparent window).

The packaged compressed file will be placed in the `dist/<version number>` folder

**Do not delete the dist and nwjs folders! If these two folders cannot be found, the script will not automatically create them, but will report an error!**

## NW.js version
**It is not recommended to update to a version higher than 0.64.1, because in subsequent versions, there will be extra overlays that break the window rounding effect**