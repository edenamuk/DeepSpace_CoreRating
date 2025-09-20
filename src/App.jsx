import React, { useState, useRef, useEffect } from "react";
import InputCard from "./components/InputCard";
import ResultCard from "./components/ResultCard";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { calculateSQS } from "./components/utils/calculateSQS";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-regular-svg-icons";

export default function App() {
  const [showResult, setShowResult] = useState(false); // 狀態：是顯示輸入畫面還是結果畫面
  const [coreData, setCoreData] = useState(null); // 儲存使用者輸入的芯核資料
  const [toast, setToast] = useState({ show: false, type: "success", message: "", icon: null });
  const mainRef = useRef(null);
  const [apiKey, setApiKey] = useState("");

  // App 載入時，嘗試從 localStorage 讀取已儲存的 key
  useEffect(() => {
    const savedKey = localStorage.getItem("gemini_api_key");
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  // 當 apiKey 變動時，將它儲存到 localStorage
  const handleApiKeyChange = (key) => {
    const trimmedKey = key.trim(); // 去除前後空白
    setApiKey(trimmedKey);
    localStorage.setItem("gemini_api_key", trimmedKey);
    showToast("success", "API Key 已儲存！", 2000, <FontAwesomeIcon icon={faCircleCheck} />);
  };


  // 顯示浮動提示
  const showToast = (type, message, duration = 2000, icon = null) => {
    setToast({ show: true, type, message, icon });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), duration);
  };

  // 「評分」
  const handleScore = (formData) => {
    const result = calculateSQS(formData);
    setCoreData(result); // 儲存輸入資料
    setShowResult(true); // 翻頁 → 顯示結果
  };

  // 「再次評分」
  const handleReset = () => {
    setShowResult(false); // 翻回 → 顯示輸入卡片
    setCoreData(null);
  };

  return (
    // 外層容器：垂直水平置中、最小高度填滿螢幕、響應式左右內距
    <div className="flex flex-col items-center justify-center px-2 sm:px-4 md:px-6 min-h-screen bg-base-200 transition-colors cursor-default">
      {/* 上方導覽列 (左上切換 / 右上齒輪&問號) */}
      <Navbar apiKey={apiKey} onApiKeyChange={handleApiKeyChange}/>

      {/* 卡片容器：最大寬度隨螢幕變化、內距、陰影、圓角 */}
      <main ref={mainRef} className="card w-full sm:max-w-md md:max-w-lg lg:max-w-xl bg-base-100 transition-colors">
        {!showResult ? (
          <InputCard onScore={handleScore} showToast={showToast} apiKey={apiKey} />
        ) : (
          <ResultCard data={coreData} onReset={handleReset} showToast={showToast} targetRef={mainRef} />
        )}

        {/* 🔹 Toast 統一渲染區 */}
        {toast.show && (
          <div className="toast toast-top toast-center z-50 pointer-events-none">
            <div className={`alert alert-${toast.type}`}>
              {toast.icon && <div className="scale-150">{toast.icon}</div>}
              <span className="text-base">{toast.message}</span>
            </div>
          </div>
        )}
      </main>

      {/* 頁尾版權資訊 */}
      <Footer />
    </div>
  );
}
