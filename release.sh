#! /bin/bash
# 获取当前版本号
current_version=$(cat src/package.json | sed 's/,/\n/g' | grep "version" | sed 's/:/\n/g' | sed '1d' | sed 's/}//g' | cut -d '"' -f 2)

mkdir dist/${current_version}

rm -rf .packing
for platform in "$@"; do
    case "$platform" in
    "linux64")
        echo "打包 linux64 平台..."
        echo "建立臨時目錄..."
        mkdir -p .packing/linux64

        echo "複製項目檔案到臨時目錄..."
        cd .packing/linux64
        cp -rf ../../src/app app
        cp -rf ../../src/node_modules node_modules
        cp -f ../../src/package.json package.json
        cp -f ../../src/Scrcpy_logo.png Scrcpy_logo.png
        cp -f ../../src/user_config.json.org user_config.json.org

        echo "解壓平台框架到臨時目錄..."
        cd ../../nwjs
        if [ ! -f "nwjs-v0.64.1-linux-x64.tar.gz" ]; then
            wget https://dl.nwjs.io/v0.64.1/nwjs-v0.64.1-linux-x64.tar.gz
        fi
        tar -xzf nwjs-v0.64.1-linux-x64.tar.gz -C ../.packing/linux64 --strip-components=1 -v
        cd ../.packing/linux64
        mv nw Scrcpy啟動器

        echo "開始打包檔案..."
        zip_file_linux64="Scrcpy_Launcher_Linux64_v${current_version}.tar.gz"
        tar -czvf "../../dist/${current_version}/$zip_file_linux64" .
        cd ../../
        rm -rf .packing/linux64
        ;;
    "win32")
        echo "打包 win32 平台..."
        echo "建立臨時目錄..."
        mkdir -p .packing/win32

        echo "複製項目檔案到臨時目錄..."
        cd .packing/win32
        cp -rf ../../src/app app
        cp -rf ../../src/node_modules node_modules
        cp -f ../../src/package.json package.json
        cp -f ../../src/Scrcpy_logo.png Scrcpy_logo.png
        cp -f ../../src/user_config.json.org user_config.json.org

        echo "解壓平台框架到臨時目錄..."
        cd ../../nwjs
        if [ ! -f "nwjs-v0.64.1-win-ia32.zip" ]; then
            wget https://dl.nwjs.io/v0.64.1/nwjs-v0.64.1-win-ia32.zip
        fi
        unzip nwjs-v0.64.1-win-ia32.zip -d ../.packing/win32
        cd ../.packing/win32
        mv nwjs-v0.64.1-win-ia32/* ./
        rm -rf nwjs-v0.64.1-win-ia32
        mv nw.exe Scrcpy啟動器.exe

        echo "開始打包檔案..."
        zip_file_win32="Scrcpy_Launcher_Win32_v${current_version}.zip"
        zip -r "../../dist/${current_version}/$zip_file_win32" .
        cd ../../
        rm -rf .packing/win32
        ;;
    "win64")
        echo "打包 win64 平台..."
        echo "建立臨時目錄..."
        mkdir -p .packing/win64

        echo "複製項目檔案到臨時目錄..."
        cd .packing/win64
        cp -rf ../../src/app app
        cp -rf ../../src/node_modules node_modules
        cp -f ../../src/package.json package.json
        cp -f ../../src/Scrcpy_logo.png Scrcpy_logo.png
        cp -f ../../src/user_config.json.org user_config.json.org

        echo "解壓平台框架到臨時目錄..."
        cd ../../nwjs
        if [ ! -f "nwjs-v0.64.1-win-x64.zip" ]; then
            wget https://dl.nwjs.io/v0.64.1/nwjs-v0.64.1-win-x64.zip
        fi
        unzip nwjs-v0.64.1-win-x64.zip -d ../.packing/win64
        cd ../.packing/win64
        mv nwjs-v0.64.1-win-x64/* ./
        rm -rf nwjs-v0.64.1-win-x64
        mv nw.exe Scrcpy啟動器.exe

        echo "開始打包檔案..."
        zip_file_win64="Scrcpy_Launcher_Win64_v${current_version}.zip"
        zip -r "../../dist/${current_version}/$zip_file_win64" .
        cd ../../
        rm -rf .packing/win64
        ;;
    *)
        echo "支援平台僅限：linux64 win32 win64"
        ;;
    esac
done

echo "清理臨時目錄..."
rm -rf ./.packing

echo "打包完成"
