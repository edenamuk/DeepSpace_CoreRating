// src/components/Fields/CoreForm.jsx
// 手動輸入 : 等級 / 類型 / 星譜 / 主詞條 / 副詞條

import { useState } from "react";
import CORE_META from "../data/coreMeta.json";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBrush, faTrash, faTriangleExclamation, faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";

export default function CoreForm({
  onSubmit,
  showToast,
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
  resetForm, // 接收 resetForm 函式
}) {
  const [loading, setLoading] = useState(false);
  
  // ===== 表單送出處理 =====
  const handleSubmit = () => {
    // 1️⃣ 檢查必填欄位
    const validateForm = () => {
      const hasDuplicate = subStats.some((s, i) => s.key && subStats.some((t, j) => i !== j && s.key === t.key));

      if (!level) return "請選擇芯核等級。";
      if (!type) return "請選擇芯核類型。";
      if (!color) return "請選擇芯核星譜。";
      if (!mainStat) return "請選擇主詞條。";
      if (hasDuplicate) {
        return "有重複的副詞條，請修改後再嘗試。";
      }
      return null;
    };
    const errMsg = validateForm();
    if (errMsg) {
      showToast?.("error", errMsg, 2500, <FontAwesomeIcon icon={faTriangleExclamation} />);
      return;
    }

    // 2️⃣ 檢查副詞條：key 必填，value 若空就補 0
    const normalizedSubStats = subStats.map((s, i) => {
      if (!s.key) {
        showToast?.("error", `第 ${i + 1} 個副詞條未選擇`, 2500, <FontAwesomeIcon icon={faTriangleExclamation} />);
        throw new Error(`副詞條錯誤`); // 中斷流程
      }
      return {
        ...s,
        value: s.value === "" || s.value == null ? 0 : Number(s.value),
      };
    });

    // 3️⃣ 如果全部都驗證通過 → 送出
    setLoading(true); // 顯示載入動畫
    setTimeout(() => {
      setLoading(false);
      onSubmit?.({
        level,
        type,
        color,
        mainStat,
        subStats: normalizedSubStats,
      });
    }, 3000);
  };

  // ===== 依類型自動調整主詞條 =====
  const handleTypeChange = (value) => {
    setType(value);
    if (value === "diamond") {
      setMainStat(CORE_META.mainStat.diamond);
    } else if (value === "uni") {
      setMainStat(CORE_META.mainStat.uni);
    } else {
      setMainStat(""); // 方形、三角由使用者選
    }
  };

  // ===== 新增副詞條欄位 =====
  const addSubStat = () => {
    if (subStats.length < 4) {
      setSubStats([...subStats, { key: "", value: "", upgradeCount: 0 }]);
    }
  };

  // ===== 更新副詞條（key/value） =====
  const updateSubStat = (index, field, newValue) => {
    setSubStats((prev) => {
      const updated = [...prev];
      updated[index][field] = newValue;
      return updated;
    });
  };

  // ===== 調整副詞條強化次數 =====
  const adjustUpgradeCount = (index, delta) => {
    console.log("adjustUpgradeCount 被呼叫了", delta);
    setSubStats((prev) => {
      const updated = [...prev];
      let next = updated[index].upgradeCount + delta;
      if (next < 0) next = 0; // 最小 0
      if (next > 7) next = 7; // 假設最大 5（可依遊戲調整）
      updated[index].upgradeCount = next;
      console.log("updated[index].upgradeCount", updated[index].upgradeCount);
      return updated;
    });
  };

  // ===== 清空副詞條（key/value/upgradeCount） =====
  const clearSubStat = (index) => {
    setSubStats((prev) => {
      const updated = [...prev];
      updated[index] = { key: "", value: "", upgradeCount: 0 };
      return updated;
    });
  };

  // ===== 刪除副詞條欄位 =====
  const deleteSubStat = (index) => {
    setSubStats((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full space-y-4">
      {/* === 一般區塊 === */}
      <fieldset className="border border-base-300 rounded-box p-4">
        <legend className="px-2 text-secondary text-xs sm:text-sm">等級 & 類型 & 星譜</legend>

        {/* 等級選擇 */}
        <div className="flex join w-full mb-2">
          {/* 左邊標籤（不可點擊） */}
          <span className="btn btn-xs sm:btn-sm sm:w-20 join-item cursor-default pointer-events-none bg-base-300 text-base-content/80">
            等級
          </span>

          {/* 按鈕群組 */}
          {["0", "3", "6", "9", "12", "15"].map((lv) => {
            return (
              <label key={lv} className="flex-1">
                <input
                  type="radio"
                  name="level"
                  value={lv}
                  checked={level === lv}
                  onChange={() => setLevel(lv)}
                  className="hidden peer"
                />
                <div className="btn btn-xs sm:btn-sm join-item w-full justify-center peer-checked:btn-primary">
                  {/* 小螢幕顯示短版，大螢幕顯示完整 */}
                  <span className="sm:hidden">{lv}</span>
                  <span className="hidden sm:inline">+{lv}</span>
                </div>
              </label>
            );
          })}
        </div>

        {/* 類型選擇 */}
        <div className="flex join w-full mb-2">
          {/* 左邊標籤（不可點擊） */}
          <span className="btn btn-xs sm:btn-sm sm:w-20 join-item cursor-default pointer-events-none bg-base-300 text-base-content/80">
            類型
          </span>

          {/* 按鈕群組 */}
          {Object.entries(CORE_META.type).map(([key, obj]) => {
            const short = obj[`${key}_s`]; // 短版 ("α" / "β" / "γ" / "δ")
            const full = obj[`${key}_f`]; // 全版 ("菱形．α" / "方形．β" / ...)
            return (
              <label key={key} className="flex-1">
                <input
                  type="radio"
                  name="type"
                  value={key}
                  checked={type === key}
                  onChange={() => handleTypeChange(key)}
                  className="hidden peer"
                />
                <div className="btn btn-xs sm:btn-sm join-item w-full justify-center peer-checked:btn-primary">
                  {/* 小螢幕顯示短版，大螢幕顯示完整 */}
                  <span className="sm:hidden">{short}</span>
                  <span className="hidden sm:inline">{full}</span>
                </div>
              </label>
            );
          })}
        </div>

        {/* 顏色選擇 */}
        <div className="flex join w-full">
          {/* 左邊標籤（不可點擊） */}
          <span className="btn btn-xs sm:btn-sm sm:w-20 join-item cursor-default pointer-events-none bg-base-300 text-base-content/80">
            星譜
          </span>

          {/* 按鈕群組 */}
          {Object.entries(CORE_META.color).map(([key, obj]) => {
            const short = obj[`${key}_s`]; // 短版 ("紅" / "藍" / ...)
            const full = obj[`${key}_f`]; // 全版 ("紅漪" / "藍弧" / ...)
            const colorClass = {
              red: "peer-checked:btn-error",
              blue: "peer-checked:btn-info",
              green: "peer-checked:btn-success",
              yellow: "peer-checked:btn-warning",
              pink: "peer-checked:bg-mypink peer-checked:text-mypink-content",
              purple: "peer-checked:btn-accent",
            };
            return (
              <label key={key} className="flex-1">
                <input
                  key={key}
                  type="radio"
                  name="color"
                  value={key}
                  checked={color === key}
                  onChange={() => setColor(key)}
                  className="hidden peer"
                />
                <div className={`btn btn-xs sm:btn-sm join-item w-full justify-center ${colorClass[key]}`}>
                  {/* 小螢幕顯示短版，大螢幕顯示完整 */}
                  <span className="sm:hidden">{short}</span>
                  <span className="hidden sm:inline">{full}</span>
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* === 詞條區塊 === */}
      <fieldset className="border border-base-300 rounded-box p-4">
        <legend className="px-2 text-secondary text-xs sm:text-sm">主詞條 & 副詞條</legend>

        {/* 主詞條 */}
        <div className="relative w-full">
          {/* 外層框樣式 */}
          <div className="select select-sm sm:select-md select-bordered w-full flex items-center justify-center relative">
            {/* 透明 select，負責互動 */}
            <select
              value={mainStat}
              disabled={type === "diamond" || type === "uni"} // 禁止直接選
              onChange={(e) => setMainStat(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            >
              <option value="">主詞條</option>
              {type === "square" &&
                CORE_META.mainStat.square.map((key) => (
                  <option key={key} value={key}>
                    {CORE_META.mainStat.options[key]}
                  </option>
                ))}
              {type === "triangle" &&
                CORE_META.mainStat.triangle.map((key) => (
                  <option key={key} value={key}>
                    {CORE_META.mainStat.options[key]}
                  </option>
                ))}
              {type === "diamond" && (
                <option value={CORE_META.mainStat.diamond}>
                  {CORE_META.mainStat.options[CORE_META.mainStat.diamond]}
                </option>
              )}
              {type === "uni" && (
                <option value={CORE_META.mainStat.uni}>{CORE_META.mainStat.options[CORE_META.mainStat.uni]}</option>
              )}
            </select>

            {/* 顯示選中的值（置中顯示） */}
            <div className="pointer-events-none w-full text-center">
              {mainStat ? CORE_META.mainStat.options[mainStat] : "主詞條"}
            </div>
          </div>
        </div>

        {/* 分隔線 */}
        <div className="divider h-full sm:h-4"></div>

        {/* 副詞條 */}
        <div className="space-y-2 sm:space-y-2">
          {subStats.map((sub, idx) => {
            const isDuplicate = sub.key && subStats.some((s, i) => i !== idx && s.key === sub.key);

            return (
              <div key={idx} className="flex flex-col gap-1">
                {/* 副詞條群組 : 下拉選單 + 數值 + 清空 + 刪除 */}
                <div className="grid grid-cols-3 sm:flex gap-1 sm:gap-2">
                  {/* 下拉選單 + 數值欄位群組 */}
                  <div className="col-span-3 row-span-2 grow join w-full">
                    {/* 下拉選單 */}
                    <select
                      className={`select select-sm sm:select-md flex-1 sm:flex-2 select-bordered join-item ${
                        isDuplicate ? "select-error" : ""
                      }`}
                      value={sub.key}
                      onChange={(e) => updateSubStat(idx, "key", e.target.value)}
                    >
                      <option value="">副詞條</option>
                      {Object.entries(CORE_META.subStat).map(([key, obj]) => (
                        <option key={key} value={key}>
                          {obj}
                        </option>
                      ))}
                    </select>

                    {/* 數值 */}
                    <label
                      className={`input input-sm sm:input-md flex-2 sm:flex-3 input-bordered items-center gap-2 join-item ${
                        isDuplicate ? "select-error" : ""
                      }`}
                    >
                      <input
                        type="number"
                        className="grow"
                        placeholder="數值"
                        value={sub.value}
                        onChange={(e) => updateSubStat(idx, "value", e.target.value)}
                      />
                      {sub.key && !["atk", "def", "hp"].includes(sub.key) && (
                        <span className="badge badge-xs sm:badge-sm">%</span>
                      )}
                    </label>
                  </div>

                  {/* 強化次數按鈕 */}
                  <div className="col-span-1 join justify-start">
                    <button
                      className="btn btn-xs sm:btn-md btn-square btn-primary join-item shadow-none"
                      onClick={() => adjustUpgradeCount(idx, -1)}
                    >
                      <FontAwesomeIcon icon={faMinus} />
                    </button>
                    <div className="btn btn-xs sm:btn-md btn-square btn-primary btn-outline join-item cursor-default pointer-events-none">
                      {sub.upgradeCount}
                    </div>
                    <button
                      className="btn btn-xs sm:btn-md btn-square btn-primary join-item shadow-none"
                      onClick={() => adjustUpgradeCount(idx, +1)}
                    >
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                  </div>

                  {/* 錯誤訊息提示 Mobile ver. */}
                  {isDuplicate && (
                    <span className="col-span-1 text-error text-xs place-self-center ml-2 sm:hidden whitespace-nowrap">
                      <FontAwesomeIcon icon={faTriangleExclamation} />
                      副詞條重複
                    </span>
                  )}

                  {/* 清空 / 刪除按鈕群組 */}
                  <div className="col-span-1 col-end-4 flex justify-end sm:col-span-auto sm:justify-start join">
                    <button
                      type="button"
                      className="btn btn-xs sm:btn-md btn-square btn-dash btn-secondary join-item"
                      onClick={() => clearSubStat(idx)}
                    >
                      <FontAwesomeIcon icon={faBrush} className="rotate-180" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-xs sm:btn-md btn-square btn-dash btn-error join-item"
                      onClick={() => deleteSubStat(idx)}
                      disabled={subStats.length <= 2}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
                {/* 錯誤訊息提示 Desktop ver.*/}
                {isDuplicate && (
                  <span className="text-error text-xs ml-1 hidden sm:block">
                    <FontAwesomeIcon icon={faTriangleExclamation} /> 副詞條重複
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* 新增副詞條按鈕 */}
        {subStats.length < 4 && (
          <button type="button" className="btn btn-sm sm:btn-md btn-dash btn-accent mt-2 w-full" onClick={addSubStat}>
            新增副詞條
          </button>
        )}
      </fieldset>

      {/* === 功能按鈕區塊 === */}
      <div className="flex justify-between gap-2">
        {/* 清空按鈕 */}
        <button type="button" className="btn btn-outline flex-1" onClick={resetForm}>
          清空
        </button>

        {/* 評分按鈕 */}
        <button
          type="button"
          className={`btn btn-primary flex-1 relative ${loading ? "pointer-events-none opacity-100" : ""}`}
          onClick={handleSubmit}
          aria-busy={loading}
        >
          {/* 文字：loading 時 invisible，非 loading 時可見 */}
          <span className={loading ? "invisible" : ""}>開始評分</span>
          {/* spinner：絕對置中覆蓋 */}
          {loading && (
            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="loading loading-spinner loading-md" aria-hidden="true"></span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
