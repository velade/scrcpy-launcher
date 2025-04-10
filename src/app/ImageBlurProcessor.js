/********************
腳本名:ImageBlurProcessor
版本號:1.0
通  道:Release
作　者:龍翔翎(Velade)

更新日期:2025-03-20
********************/

/**
 * 處理圖像模糊的類
 */
class ImageBlurProcessor {
    /**
     * 圖片模糊處理
     * @param {String} inputPath 原始圖片路徑
     * @param {Array<Int>} targetSize 目標尺寸：你需要給出一個固定的分辨率，以[width, height]來表示
     * @param {Float} [zipRate=1] 壓縮比例：模糊的圖片本身不需要太過高清，因此你可以在這裡設定一個壓縮比例來降低分辨率，範圍是0.01-1，0的話圖片會消失，因此要大於0；1為不壓縮，超過1是強行放大，但無意義。例如設定為0.25則是生成的圖片是目標尺存的1/4。
     * @param {Boolean} [isLocalPath=false] 是否為本地圖片：在nwjs或electron這類框架中，你可能會用到相對本機的絕對路徑，例如D:\pictrues\img0.jpg (Windows)或/home/xxx/Pictures/img0.jpg (Linux)等，通過將此參數設定為true，可以讀取本地文件而不是相對應用根目錄的路徑（在純js中可能無效）。或者也可以在inputPath直接加上"file://"前綴，這兩種方式僅可選擇其一。
     */
    constructor(inputPath, targetSize, zipRate = 1, isLocalPath = false) {
        this.inputPath = inputPath;
        this.targetSize = targetSize;
        this.zipRate = zipRate;
        this.isLocalPath = isLocalPath;
    }
    /**
     * 模糊圖片
     * @param {Int | Float} blurRadius 模糊半徑，不是有些圖形處理使用的sigma，是和CSS一致的像素單位模糊半徑。
     * @param {string} [blobType="image/webp"] 返回的blob的MIME類型，默認為"image/webp"，這同時決定了你之後要保存、下載獲取DataURL時的檔案格式
     * @returns {bluredBlob} 返回一個包含blob的類，用於後續轉換
     */
    async blurImage(blurRadius, blobType = "image/webp") {
        // 模糊過程中固定傳入的參數，以防止中途改變的干擾
        const inputPath = this.inputPath;
        const targetSize = this.targetSize;
        const zipRate = this.zipRate;
        const isLocalPath = this.isLocalPath;
        return new Promise((resolve, reject) => {
            // 創建一個圖像對象
            const img = new Image();
            // 當圖片成功載入後開始處理
            img.onload = () => {
                // 創建畫布並取得參數
                const canvas = document.createElement('canvas');
                const imgW = img.width;
                const imgH = img.height;
                const imgRatio = imgW / imgH;
                const targetW = targetSize[0] * zipRate;
                const targetH = targetSize[1] * zipRate;
                const targetRatio = targetW / targetH;

                //畫布設定為目標尺存
                canvas.width = targetW;
                canvas.height = targetH;

                // 偏移計算變量
                let offsetX = 0, offsetY = 0;
                let stW = imgW;
                let stH = imgH;

                if (imgRatio > targetRatio) { // 當圖片更寬時
                    stW = imgH * targetRatio; // 計算放大到目標高度時圖片的實際寬度
                    offsetX = (imgW - stW) / 2; // 計算寬度裁減的起點偏移量
                } else if (imgRatio < targetRatio) { // 當圖片更高時
                    stH = imgW / targetRatio; // 計算放大到目標寬度時圖片的實際高度
                    offsetY = (imgH - stH) / 2; // 計算高度裁減的起點偏移量
                }
                // 比例相同時無須偏移

                const ctx = canvas.getContext('2d');

                // 將圖片裁減並繪製到畫布
                ctx.drawImage(img, offsetX, offsetY, stW, stH, 0, 0, targetW, targetH);

                // 獲取圖像數據
                let imageData = ctx.getImageData(0, 0, targetW, targetH);
                // 獲取像素數據
                let pixels = imageData.data;

                // 生成高斯核
                let kernel = this.generateGaussianKernel(blurRadius);

                // 水平方向模糊
                let horizontalPixels = this.applyHorizontalBlur(pixels, targetW, targetH, kernel);

                // 垂直方向模糊
                let verticalPixels = this.applyVerticalBlur(horizontalPixels, targetW, targetH, kernel);

                // 將模糊後的像素放回 imageData
                imageData.data.set(verticalPixels);
                ctx.putImageData(imageData, 0, 0);

                // 獲取最終圖像的blob數據
                canvas.toBlob((blob) => {
                    resolve(new bluredBlob(blob, this.getFilename(inputPath), blobType));
                }, blobType);
            };
            img.onerror = reject;
            // 根據isLocalPath決定是否添加「file://」
            if (isLocalPath) {
                img.src = "file://" + inputPath;
            } else {
                img.src = inputPath;
            }
        });
    }

    generateGaussianKernel(radius) {
        let kernel = [];
        let sigma = radius / 3;
        let sum = 0;
        for (let x = -radius; x <= radius; x++) {
            let g = Math.exp(-(x * x) / (2 * sigma * sigma));
            kernel.push(g);
            sum += g;
        }
        for (let i = 0; i < kernel.length; i++) {
            kernel[i] /= sum;
        }
        return kernel;
    }

    applyHorizontalBlur(pixels, width, height, kernel) {
        let radius = Math.floor(kernel.length / 2);
        let newPixels = new Float32Array(pixels.length);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0, a = 0;
                for (let i = -radius; i <= radius; i++) {
                    let x1 = x + i;
                    if (x1 < 0) {
                        x1 = 0;
                    } else if (x1 >= width) {
                        x1 = width - 1;
                    }
                    let offset = (y * width + x1) * 4;
                    r += pixels[offset] * kernel[i + radius];
                    g += pixels[offset + 1] * kernel[i + radius];
                    b += pixels[offset + 2] * kernel[i + radius];
                    a += pixels[offset + 3] * kernel[i + radius];
                }
                let offset = (y * width + x) * 4;
                newPixels[offset] = r;
                newPixels[offset + 1] = g;
                newPixels[offset + 2] = b;
                newPixels[offset + 3] = a;
            }
        }
        return newPixels;
    }

    applyVerticalBlur(pixels, width, height, kernel) {
        let radius = Math.floor(kernel.length / 2);
        let newPixels = new Uint8ClampedArray(pixels.length); // 使用Uint8ClampedArray

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                let r = 0, g = 0, b = 0, a = 0;
                for (let i = -radius; i <= radius; i++) {
                    let y1 = y + i;
                    if (y1 < 0) {
                        y1 = 0;
                    } else if (y1 >= height) {
                        y1 = height - 1;
                    }
                    let offset = (y1 * width + x) * 4;
                    r += pixels[offset] * kernel[i + radius];
                    g += pixels[offset + 1] * kernel[i + radius];
                    b += pixels[offset + 2] * kernel[i + radius];
                    a += pixels[offset + 3] * kernel[i + radius];
                }
                let offset = (y * width + x) * 4;
                newPixels[offset] = Math.round(r);
                newPixels[offset + 1] = Math.round(g);
                newPixels[offset + 2] = Math.round(b);
                newPixels[offset + 3] = Math.round(a);
            }
        }
        return newPixels;
    }

    /**
     * 
     * @param {String} filePath 檔案的完整路徑，在此類中，對應inputPath
     * @returns {String} 返回檔案名：不包括副檔名，因為在此類中，原副檔名沒有意義。
     */
    getFilename(filePath) {
        // 檢查路徑中是否有 '/' 或 '\' 分隔符
        const lastSlashIndex = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));

        let filename = filePath;
        // 如果找到分隔符，提取檔案名
        if (lastSlashIndex >= 0) {
            filename = filePath.slice(lastSlashIndex + 1);
        }

        // 去除副檔名
        const dotIndex = filename.lastIndexOf('.');
        if (dotIndex > 0) {
            filename = filename.slice(0, dotIndex);
        }

        return filename;
    }
}

/**
 * 接收模糊的類返回結果的類
 */
class bluredBlob {
    /**
     * 保存模糊結果的類
     * @param {Blob} blob 圖片的二進制數據
     * @param {String} filename 原檔案名
     * @param {String} blobType 圖片Blob的MIME類型
     */
    constructor(blob, filename, blobType) {
        this.filename = filename;
        this.blob = blob;
        this.blobType = blobType
    }
    /**
     * 保存到檔案
     * @param {String} filePath 保存圖片本地路徑：注意由ImageBlurProcessor返回的blob默認是webp格式的！路徑不是相對腳本或應用的，是本地絕對路徑。不在nwjs或electron這類環境時，請使用download下載，因為純js本身不支援對本地檔案進行操作。
     */
    async toFile(filePath) {
        return new Promise((resolve, reject) => {

            const reader = new FileReader();
            reader.onload = () => {
                const buffer = Buffer.from(reader.result);
                try {
                    const fs = require('fs');
                    fs.writeFile(filePath, buffer, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                } catch (error) {
                    reject("The 'fs' module failed to load, or the current script is not in a NW.js environment; the saveBlobToFile function is unavailable.");
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(this.blob);
        });
    }
    /**
     * 獲取Base64格式的Data URL
     * @returns {Promise<String>} 異步返回，reslove返回值為字符串類型的Data URL
     */
    toDataUrl() {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = function () {
                resolve(reader.result); // 讀取完成，返回Base64 Data URL
            };

            reader.onerror = function () {
                reject(new Error('blobToBase64 error'));
            };

            reader.readAsDataURL(this.blob); // 開始讀取Blob
        });
    }

    /**
     * 下載圖片 注意：下載行為需要在用戶主動交互後才能生效，請將此方法放在例如 點擊、輸入等主動交互之後，因為a.click()必須在主動交互之後才能執行。
     * @param {String} [filename=null] 可以指定下載檔案名，不指定則為 原檔案名＋_blured。例如原檔案名為 img001.jpg，默認下載檔案名則為 img001_blured.webp（副檔名根據實際模糊後圖片類型決定）
     */
    download(filename = null) {
        // 如果未指定檔案名
        if (filename === null) {
            // 根據blob類型選擇副檔名
            let extension = '';
            switch (this.blobType) {
                case 'image/jpeg':
                case 'image/jpg':
                    extension = '.jpg';
                    break;
                case 'image/png':
                    extension = '.png';
                    break;
                case 'image/gif':
                    extension = '.gif';
                    break;
                case 'image/webp':
                    extension = '.webp';
                    break;
                case 'image/bmp':
                case 'image/x-ms-bmp':
                    extension = '.bmp';
                    break;
                default:
                    extension = ''; // 預設為空
            }
            // 組合成完整的檔案名
            filename = this.filename + "_blured" + extension;
        }
        // 從blob創建DataUrl
        const url = URL.createObjectURL(this.blob);
        // 創建用於觸發下載的臨時超鏈接
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        // 將臨時超鏈接添加到頁面底部
        document.body.appendChild(a);
        // 模擬點擊超鏈接：注意由於瀏覽器的安全性限制，click事件必須在用戶主動與頁面交互（例如點擊、輸入等強交互，而移動滑鼠等不算）之後才可以由代碼觸發。
        a.click();
        // 銷毀臨時創建的DataURL
        URL.revokeObjectURL(url);
        // 移除臨時超鏈接
        document.body.removeChild(a);
    }
}

module.exports = ImageBlurProcessor;