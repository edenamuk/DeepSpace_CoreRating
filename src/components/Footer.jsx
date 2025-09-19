/// src/components/Footer.js
// 頁腳 : 版權資訊 / 版本號
import React from "react";

export default function Footer() {
  return (
    <footer className="flex w-full sm:max-w-md md:max-w-lg lg:max-w-xl px-4 py-2 text-xs sm:text-sm text-base-content/70">
      <div className="flex-1"></div>
      <div className="text-center">© 2025 DeepSpace CoreRating System. All Rights Reserved.</div>
      <div className="flex-1 text-right">v1.1.1</div>
    </footer>
  );
}
