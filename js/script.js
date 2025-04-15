document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("file-input");
  const uploadBox = document.getElementById("upload-box");
  const loadingSpinner = document.getElementById("loading-spinner");
  const errorMessage = document.getElementById("error-message");
  const MAX_FILE_SIZE_MB = 15;

  // uploadBox.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    handleFileUpload(file);
  });

  // Drag & Drop Support
  uploadBox.addEventListener("dragover", (event) => {
    event.preventDefault();
    uploadBox.classList.add("drag-over");
  });

  uploadBox.addEventListener("dragleave", () => {
    uploadBox.classList.remove("drag-over");
  });

  uploadBox.addEventListener("drop", (event) => {
    event.preventDefault();
    uploadBox.classList.remove("drag-over");

    const file = event.dataTransfer.files[0];
    handleFileUpload(file);
  });

  async function handleFileUpload(file) {
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      showError(`File size must be less than ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    loadingSpinner.style.display = "block";
    errorMessage.style.display = "none";

    try {
      await uploadFile(file);
    } catch (error) {
      showError("❌ Upload failed. Please try again.");
    } finally {
      loadingSpinner.style.display = "none";
    }
  }

  async function checkFileExists(filename, maxAttempts = 10, interval = 3000) {
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const response = await fetch(
            `http://localhost:3489/check-file-upload/${filename}`
          );

          if (response.ok) {
            console.log(`✅ File "${filename}" is available.`);
            resolve(true);
            return;
          }
        } catch (error) {
          console.error("Error checking file:", error);
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, interval);
        } else {
          console.error(
            `❌ File "${filename}" was not found after ${maxAttempts} attempts.`
          );
          reject(new Error("File not found within the given time."));
        }
      };

      poll();
    });
  }

  async function uploadFile(file) {
    try {
      const response = await fetch(
        `http://localhost:3489/generate-presigned-url?filename=${file.name}&contentType=${file.type}`
      );
      const { data: { url } } = await response.json();

      const uploadResponse = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (uploadResponse.ok) {
        console.log(
          "✅ File uploaded successfully. Checking if it's available..."
        );
        await checkFileExists(file.name);
      } else {
        console.error("❌ Upload failed:", await uploadResponse.text());
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
  }
});
