# Environment Configuration

This project requires certain environment variables to be set for proper operation. Below is a description of the required and optional environment variables used in this project.

## Required Environment Variables

These variables **must** be set for the application to function correctly.

- **`INFISICAL_ADDRESS`**: The address (URL) of the Infisical server. This is where your application will connect to retrieve secrets or configuration settings.
- **`CLIENT_SECRET`**: The secret associated with your client ID. This is used for authentication purposes.
- **`CLIENT_ID`**: The client ID for your application. It is used alongside the client secret for authentication.
- **`INFISICAL_ORG_ID`**: The organization ID in Infisical that the application will be associated with.
- **`DEFAULT_WORKSPACE`**: The default workspace identifier for your project in Infisical.

## Optional Environment Variables

These variables can be set to customize certain aspects of the application's behavior. If not set, default values may be used.

- **`ENV_FILE_PATH`**: The path to the `.env` file. DEFAULT: ./.env.
- **`PLAYWRIGHT_PORT`**: The port number for Playwright, a Node.js library to automate Chromium, Firefox, and WebKit with a single API. DEFAULT: 9223.
- **`API_SERVER_PORT`**: The port number where the API server will listen for requests. DEFAULT: 9999.

## Setting Up

1. Create a `.env` file in the root directory of your project.
2. Add the required and optional environment variables as needed.
3. Run the application using your preferred method (e.g., `npm start`, `python app.py`, etc.).

## Example `.env` File

```dotenv
# Required variables
INFISICAL_ADDRESS=https://infisical.example.com
CLIENT_SECRET=your-client-secret
CLIENT_ID=your-client-id
INFISICAL_ORG_ID=your-org-id
DEFAULT_WORKSPACE=your-workspace

# Optional variables
ENV_FILE_PATH=./.env
PLAYWRIGHT_PORT=9223
API_SERVER_PORT=9999