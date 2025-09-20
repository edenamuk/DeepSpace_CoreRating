// src/components/utils/calculateSQS.js
// [v4 類型感知版]
// 根據芯核類型（菱形、方形、海膽、三角）採用不同的評分策略，使評分更智能、更準確。
// 1. 三角芯核: 啟用嚴格的主詞條審核機制。
// 2. 菱形/海膽芯核: 分數完全由副詞條決定。
// 3. 方形芯核: 分數由副詞條決定，並在評語中給予策略性提醒。

// 依賴的數據檔案:
import WEIGHTS from "../data/weights.json";
import VALUE_DATA from "../data/valuesData.json"; // 預期結構: { subStatValueRanges: { "詞條名": { initial: { min, max }, upgrade: { min, max } }, mainStatValue: { ... } }
import RECOMMEND_SETS from "../data/recommendSets.json";
import CORE_META from "../data/coreMeta.json";

/**
 * 將輸入的原始數值轉為標準化數字。
 * - 可處理 "18%", "0.18", 18 等格式。
 * @param {string|number} rawValue - 使用者輸入的原始值。
 * @returns {number} - 清理並轉換後的數字。
 */
function parseNumericValue(rawValue) {
  if (rawValue === null || rawValue === undefined) return 0;
  const s = String(rawValue).trim().replace("%", ""); // 移除 % 和逗號
  const v = parseFloat(s);
  if (Number.isNaN(v)) return 0;

  // 如果輸入是小數 (如 0.18)，且看起來像百分比，將其轉換。
  // 注意：這裡假設所有小於1的有效詞條都是百分比的簡寫。
  if (v > 0 && v <= 1) {
    // 簡單檢查一下哪些詞條可能是百分比
    const notPercentStat = ["atk", "def", "hp"].some((p) => rawValue.toString().includes(p));
    if (!notPercentStat) {
      // This logic might need refinement based on actual stat names
      // For now, we assume if a value is <=1 it's a percentage representation
      return v * 100;
    }
  }
  return v;
}

/**
 * [輔助函數 - 副詞條計算 - v4]
 * 1. 啟用「合理推算模型」，利用原值與升級次數來估算最可能的初值。
 * 2. 計算副詞條的品質分數和詳情。
 * @param {"暴擊流"|"虛弱流"} flow - 流派。
 * @param {"攻擊天賦"|"防禦天賦"|"生命天賦"} talent - 天賦。
 * @param {Object} coreData - 芯核數據。subStats: { key, value, upgradeCount }
 * @returns {{score: number, details: Array<Object>}}
 */
function calculateSubStatsDetails(flow, talent, coreData) {
  const details = [];
  let weightedScoreSum = 0;
  let weightSum = 0;
  const weightTable = WEIGHTS[flow]?.[talent]?.subStats || {};

  coreData.subStats.forEach(({ key, value, upgradeCount }) => {
    const numericValue = parseNumericValue(value);
    const ranges = VALUE_DATA.subStatValueRanges[key];
    const weight = weightTable[key] || 0;

    if (!ranges || !ranges.initial || !ranges.upgrade) {
      details.push({ key, weight, rollQuality: 0, upgradeCount, totalRolls: 1 + upgradeCount });
      return;
    }
    // === 核心推算邏輯 : 推測詞條初始值 ===
    let estimatedInitialValue = null;
    if (upgradeCount > 0) {
      const { initial: iRange, upgrade: uRange } = ranges;
      const inferredInitialMin = numericValue - upgradeCount * uRange.max;
      const inferredInitialMax = numericValue - upgradeCount * uRange.min;
      const validInitialMin = Math.max(iRange.min, inferredInitialMin);
      const validInitialMax = Math.min(iRange.max, inferredInitialMax);

      if (validInitialMin > validInitialMax) {
        estimatedInitialValue = iRange.min;
      } else {
        estimatedInitialValue = (validInitialMin + validInitialMax) / 2;
      }
    } else {
      estimatedInitialValue = numericValue;
    }

    // === 後續評分邏輯 ===
    // 1. 計算「初始Roll」的品質分 (0-100)
    const ratio_i = (estimatedInitialValue - ranges.initial.min) / (ranges.initial.max - ranges.initial.min);
    const initialQuality = Math.round(Math.max(0, Math.min(ratio_i, 1)) * 100);
    // 2. 計算「強化Rolls」的平均品質分 (0-100)
    let upgradeQuality = 0;
    if (upgradeCount > 0) {
      const avgUpgradeValue = (numericValue - estimatedInitialValue) / upgradeCount;
      const ratio_u = (avgUpgradeValue - ranges.upgrade.min) / (ranges.upgrade.max - ranges.upgrade.min);
      upgradeQuality = Math.round(Math.max(0, Math.min(ratio_u, 1)) * 100);
    }
    // 3. 合併品質分：按Roll次數進行加權平均
    let combinedQuality =
      upgradeCount > 0 ? (initialQuality * 1 + upgradeQuality * upgradeCount) / (1 + upgradeCount) : initialQuality;
    // 4. 加總副詞條總分並記錄詳情以供評語參考
    weightedScoreSum += combinedQuality * weight;
    weightSum += weight;
    details.push({ key, weight, rollQuality: Math.round(combinedQuality), upgradeCount, totalRolls: 1 + upgradeCount });
    console.log({ key, weight, rollQuality: Math.round(combinedQuality), upgradeCount, totalRolls: 1 + upgradeCount });
  });

  const finalScore = weightSum === 0 ? 0 : Math.round(weightedScoreSum / weightSum);
  return { score: finalScore, details };
}

/**
 * [核心計算引擎 - v4]
 * 1. 感知芯核類型並採用不同評分策略，將主詞條融入評分計算。
 * 修正了三角芯核的計分邏輯，採用「基礎分 + 附加分」模型，
 * 避免主詞條權重為100時，分數被強制鎖定為100的問題。
 * @param {"暴擊流"|"虛弱流"} flow - 流派。
 * @param {"攻擊天賦"|"防禦天賦"|"生命天賦"} talent - 天賦。
 * @param {Object} coreData - 芯核數據。mainStat: { key, value }
 * @returns {{score: number, details: Array<Object>}}
 */
function getBuildDetails(flow, talent, coreData) {
  const { type, mainStat } = coreData;

  // Step 1: 所有芯核都先計算一次純粹的「副詞條品質分」。
  const { score: subStatsScore, details } = calculateSubStatsDetails(flow, talent, coreData);

  // Step 2: 根據芯核類型，執行不同的主詞條評分策略來調整分數。
  let finalScore = subStatsScore;

  // 策略A: 對於三角芯核，啟用嚴格的主詞條權重審核
  if (type.includes("triangle")) {
    const mainStatWeights = WEIGHTS[flow]?.[talent]?.triangle_mainStat || {};
    const mainStatWeight = mainStatWeights[mainStat] || 0;

    // 主詞條貢獻的基礎分 (滿分70)
    const mainStatBaseScore = (mainStatWeight / 100) * 70;
    // 副詞條貢獻的附加分 (滿分30)
    const subStatsBonusScore = (subStatsScore / 100) * 30;

    finalScore = Math.round(mainStatBaseScore + subStatsBonusScore);
  }
  // 策略B & C: 對於菱形、海膽、方形芯核，分數完全由副詞條決定。
  return { score: finalScore, details };
}

/**
 * [輔助函數 - 整體評價 - v4]
 * 根據分數給出整體評級。
 * @param {number} score
 * @returns {string} 評級
 */
function getRankFromScore(score) {
  if (score >= 95) return "**畢業級芯核**";
  if (score >= 85) return "**極品芯核，資源優先投入**";
  if (score >= 75) return "**優秀芯核，值得培養**";
  if (score >= 60) return "**中等偏上芯核，可過渡使用**";
  if (score >= 40) return "**尚可作為過渡使用的芯核**";
  return "**肥料**";
}

/**
 * [評語生成器 - v4]
 * 1. 將主詞條融入評語中。
 * 2.給出整體評價、亮點、缺陷、潛力。
 * @param {Array<Object>} details - 詳細分析陣列。
 * @param {number} score - 最終分數。
 * @param {Object} coreData - 完整的芯核資料。
 * @returns {string} - 評語。
 */
function generateCommentary(details, score, coreData) {
  const { type, mainStat, level } = coreData;
  let commentary = "";

  // Step 1: 根據芯核類型，添加特定的開頭說明
  if (type.includes("square")) {
    const mainStatLabel = CORE_META.mainStat.options[mainStat] || mainStat;
    commentary += `方形芯核主詞條【${mainStatLabel}】需自行判斷是否適用。\n`;
  }

  // Step 2: 生成核心評語 (邏輯與您版本基本相同)
  if (score < 40 && !type.includes("square")) {
    return commentary + "副詞條品質過低或詞條不符，不建議投資。";
  }

  const coreStats = details.filter((d) => d.weight >= 80).sort((a, b) => b.rollQuality - a.rollQuality);
  const uselessStats = details.filter((d) => d.weight === 0);

  // 評級
  commentary += `📊 整體評價：${getRankFromScore(score)}\n`;

  // 亮點
  if (coreStats.length > 0) {
    const bestStat = coreStats[0];
    const label = CORE_META.subStat[bestStat.key] || bestStat.key;
    commentary += `✨ 亮點：${label} (品質${bestStat.rollQuality})\n`;
  }

  // 缺陷
  if (uselessStats.length > 0) {
    const uselessLabels = uselessStats.map((s) => CORE_META.subStat[s.key] || s.key).join("、");
    commentary += `⚠️ 缺陷：${uselessLabels} 佔位\n`;
  }

  // 潛力
  if (level < 15) {
    const remainingUpgrades = Math.floor((15 - level) / 3);
    if (remainingUpgrades > 0) {
      commentary += `📈 潛力：還有 ${remainingUpgrades} 次強化機會。`;
    }
  } else {
    commentary += `✅ 已滿級，形態固定。`;
  }

  // Step 3: 為方形芯核添加特定的結尾
  if (type.includes("square")) {
    commentary += `\n**結論**：若主詞條適用，這是一顆**${getRankFromScore(score)}**`;
  }

  return commentary.trim();
}

/**
 * [主函數] 接收芯核數據，計算所有指標並回傳格式化後的結果。
 * @param {Object} coreData - { type, level, color, mainStat:{key}, subStats:[{key, value, upgradeCount}] }
 * @returns {Object} - { coreData, overall:{score, recommendSets}, crit:{score, commentary}, weak:{score, commentary} }
 */
export function calculateSQS(coreData) {
  const flows = ["暴擊流", "虛弱流"];
  const talents = ["攻擊天賦", "防禦天賦", "生命天賦"];

  const allResults = {};
  const allScores = [];

  // === Step 1: 計算所有6個組合的詳細數據 ===
  flows.forEach((flow) => {
    talents.forEach((talent) => {
      // console.log(flow, talent);
      const key = `${flow}_${talent}`;
      allResults[key] = getBuildDetails(flow, talent, coreData);
      allScores.push(allResults[key].score);
    });
  });

  // === Step 2: 找出「暴擊流」的最佳天賦組合 ===
  const critKeys = ["暴擊流_攻擊天賦", "暴擊流_防禦天賦", "暴擊流_生命天賦"];
  let bestCritResult = { score: -1, details: [], talent: "" };
  critKeys.forEach((key, index) => {
    if (allResults[key].score > bestCritResult.score) {
      bestCritResult = { ...allResults[key], talent: talents[index] };
    }
  });

  // === Step 3: 找出「虛弱流」的最佳天賦組合 ===
  const weakKeys = ["虛弱流_攻擊天賦", "虛弱流_防禦天賦", "虛弱流_生命天賦"];
  let bestWeakResult = { score: -1, details: [], talent: "" };
  weakKeys.forEach((key, index) => {
    if (allResults[key].score > bestWeakResult.score) {
      bestWeakResult = { ...allResults[key], talent: talents[index] };
    }
  });

  // === Step 4: 為流派生成評語 ===
  // 【v4 修改】調用 generateCommentary 時傳入完整的 coreData
  const critCommentary = generateCommentary(bestCritResult.details, bestCritResult.score, coreData);
  const weakCommentary = generateCommentary(bestWeakResult.details, bestWeakResult.score, coreData);

  // === Step 5: 確定總評級、推薦套裝 ===
  const overallBestScore = Math.max(...allScores);
  let bestOverallTalent = bestCritResult.score > bestWeakResult.score ? bestCritResult.talent : bestWeakResult.talent;
  const setRecommend = RECOMMEND_SETS[bestOverallTalent]?.[coreData.color] || "目前無適合套裝 (｡ŏ_ŏ)";

  // === Step 6: 計算主詞條最終數值 ===
  const mainStatKey = coreData.mainStat;
  const mainStatValue =
    VALUE_DATA.mainStatValue[mainStatKey].base + VALUE_DATA.mainStatValue[mainStatKey].perLevel * coreData.level;

  // === Step 7: 組裝並回傳最終結果 ===
  return {
    // 傳回原始數據以便顯示
    ...coreData,
    // 格式化主詞條數值
    mainStat: { key: mainStatKey, value: mainStatValue },
    // 總體評分，用於進度條
    overall: {
      score: overallBestScore,
      recommendSets: setRecommend,
    },
    // 暴擊流評分與評語
    crit: {
      score: bestCritResult.score,
      commentary: critCommentary,
    },
    // 虛弱流評分與評語
    weak: {
      score: bestWeakResult.score,
      commentary: weakCommentary,
    },
  };
}
