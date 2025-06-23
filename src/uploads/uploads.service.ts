import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Express } from 'express';

@Injectable()
export class UploadService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly cdnEndpoint: string;

  constructor() {
    this.bucket = process.env.BUCKET_NAME_DIGITAL_OCEAN || 'your-bucket-name';
    this.cdnEndpoint = process.env.BUCKET_CDN_URL_DIGITAL_OCEAN || 'https://your-bucket-name.nyc3.cdn.digitaloceanspaces.com';
    this.s3Client = new S3Client({
      forcePathStyle: false, 
      region: process.env.DO_SPACES_REGION || 'nyc3',
      // endpoint: process.env.BUCKET_URL_DIGITAL_OCEAN || 'https://nyc3.digitaloceanspaces.com',
      endpoint: 'https://nyc3.digitaloceanspaces.com',
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_DIGITAL_OCEAN || '',
        secretAccessKey: process.env.SECRET_KEY_DIGITAL_OCEAN || '',
      },
    });
  }

  async uploadFile(file: Express.Multer.File, type: "saga" | "game"): Promise<string> {
    const fileName = `${type}/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileName,
      Body: file.buffer,
      ACL: 'public-read',
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);

    return `${this.cdnEndpoint}/${fileName}`;
  }

  async generatePresignedUrl(fileName: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileName,
      ContentType: contentType,
      ACL: 'public-read',
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }
}