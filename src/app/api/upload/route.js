import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import ffmpeg from "fluent-ffmpeg";
import uniqid from "uniqid";
import { tmpdir } from "os";
import { join } from "path";
import fs from "fs/promises";

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get("file");
  const { name, type } = file;
  const ext = name.split(".").pop().toLowerCase();

  const id = uniqid();
  const tmpFile = join(tmpdir(), `${id}.${ext}`);
  const mp4File = join(tmpdir(), `${id}.mp4`);
  const data = await file.arrayBuffer();

  // Save the file temporarily
  await fs.writeFile(tmpFile, Buffer.from(data));

  // Convert to MP4 if needed
  if (ext !== "mp4") {
    await new Promise((resolve, reject) => {
      ffmpeg(tmpFile)
        .output(mp4File)
        .on("end", resolve)
        .on("error", reject)
        .run();
    });
  }

  const finalFile = ext === "mp4" ? tmpFile : mp4File;

  // Upload to S3
  const s3client = new S3Client({
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.MY_AWS_ACCESS_KEY,
      secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
    },
  });

  const newName = `${id}.mp4`;
  const dataBuffer = await fs.readFile(finalFile);
  const uploadCommand = new PutObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Body: dataBuffer,
    ACL: "public-read",
    ContentType: "video/mp4",
    Key: newName,
  });

  await s3client.send(uploadCommand);

  // Clean up temporary files
  await fs.unlink(tmpFile);
  if (finalFile !== tmpFile) {
    await fs.unlink(mp4File);
  }

  return Response.json({ name, ext, newName, id });
}
