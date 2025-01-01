# Image Credential Masking Project

This project uses Google Cloud's Vision API and a Generative AI model to detect and mask sensitive text in images. It's intended to enhance privacy by automatically identifying and obscuring personal and sensitive information in images before they are published.

## Setup Instructions

### 1. Clone the Repository

Clone this repository to your local machine using:

```bash
git clone https://github.com/Siddhant-K-code/image-credential-masker.git
cd image-credential-masker
```

### 2. Install Dependencies

Install the required Node.js packages by running:

```bash
npm install
```

### 3. Google Cloud Configuration

- Set up Google Cloud Vision API and obtain the JSON key file.
- Enable the Generative AI model and obtain API access.
- Set the environment variable `GOOGLE_APPLICATION_CREDENTIALS` to the path of your JSON key file:

  ```bash
  export GOOGLE_APPLICATION_CREDENTIALS="path/to/your/google-credentials.json"
  ```

### 4. Set Environment Variables

Create a `.env` file in the root directory of the project and add the following environment variables:

```plaintext
GOOGLE_GENERATIVE_AI=your_generative_ai_access_key
FILE_NAME=path/to/your/image.jpg
```

Replace `your_generative_ai_access_key` with your actual access key for the Generative AI service, and `path/to/your/image.jpg` with the actual path to the image you want to process.

## Running the Application

To run the application, execute the following command in the terminal:

```bash
npx tsc
node dist/index.js
```

This will process the specified image file and generate a new image (`output.png`) with sensitive information masked.

## Output

Check the project directory for `output.png`, which will contain the image with sensitive text masked by red lines.
