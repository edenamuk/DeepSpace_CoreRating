// exportFile.js
import { toPng } from "html-to-image";
import CORE_META from "../data/coreMeta.json";

const FIELD_MAP = {
  type: "芯核類型",
  level: "芯核等級",
  color: "星譜顏色",
  mainStat_key: "主詞條",
  mainStat_value: "主詞條數值",
  overall_score: "總分",
  crit_score: "暴擊流分數",
  crit_commentary: "暴擊流評語",
  weak_score: "虛弱流分數",
  weak_commentary: "虛弱流評語",
};

function translateField(type, key, val) {
  if (type === "key") {
    // 👉 翻譯欄位名稱
    if (FIELD_MAP[key]) return FIELD_MAP[key];
    if (key.includes("subStats") && key.endsWith("_key")) return "副詞條";
    if (key.includes("subStats") && key.endsWith("_value")) return "副詞條數值";
    if (key.includes("subStats") && key.endsWith("_upgradeCount")) return "副詞條強化次數";
    if (key.includes("recommendSets") && key.endsWith("_character")) return "推薦搭檔角色";
    if (key.includes("recommendSets") && key.endsWith("_set")) return "推薦搭檔套裝";
    if (key.includes("recommendSets") && key.endsWith("_talent")) return "推薦搭檔天賦";
    return key; // 沒對應就保持原樣
  }

  if (type === "value") {
    // 👉 翻譯資料內容
    if (key === "type") {
      return CORE_META.type[val]?.[`${val}_f`] || val;
    }
    if (key === "color") {
      return CORE_META.color[val]?.[`${val}_f`] || val;
    }
    if (key.includes("subStats") && key.endsWith("_key")) {
      return CORE_META.subStat[val] || val;
    }
    if (key.includes("mainStat") && key.endsWith("_key")) {
      return CORE_META.mainStat.options[val] || val;
    }
    return val;
  }
}

/**
 * 匯出 PNG
 * @param {React.RefObject} ref - 要截圖的元素 ref
 * @param {string} fileName - 檔名，不含副檔名
 */
export async function exportAsPng(ref, fileName = "screenshot") {
  if (!ref.current) return;

  try {
    // 取得當前日期
    const now = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const fullName = `CoreRating_${fileName}_${now}.png`;

    const dataUrl = await toPng(ref.current, {
      backgroundColor: null,
      filter: (node) => !node.classList?.contains("no-export"), // 忽略有 no-export class 的元素
    });

    const link = document.createElement("a");
    link.download = fullName;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error("Export PNG failed:", err);
  }
}

/**
 * 匯出 CSV
 * @param {Array|Object} data - 資料陣列或物件
 * @param {string} fileName - 檔名，不含副檔名
 */
export function exportAsCsv(data, fileName = "results") {
  const rows = Array.isArray(data) ? data : [data];

  // ===== Step 1: 扁平化 =====
  const flatten = (obj, prefix = "") =>
    Object.keys(obj).reduce((acc, key) => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}_${key}` : key;

      if (newKey === "overall_score") {
      return acc; // 直接跳過，不輸出
    }

      if (Array.isArray(value)) {
        value.forEach((v, i) => {
          if (typeof v === "object") {
            Object.assign(acc, flatten(v, `${newKey}${i + 1}`));
          } else {
            acc[`${newKey}${i + 1}`] = v;
          }
        });
      } else if (value && typeof value === "object") {
        Object.assign(acc, flatten(value, newKey));
      } else {
        acc[newKey] = value;
      }
      return acc;
    }, {});

  const flatRows = rows.map((r) => flatten(r));
  const headers = Object.keys(flatRows[0]);

  // === Step 2: 用 translateField 處理標題列 ===
  const translatedHeaders = headers.map((h) => translateField("key", h, null));

  // === Step 3: 組 CSV ===
  const csvRows = [];
  csvRows.push(translatedHeaders.join(",")); // 標題列

  for (const row of flatRows) {
    const values = headers.map((h) => {
      let val = row[h];
      val = translateField("value", h, val);

      if (val == null) return "";
      if (typeof val === "string" && /[",\n]/.test(val)) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvRows.push(values.join(","));
  }

  // === Step 4: 下載檔案 ===
  const csvString = csvRows.join("\n");
  const now = new Date().toISOString().slice(0, 10);
  const fullName = `CoreRating_${fileName}_${now}.csv`;
  const link = document.createElement("a");
  link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csvString);
  link.download = fullName;
  link.click();
}
