import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  GetTranscriptionJobCommand,
  StartTranscriptionJobCommand,
  TranscribeClient,
} from "@aws-sdk/client-transcribe";

function getClient() {
  return new TranscribeClient({
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

function createTranscriptionCommand(filename) {
  const uniqueJobName = `${filename}-${Date.now()}`; // Ensure a unique job name
  return new StartTranscriptionJobCommand({
    TranscriptionJobName: uniqueJobName,
    OutputBucketName: process.env.BUCKET_NAME,
    OutputKey: filename + ".transcription",
    IdentifyLanguage: true,
    Media: {
      MediaFileUri: `s3://${process.env.BUCKET_NAME}/${filename}`,
    },
  });
}

async function createTranscriptionJob(filename) {
  const transcribeClient = getClient();
  const transcriptionCommand = createTranscriptionCommand(filename);
  return transcribeClient.send(transcriptionCommand);
}

async function getJob(filename) {
  const transcribeClient = getClient();
  try {
    const transcriptionJobStatusCommand = new GetTranscriptionJobCommand({
      TranscriptionJobName: filename,
    });
    const jobStatusResult = await transcribeClient.send(
      transcriptionJobStatusCommand
    );
    return jobStatusResult;
  } catch (e) {
    return null;
  }
}

async function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    stream.on("error", reject);
  });
}

async function getTranscriptionFile(filename) {
  const transcriptionFile = filename + ".transcription";
  const s3client = new S3Client({
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  const getObjectCommand = new GetObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: transcriptionFile,
  });

  try {
    const transcriptionFileResponse = await s3client.send(getObjectCommand);
    if (transcriptionFileResponse && transcriptionFileResponse.Body) {
      const transcription = JSON.parse(
        await streamToString(transcriptionFileResponse.Body)
      );
      console.log(transcription);
      return transcription; // Fixed return statement
    }
  } catch (e) {
    console.error("Error getting transcription file:", e);
  }
  return null;
}

export async function GET(req) {
  const url = new URL(req.url);
  const searchParams = new URLSearchParams(url.searchParams);
  const filename = searchParams.get("filename");

  // Try to get existing transcription file
  const transcription = await getTranscriptionFile(filename);
  if (transcription) {
    return Response.json({
      status: "COMPLETED",
      transcription,
    });
  }

  // Check if job already exists
  const existingJob = await getJob(filename);
  if (existingJob) {
    return Response.json({
      status: existingJob.TranscriptionJob.TranscriptionJobStatus,
    });
  }

  // Create a new transcription job if none exists
  const newJob = await createTranscriptionJob(filename);
  return Response.json({
    status: newJob.TranscriptionJob.TranscriptionJobStatus,
  });
}
