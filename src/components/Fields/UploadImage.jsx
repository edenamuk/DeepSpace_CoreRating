// src/components/Fields/UploadImage.jsx
import { useRef, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImages, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { faCircleCheck } from "@fortawesome/free-regular-svg-icons";

// TODO:
// - 1. 接入Gemini AI 辨識
// - 2. AI辨識結果填入數值

export default function UploadImage({ showToast, apiKey, onRecognitionSuccess }) {
  const fileInputRef = useRef(null); // 隱藏的 input，用來觸發選檔
  const [isDragging, setIsDragging] = useState(false); // 拖曳時的狀態 (控制邊框樣式)
  const [preview, setPreview] = useState(null); // 圖片預覽 URL
  const [isAnalyzing, setIsAnalyzing] = useState(false); // 是否正在 AI 分析
  const [error, setError] = useState(null);

  // 將 Buffer 轉為 Gemini 要求的格式
  async function fileToGenerativePart(file) {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  }

  // 🔹 點擊上傳區時，觸發 input 選檔
  const handleClick = () => {
    fileInputRef.current.click();
  };

  // 🔹 拖曳進區域時 (加強 UI 提示)
  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  // 🔹 拖曳離開區域時
  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // 🔹 放開檔案 (完成拖曳上傳)
  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      setError(null);
      handleFileSelect(event.dataTransfer.files[0]);
      event.dataTransfer.clearData();
    }
  };

  // 🔹 選擇檔案後的處理
  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      setError(null);
      handleFileSelect(event.target.files[0]);
    }
  };

  // 🔹 核心流程：處理檔案上傳 + 預覽 + Gemini 分析
  const handleFileSelect = async (file) => {
    // 檢查 API Key 是否存在
    if (!apiKey) {
      showToast?.(
        "error",
        "請先在設定中輸入您的 Gemini API Key。",
        2000,
        <FontAwesomeIcon icon={faTriangleExclamation} />
      );
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("檔案格式錯誤，請上傳圖片檔案 ( jpg / png / webp... )");
      return;
    }
    // 建立圖片預覽
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    setError(null); // 清除舊的錯誤訊息
    setIsAnalyzing(true);

    try {
      // 1. 初始化 Gemini AI
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      // 2. 準備 Prompt 和圖片
      const prompt = `You are a highly intelligent game data extraction assistant. Your task is to analyze a screenshot of a game's gear piece, called a "Core", and extract its attributes into a single, minified JSON object.

Follow these rules STRICTLY:
1.  **Output Format**: Your response MUST be a single, minified JSON object. Do not include json markdown, explanations, or any other text.
2.  **Level**: Extract the enhancement level, which is prefixed by a '+' sign. Return only the numeric digits that follow. For example, if the image shows "+15", the value should be the string "15".
3.  **Color**: Determine the color from the first two characters of the Core's name (e.g., "綠琪" -> "green").
4.  **Type**: Determine the type from the suffix in the Core's name (e.g., "β" -> "beta") or its visual shape ("方形" -> "square").
5.  **Stats Identification**:
    - The first stat listed ("加速回能" in the example) is the 'mainStat'. Its value is a string.
    - The stats below the first one are the 'subStats'.
6.  **subStats Array**:
    - Each object in the 'subStats' array must have three keys: 'key', 'value', and 'upgradeCount'.
    - 'value' must be a number. If the original value is a percentage (e.g., "11.3%"), convert it to a number (e.g., 11.3).
    - 'upgradeCount' is the small circled number (e.g., ①, ②) next to the stat's value. If there is no such number, 'upgradeCount' is 0.

**Chinese to Key Mapping (MUST FOLLOW):**
You MUST use this table to map the Chinese stat names to the correct English 'key'. If a stat is not in this table, use your best judgment to create a logical key.
- "攻擊": "atk"
- "攻擊加成": "atkBoost"
- "防禦": "def"
- "防禦加成": "defBoost"
- "生命": "hp"
- "生命加成": "hpBoost"
- "暴擊": "critRate"
- "暴傷": "critDmg"
- "加速回能": "energyBoost"
- "誓約回能": "oathBoost"
- "誓約增傷": "oathDmg"
- "虛弱增傷": "weakDmg"

**Type to Key Mapping (MUST FOLLOW):**
- "α": "diamond"
- "β": "square"
- "γ": "uni"
- "δ": "triangle"

**Example based on the provided image:**
Analyze the image and produce a JSON object exactly like this example structure, filled with the correct data from the image.

**Example of how to process the user's image:**
- Name: "綠琪芯核．β" -> color is "green", type is "square".
- Level: "+0" -> level is "0".
- Main Stat: "加速回能 +6.0%" -> mainStat is "energyBoost".
- Sub Stat 1: "防禦 +41" -> {"key": "def", "value": 41, "upgradeCount": 0}.
- Sub Stat 2: "攻擊加成 +11.3% ①" -> {"key": "atk_pct", "value": 11.3, "upgradeCount": 1}.

Now, analyze the image provided by the user and generate the final JSON output.`;
      const imagePart = await fileToGenerativePart(file);

      // 3. 發送請求
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;

      // --- 新增：檢查 Gemini 的安全過濾回饋 ---
      if (response.promptFeedback?.blockReason) {
        // 如果請求因為安全因素被阻擋，拋出一個自訂錯誤
        throw new Error(`請求被 Gemini 安全機制阻擋，原因：${response.promptFeedback.blockReason}`);
      }
      const text = response.text();
      let analysisResult;
      
      // --- 新增：對 JSON 解析進行獨立的錯誤捕捉 ---
      try {
        const cleanedText = text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        analysisResult = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error("JSON Parsing Error:", parseError, "Raw text:", text);
        // 如果 AI 回傳的不是有效的 JSON，拋出一個更具體的錯誤
        throw new Error("AI 回應格式錯誤，無法解析資料。");
      }

      // 4. 成功後回傳結果
      setIsAnalyzing(false);
      onRecognitionSuccess?.(analysisResult);
      showToast?.("success", "圖片辨識成功！", 2500, <FontAwesomeIcon icon={faCircleCheck} />);
      console.log("Analysis Result:", analysisResult);
    } catch (err) {
      // --- 優化：細緻化的錯誤處理 ---
      console.error("Gemini API Error:", err);
      setIsAnalyzing(false);
      setPreview(null);

      let userErrorMessage = `辨識失敗：${err.message}`; // 預設錯誤訊息

      const errorMessage = err.message || "";

      if (errorMessage.includes("API key not valid")) {
        userErrorMessage = "API 金鑰無效，請在設定中檢查您的金鑰。";
      } else if (errorMessage.includes("quota")) {
        userErrorMessage = "API 金鑰額度已用盡，請檢查您的 Google AI Studio 帳戶。";
      } else if (errorMessage.includes("請求被 Gemini 安全機制阻擋")) {
        userErrorMessage = "圖片或請求內容疑似違反政策，已被阻擋。";
      } else if (errorMessage.includes("AI 回應格式錯誤")) {
        userErrorMessage = "AI 回應格式錯誤，請稍後再試或更換圖片。";
      } else if (err instanceof TypeError && errorMessage.includes("fetch")) {
        userErrorMessage = "網路連線失敗，請檢查您的網路並再試一次。";
      }

      setError(userErrorMessage); // 顯示對使用者更友善的錯誤訊息
    }
  };

  return (
    <div className="w-full">
      {/* 🔹 上傳區塊 (包含拖曳 & 點擊功能) */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center w-full h-48 
                    border-dashed border-2 rounded-box transition-colors cursor-pointer
                    ${
                      isDragging
                        ? "border-primary bg-base-200"
                        : "border-base-300 hover:border-primary hover:bg-base-200"
                    }`}
      >
        {/* 隱藏 input，用來觸發檔案選擇 */}
        <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

        {/* 如果還沒選檔 → 顯示 icon + 提示文字 */}
        {!preview ? (
          <>
            <FontAwesomeIcon icon={faImages} className="text-3xl sm:text-5xl mb-2 sm:mb-4 text-base-content/70" />
            <div className="text-xs sm:text-sm text-base-content/70">
              {isDragging ? "放開上傳圖片" : "點擊或拖曳上傳芯核截圖"}
            </div>
          </>
        ) : (
          // 如果已有檔案 → 顯示圖片預覽
          <img src={preview} alt="preview" className="max-h-full max-w-full object-contain" />
        )}

        {/* AI 分析中 → Skeleton 動畫 */}
        {isAnalyzing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="skeleton h-full w-full"></div>
          </div>
        )}
      </div>

      {/* 🔹 下方狀態顯示區 */}
      <div className="mt-2">
        {/* AI 分析提示訊息 */}
        {error && (
          <div className="alert alert-error alert-soft rounded-field p-2 sm:px-4">
            <FontAwesomeIcon icon={faTriangleExclamation} className="scale-100 sm:scale-150" />
            <p className="text-xs sm:text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
