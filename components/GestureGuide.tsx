import React, { useState } from 'react';

export const GestureGuide: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="fixed bottom-6 left-6 z-40">
            {/* Toggle Button */}
            {/* <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 font-bold flex items-center gap-2"
            >
                <span className="text-xl">✋</span>
                <span className="text-sm sm:text-base">{isExpanded ? 'Ẩn' : 'Hướng dẫn'}</span>
            </button> */}

            {/* Expanded Guide */}
            {isExpanded && (
                <div className="absolute bottom-16 left-0 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 w-80 border-2 border-purple-300 animate-slide-up">
                    <h3 className="text-xl font-bold text-purple-700 mb-4 flex items-center gap-2">
                        <span>✋</span> Điều khiển cử chỉ tay
                    </h3>

                    <div className="space-y-4">
                        {/* Basic Controls */}
                        <div className="border-b border-purple-200 pb-3">
                            <h4 className="font-semibold text-purple-600 mb-2 text-sm">🎄 Điều khiển cây:</h4>
                            <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">✋</span>
                                    <span><b>Bàn tay mở</b> (5 ngón) → Xả hình</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">✊</span>
                                    <span><b>Nắm tay lại</b> → Hình thành lại</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">👉</span>
                                    <span><b>Dơ ngón trỏ</b> → Di đến ảnh (nền vàng)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">🤟</span>
                                    <span><b>Kẹp ngón cái + trỏ</b> → Mở preview ảnh</span>
                                </div>
                            </div>
                        </div>

                        {/* Special Gestures */}
                        <div className="border-b border-purple-200 pb-3">
                            <h4 className="font-semibold text-purple-600 mb-2 text-sm">🎁 Mở khóa bí mật:</h4>
                            <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">👍</span>
                                    <span><b>Giơ ngón cái 5s</b> → Bí mật #1</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">✌️</span>
                                    <span><b>Dấu V (peace) 5s</b> → Bí mật #2</span>
                                </div>
                            </div>
                        </div>

                        {/* Media Navigation */}
                        <div>
                            <h4 className="font-semibold text-purple-600 mb-2 text-sm">📸 Trong modal xem ảnh:</h4>
                            <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">👆</span>
                                    <span><b>Vuốt ngang</b> → Chuyển ảnh/video</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🤟</span>
                                    <span><b>Kẹp giữa màn hình</b> → Đóng preview</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">↑</span>
                                    <span><b>Vuốt tay lên nhanh</b> → Đóng preview</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tip */}
                    <div className="mt-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-3">
                        <p className="text-xs text-purple-800">
                            <b>💡 Mẹo:</b> Giữ cử chỉ ổn định trong 5 giây để kích hoạt các tính năng đặc biệt!
                        </p>
                    </div>
                </div>
            )}

            {/* Custom CSS */}
            <style>{`
                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};
