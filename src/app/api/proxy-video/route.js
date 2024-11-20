export async function GET(request) {
  console.log("Incoming Request URL:", request.url);

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    console.error("URL parameter is missing");
    return new Response(JSON.stringify({ error: "URL is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    console.log("Fetching video from:", url);

    const videoResponse = await fetch(url);
    console.log("Video fetch status:", videoResponse.status);

    if (!videoResponse.ok) {
      console.error("Failed to fetch video from source");
      return new Response(JSON.stringify({ error: "Failed to fetch video" }), {
        status: videoResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const contentLength = parseInt(
      videoResponse.headers.get("content-length"),
      10
    );
    const contentType =
      videoResponse.headers.get("content-type") || "video/mp4";

    console.log("Content-Length:", contentLength);
    console.log("Content-Type:", contentType);

    const rangeHeader = request.headers.get("range");
    console.log("Range Header:", rangeHeader);

    if (rangeHeader) {
      const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/);

      if (!rangeMatch) {
        console.error("Invalid Range Header format:", rangeHeader);
        return new Response("Invalid Range", {
          status: 416,
          headers: {
            "Content-Range": `bytes */${contentLength}`,
          },
        });
      }

      const start = parseInt(rangeMatch[1], 10);
      const end = rangeMatch[2]
        ? parseInt(rangeMatch[2], 10)
        : contentLength - 1;

      console.log("Requested Range Start:", start, "End:", end);

      if (start >= contentLength || end >= contentLength) {
        console.error(
          `Requested Range Out of Bounds: start=${start}, end=${end}, size=${contentLength}`
        );
        return new Response("Requested range not satisfiable", {
          status: 416,
          headers: {
            "Content-Range": `bytes */${contentLength}`,
          },
        });
      }

      console.log(`Fetching range: bytes=${start}-${end}`);
      const rangeResponse = await fetch(url, {
        headers: { Range: `bytes=${start}-${end}` },
      });

      const rangeBuffer = await rangeResponse.arrayBuffer();
      console.log("Fetched Range Length:", rangeBuffer.byteLength);

      return new Response(rangeBuffer, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${contentLength}`,
          "Content-Length": rangeBuffer.byteLength,
          "Content-Type": contentType,
        },
      });
    }

    console.log("No Range Header, serving full content");
    const videoBuffer = await videoResponse.arrayBuffer();

    return new Response(videoBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": contentLength,
      },
    });
  } catch (error) {
    console.error("Error in Proxy Handler:", error.message);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
