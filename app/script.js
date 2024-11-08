const os = require('os');
const fs = require('fs');
const path = require('path');
const { exec, execSync, spawn } = require('child_process');
let lasttimeGot = "";
if (!fs.existsSync(`${path.dirname(process.execPath)}/user_config.json`)) fs.copyFileSync(`${path.dirname(process.execPath)}/user_config.json.org`, `${path.dirname(process.execPath)}/user_config.json`)
const settings = JSON.parse(fs.readFileSync(`${path.dirname(process.execPath)}/user_config.json`, "utf-8"));
let viewers = {};
_(() => {
    _(document.body).ccm({})
    if (os.platform() == "win32") {
        _(".titlebar").addClass("btr");
    }
    const checklist = ["adb", "scrcpy"];
    for (const command of checklist) {
        if (!checkCommandSync(command)) {
            alert(`關鍵組件缺失：${command.toUpperCase()}未安裝或未正確設定Path！`);
            window.close();
        }
    }

    _("#mod_key")[0].value = settings.args.mod_key;
    _("#no_audio")[0].checked = settings.args.no_audio;
    _("#no_control")[0].checked = settings.args.no_control;
    _("#stay_awake")[0].checked = settings.args.stay_awake;
    _("#turn_screen_off")[0].checked = settings.args.turn_screen_off;
    _("#uhid")[0].checked = settings.args.uhid;
    _("#other")[0].value = settings.args.other;

    _(`.settings .setting input[type="text"]`).bind("change", (e) => {
        settings.args[e.target.id] = _(e.target).val();
        fs.writeFile(`${path.dirname(process.execPath)}/user_config.json`, JSON.stringify(settings, null, 4), "utf-8", () => { });
    })

    _(`.settings .setting input[type="checkbox"]`).bind("change", (e) => {
        settings.args[e.target.id] = _(e.target)[0].checked;
        fs.writeFile(`${path.dirname(process.execPath)}/user_config.json`, JSON.stringify(settings, null, 4), "utf-8", () => { });
    })

    _(".close").bind("click", (e) => {
        window.close();
    })

    _(".hotkeys").bind("click", (e) => {
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
        const ip = prompt("輸入 IP:端口(英文冒號)");
        exec(`adb connect ${ip}`, (error, stdout, stderr) => {
            console.log(stdout);
            updateDevicesList();
            const _item = _(`.control .connect[data-id="${ip}"]`);
            if(_item.length === 1) {
                _item.trigger("click");
            }else{
                alert("連接失敗！");
            }
        });
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

    setInterval(() => {
        updateDevicesList();
    }, 1000)
})

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
        const stdout = execSync("adb devices");
        let adbStr = stdout.toString().trim();
        if (adbStr == lasttimeGot) {
            return false;
        }
        lasttimeGot = adbStr;
        let devices = adbStr.matchAll(/^(.+?)\t(device|offline|unauthorized|no permissions)$/gm);
        let re = [];
        for (const device of devices) {
            console.log(`已獲取設備：`, device);
            re.push({ id: device[1], status: device[2] });
        }
        return re;
    } catch (error) {
        console.error(`獲取設備時出錯: ${error}`);
    }
}

function updateDevicesList() {
    const devices = getDevicesFromAdb();
    if (devices === false) return;
    const mainListFav = _(document.querySelector(".main .list .fav"));
    const mainListOther = _(document.querySelector(".main .list .other"));
    const statusStr = { device: "已連接", offline: "離線", unauthorized: "未授權", "no permissions": "沒有權限" }
    const statusDesStr = { device: "設備已連接並給於授權，你可以正常查看這個設備", offline: "設備曾連接並記憶，但此刻處於離線狀態，不可查看", unauthorized: "設備等待手機端授權，請在手機上操作", "no permissions": "你無權連接這個設備" }
    mainListFav.empty();
    mainListOther.empty();
    for (const device of devices) {
        const alias = settings.alias[device.id] || device.id;
        if(alias != device.id) {
            mainListFav.append(`<div class="device">
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
                    <div class="disconnect" data-id="${device.id}" onclick="disconnect(this)" title="斷開連接">
                        <svg width="16" height="16" version="1.1" xmlns="http://www.w3.org/2000/svg">
                            <use href="#icon-disconnect"></use>
                        </svg>
                    </div>
                </div>
            </div>`);
        }else {
            mainListOther.append(`<div class="device">
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
                        <div class="disconnect" data-id="${device.id}" onclick="disconnect(this)" title="斷開連接">
                            <svg width="16" height="16" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                <use href="#icon-disconnect"></use>
                            </svg>
                        </div>
                    </div>
                </div>`);
        }
    }
}

function view(th) {
    const deviceId = _(th).attr("data-id");
    if (_(th).hasClass("on")) {
        viewers[deviceId].kill();
        delete viewers[deviceId];
    } else {
        _(th).addClass("on");
        let args = [];
        if (settings.args.mod_key) args.push(`--shortcut-mod=${settings.args.mod_key}`);
        if (settings.args.no_audio) args.push(`--no-audio`);
        if (settings.args.no_control) args.push(`-n`);
        if (settings.args.turn_screen_off) args.push(`-S`);
        if (settings.args.uhid) args.push(`-K`);
        if (settings.args.stay_awake) args.push(`-w`);
        if (settings.args.other) args.push(...settings.args.other.split(" ").filter(Boolean));
        const scrcpy = viewers[deviceId] = spawn("scrcpy", ["-s", deviceId, ...args]);
        scrcpy.on("error", (msg) => {
            console.log(msg);
        })
        scrcpy.on("close", () => {
            _(th).removeClass("on");
        })
    }
}

function setAlias(th) {
    const deviceId = _(th).attr("data-id");
    let alias = prompt("輸入別名", _(".t1", _(th).parent(2)).text());
    if (alias === "") {
        delete settings.alias[deviceId];
        fs.writeFile(`${path.dirname(process.execPath)}/user_config.json`, JSON.stringify(settings, null, 4), "utf-8", () => { });
        lasttimeGot = "";
        updateDevicesList();
    } else if (alias !== null) {
        settings.alias[deviceId] = alias;
        fs.writeFile(`${path.dirname(process.execPath)}/user_config.json`, JSON.stringify(settings, null, 4), "utf-8", () => { });
        lasttimeGot = "";
        updateDevicesList();
    }
}

function disconnect(th) {
    const deviceId = _(th).attr("data-id");
    if(confirm("確定斷開此連接嗎？\n如果你斷開的是USB連接，重新拔插即可恢復。\n如果你端開的是無線連接，則需要重新使用IP手動連接。")){
        execSync(`adb disconnect ${deviceId}`);
    }
}