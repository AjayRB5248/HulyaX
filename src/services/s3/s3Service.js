const aws = require('aws-sdk');

//AWS SERVICE
const {AWS_CONFIG} = require('../../config/config')

exports.uploadToS3Bucket = async (file, contentType, filePath) => {
    return new Promise((resolve, reject) => {
        try {
            let s3 = new aws.S3({
                accessKeyId: AWS_CONFIG.accessKeyId,
                secretAccessKey: AWS_CONFIG.secretAccessKey,
                region: AWS_CONFIG.region,
            });
            const bucketName = AWS_CONFIG.AWS_S3_BUCKET_NAME;
            let bucketPath = filePath;

            let params = {
                Bucket: bucketName,
                Key: bucketPath,
                Body: file,
                contentType : contentType,
                ACL : "public-read",
                ContentDisposition:"inline"  
            };

            s3.upload(params, function (err, data) {
                if (err) {
                    reject(err);
                    console.error(err);
                } else {
                    resolve(data);
                }
            });

        } catch (err) {
            console.error("uploadToS3Bucket Error::>", err);
            reject(err);
        }
    });
};


