# Scrcpy啟動器
一個簡單的scrcpy的圖形化界面啟動器。

## 基本功能
- 即時刷新的設備列表
- 設備別名管理
- 簡易的常用設定

## 依賴
- ADB：Scrcpy本身依賴ADB提供連接，因此你需要安裝ADB並將其加入到系統路徑，即你可以通過adb而不是path/to/adb來執行。
- Scrcpy：起動器本身並未包含scrcpy，因此你依然需要正確安裝Scrcpy並確保好以直接通過scrcpy而不是path/to/scrcpy來執行。

## 精簡模式
起動器包含一個精簡模式，你可以通過將窗口寬度減少來使其進入，但目前你需要足夠的寬度才能訪問設定，精簡模式下無法查看設定。因此建議在設定完成後再進入精簡模式。

## NW.js 版本
**版本不建議超過0.64.1，因為在後續版本中會出現多餘的疊加層破壞窗口圓角效果**