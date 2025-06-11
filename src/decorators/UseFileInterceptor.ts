import { UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

const UseUploadFileInterceptor = (fieldName: string, options?: any) => {
    return UseInterceptors(
        FileInterceptor(fieldName, {
            limits: {
                fileSize: 100 * 1024 * 1024, // 100 MB
                files: 1,
            },
            fileFilter: (req, file, callback) => {
                if (!file.mimetype.match(/\/(jpg|jpeg|png|avif|webp|jfif)$/)) {
                    return callback(new Error('Only image files are allowed!'), false);
                }
                callback(null, true);
            },
            ...options,
        })
    );
}

export default UseUploadFileInterceptor;