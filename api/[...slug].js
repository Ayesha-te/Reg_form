import handleRequest from "../form_backend/server.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(request, response) {
  return handleRequest(request, response);
}