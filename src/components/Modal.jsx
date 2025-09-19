import React from "react";
import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

export default function Modal({ title, children, onClose, closeOnEsc = true }) {
  useEffect(() => {
    if (!closeOnEsc) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeOnEsc, onClose]);

  return (
    <dialog open className="modal" onClick={onClose}>
      <div
        className="modal-box p-8"
        onClick={(e) => e.stopPropagation()} // 阻止冒泡，避免點內部觸發關閉
      >
        <div className="flex justify-between">
          {/* 標題 */}
          {title && <h2 className="font-bold text-2xl">{title}</h2>}
          {/* 右上角關閉叉叉 */}
          <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* 內容 */}
        <div className="py-4">{children}</div>
      </div>
    </dialog>
  );
}
