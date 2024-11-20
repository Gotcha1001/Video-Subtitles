export function clearTranscriptionItems(items) {
  items.forEach((item, key) => {
    if (!item.start_time) {
      const prev = items[key - 1];
      prev.alternatives[0].content + item.alternatives[0].content;
      delete items[key];
    }
  });
  return items.map((item) => {
    const { start_time, end_time } = item;
    const content = item.alternatives[0].content;
    return { start_time, end_time, content };
  });
}

function secondsToHHMMSSMS(timeString) {
  const seconds = parseFloat(timeString);
  if (isNaN(seconds) || seconds < 0) {
    throw new Error(`Invalid time string: ${timeString}`);
  }
  const d = new Date(seconds * 1000);
  return d.toISOString().slice(11, 23).replace(".", ",");
}

export function transcriptionItemsToSrt(items) {
  let srt = "";
  let i = 1;

  items.forEach((item) => {
    // Ensure item and properties are valid before destructuring
    if (
      !item ||
      typeof item.start_time === "undefined" ||
      typeof item.end_time === "undefined"
    ) {
      console.warn(`Skipping item ${i} due to missing start_time or end_time.`);
      return; // Skip this item if it's missing essential properties
    }

    const { start_time, end_time, content } = item;

    if (typeof content === "undefined" || content.trim() === "") {
      console.warn(`Item ${i} has no content.`);
      return; // Skip this item if it has no content
    }

    // seq
    srt += i + "\n";

    // Add timestamps after validation
    try {
      srt +=
        secondsToHHMMSSMS(start_time) +
        " --> " +
        secondsToHHMMSSMS(end_time) +
        "\n";
    } catch (error) {
      console.error(`Error in timestamp for item ${i}: ${error.message}`);
      return; // Skip this item if there's a timestamp error
    }

    // Add content to the SRT string
    srt += content + "\n\n";
    i++;
  });

  return srt;
}
