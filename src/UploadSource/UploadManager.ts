import TOS from '@volcengine/tos-sdk';
import NativeBridge from '../NativeBridge.ts';
import Utils from '../Utils.ts';

type TOSConfig = {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
    regionId: string;
    bucket: string;
};

class UploadManager {
    private uploadQueue: Array<File> = [];
    private isUploading: boolean = false;
    private tosClient: TOS | null = null;
    private tosConfig: TOSConfig | null = null;

    canUpload: boolean = false;

    private host: string = "https://upload.dingnews.net";
    private huoShanPath: string = "/api/upload/tos/token";

    private parseTOSConfig(input: any) {
        if (typeof input === 'string') {
            try {
                return JSON.parse(input) as TOSConfig;
            } catch (e) {
                console.error('Invalid TOS config string:', e);
                return null;
            }
        } else if (typeof input === 'object' && input !== null) {
            return input as TOSConfig;
        }
        console.error('Invalid TOS config format');
        return null;
    }

    private async getTOSConfigFromServer(): Promise<TOSConfig | null> {
        try {
            const response = await fetch(this.host + this.huoShanPath, {
                method: 'GET',
                headers: {
                    "user_token": "u_token:0984270dea7e71bcc2dcf85b24853e38"
                },
            });
            if (!response.ok) {
                console.error('Failed to fetch TOS config from server:', response.statusText);
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching TOS config from server:', error);
            return null;
        }
    }

    public async settingClient(): Promise<boolean> {
        let input = await NativeBridge.getInstance().getTOSConfigAsync();
        const config = this.parseTOSConfig(input);
        if (!config) {
            console.error('Failed to set TOS client: Invalid configuration');
            return false;
        }
        this.tosConfig = config;
        this.tosClient = new TOS({
            accessKeyId: config.accessKeyId,
            accessKeySecret: config.secretAccessKey,
            stsToken: config.sessionToken,
            region: config.regionId,
            bucket: config.bucket,
        });

        this.canUpload = true;
        console.log('TOS client configured successfully');
        return true;
    }

    public async fileUrlToBlob(fileUrl: string): Promise<Blob> {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Failed to fetch file: ' + fileUrl);
        return await response.blob();
    }

    public async addToQueue(filePath: string[] | string): Promise<string> {
        if (!this.canUpload) {
            console.error('TOS client is not set, cannot upload files');
            return '';
        }
        if (typeof filePath === 'string') {
            filePath = [filePath];
        } else if (!Array.isArray(filePath)) {
            console.error('Invalid file path format, expected string or array of strings');
            return '';
        }

        let resultUrl: string = '';

        for (const file of filePath) {
            try {
                const blob = await this.fileUrlToBlob(file);
                let fileName = file.split('/').pop() || 'upload.file';
                fileName = "image/" + Utils.getCurrentTime() + "/" + fileName;
                const fileObj = new File([blob], fileName, { type: blob.type });
                const uploadOk = await this.uploadFile(fileObj);
                if (uploadOk) {
                    // 拼接出上传后的图片 URL
                    const url = `https://img.dingnews.net/${fileName}`;
                    resultUrl = url;
                } else {
                    resultUrl = '';
                }
            } catch (error) {
                resultUrl = '';
            }
        }

        return resultUrl;
    }

    private async processQueue() {
        if (this.isUploading || this.uploadQueue.length === 0) return;

        this.isUploading = true;

        while (this.uploadQueue.length > 0) {
            const file = this.uploadQueue.shift();
            if (file) {
                await this.uploadFile(file);
            }
        }

        this.isUploading = false;
    }

    private async uploadFile(file: File) {
        try {
            const result = await this.tosClient!.putObject({
                bucket: this.tosConfig!.bucket,
                key: file.name,
                body: file,
            });
            if (result.statusCode === 200) {
                console.log(`File uploaded successfully: ${file.name}`);
                return true;
            } else {
                console.error(`Upload failed with status: ${result.statusCode}`);
                return false;
            }
        } catch (error) {
            console.error('Upload error:', error);
            return false;
        }
    }
}


export default new UploadManager();