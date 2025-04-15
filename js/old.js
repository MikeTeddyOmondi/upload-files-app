//Getting all required elements
const inputFile = document.querySelector("#file-input");

async function uploadFile(file) {
  const response = await fetch(
    `http://localhost:3489/generate-presigned-url?filename=${file.name}&contentType=${file.type}`
  );
  const {
    data: { url },
  } = await response.json();
  const uploadResponse = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (uploadResponse.ok) {
    console.log("File uploaded successfully!");
    console.log("Checking if it's available in the bucket...");
    await checkFileExists(file.name);
  } else {
    console.error(`Upload failed: ${await uploadResponse.text()}`);
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
          console.log(`File ${filename} is available!`);
          resolve(true);
          return;
        }
      } catch (error) {
        console.error(`Error checking file`, error);
      }

      attempts++;

      if (attempts < maxAttempts) {
        setTimeout(poll, interval);
      } else {
        console.error(
          `File ${filename} was not found after ${maxAttempts} attempts after ~(${
            (maxAttempts * interval) / 60
          } seconds)!`
        );
        reject(
          new Error(
            `File not found within the given time ~(${
              (maxAttempts * interval) / 60
            } seconds)`
          )
        );
      }
    };

    poll();
  });
}

// Setup event listeners
inputFile.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) uploadFile(file);
});
