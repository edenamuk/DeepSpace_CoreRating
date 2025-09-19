// src/components/InputCard.jsx
// 輸入頁面 : 上傳圖片 / 手動輸入
import React, { useState } from "react";
import UploadImage from "./Fields/UploadImage";
import CoreForm from "./Fields/CoreForm";

export default function InputCard({ onScore, showToast, apiKey }) {
  const [level, setLevel] = useState("0"); // 等級，預設 +0
  const [type, setType] = useState(""); // 類型
  const [color, setColor] = useState(""); // 顏色
  const [mainStat, setMainStat] = useState(""); // 主詞條
  const [subStats, setSubStats] = useState([
    { key: "", value: "", upgradeCount: 0 },
    { key: "", value: "", upgradeCount: 0 },
  ]); // 副詞條，預設兩條

  // ===== 清空表單欄位 =====
  const resetForm = () => {
    setLevel("0");
    setType("");
    setColor("");
    setMainStat("");
    setSubStats([
      { key: "", value: "", upgradeCount: 0 },
      { key: "", value: "", upgradeCount: 0 },
    ]);
  };

  // 3. 建立一個新的函式，用來接收 AI 辨識的結果並更新 state
  const handleAiRecognition = (aiData) => {
    // 根據 Gemini 回傳的資料設定所有 state
    if (aiData.level) setLevel(aiData.level);
    if (aiData.type) setType(aiData.type);
    if (aiData.color) setColor(aiData.color);
    if (aiData.mainStat) setMainStat(aiData.mainStat);
    if (aiData.subStats && Array.isArray(aiData.subStats)) {
      // 確保副詞條至少有兩條，不足則補空
      const filledSubStats = [...aiData.subStats];
      while (filledSubStats.length < 2) {
        filledSubStats.push({ key: "", value: "", upgradeCount: 0 });
      }
      setSubStats(filledSubStats);
    }
  };

  // 4. 將 state 和更新函式作為 props 傳遞給子元件
  const coreFormProps = {
    level,
    setLevel,
    type,
    setType,
    color,
    setColor,
    mainStat,
    setMainStat,
    subStats,
    setSubStats,
    resetForm, // 將 resetForm 傳下去
    onSubmit: onScore,
    showToast,
  };

  return (
    <div className="card-body">
      {/* 1. 上傳圖片區塊 */}
      <UploadImage showToast={showToast} apiKey={apiKey} onRecognitionSuccess={handleAiRecognition} />

      {/* 分隔線 */}
      <div className="divider my-1 sm:my-4 text-xs sm:text-sm text-base-content/50">OR</div>

      {/* 2. 手動輸入區塊 */}
      <CoreForm {...coreFormProps} />
    </div>
  );
}
