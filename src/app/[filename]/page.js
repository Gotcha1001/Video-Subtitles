"use client";
import ResultVideo from "@/components/ResultVideo";
import TranscriptionEditor from "@/components/TranscriptionEditor";
import { clearTranscriptionItems } from "@/libs/awsTranscriptionHelpers";
import axios from "axios";
import { useEffect, useState } from "react";
import { use } from "react";

export default function FilePage({ params }) {
  const { filename } = use(params); // Unwrap the Promise using React.use()

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [awsTranscriptionItems, setAwsTranscriptionItems] = useState([]);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);

  useEffect(() => {
    getTranscription();
  }, [filename]);

  function getTranscription() {
    setIsFetchingInfo(true);
    axios.get("/api/transcribe?filename=" + filename).then((response) => {
      setIsFetchingInfo(false);
      const status = response.data?.status;
      const transcription = response.data?.transcription;
      if (status === "IN_PROGRESS") {
        setTimeout(getTranscription, 3000);
        setIsTranscribing(true);
      } else {
        setIsTranscribing(false);
        setAwsTranscriptionItems(
          clearTranscriptionItems(transcription.results.items)
        );
      }
    });
  }

  if (isTranscribing) {
    return <div>Transcribing your video ...</div>;
  }

  if (isFetchingInfo) {
    return <div>Fetching Infomation...</div>;
  }

  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-8 sm:gap-16">
        <div>
          <h2
            className="text-3xl mb-4 text-white/60"
            style={{ textShadow: "2px 2px 4px black" }}
          >
            Transcription
          </h2>
          <TranscriptionEditor
            awsTranscriptionItems={awsTranscriptionItems}
            setAwsTranscriptionItems={setAwsTranscriptionItems}
          />
        </div>
        <div>
          <h2
            className="text-3xl mb-4 text-white/60"
            style={{ textShadow: "2px 2px 4px black" }}
          >
            Result
          </h2>
          <ResultVideo
            filename={filename}
            transcriptionItems={awsTranscriptionItems}
          />
        </div>
      </div>
    </div>
  );
}
