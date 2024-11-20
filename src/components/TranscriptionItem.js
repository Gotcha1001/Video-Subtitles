export default function TranscriptionItem({
  item,
  handleStartTimeChange,
  handleEndTimeChange,
  handleContentChange,
}) {
  if (!item) {
    return "";
  }

  return (
    <div className="mb-1 grid grid-cols-3 gap-1">
      {/* Start Time Input (disabled) */}
      <input
        className="bg-white/20 p-1 rounded-md items-center"
        type="text"
        value={item.start_time}
        onChange={handleStartTimeChange}
        disabled // Disable the start_time input
      />

      {/* End Time Input (disabled) */}
      <input
        className="bg-white/20 p-1 rounded-md"
        type="text"
        value={item.end_time}
        onChange={handleEndTimeChange}
        disabled // Disable the end_time input
      />

      {/* Content Input (editable) */}
      <input
        className="bg-white/20 p-1 rounded-md"
        type="text"
        value={item.content}
        onChange={handleContentChange} // Content is editable
      />
    </div>
  );
}
