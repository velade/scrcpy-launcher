# Scrcpy啟動器
一個簡單的scrcpy的圖形化界面啟動器。

## 基本功能
- 即時刷新的設備列表
- 設備別名管理
- 簡易的常用設定

## 安裝
### 通過AUR（建議）
如果你使用的是Archlinux或其他基於Arch的Linux發行版，現在你可以通過AUR來安裝本應用，它會自動處理依賴，並創建啟動器圖標。你可以通過`yay -S scrcpy-launcher`或其他AUR工具（例如`paru`）來安裝。

對於其他發行版或Windows用戶，暫時並未打包發布，請看下方手動安裝步驟。

### 手動安裝

#### 1. 依賴
- android-tools(adb指令)：Scrcpy本身依賴ADB提供連接，你可以：
    - 安裝adb（platform-tools）到系統，並設定path，使adb可以通過`adb`而不是`./adb`或`path/to/adb`執行。
    - 安裝/解壓縮adb到`啟動器目錄/adb`下，應用將優先使用存放在啟動器目錄下的adb（**如果你不使用此種方式，請確保啟動器目錄下沒有adb檔案夾**）
- scrcpy：啟動器默認並未包含scrcpy，你可以：
    - 安裝Scrcpy到系統，並設定好path（這通常應該是自動的），使Scrcpy可以通過`scrcpy`而不是`./scrcpy`或`path/to/scrcpy`執行。
    - 安裝/解壓縮scrcpy到`啟動器目錄/scrcpy`下，應用將優先使用存放在啟動器目錄下的scrcpy（**如果你不使用此種方式，請確保啟動器目錄下沒有scrcpy檔案夾**）
##### 內建方式目錄結構示例
```
啟動器目錄(scrcpy-launcher)
├── (其他檔案)
├── Scrcpy啟動器 或 Scrcpy啟動器.exe
├── adb
│   ├── (其他檔案)
│   └── adb 或 adb.exe
└── scrcpy
    ├── (其他檔案)
    └── scrcpy 或 scrcpy.exe
```
#### 2. 解壓
 - 將從release下載的壓縮檔解壓到任意位置
 - 直接執行解壓後的`Scrcpy啟動器`或`Scrcpy啟動器.exe`
#### 3. 添加桌面啟動器圖標（可選）
 - （Linux）自行建立.desktop檔案，將Exec設為`Scrcpy啟動器`的完整路徑，將Icon設為程式目錄下的`Scrcpy_logo.png`即可。
 - （Windows）在`Scrcpy啟動器.exe`上右鍵，選擇`發送到>>桌面快捷方式`即可。

## 精簡模式
啟動器包含一個精簡模式，你可以通過將窗口寬度減少來使其進入，但目前你需要足夠的寬度才能訪問設定，精簡模式下無法查看設定。因此建議在設定完成後再進入精簡模式。

## release.sh 腳本是做什麼的？
release.sh 是一個打包工具，因為種種原因我沒有使用nw-builder這類東西，而是自己寫了一個簡單的腳本。通過`./release.sh <平台>`來使用，你也可以一次指定多個平台，以空格分隔，像這樣`./release.sh linux64 win32 win64`，現在支援的平台有linux64 win32 win64。

此腳本會自動下載0.64.1版本的nwjs，壓縮包會保留在nwjs檔案夾中，後續打包無需再次下載，因為不推薦更高版本的nwjs，因為nw2有大量bug且部分bug幾乎沒有進行修復（比如一年前就出現的會破壞透明窗體的BUG，而我的圓角窗口需要用到透明窗體）。

打包好的壓縮檔會放在`dist/<版本號>`檔案夾中

**不要刪除dist和nwjs檔案夾！找不到這兩個檔案夾的話腳本不會自動創建，而是會報錯！**

## NW.js 版本
**版本不建議更新為超過0.64.1的版本，因為在後續版本中會出現多餘的疊加層破壞窗口圓角效果**
