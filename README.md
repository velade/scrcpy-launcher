<center> <a href="./README-zh_TW.md">繁體中文</a> | <a href="./README-zh_TW.md">简体中文</a> </center>

# Scrcpy Launcher
A simple scrcpy GUI launcher.

## Basic Features
- Instantly refreshed device list
- Device alias management
- Simple common settings

## Installation
### Through AUR (recommended)
If you are using Archlinux or other Arch-based Linux distributions, you can now install the application through AUR, which will automatically handle dependencies and create a launcher icon. You can install it through `yay -S scrcpy-launcher` or other AUR tools (such as `paru`).

For other distributions or Windows users, it is not packaged yet, please see the manual installation steps below.

### Manual Installation

#### 1. Dependencies
- android-tools (adb command): Scrcpy itself relies on ADB to provide a connection. You can:
- Install adb (platform-tools) to the system and set the path so that adb can be executed through `adb` instead of `./adb` or `path/to/adb`.
- Install/unzip adb to `launcher directory/adb`, the application will give priority to the adb stored in the launcher directory (**If you do not use this method, please make sure there is no adb folder in the launcher directory**)
- scrcpy: The launcher does not include scrcpy by default, you can:
- Install Scrcpy to the system and set the path (this should usually be automatic) so that Scrcpy can be executed through `scrcpy` instead of `./scrcpy` or `path/to/scrcpy`.
- Install/unzip scrcpy to `launcher directory/scrcpy`, the application will give priority to the scrcpy stored in the launcher directory (**If you do not use this method, please make sure there is no scrcpy folder in the launcher directory**)
##### Example of built-in directory structure
```
Launcher directory (scrcpy-launcher)
├── (other files)
├── Scrcpy launcher or Scrcpy launcher.exe
├── adb
│   ├── (other files)
│   └── adb or adb.exe
└── scrcpy
├── (other files)
└── scrcpy or scrcpy.exe
```
#### 2. Unzip
- Unzip the compressed file downloaded from release to any location
- Directly execute the unzipped `Scrcpy launcher` or `Scrcpy launcher.exe`
#### 3. Add a desktop launcher icon (optional)
- (Linux) Create a .desktop file, set Exec to the full path of `Scrcpy Launcher`, and set Icon to `Scrcpy_logo.png` in the program directory.
- (Windows) Right-click on `Scrcpy Launcher.exe` and select `Send to >> Desktop Shortcut`.

## Compact Mode
The launcher includes a compact mode, which you can enter by reducing the window width, but currently you need enough width to access the settings, and you cannot view the settings in compact mode. Therefore, it is recommended to enter the compact mode after the settings are completed.

## What does the release.sh script do?

release.sh is a packaging tool. For various reasons, I did not use things like nw-builder, but wrote a simple script myself. Use it through `./release.sh <platform>`. You can also specify multiple platforms at a time, separated by spaces, like this `./release.sh linux64 win32 win64`. The currently supported platforms are linux64 win32 win64.

This script will automatically download the 0.64.1 version of nwjs. The compressed package will be kept in the nwjs folder. You don't need to download it again for subsequent packaging. It is not recommended to use a higher version of nwjs, because nw2 has a lot of bugs and some of them have hardly been fixed (for example, the bug that broke the transparent window appeared a year ago, and my rounded window needs a transparent window).

The packaged compressed file will be placed in the `dist/<version number>` folder

**Do not delete the dist and nwjs folders! If these two folders cannot be found, the script will not automatically create them, but will report an error! **

## NW.js version
**It is not recommended to update to a version higher than 0.64.1, because in subsequent versions, there will be extra overlays that break the window rounding effect**