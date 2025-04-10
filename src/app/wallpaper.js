async function getWallpaper() {
    const platform = os.platform();
    let wallpaperPath = '';

    try {
        switch (platform) {
            case 'win32':
                wallpaperPath = await getWallpaperWindows();
                break;
            case 'linux':
                wallpaperPath = await getWallpaperLinux();
                break;
            case 'darwin':
                wallpaperPath = await getWallpaperMac();
                break;
            default:
                console.error('Unsupported platform:', platform);
                return null;
        }
    } catch (error) {
        console.error('Error getting wallpaper:', error);
        return null;
    }

    return wallpaperPath;
}

function getWallpaperWindows() {
    return new Promise((resolve, reject) => {
        const command = `powershell.exe -command "(Get-ItemProperty 'HKCU:\\Control Panel\\Desktop' -Name WallPaper).WallPaper"`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout.trim());
        });
    });
}

function getWallpaperMac() {
    return new Promise((resolve, reject) => {
        const command = `osascript -e 'tell application "Finder" to get POSIX path of (desktop picture as alias)'`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout.trim());
        });
    });
}

function getWallpaperLinux() {
    return new Promise((resolve, reject) => {
        // Try GNOME first
        exec('gsettings get org.gnome.desktop.background picture-uri', (error, stdout, stderr) => {
            if (!error) {
                // The output might be 'file:///path/to/wallpaper.jpg'
                resolve(stdout.trim().replace(/^'|'$/g, '').replace('file://', ''));
                return;
            }

            // If GNOME fails, try KDE
            exec('qdbus org.kde.plasmashell /org/kde/Get বিশ্বাসঘাতDesktopBackground', (error, stdout, stderr) => {
                if (!error) {
                    resolve(stdout.trim());
                    return;
                }

                reject(new Error('Could not determine desktop environment (tried GNOME and KDE)'));
            });
        });
    });
}