# CHANGELOG

所有重要變更都會記錄在此，遵循 [語義化版本號](https://semver.org/lang/zh-TW/)。

格式：
- **feat:** 新增功能  
- **fix:** 修正問題  
- **chore:** 維護 / 調整 / 套件更新  
- **refactor:** 重構程式碼  

---

## [1.1.3] - 2025-09-20
### 新增 (feat)
- 調整更新日誌位置
- 修正版權聲明位置

---

## [1.1.2] - 2025-09-20
### 新增 (feat)
- 新增 Gemini API Key 申請說明
- 修正 評分條間距、評分條背景不顯示問題

---

## [1.1.1] - 2025-09-19
### 修正 (fix)
- 修正 Gemini AI 圖片辨識 prompt
- 修正 ResultCard 排版跳動問題
- 修正 Toast 顏色只有 `error` 正常顯示的問題

---

## [1.1.0] - 2025-09-18
### 新增 (feat)
- 接入 Gemini AI 圖片辨識，自動填入 core form
- API 金鑰設定與儲存提示，成功儲存會顯示 Toast
- Navbar 明暗主題切換功能
- 使用說明彈窗（包含三步驟指引與注意事項）
- CoreForm 與 ResultCard 基本顯示與排序功能
- 支援副詞條自動計算與評分

### 修正 (fix)
- ResultCard subStats 排序問題
- 清空與刪除按鈕與下拉選單群組問題
- Tailwind/DaisyUI 顏色對應問題修正

---

## [1.0.0] - 2025-09-15
### 新增 (feat)
- 初始版本完成基本核心評分功能
- CoreForm 基本輸入欄位：等級、類型、星譜顏色、主詞條、副詞條
- 簡單的評分公式與總分計算
- 可以匯出 CSV 與截圖
- 初步 ResultCard 顯示

### 維護 (chore)
- 專案結構整理，React + Vite 基本環境搭建
