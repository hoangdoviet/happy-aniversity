/**
 * AdminPanel — local-only admin UI for configuring per-month media & music.
 * Auth: admin / nhiphoi00 (checked client-side, stored in sessionStorage).
 * Config: persisted in localStorage via anniversaryConfig utils.
 * Upload: each month has its own upload section (auto-assign on upload).
 */
import React, { useEffect, useRef, useState } from 'react';
import {
    getConfig,
    saveConfig,
    resetConfig,
    fetchConfig,
    loadAvailableMedia,
    AvailableMedia,
    defaultAnniversaryConfig,
} from '../utils/anniversaryConfig';
import { AnniversaryConfig, MonthConfig } from '../types';

const SESSION_KEY = 'admin_authed';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'nhiphoi00';

// ── Login ────────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (user === ADMIN_USER && pass === ADMIN_PASS) {
            sessionStorage.setItem(SESSION_KEY, '1');
            onLogin();
        } else {
            setError('Tên đăng nhập hoặc mật khẩu không đúng.');
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0010] flex items-center justify-center">
            <form
                onSubmit={handleSubmit}
                className="bg-[#120020] border border-pink-800/40 rounded-2xl p-8 w-full max-w-sm shadow-2xl"
            >
                <h1 className="text-2xl font-bold text-pink-300 mb-6 text-center">🔒 Admin Panel</h1>
                <label className="block mb-1 text-pink-200 text-sm">Tên đăng nhập</label>
                <input
                    className="w-full mb-4 px-3 py-2 rounded-lg bg-[#1c0030] border border-pink-700/30 text-white focus:outline-none focus:border-pink-500"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    autoComplete="username"
                />
                <label className="block mb-1 text-pink-200 text-sm">Mật khẩu</label>
                <input
                    type="password"
                    className="w-full mb-5 px-3 py-2 rounded-lg bg-[#1c0030] border border-pink-700/30 text-white focus:outline-none focus:border-pink-500"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    autoComplete="current-password"
                />
                {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
                <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold hover:opacity-90 transition"
                >
                    Đăng nhập
                </button>
            </form>
        </div>
    );
}

// ── Upload helpers ────────────────────────────────────────────────────────────

type MediaType = 'photo' | 'video' | 'music';

async function uploadFile(file: File, type: MediaType): Promise<string> {
    const res = await fetch(
        `/api/local-upload?type=${type}&filename=${encodeURIComponent(file.name)}`,
        { method: 'POST', body: file },
    );
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(
            res.status === 404
                ? 'Endpoint không tìm thấy — hãy chạy npm run dev'
                : `HTTP ${res.status}: ${text.slice(0, 120)}`,
        );
    }
    const data = await res.json();
    if (!data.success) throw new Error(data.error ?? 'Upload thất bại');
    return data.filename as string;
}

async function deleteFile(filename: string, type: MediaType): Promise<void> {
    const res = await fetch(
        `/api/local-upload?type=${type}&filename=${encodeURIComponent(filename)}`,
        { method: 'DELETE' },
    );
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
            res.status === 404
                ? 'Endpoint không tìm thấy — hãy chạy npm run dev'
                : (data as any).error ?? `HTTP ${res.status}`,
        );
    }
}

// ── MonthMediaSection ─────────────────────────────────────────────────────────
// Per-month media manager: upload directly → auto-assign to this month.
// Shows only files assigned to this month; "Add from library" for existing pool files.

interface MonthMediaSectionProps {
    label: string;
    icon: string;
    mediaType: 'photo' | 'video';
    accept: string;
    assigned: string[];       // filenames assigned to this month
    available: string[];      // all filenames in the pool
    onAssignedChange: (next: string[]) => void;
    onRefresh: () => Promise<void>;
}

const MonthMediaSection: React.FC<MonthMediaSectionProps> = ({
    label, icon, mediaType, accept,
    assigned, available, onAssignedChange, onRefresh,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadMsg, setUploadMsg] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [showLibrary, setShowLibrary] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    const urlFor = (f: string) =>
        mediaType === 'photo' ? `/photos/${f}` : `/videos/${f}`;

    // Upload and auto-assign to this month
    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        setUploadMsg('');
        const errors: string[] = [];
        const newFilenames: string[] = [];
        for (const file of Array.from(files)) {
            try {
                setUploadMsg(`Đang tải lên ${file.name}…`);
                const filename = await uploadFile(file, mediaType);
                newFilenames.push(filename);
            } catch (e: any) {
                errors.push(`${file.name}: ${e.message}`);
            }
        }
        await onRefresh();
        if (newFilenames.length > 0) {
            const updated = [...assigned];
            for (const f of newFilenames) {
                if (!updated.includes(f)) updated.push(f);
            }
            onAssignedChange(updated);
        }
        setUploading(false);
        setUploadMsg(errors.length
            ? `Lỗi: ${errors.join(' | ')}`
            : `✔ Đã tải lên ${newFilenames.length} file!`);
        setTimeout(() => setUploadMsg(''), 4000);
    };

    // Remove from this month (unassign — does NOT delete from disk)
    const handleUnassign = (f: string) => {
        onAssignedChange(assigned.filter((x) => x !== f));
    };

    // Delete from disk and unassign
    const handleDelete = async (f: string) => {
        if (!confirm(`Xóa "${f}" khỏi ổ đĩa? Tất cả tháng dùng file này sẽ mất liên kết.`)) return;
        setDeleting(f);
        try {
            await deleteFile(f, mediaType);
            onAssignedChange(assigned.filter((x) => x !== f));
            await onRefresh();
        } catch (e: any) {
            alert(`Xóa thất bại: ${e.message}`);
        }
        setDeleting(null);
    };

    const libraryFiles = available.filter((f) => !assigned.includes(f));

    return (
        <div className="rounded-xl border border-pink-800/30 bg-[#0f0018] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#120020] border-b border-pink-800/20">
                <span className="text-sm font-semibold text-pink-200">{icon} {label}</span>
                <span className="text-xs text-pink-500 bg-pink-900/30 px-2 py-0.5 rounded-full">
                    {assigned.length} file
                </span>
            </div>

            <div className="p-4 space-y-4">
                {/* Upload zone */}
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                    className={`rounded-xl border-2 border-dashed p-4 text-center transition cursor-pointer select-none
                        ${dragOver
                            ? 'border-pink-400 bg-pink-400/10'
                            : 'border-pink-800/40 hover:border-pink-600/50 hover:bg-pink-900/10'}`}
                    onClick={() => !uploading && inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept={accept}
                        multiple
                        className="hidden"
                        onChange={(e) => handleFiles(e.target.files)}
                        onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                    />
                    {uploading ? (
                        <p className="text-pink-400 text-sm animate-pulse">{uploadMsg}</p>
                    ) : uploadMsg ? (
                        <p className={`text-sm ${uploadMsg.startsWith('Lỗi') ? 'text-red-400' : 'text-green-400'}`}>
                            {uploadMsg}
                        </p>
                    ) : (
                        <div>
                            <p className="text-2xl mb-1">⬆️</p>
                            <p className="text-pink-300 text-sm font-medium">Kéo thả hoặc nhấn để tải lên</p>
                            <p className="text-pink-600 text-xs mt-0.5">File tải lên sẽ tự động gán vào tháng này</p>
                        </div>
                    )}
                </div>

                {/* Assigned files grid */}
                {assigned.length > 0 && (
                    <div className={`grid gap-1.5 ${mediaType === 'photo' ? 'grid-cols-4 sm:grid-cols-5' : 'grid-cols-3'}`}>
                        {assigned.map((f) => (
                            <div
                                key={f}
                                className="relative group rounded-lg overflow-hidden border border-pink-700/30 bg-[#1c0030]"
                            >
                                {mediaType === 'photo' ? (
                                    <img
                                        src={urlFor(f)}
                                        alt={f}
                                        className="w-full aspect-square object-cover"
                                        loading="lazy"
                                    />
                                ) : (
                                    <video
                                        src={urlFor(f)}
                                        muted
                                        playsInline
                                        preload="metadata"
                                        className="w-full aspect-video object-cover bg-black"
                                        onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
                                        onMouseLeave={(e) => {
                                            const v = e.currentTarget as HTMLVideoElement;
                                            v.pause();
                                            v.currentTime = 0;
                                        }}
                                    />
                                )}
                                {/* Hover actions */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/55 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleUnassign(f); }}
                                        title="Bỏ khỏi tháng này (không xóa file)"
                                        className="w-8 h-8 rounded-full bg-amber-600/90 flex items-center justify-center text-white text-sm hover:bg-amber-500 transition"
                                    >
                                        ↩
                                    </button>
                                    <button
                                        type="button"
                                        disabled={deleting === f}
                                        onClick={(e) => { e.stopPropagation(); handleDelete(f); }}
                                        title="Xóa file khỏi ổ đĩa"
                                        className="w-8 h-8 rounded-full bg-red-700/90 flex items-center justify-center text-white text-xs hover:bg-red-600 disabled:opacity-40 transition"
                                    >
                                        {deleting === f ? '…' : '🗑'}
                                    </button>
                                </div>
                                <p className="absolute bottom-0 left-0 right-0 text-[9px] text-pink-300/60 truncate bg-black/70 px-1 py-0.5 text-center">
                                    {f}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {assigned.length === 0 && !uploading && (
                    <p className="text-pink-700 text-xs italic text-center py-1">
                        Chưa có file nào. Tải lên bên trên hoặc thêm từ thư viện.
                    </p>
                )}

                {/* Add from library */}
                {libraryFiles.length > 0 && (
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowLibrary((p) => !p)}
                            className="w-full text-xs text-pink-500 hover:text-pink-300 flex items-center gap-1 justify-center py-1.5 border border-pink-900/40 rounded-lg hover:border-pink-700/40 transition"
                        >
                            {showLibrary ? '▲' : '▼'} Thêm từ thư viện ({libraryFiles.length} file có sẵn)
                        </button>
                        {showLibrary && (
                            <div className={`mt-2 grid gap-1 ${mediaType === 'photo' ? 'grid-cols-5' : 'grid-cols-3'}`}>
                                {libraryFiles.map((f) => (
                                    <div
                                        key={f}
                                        onClick={() => {
                                            if (!assigned.includes(f)) onAssignedChange([...assigned, f]);
                                        }}
                                        title="Nhấn để thêm vào tháng này"
                                        className="relative group rounded-lg overflow-hidden border-2 border-pink-900/30 hover:border-pink-500/60 cursor-pointer transition"
                                    >
                                        {mediaType === 'photo' ? (
                                            <img
                                                src={`/photos/${f}`}
                                                alt={f}
                                                className="w-full aspect-square object-cover opacity-60 group-hover:opacity-100 transition"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <video
                                                src={`/videos/${f}`}
                                                muted
                                                playsInline
                                                preload="metadata"
                                                className="w-full aspect-video object-cover bg-black opacity-60 group-hover:opacity-100 transition"
                                            />
                                        )}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/30">
                                            <span className="text-xl">➕</span>
                                        </div>
                                        <p className="absolute bottom-0 left-0 right-0 text-[9px] text-pink-300/50 truncate bg-black/70 px-1 py-0.5 text-center">
                                            {f}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ── MusicManager ──────────────────────────────────────────────────────────────

interface MusicManagerProps {
    available: string[];
    selected: string | null;
    onSelectedChange: (val: string | null) => void;
    onRefresh: () => Promise<void>;
}

const MusicManager: React.FC<MusicManagerProps> = ({ available, selected, onSelectedChange, onRefresh }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadMsg, setUploadMsg] = useState('');
    const [deleting, setDeleting] = useState(false);

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        try {
            const filename = await uploadFile(files[0], 'music');
            await onRefresh();
            onSelectedChange(filename);
            setUploadMsg('✔ Tải lên thành công!');
        } catch (e: any) {
            setUploadMsg(`Lỗi: ${e.message}`);
        }
        setUploading(false);
        setTimeout(() => setUploadMsg(''), 4000);
    };

    const handleDelete = async () => {
        if (!selected || !confirm(`Xóa file nhạc "${selected}" khỏi ổ đĩa?`)) return;
        setDeleting(true);
        try {
            await deleteFile(selected, 'music');
            onSelectedChange(null);
            await onRefresh();
        } catch (e: any) {
            alert(`Xóa thất bại: ${e.message}`);
        }
        setDeleting(false);
    };

    return (
        <div className="rounded-xl border border-pink-800/30 bg-[#0f0018] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-[#120020] border-b border-pink-800/20">
                <span className="text-sm font-semibold text-pink-200">🎵 Nhạc nền</span>
                {selected && <span className="text-xs text-green-400 truncate max-w-[140px]">▶ {selected}</span>}
            </div>
            <div className="p-4 space-y-3">
                <div className="flex gap-2">
                    <select
                        className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-[#1c0030] border border-pink-700/30 text-white text-sm focus:outline-none focus:border-pink-500"
                        value={selected ?? ''}
                        onChange={(e) => onSelectedChange(e.target.value || null)}
                    >
                        <option value="">— Không có nhạc —</option>
                        {available.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <button
                        type="button"
                        disabled={uploading}
                        onClick={() => inputRef.current?.click()}
                        className="shrink-0 px-3 py-2 rounded-lg text-xs font-semibold bg-pink-600/20 border border-pink-500/40 text-pink-300 hover:bg-pink-600/40 disabled:opacity-40 transition"
                    >
                        {uploading ? '⏳' : '⬆️'}
                    </button>
                    {selected && (
                        <button
                            type="button"
                            disabled={deleting}
                            onClick={handleDelete}
                            className="shrink-0 px-3 py-2 rounded-lg text-xs bg-red-900/20 border border-red-700/30 text-red-400 hover:bg-red-900/40 disabled:opacity-40 transition"
                        >
                            {deleting ? '…' : '×'}
                        </button>
                    )}
                    <input
                        ref={inputRef}
                        type="file"
                        accept="audio/*,.mp3,.m4a,.aac,.wav,.flac"
                        className="hidden"
                        onChange={(e) => handleUpload(e.target.files)}
                        onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                    />
                </div>

                {uploadMsg && (
                    <p className={`text-xs ${uploadMsg.startsWith('Lỗi') ? 'text-red-400' : 'text-green-400'}`}>
                        {uploadMsg}
                    </p>
                )}

                {available.length > 0 && (
                    <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                        {available.map((f) => (
                            <div
                                key={f}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition
                                    ${selected === f
                                        ? 'border-pink-500 bg-pink-500/15'
                                        : 'border-pink-900/30 hover:border-pink-700/40'}`}
                            >
                                <button
                                    type="button"
                                    onClick={() => onSelectedChange(selected === f ? null : f)}
                                    className="flex-1 text-left text-xs text-pink-300 hover:text-pink-100 truncate"
                                >
                                    {selected === f ? '✔ ' : '🎵 '}{f}
                                </button>
                                <audio
                                    src={`/music/${f}`}
                                    controls
                                    preload="none"
                                    className="h-6 w-24 opacity-80 hover:opacity-100 transition"
                                    style={{ filter: 'invert(0.8) hue-rotate(280deg)' }}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ── MonthEditor ───────────────────────────────────────────────────────────────

interface MonthEditorProps {
    monthCfg: MonthConfig;
    available: AvailableMedia;
    onChange: (updated: MonthConfig) => void;
    onRefresh: () => Promise<void>;
}

const MonthEditor: React.FC<MonthEditorProps> = ({ monthCfg, available, onChange, onRefresh }) => {
    const update = <K extends keyof MonthConfig>(key: K, val: MonthConfig[K]) =>
        onChange({ ...monthCfg, [key]: val });

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-pink-200 text-sm mb-1">Tiêu đề tháng</label>
                    <input
                        className="w-full px-3 py-2 rounded-lg bg-[#1c0030] border border-pink-700/30 text-white text-sm focus:outline-none focus:border-pink-500"
                        value={monthCfg.title}
                        onChange={(e) => update('title', e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-pink-200 text-sm mb-1">Mô tả</label>
                    <textarea
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg bg-[#1c0030] border border-pink-700/30 text-white text-sm resize-none focus:outline-none focus:border-pink-500"
                        value={monthCfg.description}
                        onChange={(e) => update('description', e.target.value)}
                    />
                </div>
            </div>

            <MusicManager
                available={available.music}
                selected={monthCfg.music}
                onSelectedChange={(v) => update('music', v)}
                onRefresh={onRefresh}
            />

            <MonthMediaSection
                label="Ảnh"
                icon="🖼️"
                mediaType="photo"
                accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp,.heic,.heif"
                assigned={monthCfg.photos}
                available={available.photos}
                onAssignedChange={(v) => update('photos', v)}
                onRefresh={onRefresh}
            />

            <MonthMediaSection
                label="Video"
                icon="🎬"
                mediaType="video"
                accept="video/*,.mp4,.mov,.webm,.avi,.mkv,.m4v"
                assigned={monthCfg.videos}
                available={available.videos}
                onAssignedChange={(v) => update('videos', v)}
                onRefresh={onRefresh}
            />
        </div>
    );
};

// ── HeartEditor ───────────────────────────────────────────────────────────────

interface HeartEditorProps {
    config: AnniversaryConfig;
    available: AvailableMedia;
    onChange: (updated: AnniversaryConfig) => void;
    onRefresh: () => Promise<void>;
}

const HeartEditor: React.FC<HeartEditorProps> = ({ config, available, onChange, onRefresh }) => (
    <div className="space-y-5">
        {/* Info note — auto-aggregate */}
        <div className="flex gap-3 p-4 rounded-xl border border-pink-700/30 bg-pink-900/10">
            <span className="text-xl shrink-0">💡</span>
            <div>
                <p className="text-pink-200 text-sm font-semibold mb-1">
                    Ảnh &amp; video tự động từ cả 12 tháng
                </p>
                <p className="text-pink-400/70 text-xs leading-relaxed">
                    Màn hình trái tim sẽ hiển thị <strong>toàn bộ ảnh và video</strong> đã upload
                    cho tất cả 12 tháng — không cần cấu hình riêng.
                    Chỉ cần chọn nhạc nền bên dưới.
                </p>
            </div>
        </div>

        <MusicManager
            available={available.music}
            selected={config.heartMusic}
            onSelectedChange={(v) => onChange({ ...config, heartMusic: v })}
            onRefresh={onRefresh}
        />
    </div>
);

// ── GlobalEditor ──────────────────────────────────────────────────────────────

const GlobalEditor: React.FC<{
    config: AnniversaryConfig;
    available: AvailableMedia;
}> = ({ config, available }) => (
    <div className="space-y-5 max-w-md">
        <div>
            <label className="block text-pink-200 text-sm mb-1">Tên đôi</label>
            <input
                className="w-full px-3 py-2 rounded-lg bg-[#1c0030] border border-pink-700/30 text-white text-sm opacity-60 cursor-not-allowed"
                value={config.coupleNames}
                disabled
                readOnly
            />
            <p className="text-pink-600/60 text-xs mt-1">
                Sửa trong <code>utils/anniversaryConfig.ts</code>
            </p>
        </div>

        <div className="p-4 bg-[#1c0030] rounded-xl border border-pink-800/30 space-y-3">
            <h3 className="text-pink-200 font-semibold text-sm">📊 Thư viện media</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
                {[
                    { label: 'Ảnh', count: available.photos.length, icon: '🖼️' },
                    { label: 'Video', count: available.videos.length, icon: '🎬' },
                    { label: 'Nhạc', count: available.music.length, icon: '🎵' },
                ].map((item) => (
                    <div key={item.label} className="bg-[#120020] rounded-lg p-3">
                        <div className="text-2xl">{item.icon}</div>
                        <div className="text-xl font-bold text-pink-300">{item.count}</div>
                        <div className="text-xs text-pink-500">{item.label}</div>
                    </div>
                ))}
            </div>
            <p className="text-pink-600/50 text-xs">
                /public/photos · /public/videos · /public/music
            </p>
        </div>

        <div className="p-4 bg-amber-900/20 rounded-xl border border-amber-700/30">
            <p className="text-amber-300 text-xs font-semibold mb-1">⚠️ Lưu ý</p>
            <p className="text-amber-200/70 text-xs leading-relaxed">
                Upload chỉ hoạt động khi chạy <code>npm run dev</code>.
                Sau khi thay đổi, nhấn <strong>"Lưu"</strong> ở góc trên phải.
            </p>
        </div>
    </div>
);

// ── Main AdminPanel ─────────────────────────────────────────────────────────

type TabId = number | 'heart' | 'global';

export const AdminPanel: React.FC = () => {
    const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
    const [config, setConfig] = useState<AnniversaryConfig>(defaultAnniversaryConfig);
    const [configLoading, setConfigLoading] = useState(true);
    const [available, setAvailable] = useState<AvailableMedia>({ photos: [], videos: [], music: [] });
    const [activeTab, setActiveTab] = useState<TabId>('global');
    const [saved, setSaved] = useState(false);

    const refreshAvailable = async () => {
        const media = await loadAvailableMedia();
        setAvailable(media);
    };

    useEffect(() => {
        if (!authed) return;
        // Fetch from /config.json so admin always sees the server's latest config
        setConfigLoading(true);
        fetchConfig()
            .then(setConfig)
            .finally(() => setConfigLoading(false));
        refreshAvailable();
    }, [authed]);

    if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

    const handleSave = () => {
        saveConfig(config);  // writes localStorage + POSTs to /api/save-config
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const handleReset = () => {
        if (!confirm('Đặt lại toàn bộ cấu hình về mặc định?')) return;
        resetConfig();
        setConfig(defaultAnniversaryConfig());
    };

    const updateMonth = (updated: MonthConfig) => {
        setConfig((prev) => ({
            ...prev,
            months: prev.months.map((m) => (m.month === updated.month ? updated : m)),
        }));
    };

    const sidebarItems: { id: TabId; label: string; badge?: string }[] = [
        { id: 'global', label: '🌐 Tổng quan' },
        ...Array.from({ length: 12 }, (_, i) => {
            const m = config.months[i];
            const count = (m?.photos?.length ?? 0) + (m?.videos?.length ?? 0);
            return {
                id: (i + 1) as number,
                label: `📅 Tháng ${i + 1}`,
                badge: count > 0 ? `${count}` : undefined,
            };
        }),
        { id: 'heart', label: '❤️ Trái Tim' },
    ];

    return (
        // h-screen + overflow-hidden: ensures the layout is exactly viewport height and inner panels scroll
        <div className="h-screen bg-[#0a0010] text-white flex flex-col overflow-hidden">
            {/* ── Loading overlay while config fetches ── */}
            {configLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0010]/80">
                    <p className="text-pink-300 animate-pulse text-sm">Đang tải cấu hình…</p>
                </div>
            )}
            {/* ── Sticky header ── */}
            <header className="shrink-0 bg-[#120020] border-b border-pink-800/30 px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="text-base font-bold text-pink-300 truncate">💖 Admin — Kỷ niệm 1 năm</h1>
                    <p className="text-xs text-pink-500/50 hidden sm:block">Upload từng tháng • Lưu cấu hình</p>
                </div>
                <div className="flex gap-2 items-center shrink-0">
                    <a href="/" className="text-pink-400 text-xs hover:text-pink-200 transition hidden sm:inline underline">
                        ← Trang chính
                    </a>
                    <button
                        onClick={handleReset}
                        className="px-3 py-1.5 text-xs rounded-lg border border-red-700/50 text-red-400 hover:bg-red-900/20 transition"
                    >
                        Reset
                    </button>
                    <button
                        onClick={handleSave}
                        className={`px-4 py-1.5 rounded-lg font-bold text-sm transition
                            ${saved
                                ? 'bg-green-600 text-white'
                                : 'bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:opacity-90'
                            }`}
                    >
                        {saved ? '✔ Đã lưu!' : 'Lưu'}
                    </button>
                </div>
            </header>

            {/* ── Body ── */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* Sidebar */}
                <nav className="w-44 shrink-0 bg-[#0f0018] border-r border-pink-800/20 flex flex-col py-3 gap-0.5 px-2 overflow-y-auto">
                    {sidebarItems.map((item) => (
                        <button
                            key={String(item.id)}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition flex items-center justify-between gap-1
                                ${activeTab === item.id
                                    ? 'bg-pink-600/30 text-pink-200 border border-pink-600/40'
                                    : 'text-pink-500/70 hover:text-pink-300 hover:bg-pink-900/20'
                                }`}
                        >
                            <span className="truncate">{item.label}</span>
                            {item.badge && (
                                <span className="text-[10px] bg-pink-800/50 text-pink-400 px-1.5 py-0.5 rounded-full shrink-0">
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Main content — scrollable */}
                <main className="flex-1 overflow-y-auto p-5">
                    {activeTab === 'global' && (
                        <>
                            <h2 className="text-base font-bold text-pink-300 mb-4">🌐 Tổng quan</h2>
                            <GlobalEditor config={config} available={available} />
                        </>
                    )}

                    {typeof activeTab === 'number' && (
                        <>
                            <h2 className="text-base font-bold text-pink-300 mb-4">
                                📅 Tháng {activeTab}
                            </h2>
                            <MonthEditor
                                monthCfg={config.months.find((m) => m.month === activeTab)!}
                                available={available}
                                onChange={updateMonth}
                                onRefresh={refreshAvailable}
                            />
                        </>
                    )}

                    {activeTab === 'heart' && (
                        <>
                            <h2 className="text-base font-bold text-pink-300 mb-4">❤️ Màn hình Trái Tim</h2>
                            <HeartEditor
                                config={config}
                                available={available}
                                onChange={setConfig}
                                onRefresh={refreshAvailable}
                            />
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};
