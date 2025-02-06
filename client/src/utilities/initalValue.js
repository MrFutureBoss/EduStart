// const BASE_URL = "http://localhost:9999";
const BASE_URL = "https://demo-edustart-be.onrender.com";
const jwt = localStorage.getItem("jwt");

const config = {
  headers: {
    "Content-Type": "application/json",
    authorization: `Bearer ${jwt}`,
  },
};
export { BASE_URL, config };
