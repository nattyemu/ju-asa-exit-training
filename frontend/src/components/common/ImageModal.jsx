import { X } from "lucide-react";
import { useEffect } from "react";

export const ImageModal = ({ imageUrl, alt, isOpen, onClose }) => {
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose} // FIXED: Add onClick here to close when clicking anywhere
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-50 p-2 hover:bg-white/10 rounded-full transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Perfect circle container */}
      <div
        className="relative"
        onClick={(e) => e.stopPropagation()} // FIXED: Prevent click from bubbling to parent
      >
        {/* The circle */}
        <div className="relative rounded-full overflow-hidden w-80 h-80 md:w-96 md:h-96 lg:w-[500px] lg:h-[500px] shadow-2xl border-8 border-white/20">
          <img
            src={imageUrl}
            alt={alt || "Profile"}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentNode.className =
                "relative rounded-full overflow-hidden w-80 h-80 md:w-96 md:h-96 lg:w-[500px] lg:h-[500px] shadow-2xl border-8 border-white/20 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center";
              const span = document.createElement("span");
              span.className = "text-white text-6xl md:text-8xl font-bold";
              span.textContent = alt?.[0]?.toUpperCase() || "U";
              e.target.parentNode.appendChild(span);
            }}
          />
        </div>

        {/* Name */}
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
          <p className="text-white text-lg font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
            {alt}
          </p>
        </div>
      </div>

      {/* Click to close hint */}
      <div className="absolute bottom-8 text-white/50 text-sm">
        Click outside to close
      </div>
    </div>
  );
};
