import { useEffect, useRef, useState } from "react";
import SparklesIcon from "./SparklesIcon";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { transcriptionItemsToSrt } from "@/libs/awsTranscriptionHelpers";
import roboto from "./../fonts/Roboto-Regular.ttf";
import robotoBold from "./../fonts/Roboto-Bold.ttf";

export default function ResultVideo({ filename, transcriptionItems }) {
  const videoUrl = `https://wesley-epic-captions.s3.amazonaws.com/${filename}`;
  const [loaded, setLoaded] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#FFFFFF");
  const [outlineColor, setOutlineColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(30); // Font size state
  const [progress, setProgress] = useState(1);
  const ffmpegRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    video.src = videoUrl;

    const initFFmpeg = async () => {
      try {
        const ffmpeg = new FFmpeg();
        ffmpegRef.current = ffmpeg;

        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
        await ffmpeg.load({
          coreURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.js`,
            "text/javascript"
          ),
          wasmURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.wasm`,
            "application/wasm"
          ),
        });
        await ffmpeg.writeFile("/tmp/roboto.ttf", await fetchFile(roboto));
        await ffmpeg.writeFile(
          "/tmp/roboto-bold.ttf",
          await fetchFile(robotoBold)
        );
        setLoaded(true);
      } catch (error) {
        console.error("FFmpeg initialization error:", error);
      }
    };

    initFFmpeg();
  }, []);

  function toFFmpegColor(rgb) {
    const bgr = rgb.slice(5, 7) + rgb.slice(3, 5) + rgb.slice(1, 3);
    return "&H" + bgr + "&";
  }

  const transcode = async () => {
    try {
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg) return;
      const srt = transcriptionItemsToSrt(transcriptionItems);

      // Get video duration first
      const duration = await new Promise((resolve, reject) => {
        const video = videoRef.current;

        // Reset the video source to trigger loading
        video.src = videoUrl;

        const handleLoadedMetadata = () => {
          console.log("Video duration:", video.duration);
          resolve(video.duration);
        };

        const handleError = (error) => {
          console.error("Error loading video:", error);
          reject(error);
        };

        video.addEventListener("loadedmetadata", handleLoadedMetadata);
        video.addEventListener("error", handleError);

        // Cleanup function
        return () => {
          video.removeEventListener("loadedmetadata", handleLoadedMetadata);
          video.removeEventListener("error", handleError);
        };
      });

      console.log("Final duration:", duration);

      // Use proxy API route to fetch video
      const response = await fetch(
        `/api/proxy-video?url=${encodeURIComponent(videoUrl)}`
      );

      if (!response.ok) {
        throw new Error(`Video fetch failed: ${response.status}`);
      }

      const videoBlob = await response.blob();
      await ffmpeg.writeFile("subs.srt", srt);
      await ffmpeg.writeFile(filename, await fetchFile(videoBlob));

      ffmpeg.on("log", ({ message }) => {
        const regexResult = /time=([0-9:.]+)/.exec(message);
        if (regexResult && regexResult?.[1]) {
          const howMuchIsDone = regexResult?.[1];
          const [hours, minutes, seconds] = howMuchIsDone.split(":");
          const doneTotalSeconds = hours * 3600 + minutes * 60 + seconds;
          const videoProgress = doneTotalSeconds / duration;
          setProgress(videoProgress);
        }
      });

      await ffmpeg.exec([
        "-i",
        filename,
        "-t",
        "120", // Limit video to 60 seconds (1 minute)
        "-preset",
        "ultrafast",
        "-vf",
        `subtitles=subs.srt:fontsdir=/tmp:force_style='Fontname=Roboto Bold,FontSize=${fontSize},MarginV=100,PrimaryColour=${toFFmpegColor(
          primaryColor
        )},OutlineColour=${toFFmpegColor(outlineColor)}'`,
        "output.mp4",
      ]);

      const data = await ffmpeg.readFile("output.mp4");
      videoRef.current.src = URL.createObjectURL(
        new Blob([data.buffer], { type: "video/mp4" })
      );
      setProgress(1);
    } catch (error) {
      console.error("Transcoding error:", error);
    }
  };

  return (
    <>
      <div className="mb-4">
        <button
          onClick={transcode}
          className="bg-green-600 py-2 px-6 rounded-full inline-flex gap-2 border-2 border-purple-700/50 cursor-pointer"
        >
          <SparklesIcon />
          <span>Apply Captions</span>
        </button>
      </div>

      {/* Color and Font Size Controls */}
      <div>
        <label>Primary color:</label>
        <input
          className="color ml-2"
          type="color"
          value={primaryColor}
          onChange={(ev) => setPrimaryColor(ev.target.value)}
        />
        <br />
        <label>Outline color:</label>
        <input
          className="color ml-2"
          type="color"
          value={outlineColor}
          onChange={(ev) => setOutlineColor(ev.target.value)}
        />
        <br />

        {/* Font Size Slider */}
        <label className="mr-4">Font Size: {fontSize}px</label>
        <input
          className="my-4"
          type="range"
          min="10"
          max="100"
          value={fontSize}
          onChange={(ev) => setFontSize(ev.target.value)}
        />
      </div>

      {/* Video Display */}
      <div className="rounded-xl overflow-hidden relative">
        {progress && progress < 1 && (
          <div className="absolute inset-0 bg-black/80 flex items-center ">
            <div className="w-full text-center">
              <div className="bg-bg-gradient-from/50 mx-8 rounded-lg overflow-hidden relative">
                <div
                  className="bg-bg-gradient-from h-8 "
                  style={{ width: progress * 100 + "%" }}
                >
                  <h3 className="text-white text-xl absolute inset-0 py-1">
                    {parseInt(progress * 100)}%
                  </h3>
                </div>
              </div>
            </div>
          </div>
        )}
        <video data-video={0} ref={videoRef} controls></video>
      </div>
    </>
  );
}
