// src/components/Navbar.jsx
// 導覽列 : 明暗切換 / 設定 / 幫助

// TODO:
// - 1. 設定彈窗
// - 1-1. 設定API
// - 2. 幫助彈窗

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestion, faGear, faUpRightFromSquare, faKey, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { faCircleCheck } from "@fortawesome/free-regular-svg-icons";
import Modal from "./Modal";

export default function Navbar({ apiKey, onApiKeyChange }) {
  const [showSettings, setShowSettings] = useState(false);
  const [showKeySuccess, setShowKeySuccess] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [theme, setTheme] = useState("light");
  const [localApiKey, setLocalApiKey] = useState(apiKey || "");

  // 切換主題
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  // API Key 設定
  const handleSaveSettings = () => {
    onApiKeyChange?.(localApiKey); // 呼叫從 App.jsx 傳來的函式，更新金鑰
    setShowKeySuccess(true);
  };

  const handleInputChange = (e) => {
    setLocalApiKey(e.target.value);
    setShowSuccessMessage(false);
  };

  // 預設主題
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // 當 settings 彈窗打開時，同步一次來自 props 的 apiKey
  useEffect(() => {
    if (showSettings) {
      setLocalApiKey(apiKey || "");
      setShowKeySuccess(false);
    }
  }, [showSettings, apiKey]);

  return (
    <nav className="flex justify-between items-center w-full sm:max-w-md md:max-w-lg lg:max-w-xl px-2">
      {/* 左上：明暗切換 */}
      <label className="swap swap-rotate scale-50">
        {/* this hidden checkbox controls the state */}
        <input onClick={toggleTheme} type="checkbox" className="theme-controller" value="synthwave" />

        {/* sun icon */}
        <svg className="swap-off h-10 w-10 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
        </svg>

        {/* moon icon */}
        <svg className="swap-on h-10 w-10 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
        </svg>
      </label>
      {/* 標題 */}
      <div className="text-center font-bold text-sm sm:text-base">深空芯核評分系統</div>
      {/* 右上：齒輪 & 問號 */}
      <div className="flex gap-2">
        <button className="btn btn-xs btn-circle btn-outline btn-secondary" onClick={() => setShowHelp(true)}>
          <FontAwesomeIcon icon={faQuestion} />
        </button>
        <button className="btn btn-xs btn-circle btn-outline btn-secondary" onClick={() => setShowSettings(true)}>
          <FontAwesomeIcon icon={faGear} />
        </button>
      </div>

      {/* 設定彈窗 */}
      {showSettings && (
        <Modal title="系統設定" onClose={() => setShowSettings(false)} closeOnEsc={true}>
          <div className="w-full space-y-4">
            <fieldset className="fieldset w-full">
              <legend className="fieldset-legend text-sm">介面語言</legend>
              <select className="select w-full" disabled>
                <option>繁體中文</option>
              </select>
            </fieldset>
            <fieldset className="fieldset w-full">
              <legend className="fieldset-legend text-sm">API金鑰</legend>
              <label className="input w-full">
                <FontAwesomeIcon icon={faKey} />
                <input
                  type="password"
                  className="grow"
                  placeholder="請在此貼上您的金鑰"
                  value={localApiKey}
                  onChange={handleInputChange}
                />
              </label>
              {showKeySuccess && (
                <div className="label text-xs text-success pt-1">
                  <span className="label-text-alt flex items-center gap-1">
                    <FontAwesomeIcon icon={faCircleCheck} />
                    API 金鑰已成功儲存
                  </span>
                </div>
              )}
            </fieldset>
            <button className="btn btn-primary w-full mt-2" onClick={handleSaveSettings}>
              <FontAwesomeIcon icon={faFloppyDisk} />
              儲存設定
            </button>
          </div>
          <div className="divider"></div>
        </Modal>
      )}

      {/* 使用說明彈窗 */}
      {showHelp && (
        <Modal title="使用說明" onClose={() => setShowHelp(false)} closeOnEsc={true}>
          <div className="tabs tabs-border max-h-[40vh]">
            <input type="radio" name="info" className="tab mb-4" aria-label="關於" defaultChecked />
            <div className="tab-content h-full">
              <p className="text-lg font-bold">歡迎使用深空芯核評分系統！</p>
              <ul className="list-none list-inside space-y-2 mt-2 text-sm">
                <li>本工具旨在協助玩家快速、直觀地評估《戀與深空》芯核的品質與投資價值。</li>
                <li>
                  透過輸入芯核的當前數值，系統會自動計算「強化品質分」並生成詳細分析，幫助您判斷該芯核是否值得繼續培養。
                </li>
                <li className="font-bold mt-6">
                  請注意：本工具生成的評分與評語僅供個人遊戲參考，非遊戲官方數據，僅作策略輔助使用。
                </li>
              </ul>
            </div>
            <input type="radio" name="info" className="tab mb-4" aria-label="說明" />
            <div className="tab-content h-full overflow-y-auto">
              <p className="text-lg font-bold text-primary/80">三步驟，快速評估您的芯核品質！</p>
              <ol className="list-decimal list-inside space-y-6 mt-4 text-sm">
                <li className="list-decimal">
                  <strong>設定</strong>
                  <br />
                  點擊右上角的齒輪圖示（
                  <FontAwesomeIcon icon={faGear} className="scale-80" />
                  ），選擇您的介面語言，並貼上您的 Google Gemini API 金鑰，以便使用圖片辨識功能。
                  <ul className="list-disc list-inside space-y-1 mt-1">
                    <li>
                      <strong>什麼是 Google Gemini API 金鑰？</strong>
                      <br />
                      可以把它想像成一把「專屬的網路鑰匙」，用來證明您的身份，讓本工具能安全地連線並使用 Google Gemini
                      的 AI 計算服務。
                    </li>
                    <li>
                      <strong>為什麼需要它？</strong>
                      <br />
                      因為圖片辨識需要 AI 協助，本工具會透過 Gemini API
                      來自動讀取圖片中的文字。若沒有金鑰，將無法使用圖片辨識功能，但您仍可選擇手動輸入芯核數值。
                    </li>
                    <li>
                      <strong>在哪裡取得？</strong>
                      <br />
                      您可以在{" "}
                      <a
                        className="link link-secondary underline-offset-2 decoration-dashed"
                        href="https://aistudio.google.com/"
                        target="_blank"
                      >
                        Google AI Studio
                        <FontAwesomeIcon icon={faUpRightFromSquare} className="scale-80" />
                      </a>
                      免費申請，建立專案後即可獲得一組金鑰。
                    </li>
                  </ul>
                </li>
                <li className="list-decimal">
                  <strong>輸入芯核資料</strong>
                  <br /> 在工具介面中填入芯核的基本資訊：
                  <br />
                  <ul className="list-disc list-inside">
                    <li>芯核當前等級</li>
                    <li>芯核類型</li>
                    <li>星譜顏色</li>
                    <li>主詞條(僅方形、三角)</li>
                    <li>副詞條、副詞條數值、強化次數</li>
                  </ul>
                  輸入完畢後點擊「評分」按鈕。
                </li>
                <li className="list-decimal">
                  <strong>查看評分與匯出</strong>
                  <br />
                  工具會針對「暴擊流」與「虛弱流」分別計算評分，並依照最高分數給定總體評級。
                  <br />
                  每個流派將顯示：
                  <ul className="list-disc list-inside">
                    <li>流派分數：顯示該流派下的最終評分。</li>
                    <li>精簡專家評語：點出亮點、缺陷與潛力預測。</li>
                  </ul>
                  其他功能：
                  <ul className="list-disc list-inside">
                    <li>匯出結果：提供截圖、存為CSV將完整的評估數據保存下來，方便記錄、整理或分享。</li>
                    <li>搭檔推薦：快速提示該芯核最適合的搭檔組合。</li>
                  </ul>
                </li>
              </ol>
              <div className="divider h-0"></div>
              <strong className="text-sm">使用提醒</strong>
              <ul className="list-disc list-inside text-sm font-bold mt-2">
                <li>評分結果基於統計與預估模型，僅供參考。</li>
                <li>所有生成內容僅供個人使用，非商業用途。</li>
              </ul>
            </div>
            <input type="radio" name="info" className="tab mb-4" aria-label="更新日誌" />
            <div className="tab-content h-full overflow-y-auto">
              <ol className="list-disc list-inside space-y-6 mt-4 text-sm">
                <li>v1.1.1 版本發布。</li>
              </ol>
              <div className="divider h-0"></div>
              <strong className="text-sm">目前已知問題</strong>
              <ul className="list-disc list-inside text-sm mt-2">
                <li>Result評分條位置錯誤。</li>
                <li>圖片辨識無法識別非圖片檔案。</li>
              </ul>
            </div>
          </div>
        </Modal>
      )}
    </nav>
  );
}
