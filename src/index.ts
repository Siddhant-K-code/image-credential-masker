import vision from "@google-cloud/vision";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { writeFile } from "fs/promises";

async function maskSensitiveText() {
  const visionClient = new vision.ImageAnnotatorClient();
  const apiKey = process.env.GOOGLE_GENERATIVE_AI;
  if (!apiKey) {
    throw new Error('GOOGLE_GENERATIVE_AI environment variable is not set');
  }
  const generativeAIClient = new GoogleGenerativeAI(apiKey);

  const fileName = process.env.FILE_NAME;
  if (!fileName) {
    throw new Error('FILE_NAME environment variable is not set');
  }

  const [detectionResult] = await visionClient.textDetection(fileName);
  const textAnnotations = detectionResult.textAnnotations ?? [];

  const detectedTexts = textAnnotations
    .map((annotation, index) => index === 0 ? null : annotation.description)
    .filter(text => text);

  console.log("Extracted Text Array:", detectedTexts);

  const schema = {
    description: "List of sensitive texts",
    type: SchemaType.OBJECT,
    properties: {
      sensitiveTexts: {
        type: SchemaType.ARRAY,
        description: "Array of sensitive text strings",
        items: {
          type: SchemaType.STRING,
        },
      },
    },
    required: ["sensitiveTexts"]
  };

  const textContext = detectedTexts.join(", ");
  const generativeModel = generativeAIClient.getGenerativeModel({
    model: "models/gemini-1.5-pro",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema
    },
  });

  const prompt = `From the following texts, identify any information that should be hidden when publishing the blog. The criteria for hiding information are as follows:
    1. API keys: Long strings containing a mix of letters and numbers.
    2. Email addresses: Strings containing an '@'.
    3. Phone numbers: Formats containing numbers and '-' (e.g., "123-456-7890").
    4. Credit card numbers: 16-digit numbers.
    5. Personal names: Anything that is clearly a name.
    6. Company or service names: Identify items that typically consist of one or several words and may include symbols (e.g., '-', '.') or mixed alphabets. These should be based on context such as specific brands, company names, or project names and not include common words (e.g., 'project', 'dashboard', 'add').
    7. Any strings containing the following should also be considered sensitive information:
      - mii

    Based on the text below, return the information that should be hidden in JSON format.
    Format: { "sensitiveTexts": ["Text to hide 1", "Text to hide 2"] }
    Text context: ${textContext}`;

  try {
    const aiResponse = await generativeModel.generateContent(prompt);
    const responseText = aiResponse.response.text();
    console.log("AI Response:", responseText);

    const { sensitiveTexts } = JSON.parse(responseText);
    console.log("Sensitive Texts to Mask:", sensitiveTexts);

    const image = await loadImage(fileName);
    const canvas = createCanvas(image.width, image.height);
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, image.width, image.height);

    textAnnotations.forEach(annotation => {
      if (sensitiveTexts.includes(annotation.description) && annotation.boundingPoly?.vertices) {
        const vertices = annotation.boundingPoly.vertices;
        context.fillStyle = "red";
        context.beginPath();
        vertices.forEach((vertex, i) => {
          const x = vertex.x ?? 0;
          const y = vertex.y ?? 0;
          if (i === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.closePath();
        context.fill();
      }
    });

    const buffer = canvas.toBuffer("image/png");
    await writeFile("output.png", buffer);
    console.log("Annotated image saved as output.png");
  } catch (error) {
    console.error("Error calling Generative AI API:", error);
  }
}

maskSensitiveText();
