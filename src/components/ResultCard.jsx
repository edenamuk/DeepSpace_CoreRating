// src/components/ResultCard.jsx
// 評分結果 : 顯示評分結果 / 數值詳情 / 推薦套裝

// TODO:
// - 3. 匯出功能

// FIXME:
// - 1. 評分條 調整

import React from "react";
import { exportAsPng, exportAsCsv } from "./utils/exportFile";
import CORE_META from "./data/coreMeta.json";

export default function ResultCard({ data, onReset, targetRef }) {
  const NO_PERCENT = ["atk", "def", "hp"];
  const COLOR_CLASS = {
    red: {
      bg: "bg-error text-error-content",
      border: "border-error",
      combo: "border-error bg-error/50",
      badge: "badge-error",
    },
    blue: {
      bg: "bg-info text-info-content",
      border: "border-info",
      combo: "border-info bg-info/50",
      badge: "badge-info",
    },
    green: {
      bg: "bg-success text-success-content",
      border: "border-success",
      combo: "border-success bg-success/50",
      badge: "badge-success",
    },
    yellow: {
      bg: "bg-warning text-warning-content",
      border: "border-warning",
      combo: "border-warning bg-warning/50",
      badge: "badge-warning",
    },
    pink: {
      bg: "bg-mypink text-mypink-content",
      border: "border-mypink",
      combo: "border-mypink bg-mypink/50",
      badge: "badge-mypink",
    },
    purple: {
      bg: "bg-accent text-neutral-accent-content",
      border: "border-accent",
      combo: "border-accent bg-accent/50",
      badge: "badge-accent",
    },
  };

  if (!data) return null;

  // === Part 1: 資質進度條設定 ===
  const maxScore = data.overall.score;
  let progressColor = "bg-secondary";
  if (maxScore >= 95) {
    progressColor = "bg-warning"; // 完美
  } else if (maxScore >= 85) {
    progressColor = "bg-accent"; // 極品
  } else if (maxScore >= 75) {
    progressColor = "bg-info"; // 優秀
  } else if (maxScore >= 60) {
    progressColor = "bg-success"; // 良好
  }

  // === Part 2: 評分結果 ===
  const { crit, weak } = data;
  const exportFileName = "crit-" + data.crit.score + "_weak-" + data.weak.score;

  // 小工具：格式化評語（支援換行與粗體）
  const formatCommentary = (text) => {
    if (!text) return null;

    return text.split("\n").map((line, i) => {
      // 先把每一行拆成粗體/一般文字
      const parts = line.split(/(\*\*.*?\*\*)/g);

      return (
        <React.Fragment key={i}>
          {parts.map((part, j) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <strong key={j}>{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
          <br />
        </React.Fragment>
      );
    });
  };

  // === Part 3: 主詞條 ===
  const mainLabel = CORE_META.mainStat.options[data.mainStat.key] || data.mainStat.key; //查找中文
  const mainNeedsPercent = !NO_PERCENT.includes(data.mainStat.key);
  const mainValue = mainNeedsPercent ? `${data.mainStat.value} %` : data.mainStat.value;

  // === Part 4: 副詞條排序後 ===
  const subStatOrder = [
    "hp",
    "atk",
    "def",
    "critRate",
    "critDmg",
    "oathDmg",
    "weakDmg",
    "hpBoost",
    "atkBoost",
    "defBoost",
  ];
  const orderedSubStats = subStatOrder
    .map((orderKey) => data.subStats?.find((s) => s.key === orderKey))
    .filter(Boolean);

  return (
    <div className="card-body w-full">
      {/* === PART 1 : 資質評級進度條 === */}
      <div className="w-full px-4 sm:px-12">
        {/* 標籤區 */}
        <div className="flex justify-between gap-2 sm:gap-8 text-xs font-bold">
          <span className={maxScore < 40 ? "text-secondary" : "text-base-content/30"}>肥料</span>
          <span className="invisible">普通</span>
          <span className={maxScore >= 40 && maxScore < 60 ? "text-secondary" : "text-base-content/30"}>普通</span>
          <span className={maxScore >= 60 && maxScore < 75 ? "text-success" : "text-base-content/30"}>良好</span>
          <span className={maxScore >= 75 && maxScore < 85 ? "text-info" : "text-base-content/30"}>優秀</span>
          <span className={maxScore >= 85 && maxScore < 95 ? "text-accent" : "text-base-content/30"}>極品</span>
          <span className={maxScore >= 95 ? "text-warning" : "text-base-content/30"}>完美</span>
        </div>
        {/* 進度條 */}
        <div className={`w-full h-2 mt-2 rounded-lg ${progressColor}/20`}>
          <div className={`h-2 rounded-lg ${progressColor}`} style={{ width: `${maxScore}%` }}></div>
        </div>
      </div>

      {/* === PART 2 : 評分結果 === */}
      <div className="stats stats-vertical sm:stats-horizontal w-full">
        {/* 暴擊流 */}
        <div className="stat place-items-center p-2">
          <div className="flex flex-row sm:flex-col w-full sm:items-center justify-between">
            <div className="flex flex-col flex-1 text-center">
              <div className="stat-title">暴擊流</div>
              <div className="stat-value font-chiron">{crit.score}</div>
            </div>
            <div className="flex-2 stat-desc content-center text-center">{formatCommentary(crit.commentary)}</div>
          </div>
        </div>

        {/* 虛弱流 */}
        <div className="stat place-items-center p-2">
          <div className="flex flex-row sm:flex-col w-full sm:items-center justify-between">
            <div className="flex flex-col flex-1 text-center">
              <div className="stat-title">虛弱流</div>
              <div className="stat-value font-chiron">{weak.score}</div>
            </div>
            <div className="flex-2 stat-desc content-center text-center">{formatCommentary(weak.commentary)}</div>
          </div>
        </div>
      </div>

      {/* === PART 3 : 數值詳情區塊 === */}
      <fieldset className="flex flex-row gap-2 sm:gap-4 w-full border border-base-300 rounded-box p-2 sm:p-4 pb-4 sm:pb-6">
        <legend className="fieldset-legend px-2 text-xs sm:text-sm text-secondary">數值詳情</legend>

        {/* 左方區塊 - 圖片 + 基礎資訊 */}
        <div className="flex flex-col gap-1 sm:gap-2 justify-center">
          <div className="w-16 h-16 sm:w-24 sm:h-24">
            <img src={`/img/core_${data.type}_${data.color}.png`} alt="圖片" crossOrigin="anonymous" />
          </div>
          <div className="badge badge-xs sm:badge-md badge-outline w-full">+{data.level}</div>
          <div className={`badge badge-xs sm:badge-md badge-outline w-full ${COLOR_CLASS[data.color].badge}`}>
            {CORE_META.type[data.type]?.[`${data.type}_f`] || data.type}
          </div>
        </div>

        {/* 右方區塊 - 主/副詞條數值 */}
        <div className="flex flex-col w-full justify-center text-xs sm:text-base">
          <div className="space-y-2">
            {/* 主詞條 */}
            <div className="flex join">
              <div className="join-item flex-3 grid place-items-center px-2 sm:py-2 bg-error/30">主詞條</div>
              <div className="join-item flex-3 sm:flex-3 px-1 sm:p-2 text-start">{mainLabel}</div>
              <div className="join-item flex-3 px-1 sm:p-2 text-end">{mainValue}</div>
              <div className="flex items-center justify-center">
                <div className="badge badge-xs sm:badge-md badge-error badge-soft invisible">0</div>
              </div>
            </div>

            {/* 副詞條 */}
            {orderedSubStats.map((subStat, i) => {
              const label = CORE_META.subStat[subStat.key] || subStat.key;
              const needsPercent = !NO_PERCENT.includes(subStat.key);
              const value = needsPercent ? `${subStat.value} %` : subStat.value;
              const upgradeCount = subStat.upgradeCount;

              return (
                <div key={i} className="flex join">
                  <div className="join-item flex-3 grid place-items-center px-2 sm:py-2 bg-primary/30">副詞條</div>
                  <div className="join-item flex-3 sm:flex-3 px-1 sm:p-2 text-start">{label}</div>
                  <div className="join-item flex-3 px-1 sm:p-2 text-end">{value}</div>
                  <div className="flex items-center justify-center">
                    <div
                      className={`badge badge-xs sm:badge-md badge-error badge-soft ${
                        upgradeCount > 0 ? "" : "invisible"
                      }`}
                    >
                      {upgradeCount}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </fieldset>

      {/* === PART 4 : 推薦套裝區塊 === */}
      <fieldset className="border border-base-300 rounded-box p-2 sm:p-4 pb-4 sm:pb-6">
        <legend className="fieldset-legend px-2 text-xs sm:text-sm text-secondary">推薦搭檔</legend>
        <div className="space-y-2 w-full sm:text-base">
          {Array.isArray(data.overall.recommendSets) ? (
            data.overall.recommendSets.map((set, i) => (
              <div key={i} className="flex join">
                {/* 左側：角色 */}
                <div className={`join-item flex-3 grid place-items-center sm:p-2 ${COLOR_CLASS[data.color].bg}`}>
                  {set.character}
                </div>
                {/* 中間：套裝 */}
                <div
                  className={`join-item flex-5 grid place-items-center sm:p-2 border-1 ${
                    COLOR_CLASS[data.color].border
                  }`}
                >
                  {set.set}
                </div>
                {/* 右側：天賦 */}
                <div
                  className={`join-item flex-2 grid place-items-center sm:p-2 border-1 ${
                    COLOR_CLASS[data.color].combo
                  }`}
                >
                  {set.talent}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-base-content/70">{data.overall.recommendSets}</p>
          )}
        </div>
      </fieldset>

      {/* === PART 5 : 功能按鈕區塊 === */}
      <div className="grid grid-col-2 sm:grid-cols-3 gap-2 mt-4 no-export">
        <button type="button" className="btn btn-outline" onClick={() => exportAsPng(targetRef, exportFileName)}>
          匯出截圖
        </button>
        <button type="button" className="btn btn-outline" onClick={() => exportAsCsv(data, exportFileName)}>
          匯出CSV
        </button>
        <button type="button" className="btn btn-primary col-span-2 sm:col-span-1" onClick={onReset}>
          再次評分
        </button>
      </div>
    </div>
  );
}
