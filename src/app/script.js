const os = require('os');
const fs = require('fs');
const path = require('path');
const Bonjour = require('bonjour-service').default;
const bonjourInstance = new Bonjour();
const ImageBlurProcessor = require('./ImageBlurProcessor.js');
const { exec, execSync, spawn } = require('child_process');
const { stderr } = require('process');

const rootDir = path.dirname(process.execPath);
const win = nw.Window.get();
const Tray = new nw.Tray({ title: 'Scrcpy啟動器', icon: 'app/tray.png' });
const menu = new nw.Menu();
const userHome = os.homedir();
const configDir = `${userHome}/.config/scrcpy_launcher`;
menu.append(new nw.MenuItem({
    label: "分隔線",
    type: 'separator'
}));
menu.append(new nw.MenuItem({
    id: 998,
    label: "顯示視窗",
    click: () => {
        win.show();
    }
}));
menu.append(new nw.MenuItem({
    id: 999,
    label: "退出",
    click: () => {
        nw.App.quit();
    }
}));
Tray.menu = menu;

const execOptions = {
    env: {
        ...process.env, // 繼承當前 Node.js 進程的環境變數
        LANG: 'en_US.UTF-8', // 主要的語言設定
        LC_ALL: 'en_US.UTF-8', // 覆寫所有地區設定為英文
        LANGUAGE: 'en_US:en' // 備選語言列表 (GNU gettext)
    },
    encoding: 'utf-8'
};

const adb = fs.existsSync(`${path.dirname(process.execPath)}/adb`) ? `${path.dirname(process.execPath)}/adb/adb` : "adb";
const scrcpy = fs.existsSync(`${path.dirname(process.execPath)}/scrcpy`) ? `${path.dirname(process.execPath)}/scrcpy/scrcpy` : "scrcpy";

let lasttimeGot = "";
let wallpaperPath;

let settings = {
    args: {
        //控制鍵
        "shortcut-mod": {
            enabled: true,
            value: "lalt"
        },
        // 音訊
        "no-audio": {
            enabled: false,
            value: null
        },
        "audio-source": {
            enabled: false,
            value: "output"
        },
        "audio-codec": {
            enabled: false,
            value: "opus"
        },
        "audio-bit-rate": {
            enabled: false,
            value: "128K"
        },
        "audio-buffer": {
            enabled: false,
            value: 50
        },
        "audio-output-buffer": {
            enabled: false,
            value: 5
        },
        // 視訊
        "no-video": {
            enabled: false,
            value: null
        },
        "video-source": {
            enabled: false,
            value: "display"
        },
        "max-size": {
            enabled: false,
            value: 1024
        },
        "video-bit-rate": {
            enabled: false,
            value: "8M"
        },
        "max-fps": {
            enabled: false,
            value: 60
        },
        "video-codec": {
            enabled: true,
            value: "av1"
        },
        "display-orientation": {
            enabled: false,
            value: 0
        },
        "record-orientation": {
            enabled: false,
            value: 0
        },
        "angle": {
            enabled: false,
            value: 0
        },
        "crop": {
            enabled: false,
            value: ""
        },
        "display-id": {
            enabled: false,
            value: 1
        },
        "video-buffer": {
            enabled: false,
            value: 50
        },
        "v4l2-sink": {
            enabled: false,
            value: ""
        },
        "v4l2-buffer": {
            enabled: false,
            value: 300
        },
        // 窗口
        "no-control": {
            enabled: false,
            value: null
        },
        "no-window": {
            enabled: false,
            value: null
        },
        "window-width": {
            enabled: false,
            value: 1080
        },
        "window-height": {
            enabled: false,
            value: 2424
        },
        "window-borderless": {
            enabled: false,
            value: null
        },
        "always-on-top": {
            enabled: false,
            value: null
        },
        "fullscreen": {
            enabled: false,
            value: null
        },
        // 設備
        "stay-awake": {
            enabled: true,
            value: null
        },
        "screen-off-timeout": {
            enabled: false,
            value: "300"
        },
        "turn-screen-off": {
            enabled: true,
            value: null
        },
        "show-touches": {
            enabled: false,
            value: null
        },
        "disable-screensaver": {
            enabled: true,
            value: null
        },
        "power-off-on-close": {
            enabled: false,
            value: null
        },
        "no-power-on": {
            enabled: false,
            value: null
        },
        // 輸入
        "gamepad": {
            enabled: false,
            value: "disabled"
        },
        "keyboard": {
            enabled: true,
            value: "uhid"
        },
        "mouse": {
            enabled: false,
            value: "sdk"
        },
        "no-mouse-hover": {
            enabled: false,
            value: null
        },
        "mouse-bind": {
            enabled: false,
            value: ""
        }
    },
    system: {
        "min-start": {
            enabled: false,
            value: null
        },
        "true-close": {
            enabled: false,
            value: null
        }
    },
    alias: {}
};
if (fs.existsSync(`${configDir}/user_config.json`)) {
    settings = JSON.parse(fs.readFileSync(`${configDir}/user_config.json`, "utf-8"));
} else {
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFile(`${configDir}/user_config.json`, JSON.stringify(settings, null, 4), "utf-8", () => { });
}
const viewers = {};

nw.App.on("open", () => {
    win.show();
})

_(() => {
    _(document.body).ccm({})
    if (os.platform() == "win32") {
        _(".titlebar").addClass("btr");
    }
    const checklist = [adb, scrcpy];
    for (const command of checklist) {
        if (!checkCommandSync(command)) {
            alert(`關鍵組件缺失：${command.toUpperCase()}未安裝或未正確設定Path！`);
            window.close();
        }
    }

    if (settings.system["min-start"].enabled) win.hide();

    for (const key in settings.args) {
        const setting = settings.args[key];
        const settingEnable = _(`[type="checkbox"][data-group="args"][data-key="${key}"]`);
        const settingValue = _(`[type="text"][data-group="args"][data-key="${key}"]`);
        const settingSelection = _(`[type="text"][data-group="args"][data-key="${key}"]+.selection`);
        if (settingEnable.length > 0) {
            settingEnable.each((index, item) => {
                item.checked = setting.enabled;
            })
        }
        if (settingValue.length > 0) {
            settingValue.each((index, item) => {
                item.value = setting.value;
            })
        }
        if (settingSelection.length > 0) {
            settingSelection.each((index, item) => {
                const display = _(".display", item);
                const valueText = _(`span[value="${settingValue[index].value}"]`, item).text();
                display.text(valueText);
            })
        }
    }

    for (const key in settings.system) {
        const setting = settings.system[key];
        const settingEnable = _(`[type="checkbox"][data-group="system"][data-key="${key}"]`);
        const settingValue = _(`[type="text"][data-group="system"][data-key="${key}"]`);
        const settingSelection = _(`[type="text"][data-group="system"][data-key="${key}"]+.selection`);
        if (settingEnable.length > 0) {
            settingEnable.each((index, item) => {
                item.checked = setting.enabled;
            })
        }
        if (settingValue.length > 0) {
            settingValue.each((index, item) => {
                item.value = setting.value;
            })
        }
        if (settingSelection.length > 0) {
            settingSelection.each((index, item) => {
                const display = _(".display", item);
                const valueText = _(`span[value="${settingValue[index].value}"]`, item).text();
                display.text(valueText);
            })
        }
    }

    _(`.settings .setting input[type="checkbox"]`).bind("change", (e) => {
        const group = _(e.target).attr("data-group");
        const key = _(e.target).attr("data-key");
        const val = _(e.target)[0].checked;
        settings[group][key].enabled = val;
        fs.writeFile(`${configDir}/user_config.json`, JSON.stringify(settings, null, 4), "utf-8", () => { });
        _(`[type="checkbox"][data-group="${group}"][data-key="${key}"]`).each((i, item) => {
            item.checked = val;
        })
    })

    _(`.settings .setting input[type="text"]`).bind("change", (e) => {
        const group = _(e.target).attr("data-group");
        const key = _(e.target).attr("data-key");
        const val = _(e.target).val();
        settings[group][key].value = val;
        fs.writeFile(`${configDir}/user_config.json`, JSON.stringify(settings, null, 4), "utf-8", () => { });
        _(`[type="text"][data-group="${group}"][data-key="${key}"]`).each((i, item) => {
            item.value = val;
        })
        _(`[type="text"][data-group="${group}"][data-key="${key}"]+.selection`).each((i, item) => {
            const display = _(".display", item);
            const valueText = _(`span[value="${val}"]`, item).text();
            display.text(valueText);
        })
    })


    _(".close").bind("click", () => {
        if (settings.system["true-close"].enabled) {
            win.close();
        } else {
            win.hide();
        }
    })

    _(".hotkeys").bind("click", () => {
        if (_(".shortcuts").hasClass("show")) {
            _(".shortcuts").removeClass("show");
        } else {
            _(".shortcuts").addClass("show");
        }
    })

    _.bind("keyup", (e) => {
        if (e.code == "Escape") {
            if (_(".shortcuts").hasClass("show")) {
                _(".shortcuts").removeClass("show");
            }
        }
    })

    _("#connect_by_ip").bind("click", () => {
        const ipInput = prompt("輸入 IP:端口(英文冒號)");
        const ip = ipInput.split(":")[0];
        const connectPort = ipInput.split(":")[1];
        connect(ip, connectPort);
    })

    const keyMap = { "AltLeft": "lalt", "AltRight": "ralt", "ControlLeft": "lctrl", "ControlRight": "rctrl", "MetaLeft": "lsuper", "MetaRight": "rsuper" };
    let downKeyCount = 0;
    let modkeys = [];

    _("#mod_key").bind("keydown", (e) => {
        modkeys = [];
        if (Object.keys(keyMap).includes(e.code)) {
            modkeys.push(keyMap[e.code]);
            e.target.value = modkeys.join(" + ");
        } else {
            e.target.value = "";
        }
        downKeyCount++;
    })
    _("#mod_key").bind("keyup", (e) => {
        downKeyCount--;
        downKeyCount = Math.max(downKeyCount, 0);
        e.target.value = modkeys.join(" + ");
        _(e.target).trigger("change")
    })

    _(".selection .display").bind("click", (e) => {
        const selection = _(e.target).parent();
        const optionsNum = _("span", selection).length + 1;
        selection.css(`height:${optionsNum * 30}px;z-index:999999;`);
        _(".holder", selection).trigger("focus");
    })
    _(".selection .holder").bind("blur", (e) => {
        const selection = _(e.target).parent();
        selection.css(`height:30px;z-index:auto;`);
    })

    _(".selection>span").bind("mousedown", (e) => {
        const selection = _(e.target).parent();
        _(`input[type="text"]`, selection.parent()).val(_(e.target).attr("value"));
        _(`.display`, selection).text(_(e.target).text());
        _(`input[type="text"]`, selection.parent()).trigger("change");
    })

    _(".settings_group_list .settings_group_title").bind("click", (e) => {
        const currentIndex = _(".settings_group_title.selected").attr("data-index");
        const newIndex = _(e.target).attr("data-index");
        if (currentIndex == newIndex) return;
        _(".settings_group_title.selected").removeClass("selected");
        _(".settings_group.show").removeClass("show");
        _(e.target).addClass("selected");
        _(`.settings_group[data-index="${newIndex}"]`).addClass("show");
    })

    _("#mouse-bind-help").bind("click", () => {
        nw.Shell.openExternal("https://github.com/Genymobile/scrcpy/blob/master/doc/mouse.md#mouse-bindings");
    })

    watchDeviceFromLocalNetwork();
    updateDevicesList();
    updateWallpaper();
    const currentScreen = getCurrentWindowScreen();
    _(document.body).css(`background-position: -${win.x}px -${win.y}px;background-size: ${currentScreen.bounds.width}px ${currentScreen.bounds.height}px`);
    setInterval(() => {
        updateDevicesList();
    }, 1000)
})

win.on("move", (x, y) => {
    _(document.body).css(`background-position: -${x}px -${y}px;`);
})

// 確保在應用退出時清理
window.addEventListener('beforeunload', () => {
    console.log('應用即將退出，停止所有 mDNS 瀏覽器...');
    browsers.forEach(browser => browser.stop());
    bonjourInstance.destroy();
    Tray.remove();
});

function checkCommandSync(command) {
    try {
        const stdout = execSync(`which ${command}`);
        console.log(`命令 ${command} 存在於: ${stdout.toString().trim()}`);
        return true;
    } catch (error) {
        console.error(`檢查命令是否存在時出錯: ${error}`);
        // 這裡可以處理錯誤，例如記錄錯誤或拋出異常
        return false;
    }
}

function getDevicesFromAdb() {
    try {
        const stdout = execSync(`${adb} devices`);
        let adbStr = stdout.toString().trim();
        if (adbStr == lasttimeGot) {
            return false;
        }
        lasttimeGot = adbStr;
        let devices = adbStr.matchAll(/^(.+?)\t(device|offline|unauthorized|no permissions)$/gm);
        let re = [];
        for (const device of devices) {
            console.log(`已獲取設備：`, device);
            const brand = execSync(`${adb} -s ${device[1]} shell getprop ro.product.brand`, execOptions);
            const model = execSync(`${adb} -s ${device[1]} shell getprop ro.product.model`, execOptions);
            let deviceName = execSync(`${adb} -s ${device[1]} shell settings get global device_name`, execOptions);
            if (!deviceName || deviceName == "null") {
                deviceName = execSync(`${adb} -s ${device[1]} shell settings get system bluetooth_name`, execOptions);
                if (!deviceName || deviceName == "null") deviceName = null;
            }
            re.push({ id: device[1], status: device[2], brand: brand.toLowerCase(), model: model, deviceName: deviceName });
        }
        return re;
    } catch (error) {
        console.error(`獲取設備時出錯: ${error}`);
    }
}

function watchDeviceFromLocalNetwork() {
    const serviceTypesToFind = [
        { type: 'adb-tls-connect', protocol: 'tcp', description: 'ADB Connect Service' }  // 用於連接
    ];

    const browsers = [];

    serviceTypesToFind.forEach(serviceIdentifier => {
        const browser = bonjourInstance.find({ type: serviceIdentifier.type, protocol: serviceIdentifier.protocol });
        const mainListOther = _(document.querySelector(".main .list .other"));

        browser.on('up', (service) => {
            // 提取連接所需信息
            // 通常，你會從 service.addresses 中獲取 IPv4 地址
            const ipv4Address = service.addresses.find(addr => addr.includes('.') && !addr.includes(':')); // 簡單的 IPv4 判斷

            if (ipv4Address && service.port) {
                const alias = settings.alias[service.name] || service.name;
                mainListOther.append(`<div class="device" id="${ipv4Address}:${service.port}">
                <div class="info">
                    <div class="alias"><span class="t1">${alias}</span>&nbsp;<span class="status" title="未連接">未連接</span></div>
                    <div class="realname" title="${ipv4Address}:${service.port}">${ipv4Address}:${service.port}</div>
                </div>
                <div class="control">
                    <div class="connect Swait" data-id="${ipv4Address}:${service.port}" onclick="connect('${ipv4Address}', ${service.port})" title="連接">
                        <svg width="16" height="16" version="1.1" xmlns="http://www.w3.org/2000/svg">
                            <use href="#icon-connect"></use>
                        </svg>
                    </div>
                    <div class="addAlias" data-id="${ipv4Address}:${service.port}" onclick="setAlias(this)" title="編輯別名">
                        <svg width="16" height="16" version="1.1" xmlns="http://www.w3.org/2000/svg">
                            <use href="#icon-edit"></use>
                        </svg>
                    </div>
                </div>
            </div>`);
                hiddenConnectedFromOthers();
            }
        });

        browser.on('down', (service) => {
            const ipv4Address = service.addresses.find(addr => addr.includes('.') && !addr.includes(':')); // 簡單的 IPv4 判斷
            _(`.device[id="${ipv4Address}:${service.port}"]`).remove();
        });

        browsers.push(browser);
    });
}

function updateDevicesList() {
    const devices = getDevicesFromAdb();
    if (devices === false) return;
    const mainListFav = _(document.querySelector(".main .list .fav"));
    const mainListConnected = _(document.querySelector(".main .list .connected"));
    const statusStr = { device: "已連接", offline: "離線", unauthorized: "未授權", "no permissions": "沒有權限" }
    const statusDesStr = { device: "設備已連接並給於授權，你可以正常查看這個設備", offline: "設備曾連接並記憶，但此刻處於離線狀態，不可查看", unauthorized: "設備等待手機端授權，請在手機上操作", "no permissions": "你無權連接這個設備" }
    mainListFav.empty();
    mainListConnected.empty();
    // 移除所有菜单项
    for (const itemIndex in menu.items) {
        const item = menu.items[itemIndex];
        if (item.label != "顯示視窗" && item.label != "退出" && item.type != "separator") {
            menu.remove(item);
        }
    }
    for (const device of devices) {
        const alias = settings.alias[device.id] || device.deviceName || device.model || device.id;
        if (settings.alias[device.id]) {
            mainListFav.append(`<div class="device hidden">
                <div class="brand">
                    <img src="brands/${device.brand}.png" onerror="this.onerror=null; this.src='brands/other.png'">
                    <div class="model">${device.model}</div>
                </div>
                <div class="info">
                    <div class="alias"><span class="t1">${alias}</span>&nbsp;<span class="status" title="${statusDesStr[device.status]}">${statusStr[device.status]}</span></div>
                    <div class="realname" title="${device.id}">${device.id}</div>
                </div>
                <div class="control">
                    <div class="connect S${device.status}" data-id="${device.id}" onclick="view(this)" title="查看">
                        <svg width="16" height="16" version="1.1" xmlns="http://www.w3.org/2000/svg">
                            <use href="#icon-view"></use>
                        </svg>
                    </div>
                    <div class="addAlias" data-id="${device.id}" onclick="setAlias(this)" title="編輯別名">
                        <svg width="16" height="16" version="1.1" xmlns="http://www.w3.org/2000/svg">
                            <use href="#icon-edit"></use>
                        </svg>
                    </div>
                    <div class="disconnect S${device.status}" data-id="${device.id}" onclick="disconnect(this)" title="斷開連接">
                        <svg width="16" height="16" version="1.1" xmlns="http://www.w3.org/2000/svg">
                            <use href="#icon-disconnect"></use>
                        </svg>
                    </div>
                </div>
            </div>`);
        } else {
            mainListConnected.append(`<div class="device hidden">
                <div class="brand">
                    <img src="brands/${device.brand}.png" onerror="this.onerror=null; this.src='brands/other.png'">
                    <div class="model">${device.model}</div>
                </div>
                <div class="info">
                        <div class="alias"><span class="t1">${alias}</span>&nbsp;<span class="status" title="${statusDesStr[device.status]}">${statusStr[device.status]}</span></div>
                        <div class="realname" title="${device.id}">${device.id}</div>
                    </div>
                    <div class="control">
                        <div class="connect S${device.status}" data-id="${device.id}" onclick="view(this)" title="查看">
                        <svg width="16" height="16" version="1.1" xmlns="http://www.w3.org/2000/svg">
                        <use href="#icon-view"></use>
                        </svg>
                        </div>
                        <div class="addAlias" data-id="${device.id}" onclick="setAlias(this)" title="編輯別名">
                        <svg width="16" height="16" version="1.1" xmlns="http://www.w3.org/2000/svg">
                        <use href="#icon-edit"></use>
                        </svg>
                        </div>
                        <div class="disconnect S${device.status}" data-id="${device.id}" onclick="disconnect(this)" title="斷開連接">
                        <svg width="16" height="16" version="1.1" xmlns="http://www.w3.org/2000/svg">
                        <use href="#icon-disconnect"></use>
                        </svg>
                        </div>
                        </div>
                        </div>`);
        }
        menu.insert(new nw.MenuItem({
            label: alias, click: () => {
                _(`.control .connect[data-id="${device.id}"]`).trigger("click");
            }
        }), 0);

        // 已連接的設備從探測列表隱藏
        hiddenConnectedFromOthers();
    }
    _(".fav .device, .connected .device").removeClass("hidden");
    Tray.menu = menu;
    if (_(".device", mainListFav).length == 0) {
        mainListFav.css("display: none");
    } else {
        mainListFav.css("display: block");
    }
}

function hiddenConnectedFromOthers() {
    _(`.device.hidden`).removeClass("hidden");
    _(".connected .device, .fav .device").each((index, item) => {
        const itemID = _(".info .realname", item).text();
        _(`.device[id="${itemID}"]`).addClass("hidden");
    })
}

function view(th) {
    const deviceId = _(th).attr("data-id");
    const alias = _(".info .alias .t1", _(th).parent(2)).text();
    if (_(th).hasClass("on")) {
        viewers[deviceId].kill();
        delete viewers[deviceId];
    } else {
        _(th).addClass("on");
        let args = [];
        for (const key in settings.args) {
            const prop = settings.args[key];
            if (prop.enabled || key === "shortcut-mod") {
                if (prop.value === null) {
                    args.push(`--${key}`);
                } else {
                    args.push(`--${key}=${prop.value}`);
                }
            }
        }
        const scrcpyWindow = viewers[deviceId] = spawn(scrcpy, ["-s", deviceId, `--window-title=${alias}`, ...args]);
        scrcpyWindow.on("error", (msg) => {
            console.log(msg);
        })
        scrcpyWindow.on("close", () => {
            _(th).removeClass("on");
        })
    }
}

function setAlias(th) {
    const deviceId = _(th).attr("data-id");
    let alias = prompt("輸入別名", _(".t1", _(th).parent(2)).text());
    if (alias === "") {
        delete settings.alias[deviceId];
        fs.writeFile(`${configDir}/user_config.json`, JSON.stringify(settings, null, 4), "utf-8", () => { });
        lasttimeGot = "";
        updateDevicesList();
    } else if (alias !== null) {
        settings.alias[deviceId] = alias;
        fs.writeFile(`${configDir}/user_config.json`, JSON.stringify(settings, null, 4), "utf-8", () => { });
        lasttimeGot = "";
        updateDevicesList();
    }
}

function disconnect(th) {
    const deviceId = _(th).attr("data-id");
    if (confirm("確定斷開此連接嗎？\n如果你斷開的是USB連接，重新拔插即可恢復。\n如果你端開的是無線連接，則需要重新使用IP手動連接。")) {
        execSync(`${adb} disconnect ${deviceId}`);
        updateDevicesList();
        hiddenConnectedFromOthers();
    }
}

function isObject(obj) {
    return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}

function updateWallpaper() {
    getWallpaper().then(path => {
        if (path != wallpaperPath) {
            const currentScreen = getCurrentWindowScreen();
            blurImage(path, 30, [currentScreen.bounds.width, currentScreen.bounds.height]).then((img) => {
                img.toFile(rootDir + "/app/tmp/wallpaper.webp").then(() => {
                    _(document.body).css(`background-image: url(tmp/wallpaper.webp?t=${Date.now()});`);
                    setTimeout(() => {
                        updateWallpaper();
                    }, 100)
                });
            })
            wallpaperPath = path;
        } else {
            setTimeout(() => {
                updateWallpaper();
            }, 100)
        }
    })
}
async function blurImage(inputPath, blurRadius, targetSize) {
    const processor = new ImageBlurProcessor(inputPath, targetSize, 0.25, true);
    return processor.blurImage(blurRadius);
}
function getCurrentWindowScreen() {
    const winX = win.x;
    const winY = win.y;

    let currentScreen = null;

    nw.Screen.screens.forEach(function (screen) {
        const bounds = screen.bounds;
        if (
            winX >= bounds.x &&
            winX < bounds.x + bounds.width &&
            winY >= bounds.y &&
            winY < bounds.y + bounds.height
        ) {
            currentScreen = screen;
        }
    });
    return currentScreen;
}

function connect(ip, port) {
    const stdOut = execSync(`${adb} connect ${ip}:${port}`, execOptions);
    if (stdOut.trim() === `failed to connect to ${ip}:${port}`) {
        const pairPort = prompt("需要配對，請輸入配對用端口號");
        const pairCode = prompt("請輸入配對碼");
        exec(`${adb} pair ${ip}:${pairPort} ${pairCode}`, execOptions, (error, stdout) => {
            if (stdout.match(/^Successfully\spaired\sto\s.+/)) {
                exec(`${adb} connect ${ip}:${port}`, execOptions, (error, stdout) => {
                    if (stdout.match(/^failed\sto\sconnect\sto\s.+/)) {
                        alert("連接失敗！");
                    } else {
                        updateDevicesList();
                        const _item = _(`.control .connect[data-id="${ip}"]`);
                        _item.trigger("click");
                    }
                })
            } else {
                alert("配對失敗！");
            }
        })
    } else {
        updateDevicesList();
        const _item = _(`.control .connect[data-id="${ip}"]`);
        _item.trigger("click");
    }
}