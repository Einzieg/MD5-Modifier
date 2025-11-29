export const calculateMD5 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    // Read in chunks for better performance on large files, 
    // but for simplicity in this demo we read the whole buffer 
    // since SparkMD5 ArrayBuffer is fast for reasonable sizes.
    reader.onload = (e) => {
      if (e.target?.result) {
        // Access SparkMD5 from the global window object loaded via script tag
        const spark = new window.SparkMD5.ArrayBuffer();
        spark.append(e.target.result as ArrayBuffer);
        resolve(spark.end());
      } else {
        reject(new Error("Failed to read file"));
      }
    };

    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
};

export const modifyFileMD5 = async (file: File): Promise<{ blob: Blob, hash: string }> => {
  // Method: Append a single null byte to the end of the file.
  // This changes the hash but rarely affects file validity for media/archives.
  const newContent = new Blob([file, new Uint8Array([0])], { type: file.type });
  const newHash = await calculateMD5(newContent);
  return { blob: newContent, hash: newHash };
};
